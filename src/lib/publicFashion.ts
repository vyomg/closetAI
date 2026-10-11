// Onboarding/landing fashion imagery — deliberately separate from the
// user's private wardrobe (src/lib/clientTypes.ts's ClothingItemDTO.imageUrl,
// always a Vercel Blob URL under the authenticated user's own account).
//
// All images here are AI-generated illustrative fashion assets supplied
// directly by the project owner (public/onboarding/, public/wheel/) — not
// real product photography, not scraped or hotlinked from any brand site,
// not stock photography, and not claiming affiliation with any real brand.
// They were audited image-by-image before use (corruption, cropping, UI
// leakage, age-appropriateness, recognizable real-brand logos) — see the
// project history for the audit. Two datasets live here:
//
//  - STYLE_LEARNING_DECK: the onboarding "right if you'd wear it" swipe
//    deck. Full-outfit studio shots, organized by age cohort (adult-men,
//    adult-women, teen-boys) and style, so onboarding can show imagery that
//    actually matches the user's stated shopFor + ageRange instead of a
//    single undifferentiated set.
//
//  - WHEEL_* item pools: individual, unisex clothing items (tops, bottoms,
//    shoes, accessories) used to compose outfit-combo cards for the
//    landing-page "Surprise Me" wheel, and as a safe fallback "look" deck
//    (flatlay combos, no model) for any onboarding cohort without its own
//    audited photo set — see teenGirlsFallbackDeck below.
//
// Both sets are static, versioned with the code, and reviewed for content —
// not a live scrape — so there is nothing here that can silently start
// returning a user's own photos.

export type StyleLearningCard = {
  images: string[];
  label: string;
  style: string;
  fit: string;
  primaryColor: string;
  formality: number;
  category: string;
  cohort: "adult-men" | "adult-women" | "teen-boys" | "unisex-flatlay";
};

function img(cohort: string, style: string, n: string) {
  return `/onboarding/${cohort}/${style}/${n}.jpg`;
}

// --- Adult Men ---------------------------------------------------------
const ADULT_MEN: StyleLearningCard[] = [
  { images: [img("adult-men", "casual", "01")], label: "Casual", style: "Casual", fit: "Regular", primaryColor: "White", formality: 1, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "casual", "02")], label: "Casual", style: "Casual", fit: "Regular", primaryColor: "Navy", formality: 2, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "casual", "03")], label: "Casual", style: "Casual", fit: "Regular", primaryColor: "Olive", formality: 2, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "casual", "04")], label: "Casual", style: "Casual", fit: "Regular", primaryColor: "Beige", formality: 2, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "formal", "01")], label: "Formal", style: "Formal", fit: "Fitted", primaryColor: "Navy", formality: 5, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "formal", "02")], label: "Formal", style: "Formal", fit: "Fitted", primaryColor: "Blue", formality: 4, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "formal", "03")], label: "Formal", style: "Formal", fit: "Fitted", primaryColor: "Grey", formality: 5, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "smart-casual", "01")], label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "Olive", formality: 3, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "smart-casual", "02")], label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "Blue", formality: 3, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "smart-casual", "03")], label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "Brown", formality: 3, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "smart-casual", "04")], label: "Smart Casual", style: "Smart Casual", fit: "Fitted", primaryColor: "Navy", formality: 4, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "smart-casual", "05")], label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "Grey", formality: 3, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "sporty-athleisure", "01")], label: "Sporty", style: "Sporty", fit: "Regular", primaryColor: "Grey", formality: 1, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "sporty-athleisure", "02")], label: "Sporty", style: "Sporty", fit: "Regular", primaryColor: "Black", formality: 1, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "sporty-athleisure", "03")], label: "Sporty", style: "Sporty", fit: "Regular", primaryColor: "Grey", formality: 1, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "sporty-athleisure", "04")], label: "Sporty", style: "Sporty", fit: "Oversized", primaryColor: "Black", formality: 1, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "streetwear", "01")], label: "Streetwear", style: "Streetwear", fit: "Oversized", primaryColor: "Black", formality: 1, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "streetwear", "02")], label: "Streetwear", style: "Streetwear", fit: "Regular", primaryColor: "Brown", formality: 1, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "streetwear", "03")], label: "Streetwear", style: "Streetwear", fit: "Regular", primaryColor: "Olive", formality: 1, category: "Outfit", cohort: "adult-men" },
  { images: [img("adult-men", "streetwear", "04")], label: "Streetwear", style: "Streetwear", fit: "Regular", primaryColor: "Black", formality: 1, category: "Outfit", cohort: "adult-men" },
];

