"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shuffle, Check, Pin, X, Sparkles, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Spark, BrandLoading } from "@/components/Brand";
import { FloatingWords } from "@/components/FloatingWords";
import { cn } from "@/lib/cn";
import { CATEGORY_TO_SLOT, type Category } from "@/lib/constants";
import type { ClothingItemDTO, OutfitDTO } from "@/lib/clientTypes";

// The main, always-visible outfit-building stack — outerwear is optional
// and shown first so it doesn't bump the core top/bottom/shoes slots around
// when it's empty; accessories get their own "+ Add Accessories" entry
// point below instead of a slot in this stack, since an outfit can carry
// more than zero but the user picks at most one at a time there.
const MAIN_SLOTS = ["outerwear", "top", "bottom", "shoes"] as const;
const SLOT_LABEL: Record<string, string> = {
  top: "Top",
  bottom: "Bottom",
  outerwear: "Outerwear",
  shoes: "Shoes",
  accessory: "Accessory",
};

const ASK_PRESETS = ["Improve this", "More casual", "More formal", "More streetwear", "More minimal", "Make it warmer"];

// Outfit Playground — a genuine MANUAL outfit-building tool, not an AI
// feature. Every wardrobe category gets its own swipeable carousel of real
// photos (tap or swipe through alternatives, tap to pick); pinning a piece
// locks it in. Saving and building an outfit here never requires Gemini —
// "Ask matchin'" exists purely as an optional, collapsed-by-default extra
// that reuses the exact same /api/outfits/generate pipeline every other
// "ask matchin'" surface uses (no second AI system), never the default path.
export default function OutfitPlaygroundPage() {
  return (
    <Suspense>
      <OutfitPlaygroundInner />
    </Suspense>
  );
}

