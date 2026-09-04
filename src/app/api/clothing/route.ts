import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveImage } from "@/lib/storage";
import { analyzeClothingImage } from "@/lib/prompts/clothingAnalyzer";
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

  const formData = await req.formData();
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

  const imageUrl = await saveImage(session.user.id, file);

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

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const analysis = await analyzeClothingImage(bytes.toString("base64"), file.type);
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
      return NextResponse.json(
        { error: "AI analysis failed. You can still add this item and fill in details manually." },
        { status: 502 }
      );
    }
  }

  const item = await db.clothingItem.create({
    data: {
      userId: session.user.id,
      imageUrl,
      name: typeof nameHint === "string" && nameHint ? nameHint : `${fields.category} item`,
      ...fields,
    },
  });

  return NextResponse.json({ ...clothingItemToJSON(item), aiUnavailable });
}
