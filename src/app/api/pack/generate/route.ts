import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePackingList } from "@/lib/prompts/packingAssistant";
import { AIConfigError } from "@/lib/anthropic";
import { clothingItemToAI, clothingItemToJSON, userToStyleProfile } from "@/lib/serializers";

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

  const wardrobeItems = await db.clothingItem.findMany({ where: { userId: user.id } });
  if (wardrobeItems.length < 3) {
    return NextResponse.json(
      { error: "Add a few wardrobe items before generating a packing list." },
      { status: 400 }
    );
  }

  let result;
  try {
    result = await generatePackingList({
      wardrobe: wardrobeItems.map(clothingItemToAI),
      destination: input.destination,
      days: input.days,
      weatherNotes: input.weatherNotes,
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

  return NextResponse.json({
    summary: result.summary,
    items: result.items
      .filter((i) => byId.has(i.itemId))
      .map((i) => ({ reason: i.reason, ...clothingItemToJSON(byId.get(i.itemId)!) })),
    outfitCombinations: result.outfitCombinations.map((combo) => ({
      occasion: combo.occasion,
      items: combo.itemIds.filter((id) => byId.has(id)).map((id) => clothingItemToJSON(byId.get(id)!)),
    })),
  });
}
