import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ token: string }> };

const RespondSchema = z.object({
  responseType: z.enum(["love", "change-something", "suggest-another"]),
  responseComment: z.string().max(500).optional(),
});

export async function POST(req: Request, { params }: RouteParams) {
  const { token } = await params;

  const existing = await db.friendOutfitRequest.findUnique({ where: { token } });
  if (!existing) return NextResponse.json({ error: "This link is no longer available." }, { status: 404 });
  if (existing.respondedAt) {
    return NextResponse.json({ error: "This outfit already has a response." }, { status: 409 });
  }

  const body = await req.json().catch(() => null);
  const parsed = RespondSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please choose a response." }, { status: 400 });

  await db.friendOutfitRequest.update({
    where: { token },
    data: {
      responseType: parsed.data.responseType,
      responseComment: parsed.data.responseComment ?? null,
      respondedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
