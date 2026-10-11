// Public, web-sourced fashion imagery — deliberately separate from the
// user's private wardrobe (src/lib/clientTypes.ts's ClothingItemDTO.imageUrl,
// always a Vercel Blob URL under the authenticated user's own account).
//
// Two datasets live here, and neither one may ever be built from a real
// user's uploaded ClothingItem rows:
//
//  - STYLE_LEARNING_DECK: the onboarding "right if you'd wear it" swipe deck.
//    Real people wearing real outfits (not isolated product shots), sourced
//    from Unsplash (unsplash.com — free to use, no attribution required
//    under the Unsplash License). Tagged by gender so onboarding can match
//    whatever the user already told us in the "how do you want me to shop
//    for you?" step, and by style/fit/color/formality so a swipe still
//    feeds the exact same learnedPreferences engine real outfit feedback
//    does (see lib/prompts/styleLearner.ts — `category` below is display
//    text only, it is not read by that function).
//
//  - LANDING_WHEEL_OUTFIT: the logged-out landing page's spinning-wheel
//    result card. Individual flatlay/product-style garment photos (not a
//    person), also Unsplash-sourced, standing in for "a complete fit" the
//    way the wheel always has — just never built from anyone's real closet.
//
// Both sets are static, versioned with the code, and reviewed for content —
// not a live scrape — so there is nothing here that can silently start
// returning a user's own photos.

export type StyleLearningCard = {
  imageUrl: string;
  label: string;
  style: string;
  fit: string;
  primaryColor: string;
  formality: number;
  category: string;
  gender: "men" | "women";
};

function unsplash(id: string) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
}

