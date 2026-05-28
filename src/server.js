/**
 * Express app factory.
 *
 * Kept separate from the entry point (../index.js) so it can be imported
 * by tests or alternative runners without starting a listener.
 */

import express from "express";
import cors from "cors";

import agentsRouter from "./routes/agents.js";

export function createApp() {
  const app = express();

  // Allow the Vite dev server (and prod origin) to talk to us. `origin: true`
  // reflects the request origin instead of using a wildcard, which is required
  // when `credentials: true` is set.
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  // Liveness probe — for Docker/K8s health checks and for the UI to confirm
  // the API is reachable before opening an SSE stream.
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
  });

  app.use("/api/agents", agentsRouter);

  return app;
}
