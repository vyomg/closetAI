import { NextResponse } from "next/server";
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
      createdAt: o.createdAt,
      lastWornAt: o.wears[0]?.wornAt ?? null,
      feedback: o.feedback[0]
        ? { feedbackType: o.feedback[0].feedbackType, reasons: JSON.parse(o.feedback[0].reasons || "[]") }
        : null,
      items: o.items.map((oi) => ({ slot: oi.slot, ...clothingItemToJSON(oi.clothingItem) })),
    }))
  );
}