function OutfitPlaygroundInner() {
  const searchParams = useSearchParams();
  const seedOutfitId = searchParams.get("seedOutfit");

  const [wardrobe, setWardrobe] = useState<ClothingItemDTO[] | null>(null);
  const [picks, setPicks] = useState<Record<string, ClothingItemDTO | null>>({});
  const [pinnedSlot, setPinnedSlot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [accessoryOpen, setAccessoryOpen] = useState(false);
  const [accessoryDraft, setAccessoryDraft] = useState<ClothingItemDTO | null>(null);

  const [askOpen, setAskOpen] = useState(false);
  const [askText, setAskText] = useState("");
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clothing")
      .then((r) => r.json())
      .then(setWardrobe);
  }, []);

  useEffect(() => {
    if (!seedOutfitId) return;
    fetch(`/api/outfits/${seedOutfitId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((outfit: OutfitDTO | null) => {
        if (!outfit) return;
        const next: Record<string, ClothingItemDTO | null> = {};
        for (const item of outfit.items) {
          if (item.slot) next[item.slot] = item as ClothingItemDTO;
        }
        setPicks(next);
      });
  }, [seedOutfitId]);

  const bySlot = useMemo(() => {
    const map: Record<string, ClothingItemDTO[]> = {};
    for (const item of wardrobe ?? []) {
      const slot = CATEGORY_TO_SLOT[item.category as Category];
      if (!slot) continue;
      (map[slot] ??= []).push(item);
    }
    return map;
  }, [wardrobe]);

  const filledSlots = [...MAIN_SLOTS, "accessory"].filter((s) => picks[s]);
  const activeMainSlots = MAIN_SLOTS.filter((s) => (bySlot[s]?.length ?? 0) > 0);

  function pick(slot: string, item: ClothingItemDTO | null) {
    setSaved(null);
    setPicks((p) => ({ ...p, [slot]: item }));
  }

  function togglePin(slot: string) {
    setPinnedSlot((cur) => (cur === slot ? null : slot));
  }

  function shuffleAll() {
    setSaved(null);
    setPicks((prev) => {
      const next: Record<string, ClothingItemDTO | null> = { ...prev };
      for (const slot of activeMainSlots) {
        if (slot === pinnedSlot) continue;
        const options = bySlot[slot] ?? [];
        next[slot] = options.length ? options[Math.floor(Math.random() * options.length)] : null;
      }
      return next;
    });
  }

  async function save() {
    if (filledSlots.length === 0) return;
    setSaving(true);
    const res = await fetch("/api/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        occasion: "Everyday",
        style: "Custom",
        items: filledSlots.map((s) => ({ clothingItemId: picks[s]!.id, slot: s })),
      }),
    });
    setSaving(false);
    if (res.ok) setSaved("Saved to My Outfits.");
  }

  async function askMatchin(instruction: string) {
    if (!instruction.trim()) return;
    setAsking(true);
    setAskError(null);
    setAiNote(null);

    const currentDescription = filledSlots.map((s) => `${SLOT_LABEL[s]}: ${picks[s]!.name}`).join(", ");
    const notes = currentDescription
      ? `The user is currently trying: ${currentDescription}. ${instruction}. Build a complete outfit reflecting this.`
      : instruction;

    const res = await fetch("/api/outfits/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        occasion: "Everyday",
        desiredStyle: "Custom",
        notes,
        anchorItemId: pinnedSlot ? picks[pinnedSlot]?.id : undefined,
      }),
    });
    const data = await res.json();
    setAsking(false);

    if (!res.ok) {
      setAskError(data.error || "Couldn't do that — try again.");
      return;
    }

    const next: Record<string, ClothingItemDTO | null> = {};
    for (const item of data.items) {
      if (item.slot) next[item.slot] = item;
    }
    setPicks(next);
    setAiNote(data.explanation);
    setAskText("");
  }

  if (!wardrobe) return <BrandLoading />;

  if (wardrobe.length === 0) {
    return (
      <div className="max-w-lg">
        <h1 className="font-display text-4xl mb-2">Outfit Playground</h1>
        <p className="text-stone mb-6">Your closet&apos;s looking a little empty.</p>
        <p className="text-sm text-ink-soft mb-6">Add a few pieces and we&apos;ll start cookin&apos; fits.</p>
        <Link href="/wardrobe/add">
          <Button variant="lime">
            <Spark className="h-4 w-4 mr-1.5" /> Add clothes
          </Button>
        </Link>
      </div>
    );
  }

  const accessoryOptions = bySlot.accessory ?? [];

  return (
    <div className="max-w-2xl">
      <div className="relative rounded-2xl bg-graphite text-white p-5 sm:p-6 mb-6">
        <FloatingWords words={["MIX", "DRAG", "REMIX", "PLAY"]} />
        <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-2 relative">outfit playground</p>
        <h1 className="font-display text-2xl sm:text-3xl mb-1.5 relative">mix it yourself.</h1>
        <p className="text-sm text-white/50 relative max-w-md">
          Swipe through your real pieces, tap to pick, pin one to lock it in. No AI needed.
        </p>
      </div>

      <div className="space-y-5">
        {MAIN_SLOTS.map((slot) => (
          <CategoryRow
            key={slot}
            slot={slot}
            items={bySlot[slot] ?? []}
            picked={picks[slot] ?? null}
            onPick={(item) => pick(slot, item)}
            pinned={pinnedSlot === slot}
            onTogglePin={() => togglePin(slot)}
          />
        ))}

        {/* Accessories — optional, picked one at a time via a short sheet
            rather than a permanent slot in the main stack above. */}
        <div>
          {picks.accessory ? (
            <div className="rounded-2xl border border-line bg-paper-alt p-3 flex items-center gap-3">
              <div className="relative h-14 w-11 shrink-0 rounded-lg overflow-hidden border border-line">
                <Image src={picks.accessory.imageUrl} alt={picks.accessory.name} fill sizes="44px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wide text-stone">Accessory</p>
                <p className="text-sm font-medium truncate">{picks.accessory.name}</p>
              </div>
              <button
                onClick={() => {
                  setAccessoryDraft(picks.accessory);
                  setAccessoryOpen(true);
                }}
                className="shrink-0 text-xs text-ink-soft hover:text-ink underline underline-offset-4 cursor-pointer"
              >
                Change
              </button>
              <button
                onClick={() => pick("accessory", null)}
                className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-stone hover:text-warning cursor-pointer"
                aria-label="Remove accessory"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setAccessoryDraft(null);
                setAccessoryOpen(true);
              }}
              disabled={accessoryOptions.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line py-5 text-sm text-stone hover:border-ink/30 hover:text-ink-soft transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" /> Add Accessories
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2.5 pt-1">
          <Button variant="outline" onClick={shuffleAll} disabled={activeMainSlots.length === 0} className="flex-1">
            <Shuffle className="h-4 w-4 mr-1.5" /> Shuffle outfit
          </Button>
          <Button onClick={save} disabled={filledSlots.length === 0 || saving} className="flex-1">
            {saving ? "Saving…" : "Save this outfit"}
          </Button>
        </div>
        {saved && (
          <p className="text-sm text-success flex items-center gap-1.5">
            <Spark className="h-3.5 w-3.5" /> {saved}{" "}
            <Link href="/outfits" className="underline underline-offset-4">
              View
            </Link>
          </p>
        )}

        {/* Ask matchin' — optional AI help, collapsed by default. The
            playground itself never requires this: everything above works
            with zero Gemini calls. */}
        <div className="rounded-2xl border border-line bg-paper-alt overflow-hidden">
          <button
            onClick={() => setAskOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-xs uppercase tracking-wide text-stone cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Ask matchin&apos; (optional)
            </span>
            {askOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {askOpen && (
            <div className="px-5 pb-5 animate-fade-in">
              <div className="flex flex-wrap gap-2 mb-3">
                {ASK_PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => askMatchin(p)}
                    disabled={asking}
                    className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-ink/40 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={askText}
                  onChange={(e) => setAskText(e.target.value)}
                  placeholder="e.g. Would this work for a party?"
                  onKeyDown={(e) => e.key === "Enter" && askMatchin(askText)}
                />
                <Button onClick={() => askMatchin(askText)} disabled={!askText.trim() || asking}>
                  {asking ? "…" : "Ask"}
                </Button>
              </div>
              {pinnedSlot && (
                <p className="text-xs text-stone mt-2.5">{SLOT_LABEL[pinnedSlot]} is pinned — matchin&apos; will build around it.</p>
              )}
              {askError && <p className="text-sm text-warning mt-3">{askError}</p>}
              {aiNote && <p className="text-sm text-ink-soft mt-3 leading-relaxed">{aiNote}</p>}
              <p className="text-xs text-stone mt-3">Asking matchin&apos; uses 1 credit.</p>
            </div>
          )}
        </div>
      </div>

      {accessoryOpen && (
        <AccessorySheet
          options={accessoryOptions}
          draft={accessoryDraft}
          onDraft={setAccessoryDraft}
          onClose={() => setAccessoryOpen(false)}
          onIgnore={() => {
            pick("accessory", null);
            setAccessoryOpen(false);
          }}
          onUse={() => {
            pick("accessory", accessoryDraft);
            setAccessoryOpen(false);
          }}
        />
      )}
    </div>
  );
}

// One wardrobe category as a swipeable, tap-to-pick carousel — native
// horizontal scroll (so it's genuinely touch-swipeable, not a custom
// pointer-drag reimplementation), each card a real `<button>` so Tab+Enter
// reaches every alternative without any bespoke keyboard handling.
function CategoryRow({
  slot,
  items,
  picked,
  onPick,
  pinned,
  onTogglePin,
}: {
  slot: string;
  items: ClothingItemDTO[];
  picked: ClothingItemDTO | null;
  onPick: (item: ClothingItemDTO) => void;
  pinned: boolean;
  onTogglePin: () => void;
}) {
  if (items.length === 0) {
    return (
      <Link
        href="/wardrobe/add"
        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line py-6 text-sm text-stone hover:border-ink/30 hover:text-ink-soft transition-colors"
      >
        <Plus className="h-4 w-4" /> Add {SLOT_LABEL[slot]} to Wardrobe
      </Link>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-0.5">
        <p className="text-xs uppercase tracking-wide text-stone">{SLOT_LABEL[slot]}</p>
        {picked && (
          <button
            onClick={onTogglePin}
            className={cn(
              "inline-flex items-center gap-1 text-xs cursor-pointer transition-colors",
              pinned ? "text-lime" : "text-stone hover:text-ink-soft"
            )}
          >
            <Pin className="h-3 w-3" /> {pinned ? "Pinned" : "Pin"}
          </button>
        )}
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory scroll-px-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {items.map((item) => {
          const active = picked?.id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPick(item)}
              className={cn(
                "relative shrink-0 snap-start w-28 sm:w-32 aspect-[4/5] rounded-xl overflow-hidden border-2 transition-colors cursor-pointer",
                active ? "border-lime" : "border-line hover:border-ink/30"
              )}
            >
              <Image src={item.imageUrl} alt={item.name} fill sizes="128px" className="object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-ink/70 to-transparent px-2 py-1.5">
                <p className="text-white text-[11px] font-medium truncate">{item.name}</p>
              </div>
              {active && (
                <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-lime text-lime-ink flex items-center justify-center">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
              {active && pinned && (
                <span className="absolute top-1.5 left-1.5 h-5 w-5 rounded-full bg-paper/90 flex items-center justify-center text-lime">
                  <Pin className="h-2.5 w-2.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AccessorySheet({
  options,
  draft,
  onDraft,
  onClose,
  onIgnore,
  onUse,
}: {
  options: ClothingItemDTO[];
  draft: ClothingItemDTO | null;
  onDraft: (item: ClothingItemDTO | null) => void;
  onClose: () => void;
  onIgnore: () => void;
  onUse: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div
        className="bg-paper rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[75vh] overflow-y-auto p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl">Add Accessories</h3>
          <button onClick={onClose} className="cursor-pointer p-1 -m-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {options.map((item) => {
            const active = draft?.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onDraft(active ? null : item)}
                className={cn(
                  "relative text-left rounded-xl overflow-hidden border-2 transition-colors cursor-pointer",
                  active ? "border-lime" : "border-line hover:border-ink/30"
                )}
              >
                <div className="relative aspect-square bg-paper-alt">
                  <Image src={item.imageUrl} alt={item.name} fill sizes="120px" className="object-cover" />
                  {active && (
                    <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-lime text-lime-ink flex items-center justify-center">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className="text-xs p-1.5 truncate">{item.name}</p>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2.5">
          <Button variant="ghost" onClick={onIgnore} className="flex-1">
            Ignore Accessories
          </Button>
          <Button onClick={onUse} disabled={!draft} className="flex-1">
            Use Accessories
          </Button>
        </div>
      </div>
    </div>
  );
}
