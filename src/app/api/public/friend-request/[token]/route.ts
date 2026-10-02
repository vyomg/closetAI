import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { outfitToPublicJSON } from "@/lib/serializers";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { token } = await params;

  const request_ = await db.friendOutfitRequest.findUnique({
    where: { token },
    include: { outfit: { include: { items: { include: { clothingItem: true } } } } },
  });

  if (!request_) {
    return NextResponse.json({ error: "This link is no longer available." }, { status: 404 });
  }

  return NextResponse.json({
    question: request_.question,
    responseType: request_.responseType,
    responseComment: request_.responseComment,
    respondedAt: request_.respondedAt,
    outfit: outfitToPublicJSON(request_.outfit),
  });
}
