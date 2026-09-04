import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateLearnedPreferences } from "@/lib/prompts/styleLearner";
import { userToLearnedPreferences } from "@/lib/serializers";

type RouteParams = { params: Promise<{ id: string }> };

const FeedbackSchema = z.object({
  feedbackType: z.enum(["like", "dislike"]),
  reasons: z.array(z.string()).default([]),
  comments: z.string().optional(),
});

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const outfit = await db.outfit.findFirst({
    where: { id, userId: session.user.id },
    include: { items: { include: { clothingItem: true } } },
  });
  if (!outfit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid feedback." }, { status: 400 });
  const d = parsed.data;

  await db.outfitFeedback.deleteMany({ where: { outfitId: id, userId: session.user.id } });
  await db.outfitFeedback.create({
    data: {
      userId: session.user.id,
      outfitId: id,
      feedbackType: d.feedbackType,
      reasons: JSON.stringify(d.reasons),
      comments: d.comments,
    },
  });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (user) {
    const updated = updateLearnedPreferences(
      userToLearnedPreferences(user),
      outfit.items.map((oi) => ({
        style: oi.clothingItem.style,
        fit: oi.clothingItem.fit,
        primaryColor: oi.clothingItem.primaryColor,
        formality: oi.clothingItem.formality,
        category: oi.clothingItem.category,
      })),
      d.feedbackType,
      d.reasons
    );
    await db.user.update({
      where: { id: session.user.id },
      data: { learnedPreferences: JSON.stringify(updated) },
    });
  }

  return NextResponse.json({ ok: true });
}
