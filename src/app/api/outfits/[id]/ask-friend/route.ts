import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

const AskSchema = z.object({
  question: z.string().min(1).max(200).default("Should I wear this?"),
});

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const outfit = await db.outfit.findFirst({ where: { id, userId: session.user.id } });
  if (!outfit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = AskSchema.safeParse(body ?? {});
  const question = parsed.success ? parsed.data.question : "Should I wear this?";

  const request_ = await db.friendOutfitRequest.create({
    data: { userId: session.user.id, outfitId: outfit.id, question },
  });

  return NextResponse.json({ token: request_.token, url: `/ask/${request_.token}` });
}

// Lets the requester check whether a friend has responded yet, scoped to
// their own outfit's requests only.
export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const requests = await db.friendOutfitRequest.findMany({
    where: { outfitId: id, userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    requests.map((r) => ({
      token: r.token,
      question: r.question,
      responseType: r.responseType,
      responseComment: r.responseComment,
      respondedAt: r.respondedAt,
      createdAt: r.createdAt,
    }))
  );
}
