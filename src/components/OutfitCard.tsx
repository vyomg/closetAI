"use client";

import { useState } from "react";
import Image from "next/image";
import { Bookmark, RefreshCw, Trash2, Shirt } from "lucide-react";
import { FeedbackButtons } from "@/components/FeedbackButtons";
import { cn } from "@/lib/cn";
import type { OutfitDTO } from "@/lib/clientTypes";

const SLOT_ORDER = ["outerwear", "top", "bottom", "shoes", "accessory"];
const SLOT_LABEL: Record<string, string> = {
  outerwear: "Outerwear",
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  accessory: "Accessory",
};

export function OutfitCard({
  outfit,
  showFeedback = true,
  onSaveToggle,
  onDelete,
  onWear,
  onRecreate,
}: {
  outfit: OutfitDTO;
  showFeedback?: boolean;
  onSaveToggle?: (next: boolean) => void;
  onDelete?: () => void;
  onWear?: () => void;
  onRecreate?: () => void;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const [whyText, setWhyText] = useState<string | null>(null);
  const [loadingWhy, setLoadingWhy] = useState(false);

  const grouped = SLOT_ORDER.map((slot) => ({
    slot,
    items: outfit.items.filter((i) => i.slot === slot),
  })).filter((g) => g.items.length > 0);

  async function toggleWhy() {
    setShowWhy((s) => !s);
    if (!whyText && !loadingWhy) {
      setLoadingWhy(true);
      const res = await fetch(`/api/outfits/${outfit.id}/explain`, { method: "POST" });
      const data = await res.json();
      setWhyText(data.explanation);
      setLoadingWhy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white overflow-hidden animate-fade-up">
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-stone mb-1">
              {outfit.occasion} · {outfit.style}
            </p>
            <p className="font-display text-xl">Score {outfit.overallScore}%</p>
          </div>
          <div className="flex items-center gap-2">
            {onSaveToggle && (
              <button
                onClick={() => onSaveToggle(!outfit.isSaved)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors cursor-pointer",
                  outfit.isSaved ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/40"
                )}
              >
                <Bookmark className="h-3.5 w-3.5" fill={outfit.isSaved ? "currentColor" : "none"} />
                {outfit.isSaved ? "Saved" : "Save"}
              </button>
            )}
            {onRecreate && (
              <button
                onClick={onRecreate}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs hover:border-ink/40 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Recreate
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-warning hover:border-warning transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {grouped.map((group) =>
            group.items.map((item) => (
              <div key={item.id}>
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-line bg-paper-alt">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                </div>
                <p className="text-xs text-stone mt-2">{SLOT_LABEL[group.slot]}</p>
                <p className="text-sm font-medium truncate">{item.name}</p>
              </div>
            ))
          )}
        </div>

        {outfit.unmetConstraints && outfit.unmetConstraints.length > 0 && (
          <div className="mt-5 flex items-start gap-2 text-xs text-warning bg-[#f4e6d8] rounded-xl px-3.5 py-2.5">
            <Shirt className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{outfit.unmetConstraints.join(" ")}</span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-3">
          <ScorePill label="Style Match" value={outfit.styleMatch} />
          <ScorePill label="Occasion Match" value={outfit.occasionMatch} />
          <ScorePill label="Colour Harmony" value={outfit.colorHarmony} />
        </div>

        <p className="mt-6 text-sm text-ink-soft leading-relaxed">{outfit.explanation}</p>

        <div className="mt-4">
          <button onClick={toggleWhy} className="text-sm underline underline-offset-4 text-ink-soft hover:text-ink cursor-pointer">
            Why this outfit?
          </button>
          {showWhy && (
            <div className="mt-3 rounded-xl bg-paper-alt p-4 text-sm text-ink-soft leading-relaxed animate-fade-in">
              {loadingWhy ? "Thinking it through…" : whyText}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
          {showFeedback && <FeedbackButtons outfitId={outfit.id} initialFeedback={outfit.feedback} />}
          {onWear && (
            <button
              onClick={onWear}
              className="text-sm text-ink-soft hover:text-ink underline underline-offset-4 cursor-pointer"
            >
              Mark as worn today
            </button>
          )}
        </div>

        {outfit.lastWornAt && (
          <p className="mt-3 text-xs text-stone">Last worn {new Date(outfit.lastWornAt).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-paper-alt px-3 py-3 text-center">
      <p className="font-display text-xl">{value}%</p>
      <p className="text-[11px] text-stone mt-0.5">{label}</p>
    </div>
  );
}
