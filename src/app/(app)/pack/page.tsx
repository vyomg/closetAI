"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Luggage } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { StyleSelector } from "@/components/StyleSelector";
import { OCCASIONS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { ClothingItemDTO, WeatherDTO } from "@/lib/clientTypes";

type PackResult = {
  summary: string;
  destinationWeather: WeatherDTO | null;
  alreadyOwn: (ClothingItemDTO & { reason: string })[];
  outfitCombinations: { occasion: string; items: ClothingItemDTO[] }[];
  worthBuying: { category: string; subcategory: string; suggestedColor: string; reason: string; overallScore: number }[];
};

// Local YYYY-MM-DD, not UTC — toISOString() shifts by the browser's
// timezone offset and can silently roll the date back a day.
function toDateInputValue(d: Date) {
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

const DEFAULT_DEPARTURE = toDateInputValue(new Date(Date.now() + 7 * 86400000));
const DEFAULT_RETURN = toDateInputValue(new Date(Date.now() + 12 * 86400000));

// Trip length convention: departure and return are both travel days —
// returning the same day you leave is a 1-day trip, not 0 — so duration is
// inclusive of both ends. Shown next to the dates so it's never ambiguous.
function tripDurationDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return Math.max(1, diff + 1);
}

export default function PackPage() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState(DEFAULT_DEPARTURE);
  const [returnDate, setReturnDate] = useState(DEFAULT_RETURN);
  const [weatherNotes, setWeatherNotes] = useState("");
  const [occasions, setOccasions] = useState<string[]>(["Casual"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PackResult | null>(null);
  const [saving, setSaving] = useState(false);

  const days = tripDurationDays(departureDate, returnDate);
  const datesInvalid = returnDate < departureDate;

  function handleDepartureChange(value: string) {
    setDepartureDate(value);
    // Keep the return date from silently becoming "before departure" when
    // the user drags departure past it — nudge it forward instead of
    // letting an invalid range sit there unexplained.
    if (returnDate < value) setReturnDate(value);
  }

  async function saveTrip() {
    setSaving(true);
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination, startDate: departureDate, endDate: returnDate, occasions: occasions.slice(0, 5) }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) router.push(`/trips/${data.id}`);
    else setError(data.error || "Couldn't save this trip.");
  }

  async function generate() {
    if (!destination.trim()) {
      setError("Tell us where you're headed first.");
      return;
    }
    if (datesInvalid) {
      setError("Your return date can't be before your departure date.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/pack/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination, days, departureDate, returnDate, weatherNotes, occasions }),
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
        Tell matchin&apos; where you&apos;re headed and it&apos;ll build a minimal, versatile capsule from your
        wardrobe.
      </p>

      <div className="grid lg:grid-cols-[380px_1fr] gap-10">
        <div className="space-y-6">
          <div>
            <Label>Destination</Label>
            <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Dubai" />
          </div>
          <div>
            <Label>Trip dates</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-stone mb-1 block">Departure</span>
                <Input
                  type="date"
                  value={departureDate}
                  onChange={(e) => handleDepartureChange(e.target.value)}
                />
              </div>
              <div>
                <span className="text-xs text-stone mb-1 block">Return</span>
                <Input
                  type="date"
                  value={returnDate}
                  min={departureDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
            </div>
            <p className={cn("text-xs mt-2", datesInvalid ? "text-warning" : "text-stone")}>
              {datesInvalid
                ? "Return date can't be before departure."
                : `${days} day${days === 1 ? "" : "s"} — departure and return both count as travel days.`}
            </p>
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
          <Button size="lg" onClick={generate} disabled={loading || datesInvalid} className="w-full">
            {loading ? "Packing your bag…" : "Build Packing List"}
          </Button>
          {error && <p className="text-sm text-warning">{error}</p>}
        </div>

        <div>
          {loading && (
            <div className="rounded-2xl border border-line bg-paper-alt p-7">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] rounded-xl bg-paper-alt animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-8">
              <div className="rounded-2xl border border-line bg-paper-alt p-6">
                {result.destinationWeather && (
                  <p className="text-xs text-stone mb-2">
                    {result.destinationWeather.city}
                    {result.destinationWeather.country ? `, ${result.destinationWeather.country}` : ""} · currently{" "}
                    {result.destinationWeather.tempC}°C, {result.destinationWeather.condition}
                  </p>
                )}
                <p className="text-sm text-ink-soft leading-relaxed">{result.summary}</p>
                <Button size="sm" variant="outline" className="mt-4" onClick={saveTrip} disabled={saving}>
                  <Luggage className="h-3.5 w-3.5 mr-1.5" /> {saving ? "Saving trip…" : "Save this trip"}
                </Button>
              </div>

              <div>
                <h2 className="font-display text-2xl mb-4">Already own ({result.alreadyOwn.length} items)</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {result.alreadyOwn.map((item) => (
                    <div key={item.id}>
                      <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-line bg-paper-alt">
                        <Image src={item.imageUrl} alt={item.name} fill sizes="(max-width: 640px) 33vw, 25vw" className="object-cover" />
                      </div>
                      <p className="text-xs font-medium mt-2 truncate">{item.name}</p>
                      <p className="text-[11px] text-stone">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {result.worthBuying.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl mb-4">Potentially worth buying</h2>
                  <div className="space-y-3">
                    {result.worthBuying.map((rec, i) => (
                      <div key={i} className="rounded-2xl border border-line bg-paper-alt p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">
                            {rec.suggestedColor} {rec.subcategory}
                          </p>
                          <p className="text-xs text-stone mt-0.5">{rec.reason}</p>
                        </div>
                        <span className="text-xs text-stone shrink-0">{rec.overallScore}% match</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.outfitCombinations.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl mb-4">Outfit combinations</h2>
                  <div className="space-y-4">
                    {result.outfitCombinations.map((combo, i) => (
                      <div key={i} className="rounded-2xl border border-line bg-paper-alt p-5">
                        <p className="text-xs uppercase tracking-wide text-stone mb-3">{combo.occasion}</p>
                        <div className="flex gap-3">
                          {combo.items.map((item) => (
                            <div key={item.id} className="relative aspect-[4/5] w-16 rounded-lg overflow-hidden bg-paper-alt shrink-0">
                              <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
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
