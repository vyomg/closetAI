import type { User, ClothingItem, ShoppingPreference, PersonalAppearanceProfile } from "@prisma/client";
import { parseList, parseObject } from "@/lib/json";
import type { StyleProfileData, LearnedPreferences, ClothingAnalysis, PersonalAppearanceAnalysis } from "@/lib/types";
import { EMPTY_LEARNED_PREFERENCES } from "@/lib/types";
import type { WardrobeItemForAI } from "@/lib/prompts/outfitGenerator";
import type { ShoppingPreferenceData } from "@/lib/wardrobeAnalysis";

export function userToStyleProfile(user: User): StyleProfileData {
  return {
    preferredStyles: parseList(user.preferredStyles),
    usualClothing: user.usualClothing,
    occasions: parseList(user.occasions),
    fitPreference: user.fitPreference,
    colorsLove: parseList(user.colorsLove),
    colorsAvoid: parseList(user.colorsAvoid),
    shoePreference: parseList(user.shoePreference),
    adventurousness: user.adventurousness,
    comfortImportance: user.comfortImportance,
    fashionImportance: user.fashionImportance,
    formalImportance: user.formalImportance,
    city: user.city,
  };
}

export function userToLearnedPreferences(user: User): LearnedPreferences {
  return parseObject(user.learnedPreferences, { ...EMPTY_LEARNED_PREFERENCES });
}

export function userToLocationSettings(user: User) {
  return {
    city: user.city,
    admin1: user.admin1,
    country: user.country,
    countryCode: user.countryCode,
    latitude: user.latitude,
    longitude: user.longitude,
    locationSource: user.locationSource as "NONE" | "GPS" | "MANUAL",
    temperatureUnit: user.temperatureUnit as "AUTO" | "C" | "F",
    distanceUnit: user.distanceUnit as "AUTO" | "km" | "mi",
  };
}

export function clothingItemToJSON(item: ClothingItem) {
  return {
    id: item.id,
    // Prefer the cleaned, neutral-background version for display; the
    // original upload is always preserved in `originalImageUrl` and never
    // deleted — this only changes what's shown by default.
    imageUrl: item.processedImageUrl || item.imageUrl,
    originalImageUrl: item.imageUrl,
    hasProcessedImage: !!item.processedImageUrl,
    name: item.name,
    category: item.category,
    subcategory: item.subcategory,
    primaryColor: item.primaryColor,
    secondaryColors: parseList(item.secondaryColors),
    pattern: item.pattern,
    material: item.material,
    fit: item.fit,
    style: item.style,
    brand: item.brand,
    formality: item.formality,
    season: parseList(item.season),
    sleeveLength: item.sleeveLength,
    occasions: parseList(item.occasions),
    pairings: parseList(item.pairings),
    tags: parseList(item.tags),
    uncertainFields: parseList(item.uncertainFields),
    userEdited: item.userEdited,
    isDemo: item.isDemo,
    wearCount: item.wearCount,
    lastWornAt: item.lastWornAt,
    createdAt: item.createdAt,
  };
}

export function clothingItemToAI(item: ClothingItem): WardrobeItemForAI {
  return {
    id: item.id,
    category: item.category,
    subcategory: item.subcategory,
    primaryColor: item.primaryColor,
    secondaryColors: parseList(item.secondaryColors),
    pattern: item.pattern,
    fit: item.fit,
    style: item.style,
    formality: item.formality,
    season: parseList(item.season),
    occasions: parseList(item.occasions),
    wearCount: item.wearCount,
    lastWornAt: item.lastWornAt ? item.lastWornAt.toISOString() : null,
  };
}

export const EMPTY_SHOPPING_PREFERENCE: ShoppingPreferenceData = {
  budgetMin: null,
  budgetMax: null,
  currency: "AUTO",
  preferredColors: [],
  avoidedColors: [],
  preferredCategories: [],
  preferredSubcategories: [],
  preferredRetailers: [],
  preferredFits: [],
  preferredMaterials: [],
  priorities: [],
  shoppingMode: "",
};

export function shoppingPreferenceToJSON(pref: ShoppingPreference | null): ShoppingPreferenceData {
  if (!pref) return { ...EMPTY_SHOPPING_PREFERENCE };
  return {
    budgetMin: pref.budgetMin,
    budgetMax: pref.budgetMax,
    currency: pref.currency,
    preferredColors: parseList(pref.preferredColors),
    avoidedColors: parseList(pref.avoidedColors),
    preferredCategories: parseList(pref.preferredCategories),
    preferredSubcategories: parseList(pref.preferredSubcategories),
    preferredRetailers: parseList(pref.preferredRetailers),
    preferredFits: parseList(pref.preferredFits),
    preferredMaterials: parseList(pref.preferredMaterials),
    priorities: parseList(pref.priorities),
    shoppingMode: pref.shoppingMode,
  };
}

