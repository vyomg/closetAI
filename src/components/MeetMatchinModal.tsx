"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spark } from "@/components/Brand";
import { Mascot, type MascotExpression } from "@/components/Mascot";
import { cn } from "@/lib/cn";

// The persistent, revisitable version of onboarding's "hi, i'm matchin'"
// moment — same mascot, same voice — reachable any time from Settings so
// the introduction isn't a one-shot thing a user only sees once and loses.
// Three short, tap-through slides rather than a wall of text: genuinely
// interactive, not a static about-page.
const SLIDES: { title: string; body: string; expression: MascotExpression }[] = [
  {
    title: "hi, i'm matchin'.",
    body: "Think of me as your most honest, stylish friend — the one who actually knows your closet.",
    expression: "welcoming",
  },
  {
    title: "i learn as we go.",
    body: "Every swipe, every outfit you rate, every photo you upload — it all feeds your Style DNA. The more we talk, the better my suggestions get.",
    expression: "thinking",
  },
  {
    title: "ask me anything.",
    body: "\"What should I wear today?\", \"pack for a weekend trip\", or just chat — I'm built around real conversation, not a form.",
    expression: "helpful",
  },
];

export function MeetMatchinModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [slide, setSlide] = useState(0);

  if (!open) return null;

  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide];

  function handleClose() {
    setSlide(0);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={handleClose}>
      <div
        className="relative bg-paper rounded-t-3xl sm:rounded-2xl max-w-sm w-full p-7 text-center"
        style={{ paddingBottom: "calc(1.75rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-stone hover:text-ink cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <Mascot expression={current.expression} size={48} className="mx-auto mb-6" />
        <h2 key={slide} className="font-display text-2xl mb-3 leading-tight lowercase animate-fade-in">
          {current.title}
        </h2>
        <p key={`body-${slide}`} className="text-sm text-stone mb-7 animate-fade-in">
          {current.body}
        </p>

        <div className="flex items-center justify-center gap-1.5 mb-6">
          {SLIDES.map((_, i) => (
            <span key={i} className={cn("h-1.5 rounded-full transition-all", i === slide ? "w-5 bg-lime" : "w-1.5 bg-line")} />
          ))}
        </div>

        <div className="flex items-center justify-center gap-3">
          {slide > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setSlide((s) => s - 1)}>
              Back
            </Button>
          )}
          <Button variant="lime" size="sm" onClick={() => (isLast ? handleClose() : setSlide((s) => s + 1))} className="lowercase">
            {isLast ? (
              <>
                got it <Spark className="h-3.5 w-3.5 inline ml-1 -translate-y-px" />
              </>
            ) : (
              "next"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
