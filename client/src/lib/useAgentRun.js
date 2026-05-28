import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Consumes the server's SSE stream and exposes per-agent reactive state.
 *
 * SSE event contract (matches src/routes/agents.js on the server):
 *   connected       { runId, ts }
 *   agent:start     { agent, runId, ts }
 *   agent:token     { agent, token, runId }
 *   agent:complete  { agent, output, runId, ts }
 *   state           { state, runId }
 *   done            { runId, ts }
 *   error           { runId, name?, message }
 *
 * We use `fetch()` + ReadableStream (not EventSource) because the run is a
 * POST with a JSON body — EventSource only supports GET.
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8787";
const AGENT_NAMES = ["planner", "research", "coder", "reviewer"];

const initialAgentState = () =>
  Object.fromEntries(
    AGENT_NAMES.map((a) => [a, { status: "idle", tokens: "", output: "", startedAt: null, finishedAt: null }]),
  );

export function useAgentRun() {
  const [status, setStatus]   = useState("idle"); // idle | connecting | running | done | error
  const [agents, setAgents]   = useState(initialAgentState);
  const [runId, setRunId]     = useState(null);
  const [error, setError]     = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const abortRef  = useRef(null);
  const timerRef  = useRef(null);
  const startTs   = useRef(0);

  // Keep the elapsed clock running while the stream is open. Update at 10Hz —
  // visually smooth but cheap.
  useEffect(() => {
    if (status === "connecting" || status === "running") {
      startTs.current = performance.now();
      timerRef.current = setInterval(() => {
        setElapsed(performance.now() - startTs.current);
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [status]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
    setAgents(initialAgentState());
    setRunId(null);
    setError(null);
    setElapsed(0);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const start = useCallback(async (userInput) => {
    if (!userInput?.trim()) return;
    abortRef.current?.abort();

    setStatus("connecting");
    setAgents(initialAgentState());
    setRunId(null);
    setError(null);
    setElapsed(0);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/api/agents/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      setStatus("running");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Standard SSE framing: events are separated by a blank line. Inside
      // each event, lines starting with `event:` and `data:` carry the payload.
      // Lines starting with `:` are comments (we use those as heartbeats).
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sep;
        while ((sep = buffer.indexOf("\n\n")) >= 0) {
          const frame = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          handleSseFrame(frame);
        }
      }

      // If the server closed the stream cleanly without sending `error`,
      // treat it as a successful finish.
      setStatus((s) => (s === "error" ? s : "done"));
    } catch (e) {
      if (e.name !== "AbortError") {
        setError(e.message ?? "Unknown error");
        setStatus("error");
      }
    }
  }, []);

  // Parse a single SSE frame and apply its effect to local state.
  function handleSseFrame(frame) {
    let event = "message";
    let dataLines = [];
    for (const line of frame.split("\n")) {
      if (!line || line.startsWith(":")) continue;
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    if (!dataLines.length) return;

    let payload;
    try {
      payload = JSON.parse(dataLines.join("\n"));
    } catch {
      return; // malformed frame — skip
    }

    switch (event) {
      case "connected":
        setRunId(payload.runId);
        break;

      case "agent:start":
        setAgents((prev) => ({
          ...prev,
          [payload.agent]: {
            ...prev[payload.agent],
            status: "running",
            startedAt: payload.ts,
          },
        }));
        break;

      case "agent:token":
        setAgents((prev) => ({
          ...prev,
          [payload.agent]: {
            ...prev[payload.agent],
            tokens: prev[payload.agent].tokens + payload.token,
          },
        }));
        break;

      case "agent:complete":
        setAgents((prev) => {
          // The server emits `output` as the partial state diff —
          // e.g. { plannerOutput: "..." }. Pull whichever key matches.
          const key = `${payload.agent}Output`;
          const finalText = payload.output?.[key] ?? prev[payload.agent].tokens;
          return {
            ...prev,
            [payload.agent]: {
              ...prev[payload.agent],
              status: "done",
              output: finalText,
              finishedAt: payload.ts,
            },
          };
        });
        break;

      case "error":
        setError(payload.message ?? "stream error");
        setStatus("error");
        break;
    }
  }

  return { status, agents, runId, error, elapsed, start, stop, reset };
}
