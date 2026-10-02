import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { outfitToPublicJSON } from "@/lib/serializers";

// The logged-in user's "Ask a Friend" inbox — every non-archived request
// they've sent, across all their outfits. Scoped strictly to session.user.id;
// there is no query-param/route-param path that can select a different
// user's data. Outfit previews reuse the same narrow outfitToPublicJSON shape
// the public /s and /ask routes use, so this never leaks more about the
// wardrobe than the one outfit each request is already tied to.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await db.friendOutfitRequest.findMany({
    where: { userId: session.user.id, archived: false },
    orderBy: { createdAt: "desc" },
    include: { outfit: { include: { items: { include: { clothingItem: true } } } } },
  });

  return NextResponse.json(
    requests.map((r) => ({
      token: r.token,
      question: r.question,
      responseType: r.responseType,
      responseComment: r.responseComment,
      respondedAt: r.respondedAt,
      createdAt: r.createdAt,
      outfit: outfitToPublicJSON(r.outfit),
    }))
  );
}

const ArchiveSchema = z.object({ token: z.string().min(1).optional() });

// "Clear" (single request) / "Clear all" — hides request(s) from the
// owner's inbox by flipping `archived`. Never deletes FriendOutfitRequest
// rows, and never touches the underlying Outfit or the friend's response.
// Scoped strictly to session.user.id, same as GET above.
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = ArchiveSchema.safeParse(body ?? {});
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  if (parsed.data.token) {
    const existing = await db.friendOutfitRequest.findFirst({
      where: { token: parsed.data.token, userId: session.user.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.friendOutfitRequest.update({
      where: { id: existing.id },
      data: { archived: true },
    });
    return NextResponse.json({ ok: true });
  }

  await db.friendOutfitRequest.updateMany({
    where: { userId: session.user.id, archived: false },
    data: { archived: true },
  });
  return NextResponse.json({ ok: true });
}
