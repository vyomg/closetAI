import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AIConfigError } from "@/lib/anthropic";
import {
  clothingItemToAI,
  userToStyleProfile,
  userToLearnedPreferences,
} from "@/lib/serializers";
import {
  filterWardrobeForWeather,
  recentOutfitItemIds,
} from "@/lib/outfitFilters";
import { getWeatherForCity, getWeatherForCoordinates, weatherToSeasonHint } from "@/lib/weather";
import { generateAndSaveOutfit } from "@/lib/generateAndSaveOutfit";
import { spendCredits, OUTFIT_GENERATE_COST } from "@/lib/credits";

const GenerateSchema = z.object({
  occasion: z.string().min(1).default("Everyday"),
  desiredStyle: z.string().min(1).default("Custom"),
  notes: z.string().default(""),
  adventureLevel: z.number().min(1).max(5).default(3),
  anchorItemId: z.string().optional(),
  surprise: z.boolean().default(false),
  useWeather: z.boolean().default(true),
});

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = GenerateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }

  const input = parsed.data;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const wardrobeItems = await db.clothingItem.findMany({
    where: { userId: user.id },
  });

  if (wardrobeItems.length < 3) {
    return NextResponse.json(
      {
        error:
          "Add at least a few items to your wardrobe before generating outfits.",
      },
      { status: 400 }
    );
  }

  if (user.creditBalance < OUTFIT_GENERATE_COST) {
    return NextResponse.json(
      { error: "You're out of credits. Buy more to keep generating outfits.", code: "OUT_OF_CREDITS" },
      { status: 402 }
    );
  }

  if (
    input.anchorItemId &&
    !wardrobeItems.some((item) => item.id === input.anchorItemId)
  ) {
    return NextResponse.json(
      { error: "That item was not found in your wardrobe." },
      { status: 400 }
    );
  }

  let weather: {
    tempC: number;
    feelsLikeC: number;
    condition: string;
    humidity: number;
    precipitationProbability: number;
    uvIndex: number | null;
  } | null = null;
  let seasonHint: string[] | null = null;

  if (input.useWeather && (user.city || (user.latitude != null && user.longitude != null))) {
    const snapshot =
      user.latitude != null && user.longitude != null
        ? await getWeatherForCoordinates(user.latitude, user.longitude, user.city ?? "", user.country ?? null)
        : await getWeatherForCity(user.city!);

    if (snapshot) {
      weather = {
        tempC: snapshot.tempC,
        feelsLikeC: snapshot.feelsLikeC,
        condition: snapshot.condition,
        humidity: snapshot.humidity,
        precipitationProbability: snapshot.precipitationProbability,
        uvIndex: snapshot.uvIndex,
      };

      seasonHint = weatherToSeasonHint(snapshot.tempC);
    }
  }

  const aiWardrobe = wardrobeItems.map(clothingItemToAI);
  let filtered = filterWardrobeForWeather(aiWardrobe, seasonHint);

  /*
   * Never allow weather filtering to remove the user's explicitly
   * requested anchor item.
   */
  if (input.anchorItemId) {
    const anchor = aiWardrobe.find(
      (item) => item.id === input.anchorItemId
    );

    if (
      anchor &&
      !filtered.some((item) => item.id === input.anchorItemId)
    ) {
      filtered = [...filtered, anchor];
    }
  }

  const recentOutfits = await db.outfit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { items: true },
  });

  const adventureLevel = input.surprise
    ? Math.min(5, input.adventureLevel + 2)
    : input.adventureLevel;

  const baseNotes = input.surprise
    ? `${input.notes} Make this a "Surprise Me" pick — something a little outside my usual comfort zone while staying wearable.`.trim()
    : input.notes;

  let generateResult;
  try {
    generateResult = await generateAndSaveOutfit({
      user,
      wardrobeItems,
      filteredForAI: filtered,
      styleProfile: userToStyleProfile(user),
      learnedPreferences: userToLearnedPreferences(user),
      occasion: input.occasion,
      desiredStyle: input.desiredStyle,
      notes: baseNotes,
      adventureLevel,
      weather,
      recentOutfitItemIds: recentOutfitItemIds(recentOutfits),
      anchorItemId: input.anchorItemId,
    });
  } catch (err) {
    if (err instanceof AIConfigError) {
      return NextResponse.json({ error: err.message, code: "AI_UNAVAILABLE" }, { status: 503 });
    }
    console.error("Outfit generation failed", err);
    return NextResponse.json({ error: "Outfit generation failed. Please try again." }, { status: 502 });
  }

  if (!generateResult.ok) {
    return NextResponse.json(
      { error: generateResult.error, validationErrors: generateResult.validationErrors },
      { status: generateResult.status }
    );
  }

  const spend = await spendCredits(user.id, OUTFIT_GENERATE_COST, "outfit_generate");

  return NextResponse.json({ ...generateResult.outfit, creditsRemaining: spend.balance });
}