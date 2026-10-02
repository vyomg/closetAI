// Deterministic wardrobe-gap analysis for the "Buy Clothes" feature.
//
// This is intentionally NOT an AI call. Before Gemini ever sees a shopping
// question, we compute objective facts about the wardrobe in plain
// TypeScript — counts, ratios, coverage, duplication, weather/climate fit —
// the same "structured metadata over free-form AI" principle the rest of
// the app follows for outfit generation. Gemini's job (see
// prompts/shoppingStylist.ts) is only to judge which of these deterministic
// candidates are actually worth recommending, not to invent gaps or numbers
// from scratch.

import type { WardrobeItemForAI } from "@/lib/prompts/outfitGenerator";
import type { StyleProfileData } from "@/lib/types";
import type { ClimateBand } from "@/lib/weather";
import { approxConvertFromUsd } from "@/lib/currency";
import { CATEGORY_LIST, TYPICAL_PRICE_RANGE_USD, NEUTRAL_COLORS, type Category, type CapsuleType } from "@/lib/constants";

export type ShoppingPreferenceData = {
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string; // "AUTO" or an ISO code — callers resolve "AUTO" before scoring
  preferredColors: string[];
  avoidedColors: string[];
  preferredCategories: string[];
  preferredSubcategories: string[]; // "Category::Subcategory"
  preferredRetailers: string[];
  preferredFits: string[];
  preferredMaterials: string[];
  priorities: string[];
  shoppingMode: string;
};

export type WardrobeStats = {
  totalItems: number;
  byCategory: Record<string, number>;
  bySubcategory: Record<string, number>; // key: "Category::Subcategory"
  byColor: Record<string, number>;
  byFormalityBand: Record<"casual" | "smart-casual" | "formal", number>;
  bySeason: Record<string, number>;
  byOccasion: Record<string, number>;
  averageWearCount: number;
  underusedItems: WardrobeItemForAI[]; // never worn, or worn far below average
  duplicateClusters: { category: string; subcategory: string; color: string; count: number }[];
};

export function formalityBand(formality: number): "casual" | "smart-casual" | "formal" {
  if (formality <= 2) return "casual";
  if (formality === 3) return "smart-casual";
  return "formal";
}

export function computeWardrobeStats(items: WardrobeItemForAI[]): WardrobeStats {
  const byCategory: Record<string, number> = {};
  const bySubcategory: Record<string, number> = {};
  const byColor: Record<string, number> = {};
  const byFormalityBand: Record<"casual" | "smart-casual" | "formal", number> = {
    casual: 0,
    "smart-casual": 0,
    formal: 0,
  };
  const bySeason: Record<string, number> = {};
  const byOccasion: Record<string, number> = {};
  const clusterCounts = new Map<string, { category: string; subcategory: string; color: string; count: number }>();

  let totalWear = 0;

  for (const item of items) {
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
    const subKey = `${item.category}::${item.subcategory}`;
    bySubcategory[subKey] = (bySubcategory[subKey] ?? 0) + 1;
    byColor[item.primaryColor] = (byColor[item.primaryColor] ?? 0) + 1;
    byFormalityBand[formalityBand(item.formality)] += 1;
    for (const s of item.season) bySeason[s] = (bySeason[s] ?? 0) + 1;
    for (const o of item.occasions) byOccasion[o] = (byOccasion[o] ?? 0) + 1;
    totalWear += item.wearCount;

    const clusterKey = `${item.category}::${item.subcategory}::${item.primaryColor}`;
    const existing = clusterCounts.get(clusterKey);
    if (existing) existing.count += 1;
    else clusterCounts.set(clusterKey, { category: item.category, subcategory: item.subcategory, color: item.primaryColor, count: 1 });
  }

  const averageWearCount = items.length > 0 ? totalWear / items.length : 0;
  const underusedItems = [...items]
    .filter((i) => i.wearCount === 0)
    .sort((a, b) => a.wearCount - b.wearCount)
    .slice(0, 8);

  const duplicateClusters = [...clusterCounts.values()]
    .filter((c) => c.count > 2)
    .sort((a, b) => b.count - a.count);

  return {
    totalItems: items.length,
    byCategory,
    bySubcategory,
    byColor,
    byFormalityBand,
    bySeason,
    byOccasion,
    averageWearCount,
    underusedItems,
    duplicateClusters,
  };
}

