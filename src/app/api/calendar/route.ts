import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const CreateSchema = z.object({
  outfitId: z.string().min(1),
  date: z.string().min(1), // "YYYY-MM-DD"
  notes: z.string().max(300).optional(),
});

function parseDateOnly(value: string): Date {
  const d = new Date(`${value}T00:00:00.000Z`);
  return d;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const entries = await db.outfitCalendarEntry.findMany({
    where: {
      userId: session.user.id,
      ...(start && end ? { date: { gte: parseDateOnly(start), lte: parseDateOnly(end) } } : {}),
    },
    orderBy: { date: "asc" },
    include: { outfit: { include: { items: { include: { clothingItem: true } } } } },
  });

  return NextResponse.json(
    entries.map((e) => ({
      id: e.id,
      date: e.date.toISOString().slice(0, 10),
      notes: e.notes,
      outfit: {
        id: e.outfit.id,
        occasion: e.outfit.occasion,
        overallScore: e.outfit.overallScore,
        items: e.outfit.items.map((oi) => ({ id: oi.clothingItem.id, imageUrl: oi.clothingItem.imageUrl })),
      },
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid calendar entry." }, { status: 400 });

  const outfit = await db.outfit.findFirst({ where: { id: parsed.data.outfitId, userId: session.user.id } });
  if (!outfit) return NextResponse.json({ error: "Outfit not found." }, { status: 404 });

  const entry = await db.outfitCalendarEntry.create({
    data: {
      userId: session.user.id,
      outfitId: outfit.id,
      date: parseDateOnly(parsed.data.date),
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json({ id: entry.id, date: parsed.data.date });
}
