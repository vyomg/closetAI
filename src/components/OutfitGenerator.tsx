"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Sparkles, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { StyleSelector } from "@/components/StyleSelector";
import { ImportanceScale } from "@/components/ImportanceScale";
import { OutfitCard } from "@/components/OutfitCard";
import { MatchinWheel } from "@/components/MatchinWheel";
import { MatchinOrbit } from "@/components/MatchinOrbit";
import { Spark } from "@/components/Brand";
import { OCCASIONS, DESIRED_STYLES, ADVENTURE_LEVELS } from "@/lib/constants";
import type { ClothingItemDTO, OutfitDTO } from "@/lib/clientTypes";

const WHEEL_SEGMENTS = ["STREET", "CLEAN", "SMART", "BOLD", "CASUAL", "CHILL", "DATE NIGHT", "SURPRISE ME"];

// Maps a wheel vibe onto the exact same occasion/style/adventure vocabulary
// the manual form already uses (lib/constants OCCASIONS/DESIRED_STYLES) —
// spinning is a shortcut into the same real generation pipeline, not a
// separate system.
const VIBE_PRESETS: Record<string, { occasion: string; style: string; adventure: number }> = {
  STREET: { occasion: "Casual", style: "Streetwear", adventure: 4 },
  CLEAN: { occasion: "Smart Casual", style: "Minimal", adventure: 2 },
  SMART: { occasion: "Business", style: "Smart Casual", adventure: 2 },
  BOLD: { occasion: "Party", style: "Trendy", adventure: 5 },
  CASUAL: { occasion: "Everyday", style: "Relaxed", adventure: 2 },
  CHILL: { occasion: "Casual", style: "Relaxed", adventure: 1 },
  "DATE NIGHT": { occasion: "Date", style: "Smart Casual", adventure: 3 },
};

