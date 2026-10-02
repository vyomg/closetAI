import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clothingItemToAI, clothingItemToJSON, userToStyleProfile, shoppingPreferenceToJSON } from "@/lib/serializers";
import { selectCapsuleWardrobe, computeCapsuleOutfitCount, identifyGapCandidates, computeWardrobeStats } from "@/lib/wardrobeAnalysis";
import { CAPSULE_TYPES, type CapsuleTypeKey } from "@/lib/constants";

const CreateSchema = z.object({ capsuleKey: z.string().min(1) });

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const capsules = await db.capsuleWardrobe.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    capsules.map((c) => ({
      id: c.id,
      name: c.name,
      itemIds: JSON.parse(c.itemIds || "[]"),
      explanations: JSON.parse(c.explanations || "{}"),
      missingPieces: JSON.parse(c.missingPieces || "[]"),
      outfitCount: c.outfitCount,
      createdAt: c.createdAt,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const capsuleType = CAPSULE_TYPES.find((c) => c.key === (parsed.data.capsuleKey as CapsuleTypeKey));
  if (!capsuleType) return NextResponse.json({ error: "Unknown capsule type." }, { status: 404 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [items, shoppingPreference] = await Promise.all([
    db.clothingItem.findMany({ where: { userId: user.id } }),
    db.shoppingPreference.findUnique({ where: { userId: user.id } }),
  ]);
  if (items.length < 3) {
    return NextResponse.json({ error: "Add a few wardrobe items before building a capsule." }, { status: 400 });
  }

  const aiItems = items.map(clothingItemToAI);
  const selection = selectCapsuleWardrobe(aiItems, capsuleType);
  const byId = new Map(items.map((i) => [i.id, i]));
  const selectedAiItems = selection.map((s) => aiItems.find((i) => i.id === s.itemId)!).filter(Boolean);
  const outfitCount = computeCapsuleOutfitCount(selectedAiItems);

  const styleProfile = userToStyleProfile(user);
  const shoppingPrefs = shoppingPreferenceToJSON(shoppingPreference);
  const stats = computeWardrobeStats(selectedAiItems);
  const gaps = identifyGapCandidates(selectedAiItems, stats, styleProfile, shoppingPrefs, [], null).slice(0, 3);
  const missingPieces = gaps.map((g) => `${g.suggestedColor} ${g.subcategory.toLowerCase()}`);

  const explanations: Record<string, string> = {};
  for (const s of selection) explanations[s.itemId] = s.reason;

  const capsule = await db.capsuleWardrobe.create({
    data: {
      userId: user.id,
      name: capsuleType.title,
      itemIds: JSON.stringify(selection.map((s) => s.itemId)),
      explanations: JSON.stringify(explanations),
      missingPieces: JSON.stringify(missingPieces),
      outfitCount,
    },
  });

  return NextResponse.json({
    id: capsule.id,
    name: capsule.name,
    items: selection.map((s) => ({ ...clothingItemToJSON(byId.get(s.itemId)!), reason: s.reason })),
    outfitCount,
    missingPieces,
  });
}
