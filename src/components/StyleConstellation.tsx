"use client";

import { useMemo, useState } from "react";
import { Spark } from "@/components/Brand";
import { cn } from "@/lib/cn";
import type { StyleDNA } from "@/lib/styleDNA";
import type { LearnedPreferences } from "@/lib/types";

type Node = {
  id: string;
  label: string;
  detail: string;
  weight: number; // 0-1, drives size/brightness — never fabricated
};

// Deterministic "organic" placement — seeded by index, not Math.random(), so
// the constellation doesn't reshuffle on every re-render/fetch.
function positionFor(i: number, total: number, seedJitter: number) {
  const angle = (i / total) * 360 + seedJitter * 23;
  const radius = 72 + ((i * 37) % 30); // 72-102, varies per node for an organic (not perfect-circle) feel
  const rad = (angle * Math.PI) / 180;
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

function formatAttrLabel(key: string): string {
  const [prefix, value] = key.split(":");
  if (!value) return key;
  if (prefix === "formality") return value.replace("-", " ").toUpperCase();
  return value.toUpperCase();
}

export function StyleConstellation({
  dna,
  learnedPreferences,
}: {
  dna: StyleDNA;
  learnedPreferences: LearnedPreferences;
}) {
  const [active, setActive] = useState<string | null>(null);

  const nodes = useMemo<Node[]>(() => {
    const out: Node[] = [];

    // Axis nodes — only when the axis is actually skewed enough to say
    // something real (near-50 means "no strong signal yet", so we stay quiet).
    if (Math.abs(dna.formalityAxis - 50) >= 15) {
      const formal = dna.formalityAxis > 50;
      out.push({
        id: "axis-formality",
        label: formal ? "POLISHED" : "CASUAL",
        detail: `${formal ? dna.formalityAxis : 100 - dna.formalityAxis}% of your style signal leans ${formal ? "formal" : "casual"}.`,
        weight: Math.abs(dna.formalityAxis - 50) / 50,
      });
    }
    if (Math.abs(dna.expressivenessAxis - 50) >= 15) {
      const expressive = dna.expressivenessAxis > 50;
      out.push({
        id: "axis-expressive",
        label: expressive ? "BOLD" : "MINIMAL",
        detail: expressive ? "You lean toward expressive colour and pattern choices." : "You lean toward a minimal, pared-back palette.",
        weight: Math.abs(dna.expressivenessAxis - 50) / 50,
      });
    }
    if (Math.abs(dna.tailoredAxis - 50) >= 15) {
      const tailored = dna.tailoredAxis > 50;
      out.push({
        id: "axis-tailored",
        label: tailored ? "TAILORED" : "SPORTY",
        detail: tailored ? "Your fit preferences lean structured and tailored." : "Your fit preferences lean relaxed and sporty.",
        weight: Math.abs(dna.tailoredAxis - 50) / 50,
      });
    }

    // Learned attributes — real counts from actual outfit feedback, nothing invented.
    const topLiked = Object.entries(learnedPreferences.likedAttributes)
      .filter(([k]) => !out.some((n) => n.label === formatAttrLabel(k)))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const maxWeight = Math.max(1, ...topLiked.map(([, w]) => w));
    for (const [key, weight] of topLiked) {
      out.push({
        id: `learned-${key}`,
        label: formatAttrLabel(key),
        detail: `Liked in ${weight} outfit${weight === 1 ? "" : "s"} you rated.`,
        weight: 0.4 + (weight / maxWeight) * 0.6,
      });
    }

    // Explicit style tags the user chose themselves, if we still have room
    // and they're not already represented.
    for (const tag of dna.styleTags) {
      if (out.length >= 8) break;
      const label = tag.toUpperCase();
      if (out.some((n) => n.label === label)) continue;
      out.push({ id: `tag-${tag}`, label, detail: "A style you told matchin' you wear.", weight: 0.55 });
    }

    return out.slice(0, 8);
  }, [dna, learnedPreferences]);

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Spark className="h-8 w-8 text-lime mb-4" />
        <p className="font-display text-lg lowercase text-white">your style dna is still forming</p>
        <p className="text-sm text-white/40 mt-1 max-w-xs">Set a few preferences and rate some outfits — your constellation fills in from there.</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto" style={{ width: 320, height: 320 }}>
      <svg viewBox="-160 -160 320 320" className="w-full h-full overflow-visible">
        {nodes.map((n, i) => {
          const pos = positionFor(i, nodes.length, i);
          return (
            <line
              key={`line-${n.id}`}
              x1={0}
              y1={0}
              x2={pos.x}
              y2={pos.y}
              stroke="#ffffff"
              strokeWidth={1}
              opacity={active === n.id ? 0.5 : 0.15}
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-9 w-9 rounded-full bg-lime flex items-center justify-center">
          <Spark className="h-4 w-4 text-lime-ink" />
        </div>
      </div>

      {nodes.map((n, i) => {
        const pos = positionFor(i, nodes.length, i);
        const size = 44 + n.weight * 30;
        const isActive = active === n.id;
        return (
          <button
            key={n.id}
            onMouseEnter={() => setActive(n.id)}
            onMouseLeave={() => setActive((a) => (a === n.id ? null : a))}
            onClick={() => setActive((a) => (a === n.id ? null : n.id))}
            className={cn(
              "absolute flex items-center justify-center rounded-full border text-center transition-all cursor-pointer",
              "left-1/2 top-1/2",
              isActive ? "bg-lime text-lime-ink border-lime z-10" : "bg-white/10 text-white border-white/15 hover:border-white/40"
            )}
            style={{
              width: size,
              height: size,
              marginLeft: pos.x - size / 2,
              marginTop: pos.y - size / 2,
              opacity: 0.55 + n.weight * 0.45,
            }}
          >
            <span className="text-[9px] font-semibold uppercase tracking-tight px-1 leading-[1.1]">{n.label}</span>
          </button>
        );
      })}

      {active && (
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 translate-y-full w-56 text-center animate-fade-in">
          <p className="text-xs text-white/60 leading-relaxed">{nodes.find((n) => n.id === active)?.detail}</p>
        </div>
      )}
    </div>
  );
}
