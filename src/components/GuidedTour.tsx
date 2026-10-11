"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/Mascot";

const SEEN_KEY = "matchin:tourSeen";

type Step = {
  tourKey: string;
  title: string;
  body: string;
};

// Covers the features explicitly asked for — real navigation items, not an
// invented list. Order matches their natural place in the sidebar/nav.
const STEPS: Step[] = [
  {
    tourKey: "wardrobe",
    title: "your wardrobe",
    body: "Every piece you own, photographed once. matchin' reads category, colour, fit and formality automatically — this is the foundation everything else builds from.",
  },
  {
    tourKey: "chat",
    title: "chat now",
    body: "Just talk to matchin' — \"what should I wear to a wedding?\", \"pack for a weekend trip\", or ask anything else. It only builds an outfit when you're actually asking for one.",
  },
  {
    tourKey: "outfits",
    title: "outfits",
    body: "Every outfit matchin' has put together for you lives here — saved ones, generated ones, all in one place.",
  },
  {
    tourKey: "playground",
    title: "outfit playground",
    body: "Swipe through your real pieces category by category, pin what you want to keep, shuffle the rest, and save the exact combination you land on. No AI needed.",
  },
  {
    tourKey: "style-dna",
    title: "style DNA",
    body: "Your evolving style profile — matchin' learns your colours, proportions and taste the more you wear, save and rate fits.",
  },
  {
    tourKey: "wishlist",
    title: "wishlist",
    body: "Save pieces you're thinking about buying, and matchin' can tell you how well they'd actually fit your wardrobe.",
  },
  {
    tourKey: "gallery",
    title: "gallery",
    body: "A visual archive of every outfit you've saved — your own personal lookbook.",
  },
];

function getTargetRect(tourKey: string): DOMRect | null {
  // The same tourKey exists in both Sidebar (desktop) and MobileNav (mobile)
  // so the layout can highlight whichever one is actually on screen — pick
  // the first match with real, visible dimensions rather than just the
  // first DOM match, which on mobile would be Sidebar's `hidden lg:flex`
  // (and therefore zero-size) element.
  const candidates = document.querySelectorAll(`[data-tour="${tourKey}"]`);
  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return rect;
  }
  return null;
}

export function GuidedTour() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const resizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Launch once right after a real onboarding completion (?tour=1), or
  // on-demand from Settings' "Replay tour" entry (a window event, so this
  // component doesn't need to be re-mounted or lifted into shared state).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") === "1") {
      params.delete("tour");
      const next = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (next ? `?${next}` : ""));
      setOpen(true);
      setStepIndex(0);
    }

    function onReplay() {
      setOpen(true);
      setStepIndex(0);
    }
    window.addEventListener("matchin:replay-tour", onReplay);
    return () => window.removeEventListener("matchin:replay-tour", onReplay);
  }, []);

  useEffect(() => {
    if (!open) return;
    const step = STEPS[stepIndex];
    window.dispatchEvent(new CustomEvent("matchin:tour-request-open", { detail: step.tourKey }));

    function measure() {
      setRect(getTargetRect(step.tourKey));
    }
    // One extra tick lets MobileNav's sheet finish opening/animating in
    // before we measure its position.
    const t = setTimeout(measure, 120);

    function onResize() {
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
      resizeTimer.current = setTimeout(measure, 100);
    }
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      if (resizeTimer.current) clearTimeout(resizeTimer.current);
    };
  }, [open, stepIndex]);

  function finish() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // best-effort only
    }
    setOpen(false);
    router.push("/dashboard");
  }

  if (!open) return null;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const pad = 10;

  // Card position: anchored near the spotlighted element when we have one,
  // centered on screen when we don't (e.g. a step whose nav item isn't
  // reachable in the current layout) — always a real, visible state,
  // never an invisible tooltip pointing at nothing.
  const cardStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        top: Math.min(Math.max(rect.bottom + 14, 16), window.innerHeight - 260),
        left: Math.min(Math.max(rect.left, 16), window.innerWidth - 336),
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-label="Guided tour">
      {/* Dim everything except a cutout around the current target, via a
          4-rectangle mask rather than SVG — simpler to keep in sync with a
          DOMRect that can change (resize, sheet open) every step. */}
      {rect ? (
        <>
          <div className="fixed bg-ink/60 pointer-events-none" style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top - pad) }} />
          <div className="fixed bg-ink/60 pointer-events-none" style={{ top: rect.bottom + pad, left: 0, right: 0, bottom: 0 }} />
          <div className="fixed bg-ink/60 pointer-events-none" style={{ top: rect.top - pad, left: 0, width: Math.max(0, rect.left - pad), height: rect.height + pad * 2 }} />
          <div className="fixed bg-ink/60 pointer-events-none" style={{ top: rect.top - pad, left: rect.right + pad, right: 0, height: rect.height + pad * 2 }} />
          <div
            className="fixed rounded-xl ring-2 ring-lime pointer-events-none"
            style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-ink/60" />
      )}

      <div
        className="w-[320px] rounded-2xl bg-paper border border-line shadow-xl p-5 animate-fade-in"
        style={cardStyle}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <Mascot expression={stepIndex === 0 ? "welcoming" : isLast ? "celebratory" : "helpful"} size={32} />
          <button onClick={finish} aria-label="Close tour" className="text-stone hover:text-ink cursor-pointer -mt-1 -mr-1 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="font-display text-xl mb-1.5 lowercase">{step.title}</p>
        <p className="text-sm text-stone leading-relaxed mb-4">{step.body}</p>

        <div className="flex items-center justify-center gap-1.5 mb-4">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === stepIndex ? "w-5 bg-lime" : "w-1.5 bg-line"}`} />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <button onClick={finish} className="text-xs text-stone hover:text-ink underline underline-offset-4 cursor-pointer">
            Skip
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStepIndex((i) => i - 1)}>
                Back
              </Button>
            )}
            <Button variant="lime" size="sm" onClick={() => (isLast ? finish() : setStepIndex((i) => i + 1))}>
              {isLast ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
