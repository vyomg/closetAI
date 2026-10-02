import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userToStyleProfile, shoppingPreferenceToJSON } from "@/lib/serializers";
import { resolveShoppingContext } from "@/lib/shoppingContext";
import { productProvider } from "@/lib/productProvider";
import { CATEGORY_LIST } from "@/lib/constants";

// Used by "Should I Buy This?" (section 33) — after Gemini's clothing-vision
// pipeline has already analyzed an uploaded item, this searches using those
// SAME structured attributes rather than running any new image pipeline.
// On-demand only (a distinct button click), not run automatically on every
// upload, to avoid unnecessary product-search calls.
const RequestSchema = z.object({
  category: z.enum(CATEGORY_LIST as [string, ...string[]]),
  subcategory: z.string().min(1),
  color: z.string().min(1),
  fit: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const input = parsed.data;

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shoppingPreference = await db.shoppingPreference.findUnique({ where: { userId: user.id } });
  const shoppingPrefData = shoppingPreferenceToJSON(shoppingPreference);
  const styleProfile = userToStyleProfile(user);
  const { currency } = await resolveShoppingContext(user, shoppingPreference);

  const search = await productProvider.searchProducts({
    category: input.category,
    subcategory: input.subcategory,
    colors: [input.color],
    budgetMin: shoppingPrefData.budgetMin,
    budgetMax: shoppingPrefData.budgetMax,
    currency,
    fit: input.fit ?? shoppingPrefData.preferredFits[0] ?? null,
    material: input.material ?? shoppingPrefData.preferredMaterials[0] ?? null,
    styleTags: styleProfile.preferredStyles,
    retailerNames: shoppingPrefData.preferredRetailers,
    countryCode: user.countryCode,
    priceTier: null,
  });

  return NextResponse.json(search);
}
