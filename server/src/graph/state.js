/**
 * Shared graph state.
 *
 * Each channel is a reducer: `value(prev, next)` decides how an update merges
 * into existing state. `(x, y) => y ?? x` means "last writer wins, but keep
 * the previous value if the new one is null/undefined" — exactly what we want
 * for a fan-out/fan-in pipeline where each agent writes to its own slot.
 *
 * AGENT_NAMES is the canonical list of agent nodes; the SSE layer uses it to
 * decide which `on_chain_start`/`on_chain_end` events to surface to the UI.
 */

export const AGENT_NAMES = ["planner", "research", "coder", "reviewer"];

export const GraphState = {
  userInput:      { value: (x, y) => y ?? x, default: () => "" },
  plannerOutput:  { value: (x, y) => y ?? x, default: () => "" },
  researchOutput: { value: (x, y) => y ?? x, default: () => "" },
  codeOutput:     { value: (x, y) => y ?? x, default: () => "" },
  reviewOutput:   { value: (x, y) => y ?? x, default: () => "" },
};
