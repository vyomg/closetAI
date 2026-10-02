"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Spark } from "@/components/Brand";
import { cn } from "@/lib/cn";
import type { ClothingItemDTO } from "@/lib/clientTypes";

// Visualizes a real generated outfit as an orbit: the anchor item (the
// piece the user chose to "Style Me With This") sits at the centre, and the
// pieces matchin' actually picked to go with it — real wardrobe images,
// nothing generated — orbit around it. The compatibility decision already
// happened in the existing Gemini + deterministic-validator pipeline; this
// component only visualizes the result.
//
// `size` is a ceiling, not a fixed value: every offset below is computed
// from it, so instead of scaling that number down by a guess for mobile, we
// measure the actual container width and clamp to it — the orbit shrinks to
// exactly what fits, down to MIN_SIZE, and never clips or causes horizontal
// overflow on a narrow phone.
const MIN_SIZE = 220;

export function MatchinOrbit({
  anchor,
  orbiting,
  size: maxSize = 340,
}: {
  anchor: ClothingItemDTO & { slot?: string };
  orbiting: (ClothingItemDTO & { slot?: string })[];
  size?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(maxSize);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = (width: number) => {
      const available = Math.max(0, width - 8); // small breathing room, no edge clipping
      setSize(Math.max(MIN_SIZE, Math.min(maxSize, available)));
    };
    measure(el.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) measure(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [maxSize]);

  const n = orbiting.length;
  const radius = size * 0.36;

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full">
      <div className="relative mx-auto" style={{ width: size, height: size }}>
        {orbiting.map((item, i) => {
          const angle = (i / Math.max(1, n)) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const orbSize = size * 0.22;
          return (
            <div
              key={item.id}
              className="absolute left-1/2 top-1/2 animate-fade-in"
              style={{ marginLeft: x - orbSize / 2, marginTop: y - orbSize / 2, animationDelay: `${i * 80}ms` }}
            >
              <div
                className="relative rounded-xl overflow-hidden border-2 border-paper shadow-[0_8px_20px_-8px_rgba(0,0,0,0.3)] bg-paper-alt"
                style={{ width: orbSize, height: orbSize * 1.25 }}
              >
                <Image src={item.imageUrl} alt={item.name} fill sizes={`${Math.round(orbSize)}px`} className="object-cover" />
              </div>
              {item.slot && (
                <p className="text-[9px] uppercase tracking-wide text-stone text-center mt-1">{item.slot}</p>
              )}
            </div>
          );
        })}

        {/* connecting lines, drawn under everything */}
        <svg className="absolute inset-0 w-full h-full -z-10" viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}>
          {orbiting.map((item, i) => {
            const angle = (i / Math.max(1, n)) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            return <line key={item.id} x1={0} y1={0} x2={x} y2={y} stroke="currentColor" className="text-line" strokeWidth={1} opacity={0.5} />;
          })}
        </svg>

        {/* anchor, centred, on top */}
        <div className="absolute left-1/2 top-1/2 z-10" style={{ marginLeft: -(size * 0.17), marginTop: -(size * 0.17) }}>
          <div
            className="relative rounded-2xl overflow-hidden border-2 border-lime shadow-[0_12px_30px_-10px_rgba(215,255,63,0.5)] bg-paper-alt"
            style={{ width: size * 0.34, height: size * 0.34 * 1.25 }}
          >
            <Image src={anchor.imageUrl} alt={anchor.name} fill sizes={`${Math.round(size * 0.34)}px`} className="object-cover" />
          </div>
          <p className={cn("text-[9px] uppercase tracking-wide text-center mt-1 font-semibold text-ink")}>locked in ✦</p>
        </div>
      </div>

      <p className="mt-3 text-sm font-medium flex items-center gap-1.5 animate-fade-in" style={{ animationDelay: `${n * 80 + 150}ms` }}>
        <Spark className="h-3.5 w-3.5 text-lime" /> matched around {anchor.name.toLowerCase()}
      </p>
    </div>
  );
}
