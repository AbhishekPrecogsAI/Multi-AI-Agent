/**
 * LLM singleton used by every agent in the graph.
 *
 * `streaming: true` is what unlocks token-level events through
 * `graph.streamEvents()` — without it you only get whole-message chunks
 * and the UI can't render a live typewriter effect.
 */

import { ChatOpenAI } from "@langchain/openai";

export const llm = new ChatOpenAI({
  model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
  temperature: 1,
  streaming: true,
});
