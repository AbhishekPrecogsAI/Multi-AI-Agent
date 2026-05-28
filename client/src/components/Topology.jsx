import { useEffect, useState } from "react";

/**
 * Topology — animated SVG schematic of the four-agent pipeline.
 *
 * - Idle nodes: dim outline disks.
 * - Running: filled with electric lime + outward glow halo + soft pulse.
 * - Done:     mint outline + small filled core.
 * - Edges:    base track is faint border; when a source node is `done` and
 *             the destination is `running` or `idle`, a bright gradient line
 *             overlays the track and a small dot travels along it suggesting
 *             data in transit.
 */

const NODES = {
  planner:  { x: 200, y:  82, n: "I",   name: "Planner",  caption: "Decompose"    },
  research: { x:  88, y: 230, n: "II",  name: "Research", caption: "Survey"       },
  coder:    { x: 312, y: 230, n: "III", name: "Coder",    caption: "Author"       },
  reviewer: { x: 200, y: 378, n: "IV",  name: "Reviewer", caption: "Reconcile"    },
};

const EDGES = [
  { from: "planner",  to: "research" },
  { from: "planner",  to: "coder"    },
  { from: "research", to: "reviewer" },
  { from: "coder",    to: "reviewer" },
];

export default function Topology({ agents }) {
  const statusOf = (n) => agents[n]?.status ?? "idle";

  // Drives the dashed-line offset so "running" edges feel like data flow.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let raf;
    const loop = () => { setTick((t) => t + 1); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <figure className="card p-5">
      <header className="flex items-baseline justify-between mb-3">
        <span className="kicker">Fig. I · Topology</span>
        <span className="kicker text-fg-dim">Realtime</span>
      </header>

      <svg viewBox="0 0 400 460" className="w-full h-auto" role="img" aria-label="Pipeline topology">
        <defs>
          <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="var(--color-lime)" stopOpacity="0.55" />
            <stop offset="60%"  stopColor="var(--color-lime)" stopOpacity="0.10" />
            <stop offset="100%" stopColor="var(--color-lime)" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="edgeLive" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="var(--color-lime)" stopOpacity="0" />
            <stop offset="50%"  stopColor="var(--color-lime)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--color-mint)" stopOpacity="0.4" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        {/* Background dot grid — subtle texture inside the SVG */}
        <g opacity="0.12" stroke="var(--color-border-bright)">
          {Array.from({ length: 18 }).map((_, r) =>
            Array.from({ length: 15 }).map((__, c) => (
              <circle key={`${r}-${c}`} cx={20 + c * 26} cy={20 + r * 26} r="0.6" fill="var(--color-border-bright)" />
            )),
          )}
        </g>

        {/* Edges */}
        {EDGES.map((e) => {
          const a = NODES[e.from], b = NODES[e.to];
          const fromDone   = statusOf(e.from) === "done";
          const toRunning  = statusOf(e.to)   === "running";
          const toIdle     = statusOf(e.to)   === "idle";
          const toDone     = statusOf(e.to)   === "done";
          const live = fromDone && (toRunning || toIdle);
          const settled = fromDone && toDone;

          const r = 30;
          const dx = b.x - a.x, dy = b.y - a.y;
          const len = Math.hypot(dx, dy);
          const ux = dx / len, uy = dy / len;
          const x1 = a.x + ux * r, y1 = a.y + uy * r;
          const x2 = b.x - ux * r, y2 = b.y - uy * r;

          // Position of the travelling dot along this edge (only when live)
          const phase = (tick % 90) / 90; // 0..1 over ~1.5s at 60fps
          const dotX = x1 + (x2 - x1) * phase;
          const dotY = y1 + (y2 - y1) * phase;

          return (
            <g key={`${e.from}-${e.to}`}>
              {/* Base track */}
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={settled ? "color-mix(in oklab, var(--color-mint) 35%, var(--color-border))" : "var(--color-border)"}
                strokeWidth="1"
              />
              {/* Live overlay */}
              {live && (
                <>
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="url(#edgeLive)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <circle cx={dotX} cy={dotY} r="3" fill="var(--color-lime)" filter="url(#glow)" />
                  <circle cx={dotX} cy={dotY} r="1.6" fill="var(--color-base)" />
                </>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {Object.entries(NODES).map(([id, node]) => (
          <Node key={id} node={node} status={statusOf(id)} />
        ))}
      </svg>

      <figcaption className="mt-3 text-[0.78rem] text-fg-muted leading-relaxed italic">
        Planner dispatches to two contemporaneous observers; the Reviewer reconciles
        their findings into a single synthesis.
      </figcaption>
    </figure>
  );
}

function Node({ node, status }) {
  const running = status === "running";
  const done    = status === "done";

  const fill   = running ? "var(--color-lime)"
                : done   ? "color-mix(in oklab, var(--color-mint) 18%, var(--color-surface))"
                         : "var(--color-surface)";
  const stroke = running ? "var(--color-lime)"
                : done   ? "var(--color-mint)"
                         : "var(--color-border-bright)";
  const text   = running ? "var(--color-base)"
                : done   ? "var(--color-mint)"
                         : "var(--color-fg-muted)";

  // Determine which side the label callout sits on — research is left, others right.
  const side = node.x < 180 ? "left" : "right";

  return (
    <g>
      {/* Halo behind active nodes */}
      {running && (
        <circle
          cx={node.x} cy={node.y} r="58"
          fill="url(#haloGrad)"
          className="halo"
          style={{ transformOrigin: `${node.x}px ${node.y}px` }}
        />
      )}

      {/* Outer ring (also pulses for done as a static accent) */}
      <circle cx={node.x} cy={node.y} r="34" fill="none"
              stroke={done ? "color-mix(in oklab, var(--color-mint) 30%, transparent)" : "var(--color-border)"}
              strokeWidth="1" />

      {/* Body disk */}
      <circle
        cx={node.x} cy={node.y} r="28"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.4"
        style={{ transition: "fill 0.5s ease, stroke 0.5s ease" }}
      />

      {/* Inner accent (small disc, technical-drawing flair) */}
      <circle cx={node.x} cy={node.y} r="3" fill={running ? "var(--color-base)" : stroke} opacity={running ? 1 : 0.6} />

      {/* Numeral */}
      <text
        x={node.x} y={node.y - 8}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="9"
        letterSpacing="0.2em"
        fill={text}
        style={{ transition: "fill 0.5s ease" }}
      >
        {node.n}
      </text>

      <Callout node={node} side={side} status={status} />
    </g>
  );
}

function Callout({ node, side, status }) {
  const dx = side === "right" ? 44 : -44;
  const anchor = side === "right" ? "start" : "end";

  const statusLabel =
    status === "running" ? "active"
    : status === "done"  ? "settled"
                         : "awaiting";
  const statusColor =
    status === "running" ? "var(--color-lime)"
    : status === "done"  ? "var(--color-mint)"
                         : "var(--color-fg-dim)";

  return (
    <g>
      <line
        x1={node.x + (side === "right" ? 34 : -34)}
        y1={node.y}
        x2={node.x + dx}
        y2={node.y}
        stroke="var(--color-border-bright)"
        strokeWidth="0.6"
      />
      <text
        x={node.x + dx + (side === "right" ? 4 : -4)}
        y={node.y - 4}
        textAnchor={anchor}
        fontFamily="var(--font-display)"
        fontSize="13"
        fontWeight="600"
        fill="var(--color-fg)"
      >
        {node.name}
      </text>
      <text
        x={node.x + dx + (side === "right" ? 4 : -4)}
        y={node.y + 10}
        textAnchor={anchor}
        fontFamily="var(--font-body)"
        fontSize="9.5"
        fill="var(--color-fg-muted)"
      >
        {node.caption}
      </text>
      <text
        x={node.x + dx + (side === "right" ? 4 : -4)}
        y={node.y + 23}
        textAnchor={anchor}
        fontFamily="var(--font-mono)"
        fontSize="8"
        letterSpacing="0.18em"
        fill={statusColor}
        style={{ textTransform: "uppercase" }}
      >
        — {statusLabel}
      </text>
    </g>
  );
}