export type GapCandidate = {
  id: string;
  category: Category;
  subcategory: string;
  suggestedColor: string;
  rationale: string;
  gapType: "requested" | "missing-category" | "bottleneck" | "occasion-gap" | "climate-gap" | "basics-upgrade" | "surprise";
};

const DEFAULT_SUBCATEGORY: Record<Category, string> = {
  Tops: "Shirt",
  Bottoms: "Chinos",
  Outerwear: "Jacket",
  Shoes: "Sneakers",
  Accessories: "Watch",
};

// Rough "is this subcategory lightweight / warm-weather friendly" signal,
// used only for the climate-compatibility styling score — not a hard rule.
const LIGHTWEIGHT_SUBCATEGORIES = new Set([
  "T-shirt",
  "Polo",
  "Tank top",
  "Shorts",
  "Sandals",
  "Sneakers",
  "Sunglasses",
  "Cap",
]);
const WARM_LAYER_SUBCATEGORIES = new Set([
  "Sweater",
  "Crewneck",
  "Hoodie",
  "Jacket",
  "Coat",
  "Boots",
  "Overshirt",
]);

function pickSuggestedColor(styleProfile: StyleProfileData, shopping: ShoppingPreferenceData): string {
  const candidates = [...shopping.preferredColors, ...styleProfile.colorsLove, ...NEUTRAL_COLORS];
  const avoided = new Set([...shopping.avoidedColors, ...styleProfile.colorsAvoid]);
  return candidates.find((c) => !avoided.has(c)) ?? "Neutral";
}

