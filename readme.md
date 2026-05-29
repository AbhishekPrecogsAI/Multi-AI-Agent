# Multi-AI-Agent

A multi-agent system built on **LangGraph** that decomposes a single prompt into a coordinated pipeline of specialized agents — **planner**, **research**, **coder**, and **reviewer** — and streams their reasoning to a React UI token-by-token over Server-Sent Events (SSE).

The planner kicks things off, research and coder run **in parallel**, and the reviewer fans them back in to produce a single, polished answer.

```
        START
          │
       planner
        ╱   ╲
   research  coder      (run in parallel)
        ╲   ╱
       reviewer
          │
         END
```

## Features

- **Multi-agent orchestration** with LangGraph — fan-out / fan-in over a shared, reducer-based graph state.
- **Live token streaming** — every agent's output renders as a typewriter effect via SSE (`agent:start`, `agent:token`, `agent:complete`).
- **Parallel execution** — research and coding happen concurrently, then merge.
- **Clean cancellation** — closing the tab aborts in-flight LLM calls instead of burning tokens.
- **React + Tailwind UI** — per-agent console panels, a live topology view, and a final reviewer verdict.

## Tech Stack

| Layer    | Tools                                                        |
| -------- | ----------------------------------------------------------- |
| Backend  | Node.js, Express 5, LangGraph, LangChain (OpenAI), Zod      |
| Frontend | React 18, Vite, Tailwind CSS, React Router, React Markdown  |
| Transport| Server-Sent Events (SSE)                                    |

## Prerequisites

- Node.js 18+
- An OpenAI API key

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/AbhishekPrecogsAI/Multi-AI-Agent.git
cd Multi-AI-Agent
```

### 2. Start the server

```bash
cd server
npm install
cp .env.example .env   # then add your OpenAI API key
npm run dev
```

The API listens on **http://localhost:8787**.

### 3. Start the client

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## Environment Variables

Create `server/.env` based on `server/.env.example`:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
PORT=8787
```

## API

### `POST /api/agents/run`

Runs the agent pipeline and streams results as `text/event-stream`.

**Request body**

```json
{ "userInput": "Build a rate limiter in Node.js" }
```

**SSE events**

| Event            | Payload                              | Description                     |
| ---------------- | ------------------------------------ | ------------------------------- |
| `connected`      | `{ runId, ts }`                      | Handshake, sent once            |
| `agent:start`    | `{ agent, runId, ts }`               | A node started executing        |
| `agent:token`    | `{ agent, token, runId }`            | A single streamed LLM token     |
| `agent:complete` | `{ agent, output, runId, ts }`       | A node finished                 |
| `state`          | `{ state, runId }`                   | Final merged graph state        |
| `done`           | `{ runId, ts }`                      | Stream closing cleanly          |
| `error`          | `{ runId, message }`                 | An error occurred               |

### `GET /api/health`

Liveness probe — returns `{ ok: true, ts }`.

## Project Structure

```
.
├── client/                  # React + Vite frontend
│   └── src/
│       ├── components/       # Topology, AgentConsole, PromptField, ...
│       ├── pages/            # Home, About
│       └── lib/useAgentRun.js
└── server/                  # Express + LangGraph backend
    ├── index.js              # Entry point
    └── src/
        ├── server.js         # Express app factory
        ├── llm.js            # Shared streaming LLM instance
        ├── sse.js            # SSE framing + heartbeat
        ├── routes/agents.js  # POST /api/agents/run
        └── graph/            # state.js, agents.js, index.js (pipeline)
```

## Extending the Pipeline

To add a new agent:

1. Add its async node function in `server/src/graph/agents.js`.
2. Add its state slot to `GraphState` in `server/src/graph/state.js`.
3. Add its name to `AGENT_NAMES` in the same file.
4. Wire it into the graph in `server/src/graph/index.js`.

## License

ISC
