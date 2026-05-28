import "dotenv/config";

import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

// -------------------------------------
// LLM
// -------------------------------------

const llm = new ChatOpenAI({
  model: "gpt-5-mini",
  temperature: 1,
});

// -------------------------------------
// Shared State
// -------------------------------------

const GraphState = {
  userInput: {
    value: (x, y) => y ?? x,
    default: () => "",
  },

  plannerOutput: {
    value: (x, y) => y ?? x,
    default: () => "",
  },

  researchOutput: {
    value: (x, y) => y ?? x,
    default: () => "",
  },

  codeOutput: {
    value: (x, y) => y ?? x,
    default: () => "",
  },

  reviewOutput: {
    value: (x, y) => y ?? x,
    default: () => "",
  },
};

// -------------------------------------
// Planner Agent
// -------------------------------------

async function plannerAgent(state) {
  console.log("\n🟢 Planner Agent Running...\n");

  const response = await llm.invoke(`
    Create execution plan for:
    ${state.userInput}
  `);

  return {
    plannerOutput: response.content,
  };
}

// -------------------------------------
// Research Agent
// -------------------------------------

async function researchAgent(state) {
  console.log("\n🟡 Research Agent Running...\n");

  const response = await llm.invoke(`
    Research this topic:
    ${state.userInput}
  `);

  return {
    researchOutput: response.content,
  };
}

// -------------------------------------
// Coder Agent
// -------------------------------------

async function coderAgent(state) {
  console.log("\n🔵 Coder Agent Running...\n");

  const response = await llm.invoke(`
    Write simple Node.js code for:
    ${state.userInput}
  `);

  return {
    codeOutput: response.content,
  };
}

// -------------------------------------
// Reviewer Agent
// -------------------------------------

async function reviewerAgent(state) {
  console.log("\n🟣 Reviewer Agent Running...\n");

  const response = await llm.invoke(`
    Review this:

    PLAN:
    ${state.plannerOutput}

    RESEARCH:
    ${state.researchOutput}

    CODE:
    ${state.codeOutput}
  `);

  return {
    reviewOutput: response.content,
  };
}

// -------------------------------------
// Build Graph
// -------------------------------------

const graph = new StateGraph({
  channels: GraphState,
})

  // Nodes
  .addNode("planner", plannerAgent)
  .addNode("research", researchAgent)
  .addNode("coder", coderAgent)
  .addNode("reviewer", reviewerAgent)

  // Start
  .addEdge(START, "planner")

  // Parallel Execution
  .addEdge("planner", "research")
  .addEdge("planner", "coder")

  // Merge
  .addEdge("research", "reviewer")
  .addEdge("coder", "reviewer")

  // End
  .addEdge("reviewer", END)

  .compile();

// -------------------------------------
// Run Graph
// -------------------------------------

const result = await graph.invoke({
  userInput: "what is 2+2 and write code for it",
});

console.log("\n========================");
console.log("FINAL OUTPUT");
console.log("========================\n");

console.log(result.reviewOutput);