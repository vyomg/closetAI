"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bookmark, RefreshCw, Trash2, Shirt, Share2, UserPlus, Shuffle, Sparkles, Shapes, Camera } from "lucide-react";
import { FeedbackButtons } from "@/components/FeedbackButtons";
import { ShareActions } from "@/components/ShareActions";
import { cn } from "@/lib/cn";
import type { OutfitDTO } from "@/lib/clientTypes";

const REMIX_OPTIONS = [
  { value: "change-shoes", label: "Change shoes" },
  { value: "change-top", label: "Change top" },
  { value: "add-outerwear", label: "Add outerwear" },
  { value: "remove-outerwear", label: "Remove outerwear" },
  { value: "more-formal", label: "More formal" },
  { value: "more-casual", label: "More casual" },
  { value: "weather-appropriate", label: "Weather appropriate" },
  { value: "different-colors", label: "Different colors" },
] as const;

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
  showSocialActions = false,
  onSaveToggle,
  onDelete,
  onWear,
  onRecreate,
  onRemixed,
}: {
  outfit: OutfitDTO;
  showFeedback?: boolean;
  showSocialActions?: boolean;
  onSaveToggle?: (next: boolean) => void;
  onDelete?: () => void;
  onWear?: () => void;
  onRecreate?: () => void;
  onRemixed?: (newOutfit: OutfitDTO) => void;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const [whyText, setWhyText] = useState<string | null>(null);
  const [loadingWhy, setLoadingWhy] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [askUrl, setAskUrl] = useState<string | null>(null);
  const [remixOpen, setRemixOpen] = useState(false);
  const [remixing, setRemixing] = useState(false);
  const [remixError, setRemixError] = useState<string | null>(null);
  const router = useRouter();

  async function share() {
    const res = await fetch(`/api/outfits/${outfit.id}/share`, { method: "POST" });
    const data = await res.json();
    if (res.ok) setShareUrl(data.url);
  }

  async function askFriend() {
    const res = await fetch(`/api/outfits/${outfit.id}/ask-friend`, { method: "POST" });
    const data = await res.json();
    if (res.ok) setAskUrl(data.url);
  }

  async function remix(instruction: string) {
    setRemixing(true);
    setRemixError(null);
    const res = await fetch(`/api/outfits/${outfit.id}/remix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction }),
    });
    const data = await res.json();
    setRemixing(false);
    setRemixOpen(false);
    if (!res.ok) {
      setRemixError(data.error || "Remix failed.");
      return;
    }
    onRemixed?.(data);
  }

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
    <div className="rounded-2xl border border-line bg-paper-alt overflow-hidden animate-fade-up">
      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-stone mb-1">
              {outfit.occasion} · {outfit.style}
            </p>
            <p className="font-display text-xl">
              {outfit.isManual ? "Styled by you" : `Score ${outfit.overallScore}%`}
            </p>
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
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-ink-soft hover:text-ink hover:bg-paper-alt transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Recreate
              </button>
            )}
            {showSocialActions && (
              <>
                <div className="relative">
                  <button
                    onClick={() => setRemixOpen((o) => !o)}
                    disabled={remixing}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-ink-soft hover:text-ink hover:bg-paper-alt transition-colors cursor-pointer"
                  >
                    <Shuffle className="h-3.5 w-3.5" /> {remixing ? "Remixing…" : "Remix"}
                  </button>
                  {remixOpen && (
                    <div className="absolute right-0 top-full mt-1.5 z-10 w-48 rounded-xl border border-line bg-paper-alt shadow-[0_8px_30px_-12px_rgba(23,22,15,0.25)] py-1.5">
                      {REMIX_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => remix(opt.value)}
                          className="w-full text-left px-3.5 py-2 text-sm hover:bg-paper-alt cursor-pointer"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={share}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-ink-soft hover:text-ink hover:bg-paper-alt transition-colors cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share
                </button>
                <button
                  onClick={askFriend}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-ink-soft hover:text-ink hover:bg-paper-alt transition-colors cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Ask a Friend
                </button>
              </>
            )}
            <button
              onClick={() => router.push(`/chat?aboutOutfit=${outfit.id}`)}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-ink-soft hover:text-ink hover:bg-paper-alt transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" /> Ask matchin&apos;
            </button>
            <button
              onClick={() => router.push(`/outfits/playground?seedOutfit=${outfit.id}`)}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-ink-soft hover:text-ink hover:bg-paper-alt transition-colors cursor-pointer"
            >
              <Shapes className="h-3.5 w-3.5" /> Playground
            </button>
            <button
              onClick={() => router.push("/try-on")}
              title="Virtual Try-On (coming soon)"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-ink-soft hover:text-ink hover:bg-paper-alt transition-colors cursor-pointer"
            >
              <Camera className="h-3.5 w-3.5" /> Try On
            </button>
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
                  <Image src={item.imageUrl} alt={item.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                </div>
                <p className="text-xs text-stone mt-2">{SLOT_LABEL[group.slot]}</p>
                <p className="text-sm font-medium truncate">{item.name}</p>
              </div>
            ))
          )}
        </div>

        {outfit.unmetConstraints && outfit.unmetConstraints.length > 0 && (
          <div className="mt-5 flex items-start gap-2 text-xs text-warning bg-warning/15 rounded-xl px-3.5 py-2.5">
            <Shirt className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{outfit.unmetConstraints.join(" ")}</span>
          </div>
        )}

        {!outfit.isManual && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            <ScorePill label="Style Match" value={outfit.styleMatch} />
            <ScorePill label="Occasion Match" value={outfit.occasionMatch} />
            <ScorePill label="Colour Harmony" value={outfit.colorHarmony} />
          </div>
        )}

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

        {remixError && <p className="mt-4 text-sm text-warning">{remixError}</p>}

        {shareUrl && (
          <div className="mt-4 rounded-xl bg-paper-alt p-4">
            <p className="text-sm font-medium mb-2.5">Share this outfit</p>
            <ShareActions url={shareUrl} title={`${outfit.occasion} outfit`} />
          </div>
        )}

        {askUrl && (
          <div className="mt-4 rounded-xl bg-paper-alt p-4">
            <p className="text-sm font-medium mb-2.5">Ask a friend — send them this link</p>
            <ShareActions url={askUrl} title="Should I wear this?" />
          </div>
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
