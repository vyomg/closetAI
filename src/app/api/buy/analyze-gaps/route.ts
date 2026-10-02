import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AIConfigError } from "@/lib/anthropic";
import { reviewGapCandidates } from "@/lib/prompts/shoppingStylist";
import { productProvider } from "@/lib/productProvider";
import { resolveShoppingContext } from "@/lib/shoppingContext";
import {
  clothingItemToAI,
  clothingItemToJSON,
  userToStyleProfile,
  userToLearnedPreferences,
  shoppingPreferenceToJSON,
} from "@/lib/serializers";
import {
  computeWardrobeStats,
  identifyGapCandidates,
  buildRequestedCandidates,
  scoreCandidate,
  buildExampleOutfit,
  derivePriceTier,
  type GapCandidate,
} from "@/lib/wardrobeAnalysis";

const MIN_WARDROBE_SIZE = 5;

const RequestSchema = z.object({
  // "Complete My Wardrobe" (section 20): analyze every category regardless
  // of what the user last narrowed Buy Clothes down to, and return more of
  // them so the whole prioritized shopping plan can be shown.
  completeWardrobe: z.boolean().default(false),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const input = RequestSchema.parse(body ?? {});

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [wardrobeItems, shoppingPreference, recentOutfits] = await Promise.all([
    db.clothingItem.findMany({ where: { userId: user.id } }),
    db.shoppingPreference.findUnique({ where: { userId: user.id } }),
    db.outfit.findMany({ where: { userId: user.id }, select: { occasion: true }, take: 30, orderBy: { createdAt: "desc" } }),
  ]);

  if (wardrobeItems.length < MIN_WARDROBE_SIZE) {
    return NextResponse.json(
      { error: `Add at least ${MIN_WARDROBE_SIZE} items to your wardrobe before matchin' can analyze gaps in it.` },
      { status: 400 }
    );
  }

  const aiWardrobe = wardrobeItems.map(clothingItemToAI);
  const itemById = new Map(wardrobeItems.map((i) => [i.id, i]));
  const stats = computeWardrobeStats(aiWardrobe);
  const shoppingPrefData = shoppingPreferenceToJSON(shoppingPreference);
  const styleProfile = userToStyleProfile(user);
  const requestedOccasions = [...new Set(recentOutfits.map((o) => o.occasion))];

  const { weather, climate, climateProfile, forecastInsight, weatherContextText, currency, currencyIsAuto } =
    await resolveShoppingContext(user, shoppingPreference);

  const effectivePrefs = input.completeWardrobe ? { ...shoppingPrefData, preferredCategories: [] } : shoppingPrefData;

  // If the user explicitly told matchin' what to shop for (category/subcategory
  // picks in Shopping Preferences), those requested candidates take priority;
  // automatically-detected gaps fill in around them without duplicating a
  // category::subcategory the user already asked for directly.
  const requestedCandidates = input.completeWardrobe
    ? []
    : buildRequestedCandidates(shoppingPrefData.preferredSubcategories, styleProfile, effectivePrefs);
  const autoCandidates = identifyGapCandidates(aiWardrobe, stats, styleProfile, effectivePrefs, requestedOccasions, climate);

  const requestedKeys = new Set(requestedCandidates.map((c) => `${c.category}::${c.subcategory}`));
  const candidateCap = input.completeWardrobe ? 20 : 12;
  const candidates: GapCandidate[] = [
    ...requestedCandidates,
    ...autoCandidates.filter((c) => !requestedKeys.has(`${c.category}::${c.subcategory}`)),
  ].slice(0, candidateCap);

  const priceTier = derivePriceTier("Tops", shoppingPrefData.budgetMax, currency); // representative tier for retailer ranking

  if (candidates.length === 0) {
    return NextResponse.json({
      overallAdvice: "Your wardrobe already covers your categories, occasions, and formality range well — matchin' doesn't see anything worth prioritizing right now.",
      smartBrief: "You don't need to buy much right now.",
      forecastInsight,
      climateProfile,
      recommendations: [],
      stats: summarizeStats(stats),
      currency,
      currencyIsAuto,
      weather: weather ? { ...weather } : null,
      aiUnavailable: false,
    });
  }

  let review;
  let aiUnavailable = false;
  try {
    review = await reviewGapCandidates({
      candidates,
      stats,
      styleProfile,
      learnedPreferences: userToLearnedPreferences(user),
      shoppingPreference: effectivePrefs,
      weatherContext: weatherContextText,
    });
  } catch (err) {
    if (err instanceof AIConfigError) {
      aiUnavailable = true;
      review = {
        selections: candidates.map((c) => ({ candidateId: c.id, keep: true, styleMatch: 60, reason: c.rationale || "You asked matchin' to look for this." })),
        overallAdvice: "AI styling review is unavailable right now — showing the raw wardrobe gaps matchin's code found, without style filtering.",
      };
    } else {
      console.error("Gap review failed", err);
      return NextResponse.json({ error: "Couldn't analyze your wardrobe right now. Please try again." }, { status: 502 });
    }
  }

  const selectionById = new Map(review.selections.map((s) => [s.candidateId, s]));

  const recommendations = await Promise.all(
    candidates.map(async (candidate) => {
      const selection = selectionById.get(candidate.id);
      if (!selection || !selection.keep) return null;

      const scores = scoreCandidate(
        candidate,
        aiWardrobe,
        styleProfile,
        effectivePrefs,
        selection.styleMatch,
        currency,
        climate,
        shoppingPrefData.shoppingMode || undefined
      );
      const examplePicks = buildExampleOutfit(candidate, aiWardrobe).map((p) => ({
        slot: p.slot,
        ...clothingItemToJSON(itemById.get(p.item.id)!),
      }));
      const productSearch = await productProvider.searchProducts({
        category: candidate.category,
        subcategory: candidate.subcategory,
        colors: [candidate.suggestedColor],
        budgetMin: shoppingPrefData.budgetMin,
        budgetMax: shoppingPrefData.budgetMax,
        currency,
        fit: shoppingPrefData.preferredFits[0] ?? null,
        material: shoppingPrefData.preferredMaterials[0] ?? null,
        styleTags: styleProfile.preferredStyles,
        retailerNames: shoppingPrefData.preferredRetailers,
        countryCode: user.countryCode,
        priceTier,
      });

      return {
        id: candidate.id,
        category: candidate.category,
        subcategory: candidate.subcategory,
        suggestedColor: candidate.suggestedColor,
        gapType: candidate.gapType,
        reason: selection.reason,
        scores: {
          wardrobeCompatibility: scores.wardrobeCompatibility,
          outfitPotential: scores.outfitPotential,
          colorCompatibility: scores.colorCompatibility,
          weatherCompatibility: scores.weatherCompatibility,
          styleMatch: Math.max(0, Math.min(100, selection.styleMatch)),
          budgetFit: scores.budgetFit,
          duplicationPenalty: scores.duplicationPenalty,
          overallScore: scores.overallScore,
          closetROI: scores.closetROI,
        },
        worksWithCount: scores.worksWithCount,
        newOutfitCombos: scores.newOutfitCombos,
        duplicateCount: scores.duplicateCount,
        skipRecommended: scores.duplicationPenalty >= 50,
        exampleOutfit: examplePicks,
        productResults: productSearch.results,
        usedRealProvider: productSearch.usedRealProvider,
      };
    })
  );

  const kept = recommendations
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.scores.overallScore - a.scores.overallScore);

  const smartBrief = buildSmartBrief(kept, climateProfile);

  return NextResponse.json({
    overallAdvice: review.overallAdvice,
    smartBrief,
    forecastInsight,
    climateProfile,
    recommendations: kept,
    stats: summarizeStats(stats),
    currency,
    currencyIsAuto,
    weather: weather ? { ...weather } : null,
    aiUnavailable,
  });
}

function summarizeStats(stats: ReturnType<typeof computeWardrobeStats>) {
  return {
    totalItems: stats.totalItems,
    byCategory: stats.byCategory,
    byFormalityBand: stats.byFormalityBand,
    duplicateClusters: stats.duplicateClusters.slice(0, 5),
    underusedCount: stats.underusedItems.length,
  };
}

// A one-line deterministic "Smart Shopping Brief" headline (section 32) —
// composed from the top recommendation's own numbers, not a separate AI call.
function buildSmartBrief(
  kept: { subcategory: string; suggestedColor: string; newOutfitCombos: number; scores: { overallScore: number } }[],
  climateProfile: string | null
): string {
  if (kept.length === 0) {
    return climateProfile
      ? `You don't need to buy much right now for your ${climateProfile.toLowerCase()} climate.`
      : "You don't need to buy much right now.";
  }
  const top = kept[0];
  if (top.scores.overallScore < 45) {
    return "Nothing stands out as urgent — your wardrobe is reasonably well covered.";
  }
  return `Your biggest opportunity is a ${top.suggestedColor.toLowerCase()} ${top.subcategory.toLowerCase()} — it could unlock ${top.newOutfitCombos}+ new outfits.`;
}
