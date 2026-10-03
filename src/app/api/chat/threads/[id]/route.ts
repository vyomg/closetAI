import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clothingItemToJSON } from "@/lib/serializers";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const thread = await db.chatThread.findFirst({
    where: { id, userId: session.user.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { outfit: { include: { items: { include: { clothingItem: true } } } } },
      },
    },
  });
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: thread.id,
    title: thread.title,
    mode: thread.mode,
    pinned: thread.pinned,
    messages: thread.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      attachmentImageUrl: m.attachmentImageUrl,
      attachmentLabel: m.attachmentLabel,
      createdAt: m.createdAt,
      outfit: m.outfit
        ? {
            id: m.outfit.id,
            occasion: m.outfit.occasion,
            style: m.outfit.style,
            explanation: m.outfit.explanation,
            styleMatch: m.outfit.styleMatch,
            occasionMatch: m.outfit.occasionMatch,
            colorHarmony: m.outfit.colorHarmony,
            overallScore: m.outfit.overallScore,
            adventureLevel: m.outfit.adventureLevel,
            isSaved: m.outfit.isSaved,
            isManual: m.outfit.isManual,
            createdAt: m.outfit.createdAt,
            items: m.outfit.items.map((oi) => ({ slot: oi.slot, ...clothingItemToJSON(oi.clothingItem) })),
          }
        : null,
    })),
  });
}

const PatchSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  mode: z.enum(["closet", "hybrid", "shopping"]).optional(),
  pinned: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const thread = await db.chatThread.findFirst({ where: { id, userId: session.user.id } });
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const updated = await db.chatThread.update({ where: { id: thread.id }, data: parsed.data });
  return NextResponse.json({ id: updated.id, title: updated.title, mode: updated.mode, pinned: updated.pinned });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const thread = await db.chatThread.findFirst({ where: { id, userId: session.user.id } });
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.chatThread.delete({ where: { id: thread.id } });
  return NextResponse.json({ ok: true });
}
