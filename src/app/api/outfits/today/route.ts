import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AIConfigError } from "@/lib/anthropic";
import { clothingItemToAI, userToStyleProfile, userToLearnedPreferences } from "@/lib/serializers";
import { filterWardrobeForWeather, recentOutfitItemIds } from "@/lib/outfitFilters";
import { getWeatherForCity, getWeatherForCoordinates, weatherToSeasonHint } from "@/lib/weather";
import { generateAndSaveOutfit } from "@/lib/generateAndSaveOutfit";

// A single one-tap action, never called automatically — see MobileHome /
// DesktopHome, which only call this from an explicit button. If an outfit
// was already generated for today, returns that one instead of generating a
// second (avoids duplicate Gemini calls for the same day).
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const existing = await db.outfit.findFirst({
    where: { userId: user.id, createdAt: { gte: startOfToday } },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { clothingItem: true } } },
  });
  if (existing) {
    return NextResponse.json({
      id: existing.id,
      occasion: existing.occasion,
      style: existing.style,
      explanation: existing.explanation,
      styleMatch: existing.styleMatch,
      occasionMatch: existing.occasionMatch,
      colorHarmony: existing.colorHarmony,
      overallScore: existing.overallScore,
      adventureLevel: existing.adventureLevel,
      isSaved: existing.isSaved,
      createdAt: existing.createdAt,
      alreadyExisted: true,
      items: existing.items.map((oi) => ({
        slot: oi.slot,
        id: oi.clothingItem.id,
        imageUrl: oi.clothingItem.imageUrl,
        name: oi.clothingItem.name,
      })),
    });
  }

  const wardrobeItems = await db.clothingItem.findMany({ where: { userId: user.id } });
  if (wardrobeItems.length < 3) {
    return NextResponse.json(
      { error: "Add at least a few items to your wardrobe before generating outfits." },
      { status: 400 }
    );
  }

  let weather = null;
  let seasonHint: string[] | null = null;
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
      seasonHint = weatherToSeasonHint(snapshot.tempC);
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
      seasonHint = weatherToSeasonHint(snapshot.tempC);
    }
  }

  const aiWardrobe = wardrobeItems.map(clothingItemToAI);
  const filtered = filterWardrobeForWeather(aiWardrobe, seasonHint);

  const recentOutfits = await db.outfit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { items: true },
  });

  const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });

  let generateResult;
  try {
    generateResult = await generateAndSaveOutfit({
      user,
      wardrobeItems,
      filteredForAI: filtered,
      styleProfile: userToStyleProfile(user),
      learnedPreferences: userToLearnedPreferences(user),
      occasion: "Everyday",
      desiredStyle: "Custom",
      notes: `This is today's (${dayOfWeek}) one-tap outfit recommendation — pick the single strongest option for right now, considering the weather and what hasn't been worn recently.`,
      adventureLevel: 3,
      weather,
      recentOutfitItemIds: recentOutfitItemIds(recentOutfits),
    });
  } catch (err) {
    if (err instanceof AIConfigError) {
      return NextResponse.json({ error: err.message, code: "AI_UNAVAILABLE" }, { status: 503 });
    }
    console.error("Today's Outfit generation failed", err);
    return NextResponse.json({ error: "Couldn't put together today's outfit. Please try again." }, { status: 502 });
  }

  if (!generateResult.ok) {
    return NextResponse.json({ error: generateResult.error, validationErrors: generateResult.validationErrors }, { status: generateResult.status });
  }

  return NextResponse.json({ ...generateResult.outfit, alreadyExisted: false });
}
