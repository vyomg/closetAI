import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clothingItemToJSON } from "@/lib/serializers";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const trip = await db.trip.findFirst({
    where: { id, userId: session.user.id },
    include: {
      outfits: { include: { items: { include: { clothingItem: true } } } },
      packingItems: { include: { clothingItem: true } },
    },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: trip.id,
    destination: trip.destination,
    startDate: trip.startDate.toISOString().slice(0, 10),
    endDate: trip.endDate.toISOString().slice(0, 10),
    occasions: JSON.parse(trip.occasions || "[]"),
    outfits: trip.outfits.map((o) => ({
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
      items: o.items.map((oi) => ({ slot: oi.slot, ...clothingItemToJSON(oi.clothingItem) })),
    })),
    packingItems: trip.packingItems.map((p) => ({ id: p.id, note: p.note, item: clothingItemToJSON(p.clothingItem) })),
  });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await db.trip.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.trip.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