export const STYLE_LEARNING_DECK: StyleLearningCard[] = [
  // — men —
  { imageUrl: unsplash("photo-1617114919297-3c8ddb01f599"), label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "Brown", formality: 3, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1624353656309-8be1a6c457be"), label: "Streetwear", style: "Streetwear", fit: "Oversized", primaryColor: "Black", formality: 1, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1504593811423-6dd665756598"), label: "Streetwear", style: "Streetwear", fit: "Oversized", primaryColor: "Grey", formality: 1, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1620834767726-61b1986287ff"), label: "Streetwear", style: "Streetwear", fit: "Regular", primaryColor: "Black", formality: 2, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1536243298747-ea8874136d64"), label: "Streetwear", style: "Streetwear", fit: "Oversized", primaryColor: "Beige", formality: 1, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1581381685617-4dc270458aa6"), label: "Relaxed", style: "Relaxed", fit: "Regular", primaryColor: "Navy", formality: 2, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1617137977259-bb83e191f377"), label: "Streetwear", style: "Streetwear", fit: "Regular", primaryColor: "Black", formality: 2, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1618886614638-80e3c103d31a"), label: "Formal", style: "Formal", fit: "Fitted", primaryColor: "Black", formality: 5, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1617127365659-c47fa864d8bc"), label: "Formal", style: "Formal", fit: "Fitted", primaryColor: "Navy", formality: 5, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1519085360753-af0119f7cbe7"), label: "Formal", style: "Formal", fit: "Regular", primaryColor: "Grey", formality: 4, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1548454782-15b189d129ab"), label: "Classic", style: "Classic", fit: "Fitted", primaryColor: "Black", formality: 4, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1507680434567-5739c80be1ac"), label: "Minimal", style: "Minimal", fit: "Regular", primaryColor: "White", formality: 2, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1559582798-678dfc71ccd8"), label: "Minimal", style: "Minimal", fit: "Regular", primaryColor: "Beige", formality: 2, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1545959308-3f4b859ad821"), label: "Minimal", style: "Minimal", fit: "Regular", primaryColor: "Grey", formality: 2, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1560362620-4c1bccd15283"), label: "Sporty", style: "Sporty", fit: "Regular", primaryColor: "Black", formality: 1, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1618001789159-ffffe6f96ef2"), label: "Smart Casual", style: "Smart Casual", fit: "Fitted", primaryColor: "White", formality: 4, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1620012253295-c15cc3e65df4"), label: "Classic", style: "Classic", fit: "Fitted", primaryColor: "Navy", formality: 4, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1642886512785-b5fee9faad7f"), label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "Grey", formality: 3, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1630667208073-82d53b1db540"), label: "Classic", style: "Classic", fit: "Fitted", primaryColor: "Black", formality: 4, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1642886513448-6e6997b8de4a"), label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "Beige", formality: 3, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1505022610485-0249ba5b3675"), label: "Classic", style: "Classic", fit: "Fitted", primaryColor: "Navy", formality: 4, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1623975561190-49d8eab816bb"), label: "Smart Casual", style: "Smart Casual", fit: "Regular", primaryColor: "White", formality: 3, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1624835567150-0c530a20d8cc"), label: "Classic", style: "Classic", fit: "Fitted", primaryColor: "Black", formality: 4, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1517938889432-a2ac9241a486"), label: "Relaxed", style: "Relaxed", fit: "Oversized", primaryColor: "Grey", formality: 2, category: "Outfit", gender: "men" },
  { imageUrl: unsplash("photo-1737508945707-ebdccee97cc5"), label: "Classic", style: "Classic", fit: "Oversized", primaryColor: "Navy", formality: 3, category: "Outfit", gender: "men" },

  // — women —
  { imageUrl: unsplash("photo-1618244972963-dbee1a7edc95"), label: "Classic", style: "Classic", fit: "Regular", primaryColor: "Tan", formality: 4, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1616847220575-31b062a4cd05"), label: "Streetwear", style: "Streetwear", fit: "Oversized", primaryColor: "Black", formality: 1, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1647218947427-d783309440d2"), label: "Streetwear", style: "Streetwear", fit: "Regular", primaryColor: "Black", formality: 1, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1584273143981-41c073dfe8f8"), label: "Trendy", style: "Trendy", fit: "Regular", primaryColor: "Beige", formality: 2, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1619086303291-0ef7699e4b31"), label: "Trendy", style: "Trendy", fit: "Oversized", primaryColor: "White", formality: 2, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1618333452884-5c8d211ed2ad"), label: "Minimal", style: "Minimal", fit: "Regular", primaryColor: "Black", formality: 2, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1523359346063-d879354c0ea5"), label: "Trendy", style: "Trendy", fit: "Regular", primaryColor: "Red", formality: 2, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1614786269829-d24616faf56d"), label: "Minimal", style: "Minimal", fit: "Fitted", primaryColor: "White", formality: 3, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1653875842174-429c1b467548"), label: "Minimal", style: "Minimal", fit: "Regular", primaryColor: "Beige", formality: 2, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1621341103818-01dada8c6ef8"), label: "Minimal", style: "Minimal", fit: "Fitted", primaryColor: "Black", formality: 3, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1604904612715-47bf9d9bc670"), label: "Formal", style: "Formal", fit: "Fitted", primaryColor: "Black", formality: 5, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1637589267610-6c66fc2a086b"), label: "Formal", style: "Formal", fit: "Fitted", primaryColor: "Black", formality: 5, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1616065297556-f05bc00c9a3e"), label: "Classic", style: "Classic", fit: "Regular", primaryColor: "Grey", formality: 4, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1596451984287-7a274406cbca"), label: "Classic", style: "Classic", fit: "Regular", primaryColor: "Cream", formality: 3, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1529399447871-731cff7f696b"), label: "Relaxed", style: "Relaxed", fit: "Oversized", primaryColor: "Blue", formality: 1, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1651828855150-ba40f6870a53"), label: "Relaxed", style: "Relaxed", fit: "Regular", primaryColor: "White", formality: 2, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1595059854048-5762c544c0f5"), label: "Classic", style: "Classic", fit: "Regular", primaryColor: "Beige", formality: 3, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1782116674797-8d00c36ffa7f"), label: "Minimal", style: "Minimal", fit: "Regular", primaryColor: "White", formality: 2, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1746458258548-5e5bd7225c9c"), label: "Classic", style: "Classic", fit: "Regular", primaryColor: "Black", formality: 3, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1766043071269-93f60fe04df2"), label: "Trendy", style: "Trendy", fit: "Regular", primaryColor: "Red", formality: 2, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1766043071255-64d4ef2ba3a8"), label: "Classic", style: "Classic", fit: "Regular", primaryColor: "Navy", formality: 3, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1611747881172-b44a9d8ff6c1"), label: "Minimal", style: "Minimal", fit: "Regular", primaryColor: "Black", formality: 2, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1608984361471-ff566593088f"), label: "Relaxed", style: "Relaxed", fit: "Oversized", primaryColor: "Cream", formality: 2, category: "Outfit", gender: "women" },
  { imageUrl: unsplash("photo-1580331451062-99ff652288d7"), label: "Classic", style: "Classic", fit: "Regular", primaryColor: "Grey", formality: 3, category: "Outfit", gender: "women" },
];