// Turns the user's explicit category/subcategory picks in the "Suggest
// Clothes to Buy" flow directly into candidates — this is the user actively
// telling matchin' what they want, not a gap the code inferred, so every
// preferred subcategory becomes one candidate regardless of wardrobe state.
// Deduplication/scoring downstream still decides whether it's actually worth
// recommending (e.g. heavy duplication drags the score down).
export function buildRequestedCandidates(
  preferredSubcategories: string[],
  styleProfile: StyleProfileData,
  shopping: ShoppingPreferenceData
): GapCandidate[] {
  const suggestedColor = pickSuggestedColor(styleProfile, shopping);
  const seen = new Set<string>();
  const candidates: GapCandidate[] = [];

  for (const key of preferredSubcategories) {
    const [category, subcategory] = key.split("::");
    if (!category || !subcategory || !CATEGORY_LIST.includes(category as Category)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({
      id: `requested:${key}`,
      category: category as Category,
      subcategory,
      suggestedColor,
      rationale: `You asked matchin' to look for ${subcategory.toLowerCase()}.`,
      gapType: "requested",
    });
  }

  return candidates.slice(0, 12);
}

// Occasions that generally require more formal pieces (formality 4-5).
const FORMAL_OCCASIONS = new Set(["Interview", "Business", "Presentation", "Formal Event", "Wedding"]);

export function identifyGapCandidates(
  items: WardrobeItemForAI[],
  stats: WardrobeStats,
  styleProfile: StyleProfileData,
  shopping: ShoppingPreferenceData,
  requestedOccasions: string[],
  climate?: ClimateBand | null
): GapCandidate[] {
  const candidates: GapCandidate[] = [];
  const suggestedColor = pickSuggestedColor(styleProfile, shopping);
  const avoided = new Set([...shopping.avoidedColors, ...styleProfile.colorsAvoid]);

  const preferredCategories =
    shopping.preferredCategories.length > 0 ? shopping.preferredCategories : CATEGORY_LIST;

  // 1. Missing categories entirely.
  for (const category of CATEGORY_LIST) {
    if (!preferredCategories.includes(category)) continue;
    if ((stats.byCategory[category] ?? 0) === 0) {
      candidates.push({
        id: `missing:${category}`,
        category,
        subcategory: DEFAULT_SUBCATEGORY[category],
        suggestedColor,
        rationale: `You don't own any ${category.toLowerCase()} yet, so matchin' can't build outfits that need one.`,
        gapType: "missing-category",
      });
    }
  }

  // 2. Bottleneck: far more tops than bottoms (or vice versa) limits outfit combinations.
  const tops = stats.byCategory["Tops"] ?? 0;
  const bottoms = stats.byCategory["Bottoms"] ?? 0;
  const shoes = stats.byCategory["Shoes"] ?? 0;
  if (tops >= 4 && bottoms > 0 && tops > bottoms * 2.5 && preferredCategories.includes("Bottoms")) {
    candidates.push({
      id: "bottleneck:Bottoms",
      category: "Bottoms",
      subcategory: DEFAULT_SUBCATEGORY.Bottoms,
      suggestedColor,
      rationale: `You have ${tops} tops but only ${bottoms} bottom${bottoms === 1 ? "" : "s"} — that's the bottleneck limiting how many outfits matchin' can put together.`,
      gapType: "bottleneck",
    });
  }
  if (bottoms >= 4 && shoes > 0 && bottoms > shoes * 2.5 && preferredCategories.includes("Shoes")) {
    candidates.push({
      id: "bottleneck:Shoes",
      category: "Shoes",
      subcategory: "Sneakers",
      suggestedColor,
      rationale: `You have plenty of bottoms and tops but only ${shoes} pair${shoes === 1 ? "" : "s"} of shoes to pair them with.`,
      gapType: "bottleneck",
    });
  }

  // 3. Occasion coverage: occasions the user actually dresses for (profile +
  // recent outfit requests) that skew formal, but the wardrobe has little to
  // no formal-band coverage in the category that matters most for them.
  const occasionsToCheck = new Set([...styleProfile.occasions, ...requestedOccasions]);
  const needsFormal = [...occasionsToCheck].some((o) => FORMAL_OCCASIONS.has(o));
  if (needsFormal) {
    const formalShoes = items.filter((i) => i.category === "Shoes" && i.formality >= 4).length;
    if (formalShoes === 0 && preferredCategories.includes("Shoes")) {
      candidates.push({
        id: "occasion:formal-shoes",
        category: "Shoes",
        subcategory: "Formal shoes",
        suggestedColor: avoided.has("Black") ? "Brown" : "Black",
        rationale: `You dress for ${[...occasionsToCheck].filter((o) => FORMAL_OCCASIONS.has(o)).join(", ")}, but none of your shoes are formal enough for those.`,
        gapType: "occasion-gap",
      });
    }
    const formalOuterwear = items.filter((i) => i.category === "Outerwear" && i.formality >= 4).length;
    if (formalOuterwear === 0 && preferredCategories.includes("Outerwear")) {
      candidates.push({
        id: "occasion:blazer",
        category: "Outerwear",
        subcategory: "Blazer",
        suggestedColor: avoided.has("Navy") ? "Grey" : "Navy",
        rationale: `A tailored layer would round out the formal occasions you dress for — you don't currently have one.`,
        gapType: "occasion-gap",
      });
    }
  }

  // 4. Climate: the user's current environment makes some categories more
  // useful than others, independent of formality. A hot climate with little
  // lightweight coverage, or a cold climate with no warm layering, is a real
  // signal worth surfacing.
  if (climate === "hot" || climate === "warm") {
    const lightweightBottoms = items.filter(
      (i) => i.category === "Bottoms" && LIGHTWEIGHT_SUBCATEGORIES.has(i.subcategory)
    ).length;
    if (lightweightBottoms === 0 && bottoms > 0 && preferredCategories.includes("Bottoms")) {
      candidates.push({
        id: "climate:lightweight-bottoms",
        category: "Bottoms",
        subcategory: "Shorts",
        suggestedColor,
        rationale: `You live somewhere warm, but all your bottoms are heavier trousers/jeans — lightweight bottoms would suit your climate better.`,
        gapType: "climate-gap",
      });
    }
  }
  if (climate === "cold" || climate === "cool") {
    const warmLayers = items.filter(
      (i) => (i.category === "Tops" || i.category === "Outerwear") && WARM_LAYER_SUBCATEGORIES.has(i.subcategory)
    ).length;
    if (warmLayers === 0 && preferredCategories.includes("Outerwear")) {
      candidates.push({
        id: "climate:warm-layer",
        category: "Outerwear",
        subcategory: "Jacket",
        suggestedColor,
        rationale: `Your climate runs cold, but you don't have a warm layering piece — a jacket would get real use.`,
        gapType: "climate-gap",
      });
    }
  }

  // 5. Basics upgrade: an underused, heavily-duplicated basic is a signal to
  // stop buying more of the same rather than a real gap — surface it as a
  // low-priority "reconsider" note instead of a purchase candidate. We only
  // add a genuine basics-upgrade candidate when a common casual subcategory
  // is completely absent among low-formality items.
  const hasCasualTop = items.some((i) => i.category === "Tops" && i.formality <= 2);
  if (!hasCasualTop && tops > 0 && preferredCategories.includes("Tops")) {
    candidates.push({
      id: "basics:casual-top",
      category: "Tops",
      subcategory: "T-shirt",
      suggestedColor,
      rationale: `All your tops sit on the dressier side — a simple casual layer is missing for everyday wear.`,
      gapType: "basics-upgrade",
    });
  }

  // 6. "Surprise me" priority: if explicitly requested and nothing else was
  // found, suggest one deliberately different statement piece rather than
  // returning nothing.
  if (shopping.priorities.includes("Surprise me") && candidates.length === 0) {
    const leastCommonCategory = [...preferredCategories].sort(
      (a, b) => (stats.byCategory[a] ?? 0) - (stats.byCategory[b] ?? 0)
    )[0] as Category | undefined;
    if (leastCommonCategory) {
      candidates.push({
        id: "surprise:1",
        category: leastCommonCategory,
        subcategory: DEFAULT_SUBCATEGORY[leastCommonCategory],
        suggestedColor: shopping.preferredColors[0] ?? suggestedColor,
        rationale: `A statement piece in ${leastCommonCategory.toLowerCase()} would add some variety without needing anything else to change.`,
        gapType: "surprise",
      });
    }
  }

  return candidates.slice(0, 8);
}

export type RecommendationScores = {
  wardrobeCompatibility: number;
  outfitPotential: number;
  colorCompatibility: number;
  weatherCompatibility: number;
  budgetFit: number | null;
  duplicationPenalty: number; // 0 = no overlap with what's owned, 100 = near-identical to several owned items
  overallScore: number;
  closetROI: number; // overallScore/10, one decimal — the user-facing "Closet ROI: X/10"
  worksWithCount: number;
  newOutfitCombos: number;
  duplicateCount: number; // items already owned that are near-identical (same category+subcategory+colour)
};

const REQUIRED_SLOTS: Category[] = ["Tops", "Bottoms", "Shoes"];

// Documented recommendation-score weights (section 44). These apply to the
// baseline "Fill wardrobe gaps" shopping mode; other modes nudge a couple of
// weights (see SHOPPING_MODE_WEIGHT_NUDGES below) but always re-normalize so
// they still sum to 1 — Gemini never sees or influences these numbers.
const BASE_WEIGHTS = {
  wardrobeCompatibility: 0.22,
  outfitPotential: 0.18,
  colorCompatibility: 0.13,
  styleMatch: 0.13,
  budgetFit: 0.13,
  weatherCompatibility: 0.11,
  duplicationPenalty: 0.1, // subtracted, not added — see below
};

// Per-shoppingMode adjustments layered onto BASE_WEIGHTS before
// re-normalizing. Only the listed keys are nudged; everything else keeps its
// base weight.
const SHOPPING_MODE_WEIGHT_NUDGES: Record<string, Partial<typeof BASE_WEIGHTS>> = {
  "Seasonal refresh": { weatherCompatibility: 0.24, wardrobeCompatibility: 0.16 },
  "Fill wardrobe gaps": { wardrobeCompatibility: 0.28, outfitPotential: 0.2 },
  "Complete an outfit": { outfitPotential: 0.28, wardrobeCompatibility: 0.24 },
  "Buy for an occasion": { styleMatch: 0.2, colorCompatibility: 0.16 },
  "Buy for a trip": { weatherCompatibility: 0.2, wardrobeCompatibility: 0.2 },
  "Upgrade my style": { styleMatch: 0.22, colorCompatibility: 0.16 },
  "Just browse": { duplicationPenalty: 0.16 }, // be more conservative when the user isn't shopping with intent
};

function resolveWeights(shoppingMode: string | undefined) {
  const nudges = shoppingMode ? SHOPPING_MODE_WEIGHT_NUDGES[shoppingMode] : undefined;
  const weights = { ...BASE_WEIGHTS, ...nudges };
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  // Re-normalize so the (non-penalty) weights still sum to ~1.
  const scale = 1 / sum;
  return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v * scale])) as typeof BASE_WEIGHTS;
}

