import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clothingItemToJSON } from "@/lib/serializers";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const savedOnly = searchParams.get("saved") === "true";

  const outfits = await db.outfit.findMany({
    where: { userId: session.user.id, ...(savedOnly ? { isSaved: true } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { clothingItem: true } },
      feedback: true,
      wears: { orderBy: { wornAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json(
    outfits.map((o) => ({
      id: o.id,
      occasion: o.occasion,
      style: o.style,
      explanation: o.explanation,
      styleMatch: o.styleMatch,
      occasionMatch: o.occasionMatch,
      colorHarmony: o.colorHarmony,
      overallScore: o.overallScore,
      adventureLevel: o.adventureLevel,
      isSaved: o.isSaved,
      isManual: o.isManual,
      createdAt: o.createdAt,
      lastWornAt: o.wears[0]?.wornAt ?? null,
      feedback: o.feedback[0]
        ? { feedbackType: o.feedback[0].feedbackType, reasons: JSON.parse(o.feedback[0].reasons || "[]") }
        : null,
      items: o.items.map((oi) => ({ slot: oi.slot, ...clothingItemToJSON(oi.clothingItem) })),
    }))
  );
}

const ManualOutfitSchema = z.object({
  occasion: z.string().min(1).default("Everyday"),
  style: z.string().min(1).default("Custom"),
  items: z
    .array(z.object({ clothingItemId: z.string().min(1), slot: z.string().min(1) }))
    .min(1),
});

// Saves an outfit the user assembled by hand (the Outfit Playground) —
// no Gemini call, no outfitValidator pass, so it gets no match scores. This
// is the same Outfit/OutfitItem model every AI-generated outfit uses, just
// created directly from the user's own picks instead of through
// /api/outfits/generate, which keeps every outfit — generated or
// hand-built — showing up in the same place (My Outfits, Calendar, Wear
// history) with one data model behind it.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = ManualOutfitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const itemIds = parsed.data.items.map((i) => i.clothingItemId);
  const owned = await db.clothingItem.count({
    where: { id: { in: itemIds }, userId: session.user.id },
  });
  if (owned !== itemIds.length) {
    return NextResponse.json({ error: "One or more items don't belong to your wardrobe." }, { status: 400 });
  }

  const outfit = await db.outfit.create({
    data: {
      userId: session.user.id,
      occasion: parsed.data.occasion,
      style: parsed.data.style,
      explanation: "Put together by you in the Outfit Playground.",
      isSaved: true,
      isManual: true,
      items: { create: parsed.data.items.map((i) => ({ clothingItemId: i.clothingItemId, slot: i.slot })) },
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
    isManual: outfit.isManual,
    createdAt: outfit.createdAt,
    lastWornAt: null,
    feedback: null,
    items: outfit.items.map((oi) => ({ slot: oi.slot, ...clothingItemToJSON(oi.clothingItem) })),
  });
}
