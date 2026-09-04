import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { explainOutfit } from "@/lib/prompts/outfitExplainer";
import { AIConfigError } from "@/lib/anthropic";
import { clothingItemToAI, userToStyleProfile } from "@/lib/serializers";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const outfit = await db.outfit.findFirst({
    where: { id, userId: session.user.id },
    include: { items: { include: { clothingItem: true } } },
  });
  if (!outfit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const explanation = await explainOutfit({
      items: outfit.items.map((oi) => clothingItemToAI(oi.clothingItem)),
      occasion: outfit.occasion,
      style: outfit.style,
      styleProfile: userToStyleProfile(user),
    });
    return NextResponse.json({ explanation });
  } catch (err) {
    if (err instanceof AIConfigError) {
      return NextResponse.json({ explanation: outfit.explanation, note: "AI unavailable — showing the original explanation." });
    }
    console.error("Outfit explanation failed", err);
    return NextResponse.json({ explanation: outfit.explanation, note: "Couldn't generate a deeper explanation right now." });
  }
}
