"use client";

import { useState } from "react";
import Image from "next/image";
import { WHEEL_TOPS, WHEEL_BOTTOMS, WHEEL_SHOES, WHEEL_ACCESSORIES, type WheelItem } from "@/lib/publicFashion";
import { cn } from "@/lib/cn";

// A genuinely interactive outfit preview — not a decorative mockup. Tapping
// a thumbnail swaps that one piece immediately, so a visitor can build a
// look before ever creating an account. Shoes has only one real asset in
// the current pool (see publicFashion.ts's note on why), so that row is
// display-only for now rather than a selector with nothing to select.
function Picker({ items, selected, onSelect }: { items: WheelItem[]; selected: WheelItem; onSelect: (item: WheelItem) => void }) {
  return (
    <div className="flex gap-2">
      {items.map((item) => (
        <button
          key={item.imageUrl}
          onClick={() => onSelect(item)}
          aria-label={`Switch to ${item.primaryColor.toLowerCase()} ${item.style.toLowerCase()} ${item.category.toLowerCase()}`}
          aria-pressed={item.imageUrl === selected.imageUrl}
          className={cn(
            "relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer",
            item.imageUrl === selected.imageUrl ? "border-lime scale-105" : "border-white/15 hover:border-white/40"
          )}
        >
          <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-cover" />
        </button>
      ))}
    </div>
  );
}

export function OutfitBuilder() {
  const [top, setTop] = useState(WHEEL_TOPS[0]);
  const [bottom, setBottom] = useState(WHEEL_BOTTOMS[0]);
  const [accessory, setAccessory] = useState<WheelItem | null>(WHEEL_ACCESSORIES[0]);
  const shoe = WHEEL_SHOES[0];

  const pieces = [top, bottom, shoe, accessory].filter((p): p is WheelItem => p !== null);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6 max-w-sm mx-auto text-left">
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {pieces.map((item) => (
          <div key={item.category} className="relative aspect-[4/5] rounded-xl overflow-hidden bg-white/10 animate-fade-in" >
            <Image key={item.imageUrl} src={item.imageUrl} alt={`${item.primaryColor} ${item.category}`} fill sizes="160px" className="object-cover animate-fade-in" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5">top</p>
          <Picker items={WHEEL_TOPS} selected={top} onSelect={setTop} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5">bottom</p>
          <Picker items={WHEEL_BOTTOMS} selected={bottom} onSelect={setBottom} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5">accessory</p>
          <div className="flex gap-2">
            {WHEEL_ACCESSORIES.map((item) => (
              <button
                key={item.imageUrl}
                onClick={() => setAccessory(accessory?.imageUrl === item.imageUrl ? null : item)}
                aria-label={`Toggle ${item.primaryColor.toLowerCase()} accessory`}
                aria-pressed={accessory?.imageUrl === item.imageUrl}
                className={cn(
                  "relative h-12 w-12 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer",
                  accessory?.imageUrl === item.imageUrl ? "border-lime scale-105" : "border-white/15 hover:border-white/40"
                )}
              >
                <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-white/40 mt-4">tap a piece to swap it — this is an illustrative preview, not your real wardrobe yet.</p>
    </div>
  );
}
