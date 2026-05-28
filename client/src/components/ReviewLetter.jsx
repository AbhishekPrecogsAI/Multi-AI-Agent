import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * ReviewLetter — the final synthesis from the Reviewer.
 *
 * Renders only after the reviewer finishes. Animates in with a soft
 * scale + blur reveal. Uses a larger prose size and a subtle gradient
 * emblem at the top in place of the old wax seal.
 */

export default function ReviewLetter({ reviewer }) {
  if (reviewer.status !== "done" || !reviewer.output) return null;

  return (
    <section
      className="unfold card card-done relative mt-14 mb-8 overflow-hidden"
      style={{
        background:
          "radial-gradient(1000px 400px at 50% -10%, color-mix(in oklab, var(--color-mint) 8%, transparent), transparent 60%), rgba(19,18,32,0.7)",
      }}
    >
      <div className="relative flex flex-col items-center pt-12 pb-3 px-6">
        <Emblem />
        <p className="kicker mt-5">Synthesis · Plate 04</p>
        <h2
          className="display text-center mt-2 leading-[0.95] text-fg"
          style={{
            fontSize: "clamp(2rem, 4vw, 3.2rem)",
            fontVariationSettings: '"opsz" 96, "wght" 600',
          }}
        >
          The Reviewer's <span
            className="italic text-mint"
            style={{ fontVariationSettings: '"opsz" 96, "wght" 400' }}
          >Verdict</span>
        </h2>
        <div className="mt-5 w-24 h-px bg-gradient-to-r from-transparent via-mint to-transparent" />
      </div>

      <div className="px-8 md:px-14 lg:px-20 py-8">
        <div className="prose-dark" style={{ fontSize: "1.04rem" }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {reviewer.output}
          </ReactMarkdown>
        </div>
      </div>

      <footer className="flex items-center justify-between px-8 md:px-14 lg:px-20 pb-8 pt-4 border-t border-border/60">
        <span className="font-display italic text-fg-muted">— signed, the cooperative</span>
        <span className="kicker">End of dispatch</span>
      </footer>
    </section>
  );
}

function Emblem() {
  return (
    <div className="relative w-16 h-16">
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <defs>
          <radialGradient id="emblem" cx="50%" cy="40%" r="60%">
            <stop offset="0%"   stopColor="#a0ffd5" />
            <stop offset="55%"  stopColor="var(--color-mint)" />
            <stop offset="100%" stopColor="#2c8a64" />
          </radialGradient>
          <filter id="emblem-glow">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <circle cx="32" cy="32" r="22" fill="var(--color-mint)" opacity="0.18" filter="url(#emblem-glow)" />
        <circle cx="32" cy="32" r="20" fill="url(#emblem)" />
        <circle cx="32" cy="32" r="18" fill="none" stroke="#0e2b22" strokeWidth="0.6" />
        <path
          d="M 22 33 L 29 41 L 44 24"
          fill="none"
          stroke="#0e2b22"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