// The photo URL is intentionally the caller's responsibility to include or
// omit — this serializer is used both by the one auth-gated "view my own
// profile" endpoint (which needs photoUrl) and, indirectly, by nothing else,
// since no other route should ever touch this model. Keeping photoUrl out of
// the client-facing DTO by default and only adding it where explicitly
// needed keeps that boundary obvious at the call site.
export function personalAppearanceProfileToJSON(profile: PersonalAppearanceProfile | null, includePhotoUrl: boolean) {
  if (!profile) {
    return { status: "PENDING" as const, photoUrl: null, analyzedAt: null, errorMessage: null };
  }
  return {
    status: profile.status as "PENDING" | "ANALYZING" | "COMPLETE" | "FAILED" | "SKIPPED",
    photoUrl: includePhotoUrl ? profile.photoUrl : null,
    faceShape: profile.faceShape,
    hairstyleNotes: profile.hairstyleNotes,
    bodyProportionNotes: profile.bodyProportionNotes,
    skinToneCategory: profile.skinToneCategory,
    recommendedPalette: parseList(profile.recommendedPalette),
    neutralPalette: parseList(profile.neutralPalette),
    accentColors: parseList(profile.accentColors),
    recommendedFits: parseList(profile.recommendedFits),
    recommendedSilhouettes: parseList(profile.recommendedSilhouettes),
    layeringNotes: profile.layeringNotes,
    trouserNotes: profile.trouserNotes,
    topNotes: profile.topNotes,
    outerwearNotes: profile.outerwearNotes,
    footwearNotes: profile.footwearNotes,
    accessoryNotes: profile.accessoryNotes,
    collarNecklineNotes: profile.collarNecklineNotes,
    styleStrengths: parseList(profile.styleStrengths),
    experimentIdeas: parseList(profile.experimentIdeas),
    confidence: parseObject(profile.confidence, {} as Record<string, string>),
    analyzedAt: profile.analyzedAt,
    errorMessage: profile.errorMessage,
  };
}

export function analysisToAppearanceProfileFields(analysis: PersonalAppearanceAnalysis) {
  return {
    faceShape: analysis.faceShape,
    hairstyleNotes: analysis.hairstyleNotes,
    bodyProportionNotes: analysis.bodyProportionNotes,
    skinToneCategory: analysis.skinToneCategory,
    recommendedPalette: JSON.stringify(analysis.recommendedPalette ?? []),
    neutralPalette: JSON.stringify(analysis.neutralPalette ?? []),
    accentColors: JSON.stringify(analysis.accentColors ?? []),
    recommendedFits: JSON.stringify(analysis.recommendedFits ?? []),
    recommendedSilhouettes: JSON.stringify(analysis.recommendedSilhouettes ?? []),
    layeringNotes: analysis.layeringNotes,
    trouserNotes: analysis.trouserNotes,
    topNotes: analysis.topNotes,
    outerwearNotes: analysis.outerwearNotes,
    footwearNotes: analysis.footwearNotes,
    accessoryNotes: analysis.accessoryNotes,
    collarNecklineNotes: analysis.collarNecklineNotes,
    styleStrengths: JSON.stringify(analysis.styleStrengths ?? []),
    experimentIdeas: JSON.stringify(analysis.experimentIdeas ?? []),
    confidence: JSON.stringify(analysis.confidence ?? {}),
  };
}

// Minimal, intentionally narrow shape for public share/friend-request views —
// only what's needed to render one outfit card. Never includes wearCount,
// tags, uncertainFields, or anything else about the wardrobe beyond this one
// outfit's items, and never touches User/appearance-profile data at all.
export function outfitToPublicJSON(outfit: {
  occasion: string;
  style: string;
  explanation: string;
  styleMatch: number;
  occasionMatch: number;
  colorHarmony: number;
  overallScore: number;
  items: { slot: string; clothingItem: ClothingItem }[];
}) {
  return {
    occasion: outfit.occasion,
    style: outfit.style,
    explanation: outfit.explanation,
    styleMatch: outfit.styleMatch,
    occasionMatch: outfit.occasionMatch,
    colorHarmony: outfit.colorHarmony,
    overallScore: outfit.overallScore,
    items: outfit.items.map((oi) => ({
      slot: oi.slot,
      imageUrl: oi.clothingItem.processedImageUrl || oi.clothingItem.imageUrl,
      name: oi.clothingItem.name,
      category: oi.clothingItem.category,
      subcategory: oi.clothingItem.subcategory,
      primaryColor: oi.clothingItem.primaryColor,
    })),
  };
}

export function analysisToItemFields(analysis: ClothingAnalysis) {
  return {
    category: analysis.category,
    subcategory: analysis.subcategory,
    primaryColor: analysis.primaryColor,
    secondaryColors: JSON.stringify(analysis.secondaryColors ?? []),
    pattern: analysis.pattern,
    material: analysis.material,
    fit: analysis.fit,
    style: analysis.style,
    brand: analysis.brand,
    formality: analysis.formality,
    season: JSON.stringify(analysis.season ?? []),
    sleeveLength: analysis.sleeveLength,
    occasions: JSON.stringify(analysis.occasions ?? []),
    pairings: JSON.stringify(analysis.pairings ?? []),
    tags: JSON.stringify(analysis.tags ?? []),
    uncertainFields: JSON.stringify(analysis.uncertainFields ?? []),
  };
}
