import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const FeedbackSchema = z.object({
  category: z.enum(["bug", "feature", "feedback", "other"]),
  message: z.string().min(1).max(4000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  await db.productFeedback.create({
    data: { userId: session.user.id, category: parsed.data.category, message: parsed.data.message },
  });

  return NextResponse.json({ ok: true });
}
