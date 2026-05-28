/**
 * Agent routes — the SSE-streaming entry point the UI talks to.
 *
 * Endpoint:
 *   POST /api/agents/run
 *   body: { "userInput": "..." }
 *
 * Response: text/event-stream with these named events:
 *
 *   connected       { runId, ts }                — handshake, sent once
 *   agent:start     { agent, runId, ts }         — a node started executing
 *   agent:token     { agent, token, runId }      — single LLM token
 *   agent:complete  { agent, output, runId, ts } — a node finished
 *   state           { state, runId }             — final merged graph state
 *   done            { runId, ts }                — stream is closing cleanly
 *   error           { runId, message }           — something blew up
 *
 * The UI keys per-agent panels off `agent` and appends tokens as they arrive.
 */

import { Router } from "express";
import { randomUUID } from "node:crypto";

import { graph } from "../graph/index.js";
import { AGENT_NAMES } from "../graph/state.js";
import { openSseStream, sendSse, startHeartbeat } from "../sse.js";

const router = Router();

/**
 * Drive the LangGraph pipeline and forward interesting events as SSE.
 *
 * We use the native `graph.stream()` with combined streamMode
 * `["updates", "messages"]` — this is the supported streaming path in
 * LangGraph 1.x. Each yielded value is a `[mode, payload]` tuple:
 *
 *   ["updates",  { <nodeName>: <partialState> }]   — fires when a node finishes
 *   ["messages", [<AIMessageChunk>, <metadata>]]   — fires per LLM token
 *
 * The messages-mode metadata includes `langgraph_node`, which tells us
 * exactly which agent produced each token — no tag-sniffing required.
 *
 * We synthesize `agent:start` on the first token we see for a given node,
 * since native streamMode doesn't expose node-start events directly.
 */
async function runGraphWithSse(res, { userInput, runId, abortSignal }) {
  const started = new Set();

  // Final merged state accumulated from each `updates` payload — the
  // pipeline-as-a-whole "state" event sent at the end of the run.
  const finalState = {};

  console.log(`[run ${runId}] opening graph.stream...`);
  const stream = await graph.stream(
    { userInput },
    {
      streamMode: ["updates", "messages"],
      signal: abortSignal,
      configurable: { thread_id: runId },
    },
  );
  console.log(`[run ${runId}] stream opened, entering for-await...`);

  let yielded = 0;
  for await (const [mode, payload] of stream) {
    yielded++;
    console.log(`[run ${runId}] yield #${yielded} mode=${mode}`);
    if (abortSignal.aborted) break;

    if (mode === "messages") {
      const [chunk, meta] = payload;
      const agent = meta?.langgraph_node;
      if (!agent || !AGENT_NAMES.includes(agent)) continue;

      // First token from this agent → announce its start.
      if (!started.has(agent)) {
        started.add(agent);
        sendSse(res, "agent:start", { agent, runId, ts: Date.now() });
      }

      // `chunk.content` is usually a string, but reasoning-capable models can
      // return an array of typed content blocks — extract text from either.
      const token = extractText(chunk?.content);
      if (token) {
        sendSse(res, "agent:token", { agent, token, runId });
      }
    } else if (mode === "updates") {
      // One key per node that just finished this step. With our parallel
      // fan-out (research || coder), both can show up in a single update.
      for (const [node, output] of Object.entries(payload)) {
        if (!AGENT_NAMES.includes(node)) continue;
        Object.assign(finalState, output);
        sendSse(res, "agent:complete", {
          agent: node,
          output,
          runId,
          ts: Date.now(),
        });
      }
    }
  }

  console.log(`[run ${runId}] for-await exited cleanly, yielded=${yielded}`);
  sendSse(res, "state", { state: finalState, runId });
}

/** Pull plain text out of a string OR an array of content blocks. */
function extractText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((b) => (typeof b === "string" ? b : b?.text ?? ""))
      .join("");
  }
  return "";
}

router.post("/run", async (req, res) => {
  const userInput = String(req.body?.userInput ?? "").trim();
  if (!userInput) {
    return res.status(400).json({ error: "userInput is required" });
  }

  const runId = randomUUID();

  openSseStream(res);
  const stopHeartbeat = startHeartbeat(res);
  sendSse(res, "connected", { runId, ts: Date.now() });

  // Bridge client-disconnect -> LangGraph cancellation. If the user closes
  // the tab or hits a Stop button, we tear down the in-flight LLM calls
  // instead of letting them burn tokens to /dev/null.
  //
  // IMPORTANT: listen on `res`, not `req`. In modern Node, `req`'s "close"
  // event fires when the *request body* finishes being read — which is
  // immediate for a small JSON POST — and would abort the controller
  // before the graph ever runs. `res`'s "close" fires only when the actual
  // socket disconnects.
  const abort = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) abort.abort();
  });

  // TEMP DIAG — remove once root cause is found.
  console.log(`[run ${runId}] starting, input=${JSON.stringify(userInput)}`);

  try {
    await runGraphWithSse(res, { userInput, runId, abortSignal: abort.signal });
    console.log(`[run ${runId}] graph finished cleanly`);
    sendSse(res, "done", { runId, ts: Date.now() });
  } catch (err) {
    console.error(`[run ${runId}] CAUGHT ${err?.name ?? "Error"}:`, err?.message ?? err);
    console.error(err?.stack);
    sendSse(res, "error", {
      runId,
      name: err?.name,
      message: err?.message ?? "Unknown error",
    });
  } finally {
    console.log(`[run ${runId}] finally; aborted=${abort.signal.aborted}`);
    stopHeartbeat();
    if (!res.writableEnded) res.end();
  }
});

export default router;
