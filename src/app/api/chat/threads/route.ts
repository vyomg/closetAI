import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const threads = await db.chatThread.findMany({
    where: { userId: session.user.id },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return NextResponse.json(
    threads.map((t) => ({
      id: t.id,
      title: t.title,
      mode: t.mode,
      pinned: t.pinned,
      updatedAt: t.updatedAt,
      lastMessage: t.messages[0]?.content ?? null,
    }))
  );
}

const CreateSchema = z.object({ mode: z.enum(["closet", "hybrid", "shopping"]).default("closet") });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  const mode = parsed.success ? parsed.data.mode : "closet";

  const thread = await db.chatThread.create({
    data: { userId: session.user.id, mode },
  });

  return NextResponse.json({ id: thread.id, title: thread.title, mode: thread.mode, pinned: thread.pinned, updatedAt: thread.updatedAt });
}
