import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await db.outfitCalendarEntry.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.outfitCalendarEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
