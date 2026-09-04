import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const outfit = await db.outfit.findFirst({ where: { id, userId: session.user.id }, include: { items: true } });
  if (!outfit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.wearHistory.create({ data: { userId: session.user.id, outfitId: id } });

  await Promise.all(
    outfit.items.map((oi) =>
      db.clothingItem.update({
        where: { id: oi.clothingItemId },
        data: { wearCount: { increment: 1 }, lastWornAt: new Date() },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
