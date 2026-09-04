import type { WardrobeItemForAI } from "@/lib/prompts/outfitGenerator";

// Cheap programmatic pre-filtering before we ever call Claude — cuts obvious
// incompatibilities (wrong season for the weather) so the AI reasons over a
// smaller, more relevant candidate set instead of the entire wardrobe.
export function filterWardrobeForWeather(
  items: WardrobeItemForAI[],
  seasonHint: string[] | null
): WardrobeItemForAI[] {
  if (!seasonHint || seasonHint.length === 0) return items;

  const filtered = items.filter(
    (item) => item.season.length === 0 || item.season.some((s) => seasonHint.includes(s))
  );

  // Never filter down to nothing usable (e.g. shoes/accessories rarely carry
  // a season) — fall back to the full wardrobe if filtering was too strict.
  return filtered.length >= 4 ? filtered : items;
}

export function recentOutfitItemIds(
  outfits: { items: { clothingItemId: string }[] }[],
  limit = 8
): string[][] {
  return outfits.slice(0, limit).map((o) => o.items.map((i) => i.clothingItemId));
}
