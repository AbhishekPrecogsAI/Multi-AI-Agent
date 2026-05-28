/**
 * Masthead — title block + live run telemetry.
 *
 * Title uses Bricolage Grotesque at opsz 96 with one word italicised in
 * the accent lime. Right side carries a glass status card with an animated
 * gradient border that lights up while a run is in flight.
 */

export default function Masthead({ status, runId, elapsed, error }) {
  return (
    <header className="fade-up flex flex-col md:flex-row md:items-end md:justify-between gap-6">
      <div>
        <p className="kicker mb-3 flex items-center gap-2">
          <Glyph />
          <span>Live Agent Console / Build 2026.05</span>
        </p>
        <h1
          className="display leading-[0.92] text-fg"
          style={{
            fontSize: "clamp(2.6rem, 6.5vw, 5.2rem)",
            fontVariationSettings: '"opsz" 96, "wght" 600',
          }}
        >
          Atelier{" "}
          <span
            className="italic text-lime"
            style={{
              fontFamily: "var(--font-display)",
              fontVariationSettings: '"opsz" 96, "wght" 400',
              textShadow: "0 0 30px color-mix(in oklab, var(--color-lime) 60%, transparent)",
            }}
          >
            of
          </span>{" "}
          Agents
        </h1>
        <p className="mt-3 text-fg-muted max-w-[52ch] leading-relaxed">
          Four cooperating models, observed mid-thought. Watch them plan, research,
          author, and reconcile — token by token.
        </p>
      </div>

      <StatusCard status={status} runId={runId} elapsed={elapsed} error={error} />
    </header>
  );
}

function StatusCard({ status, runId, elapsed, error }) {
  const ms  = Math.max(0, elapsed);
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const dec = Math.floor((ms % 1000) / 100);
  const clock = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${dec}`;

  const live = status === "running" || status === "connecting";

  const label =
    status === "idle"       ? "standby"
    : status === "connecting" ? "linking"
    : status === "running"  ? "observing"
    : status === "done"     ? "settled"
                            : "halted";

  return (
    <div className={`card ${live ? "card-live" : ""} ${status === "error" ? "card-error" : ""} min-w-[260px] p-4`}>
      <div className="flex items-center justify-between">
        <span className="kicker">Status</span>
        <span
          className={
            "pill " +
            (status === "running" || status === "connecting" ? "pill-live"
             : status === "done"   ? "pill-done"
             : status === "error"  ? "pill-error"
                                   : "pill-idle")
          }
        >
          {(status === "running" || status === "connecting") && <span className="dot-live" />}
          {label}
        </span>
      </div>

      <div className="display tabular text-[2.1rem] leading-none mt-3 text-fg"
           style={{ fontVariationSettings: '"opsz" 96, "wght" 500' }}>
        {clock}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="kicker">Run</span>
        <span className="font-mono text-[0.72rem] text-fg-muted">
          {runId ? runId.slice(0, 8) : "—"}
        </span>
      </div>

      {error && (
        <p className="mt-3 font-mono text-[0.72rem] text-coral leading-snug">
          ✕ {error}
        </p>
      )}
    </div>
  );
}

function Glyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="text-lime">
      <circle cx="7" cy="7" r="2.4" fill="currentColor" />
      <circle cx="7" cy="7" r="6"   fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.55" />
    </svg>
  );
}