export function OutfitGenerator({
  initialAnchorId,
  autoGenerate,
}: {
  initialAnchorId?: string;
  autoGenerate?: "today" | "surprise" | null;
}) {
  const [occasion, setOccasion] = useState("Everyday");
  const [customOccasion, setCustomOccasion] = useState("");
  const [style, setStyle] = useState("Custom");
  const [customStyle, setCustomStyle] = useState("");
  const [notes, setNotes] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [adventureLevel, setAdventureLevel] = useState(3);
  const [anchorItem, setAnchorItem] = useState<ClothingItemDTO | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [wardrobe, setWardrobe] = useState<ClothingItemDTO[] | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OutfitDTO | null>(null);

  const [wheelOpen, setWheelOpen] = useState(false);
  const [landedVibe, setLandedVibe] = useState<string | null>(null);

  useEffect(() => {
    if (initialAnchorId) {
      fetch(`/api/clothing/${initialAnchorId}`)
        .then((r) => r.json())
        .then(setAnchorItem);
    }
  }, [initialAnchorId]);

  useEffect(() => {
    if (autoGenerate === "today") generate({ occasionOverride: "Everyday" });
    if (autoGenerate === "surprise") generate({ surprise: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate]);

  function openPicker() {
    setPickerOpen(true);
    if (!wardrobe) {
      fetch("/api/clothing")
        .then((r) => r.json())
        .then(setWardrobe);
    }
  }

  async function generate(opts?: {
    surprise?: boolean;
    occasionOverride?: string;
    styleOverride?: string;
    adventureOverride?: number;
  }) {
    setLoading(true);
    setError(null);
    setResult(null);

    const finalOccasion = opts?.occasionOverride ?? (occasion === "Custom" ? customOccasion : occasion);
    const finalStyle = opts?.styleOverride ?? (style === "Custom" ? customStyle || "Whatever works best" : style);

    const res = await fetch("/api/outfits/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        occasion: finalOccasion || "Everyday",
        desiredStyle: finalStyle,
        notes,
        adventureLevel: opts?.adventureOverride ?? adventureLevel,
        anchorItemId: anchorItem?.id,
        surprise: opts?.surprise ?? false,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Couldn't generate an outfit. Please try again.");
      return;
    }
    setResult(data);
  }

  function handleVibeLand(vibe: string) {
    setLandedVibe(vibe);
    if (vibe === "SURPRISE ME") {
      generate({ surprise: true });
      return;
    }
    const preset = VIBE_PRESETS[vibe];
    if (!preset) return;
    setOccasion(preset.occasion);
    setStyle(preset.style);
    setAdventureLevel(preset.adventure);
    generate({ occasionOverride: preset.occasion, styleOverride: preset.style, adventureOverride: preset.adventure });
  }

  return (
    <div className="grid lg:grid-cols-[420px_1fr] gap-10">
      <div>
        <div className="rounded-2xl bg-graphite text-white p-5 mb-6">
          <button
            onClick={() => setWheelOpen((o) => !o)}
            className="w-full flex items-center justify-between cursor-pointer"
          >
            <span className="font-display text-lg lowercase flex items-center gap-1.5">
              <Spark className="h-4 w-4 text-lime" /> what are you feelin&apos;?
            </span>
            <ChevronDown className={`h-4 w-4 text-white/50 transition-transform ${wheelOpen ? "rotate-180" : ""}`} />
          </button>
          {wheelOpen && (
            <div className="mt-5 animate-fade-in">
              <MatchinWheel segments={WHEEL_SEGMENTS} onLand={handleVibeLand} size={240} />
              {landedVibe && (
                <p className="text-center text-xs text-white/40 mt-4 lowercase">
                  landed on <span className="text-lime">{landedVibe.toLowerCase()}</span> — building your fit below
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <Label>Occasion</Label>
            <StyleSelector
              options={[...OCCASIONS, "Custom"]}
              selected={[occasion]}
              onChange={(v) => setOccasion(v[0])}
              multiple={false}
            />
            {occasion === "Custom" && (
              <Input
                className="mt-3"
                placeholder="Describe the occasion"
                value={customOccasion}
                onChange={(e) => setCustomOccasion(e.target.value)}
              />
            )}
          </div>

          <div>
            <Label>Desired style</Label>
            <StyleSelector
              options={[...DESIRED_STYLES, "Custom"]}
              selected={[style]}
              onChange={(v) => setStyle(v[0])}
              multiple={false}
            />
            {style === "Custom" && (
              <Input
                className="mt-3"
                placeholder="Describe the style you're going for"
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
              />
            )}
          </div>

          <div>
            <Label>
              Adventure level — {ADVENTURE_LEVELS[adventureLevel - 1].label}
            </Label>
            <ImportanceScale value={adventureLevel} onChange={setAdventureLevel} lowLabel="Very safe" highLabel="Bold" />
          </div>

          <button
            onClick={() => setShowMore((s) => !s)}
            className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink cursor-pointer"
          >
            More options
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showMore ? "rotate-180" : ""}`} />
          </button>

          {showMore && (
            <div className="animate-fade-in -mt-2">
              <Label>Anything specific?</Label>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. I want to wear my white sneakers. Keep it comfortable."
              />
            </div>
          )}

          <div>
            <Label>Style me with this (optional)</Label>
            {anchorItem ? (
              <div className="flex items-center gap-3 rounded-xl border-2 border-lime bg-lime/10 p-2.5">
                <div className="relative h-14 w-11 rounded-lg overflow-hidden bg-paper-alt shrink-0">
                  <Image src={anchorItem.imageUrl} alt={anchorItem.name} fill sizes="44px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wide font-semibold flex items-center gap-1">
                    locked in <Spark className="h-2.5 w-2.5 text-lime" />
                  </p>
                  <p className="text-sm truncate">{anchorItem.name}</p>
                </div>
                <button onClick={() => setAnchorItem(null)} className="text-stone hover:text-ink cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={openPicker}>
                I want to wear…
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button size="lg" onClick={() => generate()} disabled={loading} className="flex-1">
              {loading ? "Styling your outfit…" : "Create an Outfit"}
            </Button>
            <Button variant="outline" size="lg" onClick={() => generate({ surprise: true })} disabled={loading}>
              <Sparkles className="h-4 w-4 mr-1.5" /> Surprise Me
            </Button>
          </div>

          {error && <p className="text-sm text-warning">{error}</p>}
        </div>
      </div>

      <div>
        {loading && <GeneratingState />}
        {!loading && result && anchorItem && result.items.some((i) => i.id === anchorItem.id) && (
          <div className="rounded-2xl border border-line bg-paper-alt p-6 mb-5">
            <MatchinOrbit
              anchor={result.items.find((i) => i.id === anchorItem.id)!}
              orbiting={result.items.filter((i) => i.id !== anchorItem.id)}
            />
          </div>
        )}
        {!loading && result && <OutfitCard outfit={result} showFeedback />}
        {!loading && !result && !error && <IdleState />}
      </div>

      {pickerOpen && wardrobe && (
        <ItemPickerModal
          items={wardrobe}
          onClose={() => setPickerOpen(false)}
          onSelect={(item) => {
            setAnchorItem(item);
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}

function IdleState() {
  return (
    <div className="h-full min-h-[420px] rounded-2xl border border-dashed border-line flex items-center justify-center text-center p-10">
      <div>
        <p className="font-display text-2xl mb-2">Your outfit will appear here.</p>
        <p className="text-stone text-sm">Set your preferences and let matchin' style something from your wardrobe.</p>
      </div>
    </div>
  );
}

const THINKING_STEPS = ["checking your wardrobe...", "balancing colours...", "building your fit..."];

function GeneratingState() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStepIndex((i) => (i + 1) % THINKING_STEPS.length), 1100);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl border border-line bg-paper-alt p-7">
      <p className="font-display text-lg lowercase mb-5 flex items-center gap-1.5">
        matchin&apos;s thinkin&apos; <Spark className="h-3.5 w-3.5 text-lime animate-spark-spin" />
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] rounded-xl bg-charcoal animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
      <p className="text-sm text-stone mt-6 lowercase">{THINKING_STEPS[stepIndex]}</p>
    </div>
  );
}

function ItemPickerModal({
  items,
  onClose,
  onSelect,
}: {
  items: ClothingItemDTO[];
  onClose: () => void;
  onSelect: (item: ClothingItemDTO) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div
        className="bg-paper rounded-t-3xl sm:rounded-2xl max-w-3xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl">Choose an item</h3>
          <button onClick={onClose} className="cursor-pointer p-1 -m-1">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="text-left rounded-xl border border-line overflow-hidden hover:border-ink transition-colors cursor-pointer"
            >
              <div className="relative aspect-[4/5] bg-paper-alt">
                <Image src={item.imageUrl} alt={item.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
              </div>
              <p className="text-xs p-2 truncate">{item.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
