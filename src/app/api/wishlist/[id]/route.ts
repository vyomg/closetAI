import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteImage } from "@/lib/storage";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const item = await db.wishlistItem.findFirst({ where: { id, userId: session.user.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.wishlistItem.delete({ where: { id: item.id } });
  if (item.imageUrl) {
    await deleteImage(item.imageUrl).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