// --- Adult Women ---------------------------------------------------------
const ADULT_WOMEN: StyleLearningCard[] = [
  { images: [img("adult-women", "casual", "01")], label: "Casual", style: "Casual", fit: "Regular", primaryColor: "White", formality: 1, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "casual", "02")], label: "Casual", style: "Casual", fit: "Regular", primaryColor: "Cream", formality: 2, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "casual", "03")], label: "Casual", style: "Casual", fit: "Regular", primaryColor: "Blue", formality: 2, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "casual", "04")], label: "Casual", style: "Casual", fit: "Regular", primaryColor: "Black", formality: 2, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "formal", "01")], label: "Formal", style: "Formal", fit: "Fitted", primaryColor: "Beige", formality: 5, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "formal", "02")], label: "Formal", style: "Formal", fit: "Fitted", primaryColor: "Black", formality: 5, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "formal", "03")], label: "Formal", style: "Formal", fit: "Fitted", primaryColor: "Burgundy", formality: 5, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "formal", "04")], label: "Formal", style: "Formal", fit: "Fitted", primaryColor: "Black", formality: 4, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "smart-casual", "01")], label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "Beige", formality: 3, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "smart-casual", "02")], label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "Black", formality: 3, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "smart-casual", "03")], label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "Olive", formality: 3, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "smart-casual", "04")], label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "Navy", formality: 3, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "sporty-athleisure", "01")], label: "Sporty", style: "Sporty", fit: "Regular", primaryColor: "Black", formality: 1, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "sporty-athleisure", "02")], label: "Sporty", style: "Sporty", fit: "Regular", primaryColor: "Green", formality: 1, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "sporty-athleisure", "03")], label: "Sporty", style: "Sporty", fit: "Regular", primaryColor: "Cream", formality: 1, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "sporty-athleisure", "04")], label: "Sporty", style: "Sporty", fit: "Fitted", primaryColor: "Black", formality: 1, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "streetwear", "01")], label: "Streetwear", style: "Streetwear", fit: "Oversized", primaryColor: "Black", formality: 1, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "streetwear", "02")], label: "Streetwear", style: "Streetwear", fit: "Regular", primaryColor: "Brown", formality: 1, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "streetwear", "03")], label: "Streetwear", style: "Streetwear", fit: "Regular", primaryColor: "Black", formality: 1, category: "Outfit", cohort: "adult-women" },
  { images: [img("adult-women", "streetwear", "04")], label: "Streetwear", style: "Streetwear", fit: "Regular", primaryColor: "Blue", formality: 1, category: "Outfit", cohort: "adult-women" },
];

// --- Teen Boys (under-18) -------------------------------------------------
// There is deliberately no equivalent Teen Girls array: every image
// supplied for that cohort used visibly adult models, several with
// revealing/mature styling, and failed audit outright — see
// teenGirlsFallbackDeck below for what under-18 women/girls see instead.
const TEEN_BOYS: StyleLearningCard[] = [
  { images: [img("teen-boys", "casual", "01")], label: "Casual", style: "Casual", fit: "Regular", primaryColor: "Grey", formality: 1, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "casual", "02")], label: "Casual", style: "Casual", fit: "Regular", primaryColor: "Navy", formality: 2, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "casual", "03")], label: "Casual", style: "Casual", fit: "Regular", primaryColor: "White", formality: 1, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "casual", "04")], label: "Casual", style: "Casual", fit: "Regular", primaryColor: "Olive", formality: 2, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "formal", "01")], label: "Formal", style: "Formal", fit: "Regular", primaryColor: "Navy", formality: 4, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "formal", "02")], label: "Formal", style: "Formal", fit: "Fitted", primaryColor: "White", formality: 5, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "formal", "03")], label: "Formal", style: "Formal", fit: "Regular", primaryColor: "Beige", formality: 4, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "smart-casual", "01")], label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "Navy", formality: 3, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "smart-casual", "02")], label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "Blue", formality: 3, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "smart-casual", "03")], label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "Olive", formality: 2, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "smart-casual", "04")], label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "Grey", formality: 3, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "smart-casual", "05")], label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "Grey", formality: 3, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "sporty-athleisure", "01")], label: "Sporty", style: "Sporty", fit: "Regular", primaryColor: "Grey", formality: 1, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "sporty-athleisure", "02")], label: "Sporty", style: "Sporty", fit: "Regular", primaryColor: "Black", formality: 1, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "sporty-athleisure", "03")], label: "Sporty", style: "Sporty", fit: "Regular", primaryColor: "Black", formality: 1, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "streetwear", "01")], label: "Streetwear", style: "Streetwear", fit: "Oversized", primaryColor: "Brown", formality: 1, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "streetwear", "02")], label: "Streetwear", style: "Streetwear", fit: "Oversized", primaryColor: "Black", formality: 1, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "streetwear", "03")], label: "Streetwear", style: "Streetwear", fit: "Oversized", primaryColor: "White", formality: 1, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "streetwear", "04")], label: "Streetwear", style: "Streetwear", fit: "Regular", primaryColor: "Blue", formality: 1, category: "Outfit", cohort: "teen-boys" },
  { images: [img("teen-boys", "streetwear", "05")], label: "Streetwear", style: "Streetwear", fit: "Regular", primaryColor: "Olive", formality: 1, category: "Outfit", cohort: "teen-boys" },
];

