"use client";

import { useEffect, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Minimum time the branded intro stays up once shown, so the sequence
// always gets to play out even on a fast/cached load — not an artificial
// delay added to every navigation (this component mounts once, in the root
// layout, and never remounts on client-side route changes within the same
// tab — see the comment on EXIT_MS below for how that's guaranteed without
// sessionStorage).
const MIN_DURATION_MS = 3400;
const EXIT_MS = 500;
// If the page genuinely hasn't finished loading by this point, stop
// waiting anyway — never hold the intro up indefinitely over a slow or
// stalled request.
const READY_TIMEOUT_MS = 8000;

// The cinematic Matchin intro, shown once per browser tab session.
//
// Mounted a single time in the root layout (src/app/layout.tsx), outside
// any route segment, so React never unmounts/remounts it on client-side
// navigation — its own `dismissed` state simply stays `true` for the rest
// of that tab's session once set, which is what actually prevents the
// intro from replaying on every route change. A full page reload or a
// fresh tab re-mounts the root layout from scratch, which is exactly when
// showing it again is appropriate ("a fresh application session").
//
// Defaults to visible on first render (both server-rendered and the
// client's own first paint, before any effect runs) so there's no
// hydration mismatch and no flash of the real page underneath — the real
// app renders normally the whole time, just behind this opaque overlay.
export function IntroLoader() {
  const [dismissed, setDismissed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let minElapsed = false;
    let pageReady = document.readyState === "complete";
    let settled = false;

    function tryFinish() {
      if (settled || !minElapsed || !pageReady) return;
      settled = true;
      setExiting(true);
      window.setTimeout(() => setDismissed(true), EXIT_MS);
    }

    const minTimer = window.setTimeout(() => {
      minElapsed = true;
      tryFinish();
    }, reducedMotion ? 600 : MIN_DURATION_MS);

    function onLoad() {
      pageReady = true;
      tryFinish();
    }
    if (!pageReady) window.addEventListener("load", onLoad);

    const safetyTimer = window.setTimeout(() => {
      pageReady = true;
      minElapsed = true;
      tryFinish();
    }, READY_TIMEOUT_MS);

    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(safetyTimer);
      window.removeEventListener("load", onLoad);
    };
    // Deliberately empty deps — this must run exactly once per mount, not
    // re-run if reducedMotion resolves a tick after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (dismissed) return null;

  const circumference = 2 * Math.PI * 44;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-ink transition-opacity ease-out"
      style={{ opacity: exiting ? 0 : 1, transitionDuration: `${EXIT_MS}ms`, pointerEvents: exiting ? "none" : "auto" }}
    >
      <span className="sr-only">Loading matchin&apos;</span>

      <div className="relative flex items-center justify-center" aria-hidden>
        {!reducedMotion && (
          <svg viewBox="0 0 100 100" width={128} height={128} className="absolute">
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/10" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="text-lime -rotate-90 origin-center animate-intro-ring"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: circumference,
                ["--ring-circumference" as string]: circumference,
              }}
            />
          </svg>
        )}
        <div className={reducedMotion ? "animate-fade-in" : "animate-intro-mascot-in"}>
          <Mascot expression="welcoming" size={64} />
        </div>
      </div>

      <p
        className={`font-display text-2xl lowercase tracking-tight text-white mt-7 ${reducedMotion ? "animate-fade-in" : "animate-intro-wordmark"}`}
      >
        matchin&apos;
      </p>
      <p
        className={`text-[11px] uppercase tracking-[0.3em] text-white/40 mt-2 ${reducedMotion ? "animate-fade-in" : "animate-intro-tagline"}`}
      >
        your wardrobe, matched
      </p>
    </div>
  );
}
