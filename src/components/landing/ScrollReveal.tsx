"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

// A single lightweight IntersectionObserver-based reveal, reused across the
// landing page's scroll-triggered sections instead of a dependency like
// Framer Motion for what is, functionally, one fade+rise effect. Fires once
// (unobserves after revealing) and is a no-op under prefers-reduced-motion
// (globals.css already forces all .animate-* durations to ~0 there, so the
// only thing this component does differently is start from opacity:0 —
// which must also be skipped, or a reduced-motion visitor would never see
// the content at all).
export function ScrollReveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);

  useEffect(() => {
    setSkipAnimation(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("transition-all duration-700 ease-out", skipAnimation || visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6", className)}
      style={{ transitionDelay: visible && !skipAnimation ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