// Picks the swipe deck for a given "shopFor" onboarding answer — "Woman" /
// "Man" get their matching set, anything else (including not-yet-answered)
// gets a mixed set so the deck is never empty.
export function styleLearningDeckFor(shopFor: string): StyleLearningCard[] {
  if (shopFor === "Woman") return STYLE_LEARNING_DECK.filter((c) => c.gender === "women");
  if (shopFor === "Man") return STYLE_LEARNING_DECK.filter((c) => c.gender === "men");
  const men = STYLE_LEARNING_DECK.filter((c) => c.gender === "men");
  const women = STYLE_LEARNING_DECK.filter((c) => c.gender === "women");
  const mixed: StyleLearningCard[] = [];
  for (let i = 0; i < Math.max(men.length, women.length); i++) {
    if (men[i]) mixed.push(men[i]);
    if (women[i]) mixed.push(women[i]);
  }
  return mixed;
}

// Landing-page wheel result — four individual garment photos standing in
// for "a complete fit", public/demo-safe, never the signed-in user's own
// wardrobe photos. Kept only as the fallback for an unrecognized segment —
// see wheelResultCardsFor below for the per-segment result.
export const LANDING_WHEEL_OUTFIT = [
  { imageUrl: unsplash("photo-1622445272461-c6580cab8755"), label: "Top" },
  { imageUrl: unsplash("photo-1602293589930-45aad59ba3ab"), label: "Bottom" },
  { imageUrl: unsplash("photo-1626379616459-b2ce1d9decbc"), label: "Shoes" },
  { imageUrl: unsplash("photo-1662990209247-7ddb7ca0fccd"), label: "Accessory" },
];

// Maps each wheel segment (src/app/page.tsx's WHEEL_SEGMENTS) to the
// STYLE_LEARNING_DECK style tag(s) it actually represents, so landing on a
// given segment shows outfits that genuinely match it rather than the same
// fixed four images every time. "SURPRISE ME" deliberately has no fixed
// mapping — it picks from the whole deck for a different result each spin.
// CHILL combines Relaxed + Sporty (the deck has only a single Sporty entry
// on its own — too few for a full four-image result) rather than reusing
// a style another segment already owns outright.
const WHEEL_SEGMENT_STYLES: Record<string, string[]> = {
  STREET: ["Streetwear"],
  CLEAN: ["Minimal"],
  SMART: ["Smart Casual"],
  BOLD: ["Trendy"],
  CASUAL: ["Relaxed"],
  CHILL: ["Relaxed", "Sporty"],
  "DATE NIGHT": ["Formal"],
};

function pickRandom<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const picked: T[] = [];
  while (pool.length > 0 && picked.length < count) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
}

// Four real-outfit photos matching the landed wheel segment's style, mixing
// both genders (the landing page is pre-signup, so no gender preference is
// known yet). Falls back to a random mix for "SURPRISE ME" or any segment
// without a mapping.
export function wheelResultCardsFor(segment: string): StyleLearningCard[] {
  const styles = WHEEL_SEGMENT_STYLES[segment];
  const matching = styles ? STYLE_LEARNING_DECK.filter((c) => styles.includes(c.style)) : STYLE_LEARNING_DECK;
  return pickRandom(matching, 4);
}
