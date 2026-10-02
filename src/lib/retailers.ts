// Centralized retailer/brand database for Buy Clothes.
//
// This is metadata only — names, real domains, and a best-effort search URL
// pattern for each. It is NOT a product catalogue: nothing here claims to
// know what's in stock, what anything costs, or that a specific product
// exists. Every retailer resolves to a real "search this site" link.
//
// Honesty note: search URL query-parameter conventions are based on common
// public knowledge of each site's structure, not individually verified for
// every single retailer below (some Indian regional storefronts change
// their URL scheme without notice). Worst case, a link lands on the
// retailer's homepage or a broad search rather than a precise one — it
// never fabricates a product, price, or page that doesn't exist.

export type RetailerCategory =
  | "Fast Fashion"
  | "Premium"
  | "Luxury"
  | "Sports"
  | "Streetwear"
  | "Indian"
  | "Department Store"
  | "Marketplace"
  | "Outdoor"
  | "Accessories";

export type PriceTier = "Budget" | "Mid" | "Premium" | "Luxury";

export type Retailer = {
  id: string;
  name: string;
  categories: RetailerCategory[];
  // ISO 3166-1 alpha-2 country codes where the retailer is meaningfully
  // available (online or in stores), or ["GLOBAL"] for worldwide shipping.
  countries: string[];
  website: string;
  searchUrl: (query: string) => string;
  priceTier: PriceTier;
  styleTags: string[];
};

function enc(q: string): string {
  return encodeURIComponent(q);
}

