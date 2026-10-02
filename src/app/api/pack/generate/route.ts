import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePackingList } from "@/lib/prompts/packingAssistant";
import { AIConfigError } from "@/lib/anthropic";
import { clothingItemToAI, clothingItemToJSON, userToStyleProfile, shoppingPreferenceToJSON } from "@/lib/serializers";
import { getWeatherForCity, climateBand } from "@/lib/weather";
import { computeWardrobeStats, identifyGapCandidates, scoreCandidate } from "@/lib/wardrobeAnalysis";
import { resolveAutoCurrency } from "@/lib/currency";

const PackSchema = z.object({
  destination: z.string().min(1),
  days: z.number().min(1).max(60),
  weatherNotes: z.string().default(""),
  occasions: z.array(z.string()).default(["Everyday"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = PackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const input = parsed.data;

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [wardrobeItems, shoppingPreference] = await Promise.all([
    db.clothingItem.findMany({ where: { userId: user.id } }),
    db.shoppingPreference.findUnique({ where: { userId: user.id } }),
  ]);
  if (wardrobeItems.length < 3) {
    return NextResponse.json(
      { error: "Add a few wardrobe items before generating a packing list." },
      { status: 400 }
    );
  }

  // Destination weather (not the user's home city) — a trip to a colder or
  // hotter place should pack for where they're going, not where they live.
  const destinationWeather = await getWeatherForCity(input.destination);
  const destinationClimate = destinationWeather ? climateBand(destinationWeather.tempC) : null;
  const weatherContext = destinationWeather
    ? `${destinationWeather.city}${destinationWeather.country ? `, ${destinationWeather.country}` : ""}: currently ${destinationWeather.tempC}°C (feels like ${destinationWeather.feelsLikeC}°C), ${destinationWeather.condition}, ${destinationWeather.humidity}% humidity. Climate band: ${destinationClimate}. (This is today's reading, used as a proxy for the trip — combine with any dates/season the user mentioned.)`
    : null;

  let result;
  try {
    result = await generatePackingList({
      wardrobe: wardrobeItems.map(clothingItemToAI),
      destination: input.destination,
      days: input.days,
      weatherNotes: input.weatherNotes,
      weatherContext,
      occasions: input.occasions,
      styleProfile: userToStyleProfile(user),
    });
  } catch (err) {
    if (err instanceof AIConfigError) {
      return NextResponse.json({ error: err.message, code: "AI_UNAVAILABLE" }, { status: 503 });
    }
    console.error("Packing list generation failed", err);
    return NextResponse.json({ error: "Couldn't generate a packing list. Please try again." }, { status: 502 });
  }

  const byId = new Map(wardrobeItems.map((i) => [i.id, i]));

  // "Potentially worth buying": reuse the exact same deterministic gap
  // analysis Buy Clothes uses (no duplicated logic), scoped to this trip's
  // occasions and the destination's climate instead of the user's general
  // wardrobe gaps.
  const aiWardrobe = wardrobeItems.map(clothingItemToAI);
  const stats = computeWardrobeStats(aiWardrobe);
  const styleProfile = userToStyleProfile(user);
  const shoppingPrefData = shoppingPreferenceToJSON(shoppingPreference);
  const currency =
    shoppingPrefData.currency === "AUTO" ? resolveAutoCurrency(user.country, user.countryCode) : shoppingPrefData.currency;
  // A trip should weigh gaps across the whole wardrobe, not just whatever
  // categories the user last narrowed Buy Clothes down to — so this reuse
  // of the gap-analysis logic ignores that particular preference field.
  const tripShoppingPrefs = { ...shoppingPrefData, preferredCategories: [] };
  const tripCandidates = identifyGapCandidates(
    aiWardrobe,
    stats,
    styleProfile,
    tripShoppingPrefs,
    input.occasions,
    destinationClimate
  ).slice(0, 3);
  const worthBuying = tripCandidates.map((candidate) => {
    const scores = scoreCandidate(candidate, aiWardrobe, styleProfile, tripShoppingPrefs, 60, currency, destinationClimate);
    return {
      category: candidate.category,
      subcategory: candidate.subcategory,
      suggestedColor: candidate.suggestedColor,
      reason: candidate.rationale,
      overallScore: scores.overallScore,
    };
  });

  return NextResponse.json({
    summary: result.summary,
    destinationWeather,
    alreadyOwn: result.items
      .filter((i) => byId.has(i.itemId))
      .map((i) => ({ reason: i.reason, ...clothingItemToJSON(byId.get(i.itemId)!) })),
    outfitCombinations: result.outfitCombinations.map((combo) => ({
      occasion: combo.occasion,
      items: combo.itemIds.filter((id) => byId.has(id)).map((id) => clothingItemToJSON(byId.get(id)!)),
    })),
    worthBuying,
  });
}
