"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Loader2 } from "lucide-react";
import type { HomeRecentOutfit } from "@/components/home/types";

type FlatOutfit = {
  id: string;
  occasion: string;
  overallScore: number;
  items: { id: string; imageUrl: string }[];
};

function flatten(outfit: HomeRecentOutfit | null): FlatOutfit | null {
  if (!outfit) return null;
  return {
    id: outfit.id,
    occasion: outfit.occasion,
    overallScore: outfit.overallScore,
    items: outfit.items.map((oi) => ({ id: oi.id, imageUrl: oi.clothingItem.imageUrl })),
  };
}

export function TodaysOutfitCard({ initial, compact = false }: { initial: HomeRecentOutfit | null; compact?: boolean }) {
  const [outfit, setOutfit] = useState<FlatOutfit | null>(flatten(initial));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/outfits/today", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Couldn't put together today's outfit.");
      return;
    }
    // The API returns flat items ({id, imageUrl, name, ...}), already
    // matching FlatOutfit's shape — no clothingItem nesting to unwrap here.
    setOutfit({ id: data.id, occasion: data.occasion, overallScore: data.overallScore, items: data.items });
  }

  if (loading) {
    return (
      <div className={compact ? "rounded-2xl border border-line bg-paper-alt p-4 flex items-center gap-3" : "rounded-xl border border-dashed border-line py-10 text-center"}>
        <Loader2 className="h-4 w-4 animate-spin text-ink-soft mx-auto" />
        {!compact && <p className="text-sm text-stone mt-2">Styling today's outfit…</p>}
      </div>
    );
  }

  if (!outfit) {
    return (
      <div className={compact ? "" : "rounded-xl border border-dashed border-line py-10 text-center"}>
        {compact ? (
          <button
            onClick={generate}
            className="w-full rounded-2xl border border-dashed border-line py-8 flex flex-col items-center justify-center text-center gap-2 cursor-pointer"
          >
            <p className="text-ink-soft text-sm">No outfit yet today.</p>
            <span className="text-sm font-medium underline underline-offset-4">Create one</span>
          </button>
        ) : (
          <>
            <p className="text-ink-soft mb-4">No outfit yet today.</p>
            <button
              onClick={generate}
              className="inline-flex items-center justify-center rounded-full bg-ink text-paper px-5 py-2.5 text-sm font-medium cursor-pointer hover:bg-ink-soft transition-colors"
            >
              <Sparkles className="h-4 w-4 mr-1.5" /> Create one
            </button>
          </>
        )}
        {error && <p className="text-sm text-warning mt-3">{error}</p>}
      </div>
    );
  }

  const content = compact ? (
    <Link href="/outfits" className="rounded-2xl border border-line bg-paper-alt p-4 flex items-center gap-3 hover:border-ink/30 transition-colors block">
      <div className="flex gap-2 shrink-0">
        {outfit.items.slice(0, 3).map((oi) => (
          <div key={oi.id} className="relative aspect-[4/5] w-14 rounded-lg overflow-hidden bg-paper-alt border border-line">
            <Image src={oi.imageUrl} alt="" fill sizes="56px" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{outfit.occasion}</p>
        <p className="text-xs text-stone mt-0.5">Score {outfit.overallScore}%</p>
      </div>
    </Link>
  ) : (
    <div className="flex items-center gap-4">
      <div className="flex gap-2.5">
        {outfit.items.slice(0, 4).map((oi) => (
          <div key={oi.id} className="relative aspect-[4/5] w-20 rounded-xl overflow-hidden bg-paper-alt shrink-0 border border-line">
            <Image src={oi.imageUrl} alt="" fill sizes="80px" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{outfit.occasion}</p>
        <p className="text-sm text-stone mt-1">Score {outfit.overallScore}%</p>
      </div>
    </div>
  );

  return content;
}
