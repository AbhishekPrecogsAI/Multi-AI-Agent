import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock";

/**
 * AgentConsole — single card holding all four agent transcripts behind a
 * tab strip. Replaces the previous four-plate layout.
 *
 * - The active-tab indicator is an absolutely positioned underline that
 *   smoothly translates to whichever tab is active (measured via refs).
 * - When an agent transitions idle → running, we auto-switch to that tab
 *   UNLESS the user has manually picked a tab during this run.
 * - The content area animates a fade+slide on each tab change.
 * - Markdown rendering routes fenced code blocks through CodeBlock for
 *   proper Prism syntax highlighting.
 */

const TABS = [
  { id: "planner",  n: "01", title: "Planner" },
  { id: "research", n: "02", title: "Research" },
  { id: "coder",    n: "03", title: "Coder" },
  { id: "reviewer", n: "04", title: "Reviewer" },
];

const markdownComponents = { code: CodeBlock };

export default function AgentConsole({ agents, runId }) {
  const [active, setActive]       = useState("planner");
  const [userPicked, setUserPick] = useState(false);

  // New run → reset auto-switch behaviour. Tied to runId so a fresh
  // dispatch starts following whichever agent fires first again.
  useEffect(() => {
    setUserPick(false);
    setActive("planner");
  }, [runId]);

  // Auto-follow: jump to the most recently activated agent unless the user
  // already picked one this run.
  useEffect(() => {
    if (userPicked) return;
    const running = TABS.find((t) => agents[t.id]?.status === "running");
    if (running && running.id !== active) setActive(running.id);
  }, [agents, userPicked, active]);

  // Slide-underline geometry — measured from the tab buttons.
  const stripRef       = useRef(null);
  const tabRefs        = useRef({});
  const [underline, setUnderline] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const el = tabRefs.current[active];
    const strip = stripRef.current;
    if (!el || !strip) return;
    const elRect    = el.getBoundingClientRect();
    const stripRect = strip.getBoundingClientRect();
    setUnderline({ left: elRect.left - stripRect.left, width: elRect.width });
  }, [active]);

  // Re-measure on window resize so the underline stays aligned.
  useEffect(() => {
    const onResize = () => {
      const el = tabRefs.current[active];
      const strip = stripRef.current;
      if (!el || !strip) return;
      const elRect    = el.getBoundingClientRect();
      const stripRect = strip.getBoundingClientRect();
      setUnderline({ left: elRect.left - stripRect.left, width: elRect.width });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  const activeAgent  = agents[active];
  const someoneLive  = TABS.some((t) => agents[t.id]?.status === "running");
  const allDone      = TABS.every((t) => agents[t.id]?.status === "done");

  const cardClass =
    "card relative overflow-hidden" +
    (someoneLive ? " card-live" : allDone ? " card-done" : "");

  return (
    <article className={cardClass}>
      <header className="px-5 pt-4 pb-2 flex items-center justify-between">
        <span className="kicker">§ Transcripts</span>
        <span className="kicker text-fg-dim">live · verbatim · unedited</span>
      </header>

      {/* Tab strip */}
      <div
        ref={stripRef}
        role="tablist"
        className="relative flex items-end gap-1 px-3 border-b border-border overflow-x-auto"
      >
        {TABS.map((t) => (
          <TabButton
            key={t.id}
            ref={(el) => (tabRefs.current[t.id] = el)}
            tab={t}
            agent={agents[t.id]}
            active={active === t.id}
            onClick={() => { setActive(t.id); setUserPick(true); }}
          />
        ))}
        <span
          aria-hidden
          className="absolute bottom-[-1px] h-[2px] bg-lime"
          style={{
            left: underline.left,
            width: underline.width,
            transition: "left 0.42s cubic-bezier(0.4, 0.0, 0.2, 1), width 0.42s cubic-bezier(0.4, 0.0, 0.2, 1)",
            boxShadow: "0 0 12px var(--color-lime)",
          }}
        />
      </div>

      {/* Content panel */}
      <div className="relative min-h-[260px] max-h-[560px] overflow-y-auto">
        <TabPanel key={active} agent={activeAgent} />
      </div>

      <footer className="flex items-center justify-between px-5 pb-3 pt-2 border-t border-border/60 text-[0.7rem] font-mono text-fg-dim">
        <span>
          {tokenCount(textFor(activeAgent))} tk · {duration(activeAgent)}
        </span>
        <span>
          {TABS.filter((t) => agents[t.id].status === "done").length}/{TABS.length} settled
        </span>
      </footer>
    </article>
  );
}

/* ─── Tab button ─────────────────────────────────────────────────────── */

const TabButton = forwardRef(function TabButton({ tab, agent, active, onClick }, ref) {
  const status = agent?.status ?? "idle";

  return (
    <button
      ref={ref}
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "relative flex items-center gap-2 px-3.5 py-3 whitespace-nowrap " +
        "font-display text-[0.92rem] transition-colors duration-200 " +
        (active ? "text-fg" : "text-fg-muted hover:text-fg")
      }
      style={{ fontVariationSettings: '"opsz" 72, "wght" 600' }}
    >
      <span className="font-mono text-[0.66rem] tracking-[0.18em] text-fg-dim">
        {tab.n}
      </span>
      <span>{tab.title}</span>
      <StatusGlyph status={status} />
    </button>
  );
});

function StatusGlyph({ status }) {
  if (status === "running") {
    return <span className="dot-live" style={{ width: "0.45rem", height: "0.45rem" }} />;
  }
  if (status === "done") {
    return (
      <svg width="11" height="11" viewBox="0 0 11 11" className="text-mint">
        <path d="M 1.5 5.5 L 4.4 8.2 L 9.6 2.6" fill="none" stroke="currentColor"
              strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return <span className="w-1.5 h-1.5 rounded-full border border-border-bright" />;
}

/* ─── Tab content panel ──────────────────────────────────────────────── */

function TabPanel({ agent }) {
  const bodyRef = useRef(null);
  const running = agent.status === "running";
  const done    = agent.status === "done";
  const text    = textFor(agent);

  // Auto-scroll while streaming (only if near bottom).
  useEffect(() => {
    const el = bodyRef.current;
    if (!el || !running) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [agent.tokens, running]);

  return (
    <div
      ref={bodyRef}
      className="fade-in-tab px-5 py-5"
    >
      {!text && agent.status === "idle" && (
        <p className="font-mono text-[0.78rem] text-fg-dim">
          ⟢ awaiting dispatch
        </p>
      )}
      {!text && running && (
        <p className="font-mono text-[0.78rem] text-fg-muted">
          ⟢ opening channel<span className="cursor" />
        </p>
      )}

      {text && !done && (
        <div className="transcript">
          {text}
          <span className="cursor" />
        </div>
      )}

      {text && done && (
        <div className="prose-dark">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {text}
          </ReactMarkdown>
        </div>
      )}

      <style>{`
        .fade-in-tab { animation: fade-in-tab 0.36s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes fade-in-tab {
          from { opacity: 0; transform: translateY(6px); filter: blur(4px); }
          to   { opacity: 1; transform: none;            filter: none; }
        }
      `}</style>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

function textFor(agent) {
  return agent.status === "done" ? agent.output : agent.tokens;
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