export function scoreCandidate(
  candidate: GapCandidate,
  items: WardrobeItemForAI[],
  styleProfile: StyleProfileData,
  shopping: ShoppingPreferenceData,
  styleMatchFromAI: number,
  resolvedCurrency: string | null,
  climate?: ClimateBand | null,
  shoppingMode?: string
): RecommendationScores {
  const candidateFormality = candidate.gapType === "occasion-gap" ? 4 : 3;

  // Wardrobe compatibility: how many existing items in complementary
  // required slots sit within one formality point of this candidate.
  const complementarySlots = REQUIRED_SLOTS.filter((s) => s !== candidate.category);
  const compatibleByCategory: Record<string, number> = {};
  for (const slot of complementarySlots) {
    compatibleByCategory[slot] = items.filter(
      (i) => i.category === slot && Math.abs(i.formality - candidateFormality) <= 1
    ).length;
  }
  const worksWithCount = Object.values(compatibleByCategory).reduce((a, b) => a + b, 0);
  const relevantTotal = items.filter((i) => complementarySlots.includes(i.category as Category)).length;
  const wardrobeCompatibility =
    relevantTotal > 0 ? Math.round(Math.min(100, (worksWithCount / relevantTotal) * 100)) : 50;

  // Outfit potential: if the candidate fills one required slot, new
  // combinations ≈ product of compatible counts across the OTHER two
  // required slots (each new combo needs one item from each required slot).
  let newOutfitCombos = 1;
  if (REQUIRED_SLOTS.includes(candidate.category)) {
    for (const slot of complementarySlots) {
      newOutfitCombos *= Math.max(1, compatibleByCategory[slot] ?? 1);
    }
  } else {
    // Outerwear/accessories layer onto existing top+bottom+shoes combos.
    const topsN = items.filter((i) => i.category === "Tops").length || 1;
    const bottomsN = items.filter((i) => i.category === "Bottoms").length || 1;
    newOutfitCombos = Math.min(topsN, bottomsN);
  }
  const outfitPotential = Math.round(Math.min(100, newOutfitCombos * 8));

  // Color compatibility: grounded in the user's own stated preferences.
  const avoided = new Set([...shopping.avoidedColors, ...styleProfile.colorsAvoid]);
  const loved = new Set([...shopping.preferredColors, ...styleProfile.colorsLove]);
  let colorCompatibility = 65;
  if (avoided.has(candidate.suggestedColor)) colorCompatibility = 20;
  else if (loved.has(candidate.suggestedColor)) colorCompatibility = 95;
  else if (NEUTRAL_COLORS.includes(candidate.suggestedColor)) colorCompatibility = 80;

  // Weather/climate compatibility: a styling signal, not a hard rule — a
  // lightweight piece scores higher in a hot climate, a warm layer scores
  // higher in a cold one, everything else is climate-neutral.
  let weatherCompatibility = 60;
  const wantsLightweight = shopping.preferredMaterials.some((m) => m === "Lightweight" || m === "Breathable");
  if (climate === "hot" || climate === "warm") {
    if (LIGHTWEIGHT_SUBCATEGORIES.has(candidate.subcategory) || wantsLightweight) weatherCompatibility = 90;
    else if (WARM_LAYER_SUBCATEGORIES.has(candidate.subcategory)) weatherCompatibility = 35;
  } else if (climate === "cold" || climate === "cool") {
    if (WARM_LAYER_SUBCATEGORIES.has(candidate.subcategory)) weatherCompatibility = 90;
    else if (LIGHTWEIGHT_SUBCATEGORIES.has(candidate.subcategory)) weatherCompatibility = 45;
  }

  // Budget fit: overlap between the category's typical price range
  // (converted into the resolved currency) and the user's stated budget.
  // Never a fabricated specific price. Skipped entirely (not guessed) when
  // no currency has been resolved yet — see resolveAutoCurrency's contract.
  let budgetFit: number | null = null;
  if ((shopping.budgetMin !== null || shopping.budgetMax !== null) && resolvedCurrency) {
    const [typicalLowUsd, typicalHighUsd] = TYPICAL_PRICE_RANGE_USD[candidate.category];
    const typicalLow = approxConvertFromUsd(typicalLowUsd, resolvedCurrency);
    const typicalHigh = approxConvertFromUsd(typicalHighUsd, resolvedCurrency);
    const budgetLow = shopping.budgetMin ?? 0;
    const budgetHigh = shopping.budgetMax ?? Number.MAX_SAFE_INTEGER;
    const overlapLow = Math.max(typicalLow, budgetLow);
    const overlapHigh = Math.min(typicalHigh, budgetHigh);
    const overlap = Math.max(0, overlapHigh - overlapLow);
    const typicalSpan = typicalHigh - typicalLow;
    budgetFit = Math.round(Math.min(100, (overlap / typicalSpan) * 100));
  }

  // Duplication penalty: how many owned items are near-identical (same
  // category + subcategory + colour) — diminishing-returns signal that
  // powers "Don't buy this" / "Low wardrobe value" messaging. Two near-
  // duplicates is normal wardrobe variety; four or more is a real signal.
  const duplicateCount = items.filter(
    (i) => i.category === candidate.category && i.subcategory === candidate.subcategory && i.primaryColor === candidate.suggestedColor
  ).length;
  const duplicationPenalty = Math.min(100, Math.max(0, (duplicateCount - 1) * 25));

  const clampedStyleMatch = Math.max(0, Math.min(100, styleMatchFromAI));
  const budgetComponent = budgetFit ?? 75; // neutral if budget/currency unresolved

  const weights = resolveWeights(shoppingMode);
  const overallScore = Math.round(
    Math.max(
      0,
      wardrobeCompatibility * weights.wardrobeCompatibility +
        outfitPotential * weights.outfitPotential +
        colorCompatibility * weights.colorCompatibility +
        clampedStyleMatch * weights.styleMatch +
        budgetComponent * weights.budgetFit +
        weatherCompatibility * weights.weatherCompatibility -
        duplicationPenalty * weights.duplicationPenalty
    )
  );

  return {
    wardrobeCompatibility,
    outfitPotential,
    colorCompatibility,
    weatherCompatibility,
    budgetFit,
    duplicationPenalty,
    overallScore,
    closetROI: overallScore / 10,
    worksWithCount,
    newOutfitCombos,
    duplicateCount,
  };
}

