"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

// matchin's mascot, built around the same spark silhouette as Brand.tsx's
// MatchinAvatar — deliberately the SAME path data, so every mascot
// appearance across the app reads as one consistent character regardless
// of expression. Flat 2D only: no gradients, no glow, no 3D — movement
// comes entirely from CSS transforms/opacity (see globals.css's
// mascot-* keyframes) and a small amount of cursor-following JS.
const SPARK_PATH = "M15 0 Q17.5 13.5 30 15.5 Q18 17.5 16 30 Q14 17.5 2 16 Q14 13.5 15 0 Z";

export type MascotExpression =
  | "idle"
  | "curious"
  | "thinking"
  | "happy"
  | "thoughtful"
  | "excited"
  | "welcoming"
  | "celebratory"
  | "helpful";

type ExpressionConfig = {
  eyeShape: "dot" | "happy" | "narrow" | "wide";
  tilt: number; // static degrees, combined with the idle float's own gentle rotation
  bounce: "slow" | "fast" | "none";
  tracking: boolean; // follows cursor/lookAt when true
  burst: boolean; // one-shot radiating mini-sparks on mount
  nod: boolean; // one-shot welcoming nod on mount
};

const EXPRESSIONS: Record<MascotExpression, ExpressionConfig> = {
  idle: { eyeShape: "dot", tilt: 0, bounce: "slow", tracking: true, burst: false, nod: false },
  curious: { eyeShape: "dot", tilt: -4, bounce: "slow", tracking: true, burst: false, nod: false },
  thinking: { eyeShape: "narrow", tilt: 3, bounce: "slow", tracking: false, burst: false, nod: false },
  happy: { eyeShape: "happy", tilt: 0, bounce: "fast", tracking: false, burst: false, nod: false },
  thoughtful: { eyeShape: "narrow", tilt: -2, bounce: "slow", tracking: false, burst: false, nod: false },
  excited: { eyeShape: "wide", tilt: 0, bounce: "fast", tracking: false, burst: true, nod: false },
  welcoming: { eyeShape: "happy", tilt: 0, bounce: "slow", tracking: true, burst: false, nod: true },
  celebratory: { eyeShape: "happy", tilt: 0, bounce: "fast", tracking: false, burst: true, nod: false },
  helpful: { eyeShape: "dot", tilt: 2, bounce: "slow", tracking: true, burst: false, nod: false },
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// Pupils follow the cursor on fine-pointer (mouse/trackpad) devices, offset
// directly via CSS custom properties mutated outside React state (same
// rAF-throttled imperative-style pattern used by the Playground carousel)
// so mousemove never triggers a React re-render. `lookAt`, when set,
// overrides live cursor tracking with a fixed viewport point — how a
// caller makes the mascot glance toward a specific card, outfit, or touch
// location instead of the live pointer.
function usePupilTracking(
  containerRef: React.RefObject<HTMLDivElement | null>,
  enabled: boolean,
  lookAt: { x: number; y: number } | null | undefined,
  reducedMotion: boolean
) {
  useEffect(() => {
    if (!enabled || reducedMotion) return;
    const el = containerRef.current;
    if (!el) return;

    function apply(clientX: number, clientY: number) {
      const node = containerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const maxOffset = 1.6;
      const scale = Math.min(1, dist / 240);
      node.style.setProperty("--pupil-x", `${(dx / dist) * maxOffset * scale}px`);
      node.style.setProperty("--pupil-y", `${(dy / dist) * maxOffset * scale}px`);
    }

    if (lookAt) {
      apply(lookAt.x, lookAt.y);
      return;
    }

    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf: number | null = null;
    let pending: { x: number; y: number } | null = null;
    function onMove(e: MouseEvent) {
      pending = { x: e.clientX, y: e.clientY };
      if (raf == null) {
        raf = requestAnimationFrame(() => {
          raf = null;
          if (pending) apply(pending.x, pending.y);
        });
      }
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf != null) cancelAnimationFrame(raf);
      el.style.removeProperty("--pupil-x");
      el.style.removeProperty("--pupil-y");
    };
  }, [containerRef, enabled, lookAt, reducedMotion]);
}

