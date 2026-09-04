"use client";

import { useEffect, useState } from "react";
import { OutfitCard } from "@/components/OutfitCard";
import { LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { OutfitDTO } from "@/lib/clientTypes";

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState<OutfitDTO[] | null>(null);
  const [tab, setTab] = useState<"all" | "saved">("all");

  useEffect(() => {
    const params = tab === "saved" ? "?saved=true" : "";
    fetch(`/api/outfits${params}`)
      .then((r) => r.json())
      .then(setOutfits);
  }, [tab]);

  async function handleSaveToggle(id: string, next: boolean) {
    setOutfits((prev) => prev?.map((o) => (o.id === id ? { ...o, isSaved: next } : o)) ?? null);
    await fetch(`/api/outfits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSaved: next }),
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this outfit from your history?")) return;
    setOutfits((prev) => prev?.filter((o) => o.id !== id) ?? null);
    await fetch(`/api/outfits/${id}`, { method: "DELETE" });
  }

  async function handleWear(id: string) {
    await fetch(`/api/outfits/${id}/wear`, { method: "POST" });
    setOutfits((prev) => prev?.map((o) => (o.id === id ? { ...o, lastWornAt: new Date().toISOString() } : o)) ?? null);
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl">My Outfits</h1>
          <p className="text-stone mt-2">Everything ClosetAI has put together for you.</p>
        </div>
        <LinkButton href="/outfits/create">Create an Outfit</LinkButton>
      </div>

      <div className="flex gap-1.5 mb-8">
        {(["all", "saved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors cursor-pointer",
              tab === t ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-alt"
            )}
          >
            {t === "all" ? "All outfits" : "Saved"}
          </button>
        ))}
      </div>

      {outfits === null ? (
        <p className="text-stone">Loading…</p>
      ) : outfits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-24 text-center">
          <p className="font-display text-2xl mb-3">No outfits yet.</p>
          <p className="text-stone mb-8">Generate your first outfit and it'll show up here.</p>
          <LinkButton href="/outfits/create">Create an Outfit</LinkButton>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {outfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              onSaveToggle={(next) => handleSaveToggle(outfit.id, next)}
              onDelete={() => handleDelete(outfit.id)}
              onWear={() => handleWear(outfit.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
