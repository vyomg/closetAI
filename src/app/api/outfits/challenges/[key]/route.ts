import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AIConfigError } from "@/lib/anthropic";
import { clothingItemToAI, userToStyleProfile, userToLearnedPreferences } from "@/lib/serializers";
import { recentOutfitItemIds } from "@/lib/outfitFilters";
import { getWeatherForCity, getWeatherForCoordinates } from "@/lib/weather";
import { generateAndSaveOutfit } from "@/lib/generateAndSaveOutfit";
import { OUTFIT_CHALLENGES } from "@/lib/constants";

type RouteParams = { params: Promise<{ key: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { key } = await params;

  const challenge = OUTFIT_CHALLENGES.find((c) => c.key === key);
  if (!challenge) return NextResponse.json({ error: "Unknown challenge." }, { status: 404 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wardrobeItems = await db.clothingItem.findMany({ where: { userId: user.id } });
  if (wardrobeItems.length < 3) {
    return NextResponse.json({ error: "Add at least a few items to your wardrobe first." }, { status: 400 });
  }

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

  // Two challenges name a specific selection criterion ("least-worn item",
  // "one pair of shoes") rather than a free styling brief — grounding that
  // choice in the wardrobe's actual wearCount data deterministically is more
  // reliable and reproducible than leaving Gemini to infer "least worn" from
  // the numbers itself, and it's the one place wear history genuinely
  // decides part of the outcome rather than just informing prose.
  let anchorItemId: string | undefined;
  if (challenge.key === "least-worn-item" && wardrobeItems.length > 0) {
    anchorItemId = [...wardrobeItems].sort((a, b) => a.wearCount - b.wearCount)[0].id;
  } else if (challenge.key === "one-shoe-three-outfits") {
    const shoes = wardrobeItems.filter((i) => i.category === "Shoes");
    if (shoes.length > 0) {
      anchorItemId = [...shoes].sort((a, b) => a.wearCount - b.wearCount)[0].id;
    }
  }

  let generateResult;
  try {
    generateResult = await generateAndSaveOutfit({
      user,
      wardrobeItems,
      filteredForAI: wardrobeItems.map(clothingItemToAI),
      styleProfile: userToStyleProfile(user),
      learnedPreferences: userToLearnedPreferences(user),
      occasion: challenge.occasion,
      desiredStyle: challenge.style,
      notes: `Outfit Challenge: "${challenge.title}". ${challenge.notes}`,
      adventureLevel: 3,
      weather,
      recentOutfitItemIds: recentOutfitItemIds(recentOutfits),
      anchorItemId,
      extraOutfitFields: { challengeKey: challenge.key },
    });
  } catch (err) {
    if (err instanceof AIConfigError) {
      return NextResponse.json({ error: err.message, code: "AI_UNAVAILABLE" }, { status: 503 });
    }
    console.error("Challenge outfit generation failed", err);
    return NextResponse.json({ error: "Couldn't complete that challenge. Please try again." }, { status: 502 });
  }

  if (!generateResult.ok) {
    return NextResponse.json({ error: generateResult.error, validationErrors: generateResult.validationErrors }, { status: generateResult.status });
  }

  return NextResponse.json(generateResult.outfit);
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { key } = await params;

  const completions = await db.outfit.findMany({
    where: { userId: session.user.id, challengeKey: key },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { clothingItem: true } } },
  });

  return NextResponse.json(
    completions.map((o) => ({
      id: o.id,
      occasion: o.occasion,
      overallScore: o.overallScore,
      createdAt: o.createdAt,
      items: o.items.map((oi) => ({ id: oi.clothingItem.id, imageUrl: oi.clothingItem.imageUrl })),
    }))
  );
}
