import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { analyzeClothingImage } from "@/lib/prompts/clothingAnalyzer";
import { AIConfigError } from "@/lib/anthropic";

type RouteParams = { params: Promise<{ id: string }> };

// Re-runs AI analysis on an item's EXISTING stored photo (does not touch
// Blob storage or upload anything new) and returns the fresh result WITHOUT
// saving it — the wardrobe detail page shows old vs. new side by side and
// only writes it via the existing PATCH endpoint if the user accepts.
export async function POST(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const item = await db.clothingItem.findFirst({ where: { id, userId: session.user.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let imageResponse: Response;
  try {
    imageResponse = await fetch(item.imageUrl);
    if (!imageResponse.ok) throw new Error(`Fetch failed with status ${imageResponse.status}`);
  } catch (err) {
    console.error("Re-analyze: failed to fetch stored image", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Couldn't load the stored photo to re-analyze." }, { status: 502 });
  }

  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
  const bytes = Buffer.from(await imageResponse.arrayBuffer());

  try {
    const analysis = await analyzeClothingImage(bytes.toString("base64"), contentType);
    return NextResponse.json({ analysis });
  } catch (err) {
    if (err instanceof AIConfigError) {
      return NextResponse.json({ error: err.message, code: "AI_UNAVAILABLE" }, { status: 503 });
    }
    console.error("Re-analyze failed", err);
    return NextResponse.json({ error: "Re-analysis failed. Please try again." }, { status: 502 });
  }
}
