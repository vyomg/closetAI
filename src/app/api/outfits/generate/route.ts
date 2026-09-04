import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateOutfit } from "@/lib/prompts/outfitGenerator";
import { AIConfigError } from "@/lib/anthropic";
import { clothingItemToAI, clothingItemToJSON, userToStyleProfile, userToLearnedPreferences } from "@/lib/serializers";
import { filterWardrobeForWeather, recentOutfitItemIds } from "@/lib/outfitFilters";
import { getWeatherForCity, weatherToSeasonHint } from "@/lib/weather";
import { CATEGORY_TO_SLOT } from "@/lib/constants";

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
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const input = parsed.data;

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wardrobeItems = await db.clothingItem.findMany({ where: { userId: user.id } });
  if (wardrobeItems.length < 3) {
    return NextResponse.json(
      { error: "Add at least a few items to your wardrobe before generating outfits." },
      { status: 400 }
    );
  }

  if (input.anchorItemId && !wardrobeItems.some((i) => i.id === input.anchorItemId)) {
    return NextResponse.json({ error: "That item was not found in your wardrobe." }, { status: 400 });
  }

  let weather = null as { tempC: number; condition: string } | null;
  let seasonHint: string[] | null = null;
  if (input.useWeather && user.city) {
    const snapshot = await getWeatherForCity(user.city);
    if (snapshot) {
      weather = { tempC: snapshot.tempC, condition: snapshot.condition };
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

  const adventureLevel = input.surprise ? Math.min(5, input.adventureLevel + 2) : input.adventureLevel;

  let result;
  try {
    result = await generateOutfit({
      wardrobe: filtered,
      styleProfile: userToStyleProfile(user),
      learnedPreferences: userToLearnedPreferences(user),
      occasion: input.occasion,
      desiredStyle: input.desiredStyle,
      notes: input.surprise
        ? `${input.notes} Make this a "Surprise Me" pick — something a little outside my usual comfort zone while staying wearable.`.trim()
        : input.notes,
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

  const selectedItems = wardrobeItems.filter((i) => result.selectedItemIds.includes(i.id));
  if (selectedItems.length === 0) {
    return NextResponse.json(
      { error: "The AI couldn't assemble an outfit from your wardrobe. Try adjusting your request." },
      { status: 502 }
    );
  }

  const outfit = await db.outfit.create({
    data: {
      userId: user.id,
      occasion: input.occasion,
      style: input.desiredStyle,
      explanation: result.explanation,
      styleMatch: clamp(result.styleMatch),
      occasionMatch: clamp(result.occasionMatch),
      colorHarmony: clamp(result.colorHarmony),
      overallScore: clamp(result.overallScore),
      adventureLevel,
      items: {
        create: selectedItems.map((item) => ({
          clothingItemId: item.id,
          slot: CATEGORY_TO_SLOT[item.category as keyof typeof CATEGORY_TO_SLOT] ?? "accessory",
        })),
      },
    },
    include: { items: { include: { clothingItem: true } } },
  });

  return NextResponse.json({
    id: outfit.id,
    occasion: outfit.occasion,
    style: outfit.style,
    explanation: outfit.explanation,
    styleMatch: outfit.styleMatch,
    occasionMatch: outfit.occasionMatch,
    colorHarmony: outfit.colorHarmony,
    overallScore: outfit.overallScore,
    adventureLevel: outfit.adventureLevel,
    isSaved: outfit.isSaved,
    createdAt: outfit.createdAt,
    unmetConstraints: result.unmetConstraints,
    items: outfit.items.map((oi) => ({ slot: oi.slot, ...clothingItemToJSON(oi.clothingItem) })),
  });
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
