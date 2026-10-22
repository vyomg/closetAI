"use client";

import { useEffect, useState } from "react";

// Shared by this session's new components (IntroLoader, ScrollReveal,
// InfiniteWardrobe) instead of each re-implementing the same hook.
// matchMedia is a browser-only API, so it must be read inside an effect —
// reading it eagerly (e.g. a useState lazy initializer) would make the
// server's render and the client's first render disagree whenever the
// real setting is true, which is a hydration mismatch, not just a lint
// warning. Starting from `false` and correcting it in an effect keeps the
// first client render identical to the server-rendered markup; the
// `react-hooks/set-state-in-effect` rule flags that correction (it can't
// tell this read is from a browser API that doesn't exist during SSR),
// which is why this one call site is accepted rather than restructured —
// the same tradeoff several pre-existing components in this codebase
// (Mascot.tsx, ThemeRoot.tsx, GuidedTour.tsx, ...) already make.
export function useReducedMotion() {
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
