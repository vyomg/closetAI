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

export const SHOPPING_PRIORITIES = [
  "Fill wardrobe gaps",
  "Improve outfit variety",
  "Upgrade basics",
  "Add statement pieces",
  "Seasonal clothing",
  "Occasion-specific clothing",
  "Surprise me",
];

// Rough typical price ranges per category, denominated in USD. Used ONLY as
// an internal input to the deterministic budget-fit score (converted to the
// user's currency at request time) — never shown to the user as a real
// price. Buy Clothes never fabricates specific product data (names, prices,
// URLs, retailers).
export const TYPICAL_PRICE_RANGE_USD: Record<Category, [number, number]> = {
  Tops: [20, 70],
  Bottoms: [40, 120],
  Outerwear: [90, 300],
  Shoes: [60, 180],
  Accessories: [15, 90],
};

export const NEUTRAL_COLORS = ["Black", "White", "Grey", "Navy", "Beige", "Tan", "Cream"];

// Shopping-specific fit vocabulary (deliberately distinct from the Style
// Profile's Fitted/Regular/Oversized — this is what's meaningful when
// browsing new pieces to buy).
export const SHOPPING_FITS = ["Slim", "Regular", "Relaxed", "Oversized", "Straight"];

export const MATERIAL_OPTIONS = ["Cotton", "Linen", "Denim", "Wool", "Lightweight", "Breathable"];

// The full retailer/brand database now lives in lib/retailers.ts (it's a
// large, standalone dataset with its own metadata shape — category, country
// availability, price tier, style tags — so it doesn't belong in this
// general constants file). Import RETAILERS from "@/lib/retailers".

export const TEMPERATURE_UNIT_OPTIONS = ["AUTO", "C", "F"] as const;
export const DISTANCE_UNIT_OPTIONS = ["AUTO", "km", "mi"] as const;

// "What are you shopping for?" — changes recommendation strategy (see
// SHOPPING_MODE_WEIGHT_NUDGES in wardrobeAnalysis.ts).
export const SHOPPING_MODES = [
  "Fill wardrobe gaps",
  "Complete an outfit",
  "Upgrade my style",
  "Seasonal refresh",
  "Buy for an occasion",
  "Buy for a trip",
  "Replace something",
  "Just browse",
];

// Quick budget-range presets, shown alongside manual min/max entry. Values
// are in the user's resolved currency's everyday units (i.e. treat these as
// "roughly this many units", not USD) — deliberately coarse since they're a
// starting point the user can refine, not a precise conversion.
export const BUDGET_PRESETS = [
  { label: "Under 1,000", min: null, max: 1000 },
  { label: "1,000–2,500", min: 1000, max: 2500 },
  { label: "2,500–5,000", min: 2500, max: 5000 },
  { label: "5,000–10,000", min: 5000, max: 10000 },
  { label: "10,000+", min: 10000, max: null },
];

export const QUALITATIVE_BUDGET_PRESETS = [
  { label: "Best value", min: null, max: null, priceTier: "Budget" },
  { label: "Mid-range", min: null, max: null, priceTier: "Mid" },
  { label: "Premium", min: null, max: null, priceTier: "Premium" },
] as const;

// Capsule wardrobe presets — a static catalog (no DB model needed for the
// catalog itself; selections/results are saved as CapsuleWardrobe rows).
// Every entry shares the same shape (null where a bias doesn't apply) so
// consumers can access any field on the result of CAPSULE_TYPES.find(...)
// without per-variant narrowing.
export type CapsuleType = {
  key: string;
  title: string;
  size: number;
  description: string;
  climateBias: "warm" | "cold" | null;
  neutralBias: boolean;
  formalityRange: [number, number] | null;
};

export const CAPSULE_TYPES: CapsuleType[] = [
  { key: "summer-10", title: "10-piece summer capsule", size: 10, climateBias: "warm", neutralBias: false, formalityRange: null, description: "Lightweight, warm-weather essentials." },
  { key: "winter-10", title: "10-piece winter capsule", size: 10, climateBias: "cold", neutralBias: false, formalityRange: null, description: "Warm layers and cold-weather staples." },
  { key: "school", title: "School capsule", size: 8, climateBias: null, neutralBias: false, formalityRange: null, description: "Easy, repeatable outfits for a school week." },
  { key: "college", title: "College capsule", size: 8, climateBias: null, neutralBias: false, formalityRange: null, description: "Casual, versatile pieces for campus life." },
  { key: "vacation", title: "Vacation capsule", size: 8, climateBias: null, neutralBias: false, formalityRange: null, description: "A light, flexible wardrobe for travel." },
  { key: "minimalist", title: "Minimalist capsule", size: 8, climateBias: null, neutralBias: true, formalityRange: null, description: "Neutral colors, maximum mix-and-match." },
  { key: "smart-casual", title: "Smart-casual capsule", size: 8, climateBias: null, neutralBias: false, formalityRange: [3, 4], description: "Polished but relaxed, for work or dinner." },
];

export type CapsuleTypeKey = (typeof CAPSULE_TYPES)[number]["key"];

// Lightweight outfit challenges — a static catalog (no DB model needed).
// Each maps to an occasion/style/notes fed into the existing outfit
// generation pipeline; completions are tracked via Outfit.challengeKey.
export const OUTFIT_CHALLENGES = [
  {
    key: "best-black-outfit",
    title: "Best black outfit",
    description: "Put together the strongest all-black look from your wardrobe.",
    occasion: "Everyday",
    style: "Minimal",
    notes: "Build an outfit using primarily black items, or as close to all-black as the wardrobe allows.",
  },
  {
    key: "three-items-three-outfits",
    title: "3 items, 3 outfits",
    description: "Pick one item and build a distinct outfit that puts it front and center.",
    occasion: "Everyday",
    style: "Custom",
    notes: "Build a versatile outfit around a single standout piece from the wardrobe.",
  },
  {
    key: "smart-casual",
    title: "Smart casual",
    description: "A polished but relaxed look for a smart-casual setting.",
    occasion: "Smart Casual",
    style: "Smart Casual",
    notes: "Build a smart-casual outfit — polished but not stiff.",
  },
  {
    key: "least-worn-item",
    title: "Style your least-worn item",
    description: "Give an underused piece a real outfit to shine in.",
    occasion: "Everyday",
    style: "Custom",
    notes: "Build the outfit around whichever wardrobe item has the lowest wear count — make it feel intentional, not like an afterthought.",
  },
  {
    key: "one-shoe-three-outfits",
    title: "One pair of shoes, three outfits",
    description: "Show off how versatile one pair of shoes can be.",
    occasion: "Everyday",
    style: "Custom",
    notes: "Build an outfit anchored by a specific pair of shoes, showing how they can work in a fresh combination.",
  },
  {
    key: "weekend-outfit",
    title: "Weekend outfit",
    description: "Comfortable, easy, unmistakably off-duty.",
    occasion: "Casual",
    style: "Relaxed",
    notes: "Build a relaxed, comfortable weekend outfit.",
  },
] as const;

export type OutfitChallengeKey = (typeof OUTFIT_CHALLENGES)[number]["key"];

export const IMPORTANCE_FIELDS = [
  { key: "comfortImportance", label: "How important is comfort?" },
  { key: "fashionImportance", label: "How important is looking fashionable?" },
  { key: "formalImportance", label: "How important is looking formal/polished?" },
] as const;
