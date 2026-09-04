"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { StyleSelector } from "@/components/StyleSelector";
import { ImportanceScale } from "@/components/ImportanceScale";
import { OutfitCard } from "@/components/OutfitCard";
import { OCCASIONS, DESIRED_STYLES, ADVENTURE_LEVELS } from "@/lib/constants";
import type { ClothingItemDTO, OutfitDTO } from "@/lib/clientTypes";

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
  const [adventureLevel, setAdventureLevel] = useState(3);
  const [anchorItem, setAnchorItem] = useState<ClothingItemDTO | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [wardrobe, setWardrobe] = useState<ClothingItemDTO[] | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OutfitDTO | null>(null);

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

  async function generate(opts?: { surprise?: boolean; occasionOverride?: string }) {
    setLoading(true);
    setError(null);
    setResult(null);

    const finalOccasion = opts?.occasionOverride ?? (occasion === "Custom" ? customOccasion : occasion);
    const finalStyle = style === "Custom" ? customStyle || "Whatever works best" : style;

    const res = await fetch("/api/outfits/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        occasion: finalOccasion || "Everyday",
        desiredStyle: finalStyle,
        notes,
        adventureLevel,
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

  return (
    <div className="grid lg:grid-cols-[420px_1fr] gap-10">
      <div>
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
            <Label>Anything specific?</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. I want to wear my white sneakers. Keep it comfortable."
            />
          </div>

          <div>
            <Label>
              Adventure level — {ADVENTURE_LEVELS[adventureLevel - 1].label}
            </Label>
            <ImportanceScale value={adventureLevel} onChange={setAdventureLevel} lowLabel="Very safe" highLabel="Bold" />
          </div>

          <div>
            <Label>Build around an item (optional)</Label>
            {anchorItem ? (
              <div className="flex items-center gap-3 rounded-xl border border-line p-2.5">
                <div className="relative h-14 w-11 rounded-lg overflow-hidden bg-paper-alt shrink-0">
                  <Image src={anchorItem.imageUrl} alt={anchorItem.name} fill className="object-cover" />
                </div>
                <p className="text-sm flex-1 truncate">{anchorItem.name}</p>
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
        <p className="text-stone text-sm">Set your preferences and let ClosetAI style something from your wardrobe.</p>
      </div>
    </div>
  );
}

function GeneratingState() {
  return (
    <div className="rounded-2xl border border-line bg-white p-7">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] rounded-xl bg-paper-alt animate-pulse" />
        ))}
      </div>
      <p className="text-sm text-stone mt-6">Reasoning through colour, formality and fit…</p>
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
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-paper rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl">Choose an item</h3>
          <button onClick={onClose} className="cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="text-left rounded-xl border border-line overflow-hidden hover:border-ink transition-colors cursor-pointer"
            >
              <div className="relative aspect-[4/5] bg-paper-alt">
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
              </div>
              <p className="text-xs p-2 truncate">{item.name}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