// --- Unisex item pools (landing wheel + fallback "look" decks) -----------
// Individual garments, not outfits on a model — used to compose coordinated
// combo cards. Only 1 shoe image survived audit (4 others showed
// recognizable real-brand logos/silhouettes — Nike, New Balance, Converse,
// a Yeezy-style foam runner — and were excluded), so every combo currently
// reuses that one pair; more generic, non-branded shoe renders would be the
// single highest-value addition to this pool.
type WheelItem = { imageUrl: string; category: "Top" | "Bottom" | "Shoes" | "Accessory"; style: string; primaryColor: string };

const WHEEL_TOPS: WheelItem[] = [
  { imageUrl: "/wheel/tops/01.jpg", category: "Top", style: "Minimal", primaryColor: "White" },
  { imageUrl: "/wheel/tops/02.jpg", category: "Top", style: "Streetwear", primaryColor: "Black" },
  { imageUrl: "/wheel/tops/03.jpg", category: "Top", style: "Casual", primaryColor: "Blue" },
  { imageUrl: "/wheel/tops/04.jpg", category: "Top", style: "Minimal", primaryColor: "Cream" },
  { imageUrl: "/wheel/tops/05.jpg", category: "Top", style: "Preppy", primaryColor: "Green" },
];
const WHEEL_BOTTOMS: WheelItem[] = [
  { imageUrl: "/wheel/bottoms/01.jpg", category: "Bottom", style: "Casual", primaryColor: "Blue" },
  { imageUrl: "/wheel/bottoms/02.jpg", category: "Bottom", style: "Streetwear", primaryColor: "Olive" },
  { imageUrl: "/wheel/bottoms/03.jpg", category: "Bottom", style: "Formal", primaryColor: "Black" },
  { imageUrl: "/wheel/bottoms/04.jpg", category: "Bottom", style: "Sporty", primaryColor: "Grey" },
  { imageUrl: "/wheel/bottoms/05.jpg", category: "Bottom", style: "Preppy", primaryColor: "Tan" },
];
const WHEEL_SHOES: WheelItem[] = [{ imageUrl: "/wheel/shoes/01.jpg", category: "Shoes", style: "Minimal", primaryColor: "Cream" }];
const WHEEL_ACCESSORIES: WheelItem[] = [
  { imageUrl: "/wheel/accessories/01.jpg", category: "Accessory", style: "Streetwear", primaryColor: "Black" },
  { imageUrl: "/wheel/accessories/02.jpg", category: "Accessory", style: "Minimal", primaryColor: "Black" },
  { imageUrl: "/wheel/accessories/03.jpg", category: "Accessory", style: "Streetwear", primaryColor: "Black" },
  { imageUrl: "/wheel/accessories/04.jpg", category: "Accessory", style: "Formal", primaryColor: "Grey" },
];

// Which styles read as compatible with each other for the purpose of
// composing a coordinated combo — deliberately small and hand-picked given
// the small item pool, not a general style ontology.
const STYLE_COMPAT: Record<string, string[]> = {
  Minimal: ["Minimal", "Casual", "Preppy", "Formal"],
  Streetwear: ["Streetwear", "Sporty"],
  Casual: ["Casual", "Minimal", "Preppy"],
  Preppy: ["Preppy", "Casual", "Formal", "Minimal"],
  Formal: ["Formal", "Minimal", "Preppy"],
  Sporty: ["Sporty", "Streetwear"],
};

function stylesCompatible(a: string, b: string): boolean {
  return a === b || (STYLE_COMPAT[a]?.includes(b) ?? false);
}

function pickRandom<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const picked: T[] = [];
  while (pool.length > 0 && picked.length < count) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
}

