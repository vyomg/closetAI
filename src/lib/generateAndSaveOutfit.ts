// Shared core of the outfit generation pipeline: call Gemini for a small set
// of candidate outfits, validate every candidate against the deterministic
// hard rules, deterministically re-rank the valid ones (explicit preference
// enforcement, repetition/wear-rotation), retry with feedback only if EVERY
// candidate was invalid, and persist the winner. Extracted from
// /api/outfits/generate so that Today's Outfit, Outfit Remix, Outfit
// Challenges, and Trip Stylist all reuse the exact same validated pipeline
// instead of re-implementing the retry loop.
import type { ClothingItem, User } from "@prisma/client";
import { db } from "@/lib/db";
import { generateOutfit, type WardrobeItemForAI, type OutfitCandidate } from "@/lib/prompts/outfitGenerator";
import type { StyleProfileData, LearnedPreferences } from "@/lib/types";
import { CATEGORY_TO_SLOT } from "@/lib/constants";
import { validateOutfitSelection } from "@/lib/outfitValidator";
import { clothingItemToJSON } from "@/lib/serializers";
import { adjustCandidateScore } from "@/lib/outfitScoring";

const MAX_GENERATION_ATTEMPTS = 3;

export type WeatherForPrompt = {
  tempC: number;
  feelsLikeC: number;
  condition: string;
  humidity: number;
  precipitationProbability: number;
  uvIndex: number | null;
} | null;

export type GenerateAndSaveResult =
  | { ok: true; outfit: ReturnType<typeof formatOutfitResponse> }
  | { ok: false; error: string; validationErrors?: string[]; status: number };

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function formatOutfitResponse(outfit: Awaited<ReturnType<typeof saveOutfit>>, unmetConstraints: string[]) {
  return {
    id: outfit.id,
    occasion: outfit.occasion,
    style: outfit.style,
    explanation: outfit.explanation,
    styleMatch: outfit.styleMatch,
    occasionMatch: outfit.occasionMatch,
    colorHarmony: outfit.colorHarmony,
    overallScore: outfit.overallScore,
    adventureLevel: outfit.adventureLevel,
    isSaved: outfit.isSaved,
    isManual: false,
    createdAt: outfit.createdAt,
    tripId: outfit.tripId,
    challengeKey: outfit.challengeKey,
    remixOfOutfitId: outfit.remixOfOutfitId,
    unmetConstraints,
    items: outfit.items.map((oi) => ({ slot: oi.slot, ...clothingItemToJSON(oi.clothingItem) })),
  };
}

async function saveOutfit(
  userId: string,
  occasion: string,
  desiredStyle: string,
  explanation: string,
  scores: { styleMatch: number; occasionMatch: number; colorHarmony: number; overallScore: number },
  adventureLevel: number,
  selectedItems: ClothingItem[],
  extraFields: { tripId?: string; challengeKey?: string; remixOfOutfitId?: string }
) {
  return db.outfit.create({
    data: {
      userId,
      occasion,
      style: desiredStyle,
      explanation,
      styleMatch: clamp(scores.styleMatch),
      occasionMatch: clamp(scores.occasionMatch),
      colorHarmony: clamp(scores.colorHarmony),
      overallScore: clamp(scores.overallScore),
      adventureLevel,
      ...(extraFields.tripId ? { tripId: extraFields.tripId } : {}),
      ...(extraFields.challengeKey ? { challengeKey: extraFields.challengeKey } : {}),
      ...(extraFields.remixOfOutfitId ? { remixOfOutfitId: extraFields.remixOfOutfitId } : {}),
      items: {
        create: selectedItems.map((item) => ({
          clothingItemId: item.id,
          slot: CATEGORY_TO_SLOT[item.category as keyof typeof CATEGORY_TO_SLOT] ?? "accessory",
        })),
      },
    },
    include: { items: { include: { clothingItem: true } } },
  });
}

type ValidCandidate = {
  candidate: OutfitCandidate;
  items: ClothingItem[];
  adjustedScore: number;
  extraNotes: string[];
};

