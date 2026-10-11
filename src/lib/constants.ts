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

// Outfit Challenges was removed as a product feature — the only remaining
// trace is the historical, nullable Outfit.challengeKey column (old rows
// may still carry a value; nothing writes one anymore).

// Named colour palette for the colour-preference picker (onboarding + Style
// Preferences) — nicer names than raw hex so the UI reads premium, each
// backed by a real swatch value. `label` is what's stored/compared against
// colorsLove/colorsAvoid (kept short, matches the plainer COLOR_PALETTE
// names above where they overlap) — `name` is the display-only flourish.
export const NAMED_COLORS = [
  { label: "Black", name: "Midnight Black", hex: "#17160f" },
  { label: "White", name: "Cloud White", hex: "#f5f4ef" },
  { label: "Grey", name: "Stone Grey", hex: "#9b968a" },
  { label: "Navy", name: "Navy", hex: "#1f2a44" },
  { label: "Blue", name: "Cobalt Blue", hex: "#3b5c8c" },
  { label: "Beige", name: "Sand", hex: "#d9c9a8" },
  { label: "Brown", name: "Walnut Brown", hex: "#6b4a30" },
  { label: "Tan", name: "Tan", hex: "#c9a877" },
  { label: "Olive", name: "Forest Olive", hex: "#5f6b3f" },
  { label: "Green", name: "Emerald", hex: "#3d5c3a" },
  { label: "Red", name: "Crimson", hex: "#8c2f2f" },
  { label: "Burgundy", name: "Burgundy", hex: "#5c2530" },
  { label: "Pink", name: "Blush Pink", hex: "#d19aa6" },
  { label: "Purple", name: "Lilac", hex: "#9a8bc2" },
  { label: "Yellow", name: "Mustard", hex: "#d1b13d" },
  { label: "Orange", name: "Coral", hex: "#c07a3a" },
  { label: "Cream", name: "Cream", hex: "#efe6d3" },
  { label: "Neutral", name: "Taupe", hex: "#c8c2b4" },
  { label: "Mint", name: "Mint", hex: "#9ecdb8" },
  { label: "Electric Lime", name: "Electric Lime", hex: "#d7ff3f" },
] as const;

// Real, recognizable clothing/footwear brand catalogue — moved to its own
// file (brandCatalog.ts) given its size; re-exported here so existing
// imports from "@/lib/constants" keep working unchanged.
export type { BrandEntry } from "./brandCatalog";
export { BRAND_CATALOG } from "./brandCatalog";

// "Why are you here" intents — onboarding step, stored as User.intent.
export const ONBOARDING_INTENTS = [
  { key: "build-wardrobe", title: "Build a new wardrobe", description: "I'm starting fresh and want curated outfit suggestions." },
  { key: "utilize-wardrobe", title: "Use what I already own", description: "Help me create new looks from my existing closet." },
  { key: "shop-mindfully", title: "Shop more mindfully", description: "Discover pieces that actually match my style and needs." },
] as const;

export const SHOP_FOR_OPTIONS = ["Woman", "Man", "Other"] as const;

// Occasion-specific "Style Play" contexts — distinct from the free-text
// OCCASIONS list used at generation time; this is the smaller, curated set
// Style DNA's "Teach matchin'" A/B questions are grouped under.
export const STYLE_PLAY_CONTEXTS = ["Everyday", "Office", "Going Out", "Festive", "Travel"] as const;

// "Teach matchin'" A/B cards, grouped by Style Play context. Each option's
// `key` matches the exact attribute-key shape lib/prompts/styleLearner.ts
// already writes (e.g. "fit:Oversized", "formality:casual") so an answer
// here moves the same Style DNA axes real outfit feedback does — not a
// second preference model. Text-only cards, deliberately: these test
// abstract attributes (fit, formality) that don't correspond to one real
// photographed garment, so a text card is honest where a fake "photo" of a
// generic silhouette would not be.
export const STYLE_PLAY_QUESTIONS: Record<
  (typeof STYLE_PLAY_CONTEXTS)[number],
  { prompt: string; a: { label: string; sub: string; key: string }; b: { label: string; sub: string; key: string } }[]
> = {
  Everyday: [
    {
      prompt: "Which feels more like you for everyday?",
      a: { label: "Close fit", sub: "A defined line that follows the body", key: "fit:Fitted" },
      b: { label: "Relaxed fit", sub: "Room to move, nothing clingy", key: "fit:Oversized" },
    },
    {
      prompt: "Default everyday palette?",
      a: { label: "Neutral", sub: "Black, white, grey, navy", key: "color:Black" },
      b: { label: "Colourful", sub: "Not afraid of a bold hue", key: "style:Trendy" },
    },
  ],
  Office: [
    {
      prompt: "At the office, you lean...",
      a: { label: "Polished", sub: "Structured, put-together", key: "formality:formal" },
      b: { label: "Smart casual", sub: "Comfortable but still sharp", key: "formality:smart-casual" },
    },
  ],
  "Going Out": [
    {
      prompt: "Going out, your fit is...",
      a: { label: "Streetwear", sub: "Bold, graphic, layered", key: "style:Streetwear" },
      b: { label: "Classic", sub: "Clean lines, timeless", key: "style:Classic" },
    },
  ],
  Festive: [
    {
      prompt: "For festive occasions...",
      a: { label: "Statement piece", sub: "One bold item carries the look", key: "style:Trendy" },
      b: { label: "Understated", sub: "Quality over flash", key: "style:Minimal" },
    },
  ],
  Travel: [
    {
      prompt: "Packing for a trip, you prioritize...",
      a: { label: "Comfort first", sub: "Soft, relaxed, easy to move in", key: "fit:Oversized" },
      b: { label: "Still put-together", sub: "Comfortable but considered", key: "fit:Regular" },
    },
  ],
};

// Onboarding's "right if you'd wear it, left if you wouldn't" style-swipe
// deck now lives in src/lib/publicFashion.ts (STYLE_LEARNING_DECK) — real
// people wearing real outfits, sourced from the web, deliberately NOT built
// from this project's demo-wardrobe photos (those are real photos of a real
// person's own closet, seeded for THIS account's wardrobe only — reusing
// them in a public-facing survey was a privacy bug, not a style choice).

export const IMPORTANCE_FIELDS = [
  { key: "comfortImportance", label: "How important is comfort?" },
  { key: "fashionImportance", label: "How important is looking fashionable?" },
  { key: "formalImportance", label: "How important is looking formal/polished?" },
] as const;