// Composes one coordinated outfit (top + compatible bottom + the one
// available shoe + usually a compatible accessory) from the unisex item
// pools, optionally biased toward a given style.
function buildWheelCombo(preferredStyle?: string): WheelItem[] {
  const topPool = preferredStyle ? WHEEL_TOPS.filter((t) => stylesCompatible(t.style, preferredStyle)) : WHEEL_TOPS;
  const top = pickRandom(topPool.length ? topPool : WHEEL_TOPS, 1)[0];
  const bottomPool = WHEEL_BOTTOMS.filter((b) => stylesCompatible(top.style, b.style));
  const bottom = pickRandom(bottomPool.length ? bottomPool : WHEEL_BOTTOMS, 1)[0];
  const accessoryPool = WHEEL_ACCESSORIES.filter((a) => stylesCompatible(top.style, a.style));
  const items: WheelItem[] = [top, bottom, WHEEL_SHOES[0]];
  if (accessoryPool.length) items.push(pickRandom(accessoryPool, 1)[0]);
  return items;
}

// Maps each wheel segment (src/app/page.tsx's WHEEL_SEGMENTS) to the style
// its combo should lean toward. "SURPRISE ME" deliberately has no mapping —
// it draws from the whole pool for a different result each spin.
const WHEEL_SEGMENT_STYLES: Record<string, string> = {
  STREET: "Streetwear",
  CLEAN: "Minimal",
  SMART: "Preppy",
  BOLD: "Streetwear",
  CASUAL: "Casual",
  CHILL: "Sporty",
  "DATE NIGHT": "Formal",
};

export function wheelResultCardsFor(segment: string): { imageUrl: string; label: string }[] {
  const combo = buildWheelCombo(WHEEL_SEGMENT_STYLES[segment]);
  return combo.map((item) => ({ imageUrl: item.imageUrl, label: item.category }));
}

// Safe, no-model fallback "look" deck for any onboarding cohort without its
// own audited photo set (currently: under-18 + Woman, and under-18 + Other)
// — flatlay combo cards built from the same unisex item pool as the wheel,
// so it genuinely varies per swipe rather than reusing one placeholder.
function teenFallbackDeck(): StyleLearningCard[] {
  const styles = ["Streetwear", "Minimal", "Casual", "Sporty", "Preppy", "Formal"];
  return styles.map((style) => {
    const combo = buildWheelCombo(style);
    return {
      images: combo.map((c) => c.imageUrl),
      label: style,
      style,
      fit: "Regular",
      primaryColor: combo[0].primaryColor,
      formality: style === "Formal" ? 4 : style === "Sporty" ? 1 : 2,
      category: "Outfit",
      cohort: "unisex-flatlay" as const,
    };
  }).concat(
    // a second pass with fresh random combos so the deck has real variety
    // across its ~12 cards rather than exactly one card per style
    styles.map((style) => {
      const combo = buildWheelCombo(style);
      return {
        images: combo.map((c) => c.imageUrl),
        label: style,
        style,
        fit: "Regular",
        primaryColor: combo[0].primaryColor,
        formality: style === "Formal" ? 4 : style === "Sporty" ? 1 : 2,
        category: "Outfit",
        cohort: "unisex-flatlay" as const,
      };
    })
  );
}

// Picks the onboarding swipe deck for the user's actual "shop for" and age
// answers. Never shows an adult-modeled photo to a user who said they're
// under 18 — the under-18 branches only ever read from TEEN_BOYS or the
// no-model teenFallbackDeck, never from ADULT_MEN/ADULT_WOMEN.
export function styleLearningDeckFor(shopFor: string, ageRange: string): StyleLearningCard[] {
  const isTeen = ageRange === "Under 18";

  if (isTeen) {
    if (shopFor === "Man") return TEEN_BOYS;
    // "Woman" and "Other" (and not-yet-answered) all get the safe
    // no-model fallback — there is no audited Teen Girls photo set, and
    // forcing "Other" into a binary bucket would be its own problem.
    return teenFallbackDeck();
  }

  if (shopFor === "Woman") return ADULT_WOMEN;
  if (shopFor === "Man") return ADULT_MEN;

  // "Other" or not yet answered: an interleaved mix so the deck is never
  // empty and isn't skewed toward either adult set.
  const mixed: StyleLearningCard[] = [];
  for (let i = 0; i < Math.max(ADULT_MEN.length, ADULT_WOMEN.length); i++) {
    if (ADULT_MEN[i]) mixed.push(ADULT_MEN[i]);
    if (ADULT_WOMEN[i]) mixed.push(ADULT_WOMEN[i]);
  }
  return mixed;
}
