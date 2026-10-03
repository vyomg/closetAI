export type ClothingItemDTO = {
  id: string;
  imageUrl: string;
  originalImageUrl: string;
  hasProcessedImage: boolean;
  name: string;
  category: string;
  subcategory: string;
  primaryColor: string;
  secondaryColors: string[];
  pattern: string;
  material: string | null;
  fit: string;
  style: string;
  brand: string | null;
  formality: number;
  season: string[];
  sleeveLength: string | null;
  occasions: string[];
  pairings: string[];
  tags: string[];
  uncertainFields: string[];
  userEdited: boolean;
  isDemo: boolean;
  wearCount: number;
  lastWornAt: string | null;
  createdAt: string;
  slot?: string;
};

export type PersonalAppearanceProfileDTO = {
  status: "PENDING" | "ANALYZING" | "COMPLETE" | "FAILED" | "SKIPPED";
  photoUrl: string | null;
  faceShape?: string | null;
  hairstyleNotes?: string | null;
  bodyProportionNotes?: string | null;
  skinToneCategory?: string | null;
  recommendedPalette?: string[];
  neutralPalette?: string[];
  accentColors?: string[];
  recommendedFits?: string[];
  recommendedSilhouettes?: string[];
  layeringNotes?: string | null;
  trouserNotes?: string | null;
  topNotes?: string | null;
  outerwearNotes?: string | null;
  footwearNotes?: string | null;
  accessoryNotes?: string | null;
  collarNecklineNotes?: string | null;
  styleStrengths?: string[];
  experimentIdeas?: string[];
  confidence?: Record<string, string>;
  analyzedAt: string | null;
  errorMessage?: string | null;
};

export type ShoppingPreferenceDTO = {
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string; // "AUTO" or an ISO code
  preferredColors: string[];
  avoidedColors: string[];
  preferredCategories: string[];
  preferredSubcategories: string[]; // "Category::Subcategory"
  preferredRetailers: string[];
  preferredFits: string[];
  preferredMaterials: string[];
  priorities: string[];
  shoppingMode: string;
};

export type LocationSettingsDTO = {
  city: string | null;
  admin1: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
  locationSource: "NONE" | "GPS" | "MANUAL";
  temperatureUnit: "AUTO" | "C" | "F";
  distanceUnit: "AUTO" | "km" | "mi";
};

export type DailyForecastEntryDTO = {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationProbability: number;
  weatherCode: number;
};

export type WeatherDTO = {
  city: string;
  country: string | null;
  tempC: number;
  feelsLikeC: number;
  condition: string;
  isRaining: boolean;
  humidity: number;
  precipitationProbability: number;
  windKph: number;
  uvIndex: number | null;
  dailyForecast: DailyForecastEntryDTO[];
};

export type RetailerSearchDTO = {
  type: "retailer-search";
  retailer: string;
  searchQuery: string;
  searchUrl: string;
  reason: string;
};

export type ExactProductDTO = {
  type: "exact";
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
  originalPrice?: number;
  discountPercent?: number;
  fetchedAt: string;
};

export type ProductResultDTO = ExactProductDTO | RetailerSearchDTO;

export type RecommendationDTO = {
  id: string;
  category: string;
  subcategory: string;
  suggestedColor: string;
  gapType: string;
  reason: string;
  scores: {
    wardrobeCompatibility: number;
    outfitPotential: number;
    colorCompatibility: number;
    weatherCompatibility: number;
    styleMatch: number;
    budgetFit: number | null;
    duplicationPenalty: number;
    overallScore: number;
    closetROI: number;
  };
  worksWithCount: number;
  newOutfitCombos: number;
  duplicateCount: number;
  skipRecommended: boolean;
  exampleOutfit: (ClothingItemDTO & { slot: string })[];
  productResults: ProductResultDTO[];
  usedRealProvider: boolean;
};

export type GapAnalysisDTO = {
  overallAdvice: string;
  smartBrief: string | null;
  forecastInsight: string | null;
  climateProfile: string | null;
  recommendations: RecommendationDTO[];
  stats: {
    totalItems: number;
    byCategory: Record<string, number>;
    byFormalityBand: Record<string, number>;
    duplicateClusters: { category: string; subcategory: string; color: string; count: number }[];
    underusedCount: number;
  };
  currency: string | null;
  currencyIsAuto: boolean;
  weather: WeatherDTO | null;
  aiUnavailable: boolean;
};

export type ShouldIBuyResultDTO = {
  analysis: {
    category: string;
    subcategory: string;
    primaryColor: string;
    style: string;
    formality: number;
  };
  verdict: "Strong Buy" | "Consider" | "Skip";
  reasons: string[];
  concerns: string[];
  duplicateCount: number;
  buyScore: number;
  scores: {
    wardrobeCompatibility: number;
    outfitPotential: number;
    colorCompatibility: number;
    weatherCompatibility: number;
    budgetFit: number | null;
    duplicationPenalty: number;
    versatilityScore: number;
    overallScore: number;
    closetROI: number;
  };
  aiUnavailable: boolean;
};

export type OutfitDTO = {
  id: string;
  occasion: string;
  style: string;
  explanation: string;
  styleMatch: number;
  occasionMatch: number;
  colorHarmony: number;
  overallScore: number;
  adventureLevel: number;
  isSaved: boolean;
  // true only for outfits hand-built in the Outfit Playground — never
  // scored by Gemini/outfitValidator. Optional so older call sites that
  // don't pass it default safely to "treat as generated".
  isManual?: boolean;
  createdAt: string;
  lastWornAt?: string | null;
  unmetConstraints?: string[];
  feedback?: { feedbackType: string; reasons: string[] } | null;
  tripId?: string | null;
  challengeKey?: string | null;
  remixOfOutfitId?: string | null;
  items: ClothingItemDTO[];
};
