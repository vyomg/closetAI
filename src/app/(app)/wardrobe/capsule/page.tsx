"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CAPSULE_TYPES } from "@/lib/constants";
import type { ClothingItemDTO } from "@/lib/clientTypes";

type CapsuleResult = {
  id: string;
  name: string;
  items: (ClothingItemDTO & { reason: string })[];
  outfitCount: number;
  missingPieces: string[];
};

export default function CapsuleWardrobePage() {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [result, setResult] = useState<CapsuleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function build(key: string) {
    setActiveKey(key);
    setResult(null);
    setError(null);
    const res = await fetch("/api/wardrobe/capsule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capsuleKey: key }),
    });
    const data = await res.json();
    setActiveKey(null);
    if (!res.ok) {
      setError(data.error || "Couldn't build that capsule.");
      return;
    }
    setResult(data);
  }

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Capsule Wardrobe</h1>
      <p className="text-stone mb-10 max-w-xl">
        A focused set of pieces from your own closet, picked for maximum versatility and mix-and-match potential.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {CAPSULE_TYPES.map((c) => (
          <div key={c.key} className="rounded-2xl border border-line bg-white p-5 flex flex-col justify-between">
            <div>
              <p className="font-medium mb-1.5">{c.title}</p>
              <p className="text-sm text-stone">{c.description}</p>
            </div>
            <Button size="sm" variant="outline" className="mt-4 w-full" onClick={() => build(c.key)} disabled={activeKey === c.key}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {activeKey === c.key ? "Building…" : "Build this capsule"}
            </Button>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-warning mb-8">{error}</p>}

      {result && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl">{result.name}</h2>
            <p className="text-sm text-stone">{result.outfitCount} outfit combinations</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {result.items.map((item) => (
              <div key={item.id}>
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-line bg-paper-alt">
                  <Image src={item.imageUrl} alt={item.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                </div>
                <p className="text-sm font-medium truncate mt-2">{item.name}</p>
                <p className="text-xs text-stone mt-0.5">{item.reason}</p>
              </div>
            ))}
          </div>
          {result.missingPieces.length > 0 && (
            <div className="rounded-2xl bg-paper-alt p-5">
              <p className="text-sm font-medium mb-1">Missing pieces</p>
              <p className="text-sm text-stone">{result.missingPieces.join(", ")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
