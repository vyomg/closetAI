import type { User, ClothingItem } from "@prisma/client";
import { parseList, parseObject } from "@/lib/json";
import type { StyleProfileData, LearnedPreferences, ClothingAnalysis } from "@/lib/types";
import { EMPTY_LEARNED_PREFERENCES } from "@/lib/types";
import type { WardrobeItemForAI } from "@/lib/prompts/outfitGenerator";

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

export function clothingItemToJSON(item: ClothingItem) {
  return {
    id: item.id,
    imageUrl: item.imageUrl,
    name: item.name,
    category: item.category,
    subcategory: item.subcategory,
    primaryColor: item.primaryColor,
    secondaryColors: parseList(item.secondaryColors),
    pattern: item.pattern,
    material: item.material,
    fit: item.fit,
    style: item.style,
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
    formality: analysis.formality,
    season: JSON.stringify(analysis.season ?? []),
    sleeveLength: analysis.sleeveLength,
    occasions: JSON.stringify(analysis.occasions ?? []),
    pairings: JSON.stringify(analysis.pairings ?? []),
    tags: JSON.stringify(analysis.tags ?? []),
    uncertainFields: JSON.stringify(analysis.uncertainFields ?? []),
  };
}
