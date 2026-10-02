import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const outfit = await db.outfit.findFirst({ where: { id, userId: session.user.id } });
  if (!outfit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const shared = await db.sharedOutfit.create({
    data: { userId: session.user.id, outfitId: outfit.id },
  });

  return NextResponse.json({ token: shared.token, url: `/s/${shared.token}` });
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  await db.sharedOutfit.updateMany({
    where: { token, outfitId: id, userId: session.user.id },
    data: { revoked: true },
  });

  return NextResponse.json({ ok: true });
}
