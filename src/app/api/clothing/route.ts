import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveImage, deleteImage, base64ToFile } from "@/lib/storage";
import { analyzeClothingImage } from "@/lib/prompts/clothingAnalyzer";
import { cleanClothingImage } from "@/lib/prompts/clothingImageCleaner";
import { analysisToItemFields, clothingItemToJSON } from "@/lib/serializers";
import { AIConfigError } from "@/lib/anthropic";
import { CATEGORY_LIST, CATEGORIES, type Category } from "@/lib/constants";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") ?? "recent";

  const items = await db.clothingItem.findMany({
    where: {
      userId: session.user.id,
      ...(category && category !== "All" ? { category } : {}),
    },
    orderBy:
      sort === "mostWorn"
        ? { wearCount: "desc" }
        : sort === "leastWorn"
          ? { wearCount: "asc" }
          : { createdAt: "desc" },
  });

  return NextResponse.json(items.map(clothingItemToJSON));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    // req.formData() throws when the request isn't valid multipart/form-data
    // at all (e.g. no body, wrong content-type) — a real edge case, not
    // something that should surface as an opaque 500.
    return NextResponse.json({ error: "An image file is required." }, { status: 400 });
  }
  const file = formData.get("image");
  const categoryHint = formData.get("category");
  const subcategoryHint = formData.get("subcategory");
  const nameHint = formData.get("name");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "An image file is required." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are supported." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 10MB." }, { status: 400 });
  }

  let imageUrl: string;
  try {
    imageUrl = await saveImage(session.user.id, file);
  } catch (err) {
    // Never let a storage failure surface as an opaque, unhandled 500 — log
    // the real cause server-side (the error message from @vercel/blob never
    // contains the token value itself, so this is safe to log) and return a
    // specific, honest error distinct from "AI analysis failed" or "server
    // error" so the client can tell the difference.
    console.error("Vercel Blob upload failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Image upload failed — our storage service couldn't accept the file. Please try again shortly.", code: "IMAGE_UPLOAD_FAILED" },
      { status: 502 }
    );
  }

  const fallbackCategory: Category =
    typeof categoryHint === "string" && CATEGORY_LIST.includes(categoryHint as Category)
      ? (categoryHint as Category)
      : "Tops";
  const fallbackSubcategory =
    typeof subcategoryHint === "string" && subcategoryHint
      ? subcategoryHint
      : CATEGORIES[fallbackCategory][0];

  let aiUnavailable = false;
  let fields: ReturnType<typeof analysisToItemFields>;
  const bytes = Buffer.from(await file.arrayBuffer());
  const base64Image = bytes.toString("base64");

  try {
    const analysis = await analyzeClothingImage(base64Image, file.type);
    fields = analysisToItemFields(analysis);
  } catch (err) {
    if (err instanceof AIConfigError) {
      aiUnavailable = true;
      fields = {
        category: fallbackCategory,
        subcategory: fallbackSubcategory,
        primaryColor: "Unknown",
        secondaryColors: "[]",
        pattern: "Solid",
        material: null,
        fit: "Regular",
        style: "Casual",
        brand: null,
        formality: 2,
        season: "[]",
        sleeveLength: null,
        occasions: "[]",
        pairings: "[]",
        tags: "[]",
        uncertainFields: JSON.stringify([
          "category",
          "subcategory",
          "primaryColor",
          "pattern",
          "fit",
          "style",
          "formality",
          "season",
        ]),
      };
    } else {
      console.error("Clothing analysis failed", err);
      // The image was already uploaded to Blob but will never be attached
      // to a wardrobe record — clean it up rather than leaving it orphaned.
      await deleteImage(imageUrl);
      return NextResponse.json(
        { error: "AI analysis failed. You can still add this item and fill in details manually.", code: "AI_ANALYSIS_FAILED" },
        { status: 502 }
      );
    }
  }

  // Best-effort "clean background" version for wardrobe display. Never
  // blocks or fails the upload — if it doesn't return an image, the item is
  // saved with just its original photo, exactly as before this feature.
  let processedImageUrl: string | null = null;
  if (!aiUnavailable) {
    try {
      const cleaned = await cleanClothingImage(base64Image, file.type);
      if (cleaned) {
        const processedFile = base64ToFile(cleaned.base64, cleaned.mimeType, "processed.png");
        processedImageUrl = await saveImage(session.user.id, processedFile, "processed");
      }
    } catch (err) {
      console.error("Clothing image cleanup failed (non-fatal):", err instanceof Error ? err.message : err);
    }
  }

  let item;
  try {
    item = await db.clothingItem.create({
      data: {
        userId: session.user.id,
        imageUrl,
        processedImageUrl,
        name: typeof nameHint === "string" && nameHint ? nameHint : `${fields.category} item`,
        ...fields,
      },
    });
  } catch (err) {
    console.error("Clothing item database save failed:", err instanceof Error ? err.message : err);
    // Same reasoning as above — the DB row was never created, so the
    // uploaded image has nothing pointing at it. Clean it up.
    await deleteImage(imageUrl);
    return NextResponse.json(
      { error: "The item was uploaded but couldn't be saved to your wardrobe. Please try again.", code: "DATABASE_SAVE_FAILED" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ...clothingItemToJSON(item), aiUnavailable });
}