export async function generateAndSaveOutfit(args: {
  user: User;
  wardrobeItems: ClothingItem[];
  filteredForAI: WardrobeItemForAI[];
  styleProfile: StyleProfileData;
  learnedPreferences: LearnedPreferences;
  occasion: string;
  desiredStyle: string;
  notes: string;
  adventureLevel: number;
  weather: WeatherForPrompt;
  recentOutfitItemIds: string[][];
  anchorItemId?: string;
  fixedItemIds?: string[];
  extraOutfitFields?: { tripId?: string; challengeKey?: string; remixOfOutfitId?: string };
}): Promise<GenerateAndSaveResult> {
  const wardrobeById = new Map(args.wardrobeItems.map((item) => [item.id, item]));

  let best: ValidCandidate | null = null;
  let lastValidationErrors: string[] = [];

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const validationFeedback =
      lastValidationErrors.length > 0
        ? `\n\nIMPORTANT — YOUR PREVIOUS CANDIDATES WERE ALL INVALID.\n\nValidation errors:\n${lastValidationErrors.map((e) => `- ${e}`).join("\n")}\n\nGenerate completely new valid candidates that fix every one of these errors.\nDo not repeat the invalid selection.`
        : "";

    // AIConfigError and any other Gemini failure propagate to the caller,
    // which is better placed to decide the right HTTP status/message for its
    // own route.
    const result = await generateOutfit({
      wardrobe: args.filteredForAI,
      styleProfile: args.styleProfile,
      learnedPreferences: args.learnedPreferences,
      occasion: args.occasion,
      desiredStyle: args.desiredStyle,
      notes: `${args.notes}${validationFeedback}`,
      adventureLevel: args.adventureLevel,
      weather: args.weather,
      recentOutfitItemIds: args.recentOutfitItemIds,
      anchorItemId: args.anchorItemId,
      fixedItemIds: args.fixedItemIds,
    });

    const attemptErrors: string[] = [];

    for (const candidate of result.candidates ?? []) {
      const selectedItemIds = candidate.selectedItemIds ?? [];
      const uniqueSelectedIds = new Set(selectedItemIds);

      if (uniqueSelectedIds.size !== selectedItemIds.length) {
        attemptErrors.push("A candidate contained the same clothing item more than once.");
        continue;
      }

      const unknownIds = selectedItemIds.filter((id) => !wardrobeById.has(id));
      if (unknownIds.length > 0) {
        attemptErrors.push("A candidate contained clothing items that are not actually in the user's wardrobe.");
        continue;
      }

      const requiredFixedIds = [...(args.fixedItemIds ?? []), ...(args.anchorItemId ? [args.anchorItemId] : [])];
      const missingFixed = requiredFixedIds.filter((id) => !uniqueSelectedIds.has(id));
      if (missingFixed.length > 0) {
        attemptErrors.push("A candidate was missing one or more required (anchor/fixed) items.");
        continue;
      }

      const items = selectedItemIds
        .map((id) => wardrobeById.get(id))
        .filter((item): item is ClothingItem => item !== undefined);

      const validation = validateOutfitSelection(items, args.anchorItemId ?? null);
      if (!validation.valid) {
        attemptErrors.push(...validation.errors);
        continue;
      }

      const { adjustedScore, notes } = adjustCandidateScore(
        candidate.overallScore,
        items,
        args.styleProfile,
        args.recentOutfitItemIds
      );

      if (!best || adjustedScore > best.adjustedScore) {
        best = { candidate, items, adjustedScore, extraNotes: notes };
      }
    }

    if (best) {
      lastValidationErrors = [];
      break;
    }

    // No candidate this round was valid — retry with the accumulated errors
    // as feedback (deduplicated so the prompt doesn't balloon with repeats).
    lastValidationErrors = [...new Set(attemptErrors)];
    if (lastValidationErrors.length === 0) {
      lastValidationErrors = ["No candidates were returned."];
    }
  }

  if (!best) {
    return {
      ok: false,
      error:
        "I couldn't assemble a valid outfit from your wardrobe for those constraints. Try adjusting your request or adding more suitable items.",
      validationErrors: lastValidationErrors,
      status: 422,
    };
  }

  const unmetConstraints = [...(best.candidate.unmetConstraints ?? []), ...best.extraNotes];

  const outfit = await saveOutfit(
    args.user.id,
    args.occasion,
    args.desiredStyle,
    best.candidate.explanation,
    best.candidate,
    args.adventureLevel,
    best.items,
    args.extraOutfitFields ?? {}
  );

  return { ok: true, outfit: formatOutfitResponse(outfit, unmetConstraints) };
}
