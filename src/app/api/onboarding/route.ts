import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userToLearnedPreferences } from "@/lib/serializers";
import { updateLearnedPreferences } from "@/lib/prompts/styleLearner";
import { createNotification } from "@/lib/notifications";

const StyleReactionSchema = z.object({
  style: z.string(),
  fit: z.string(),
  primaryColor: z.string(),
  formality: z.number(),
  category: z.string(),
  reaction: z.enum(["like", "dislike", "superlike"]),
});

const OnboardingSchema = z.object({
  nickname: z.string().max(60).optional(),
  shopFor: z.string().optional(),
  ageRange: z.string().optional(),
  profession: z.string().optional(),
  heightCm: z.number().min(100).max(250).optional(),
  intent: z.string().optional(),

  preferredStyles: z.array(z.string()).default([]),
  usualClothing: z.string().default(""),
  occasions: z.array(z.string()).default([]),
  fitPreference: z.string().default("Regular"),
  colorsLove: z.array(z.string()).default([]),
  colorsAvoid: z.array(z.string()).default([]),
  shoePreference: z.array(z.string()).default([]),
  preferredBrands: z.array(z.string()).default([]),
  adventurousness: z.number().min(1).max(5).default(3),
  comfortImportance: z.number().min(1).max(5).default(3),
  fashionImportance: z.number().min(1).max(5).default(3),
  formalImportance: z.number().min(1).max(5).default(3),

  // Results of the "Right if you'd wear it, left if you wouldn't" swipe
  // deck — folded into the exact same learnedPreferences engine real outfit
  // feedback uses (lib/prompts/styleLearner.ts), not a second system.
  styleReactions: z.array(StyleReactionSchema).default([]),
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
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let learned = userToLearnedPreferences(user);
  for (const r of d.styleReactions) {
    if (r.reaction === "dislike") {
      learned = updateLearnedPreferences(learned, [r], "dislike", []);
    } else {
      // superlike is still a "like" in the shared weighting model — it's a
      // stronger UI gesture, not a third bucket the scorer understands.
      learned = updateLearnedPreferences(learned, [r], "like", []);
    }
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      nickname: d.nickname || null,
      shopFor: d.shopFor || null,
      ageRange: d.ageRange || null,
      profession: d.profession || null,
      heightCm: d.heightCm ?? null,
      intent: d.intent || null,
      preferredStyles: JSON.stringify(d.preferredStyles),
      usualClothing: d.usualClothing,
      occasions: JSON.stringify(d.occasions),
      fitPreference: d.fitPreference,
      colorsLove: JSON.stringify(d.colorsLove),
      colorsAvoid: JSON.stringify(d.colorsAvoid),
      shoePreference: JSON.stringify(d.shoePreference),
      preferredBrands: JSON.stringify(d.preferredBrands),
      adventurousness: d.adventurousness,
      comfortImportance: d.comfortImportance,
      fashionImportance: d.fashionImportance,
      formalImportance: d.formalImportance,
      learnedPreferences: JSON.stringify(learned),
      onboarded: true,
    },
  });

  await createNotification({
    userId: session.user.id,
    type: "system",
    title: "Welcome to matchin' ✦",
    body: "Your style profile is set up. Add a few wardrobe pieces and ask for your first match.",
    link: "/dashboard",
  });

  return NextResponse.json({ ok: true });
}
