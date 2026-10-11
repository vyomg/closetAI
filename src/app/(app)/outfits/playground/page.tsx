"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Shuffle, Check, Pin, X, Sparkles, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Spark, BrandLoading } from "@/components/Brand";
import { Mascot } from "@/components/Mascot";
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
// No useSearchParams() here on purpose — Next.js requires wrapping it in
// <Suspense>, and the one caller that linked here with a real
// `?seedOutfit=` param (OutfitCard's "remix in playground") only needs the
// value once, client-side, to kick off a fetch — reading it directly from
// window.location inside that effect gets the identical behavior without
// opting this whole page into Suspense-boundary streaming.
export default function OutfitPlaygroundPage() {
  const [wardrobe, setWardrobe] = useState<ClothingItemDTO[] | null>(null);
  const [picks, setPicks] = useState<Record<string, ClothingItemDTO | null>>({});
  // Each category pins independently (Section 13.4) — pinning shoes doesn't
  // stop you from also pinning the top while you keep shuffling bottoms.
  const [pinnedSlots, setPinnedSlots] = useState<Set<string>>(new Set());
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
    const seedOutfitId = new URLSearchParams(window.location.search).get("seedOutfit");
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

  const filledSlots = [...MAIN_SLOTS, "accessory"].filter((s) => picks[s]);
  const activeMainSlots = MAIN_SLOTS.filter((s) => (bySlot[s]?.length ?? 0) > 0);

  function pick(slot: string, item: ClothingItemDTO | null) {
    setSaved(null);
    setPicks((p) => ({ ...p, [slot]: item }));
  }

  function togglePin(slot: string) {
    setPinnedSlots((cur) => {
      const next = new Set(cur);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      return next;
    });
  }

  function shuffleAll() {
    setSaved(null);
    setPicks((prev) => {
      const next: Record<string, ClothingItemDTO | null> = { ...prev };
      for (const slot of activeMainSlots) {
        if (pinnedSlots.has(slot)) continue;
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
    const pinnedDescription = [...pinnedSlots]
      .filter((s) => picks[s])
      .map((s) => `${SLOT_LABEL[s]}: ${picks[s]!.name}`)
      .join(", ");
    const notes = [
      currentDescription ? `The user is currently trying: ${currentDescription}.` : "",
      pinnedDescription ? `These pieces are pinned and MUST stay exactly as-is: ${pinnedDescription}.` : "",
      `${instruction}. Build a complete outfit reflecting this.`,
    ]
      .filter(Boolean)
      .join(" ");

    // The underlying pipeline only supports one explicit anchor item — with
    // several pins, the first one anchors the AI call directly and the rest
    // are still passed as hard constraints in `notes` above, so nothing
    // pinned gets silently dropped.
    const firstPinnedSlot = [...pinnedSlots].find((s) => picks[s]);

    const res = await fetch("/api/outfits/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        occasion: "Everyday",
        desiredStyle: "Custom",
        notes,
        anchorItemId: firstPinnedSlot ? picks[firstPinnedSlot]?.id : undefined,
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
      <div className="relative rounded-2xl bg-graphite atmosphere text-white p-5 sm:p-6 mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-2 relative">outfit playground</p>
          <h1 className="font-display text-2xl sm:text-3xl mb-1.5 relative">mix it yourself.</h1>
          <p className="text-sm text-white/50 relative max-w-md">
            Swipe through your real pieces, tap to pick, pin one to lock it in. No AI needed.
          </p>
        </div>
        <Mascot expression={asking ? "thinking" : saved ? "celebratory" : "curious"} size={40} className="shrink-0" />
      </div>

      <div className="space-y-5">
        {MAIN_SLOTS.map((slot) => (
          <CategoryRow
            key={slot}
            slot={slot}
            items={bySlot[slot] ?? []}
            picked={picks[slot] ?? null}
            onPick={(item) => pick(slot, item)}
            pinned={pinnedSlots.has(slot)}
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
              {pinnedSlots.size > 0 && (
                <p className="text-xs text-stone mt-2.5">
                  {[...pinnedSlots].map((s) => SLOT_LABEL[s]).join(", ")} pinned — matchin&apos; will build around{" "}
                  {pinnedSlots.size === 1 ? "it" : "them"}.
                </p>
              )}
              {askError && <p className="text-sm text-warning mt-3">{askError}</p>}
              {aiNote && <p className="text-sm text-ink-soft mt-3 leading-relaxed">{aiNote}</p>}
              <p className="text-xs text-stone mt-3">Asking matchin&apos; uses 3 credits.</p>
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

// One wardrobe category as an independently swipeable, CENTER-SELECTED
// carousel — whichever card sits in the horizontal center of its own track
// is the active pick for that category, full stop. That's genuinely
// different from "tap any card to select it": the centered card itself
// IS the selection, continuously, as you drag — matching the reference
// behaviour (swipe the shoe row to the pair you want, it's already picked
// once it settles center, no separate tap required).
//
// Mobile: native touch-scroll + CSS scroll-snap does the swipe/snap — the
// browser's own touch handling is smoother and more correct than any
// custom touch-gesture reimplementation would be. Desktop: a pointer-drag
// handler (mouse only — touch already has native scrolling, so it's
// explicitly excluded to avoid fighting the browser's own gesture) adds
// click-and-drag scrolling, since a bare mouse has no native swipe.
// Keyboard: the track itself is focusable and scrollable, so ArrowLeft/
// ArrowRight scroll it natively — no bespoke key handling needed.
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
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const rafRef = useRef<number | null>(null);
  const lastAutoSelectedId = useRef<string | null>(null);
  const drag = useRef<{ startX: number; startScrollLeft: number; moved: boolean } | null>(null);

  // Continuously recompute, every scroll frame, which card is nearest the
  // track's horizontal center — and imperatively scale/dim every card by
  // its own distance from center, so the "enlarged center, dimmed
  // neighbours" look tracks the drag live instead of only after it settles.
  function recompute() {
    const track = trackRef.current;
    if (!track) return;
    const trackRect = track.getBoundingClientRect();
    const centerX = trackRect.left + trackRect.width / 2;
    const half = trackRect.width / 2 || 1;

    let closestId: string | null = null;
    let closestDist = Infinity;

    for (const [id, el] of cardRefs.current) {
      const r = el.getBoundingClientRect();
      const itemCenter = r.left + r.width / 2;
      const dist = Math.abs(itemCenter - centerX);
      const t = Math.min(1, dist / half);
      // Center card: scale 1, full opacity. Edge cards: smaller, dimmed —
      // never fully invisible, so they still read as "more options here".
      el.style.transform = `scale(${1 - t * 0.22})`;
      el.style.opacity = String(1 - t * 0.55);
      if (dist < closestDist) {
        closestDist = dist;
        closestId = id;
      }
    }

    if (closestId && closestId !== lastAutoSelectedId.current) {
      lastAutoSelectedId.current = closestId;
      const item = items.find((i) => i.id === closestId);
      if (item) onPick(item);
    }
  }

  function onScroll() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(recompute);
  }

  // Keep the carousel's own scroll position in sync with `picked` when it
  // changes for a reason OTHER than this row's own scrolling — Shuffle,
  // loading a seeded outfit, or another row's pin affecting this one.
  useEffect(() => {
    if (!picked || picked.id === lastAutoSelectedId.current) return;
    const el = cardRefs.current.get(picked.id);
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
    lastAutoSelectedId.current = picked.id;
  }, [picked]);

  // Center the initial pick (or the first card) on mount, without an
  // animated scroll jump. Deliberately does NOT pre-set
  // `lastAutoSelectedId` — recompute() below needs to see it still unset so
  // its own closestId check actually fires onPick for whatever ends up
  // centered, including on this very first call (pre-setting it here made
  // recompute() think the initial card was "already selected" and skip
  // calling onPick, leaving the first row visually centered but never
  // actually marked as the pick).
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const id = picked?.id ?? items[0]?.id;
    const el = id ? cardRefs.current.get(id) : null;
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "auto" });
    recompute();
    // Mount-only: re-centering on every `items`/`picked` change would fight
    // the sync effect above and the user's own in-progress drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Window-level listeners (not setPointerCapture, which can throw on some
  // synthetic/edge-case pointers and isn't actually needed here) so the
  // drag keeps tracking even if the cursor leaves the track mid-gesture —
  // standard, robust "click-and-drag to scroll" pattern for desktop mice.
  //
  // CSS scroll-snap actively fights a scripted `scrollLeft` assignment: a
  // native touch/trackpad drag is one continuous OS-level gesture the
  // browser knows not to snap mid-flight, but each individual scripted
  // `scrollLeft = x` looks like its own already-finished scroll, so the
  // snap machinery yanks it straight back to the current snap point on
  // every single frame — the drag would look completely stuck. The fix is
  // the standard one: suspend snapping for the span of the drag, restore
  // it on release so the normal release-to-nearest-card snap still fires.
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return; // touch already scrolls natively
    const track = trackRef.current;
    if (!track) return;
    drag.current = { startX: e.clientX, startScrollLeft: track.scrollLeft, moved: false };
    track.style.scrollSnapType = "none";

    function handleMove(moveEvent: PointerEvent) {
      if (!drag.current || !track) return;
      const dx = moveEvent.clientX - drag.current.startX;
      if (Math.abs(dx) > 3) drag.current.moved = true;
      track.scrollLeft = drag.current.startScrollLeft - dx;
    }
    function handleUp() {
      drag.current = null;
      if (track) track.style.scrollSnapType = "";
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  function onCardClick(item: ClothingItemDTO, e: React.MouseEvent) {
    // A real drag that happened to end over a card shouldn't also "click"
    // it — only treat this as a deliberate tap-to-jump when nothing moved.
    if (drag.current?.moved) {
      e.preventDefault();
      return;
    }
    const el = cardRefs.current.get(item.id);
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }

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
      <div
        ref={trackRef}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        tabIndex={0}
        role="listbox"
        aria-label={`${SLOT_LABEL[slot]} options — the centered item is selected`}
        className="flex items-center gap-3 overflow-x-auto overscroll-x-contain pb-1 pt-2 snap-x snap-mandatory touch-pan-x cursor-grab active:cursor-grabbing select-none"
      >
        {/* Real spacer flex-children (not negative-margin/padding on the
            track itself) sized to exactly half a card short of center, so
            the FIRST and LAST cards can still scroll all the way to the
            middle — a plain, predictable box model instead of percentage
            padding on an auto-width flex item, which produced a genuinely
            broken clientWidth/scrollWidth relationship when tried here. */}
        <div className="shrink-0 w-[calc(50%_-_68px)] sm:w-[calc(50%_-_76px)]" aria-hidden />
        {items.map((item) => {
          const active = picked?.id === item.id;
          return (
            <div
              key={item.id}
              ref={(el) => {
                if (el) cardRefs.current.set(item.id, el);
                else cardRefs.current.delete(item.id);
              }}
              role="option"
              aria-selected={active}
              onClick={(e) => onCardClick(item, e)}
              className="relative shrink-0 snap-center w-28 sm:w-32 aspect-[4/5] rounded-xl overflow-hidden border-2 transition-[border-color,transform,opacity] duration-150 ease-out cursor-pointer"
              style={{ transform: "scale(1)", opacity: 1, borderColor: active ? "var(--lime)" : "var(--line)" }}
            >
              <Image src={item.imageUrl} alt={item.name} fill sizes="128px" draggable={false} className="object-cover pointer-events-none" />
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
            </div>
          );
        })}
        <div className="shrink-0 w-[calc(50%_-_68px)] sm:w-[calc(50%_-_76px)]" aria-hidden />
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
