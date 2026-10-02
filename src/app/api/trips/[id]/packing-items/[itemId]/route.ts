import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string; itemId: string }> };

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, itemId } = await params;

  const trip = await db.trip.findFirst({ where: { id, userId: session.user.id } });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.tripPackingItem.deleteMany({ where: { id: itemId, tripId: trip.id } });
  return NextResponse.json({ ok: true });
}
