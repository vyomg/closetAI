"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shuffle, Check, Pin, PinOff, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Spark, BrandLoading } from "@/components/Brand";
import { FloatingWords } from "@/components/FloatingWords";
import { cn } from "@/lib/cn";
import { CATEGORY_TO_SLOT, type Category } from "@/lib/constants";
import type { ClothingItemDTO, OutfitDTO } from "@/lib/clientTypes";

const SLOT_ORDER = ["top", "bottom", "outerwear", "shoes", "accessory"];
const SLOT_LABEL: Record<string, string> = {
  top: "Top",
  bottom: "Bottom",
  outerwear: "Outerwear",
  shoes: "Shoes",
  accessory: "Accessory",
};

const ASK_PRESETS = ["Improve this", "More casual", "More formal", "More streetwear", "More minimal", "Make it warmer"];

type Position = { x: number; y: number };

// Default flat-lay arrangement before the user drags anything — spreads
// slots across the canvas instead of stacking them on top of each other.
const DEFAULT_POSITION_PCT: Record<string, Position> = {
  outerwear: { x: 18, y: 10 },
  top: { x: 50, y: 14 },
  accessory: { x: 82, y: 12 },
  bottom: { x: 50, y: 52 },
  shoes: { x: 50, y: 86 },
};

// Playground 2.0 — real clothing images on a canvas you can actually drag
// and reposition (pointer events, so it works the same on mouse and touch),
// plus a real Gemini assist that reuses the exact same /api/outfits/generate
// pipeline every other "ask matchin'" surface uses — no second AI system.
// Every arrow-key-accessible, so dragging is never the only way to move a
// piece (see each card's onKeyDown).
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
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [lockedSlot, setLockedSlot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [pickerSlot, setPickerSlot] = useState<string | null>(null);

  const [askText, setAskText] = useState("");
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ slot: string; pointerId: number } | null>(null);

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

  const activeSlots = SLOT_ORDER.filter((s) => (bySlot[s]?.length ?? 0) > 0);
  const filledSlots = SLOT_ORDER.filter((s) => picks[s]);

  function positionFor(slot: string): Position {
    return positions[slot] ?? DEFAULT_POSITION_PCT[slot] ?? { x: 50, y: 50 };
  }

  function clampPct(v: number) {
    return Math.max(8, Math.min(92, v));
  }

  function nudge(slot: string, dx: number, dy: number) {
    setPositions((prev) => {
      const cur = positionFor(slot);
      return { ...prev, [slot]: { x: clampPct(cur.x + dx), y: clampPct(cur.y + dy) } };
    });
  }

  function pick(slot: string, item: ClothingItemDTO) {
    setSaved(null);
    setPicks((p) => ({ ...p, [slot]: item }));
    setPickerSlot(null);
  }

  function remove(slot: string) {
    setSaved(null);
    setPicks((p) => ({ ...p, [slot]: null }));
    if (lockedSlot === slot) setLockedSlot(null);
  }

  function shuffleSlot(slot: string) {
    const options = bySlot[slot] ?? [];
    if (options.length === 0 || lockedSlot === slot) return;
    setSaved(null);
    const current = picks[slot]?.id;
    const rest = options.filter((o) => o.id !== current);
    const pool = rest.length > 0 ? rest : options;
    setPicks((p) => ({ ...p, [slot]: pool[Math.floor(Math.random() * pool.length)] }));
  }

  function shuffleAll() {
    setSaved(null);
    setPicks((prev) => {
      const next: Record<string, ClothingItemDTO | null> = { ...prev };
      for (const slot of activeSlots) {
        if (slot === lockedSlot) continue;
        const options = bySlot[slot] ?? [];
        next[slot] = options[Math.floor(Math.random() * options.length)] ?? null;
      }
      return next;
    });
  }

  // Pointer-based drag — identical handling for mouse and touch. The canvas
  // measures itself on every move so dragging stays correct through resize
  // (e.g. rotating a phone) without a stale cached rect.
  function onPointerDown(e: React.PointerEvent, slot: string) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { slot, pointerId: e.pointerId };
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== e.pointerId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    setPositions((prev) => ({ ...prev, [drag.slot]: { x: clampPct(xPct), y: clampPct(yPct) } }));
  }

  function onPointerUp(e: React.PointerEvent) {
    if (dragState.current?.pointerId === e.pointerId) dragState.current = null;
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

    const currentDescription = filledSlots
      .map((s) => `${SLOT_LABEL[s]}: ${picks[s]!.name}`)
      .join(", ");
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
        anchorItemId: lockedSlot ? picks[lockedSlot]?.id : undefined,
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

  return (
    <div className="max-w-6xl">
      <div className="relative rounded-2xl bg-graphite text-white p-6 sm:p-8 mb-8">
        <FloatingWords words={["MIX", "DRAG", "REMIX", "PLAY"]} />
        <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-3 relative">outfit playground</p>
        <h1 className="font-display text-3xl sm:text-4xl mb-2 relative">mix it yourself.</h1>
        <p className="text-sm text-white/50 relative max-w-md">
          Drag real pieces from your wardrobe around the canvas, swap anything, or ask matchin&apos; to rework it.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div>
          {/* The canvas — a real drag surface. Each filled slot is an
              absolutely positioned, pointer-draggable card; arrow keys move
              the focused card by 4% for anyone who can't drag. */}
          <div
            ref={canvasRef}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="relative w-full aspect-[4/5] sm:aspect-[16/11] rounded-2xl border border-line bg-paper-alt overflow-hidden touch-none select-none mb-6"
          >
            {filledSlots.length === 0 && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-stone text-center px-10">
                Pick a piece below for any slot to start building your fit.
              </p>
            )}
            {filledSlots.map((slot) => {
              const item = picks[slot]!;
              const pos = positionFor(slot);
              const locked = lockedSlot === slot;
              return (
                <div
                  key={slot}
                  role="button"
                  tabIndex={0}
                  aria-label={`${SLOT_LABEL[slot]}: ${item.name}. Drag or use arrow keys to move.`}
                  onPointerDown={(e) => onPointerDown(e, slot)}
                  onKeyDown={(e) => {
                    const step = 4;
                    if (e.key === "ArrowUp") nudge(slot, 0, -step);
                    else if (e.key === "ArrowDown") nudge(slot, 0, step);
                    else if (e.key === "ArrowLeft") nudge(slot, -step, 0);
                    else if (e.key === "ArrowRight") nudge(slot, step, 0);
                    else return;
                    e.preventDefault();
                  }}
                  className="absolute w-24 sm:w-28 cursor-grab active:cursor-grabbing touch-none"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
                >
                  <div
                    className={cn(
                      "relative aspect-[4/5] rounded-xl overflow-hidden border-2 bg-paper shadow-[0_8px_24px_-10px_rgba(0,0,0,0.3)]",
                      locked ? "border-lime" : "border-line"
                    )}
                  >
                    <Image src={item.imageUrl} alt={item.name} fill sizes="112px" className="object-cover pointer-events-none" />
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => setLockedSlot(locked ? null : slot)}
                      title={locked ? "Unlock this piece" : "Lock this piece when asking matchin'"}
                      className="absolute top-1 left-1 h-5 w-5 rounded-full bg-paper/90 flex items-center justify-center text-ink-soft hover:text-ink cursor-pointer"
                    >
                      {locked ? <Pin className="h-2.5 w-2.5 text-lime" /> : <PinOff className="h-2.5 w-2.5" />}
                    </button>
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => remove(slot)}
                      title="Remove"
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-paper/90 flex items-center justify-center text-ink-soft hover:text-warning cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-stone text-center mt-1 truncate">{item.name}</p>
                </div>
              );
            })}
          </div>

          {/* Category tray — add/swap per slot */}
          <div className="flex flex-wrap gap-2 mb-6">
            {SLOT_ORDER.map((slot) => (
              <button
                key={slot}
                onClick={() => setPickerSlot(slot)}
                disabled={!bySlot[slot]?.length}
                className={cn(
                  "rounded-full px-3.5 py-2 text-xs transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed",
                  picks[slot] ? "bg-ink text-paper" : "border border-line text-ink-soft hover:border-ink/40"
                )}
              >
                {picks[slot] ? `${SLOT_LABEL[slot]} ✓` : `+ ${SLOT_LABEL[slot]}`}
              </button>
            ))}
          </div>

          {pickerSlot && (
            <div className="rounded-2xl border border-line bg-paper-alt p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-wide text-stone">Choose {SLOT_LABEL[pickerSlot]}</p>
                <button onClick={() => setPickerSlot(null)} className="cursor-pointer p-1 -m-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {(bySlot[pickerSlot] ?? []).map((item) => {
                  const active = picks[pickerSlot]?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => pick(pickerSlot, item)}
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
          )}

          {/* Ask matchin' — reuses the exact same /api/outfits/generate
              pipeline as every other "ask matchin'" surface, just seeded
              with what's currently on the canvas. */}
          <div className="rounded-2xl border border-line bg-paper-alt p-5">
            <p className="text-xs uppercase tracking-wide text-stone mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Ask matchin&apos;
            </p>
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
            {lockedSlot && (
              <p className="text-xs text-stone mt-2.5">
                {SLOT_LABEL[lockedSlot]} is locked — matchin&apos; will build around it.
              </p>
            )}
            {askError && <p className="text-sm text-warning mt-3">{askError}</p>}
            {aiNote && <p className="text-sm text-ink-soft mt-3 leading-relaxed">{aiNote}</p>}
          </div>
        </div>

        <div className="lg:sticky lg:top-10 rounded-2xl border border-line bg-paper-alt p-6">
          <p className="text-xs uppercase tracking-wide text-stone mb-4">controls</p>
          <div className="flex flex-col gap-2.5">
            <Button variant="outline" onClick={shuffleAll} disabled={activeSlots.length === 0}>
              <Shuffle className="h-4 w-4 mr-1.5" /> Shuffle all
            </Button>
            <Button onClick={save} disabled={filledSlots.length === 0 || saving}>
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

          <p className="text-xs text-stone mt-5 leading-relaxed">
            Drag any piece to rearrange it, pin one to lock it in, or ask matchin&apos; to rework the rest around it.
            Asking matchin&apos; uses 1 credit.
          </p>
        </div>
      </div>
    </div>
  );
}
