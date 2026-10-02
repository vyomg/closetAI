"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Layers, Shirt, AlertTriangle, ChevronDown, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/currency";
import type { RecommendationDTO, ExactProductDTO, RetailerSearchDTO } from "@/lib/clientTypes";

const COLOR_SWATCH: Record<string, string> = {
  Black: "#17160f",
  White: "#f5f4ef",
  Grey: "#9b968a",
  Navy: "#1f2a44",
  Blue: "#3b5c8c",
  Beige: "#d9c9a8",
  Brown: "#6b4a30",
  Tan: "#c9a877",
  Olive: "#5f6b3f",
  Green: "#3d5c3a",
  Red: "#8c2f2f",
  Burgundy: "#5c2530",
  Pink: "#d19aa6",
  Purple: "#5b4a6b",
  Yellow: "#d1b13d",
  Orange: "#c07a3a",
  Cream: "#efe6d3",
  Neutral: "#c8c2b4",
};

export function RecommendationCard({ recommendation }: { recommendation: RecommendationDTO }) {
  const [showWhy, setShowWhy] = useState(false);
  const isHighPriority = recommendation.scores.overallScore >= 70;
  const swatch = COLOR_SWATCH[recommendation.suggestedColor] ?? "#c8c2b4";

  return (
    <div className="rounded-2xl border border-line bg-white p-5 sm:p-7 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="h-14 w-11 rounded-lg shrink-0 border border-line/60"
            style={{ backgroundColor: swatch }}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="font-display text-xl leading-tight">
              {recommendation.suggestedColor} {recommendation.subcategory}
            </p>
            <p className="text-xs text-stone mt-0.5">{recommendation.category}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge tone={isHighPriority ? "success" : "neutral"}>{isHighPriority ? "High priority" : "Low priority"}</Badge>
          <span className="font-display text-lg">ROI {recommendation.scores.closetROI.toFixed(1)}/10</span>
        </div>
      </div>

      {recommendation.skipRecommended ? (
        <div className="flex items-start gap-2 rounded-xl bg-[#f4e6d8] px-3.5 py-3 text-sm text-warning mb-5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>Don&apos;t buy this yet.</strong> You already own {recommendation.duplicateCount} very similar item
            {recommendation.duplicateCount === 1 ? "" : "s"} — {recommendation.reason.toLowerCase()}
          </span>
        </div>
      ) : (
        <p className="text-sm text-ink-soft leading-relaxed mb-5">{recommendation.reason}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-5">
        <MetaChip icon={<Shirt className="h-3.5 w-3.5" />}>
          Goes with {recommendation.worksWithCount} piece{recommendation.worksWithCount === 1 ? "" : "s"} you own
        </MetaChip>
        <MetaChip icon={<Layers className="h-3.5 w-3.5" />}>
          Works for {recommendation.newOutfitCombos}+ combination{recommendation.newOutfitCombos === 1 ? "" : "s"}
        </MetaChip>
      </div>

      {recommendation.exampleOutfit.length > 0 && (
        <div className="mb-5">
          <p className="text-xs uppercase tracking-wide text-stone mb-2.5">What this unlocks — example outfit</p>
          <div className="flex gap-2.5 flex-wrap">
            {recommendation.exampleOutfit.map((item) => (
              <div key={item.id} className="relative aspect-[4/5] w-14 sm:w-16 rounded-lg overflow-hidden bg-paper-alt border border-line shrink-0">
                <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
              </div>
            ))}
            <div
              className="relative aspect-[4/5] w-14 sm:w-16 rounded-lg shrink-0 border border-dashed border-ink/30 flex items-center justify-center"
              style={{ backgroundColor: swatch }}
              title="Proposed item (no photo yet)"
            >
              <span className="text-[9px] text-white/90 text-center px-1 drop-shadow">New</span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowWhy((s) => !s)}
        className="w-full flex items-center justify-between text-sm text-ink-soft hover:text-ink transition-colors cursor-pointer mb-2"
      >
        <span className="underline underline-offset-4">Why this?</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", showWhy && "rotate-180")} />
      </button>

      {showWhy && (
        <div className="rounded-xl bg-paper-alt p-4 mb-5 animate-fade-in">
          <ul className="space-y-1.5 text-sm text-ink-soft">
            <li>• Works with {recommendation.worksWithCount} items you already own ({recommendation.scores.wardrobeCompatibility}% wardrobe fit).</li>
            <li>• Could create {recommendation.newOutfitCombos}+ new outfit combinations.</li>
            <li>• Style match: {recommendation.scores.styleMatch}% for your stated style and past feedback.</li>
            <li>• Colour compatibility: {recommendation.scores.colorCompatibility}%.</li>
            <li>• Climate compatibility: {recommendation.scores.weatherCompatibility}%.</li>
            {recommendation.scores.budgetFit !== null && <li>• Budget fit: {recommendation.scores.budgetFit}%.</li>}
            <li>
              • Duplication risk: {recommendation.scores.duplicationPenalty}%
              {recommendation.duplicateCount > 0 ? ` (you own ${recommendation.duplicateCount} similar item${recommendation.duplicateCount === 1 ? "" : "s"})` : " — nothing like this yet"}.
            </li>
          </ul>
        </div>
      )}

      <div className={cn("grid gap-2 mb-5", recommendation.scores.budgetFit !== null ? "grid-cols-3" : "grid-cols-2")}>
        <ScorePill label="Overall" value={recommendation.scores.overallScore} emphasize />
        <ScorePill label="Wardrobe fit" value={recommendation.scores.wardrobeCompatibility} />
        {recommendation.scores.budgetFit !== null && (
          <ScorePill label="Budget fit" value={recommendation.scores.budgetFit} />
        )}
      </div>

      {recommendation.productResults.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-stone mb-2.5">
            {recommendation.usedRealProvider ? "Real products" : "Where to shop"}
          </p>

          {!recommendation.usedRealProvider && (
            <p className="text-[11px] text-stone mb-2.5">
              Live product search isn&apos;t connected — these open a retailer search for &ldquo;
              {recommendation.productResults.find((r): r is RetailerSearchDTO => r.type === "retailer-search")?.searchQuery}
              &rdquo;, not a specific product or price.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {recommendation.productResults.map((result) =>
              result.type === "exact" ? (
                <ExactProductCard key={result.id} product={result} />
              ) : (
                <a
                  key={result.retailer}
                  href={result.searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={result.reason}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs text-ink-soft hover:border-ink transition-colors"
                >
                  Search {result.retailer} <ExternalLink className="h-3 w-3" />
                </a>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Renders a genuine product result from a real provider (currently never
// exercised — RetailerSearchProvider never returns "exact" results — but the
// UI is ready the moment a real provider is configured). Only ever displays
// fields the provider actually returned; never fabricates a rating, stock
// status, or discount.
function ExactProductCard({ product }: { product: ExactProductDTO }) {
  return (
    <a
      href={product.productUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full sm:w-40 rounded-xl border border-line overflow-hidden hover:border-ink/40 transition-colors"
    >
      <div className="relative aspect-[4/5] bg-paper-alt">
        <Image src={product.imageUrl} alt={product.title} fill sizes="160px" className="object-cover" unoptimized />
      </div>
      <div className="p-2.5">
        <p className="text-xs font-medium truncate">{product.title}</p>
        <p className="text-[11px] text-stone">{product.retailer}</p>
        <p className="text-sm font-display mt-1">{formatCurrency(product.price, product.currency)}</p>
        {product.rating !== undefined && (
          <p className="text-[11px] text-stone flex items-center gap-1 mt-0.5">
            <Star className="h-3 w-3 fill-current" /> {product.rating.toFixed(1)}
            {product.reviewCount !== undefined ? ` · ${product.reviewCount.toLocaleString()}` : ""}
          </p>
        )}
        {product.availability === "out_of_stock" && <p className="text-[11px] text-warning mt-0.5">Out of stock</p>}
      </div>
    </a>
  );
}

function MetaChip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-alt px-3 py-1.5 text-xs text-ink-soft">
      {icon}
      {children}
    </span>
  );
}

function ScorePill({ label, value, emphasize }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <div className={cn("rounded-xl px-2 py-2.5 text-center", emphasize ? "bg-lime text-lime-ink" : "bg-paper-alt")}>
      <p className="font-display text-lg">{value}%</p>
      <p className={cn("text-[10px] mt-0.5", emphasize ? "text-lime-ink/70" : "text-stone")}>{label}</p>
    </div>
  );
}
