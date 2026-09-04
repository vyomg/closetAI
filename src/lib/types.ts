export type ClothingAnalysis = {
  category: string;
  subcategory: string;
  primaryColor: string;
  secondaryColors: string[];
  pattern: string;
  material: string | null;
  fit: string;
  style: string;
  formality: number; // 1-5
  season: string[];
  sleeveLength: string | null;
  occasions: string[];
  pairings: string[];
  tags: string[];
  uncertainFields: string[];
};

export type StyleProfileData = {
  preferredStyles: string[];
  usualClothing: string;
  occasions: string[];
  fitPreference: string;
  colorsLove: string[];
  colorsAvoid: string[];
  shoePreference: string[];
  adventurousness: number;
  comfortImportance: number;
  fashionImportance: number;
  formalImportance: number;
  city: string | null;
};

export type LearnedPreferences = {
  likedAttributes: Record<string, number>;
  dislikedAttributes: Record<string, number>;
  totalFeedback: number;
};

export const EMPTY_LEARNED_PREFERENCES: LearnedPreferences = {
  likedAttributes: {},
  dislikedAttributes: {},
  totalFeedback: 0,
};

export type OutfitSlotItem = {
  id: string;
  imageUrl: string;
  name: string;
  category: string;
  subcategory: string;
  primaryColor: string;
  slot: string;
};

export type GeneratedOutfit = {
  items: OutfitSlotItem[];
  explanation: string;
  styleMatch: number;
  occasionMatch: number;
  colorHarmony: number;
  overallScore: number;
};