// Deterministic price-tier guess from the user's budget vs. a category's
// typical price range — used only to rank/filter retailers (never shown as
// a real price). Null when no budget or currency is set.
export function derivePriceTier(
  category: Category,
  budgetMax: number | null,
  resolvedCurrency: string | null
): "Budget" | "Mid" | "Premium" | "Luxury" | null {
  if (budgetMax === null || !resolvedCurrency) return null;
  const [typicalLowUsd, typicalHighUsd] = TYPICAL_PRICE_RANGE_USD[category];
  const typicalHigh = approxConvertFromUsd(typicalHighUsd, resolvedCurrency);
  const typicalLow = approxConvertFromUsd(typicalLowUsd, resolvedCurrency);
  const ratio = budgetMax / typicalHigh;
  if (budgetMax < typicalLow) return "Budget";
  if (ratio < 1.3) return "Mid";
  if (ratio < 2) return "Premium";
  return "Luxury";
}

// Priority band for "Complete My Wardrobe" — a plain-language label instead
// of a raw score, derived deterministically from the same closetROI/overall
// score every recommendation already has.
export function priorityLabel(overallScore: number): "Highest priority" | "Recommended" | "Optional" | "Not needed" {
  if (overallScore >= 85) return "Highest priority";
  if (overallScore >= 65) return "Recommended";
  if (overallScore >= 45) return "Optional";
  return "Not needed";
}

