import { useAgentRun } from "./lib/useAgentRun";
import Masthead     from "./components/Masthead";
import PromptField  from "./components/PromptField";
import Topology     from "./components/Topology";
import AgentConsole from "./components/AgentConsole";
import ReviewLetter from "./components/ReviewLetter";

/**
 * App shell.
 *
 *   ┌──────────────── masthead + status ───────────────┐
 *   │                  prompt field                    │
 *   ├────────────────┬─────────────────────────────────┤
 *   │   topology     │ ┌─ tabs ─────────────────────┐  │
 *   │   (sticky)     │ │ planner research coder rev │  │
 *   │   telemetry    │ │ ──────                     │  │
 *   │                │ │ (live transcript / md)     │  │
 *   │                │ └────────────────────────────┘  │
 *   ├────────────────┴─────────────────────────────────┤
 *   │            reviewer's verdict (unfolds)          │
 *   └──────────────────────────────────────────────────┘
 */

export default function App() {
  const run = useAgentRun();

  return (
    <div className="min-h-screen px-6 md:px-10 lg:px-14 py-10">
      <div className="mx-auto max-w-[1320px]">
        <Masthead
          status={run.status}
          runId={run.runId}
          elapsed={run.elapsed}
          error={run.error}
        />

        <section className="mt-10">
          <PromptField
            status={run.status}
            onStart={run.start}
            onStop={run.stop}
            onReset={run.reset}
          />
        </section>

        <section className="mt-12 grid grid-cols-1 lg:grid-cols-[minmax(320px,420px)_1fr] gap-8">
          <div className="lg:sticky lg:top-6 lg:self-start fade-up" style={{ animationDelay: "0.3s" }}>
            <Topology agents={run.agents} />
            <Telemetry agents={run.agents} />
          </div>

          <div className="fade-up" style={{ animationDelay: "0.4s" }}>
            <AgentConsole agents={run.agents} runId={run.runId} />
          </div>
        </section>

        <ReviewLetter reviewer={run.agents.reviewer} />

        <Footer />
      </div>
    </div>
  );
}

function Telemetry({ agents }) {
  const total = Object.values(agents).reduce(
    (a, x) => a + (x.tokens?.length || x.output?.length || 0),
    0,
  );

  const counts = {
    idle:    Object.values(agents).filter((a) => a.status === "idle").length,
    running: Object.values(agents).filter((a) => a.status === "running").length,
    done:    Object.values(agents).filter((a) => a.status === "done").length,
  };

  return (
    <aside className="card mt-5 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="kicker">Telemetry</span>
        <span className="font-mono text-[0.72rem] text-fg-muted tabular">
          {total.toLocaleString()} ch
        </span>
      </div>
      <ul className="grid grid-cols-3 gap-2 text-center">
        <Stat label="idle"    value={counts.idle}    tone="idle" />
        <Stat label="active"  value={counts.running} tone="live" />
        <Stat label="settled" value={counts.done}    tone="done" />
      </ul>
    </aside>
  );
}

function Stat({ label, value, tone }) {
  const cls =
    tone === "live" ? "text-lime"
    : tone === "done" ? "text-mint"
                       : "text-fg-muted";
  return (
    <li className="border border-border rounded-lg py-2.5 px-2 bg-surface/40">
      <div className={`display text-[1.5rem] leading-none tabular ${cls}`}
           style={{ fontVariationSettings: '"opsz" 72, "wght" 600' }}>
        {value}
      </div>
      <div className="kicker mt-1.5">{label}</div>
    </li>
  );
}

function Footer() {
  return (
    <footer className="mt-20 pb-10">
      <div className="h-px bg-border" />
      <div className="flex flex-col md:flex-row items-baseline justify-between gap-3 pt-4">
        <p className="text-[0.82rem] text-fg-muted">
          Set in{" "}
          <span className="font-display text-fg" style={{ fontVariationSettings: '"opsz" 96, "wght" 600' }}>Bricolage Grotesque</span>{" "}
          ·{" "}
          <span className="font-body text-fg">Geist</span>{" "}
          ·{" "}
          <span className="font-mono text-fg">JetBrains Mono</span>.
        </p>
        <p className="kicker">Local build · §</p>
      </div>
    </footer>
  );
}