export function Mascot({
  expression = "idle",
  size = 40,
  lookAt = null,
  className,
  color = "text-lime",
}: {
  expression?: MascotExpression;
  size?: number;
  /** Viewport-space point (e.g. a tapped card's center) to glance toward instead of the live cursor. */
  lookAt?: { x: number; y: number } | null;
  className?: string;
  /** Tailwind text-color class — the spark fill and pupils both read `currentColor`/graphite as today. */
  color?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const cfg = EXPRESSIONS[expression];

  usePupilTracking(containerRef, cfg.tracking, lookAt, reducedMotion);

  const bounceClass =
    !reducedMotion && cfg.bounce === "fast" ? "animate-mascot-bounce" : !reducedMotion && cfg.bounce === "slow" ? "animate-mascot-float" : "";
  const nodClass = !reducedMotion && cfg.nod ? "animate-mascot-nod" : "";

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block", color, className)}
      style={{ width: size, height: size, ["--mascot-tilt" as string]: `${cfg.tilt}deg` }}
      aria-hidden
    >
      {cfg.burst && !reducedMotion && <BurstSparks />}
      {/* Two layers so a one-shot "nod" and the continuous idle float/bounce
          never fight over the same element's `animation` property (only one
          CSS animation-name can win per element) — nod plays once on the
          outer wrapper, float/bounce loops forever on the inner svg. */}
      <div className={nodClass}>
        <svg
          viewBox="0 0 32 32"
          width={size}
          height={size}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={bounceClass}
          style={{ transform: !cfg.bounce || cfg.bounce === "none" ? `rotate(${cfg.tilt}deg)` : undefined }}
        >
          <path d={SPARK_PATH} fill="currentColor" />
          <Eyes shape={cfg.eyeShape} reducedMotion={reducedMotion} />
        </svg>
      </div>
    </div>
  );
}

function Eyes({ shape, reducedMotion }: { shape: ExpressionConfig["eyeShape"]; reducedMotion: boolean }) {
  const leftX = 12.6;
  const rightX = 19.6;
  const y = 15.1;
  const blinkClass = !reducedMotion ? "animate-mascot-blink" : "";

  if (shape === "happy") {
    return (
      <g stroke="var(--graphite)" strokeWidth={1.4} strokeLinecap="round" fill="none">
        <path d={`M${leftX - 1.7},${y + 0.6} Q${leftX},${y - 1.6} ${leftX + 1.7},${y + 0.6}`} />
        <path d={`M${rightX - 1.7},${y + 0.6} Q${rightX},${y - 1.6} ${rightX + 1.7},${y + 0.6}`} />
      </g>
    );
  }

  if (shape === "narrow") {
    return (
      <g fill="var(--graphite)">
        <rect x={leftX - 1.6} y={y - 0.5} width={3.2} height={1} rx={0.5} />
        <rect x={rightX - 1.6} y={y - 0.5} width={3.2} height={1} rx={0.5} />
      </g>
    );
  }

  const r = shape === "wide" ? 1.9 : 1.5;
  return (
    <g
      className={blinkClass}
      style={{ transform: "translate(var(--pupil-x, 0px), var(--pupil-y, 0px))", transformBox: "fill-box", transformOrigin: "center" }}
    >
      <circle cx={leftX} cy={y} r={r} fill="var(--graphite)" />
      <circle cx={rightX} cy={y} r={r} fill="var(--graphite)" />
    </g>
  );
}

// Three small flat diamonds that fire outward once on mount, for
// "excited"/"celebratory" — a quick graphic flourish, not a particle
// system: fixed count, fixed directions, no randomness, no glow.
function BurstSparks() {
  const dirs = [
    { x: 12, y: -8 },
    { x: -10, y: -10 },
    { x: 2, y: -14 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none">
      {dirs.map((d, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 bg-lime animate-mascot-burst"
          style={{
            ["--burst-x" as string]: `${d.x}px`,
            ["--burst-y" as string]: `${d.y}px`,
            transform: "rotate(45deg)",
            animationDelay: `${i * 60}ms`,
          }}
        />
      ))}
    </div>
  );
}

// A couple of small satellite sparks drifting near the mascot — used
// sparingly (hero moments only), never stacked with BurstSparks on the
// same instance. Independent, slightly offset timing so they don't move
// in lockstep with each other or the mascot's own float.
export function MascotSparkField({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;
  return (
    <div className={cn("pointer-events-none", className)} aria-hidden>
      <span className="absolute h-1 w-1 bg-lime/70 animate-mascot-spark-drift" style={{ top: "10%", left: "85%", animationDelay: "0ms" }} />
      <span className="absolute h-1.5 w-1.5 bg-lime/50 animate-mascot-spark-drift" style={{ top: "80%", left: "8%", animationDelay: "900ms" }} />
      <span className="absolute h-[3px] w-[3px] bg-lime/60 animate-mascot-spark-drift" style={{ top: "15%", left: "5%", animationDelay: "1800ms" }} />
    </div>
  );
}