// Deterministic capsule-wardrobe selection — same "TypeScript decides, no
// fabricated numbers" principle as scoreCandidate. Picks the best `size`
// items for a given capsule type, biased toward versatility (works with the
// most complementary items), climate fit, and neutral-color mix-and-match
// potential where the capsule type calls for it. Ensures at least one item
// per required slot (Tops/Bottoms/Shoes) is included when available, since a
// capsule with zero shoes isn't useful.
export function selectCapsuleWardrobe(
  items: WardrobeItemForAI[],
  capsuleType: CapsuleType
): { itemId: string; reason: string; score: number }[] {
  function itemScore(item: WardrobeItemForAI): { score: number; reason: string } {
    const complementarySlots = REQUIRED_SLOTS.filter((s) => s !== item.category);
    let versatility = 0;
    for (const slot of complementarySlots) {
      versatility += items.filter((i) => i.category === slot && Math.abs(i.formality - item.formality) <= 1).length;
    }

    let score = Math.min(60, versatility * 4);
    const reasons: string[] = [];
    if (versatility > 0) reasons.push(`pairs with ${versatility} other piece${versatility === 1 ? "" : "s"}`);

    if (capsuleType.neutralBias && NEUTRAL_COLORS.includes(item.primaryColor)) {
      score += 20;
      reasons.push("a neutral that mixes with almost everything");
    }
    if (capsuleType.climateBias === "warm" && LIGHTWEIGHT_SUBCATEGORIES.has(item.subcategory)) {
      score += 20;
      reasons.push("lightweight for warm weather");
    }
    if (capsuleType.climateBias === "cold" && WARM_LAYER_SUBCATEGORIES.has(item.subcategory)) {
      score += 20;
      reasons.push("a warm layering piece");
    }
    if (capsuleType.formalityRange && item.formality >= capsuleType.formalityRange[0] && item.formality <= capsuleType.formalityRange[1]) {
      score += 15;
      reasons.push("right formality level for this capsule");
    }
    // Mild recency-agnostic wear bonus: a piece that's already proven useful
    // (worn before) is a safer capsule pick than one that's never been worn.
    if (item.wearCount > 0) score += 5;

    return { score: Math.round(score), reason: reasons.length > 0 ? `Selected because it ${reasons.join(" and ")}.` : "Selected for overall versatility." };
  }

  const scored = items
    .map((item) => ({ item, ...itemScore(item) }))
    .sort((a, b) => b.score - a.score);

  const selected: typeof scored = [];
  const usedIds = new Set<string>();

  // First, guarantee at least one of each required slot if the wardrobe has one.
  for (const slot of REQUIRED_SLOTS) {
    const best = scored.find((s) => s.item.category === slot && !usedIds.has(s.item.id));
    if (best) {
      selected.push(best);
      usedIds.add(best.item.id);
    }
  }

  // Then fill the rest by score.
  for (const candidate of scored) {
    if (selected.length >= capsuleType.size) break;
    if (usedIds.has(candidate.item.id)) continue;
    selected.push(candidate);
    usedIds.add(candidate.item.id);
  }

  return selected.slice(0, capsuleType.size).map((s) => ({ itemId: s.item.id, reason: s.reason, score: s.score }));
}

