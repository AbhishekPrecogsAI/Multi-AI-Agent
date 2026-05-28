/**
 * Build & compile the multi-agent graph.
 *
 * Shape:
 *
 *        START
 *          │
 *       planner
 *        ╱   ╲
 *   research  coder      (run in parallel)
 *        ╲   ╱
 *       reviewer
 *          │
 *         END
 *
 * Compiled once at module load time — the resulting `graph` object is
 * stateless across runs (state is passed in per-invocation) so it's safe
 * to reuse across concurrent HTTP requests.
 */

import { StateGraph, START, END } from "@langchain/langgraph";

import { GraphState } from "./state.js";
import {
  plannerAgent,
  researchAgent,
  coderAgent,
  reviewerAgent,
} from "./agents.js";

export const graph = new StateGraph({ channels: GraphState })
  .addNode("planner",  plannerAgent)
  .addNode("research", researchAgent)
  .addNode("coder",    coderAgent)
  .addNode("reviewer", reviewerAgent)
  .addEdge(START, "planner")
  .addEdge("planner", "research")
  .addEdge("planner", "coder")
  .addEdge("research", "reviewer")
  .addEdge("coder",    "reviewer")
  .addEdge("reviewer", END)
  .compile();
