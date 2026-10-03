import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userToLearnedPreferences } from "@/lib/serializers";

// Powers the Style DNA "Teach matchin'" A/B cards (Style Play) — each answer
// increments exactly the one attribute key the question targets, in the
// same likedAttributes/dislikedAttributes shape outfit feedback already
// uses (lib/prompts/styleLearner.ts), so Style Play answers genuinely move
// the same Style DNA axes real feedback does. No second preference model.
const TeachSchema = z.object({
  key: z.string().min(1), // e.g. "fit:Oversized", "formality:casual", "style:Minimal"
  liked: z.boolean(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = TeachSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = userToLearnedPreferences(user);
  const bucket = parsed.data.liked ? prefs.likedAttributes : prefs.dislikedAttributes;
  bucket[parsed.data.key] = (bucket[parsed.data.key] ?? 0) + 1;
  prefs.totalFeedback += 1;

  await db.user.update({ where: { id: user.id }, data: { learnedPreferences: JSON.stringify(prefs) } });

  return NextResponse.json(prefs);
}
