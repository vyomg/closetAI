"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Shuffle, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spark, BrandLoading } from "@/components/Brand";
import { FloatingWords } from "@/components/FloatingWords";
import { cn } from "@/lib/cn";
import { CATEGORY_TO_SLOT, type Category } from "@/lib/constants";
import type { ClothingItemDTO } from "@/lib/clientTypes";

const SLOT_ORDER = ["top", "bottom", "outerwear", "shoes", "accessory"];
const SLOT_LABEL: Record<string, string> = {
  top: "Top",
  bottom: "Bottom",
  outerwear: "Outerwear",
  shoes: "Shoes",
  accessory: "Accessory",
};

// A lightweight, hands-on alternative to asking matchin' to generate an
// outfit: pick real pieces from your own wardrobe slot by slot, swap any
// one of them, and save what you land on. No AI call here at all — this is
// pure direct manipulation over the same wardrobe data every other page
// uses, saved through the same Outfit/OutfitItem model as a generated fit
// (see /api/outfits POST), so it shows up in My Outfits and Calendar too.
export default function OutfitPlaygroundPage() {
  const [wardrobe, setWardrobe] = useState<ClothingItemDTO[] | null>(null);
  const [picks, setPicks] = useState<Record<string, ClothingItemDTO | null>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clothing")
      .then((r) => r.json())
      .then(setWardrobe);
  }, []);

  const bySlot = useMemo(() => {
    const map: Record<string, ClothingItemDTO[]> = {};
    for (const item of wardrobe ?? []) {
      const slot = CATEGORY_TO_SLOT[item.category as Category];
      if (!slot) continue;
      (map[slot] ??= []).push(item);
    }
    return map;
  }, [wardrobe]);

  const activeSlots = SLOT_ORDER.filter((s) => (bySlot[s]?.length ?? 0) > 0);
  const pickedItems = SLOT_ORDER.map((s) => picks[s]).filter((i): i is ClothingItemDTO => !!i);

  function toggle(slot: string, item: ClothingItemDTO) {
    setSaved(null);
    setPicks((p) => ({ ...p, [slot]: p[slot]?.id === item.id ? null : item }));
  }

  function shuffleSlot(slot: string) {
    const options = bySlot[slot] ?? [];
    if (options.length === 0) return;
    setSaved(null);
    const current = picks[slot]?.id;
    const rest = options.filter((o) => o.id !== current);
    const pool = rest.length > 0 ? rest : options;
    setPicks((p) => ({ ...p, [slot]: pool[Math.floor(Math.random() * pool.length)] }));
  }

  function shuffleAll() {
    setSaved(null);
    const next: Record<string, ClothingItemDTO | null> = {};
    for (const slot of activeSlots) {
      const options = bySlot[slot] ?? [];
      next[slot] = options[Math.floor(Math.random() * options.length)] ?? null;
    }
    setPicks(next);
  }

  async function save() {
    if (pickedItems.length === 0) return;
    setSaving(true);
    const res = await fetch("/api/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        occasion: "Everyday",
        style: "Custom",
        items: SLOT_ORDER.filter((s) => picks[s]).map((s) => ({ clothingItemId: picks[s]!.id, slot: s })),
      }),
    });
    setSaving(false);
    if (res.ok) setSaved("Saved to My Outfits.");
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

  return (
    <div className="max-w-5xl">
      <div className="relative rounded-2xl bg-graphite text-white p-6 sm:p-8 mb-8">
        <FloatingWords words={["MIX", "SWAP", "REMIX", "PLAY"]} />
        <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-3 relative">outfit playground</p>
        <h1 className="font-display text-3xl sm:text-4xl mb-2 relative">mix it yourself.</h1>
        <p className="text-sm text-white/50 relative max-w-md">
          Pick a piece per slot from your real wardrobe, swap anything, and save what works.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-6">
          {activeSlots.map((slot) => (
            <div key={slot}>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs uppercase tracking-wide text-stone">{SLOT_LABEL[slot]}</p>
                <button
                  onClick={() => shuffleSlot(slot)}
                  className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink cursor-pointer"
                >
                  <Shuffle className="h-3 w-3" /> Swap
                </button>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {bySlot[slot].map((item) => {
                  const active = picks[slot]?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggle(slot, item)}
                      className={cn(
                        "relative shrink-0 aspect-[4/5] w-20 rounded-xl overflow-hidden border-2 transition-colors cursor-pointer",
                        active ? "border-lime" : "border-line hover:border-ink/30"
                      )}
                    >
                      <Image src={item.imageUrl} alt={item.name} fill sizes="80px" className="object-cover" />
                      {active && (
                        <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-lime text-lime-ink flex items-center justify-center">
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-10 rounded-2xl border border-line bg-paper-alt p-6">
          <p className="text-xs uppercase tracking-wide text-stone mb-4">your fit</p>
          {pickedItems.length === 0 ? (
            <p className="text-sm text-stone mb-5">Pick a piece from any slot to start building.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-5">
              {pickedItems.map((item) => (
                <div key={item.id}>
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-line bg-paper">
                    <Image src={item.imageUrl} alt={item.name} fill sizes="140px" className="object-cover" />
                  </div>
                  <p className="text-xs text-stone mt-1.5 truncate">{item.name}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            <Button variant="outline" onClick={shuffleAll} disabled={activeSlots.length === 0}>
              <Shuffle className="h-4 w-4 mr-1.5" /> Shuffle all
            </Button>
            <Button onClick={save} disabled={pickedItems.length === 0 || saving}>
              {saving ? "Saving…" : "Save this outfit"}
            </Button>
          </div>

          {saved && (
            <p className="mt-4 text-sm text-success flex items-center gap-1.5">
              <Spark className="h-3.5 w-3.5" /> {saved}{" "}
              <Link href="/outfits" className="underline underline-offset-4">
                View
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
