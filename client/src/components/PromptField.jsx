import { useEffect, useRef, useState } from "react";

/**
 * PromptField — the user's input. Glass card with a glowing accent button.
 *
 * - Autosizes the textarea up to a max height
 * - ⌘↵ / Ctrl+↵ dispatches
 * - Sample chips below for quick experimentation
 * - Single primary button swaps shape between Dispatch / Halt / Anew
 */

const SAMPLES = [
  "Explain why Promises in JavaScript are not just callbacks in disguise. Include code.",
  "Design a rate-limiter for a public API in Node. Compare token-bucket vs sliding-window.",
  "Build a small CLI in Node that tails a JSON-lines log and pretty-prints it.",
  "What is 2+2, and write the code for it.",
];

export default function PromptField({ status, onStart, onStop, onReset, defaultValue }) {
  const [value, setValue] = useState(defaultValue ?? SAMPLES[0]);
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, [value]);

  const running  = status === "running" || status === "connecting";
  const finished = status === "done" || status === "error";

  const submit = (e) => {
    e?.preventDefault?.();
    if (running) return;
    if (finished) onReset();
    onStart(value);
  };

  return (
    <form onSubmit={submit} className="fade-up" style={{ animationDelay: "0.15s" }}>
      <div className="flex items-baseline justify-between mb-2">
        <span className="kicker">§ Prompt</span>
        <span className="kicker text-fg-dim">⌘↵ to dispatch</span>
      </div>

      <div className={`card p-1.5 ${running ? "card-live" : ""}`}>
        <div className="grid grid-cols-[1fr_auto] gap-3 items-stretch p-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={running}
            rows={2}
            placeholder="Pose a question for the cooperative…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e);
            }}
            className="w-full bg-transparent resize-none outline-none
                       font-body text-[1.05rem] leading-snug text-fg
                       placeholder:text-fg-dim disabled:opacity-60"
          />
          <DispatchButton running={running} finished={finished} onStop={onStop} />
        </div>

        <div className="border-t border-border/70 px-3 py-2 flex flex-wrap items-center gap-2">
          <span className="kicker">Try</span>
          {SAMPLES.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => !running && setValue(s)}
              disabled={running}
              className="font-mono text-[0.72rem] tracking-wide text-fg-muted
                         px-2.5 py-1 rounded-full border border-border
                         hover:text-lime hover:border-lime/60
                         transition-colors duration-200
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              №{i + 1}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}

function DispatchButton({ running, finished, onStop }) {
  if (running) {
    return (
      <button
        type="button"
        onClick={onStop}
        className="group relative px-5 h-full min-h-[80px] rounded-lg
                   border border-coral/60 bg-coral/10 text-coral
                   hover:bg-coral/20 transition-colors
                   font-display text-[1rem] tracking-wide
                   flex flex-col items-center justify-center gap-1"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <rect x="2" y="2" width="10" height="10" rx="1" fill="currentColor" />
        </svg>
        <span className="kicker !text-coral !tracking-widest">Halt</span>
      </button>
    );
  }

  return (
    <button
      type="submit"
      className="group relative px-6 h-full min-h-[80px] rounded-lg
                 border border-lime bg-lime text-base
                 hover:brightness-110 active:brightness-95
                 transition-[filter,transform] duration-150
                 font-display font-semibold
                 flex flex-col items-center justify-center gap-1
                 shadow-[0_0_30px_-2px_color-mix(in_oklab,var(--color-lime)_60%,transparent)]"
    >
      <svg width="16" height="16" viewBox="0 0 16 16">
        {finished
          ? <path d="M3 8 A 5 5 0 1 1 8 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          : <path d="M3 2 L 13 8 L 3 14 Z" fill="currentColor" />}
      </svg>
      <span className="text-[0.78rem] tracking-[0.18em] uppercase">
        {finished ? "Anew" : "Dispatch"}
      </span>
    </button>
  );
}
