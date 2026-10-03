import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter"); // all | unread | read

  const notifications = await db.notification.findMany({
    where: {
      userId: session.user.id,
      ...(filter === "unread" ? { read: false } : filter === "read" ? { read: true } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = await db.notification.count({ where: { userId: session.user.id, read: false } });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  // { id: string } marks one as read; { all: true } marks everything read.
  if (body?.all === true) {
    await db.notification.updateMany({ where: { userId: session.user.id, read: false }, data: { read: true } });
    return NextResponse.json({ ok: true });
  }
  if (typeof body?.id === "string") {
    const notification = await db.notification.findFirst({ where: { id: body.id, userId: session.user.id } });
    if (!notification) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.notification.update({ where: { id: notification.id }, data: { read: true } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid request." }, { status: 400 });
}