// Rough achievable-outfit count for a capsule: product of per-slot counts
// among the selected items, capped to avoid absurd numbers from a slot with
// many items (e.g. 6 tops isn't "6x more outfits" once other slots are the
// bottleneck — this mirrors the same slot-bottleneck logic as scoreCandidate).
export function computeCapsuleOutfitCount(selectedItems: WardrobeItemForAI[]): number {
  const counts = REQUIRED_SLOTS.map((slot) => selectedItems.filter((i) => i.category === slot).length);
  if (counts.some((c) => c === 0)) return 0;
  return counts.reduce((a, b) => a * b, 1);
}

export function buildExampleOutfit(
  candidate: GapCandidate,
  items: WardrobeItemForAI[]
): { slot: string; item: WardrobeItemForAI }[] {
  const candidateFormality = candidate.gapType === "occasion-gap" ? 4 : 3;
  const slotsNeeded = REQUIRED_SLOTS.filter((s) => s !== candidate.category);

  const picks: { slot: string; item: WardrobeItemForAI }[] = [];
  for (const slot of slotsNeeded) {
    const best = items
      .filter((i) => i.category === slot)
      .sort((a, b) => Math.abs(a.formality - candidateFormality) - Math.abs(b.formality - candidateFormality))[0];
    if (best) picks.push({ slot: slot.toLowerCase(), item: best });
  }
  return picks;
}
