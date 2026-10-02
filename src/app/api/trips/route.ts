import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AIConfigError } from "@/lib/anthropic";
import { clothingItemToAI, userToStyleProfile, userToLearnedPreferences } from "@/lib/serializers";
import { recentOutfitItemIds } from "@/lib/outfitFilters";
import { getWeatherForCity } from "@/lib/weather";
import { generateAndSaveOutfit } from "@/lib/generateAndSaveOutfit";

const MAX_TRIP_OUTFITS = 5;

const CreateTripSchema = z.object({
  destination: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  occasions: z.array(z.string()).min(1).max(MAX_TRIP_OUTFITS),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trips = await db.trip.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { outfits: { include: { items: { include: { clothingItem: true } } } } },
  });

  return NextResponse.json(
    trips.map((t) => ({
      id: t.id,
      destination: t.destination,
      startDate: t.startDate.toISOString().slice(0, 10),
      endDate: t.endDate.toISOString().slice(0, 10),
      occasions: JSON.parse(t.occasions || "[]"),
      outfitCount: t.outfits.length,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateTripSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid trip details." }, { status: 400 });
  const input = parsed.data;

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wardrobeItems = await db.clothingItem.findMany({ where: { userId: user.id } });
  if (wardrobeItems.length < 3) {
    return NextResponse.json({ error: "Add a few wardrobe items before planning a trip." }, { status: 400 });
  }

  const destinationWeather = await getWeatherForCity(input.destination);
  const weather = destinationWeather
    ? {
        tempC: destinationWeather.tempC,
        feelsLikeC: destinationWeather.feelsLikeC,
        condition: destinationWeather.condition,
        humidity: destinationWeather.humidity,
        precipitationProbability: destinationWeather.precipitationProbability,
        uvIndex: destinationWeather.uvIndex,
      }
    : null;

  const trip = await db.trip.create({
    data: {
      userId: user.id,
      destination: input.destination,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      occasions: JSON.stringify(input.occasions),
    },
  });

  const aiWardrobe = wardrobeItems.map(clothingItemToAI);
  const styleProfile = userToStyleProfile(user);
  const learnedPreferences = userToLearnedPreferences(user);

  const outfits = [];
  const errors: string[] = [];

  for (const occasion of input.occasions.slice(0, MAX_TRIP_OUTFITS)) {
    const recentOutfits = await db.outfit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: true },
    });

    try {
      const result = await generateAndSaveOutfit({
        user,
        wardrobeItems,
        filteredForAI: aiWardrobe,
        styleProfile,
        learnedPreferences,
        occasion,
        desiredStyle: styleProfile.preferredStyles[0] ?? "Custom",
        notes: `This outfit is for a trip to ${input.destination}. Prioritize reusing versatile pieces across the trip's other outfits where sensible.`,
        adventureLevel: 3,
        weather,
        recentOutfitItemIds: recentOutfitItemIds(recentOutfits),
        extraOutfitFields: { tripId: trip.id },
      });
      if (result.ok) outfits.push(result.outfit);
      else errors.push(`${occasion}: ${result.error}`);
    } catch (err) {
      if (err instanceof AIConfigError) {
        return NextResponse.json({ error: err.message, code: "AI_UNAVAILABLE" }, { status: 503 });
      }
      console.error("Trip outfit generation failed", err);
      errors.push(`${occasion}: generation failed`);
    }
  }

  return NextResponse.json({
    id: trip.id,
    destination: trip.destination,
    startDate: input.startDate,
    endDate: input.endDate,
    outfits,
    errors,
  });
}
