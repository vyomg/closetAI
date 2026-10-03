import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveImage } from "@/lib/storage";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db.wishlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  const category = formData.get("category") ? String(formData.get("category")) : null;
  const retailer = formData.get("retailer") ? String(formData.get("retailer")) : null;
  const sourceUrl = formData.get("sourceUrl") ? String(formData.get("sourceUrl")) : null;
  const priceRaw = formData.get("price");
  const price = priceRaw && !Number.isNaN(Number(priceRaw)) ? Number(priceRaw) : null;
  const currency = formData.get("currency") ? String(formData.get("currency")) : null;
  const notes = formData.get("notes") ? String(formData.get("notes")) : null;

  let imageUrl: string | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    imageUrl = await saveImage(session.user.id, file, "wishlist");
  }

  const item = await db.wishlistItem.create({
    data: { userId: session.user.id, name, category, retailer, sourceUrl, price, currency, notes, imageUrl },
  });

  return NextResponse.json(item);
}
