import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clothingItemToAI, clothingItemToJSON } from "@/lib/serializers";
import { computeWardrobeStats } from "@/lib/wardrobeAnalysis";
import { CATEGORY_LIST } from "@/lib/constants";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db.clothingItem.findMany({ where: { userId: session.user.id } });
  const outfits = await db.outfit.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  if (items.length === 0) {
    return NextResponse.json({ empty: true });
  }

  const aiItems = items.map(clothingItemToAI);
  const stats = computeWardrobeStats(aiItems);

  const mostWorn = [...items].sort((a, b) => b.wearCount - a.wearCount).slice(0, 8).map(clothingItemToJSON);
  const neverWorn = items.filter((i) => i.wearCount === 0).map(clothingItemToJSON);
  const leastWorn = [...items]
    .filter((i) => i.wearCount > 0)
    .sort((a, b) => a.wearCount - b.wearCount)
    .slice(0, 8)
    .map(clothingItemToJSON);

  // Versatile items: appear in the most distinct saved/generated outfits.
  const outfitCountByItemId = new Map<string, number>();
  for (const outfit of outfits) {
    for (const oi of outfit.items) {
      outfitCountByItemId.set(oi.clothingItemId, (outfitCountByItemId.get(oi.clothingItemId) ?? 0) + 1);
    }
  }
  const versatileItems = [...items]
    .map((item) => ({ item: clothingItemToJSON(item), outfitCount: outfitCountByItemId.get(item.id) ?? 0 }))
    .filter((x) => x.outfitCount > 0)
    .sort((a, b) => b.outfitCount - a.outfitCount)
    .slice(0, 6);

  // Repeated combinations: identical item-id sets generated more than once.
  const comboKey = (ids: string[]) => [...ids].sort().join("|");
  const comboCount = new Map<string, { count: number; occasion: string; itemIds: string[] }>();
  for (const outfit of outfits) {
    const ids = outfit.items.map((oi) => oi.clothingItemId);
    const key = comboKey(ids);
    const existing = comboCount.get(key);
    if (existing) existing.count += 1;
    else comboCount.set(key, { count: 1, occasion: outfit.occasion, itemIds: ids });
  }
  const repeatedCombinations = [...comboCount.values()].filter((c) => c.count > 1).sort((a, b) => b.count - a.count).slice(0, 5);

  // Outfit frequency: outfits generated per week over the last ~8 weeks.
  const now = new Date();
  const weeklyFrequency: { weekStart: string; count: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - w * 7 - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const count = outfits.filter((o) => o.createdAt >= weekStart && o.createdAt < weekEnd).length;
    weeklyFrequency.push({ weekStart: weekStart.toISOString(), count });
  }

  const missingCategories = CATEGORY_LIST.filter((c) => (stats.byCategory[c] ?? 0) === 0);

  return NextResponse.json({
    empty: false,
    totalItems: stats.totalItems,
    byCategory: stats.byCategory,
    byColor: stats.byColor,
    byFormalityBand: stats.byFormalityBand,
    averageWearCount: Math.round(stats.averageWearCount * 10) / 10,
    mostWorn,
    leastWorn,
    neverWorn,
    versatileItems,
    repeatedCombinations,
    weeklyFrequency,
    missingCategories,
    totalOutfits: outfits.length,
  });
}
