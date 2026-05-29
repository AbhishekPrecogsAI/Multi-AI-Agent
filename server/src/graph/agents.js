/**
 * Agent node implementations.
 *
 * Every agent is just an async function `(state) => partialStateUpdate`.
 * The `.withConfig({ tags: ["agent:<name>"] })` call is load-bearing: it
 * tags every LLM event coming out of this node so the SSE layer can route
 * streaming tokens to the right UI panel.
 *
 * If you add a new agent:
 *   1. Add a function here.
 *   2. Add its state slot to `GraphState` in ./state.js.
 *   3. Add its name to `AGENT_NAMES` in ./state.js.
 *   4. Wire it into the graph in ./index.js.
 */

import { llm } from "../llm.js";

export async function plannerAgent(state) {
  const response = await llm
    .withConfig({ tags: ["agent:planner"], runName: "planner" })
    .invoke(`Create a clear, numbered execution plan for the task below.

Task:
${state.userInput}`);

  return { plannerOutput: response.content };
}

export async function researchAgent(state) {
  const response = await llm
    .withConfig({ tags: ["agent:research"], runName: "research" })
    .invoke(`Research the topic below. Return key facts, gotchas, and references.

Topic:
${state.userInput}`);

  return { researchOutput: response.content };
}

export async function coderAgent(state) {
  const response = await llm
    .withConfig({ tags: ["agent:coder"], runName: "coder" })
    .invoke(`Write clean, runnable Node.js code for the task below.
Include short inline comments where the intent isn't obvious.

Task:
${state.userInput}`);

  return { codeOutput: response.content };
}

export async function reviewerAgent(state) {
  const response = await llm
    .withConfig({ tags: ["agent:reviewer"], runName: "reviewer" })
    .invoke(`You are the senior reviewer. Combine the plan, research, and code
into a single high-quality answer. Call out issues and improvements.

PLAN:
${state.plannerOutput}

RESEARCH:
${state.researchOutput}

CODE:
${state.codeOutput}`);

  return { reviewOutput: response.content };
}
