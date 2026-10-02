import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shoppingPreferenceToJSON } from "@/lib/serializers";
import { CURRENCIES, resolveAutoCurrency, convertCurrency } from "@/lib/currency";
import { SHOPPING_MODES } from "@/lib/constants";

const CURRENCY_CODES = ["AUTO", ...CURRENCIES.map((c) => c.code)] as [string, ...string[]];

const PreferenceSchema = z.object({
  budgetMin: z.number().min(0).nullable().optional(),
  budgetMax: z.number().min(0).nullable().optional(),
  currency: z.enum(CURRENCY_CODES).optional(),
  preferredColors: z.array(z.string()).optional(),
  avoidedColors: z.array(z.string()).optional(),
  preferredCategories: z.array(z.string()).optional(),
  preferredSubcategories: z.array(z.string()).optional(),
  preferredRetailers: z.array(z.string()).optional(),
  preferredFits: z.array(z.string()).optional(),
  preferredMaterials: z.array(z.string()).optional(),
  priorities: z.array(z.string()).optional(),
  shoppingMode: z.enum(["", ...SHOPPING_MODES] as [string, ...string[]]).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pref = await db.shoppingPreference.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json(shoppingPreferenceToJSON(pref));
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = PreferenceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid shopping preferences." }, { status: 400 });
  const d = parsed.data;

  const [user, existing] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id } }),
    db.shoppingPreference.findUnique({ where: { userId: session.user.id } }),
  ]);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // If the currency is changing (and the caller didn't also explicitly set
  // a new budget in the same request), convert the existing budget so the
  // user's actual spending intent is preserved rather than silently
  // reinterpreting the number in a new currency. If either side can't be
  // resolved (e.g. no location set yet), we deliberately skip conversion —
  // never guess a rate, and never guess a currency.
  let convertedBudgetMin: number | null | undefined;
  let convertedBudgetMax: number | null | undefined;
  let conversionFailed = false;

  if (d.currency !== undefined) {
    const previousCode =
      (existing?.currency ?? "AUTO") === "AUTO" ? resolveAutoCurrency(user.country, user.countryCode) : existing!.currency;
    const nextCode = d.currency === "AUTO" ? resolveAutoCurrency(user.country, user.countryCode) : d.currency;

    if (previousCode && nextCode && previousCode !== nextCode) {
      if (d.budgetMin === undefined && existing?.budgetMin != null) {
        const result = await convertCurrency(existing.budgetMin, previousCode, nextCode);
        if (result.ok) convertedBudgetMin = Math.round(result.amount);
        else conversionFailed = true;
      }
      if (d.budgetMax === undefined && existing?.budgetMax != null) {
        const result = await convertCurrency(existing.budgetMax, previousCode, nextCode);
        if (result.ok) convertedBudgetMax = Math.round(result.amount);
        else conversionFailed = true;
      }
    }
  }

  const pref = await db.shoppingPreference.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      budgetMin: d.budgetMin ?? convertedBudgetMin ?? null,
      budgetMax: d.budgetMax ?? convertedBudgetMax ?? null,
      currency: d.currency ?? "AUTO",
      preferredColors: JSON.stringify(d.preferredColors ?? []),
      avoidedColors: JSON.stringify(d.avoidedColors ?? []),
      preferredCategories: JSON.stringify(d.preferredCategories ?? []),
      preferredSubcategories: JSON.stringify(d.preferredSubcategories ?? []),
      preferredRetailers: JSON.stringify(d.preferredRetailers ?? []),
      preferredFits: JSON.stringify(d.preferredFits ?? []),
      preferredMaterials: JSON.stringify(d.preferredMaterials ?? []),
      priorities: JSON.stringify(d.priorities ?? []),
      shoppingMode: d.shoppingMode ?? "",
    },
    update: {
      ...(d.budgetMin !== undefined ? { budgetMin: d.budgetMin } : convertedBudgetMin !== undefined ? { budgetMin: convertedBudgetMin } : {}),
      ...(d.budgetMax !== undefined ? { budgetMax: d.budgetMax } : convertedBudgetMax !== undefined ? { budgetMax: convertedBudgetMax } : {}),
      ...(d.currency !== undefined ? { currency: d.currency } : {}),
      ...(d.preferredColors !== undefined ? { preferredColors: JSON.stringify(d.preferredColors) } : {}),
      ...(d.avoidedColors !== undefined ? { avoidedColors: JSON.stringify(d.avoidedColors) } : {}),
      ...(d.preferredCategories !== undefined ? { preferredCategories: JSON.stringify(d.preferredCategories) } : {}),
      ...(d.preferredSubcategories !== undefined ? { preferredSubcategories: JSON.stringify(d.preferredSubcategories) } : {}),
      ...(d.preferredRetailers !== undefined ? { preferredRetailers: JSON.stringify(d.preferredRetailers) } : {}),
      ...(d.preferredFits !== undefined ? { preferredFits: JSON.stringify(d.preferredFits) } : {}),
      ...(d.preferredMaterials !== undefined ? { preferredMaterials: JSON.stringify(d.preferredMaterials) } : {}),
      ...(d.priorities !== undefined ? { priorities: JSON.stringify(d.priorities) } : {}),
      ...(d.shoppingMode !== undefined ? { shoppingMode: d.shoppingMode } : {}),
    },
  });

  return NextResponse.json({ ...shoppingPreferenceToJSON(pref), conversionFailed });
}
