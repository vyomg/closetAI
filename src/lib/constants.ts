export const CATEGORIES = {
  Tops: ["T-shirt", "Polo", "Shirt", "Crewneck", "Sweater", "Hoodie", "Tank top"],
  Bottoms: ["Jeans", "Trousers", "Chinos", "Shorts", "Joggers"],
  Outerwear: ["Jacket", "Blazer", "Coat", "Overshirt"],
  Shoes: ["Sneakers", "Loafers", "Boots", "Formal shoes", "Sandals", "Other"],
  Accessories: ["Watch", "Belt", "Cap", "Bag", "Sunglasses", "Jewellery", "Other"],
} as const;

export type Category = keyof typeof CATEGORIES;
export const CATEGORY_LIST = Object.keys(CATEGORIES) as Category[];

// Maps a category to the outfit "slot" it fills when generating outfits.
export const CATEGORY_TO_SLOT: Record<Category, string> = {
  Tops: "top",
  Bottoms: "bottom",
  Outerwear: "outerwear",
  Shoes: "shoes",
  Accessories: "accessory",
};

export const OCCASIONS = [
  "Everyday",
  "School",
  "Casual",
  "Smart Casual",
  "Dinner",
  "Party",
  "Date",
  "Wedding",
  "Interview",
  "Presentation",
  "Business",
  "Formal Event",
  "Travel",
  "Vacation",
];

export const DESIRED_STYLES = [
  "Minimal",
  "Classic",
  "Streetwear",
  "Smart Casual",
  "Preppy",
  "Formal",
  "Relaxed",
  "Trendy",
  "Sporty",
];

export const FIT_OPTIONS = ["Fitted", "Regular", "Oversized"];

export const SEASONS = ["Spring", "Summer", "Fall", "Winter"];

export const SHOE_TYPES = ["Sneakers", "Loafers", "Boots", "Formal shoes", "Sandals"];

export const COLOR_PALETTE = [
  "Black",
  "White",
  "Grey",
  "Navy",
  "Blue",
  "Beige",
  "Brown",
  "Tan",
  "Olive",
  "Green",
  "Red",
  "Burgundy",
  "Pink",
  "Purple",
  "Yellow",
  "Orange",
  "Cream",
];

export const ADVENTURE_LEVELS = [
  { level: 1, label: "Very Safe" },
  { level: 2, label: "Familiar" },
  { level: 3, label: "Balanced" },
  { level: 4, label: "Experimental" },
  { level: 5, label: "Bold" },
];

export const DISLIKE_REASONS = [
  "Not my style",
  "Too formal",
  "Too casual",
  "Don't like the colours",
  "Would wear this",
];

export const IMPORTANCE_FIELDS = [
  { key: "comfortImportance", label: "How important is comfort?" },
  { key: "fashionImportance", label: "How important is looking fashionable?" },
  { key: "formalImportance", label: "How important is looking formal/polished?" },
] as const;
