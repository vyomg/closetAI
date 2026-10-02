// Product discovery abstraction for Buy Clothes.
//
// IMPORTANT — READ BEFORE CHANGING: there is no configured real-product
// API/feed in this project. package.json has no shopping-search client, and
// .env/.env.local carry no product-search credential (checked: only
// DATABASE_URL, GEMINI_API_KEY, AUTH_SECRET, and the Vercel Blob variables
// exist). A real provider (e.g. SerpApi's Google Shopping API) needs a paid
// API key nobody can invent — see the README note in the final report.
//
// So the only implementation here, RetailerSearchProvider, returns a
// truthful retailer-SEARCH fallback: real retailer domains, real
// site-search URL patterns, an honest search query — NEVER a specific
// invented product, price, rating, or product URL. `usedRealProvider` is
// always false from this provider so the UI can say so honestly.
//
// The interface is shaped so a real provider can be dropped in later
// without touching callers: implement `searchProducts` returning
// `{ type: "exact", product }` results with `usedRealProvider: true`.

import { RETAILERS, rankRetailersForRequest, type PriceTier } from "@/lib/retailers";

export type ExactProduct = {
  id: string;
  title: string;
  brand: string;
  retailer: string;
  price: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
  availability: "in_stock" | "out_of_stock" | "unknown";
  color: string;
  category: string;
  subcategory: string;
  rating?: number;
  reviewCount?: number;
  // Sale-price architecture (section 35): ready for a real provider to
  // populate — this app never fabricates these values.
  originalPrice?: number;
  discountPercent?: number;
  // When this result was fetched — shopping data is ephemeral, never
  // treated as a permanent fact the way wardrobe data is.
  fetchedAt: string;
};

export type RetailerSearchResult = {
  type: "retailer-search";
  retailer: string;
  searchQuery: string;
  searchUrl: string;
  reason: string;
};

export type ExactProductResult = { type: "exact"; product: ExactProduct };

export type ProductResult = ExactProductResult | RetailerSearchResult;

export type ProductSearchQuery = {
  category: string;
  subcategory: string;
  colors: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string | null;
  fit?: string | null;
  material?: string | null;
  styleTags: string[];
  retailerNames: string[];
  countryCode: string | null;
  priceTier: PriceTier | null;
};

export type ProductSearchResult = {
  results: ProductResult[];
  // False for every result set from RetailerSearchProvider — there is no
  // live/real product data being returned, only search links. A real
  // provider implementation would set this true and return `exact` results.
  usedRealProvider: boolean;
};

export interface ProductProvider {
  searchProducts(query: ProductSearchQuery): Promise<ProductSearchResult>;
  // Optional — a provider that can look up one product by ID implements
  // this; RetailerSearchProvider doesn't (it never has product IDs to look
  // up), so it's undefined there rather than a fake implementation.
  getProductDetails?(productId: string): Promise<ExactProduct | null>;
  // Capability flags so callers/UI can ask a provider what it's actually
  // able to supply instead of assuming every provider returns everything.
  readonly supportsAvailability: boolean;
  readonly supportsPrice: boolean;
  readonly supportsImages: boolean;
}

// Builds a specific search query from every signal we actually have —
// colour, material, fit, and subcategory — rather than just colour +
// subcategory, so even the honest fallback search is as useful as possible.
function buildSearchText(query: ProductSearchQuery): string {
  const parts = [query.colors[0], query.fit, query.material, query.subcategory].filter(Boolean);
  return parts.join(" ").toLowerCase().trim();
}

export class RetailerSearchProvider implements ProductProvider {
  // Honest capability flags: this provider only ever returns search links,
  // never real product facts, so all three are false.
  readonly supportsAvailability = false;
  readonly supportsPrice = false;
  readonly supportsImages = false;

  async searchProducts(query: ProductSearchQuery): Promise<ProductSearchResult> {
    const searchText = buildSearchText(query);

    const retailers =
      query.retailerNames.length > 0
        ? RETAILERS.filter((r) => query.retailerNames.includes(r.name))
        : rankRetailersForRequest({
            category: query.category,
            countryCode: query.countryCode,
            priceTier: query.priceTier,
            styleTags: query.styleTags,
            preferredRetailerNames: [],
          }).map((r) => r.retailer);

    const results: ProductResult[] = retailers.slice(0, 6).map((retailer) => ({
      type: "retailer-search" as const,
      retailer: retailer.name,
      searchQuery: searchText,
      searchUrl: retailer.searchUrl(searchText),
      reason: query.retailerNames.includes(retailer.name) ? "One of your preferred stores" : "Worth checking",
    }));

    return { results, usedRealProvider: false };
  }
}

// Single shared instance — stateless, so one is enough for the whole app.
export const productProvider: ProductProvider = new RetailerSearchProvider();
