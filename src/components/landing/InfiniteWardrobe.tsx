"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { comboForStyle, type WheelItem } from "@/lib/publicFashion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { ArrowRight } from "lucide-react";

// The four outfits that make up the sequence. Computed once (useState lazy
// init, not on every scroll-driven re-render) from the same unisex item
// pool and comboForStyle() the wheel and style-discovery section already
// use — comboForStyle is randomized, so calling it per-render would make
// the garments flicker between different pieces on every scroll tick.
const STYLES = ["Casual", "Streetwear", "Smart Casual", "Formal"];

type Slot = "Top" | "Bottom" | "Shoes" | "Accessory";
const SLOTS: Slot[] = ["Top", "Bottom", "Shoes", "Accessory"];

// Scattered ("wardrobe pile") vs. assembled ("worn outfit") position for
// each garment slot, as percentages of the stage's own box — resolution-
// independent, so the same four numbers work at any container size rather
// than needing separate desktop/mobile coordinates.
const LAYOUT: Record<Slot, { scattered: { top: string; left: string; rotate: number; scale: number }; assembled: { top: string; left: string; rotate: number; scale: number } }> = {
  Top: { scattered: { top: "10%", left: "18%", rotate: -14, scale: 0.65 }, assembled: { top: "6%", left: "50%", rotate: 0, scale: 1 } },
  Bottom: { scattered: { top: "55%", left: "72%", rotate: 11, scale: 0.65 }, assembled: { top: "40%", left: "50%", rotate: 0, scale: 1 } },
  Shoes: { scattered: { top: "78%", left: "22%", rotate: -7, scale: 0.55 }, assembled: { top: "76%", left: "50%", rotate: 0, scale: 0.85 } },
  Accessory: { scattered: { top: "14%", left: "78%", rotate: 16, scale: 0.55 }, assembled: { top: "4%", left: "82%", rotate: 0, scale: 0.75 } },
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Maps progress linearly onto [0, 1] within [start, end], clamped.
function segment(progress: number, start: number, end: number) {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return (progress - start) / (end - start);
}

const STAGE_COPY = [
  { eyebrow: "a few pieces.", headline: "ONE WARDROBE." },
  { eyebrow: "casual", headline: "ANY DAY." },
  { eyebrow: "streetwear", headline: "ANY MOOD." },
  { eyebrow: "smart casual", headline: "ANY PLAN." },
  { eyebrow: "elevated", headline: "ANY OCCASION." },
];

// Scroll-scrubbed sequence: a tall wrapper with a sticky, viewport-height
// stage inside it. `progress` (0-1) is derived from the wrapper's own
// position via getBoundingClientRect on scroll — not a library — and
// drives every transform/opacity below with plain inline styles, so
// scrolling up reverses the sequence for free (it's just progress
// decreasing, there's no separate "reverse" animation to author).
export function InfiniteWardrobe() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const reducedMotion = useReducedMotion();
  // comboForStyle() is randomized, and a client component's first client
  // render re-runs its initializers independently of what the server
  // already rendered — computing it eagerly (e.g. in useState's own lazy
  // initializer) would pick different garments server-side vs. client-side
  // and fail hydration. Starting empty and filling it in an effect keeps
  // the first client render identical to the server's. (This one remains
  // a direct setState-in-effect — unlike the reduced-motion check above,
  // there's no shared hook to delegate it to: it's this component's own
  // one-off content, not a duplicated browser-API read.)
  const [outfits, setOutfits] = useState<WheelItem[][]>(() => STYLES.map(() => []));

  useEffect(() => {
    setOutfits(STYLES.map((s) => comboForStyle(s)));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = wrapperRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = rect.height - vh;
        const p = total > 0 ? (vh - rect.top) / total : 0;
        setProgress(Math.min(1, Math.max(0, p)));
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (reducedMotion) {
    return <InfiniteWardrobeStatic outfits={outfits} />;
  }

  // Stage boundaries along the 0-1 scroll-progress timeline:
  //   0.00-0.14  Stage A — the pile of individual pieces
  //   0.14-0.30  Stage B — pieces assemble into the first outfit
  //   0.30-0.42 / 0.42-0.58 / 0.58-0.74 / 0.74-0.88 — Stage C, one crossfade
  //              per remaining outfit (3 transitions across 4 looks)
  //   0.88-1.00  Stage D — headline + CTA
  const assembleT = segment(progress, 0.0, 0.3); // 0 = scattered, 1 = assembled
  const outfitRanges = [
    [0.3, 0.42],
    [0.42, 0.58],
    [0.58, 0.74],
    [0.74, 0.88],
  ] as const;
  const outfitOpacities = outfitRanges.map(([start, end], i) => {
    if (i === 0) return 1 - segment(progress, start, end);
    const [prevStart, prevEnd] = outfitRanges[i - 1];
    return segment(progress, prevStart, prevEnd) - (i < outfitRanges.length - 1 ? segment(progress, start, end) : 0);
  });
  // index 0 stays fully visible until the first crossfade begins
  outfitOpacities[0] = 1 - segment(progress, outfitRanges[0][0], outfitRanges[0][1]);
  const finalT = segment(progress, 0.88, 1.0);
  const stageIndex = Math.min(STAGE_COPY.length - 1, Math.round(progress * (STAGE_COPY.length - 1) / 0.86));
  const copy = STAGE_COPY[Math.min(stageIndex, 4)];

  return (
    <div ref={wrapperRef} className="relative h-[280vh] sm:h-[340vh] bg-ink">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 atmosphere pointer-events-none" />

        {/* Stage copy */}
        <div className="absolute top-10 sm:top-16 inset-x-0 text-center px-6 transition-opacity duration-300" style={{ opacity: 1 - finalT }}>
          <p className="text-[10px] sm:text-xs tracking-[0.25em] uppercase text-lime mb-2">{copy.eyebrow}</p>
          <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-tight text-white">{copy.headline}</h2>
        </div>

        {/* The garment stage — fades fully out (not just dims) as Stage D
            approaches, so the CTA that follows never has to share the
            screen with it; without a full fade, the CTA's text had nowhere
            to go on short mobile viewports and ended up overlapping the
            lower garments. */}
        <div
          className="relative w-[280px] h-[360px] sm:w-[360px] sm:h-[460px] transition-transform duration-300"
          style={{ transform: `translateY(${lerp(0, -40, finalT)}px) scale(${lerp(1, 0.8, finalT)})`, opacity: Math.max(0, 1 - finalT * 1.6) }}
        >
          {SLOTS.map((slot, slotIndex) => {
            const pos = LAYOUT[slot];
            const top = `${lerp(parseFloat(pos.scattered.top), parseFloat(pos.assembled.top), assembleT)}%`;
            const left = `${lerp(parseFloat(pos.scattered.left), parseFloat(pos.assembled.left), assembleT)}%`;
            const rotate = lerp(pos.scattered.rotate, pos.assembled.rotate, assembleT);
            const scale = lerp(pos.scattered.scale, pos.assembled.scale, assembleT);
            const scatterOpacity = lerp(0.55, 1, assembleT);

            return (
              <div
                key={slot}
                className="absolute w-20 h-24 sm:w-28 sm:h-32 -translate-x-1/2"
                style={{ top, left, transform: `translateX(-50%) rotate(${rotate}deg) scale(${scale})`, opacity: scatterOpacity }}
              >
                {outfits.map((outfit, outfitIdx) => {
                  const item = outfit[slotIndex];
                  if (!item) return null;
                  return (
                    <div
                      key={outfitIdx}
                      className="absolute inset-0 rounded-xl overflow-hidden border border-white/10 bg-white/5 shadow-lg transition-opacity duration-200"
                      style={{ opacity: outfitOpacities[outfitIdx] ?? (outfitIdx === 0 ? 1 : 0) }}
                    >
                      <Image src={item.imageUrl} alt={`${item.primaryColor} ${item.category}`} fill sizes="140px" className="object-cover" />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Outfit progress ticks */}
        <div className="absolute bottom-24 sm:bottom-28 inset-x-0 flex items-center justify-center gap-2 transition-opacity duration-300" style={{ opacity: 1 - finalT }}>
          {STYLES.map((s, i) => (
            <span key={s} className={`h-1 rounded-full transition-all duration-300 ${i <= stageIndex - 1 ? "w-6 bg-lime" : "w-1.5 bg-white/20"}`} />
          ))}
        </div>

        {/* Stage D — reveal + CTA. A full-cover centered overlay (not a
            bottom-anchored block) so its own height never competes with
            the garment stage above it — on short mobile viewports a
            bottom-pinned block was tall enough to overlap the lower
            garments before they'd fully faded. */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-ink text-center px-6 transition-opacity duration-300"
          style={{ opacity: finalT, pointerEvents: finalT > 0.5 ? "auto" : "none" }}
        >
          <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-tight text-white mb-3">style more. buy less.</h2>
          <p className="text-sm sm:text-base text-white/50 max-w-sm mx-auto mb-7">
            Four pieces, four looks — and that&apos;s before matchin&apos; sees the rest of your closet.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-full bg-lime text-lime-ink px-7 py-3.5 text-base font-medium hover:scale-[1.03] active:scale-[0.97] transition-transform lowercase"
          >
            match your own wardrobe <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// No-motion fallback: the same four outfits and the same closing message,
// laid out as an ordinary static grid — nothing here depends on scroll
// position, so prefers-reduced-motion visitors get the full idea without
// any animation to opt out of.
function InfiniteWardrobeStatic({ outfits }: { outfits: WheelItem[][] }) {
  return (
    <section className="bg-ink py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-6 text-center">
        <p className="text-xs tracking-[0.25em] uppercase text-lime mb-3">a few pieces.</p>
        <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-tight text-white mb-4">one wardrobe. endless outfits.</h2>
        <p className="text-sm sm:text-base text-white/50 max-w-md mx-auto mb-12">
          The same handful of pieces, styled four different ways — casual, streetwear, smart casual, and elevated.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {outfits.map((outfit, i) => (
            <div key={STYLES[i]}>
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {outfit.map((item) => (
                  <div key={item.imageUrl} className="relative aspect-[4/5] rounded-lg overflow-hidden border border-white/10 bg-white/5">
                    <Image src={item.imageUrl} alt={`${item.primaryColor} ${item.category}`} fill sizes="140px" className="object-cover" />
                  </div>
                ))}
              </div>
              <p className="text-[11px] uppercase tracking-wide text-white/40">{STYLES[i]}</p>
            </div>
          ))}
        </div>

        <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-tight text-white mb-3">style more. buy less.</h3>
        <Link
          href="/signup"
          className="inline-flex items-center gap-1.5 rounded-full bg-lime text-lime-ink px-7 py-3.5 text-base font-medium hover:scale-[1.03] active:scale-[0.97] transition-transform lowercase"
        >
          match your own wardrobe <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
