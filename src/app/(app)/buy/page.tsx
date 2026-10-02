"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ShoppingPreferencesPanel } from "@/components/ShoppingPreferencesPanel";
import { RecommendationCard } from "@/components/RecommendationCard";
import { ShouldIBuyPanel } from "@/components/ShouldIBuyPanel";
import { Spark } from "@/components/Brand";
import { getCurrencyOption } from "@/lib/currency";
import type { GapAnalysisDTO } from "@/lib/clientTypes";

export default function BuyClothesPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GapAnalysisDTO | null>(null);
  const [mode, setMode] = useState<"recommend" | "complete">("recommend");

  async function analyze(completeWardrobe: boolean) {
    setMode(completeWardrobe ? "complete" : "recommend");
    setLoading(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/buy/analyze-gaps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completeWardrobe }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Couldn't analyze your wardrobe.");
      return;
    }
    setResult(data);
  }

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Buy Clothes</h1>
      <p className="text-stone mb-8 max-w-xl">
        Find pieces that actually improve your wardrobe — based on what you already own, not a catalogue.
      </p>

      <div className="lg:grid lg:grid-cols-[380px_1fr] lg:gap-8 lg:items-start">
        <div className="lg:col-start-1">
          <ShoppingPreferencesPanel />

          <div className="rounded-2xl bg-graphite text-white p-6 sm:p-7 mb-8 lg:mb-0">
            <p className="text-xs uppercase tracking-[0.14em] text-white/40 mb-2">ask the stylist</p>
            <h2 className="font-display text-2xl lowercase mb-2">what&apos;s actually missing?</h2>
            <p className="text-sm text-white/50 mb-5">
              matchin&apos; checks your wardrobe, climate, budget, and style — not a catalogue — for what would actually help.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Button variant="outline-dark" onClick={() => analyze(true)} disabled={loading} className="lowercase">
                <ListChecks className="h-4 w-4 mr-1.5" />
                {loading && mode === "complete" ? "analyzing…" : "complete my wardrobe"}
              </Button>
              <Button variant="lime" onClick={() => analyze(false)} disabled={loading} className="lowercase">
                <Spark className="h-4 w-4 mr-1.5" />
                {loading && mode === "recommend" ? "analyzing…" : "find my gaps"}
              </Button>
            </div>
          </div>
        </div>

        <div className="lg:col-start-2 mt-8 lg:mt-0">
          {error && <p className="text-sm text-warning mb-8">{error}</p>}

          {loading && (
            <div className="grid sm:grid-cols-2 gap-5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-line bg-paper-alt p-7">
                  <div className="h-14 w-11 rounded-lg bg-paper-alt animate-pulse mb-4" />
                  <div className="h-4 w-2/3 bg-paper-alt rounded animate-pulse mb-2" />
                  <div className="h-3 w-1/2 bg-paper-alt rounded animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {!loading && result && (
            <div>
              <div className="rounded-2xl bg-paper-alt p-5 sm:p-6 mb-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone mb-3">
                  {result.weather && (
                    <span>
                      {result.weather.city}
                      {result.weather.country ? `, ${result.weather.country}` : ""} · {result.weather.tempC}°C, {result.weather.condition}
                      {result.climateProfile ? ` · ${result.climateProfile}` : ""}
                    </span>
                  )}
                  {result.currency && (
                    <span className="rounded-full bg-paper-alt px-2.5 py-1">
                      {getCurrencyOption(result.currency).symbol} {result.currency}
                      {result.currencyIsAuto ? " · Auto" : " · Manual"}
                    </span>
                  )}
                  {!result.currency && (
                    <span className="rounded-full bg-paper-alt px-2.5 py-1">Currency: waiting for location</span>
                  )}
                </div>

                {result.smartBrief && <p className="font-medium mb-2">{result.smartBrief}</p>}
                <p className="text-sm text-ink-soft leading-relaxed">{result.overallAdvice}</p>
                {result.forecastInsight && (
                  <p className="text-xs text-ink-soft mt-2">
                    <strong>Coming up:</strong> {result.forecastInsight}.
                  </p>
                )}
                {result.aiUnavailable && (
                  <p className="text-xs text-warning mt-2">AI styling review unavailable — set GEMINI_API_KEY for fully personalized recommendations.</p>
                )}
              </div>

              {result.recommendations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-line py-16 text-center">
                  <p className="font-display text-xl mb-2">Nothing to buy right now.</p>
                  <p className="text-stone text-sm">Your wardrobe is already well balanced for how you dress.</p>
                </div>
              ) : mode === "complete" ? (
                <CompleteWardrobePlan recommendations={result.recommendations} />
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {result.recommendations.map((rec) => (
                    <RecommendationCard key={rec.id} recommendation={rec} />
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && !result && !error && (
            <div className="hidden lg:flex h-full min-h-[280px] rounded-2xl border border-dashed border-line items-center justify-center text-center p-10">
              <p className="text-stone text-sm max-w-xs">
                Recommendations will appear here once you run an analysis.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12">
        <ShouldIBuyPanel />
      </div>
    </div>
  );
}

function CompleteWardrobePlan({ recommendations }: { recommendations: GapAnalysisDTO["recommendations"] }) {
  const bands: { label: string; test: (score: number) => boolean }[] = [
    { label: "Highest priority", test: (s) => s >= 85 },
    { label: "Recommended", test: (s) => s >= 65 && s < 85 },
    { label: "Optional", test: (s) => s >= 45 && s < 65 },
    { label: "Not needed", test: (s) => s < 45 },
  ];

  return (
    <div className="space-y-8">
      {bands.map((band) => {
        const items = recommendations.filter((r) => band.test(r.scores.overallScore));
        if (items.length === 0) return null;
        return (
          <div key={band.label}>
            <h3 className="font-display text-xl mb-3">{band.label}</h3>
            <div className="grid sm:grid-cols-2 gap-5">
              {items.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
