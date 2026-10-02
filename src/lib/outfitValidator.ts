import type { ClothingItem } from "@prisma/client";

type OutfitValidationResult = {
  valid: boolean;
  errors: string[];
};

const MAX_BY_SUBCATEGORY: Record<string, number> = {
  Watch: 1,
  Belt: 1,
  Cap: 1,
  Bag: 1,
  Sunglasses: 1,
  Other: 1,
};

const REQUIRED_CATEGORIES = ["Tops", "Bottoms", "Shoes"] as const;

export function validateOutfitSelection(
  items: ClothingItem[],
  anchorItemId?: string | null
): OutfitValidationResult {
  const errors: string[] = [];

  // Every selected item must be unique.
  const ids = items.map((item) => item.id);
  const uniqueIds = new Set(ids);

  if (uniqueIds.size !== ids.length) {
    errors.push("The outfit contains the same clothing item more than once.");
  }

  // Every outfit MUST contain exactly one Top, one Bottom, and one Shoes item.
  for (const category of REQUIRED_CATEGORIES) {
    const count = items.filter((item) => item.category === category).length;

    if (count === 0) {
      errors.push(
        `The outfit must contain exactly one ${category} item, but none was selected.`
      );
    } else if (count > 1) {
      errors.push(
        `The outfit cannot contain more than one ${category} item.`
      );
    }
  }

  // Outerwear is optional, but only one outerwear item is allowed.
  const outerwearCount = items.filter(
    (item) => item.category === "Outerwear"
  ).length;

  if (outerwearCount > 1) {
    errors.push("The outfit cannot contain more than one Outerwear item.");
  }

  // Accessories have no overall limit.
  // Instead, specific functional accessory types have individual limits.
  const accessories = items.filter(
    (item) => item.category === "Accessories"
  );

  const accessoryCounts = new Map<string, number>();

  for (const accessory of accessories) {
    const subcategory = accessory.subcategory || "Other";

    accessoryCounts.set(
      subcategory,
      (accessoryCounts.get(subcategory) || 0) + 1
    );
  }

  for (const [subcategory, count] of accessoryCounts) {
    const maxAllowed = MAX_BY_SUBCATEGORY[subcategory];

    if (maxAllowed !== undefined && count > maxAllowed) {
      errors.push(
        `The outfit cannot contain more than ${maxAllowed} ${subcategory} item.`
      );
    }
  }

  // Multiple Jewellery items are intentionally allowed.

  // If an anchor item was requested, it must be present.
  if (anchorItemId && !uniqueIds.has(anchorItemId)) {
    errors.push("The required anchor item is missing from the outfit.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}