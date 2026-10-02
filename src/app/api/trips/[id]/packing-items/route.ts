import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clothingItemToJSON } from "@/lib/serializers";

type RouteParams = { params: Promise<{ id: string }> };

const AddSchema = z.object({
  clothingItemId: z.string().min(1),
  note: z.string().max(200).optional(),
});

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const trip = await db.trip.findFirst({ where: { id, userId: session.user.id } });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = AddSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid item." }, { status: 400 });

  const item = await db.clothingItem.findFirst({ where: { id: parsed.data.clothingItemId, userId: session.user.id } });
  if (!item) return NextResponse.json({ error: "Item not found in your wardrobe." }, { status: 404 });

  const packingItem = await db.tripPackingItem.create({
    data: { tripId: trip.id, clothingItemId: item.id, note: parsed.data.note },
  });

  return NextResponse.json({ id: packingItem.id, note: packingItem.note, item: clothingItemToJSON(item) });
}
