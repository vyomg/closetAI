import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clothingItemToJSON } from "@/lib/serializers";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColors: z.array(z.string()).optional(),
  pattern: z.string().optional(),
  material: z.string().nullable().optional(),
  fit: z.string().optional(),
  style: z.string().optional(),
  formality: z.number().min(1).max(5).optional(),
  season: z.array(z.string()).optional(),
  sleeveLength: z.string().nullable().optional(),
  occasions: z.array(z.string()).optional(),
  pairings: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const item = await db.clothingItem.findFirst({ where: { id, userId: session.user.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(clothingItemToJSON(item));
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await db.clothingItem.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  const d = parsed.data;
  const item = await db.clothingItem.update({
    where: { id },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.category !== undefined ? { category: d.category } : {}),
      ...(d.subcategory !== undefined ? { subcategory: d.subcategory } : {}),
      ...(d.primaryColor !== undefined ? { primaryColor: d.primaryColor } : {}),
      ...(d.secondaryColors !== undefined ? { secondaryColors: JSON.stringify(d.secondaryColors) } : {}),
      ...(d.pattern !== undefined ? { pattern: d.pattern } : {}),
      ...(d.material !== undefined ? { material: d.material } : {}),
      ...(d.fit !== undefined ? { fit: d.fit } : {}),
      ...(d.style !== undefined ? { style: d.style } : {}),
      ...(d.formality !== undefined ? { formality: d.formality } : {}),
      ...(d.season !== undefined ? { season: JSON.stringify(d.season) } : {}),
      ...(d.sleeveLength !== undefined ? { sleeveLength: d.sleeveLength } : {}),
      ...(d.occasions !== undefined ? { occasions: JSON.stringify(d.occasions) } : {}),
      ...(d.pairings !== undefined ? { pairings: JSON.stringify(d.pairings) } : {}),
      ...(d.tags !== undefined ? { tags: JSON.stringify(d.tags) } : {}),
      // Manual edits should never be silently overwritten by a future re-analysis.
      userEdited: true,
      uncertainFields: "[]",
    },
  });

  return NextResponse.json(clothingItemToJSON(item));
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await db.clothingItem.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.clothingItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
