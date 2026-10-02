import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { analyzeClothingImage } from "@/lib/prompts/clothingAnalyzer";
import { evaluateShouldIBuy } from "@/lib/prompts/shoppingStylist";
import { AIConfigError } from "@/lib/anthropic";
import { clothingItemToAI, userToStyleProfile, userToLearnedPreferences, shoppingPreferenceToJSON } from "@/lib/serializers";
import { computeWardrobeStats, scoreCandidate, type GapCandidate } from "@/lib/wardrobeAnalysis";
import { resolveShoppingContext } from "@/lib/shoppingContext";
import type { Category } from "@/lib/constants";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "An image of the item is required." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are supported." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 10MB." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wardrobeItems = await db.clothingItem.findMany({ where: { userId: user.id } });
  const shoppingPreference = await db.shoppingPreference.findUnique({ where: { userId: user.id } });

  let analysis;
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    analysis = await analyzeClothingImage(bytes.toString("base64"), file.type);
  } catch (err) {
    if (err instanceof AIConfigError) {
      return NextResponse.json({ error: err.message, code: "AI_UNAVAILABLE" }, { status: 503 });
    }
    console.error("Should-I-Buy analysis failed", err);
    return NextResponse.json({ error: "Couldn't analyze that image. Please try a clearer photo." }, { status: 502 });
  }

  const aiWardrobe = wardrobeItems.map(clothingItemToAI);
  const stats = computeWardrobeStats(aiWardrobe);
  const styleProfile = userToStyleProfile(user);
  const shoppingPrefData = shoppingPreferenceToJSON(shoppingPreference);
  const { climate, weatherContextText, currency } = await resolveShoppingContext(user, shoppingPreference);

  const syntheticCandidate: GapCandidate = {
    id: "should-i-buy",
    category: analysis.category as Category,
    subcategory: analysis.subcategory,
    suggestedColor: analysis.primaryColor,
    rationale: "",
    gapType: "basics-upgrade",
  };

  const duplicateCount = wardrobeItems.filter(
    (i) => i.category === analysis.category && i.subcategory === analysis.subcategory && i.primaryColor === analysis.primaryColor
  ).length;

  let verdict;
  let aiUnavailable = false;
  try {
    const preliminaryScores = scoreCandidate(syntheticCandidate, aiWardrobe, styleProfile, shoppingPrefData, 60, currency, climate);
    verdict = await evaluateShouldIBuy({
      candidateAnalysis: analysis,
      deterministicScores: {
        wardrobeCompatibility: preliminaryScores.wardrobeCompatibility,
        outfitPotential: preliminaryScores.outfitPotential,
        colorCompatibility: preliminaryScores.colorCompatibility,
        budgetFit: preliminaryScores.budgetFit,
        duplicateCount,
      },
      stats,
      styleProfile,
      learnedPreferences: userToLearnedPreferences(user),
      shoppingPreference: shoppingPrefData,
      weatherContext: weatherContextText,
    });
  } catch (err) {
    if (err instanceof AIConfigError) {
      aiUnavailable = true;
      verdict = {
        verdict: duplicateCount > 1 ? ("Skip" as const) : ("Consider" as const),
        reasons: ["AI styling review is unavailable — this is a basic rule-of-thumb verdict only."],
        concerns: duplicateCount > 1 ? [`You already own ${duplicateCount} similar items.`] : [],
      };
    } else {
      console.error("Should-I-Buy evaluation failed", err);
      return NextResponse.json({ error: "Couldn't evaluate this item right now. Please try again." }, { status: 502 });
    }
  }

  const finalScores = scoreCandidate(
    syntheticCandidate,
    aiWardrobe,
    styleProfile,
    shoppingPrefData,
    verdict.verdict === "Strong Buy" ? 90 : verdict.verdict === "Consider" ? 60 : 30,
    currency,
    climate
  );

  // "Buy Score" is the same deterministic overallScore already computed
  // above, just surfaced as the single headline number the user sees first —
  // every component behind it (wardrobe fit, outfit potential, color match,
  // weather fit, budget fit, duplication penalty) is a real, computed value,
  // never a fabricated one. Versatility is derived from the same
  // newOutfitCombos combinatorics scoreCandidate already computes.
  const versatilityScore = Math.round(Math.min(100, finalScores.newOutfitCombos * 10));

  return NextResponse.json({
    analysis,
    verdict: verdict.verdict,
    reasons: verdict.reasons,
    concerns: verdict.concerns,
    duplicateCount,
    buyScore: finalScores.overallScore,
    scores: {
      wardrobeCompatibility: finalScores.wardrobeCompatibility,
      outfitPotential: finalScores.outfitPotential,
      colorCompatibility: finalScores.colorCompatibility,
      weatherCompatibility: finalScores.weatherCompatibility,
      budgetFit: finalScores.budgetFit,
      duplicationPenalty: finalScores.duplicationPenalty,
      versatilityScore,
      overallScore: finalScores.overallScore,
      closetROI: finalScores.closetROI,
    },
    aiUnavailable,
  });
}
