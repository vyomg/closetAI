"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";

const DISMISS_KEY = "closetai:dismissedAppearanceNudge";

export function StyleProfileNudge({ compact = false }: { compact?: boolean }) {
  const [dismissed, setDismissed] = useState(true); // default hidden until we've checked localStorage, avoids flash

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // best-effort convenience only
    }
  }

  if (dismissed) return null;

  return (
    <div
      className={
        compact
          ? "rounded-2xl border border-line bg-paper-alt p-4 flex items-center gap-3 mb-6"
          : "rounded-2xl border border-line bg-paper-alt p-5 flex items-center justify-between gap-4 mb-8"
      }
    >
      <div className="flex items-center gap-3 min-w-0">
        <Sparkles className="h-4 w-4 text-ink-soft shrink-0" strokeWidth={1.75} />
        <div className="min-w-0">
          <p className="text-sm font-medium">Complete your Style Profile</p>
          <p className="text-xs text-stone mt-0.5">Add a full-body photo for more personalized outfit suggestions.</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/style-profile" className="text-sm font-medium underline underline-offset-4">
          Set up
        </Link>
        <button onClick={dismiss} aria-label="Dismiss" className="text-stone hover:text-ink cursor-pointer p-1 -m-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
