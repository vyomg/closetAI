import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { outfitToPublicJSON } from "@/lib/serializers";

type RouteParams = { params: Promise<{ token: string }> };

// Deliberately unauthenticated — this is the whole point of a share link.
// Only ever returns the one outfit this token points to, via
// outfitToPublicJSON's narrow shape. Never touches User/appearance-profile
// data, and never lists other outfits/wardrobe items.
export async function GET(_req: Request, { params }: RouteParams) {
  const { token } = await params;

  const shared = await db.sharedOutfit.findUnique({
    where: { token },
    include: { outfit: { include: { items: { include: { clothingItem: true } } } } },
  });

  if (!shared || shared.revoked) {
    return NextResponse.json({ error: "This shared outfit link is no longer available." }, { status: 404 });
  }

  return NextResponse.json(outfitToPublicJSON(shared.outfit));
}
