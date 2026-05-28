/**
 * Entry point.
 *
 * Boots the Express app and wires up graceful shutdown. All real logic lives
 * under ./src:
 *
 *   src/llm.js              — shared LLM instance (streaming enabled)
 *   src/graph/state.js      — graph channel definitions + AGENT_NAMES
 *   src/graph/agents.js     — planner / research / coder / reviewer
 *   src/graph/index.js      — compiled LangGraph pipeline
 *   src/sse.js              — SSE framing helpers + heartbeat
 *   src/routes/agents.js    — POST /api/agents/run (SSE stream)
 *   src/server.js           — Express app factory
 */

import "dotenv/config";

import { createApp } from "./src/server.js";

const PORT = Number(process.env.PORT ?? 8787);
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`Multi-agent API listening on http://localhost:${PORT}`);
  console.log(`  Health:  GET  /api/health`);
  console.log(`  Run:     POST /api/agents/run   { "userInput": "..." }`);
});

// Graceful shutdown so in-flight SSE streams can drain instead of being cut
// off mid-token when the process receives SIGTERM (e.g. from `docker stop`
// or a deploy). Force-exits after 10s if a client refuses to close.
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    console.log(`\n${sig} received, shutting down...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
