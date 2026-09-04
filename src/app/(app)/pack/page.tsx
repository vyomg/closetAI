"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { StyleSelector } from "@/components/StyleSelector";
import { OCCASIONS } from "@/lib/constants";
import type { ClothingItemDTO } from "@/lib/clientTypes";

type PackResult = {
  summary: string;
  items: (ClothingItemDTO & { reason: string })[];
  outfitCombinations: { occasion: string; items: ClothingItemDTO[] }[];
};

export default function PackPage() {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(5);
  const [weatherNotes, setWeatherNotes] = useState("");
  const [occasions, setOccasions] = useState<string[]>(["Casual"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PackResult | null>(null);

  async function generate() {
    if (!destination.trim()) {
      setError("Tell us where you're headed first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/pack/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination, days, weatherNotes, occasions }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Couldn't build a packing list.");
      return;
    }
    setResult(data);
  }

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Pack for a Trip</h1>
      <p className="text-stone mb-10 max-w-xl">
        Tell ClosetAI where you're headed and it'll build a minimal, versatile capsule from your
        wardrobe.
      </p>

      <div className="grid lg:grid-cols-[380px_1fr] gap-10">
        <div className="space-y-6">
          <div>
            <Label>Destination</Label>
            <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Dubai" />
          </div>
          <div>
            <Label>Number of days</Label>
            <Input
              type="number"
              min={1}
              max={60}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Weather / season notes</Label>
            <Textarea
              rows={2}
              value={weatherNotes}
              onChange={(e) => setWeatherNotes(e.target.value)}
              placeholder="e.g. September, hot and humid"
            />
          </div>
          <div>
            <Label>Occasions on this trip</Label>
            <StyleSelector options={OCCASIONS} selected={occasions} onChange={setOccasions} />
          </div>
          <Button size="lg" onClick={generate} disabled={loading} className="w-full">
            {loading ? "Packing your bag…" : "Build Packing List"}
          </Button>
          {error && <p className="text-sm text-warning">{error}</p>}
        </div>

        <div>
          {loading && (
            <div className="rounded-2xl border border-line bg-white p-7">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] rounded-xl bg-paper-alt animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-8">
              <div className="rounded-2xl border border-line bg-white p-6">
                <p className="text-sm text-ink-soft leading-relaxed">{result.summary}</p>
              </div>

              <div>
                <h2 className="font-display text-2xl mb-4">What to pack ({result.items.length} items)</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {result.items.map((item) => (
                    <div key={item.id}>
                      <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-line bg-paper-alt">
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      </div>
                      <p className="text-xs font-medium mt-2 truncate">{item.name}</p>
                      <p className="text-[11px] text-stone">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {result.outfitCombinations.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl mb-4">Outfit combinations</h2>
                  <div className="space-y-4">
                    {result.outfitCombinations.map((combo, i) => (
                      <div key={i} className="rounded-2xl border border-line bg-white p-5">
                        <p className="text-xs uppercase tracking-wide text-stone mb-3">{combo.occasion}</p>
                        <div className="flex gap-3">
                          {combo.items.map((item) => (
                            <div key={item.id} className="relative aspect-[4/5] w-16 rounded-lg overflow-hidden bg-paper-alt shrink-0">
                              <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && !result && !error && (
            <div className="h-full min-h-[320px] rounded-2xl border border-dashed border-line flex items-center justify-center text-center p-10">
              <p className="text-stone">Your packing list will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
