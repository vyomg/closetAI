"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

// Applies the user's Appearance preference (Settings → Appearance) to
// whatever it wraps. "dark" is the default, locked brand identity
// (.theme-dark-app, defined in globals.css) — "light" just omits that
// class, falling back to the original :root light tokens, which still
// exist underneath it. "system" reads prefers-color-scheme client-side
// only (there's no way to know OS preference during SSR) and re-evaluates
// if the OS setting changes while the tab is open.
export function ThemeRoot({
  initialPreference,
  className,
  children,
}: {
  initialPreference: "system" | "dark" | "light";
  className?: string;
  children: React.ReactNode;
}) {
  // Default to dark for the very first paint (matches the server-rendered
  // markup, avoids a flash) — a "system: light" user sees one frame of dark
  // before the effect below corrects it, same tradeoff every "system theme"
  // implementation without a blocking inline script makes.
  const [isDark, setIsDark] = useState(initialPreference !== "light");

  // Re-sync if the server-passed preference changes without a full remount
  // — e.g. Settings calls router.refresh() right after saving a new choice.
  useEffect(() => {
    if (initialPreference === "dark") {
      setIsDark(true);
      return;
    }
    if (initialPreference === "light") {
      setIsDark(false);
      return;
    }
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [initialPreference]);

  return <div className={cn(isDark && "theme-dark-app", "bg-paper text-ink", className)}>{children}</div>;
}
