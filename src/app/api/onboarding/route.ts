import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const OnboardingSchema = z.object({
  preferredStyles: z.array(z.string()).default([]),
  usualClothing: z.string().default(""),
  occasions: z.array(z.string()).default([]),
  fitPreference: z.string().default("Regular"),
  colorsLove: z.array(z.string()).default([]),
  colorsAvoid: z.array(z.string()).default([]),
  shoePreference: z.array(z.string()).default([]),
  adventurousness: z.number().min(1).max(5).default(3),
  comfortImportance: z.number().min(1).max(5).default(3),
  fashionImportance: z.number().min(1).max(5).default(3),
  formalImportance: z.number().min(1).max(5).default(3),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = OnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid onboarding data." }, { status: 400 });
  }

  const d = parsed.data;
  await db.user.update({
    where: { id: session.user.id },
    data: {
      preferredStyles: JSON.stringify(d.preferredStyles),
      usualClothing: d.usualClothing,
      occasions: JSON.stringify(d.occasions),
      fitPreference: d.fitPreference,
      colorsLove: JSON.stringify(d.colorsLove),
      colorsAvoid: JSON.stringify(d.colorsAvoid),
      shoePreference: JSON.stringify(d.shoePreference),
      adventurousness: d.adventurousness,
      comfortImportance: d.comfortImportance,
      fashionImportance: d.fashionImportance,
      formalImportance: d.formalImportance,
      onboarded: true,
    },
  });

  return NextResponse.json({ ok: true });
}
