import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * AgentPlate — one glass card per agent.
 *
 * Status drives the card class:
 *   idle    → plain card
 *   running → card + animated conic-gradient border ("card-live")
 *   done    → card + mint accent border ("card-done")
 *
 * Body shows a streaming mono transcript while running, then switches
 * to formatted markdown once the agent emits its final output.
 */

const AGENT_META = {
  planner:  { n: "01", title: "Planner",  blurb: "Decomposes the task" },
  research: { n: "02", title: "Research", blurb: "Surveys the territory" },
  coder:    { n: "03", title: "Coder",    blurb: "Authors the artefact" },
  reviewer: { n: "04", title: "Reviewer", blurb: "Reconciles the findings" },
};

export default function AgentPlate({ id, agent }) {
  const meta = AGENT_META[id];
  const bodyRef = useRef(null);
  const running = agent.status === "running";
  const done    = agent.status === "done";

  const displayText = done ? agent.output : agent.tokens;

  // Auto-scroll while streaming, only if the user is near the bottom.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el || !running) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [agent.tokens, running]);

  const cardClass =
    "card relative overflow-hidden" +
    (running ? " card-live"
     : done   ? " card-done"
              : "");

  return (
    <article className={cardClass}>
      <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[0.78rem] text-fg-dim tracking-[0.18em]">{meta.n}</span>
          <div>
            <h2
              className="display text-[1.45rem] leading-none text-fg"
              style={{ fontVariationSettings: '"opsz" 72, "wght" 600' }}
            >
              {meta.title}
            </h2>
            <p className="text-[0.82rem] text-fg-muted mt-1">{meta.blurb}</p>
          </div>
        </div>
        <StatusPill status={agent.status} />
      </header>

      <div className="mx-5 h-px bg-border" />

      <div
        ref={bodyRef}
        className="px-5 py-4 min-h-[170px] max-h-[420px] overflow-y-auto"
      >
        {!displayText && agent.status === "idle" && (
          <p className="font-mono text-[0.78rem] text-fg-dim">
            ⟢ awaiting dispatch
          </p>
        )}
        {!displayText && running && (
          <p className="font-mono text-[0.78rem] text-fg-muted">
            ⟢ opening channel<span className="cursor" />
          </p>
        )}

        {displayText && !done && (
          <div className="transcript">
            {displayText}
            <span className="cursor" />
          </div>
        )}

        {displayText && done && (
          <div className="prose-dark">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayText}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between px-5 pb-3 pt-1 text-[0.7rem] text-fg-dim font-mono">
        <span>{tokenCount(displayText)} tk</span>
        <span>{duration(agent)}</span>
      </footer>
    </article>
  );
}

function StatusPill({ status }) {
  if (status === "running") {
    return (
      <span className="pill pill-live">
        <span className="dot-live" style={{ background: "currentColor" }} />
        active
      </span>
    );
  }
  if (status === "done") {
    return <span className="pill pill-done">✓ settled</span>;
  }
  return <span className="pill pill-idle">idle</span>;
}

function tokenCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function duration(agent) {
  if (!agent.startedAt) return "—";
  const end = agent.finishedAt ?? Date.now();
  const s = ((end - agent.startedAt) / 1000).toFixed(1);
  return `${s}s`;
}
