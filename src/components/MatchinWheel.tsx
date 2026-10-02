"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Spark } from "@/components/Brand";

const WEDGE_FILLS = ["#18181a", "#2a2a2c"];
const SPECIAL_FILL = "#d7ff3f"; // the "surprise me" wedge gets the signature accent
const SPECIAL_LABEL = "SURPRISE ME";

type PointerSample = { angle: number; t: number };

export function MatchinWheel({
  segments,
  onLand,
  size = 320,
  className,
}: {
  segments: string[];
  onLand: (segment: string, index: number) => void;
  size?: number;
  className?: string;
}) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [transitionMs, setTransitionMs] = useState(0);
  const wheelRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const samples = useRef<PointerSample[]>([]);
  const startAngleOffset = useRef(0);
  const rafId = useRef<number | null>(null);

  const n = segments.length;
  const anglePer = 360 / n;
  const cx = 160;
  const cy = 160;
  const r = 152;

  const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  function settle(finalRotation: number) {
    const normalized = (((-finalRotation) % 360) + 360) % 360;
    const index = Math.floor(normalized / anglePer) % n;
    setSpinning(false);
    onLand(segments[index], index);
  }

  function spinBy(delta: number, durationMs: number) {
    setTransitionMs(durationMs);
    setSpinning(true);
    const target = rotation + delta;
    // Force a reflow so the transition actually applies to this new value
    // rather than being batched together with the previous rotation set.
    requestAnimationFrame(() => setRotation(target));
    window.setTimeout(() => settle(target), durationMs + 30);
  }

  const handleSpinClick = useCallback(() => {
    if (spinning) return;
    if (reducedMotion) {
      spinBy(360 * 2 + Math.random() * 360, 200);
      return;
    }
    const turns = 5 + Math.random() * 3; // 5-8 full turns
    const offset = Math.random() * 360;
    spinBy(turns * 360 + offset, 3400);
  }, [spinning, rotation, reducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  function angleFromCenter(clientX: number, clientY: number) {
    const el = wheelRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const px = clientX - (rect.left + rect.width / 2);
    const py = clientY - (rect.top + rect.height / 2);
    return (Math.atan2(py, px) * 180) / Math.PI;
  }

  function onPointerDown(e: React.PointerEvent) {
    if (spinning) return;
    dragging.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setTransitionMs(0);
    const a = angleFromCenter(e.clientX, e.clientY);
    startAngleOffset.current = a - rotation;
    samples.current = [{ angle: a, t: performance.now() }];
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const a = angleFromCenter(e.clientX, e.clientY);
    const next = a - startAngleOffset.current;
    setRotation(next);
    samples.current.push({ angle: a, t: performance.now() });
    if (samples.current.length > 8) samples.current.shift();
  }

  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;

    const s = samples.current;
    let velocity = 0; // degrees per ms
    if (s.length >= 2) {
      const first = s[0];
      const last = s[s.length - 1];
      let dAngle = last.angle - first.angle;
      // Normalize wrap-around (e.g. -179 -> 179 isn't really +358deg of motion)
      while (dAngle > 180) dAngle -= 360;
      while (dAngle < -180) dAngle += 360;
      const dt = Math.max(1, last.t - first.t);
      velocity = dAngle / dt;
    }

    if (Math.abs(velocity) < 0.05) {
      // Too slow to call a flick — just settle exactly where it was let go.
      setSpinning(true);
      setTimeout(() => settle(rotation), 50);
      return;
    }

    // Coast with friction: convert flick velocity into a multi-degree spin,
    // same deceleration curve as the click-to-spin path.
    const projected = velocity * 700; // ms of "coast" worth of motion
    const extraTurns = (2 + Math.random() * 2) * 360 * Math.sign(projected || 1);
    spinBy(projected + extraTurns, 2600);
  }

  const labelRadius = r * 0.66;

  return (
    <div className={cn("flex flex-col items-center gap-6 select-none", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* pointer */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-1 z-10"
          style={{ width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderTop: "16px solid #d7ff3f" }}
          aria-hidden
        />
        <svg
          ref={wheelRef}
          viewBox="0 0 320 320"
          width={size}
          height={size}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="cursor-grab active:cursor-grabbing touch-none"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: transitionMs ? `transform ${transitionMs}ms cubic-bezier(0.12,0.67,0.1,0.99)` : "none",
          }}
          role="img"
          aria-label="Spin the matchin' wheel to find your vibe"
        >
          <circle cx={cx} cy={cy} r={r + 4} fill="#0b0b0c" />
          {segments.map((label, i) => {
            const start = -90 + i * anglePer;
            const end = start + anglePer;
            const a0 = (start * Math.PI) / 180;
            const a1 = (end * Math.PI) / 180;
            const x0 = cx + r * Math.cos(a0);
            const y0 = cy + r * Math.sin(a0);
            const x1 = cx + r * Math.cos(a1);
            const y1 = cy + r * Math.sin(a1);
            const mid = (start + end) / 2;
            const lx = cx + labelRadius * Math.cos((mid * Math.PI) / 180);
            const ly = cy + labelRadius * Math.sin((mid * Math.PI) / 180);
            const isSpecial = label.toUpperCase() === SPECIAL_LABEL;
            const fill = isSpecial ? SPECIAL_FILL : WEDGE_FILLS[i % 2];
            return (
              <g key={label}>
                <path d={`M${cx},${cy} L${x0},${y0} A${r},${r} 0 0,1 ${x1},${y1} Z`} fill={fill} stroke="#0b0b0c" strokeWidth={1.5} />
                <text
                  x={lx}
                  y={ly}
                  transform={`rotate(${mid + 90} ${lx} ${ly})`}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={600}
                  letterSpacing={0.5}
                  fill={isSpecial ? "#0b0b0c" : "#ffffff"}
                  style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
                >
                  {label.toUpperCase()}
                </text>
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={28} fill="#0b0b0c" stroke="#d7ff3f" strokeWidth={2} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Spark className={cn("h-5 w-5 text-lime", spinning && "animate-spark-spin")} />
        </div>
      </div>

      <button
        onClick={handleSpinClick}
        disabled={spinning}
        className="inline-flex items-center gap-2 rounded-full bg-lime text-lime-ink px-6 py-3 text-sm font-semibold tracking-wide uppercase hover:scale-[1.03] active:scale-[0.97] transition-transform disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        {spinning ? "spinning..." : "spin it"}
      </button>
      <p className="text-xs text-white/40 lowercase -mt-3">or drag the wheel</p>
    </div>
  );
}