export const RETAILERS: Retailer[] = [
  // ---- General / international fast fashion & premium ----
  { id: "hm", name: "H&M", categories: ["Fast Fashion"], countries: ["IN", "US", "GB", "GLOBAL"], website: "https://www2.hm.com", searchUrl: (q) => `https://www2.hm.com/en_in/search-results.html?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Minimal", "Smart Casual", "Trendy"] },
  { id: "zara", name: "Zara", categories: ["Fast Fashion", "Premium"], countries: ["IN", "US", "GB", "GLOBAL"], website: "https://www.zara.com", searchUrl: (q) => `https://www.zara.com/search?searchTerm=${enc(q)}`, priceTier: "Mid", styleTags: ["Contemporary", "Classic", "Trendy"] },
  { id: "uniqlo", name: "Uniqlo", categories: ["Fast Fashion"], countries: ["US", "GB", "GLOBAL"], website: "https://www.uniqlo.com", searchUrl: (q) => `https://www.uniqlo.com/us/en/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Minimal", "Relaxed", "Contemporary"] },
  { id: "mango", name: "Mango", categories: ["Fast Fashion", "Premium"], countries: ["IN", "GLOBAL"], website: "https://shop.mango.com", searchUrl: (q) => `https://shop.mango.com/in/search?q=${enc(q)}`, priceTier: "Mid", styleTags: ["Contemporary", "Classic"] },
  { id: "gap", name: "GAP", categories: ["Fast Fashion"], countries: ["US", "GLOBAL"], website: "https://www.gap.com", searchUrl: (q) => `https://www.gap.com/browse/search.do?searchText=${enc(q)}`, priceTier: "Budget", styleTags: ["Classic", "Relaxed", "Preppy"] },
  { id: "marks-spencer", name: "Marks & Spencer", categories: ["Department Store", "Premium"], countries: ["IN", "GB"], website: "https://www.marksandspencer.in", searchUrl: (q) => `https://www.marksandspencer.in/search?q=${enc(q)}`, priceTier: "Mid", styleTags: ["Classic", "Smart Casual"] },
  { id: "american-eagle", name: "American Eagle", categories: ["Fast Fashion"], countries: ["US"], website: "https://www.ae.com", searchUrl: (q) => `https://www.ae.com/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Relaxed", "Trendy"] },
  { id: "levis", name: "Levi's", categories: ["Fast Fashion", "Premium"], countries: ["IN", "US", "GLOBAL"], website: "https://www.levi.in", searchUrl: (q) => `https://www.levi.in/search?q=${enc(q)}`, priceTier: "Mid", styleTags: ["Classic", "Relaxed", "Streetwear"] },
  { id: "jack-jones", name: "Jack & Jones", categories: ["Fast Fashion"], countries: ["IN", "GLOBAL"], website: "https://www.jackjones.in", searchUrl: (q) => `https://www.jackjones.in/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Smart Casual", "Contemporary"] },
  { id: "only", name: "ONLY", categories: ["Fast Fashion"], countries: ["IN", "GLOBAL"], website: "https://www.only.com", searchUrl: (q) => `https://www.only.com/in/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Trendy", "Contemporary"] },
  { id: "vero-moda", name: "Vero Moda", categories: ["Fast Fashion"], countries: ["IN", "GLOBAL"], website: "https://www.veromoda.in", searchUrl: (q) => `https://www.veromoda.in/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Trendy", "Contemporary"] },
  { id: "superdry", name: "Superdry", categories: ["Fast Fashion", "Streetwear"], countries: ["IN", "GB", "GLOBAL"], website: "https://www.superdry.in", searchUrl: (q) => `https://www.superdry.in/search?q=${enc(q)}`, priceTier: "Mid", styleTags: ["Streetwear", "Relaxed"] },
  { id: "tommy-hilfiger", name: "Tommy Hilfiger", categories: ["Premium"], countries: ["IN", "US", "GLOBAL"], website: "https://in.tommy.com", searchUrl: (q) => `https://in.tommy.com/search?q=${enc(q)}`, priceTier: "Premium", styleTags: ["Classic", "Preppy", "Old money"] },
  { id: "calvin-klein", name: "Calvin Klein", categories: ["Premium"], countries: ["IN", "US", "GLOBAL"], website: "https://calvinklein.in", searchUrl: (q) => `https://calvinklein.in/search?q=${enc(q)}`, priceTier: "Premium", styleTags: ["Minimal", "Contemporary"] },
  { id: "lacoste", name: "Lacoste", categories: ["Premium"], countries: ["IN", "GLOBAL"], website: "https://www.lacoste.in", searchUrl: (q) => `https://www.lacoste.in/search?q=${enc(q)}`, priceTier: "Premium", styleTags: ["Classic", "Preppy", "Smart Casual"] },
  { id: "ralph-lauren", name: "Ralph Lauren", categories: ["Premium", "Luxury"], countries: ["US", "GLOBAL"], website: "https://www.ralphlauren.com", searchUrl: (q) => `https://www.ralphlauren.com/search?q=${enc(q)}`, priceTier: "Luxury", styleTags: ["Classic", "Preppy", "Old money"] },
  { id: "massimo-dutti", name: "Massimo Dutti", categories: ["Premium"], countries: ["IN", "GLOBAL"], website: "https://www.massimodutti.com", searchUrl: (q) => `https://www.massimodutti.com/in/search?searchTerm=${enc(q)}`, priceTier: "Premium", styleTags: ["Classic", "Contemporary", "Smart Casual"] },

  // ---- Indian fashion ----
  { id: "westside", name: "Westside", categories: ["Indian", "Department Store"], countries: ["IN"], website: "https://www.westside.com", searchUrl: (q) => `https://www.westside.com/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Smart Casual", "Contemporary"] },
  { id: "max-fashion", name: "Max Fashion", categories: ["Indian", "Fast Fashion"], countries: ["IN"], website: "https://www.maxfashion.in", searchUrl: (q) => `https://www.maxfashion.in/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Relaxed", "Trendy"] },
  { id: "lifestyle", name: "Lifestyle", categories: ["Indian", "Department Store"], countries: ["IN"], website: "https://www.lifestylestores.com", searchUrl: (q) => `https://www.lifestylestores.com/in/en/search?q=${enc(q)}`, priceTier: "Mid", styleTags: ["Smart Casual", "Classic"] },
  { id: "pantaloons", name: "Pantaloons", categories: ["Indian", "Department Store"], countries: ["IN"], website: "https://www.pantaloons.com", searchUrl: (q) => `https://www.pantaloons.com/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Smart Casual", "Trendy"] },
  { id: "reliance-trends", name: "Reliance Trends", categories: ["Indian", "Department Store"], countries: ["IN"], website: "https://www.reliancetrends.com", searchUrl: (q) => `https://www.reliancetrends.com/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Relaxed", "Smart Casual"] },
  { id: "shoppers-stop", name: "Shoppers Stop", categories: ["Indian", "Department Store"], countries: ["IN"], website: "https://www.shoppersstop.com", searchUrl: (q) => `https://www.shoppersstop.com/search?q=${enc(q)}`, priceTier: "Mid", styleTags: ["Classic", "Smart Casual"] },
  { id: "allen-solly", name: "Allen Solly", categories: ["Indian"], countries: ["IN"], website: "https://www.allensolly.com", searchUrl: (q) => `https://www.allensolly.com/search?q=${enc(q)}`, priceTier: "Mid", styleTags: ["Smart Casual", "Classic"] },
  { id: "van-heusen", name: "Van Heusen", categories: ["Indian"], countries: ["IN"], website: "https://www.vanheusenindia.com", searchUrl: (q) => `https://www.vanheusenindia.com/search?q=${enc(q)}`, priceTier: "Mid", styleTags: ["Formal", "Classic"] },
  { id: "louis-philippe", name: "Louis Philippe", categories: ["Indian", "Premium"], countries: ["IN"], website: "https://www.louisphilippe.com", searchUrl: (q) => `https://www.louisphilippe.com/search?q=${enc(q)}`, priceTier: "Premium", styleTags: ["Formal", "Classic", "Old money"] },
  { id: "peter-england", name: "Peter England", categories: ["Indian"], countries: ["IN"], website: "https://www.peterengland.com", searchUrl: (q) => `https://www.peterengland.com/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Formal", "Smart Casual"] },
  { id: "raymond", name: "Raymond", categories: ["Indian", "Premium"], countries: ["IN"], website: "https://www.raymond.in", searchUrl: (q) => `https://www.raymond.in/search?q=${enc(q)}`, priceTier: "Premium", styleTags: ["Formal", "Classic"] },
  { id: "rare-rabbit", name: "Rare Rabbit", categories: ["Indian", "Premium"], countries: ["IN"], website: "https://www.rarerabbit.in", searchUrl: (q) => `https://www.rarerabbit.in/search?q=${enc(q)}`, priceTier: "Premium", styleTags: ["Contemporary", "Smart Casual"] },
  { id: "snitch", name: "Snitch", categories: ["Indian", "Streetwear"], countries: ["IN"], website: "https://www.snitch.com", searchUrl: (q) => `https://www.snitch.com/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Trendy", "Streetwear"] },
  { id: "blackberrys", name: "Blackberrys", categories: ["Indian", "Premium"], countries: ["IN"], website: "https://www.blackberrys.com", searchUrl: (q) => `https://www.blackberrys.com/search?q=${enc(q)}`, priceTier: "Premium", styleTags: ["Formal", "Classic"] },
  { id: "manyavar", name: "Manyavar", categories: ["Indian"], countries: ["IN"], website: "https://www.manyavar.com", searchUrl: (q) => `https://www.manyavar.com/search?q=${enc(q)}`, priceTier: "Premium", styleTags: ["Formal", "Occasion"] },
  { id: "being-human", name: "Being Human", categories: ["Indian"], countries: ["IN"], website: "https://www.beinghumanclothing.com", searchUrl: (q) => `https://www.beinghumanclothing.com/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Relaxed", "Trendy"] },

  // ---- Streetwear / youth ----
  { id: "souled-store", name: "The Souled Store", categories: ["Indian", "Streetwear"], countries: ["IN"], website: "https://www.thesouledstore.com", searchUrl: (q) => `https://www.thesouledstore.com/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Streetwear", "Trendy"] },
  { id: "bewakoof", name: "Bewakoof", categories: ["Indian", "Streetwear"], countries: ["IN"], website: "https://www.bewakoof.com", searchUrl: (q) => `https://www.bewakoof.com/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Streetwear", "Relaxed"] },
  { id: "bonkers-corner", name: "Bonkers Corner", categories: ["Indian", "Streetwear"], countries: ["IN"], website: "https://www.bonkerscorner.com", searchUrl: (q) => `https://www.bonkerscorner.com/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Streetwear", "Trendy"] },
  { id: "hyphen", name: "HYPHEN", categories: ["Indian", "Streetwear"], countries: ["IN"], website: "https://www.hyphenclothing.in", searchUrl: (q) => `https://www.hyphenclothing.in/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Streetwear"] },
  { id: "freakins", name: "Freakins", categories: ["Indian", "Streetwear"], countries: ["IN"], website: "https://www.freakins.com", searchUrl: (q) => `https://www.freakins.com/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Streetwear", "Trendy"] },

  // ---- Sports / activewear ----
  { id: "nike", name: "Nike", categories: ["Sports"], countries: ["IN", "US", "GLOBAL"], website: "https://www.nike.com", searchUrl: (q) => `https://www.nike.com/in/w?q=${enc(q)}`, priceTier: "Mid", styleTags: ["Sporty", "Streetwear"] },
  { id: "adidas", name: "Adidas", categories: ["Sports"], countries: ["IN", "GLOBAL"], website: "https://www.adidas.co.in", searchUrl: (q) => `https://www.adidas.co.in/search?q=${enc(q)}`, priceTier: "Mid", styleTags: ["Sporty", "Streetwear"] },
  { id: "puma", name: "Puma", categories: ["Sports"], countries: ["IN", "GLOBAL"], website: "https://in.puma.com", searchUrl: (q) => `https://in.puma.com/search?q=${enc(q)}`, priceTier: "Mid", styleTags: ["Sporty", "Streetwear"] },
  { id: "reebok", name: "Reebok", categories: ["Sports"], countries: ["IN", "GLOBAL"], website: "https://www.reebok.in", searchUrl: (q) => `https://www.reebok.in/search?q=${enc(q)}`, priceTier: "Budget", styleTags: ["Sporty"] },
  { id: "under-armour", name: "Under Armour", categories: ["Sports"], countries: ["US", "GLOBAL"], website: "https://www.underarmour.com", searchUrl: (q) => `https://www.underarmour.com/en-in/search?q=${enc(q)}`, priceTier: "Mid", styleTags: ["Sporty"] },
  { id: "new-balance", name: "New Balance", categories: ["Sports"], countries: ["IN", "GLOBAL"], website: "https://www.newbalance.in", searchUrl: (q) => `https://www.newbalance.in/search?q=${enc(q)}`, priceTier: "Mid", styleTags: ["Sporty", "Streetwear"] },
  { id: "asics", name: "ASICS", categories: ["Sports"], countries: ["IN", "GLOBAL"], website: "https://www.asics.com", searchUrl: (q) => `https://www.asics.com/in/en-in/search?q=${enc(q)}`, priceTier: "Mid", styleTags: ["Sporty"] },
  { id: "decathlon", name: "Decathlon", categories: ["Sports", "Outdoor"], countries: ["IN", "GLOBAL"], website: "https://www.decathlon.in", searchUrl: (q) => `https://www.decathlon.in/search?query=${enc(q)}`, priceTier: "Budget", styleTags: ["Sporty", "Relaxed"] },

  // ---- Marketplaces ----
  { id: "myntra", name: "Myntra", categories: ["Marketplace"], countries: ["IN"], website: "https://www.myntra.com", searchUrl: (q) => `https://www.myntra.com/search?q=${enc(q)}`, priceTier: "Mid", styleTags: [] },
  { id: "ajio", name: "AJIO", categories: ["Marketplace"], countries: ["IN"], website: "https://www.ajio.com", searchUrl: (q) => `https://www.ajio.com/search/?text=${enc(q)}`, priceTier: "Budget", styleTags: [] },
  { id: "amazon", name: "Amazon", categories: ["Marketplace"], countries: ["IN", "US", "GLOBAL"], website: "https://www.amazon.in", searchUrl: (q) => `https://www.amazon.in/s?k=${enc(q)}`, priceTier: "Budget", styleTags: [] },
  { id: "flipkart", name: "Flipkart", categories: ["Marketplace"], countries: ["IN"], website: "https://www.flipkart.com", searchUrl: (q) => `https://www.flipkart.com/search?q=${enc(q)}`, priceTier: "Budget", styleTags: [] },
];

const RETAILER_BY_ID = new Map(RETAILERS.map((r) => [r.id, r]));
const RETAILER_BY_NAME = new Map(RETAILERS.map((r) => [r.name, r]));

export function getRetailerByName(name: string): Retailer | undefined {
  return RETAILER_BY_NAME.get(name);
}

export function getRetailerById(id: string): Retailer | undefined {
  return RETAILER_BY_ID.get(id);
}

export function searchRetailers(query: string): Retailer[] {
  const q = query.trim().toLowerCase();
  if (!q) return RETAILERS;
  return RETAILERS.filter(
    (r) => r.name.toLowerCase().includes(q) || r.categories.some((c) => c.toLowerCase().includes(q))
  );
}

// Quick-filter chips shown above the retailer search (section 11). Each maps
// to a predicate over a retailer's categories/priceTier/countries.
export const RETAILER_QUICK_FILTERS: { label: string; test: (r: Retailer) => boolean }[] = [
  { label: "All", test: () => true },
  { label: "Indian", test: (r) => r.categories.includes("Indian") },
  { label: "International", test: (r) => !r.categories.includes("Indian") },
  { label: "Sports", test: (r) => r.categories.includes("Sports") },
  { label: "Streetwear", test: (r) => r.categories.includes("Streetwear") },
  { label: "Premium", test: (r) => r.priceTier === "Premium" || r.priceTier === "Luxury" },
  { label: "Budget", test: (r) => r.priceTier === "Budget" },
];

// Deterministic retailer ranking for "Not sure where to shop?" (section 12)
// and for ordering productOptions when the user hasn't picked specific
// stores. Never AI-guessed — pure metadata matching.
export function rankRetailersForRequest(params: {
  category: string;
  countryCode: string | null;
  priceTier: PriceTier | null; // derived from budget vs TYPICAL_PRICE_RANGE_USD, see wardrobeAnalysis.ts
  styleTags: string[]; // user's preferred styles
  preferredRetailerNames: string[];
}): { retailer: Retailer; reason: string }[] {
  const scored = RETAILERS.map((retailer) => {
    let score = 0;
    const reasons: string[] = [];

    if (params.preferredRetailerNames.includes(retailer.name)) {
      score += 50;
      reasons.push("One of your preferred stores");
    }
    if (params.countryCode && (retailer.countries.includes(params.countryCode) || retailer.countries.includes("GLOBAL"))) {
      score += 30;
      reasons.push("Available in your country");
    }
    if (params.priceTier && retailer.priceTier === params.priceTier) {
      score += 25;
      reasons.push(params.priceTier === "Budget" ? "Budget-friendly" : `${params.priceTier} price range`);
    }
    const styleOverlap = retailer.styleTags.some((t) => params.styleTags.includes(t));
    if (styleOverlap) {
      score += 20;
      reasons.push("Matches your style");
    }
    if (retailer.categories.includes("Marketplace")) {
      score += 5; // marketplaces are always a reasonable fallback option
    }

    return { retailer, score, reason: reasons[0] ?? "Worth checking" };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((s) => ({ retailer: s.retailer, reason: s.reason }));
}
