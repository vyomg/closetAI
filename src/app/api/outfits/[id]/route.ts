import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clothingItemToJSON } from "@/lib/serializers";

type RouteParams = { params: Promise<{ id: string }> };

const UpdateSchema = z.object({ isSaved: z.boolean().optional() });

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const outfit = await db.outfit.findFirst({
    where: { id, userId: session.user.id },
    include: { items: { include: { clothingItem: true } }, feedback: true, wears: true },
  });
  if (!outfit) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
    wearCount: outfit.wears.length,
    items: outfit.items.map((oi) => ({ slot: oi.slot, ...clothingItemToJSON(oi.clothingItem) })),
  });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await db.outfit.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  const outfit = await db.outfit.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ id: outfit.id, isSaved: outfit.isSaved });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await db.outfit.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.outfit.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
