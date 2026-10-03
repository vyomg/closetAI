import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AIConfigError } from "@/lib/anthropic";
import { clothingItemToAI, userToStyleProfile, userToLearnedPreferences } from "@/lib/serializers";
import { recentOutfitItemIds } from "@/lib/outfitFilters";
import { getWeatherForCity, getWeatherForCoordinates } from "@/lib/weather";
import { generateAndSaveOutfit } from "@/lib/generateAndSaveOutfit";
import { spendCredits, OUTFIT_GENERATE_COST } from "@/lib/credits";

type RouteParams = { params: Promise<{ id: string }> };

const REMIX_INSTRUCTIONS: Record<string, string> = {
  "change-shoes": "Keep the same top, bottom, and outerwear, but choose a different pair of shoes than before.",
  "change-top": "Keep the same bottom and shoes, but choose a different top than before.",
  "add-outerwear": "Keep the rest of the outfit, and add a suitable outerwear layer if one isn't already present.",
  "remove-outerwear": "Keep the rest of the outfit, but drop any outerwear layer for a lighter look.",
  "more-formal": "Keep the same general silhouette but make the outfit noticeably more formal/polished.",
  "more-casual": "Keep the same general silhouette but make the outfit noticeably more casual/relaxed.",
  "weather-appropriate": "Adjust the outfit to be better suited to today's actual weather.",
  "different-colors": "Keep the same category structure but shift toward a different color direction.",
};

const RemixSchema = z.object({
  instruction: z.enum(Object.keys(REMIX_INSTRUCTIONS) as [string, ...string[]]),
});

// Slot-preserving remix types get a deterministic "these exact items MUST
// stay" list, rather than relying only on prose instructions Gemini could
// drift from. Whole-outfit transforms (more-formal, different-colors, etc.)
// intentionally return undefined — they're meant to re-derive every slot.
const FIXED_SLOT_EXCLUDED_CATEGORY: Partial<Record<string, string>> = {
  "change-shoes": "Shoes",
  "change-top": "Tops",
  "remove-outerwear": "Outerwear",
};

function computeFixedItemIds(
  instruction: string,
  items: { clothingItemId: string; clothingItem: { category: string } }[]
): string[] | undefined {
  if (instruction === "add-outerwear") {
    // Nothing is being replaced — every current item stays, Gemini only adds
    // the (currently absent) outerwear layer.
    return items.map((i) => i.clothingItemId);
  }
  const excludedCategory = FIXED_SLOT_EXCLUDED_CATEGORY[instruction];
  if (!excludedCategory) return undefined;
  return items.filter((i) => i.clothingItem.category !== excludedCategory).map((i) => i.clothingItemId);
}

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = RemixSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid remix instruction." }, { status: 400 });

  const sourceOutfit = await db.outfit.findFirst({
    where: { id, userId: session.user.id },
    include: { items: { include: { clothingItem: true } } },
  });
  if (!sourceOutfit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.creditBalance < OUTFIT_GENERATE_COST) {
    return NextResponse.json(
      { error: "You're out of credits. Buy more to keep remixing outfits.", code: "OUT_OF_CREDITS" },
      { status: 402 }
    );
  }

  const wardrobeItems = await db.clothingItem.findMany({ where: { userId: user.id } });
  const aiWardrobe = wardrobeItems.map(clothingItemToAI);

  let weather = null;
  if (user.latitude != null && user.longitude != null) {
    const snapshot = await getWeatherForCoordinates(user.latitude, user.longitude, user.city ?? "", user.country ?? null);
    if (snapshot) {
      weather = {
        tempC: snapshot.tempC,
        feelsLikeC: snapshot.feelsLikeC,
        condition: snapshot.condition,
        humidity: snapshot.humidity,
        precipitationProbability: snapshot.precipitationProbability,
        uvIndex: snapshot.uvIndex,
      };
    }
  } else if (user.city) {
    const snapshot = await getWeatherForCity(user.city);
    if (snapshot) {
      weather = {
        tempC: snapshot.tempC,
        feelsLikeC: snapshot.feelsLikeC,
        condition: snapshot.condition,
        humidity: snapshot.humidity,
        precipitationProbability: snapshot.precipitationProbability,
        uvIndex: snapshot.uvIndex,
      };
    }
  }

  const recentOutfits = await db.outfit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { items: true },
  });

  const sourceItemNames = sourceOutfit.items.map((oi) => `${oi.clothingItem.primaryColor} ${oi.clothingItem.subcategory}`).join(", ");
  const notes = `This is a REMIX of an existing outfit (originally: ${sourceItemNames}). ${REMIX_INSTRUCTIONS[parsed.data.instruction]} The result should still feel related to the original outfit, not a completely unrelated look.`;
  const fixedItemIds = computeFixedItemIds(parsed.data.instruction, sourceOutfit.items);

  let generateResult;
  try {
    generateResult = await generateAndSaveOutfit({
      user,
      wardrobeItems,
      filteredForAI: aiWardrobe,
      styleProfile: userToStyleProfile(user),
      learnedPreferences: userToLearnedPreferences(user),
      occasion: sourceOutfit.occasion,
      desiredStyle: sourceOutfit.style,
      notes,
      adventureLevel: sourceOutfit.adventureLevel,
      weather,
      recentOutfitItemIds: recentOutfitItemIds(recentOutfits),
      fixedItemIds,
      extraOutfitFields: { remixOfOutfitId: sourceOutfit.id },
    });
  } catch (err) {
    if (err instanceof AIConfigError) {
      return NextResponse.json({ error: err.message, code: "AI_UNAVAILABLE" }, { status: 503 });
    }
    console.error("Outfit remix failed", err);
    return NextResponse.json({ error: "Remix failed. Please try again." }, { status: 502 });
  }

  if (!generateResult.ok) {
    return NextResponse.json(
      { error: generateResult.error, validationErrors: generateResult.validationErrors },
      { status: generateResult.status }
    );
  }

  const spend = await spendCredits(user.id, OUTFIT_GENERATE_COST, "outfit_remix");

  return NextResponse.json({ ...generateResult.outfit, creditsRemaining: spend.balance });
}
