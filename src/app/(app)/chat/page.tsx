"use client";

import { useState } from "react";
import { Spark } from "@/components/Brand";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { OutfitCard } from "@/components/OutfitCard";
import { FloatingWords } from "@/components/FloatingWords";
import { OCCASIONS, DESIRED_STYLES } from "@/lib/constants";
import type { OutfitDTO } from "@/lib/clientTypes";

// A curated subset of the real OCCASIONS vocabulary — the full list (14
// options) is better suited to a dropdown; a chat prompt reads better with
// a handful of the most common asks front and center.
const QUICK_OCCASIONS = ["Everyday", "School", "Casual", "Party", "Date", "Travel", "Formal Event"];

type Turn = {
  id: string;
  occasion: string;
  style: string;
  notes: string;
  status: "loading" | "done" | "error";
  outfit?: OutfitDTO;
  error?: string;
};

// Chat Now is a conversational front-end on the exact same generation
// pipeline as "match something" (Outfit Generator / Matchin' Wheel) — same
// /api/outfits/generate route, same Gemini + outfitValidator intelligence,
// same wardrobe data. This page adds no new AI system; it just lets the ask
// happen as a sequence of quick prompts instead of a single form.
export default function ChatNowPage() {
  const [occasion, setOccasion] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [sending, setSending] = useState(false);

  const canAsk = (occasion || style || notes.trim().length > 0) && !sending;

  async function ask() {
    if (!canAsk) return;
    const id = `${Date.now()}`;
    const turn: Turn = { id, occasion: occasion ?? "Everyday", style: style ?? "Custom", notes, status: "loading" };
    setTurns((t) => [...t, turn]);
    setSending(true);

    const res = await fetch("/api/outfits/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        occasion: occasion ?? "Everyday",
        desiredStyle: style ?? "Custom",
        notes,
      }),
    });
    const data = await res.json();
    setSending(false);

    setTurns((prev) =>
      prev.map((t) =>
        t.id === id
          ? res.ok
            ? { ...t, status: "done", outfit: data }
            : { ...t, status: "error", error: data.error || "Couldn't put that together — try again." }
          : t
      )
    );

    setOccasion(null);
    setStyle(null);
    setNotes("");
  }

  async function handleSaveToggle(turnId: string, outfitId: string, next: boolean) {
    setTurns((prev) => prev.map((t) => (t.id === turnId && t.outfit ? { ...t, outfit: { ...t.outfit, isSaved: next } } : t)));
    await fetch(`/api/outfits/${outfitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSaved: next }),
    });
  }

  async function handleDelete(turnId: string, outfitId: string) {
    if (!confirm("Delete this outfit from your history?")) return;
    setTurns((prev) => prev.filter((t) => t.id !== turnId));
    await fetch(`/api/outfits/${outfitId}`, { method: "DELETE" });
  }

  async function handleWear(turnId: string, outfitId: string) {
    await fetch(`/api/outfits/${outfitId}/wear`, { method: "POST" });
    setTurns((prev) =>
      prev.map((t) => (t.id === turnId && t.outfit ? { ...t, outfit: { ...t.outfit, lastWornAt: new Date().toISOString() } } : t))
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="relative rounded-2xl bg-graphite text-white p-6 sm:p-8 mb-8">
        <FloatingWords words={["ASK", "MIX", "REMIX", "✦"]} />
        <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-3 relative">your personal stylist</p>
        <h1 className="font-display text-3xl sm:text-4xl mb-2 lowercase flex items-center gap-2 relative">
          chat now <Spark className="h-5 w-5 text-lime" />
        </h1>
        <p className="text-sm text-white/50 relative max-w-md">
          Tell matchin&apos; what you&apos;re dressing for — it&apos;ll build something real from your actual
          wardrobe, not a catalogue.
        </p>
      </div>

      {turns.length === 0 && (
        <div className="rounded-2xl border border-line bg-paper-alt p-6 sm:p-7 mb-6 animate-fade-up">
          <p className="font-display text-xl mb-1 lowercase">matchin&apos; <Spark className="inline h-3.5 w-3.5 text-lime -translate-y-0.5" /></p>
          <p className="text-sm text-stone">hey — what are we dressing for?</p>
        </div>
      )}

      <div className="space-y-5 mb-8">
        {turns.map((turn) => (
          <div key={turn.id} className="animate-fade-up">
            <div className="flex justify-end mb-3">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-lime text-lime-ink px-4 py-2.5 text-sm">
                {turn.notes.trim()
                  ? turn.notes
                  : `Something for ${turn.occasion.toLowerCase()}${turn.style !== "Custom" ? `, ${turn.style.toLowerCase()} vibe` : ""}.`}
              </div>
            </div>

            {turn.status === "loading" && (
              <div className="rounded-2xl border border-line bg-paper-alt p-6 sm:p-7 flex items-center gap-3">
                <Spark className="h-4 w-4 text-lime animate-spark-spin shrink-0" />
                <p className="text-sm text-stone lowercase">matchin&apos;s thinkin&apos; — checking your wardrobe...</p>
              </div>
            )}

            {turn.status === "error" && (
              <div className="rounded-2xl border border-line bg-paper-alt p-5 text-sm text-warning">{turn.error}</div>
            )}

            {turn.status === "done" && turn.outfit && (
              <OutfitCard
                outfit={turn.outfit}
                onSaveToggle={(next) => handleSaveToggle(turn.id, turn.outfit!.id, next)}
                onDelete={() => handleDelete(turn.id, turn.outfit!.id)}
                onWear={() => handleWear(turn.id, turn.outfit!.id)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-paper-alt p-5 sm:p-6 sticky bottom-24 lg:bottom-6">
        <p className="text-xs uppercase tracking-wide text-stone mb-2.5">what are we dressing for?</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_OCCASIONS.map((o) => (
            <Chip key={o} active={occasion === o} onClick={() => setOccasion((cur) => (cur === o ? null : o))}>
              {o}
            </Chip>
          ))}
        </div>

        <p className="text-xs uppercase tracking-wide text-stone mb-2.5">what&apos;s the vibe?</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {DESIRED_STYLES.map((s) => (
            <Chip key={s} active={style === s} onClick={() => setStyle((cur) => (cur === s ? null : s))}>
              {s}
            </Chip>
          ))}
        </div>

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="or tell matchin' exactly what you need…"
          rows={2}
          className="mb-4"
        />

        <Button onClick={ask} disabled={!canAsk} className="w-full">
          <Spark className="h-4 w-4 mr-1.5" /> {sending ? "Styling…" : "Ask matchin'"}
        </Button>
      </div>
    </div>
  );
}
