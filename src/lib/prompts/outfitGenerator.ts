import {
  getGeminiClient,
  GEMINI_MODEL,
  extractJson,
} from "@/lib/anthropic";
import type { StyleProfileData, LearnedPreferences } from "@/lib/types";

export type WardrobeItemForAI = {
  id: string;
  category: string;
  subcategory: string;
  primaryColor: string;
  secondaryColors: string[];
  pattern: string;
  fit: string;
  style: string;
  formality: number;
  season: string[];
  occasions: string[];
  wearCount: number;
  lastWornAt: string | null;
};

export type OutfitGenerationInput = {
  wardrobe: WardrobeItemForAI[];
  styleProfile: StyleProfileData;
  learnedPreferences: LearnedPreferences;
  occasion: string;
  desiredStyle: string;
  notes: string;
  adventureLevel: number;
  weather: { tempC: number; condition: string } | null;
  recentOutfitItemIds: string[][];
  anchorItemId?: string;
};

export type OutfitGenerationResult = {
  selectedItemIds: string[];
  explanation: string;
  styleMatch: number;
  occasionMatch: number;
  colorHarmony: number;
  overallScore: number;
  unmetConstraints: string[];
};

const SYSTEM_PROMPT = `You are the Outfit Generator for ClosetAI, a digital wardrobe app. You build complete outfits using ONLY clothing items the user actually owns, which are provided to you as a structured wardrobe list — never invent items that aren't in that list.

You reason about:
1. Occasion appropriateness and formality match
2. Colour harmony between pieces
3. Style/aesthetic compatibility
4. Fit and proportion balance (e.g. avoid pairing oversized top with oversized bottom unless the user is adventurous)
5. Season/weather appropriateness
6. The user's stated style profile and learned preferences (liked/disliked attributes)
7. Avoiding items that appear heavily in the recent outfits provided, to keep rotation varied
8. The user's adventure level: 1 (very safe, stick to proven neutral combos) through 5 (bold, experimental combos, unusual colour pairings, willing to break some conventions while staying wearable)
9. Any free-text notes from the user (e.g. "don't want jeans", "want to wear white sneakers") — treat these as hard constraints when specific enough

A complete outfit normally has: one top OR a top+outerwear combo, one bottom, one pair of shoes, and optionally 1-2 accessories. Not every outfit needs outerwear or accessories — only include them if they genuinely improve the outfit for the occasion/weather.

If the wardrobe is missing something needed for a good outfit (e.g. no formal shoes for a wedding), do the best you can with what exists and note the gap in "unmetConstraints" instead of inventing an item.

Respond with ONLY a single JSON object, no prose, no markdown fences, matching exactly:
{
  "selectedItemIds": string[],
  "explanation": string (2-4 sentences, natural, specific to the actual pieces chosen, explaining why they work together),
  "styleMatch": number (0-100),
  "occasionMatch": number (0-100),
  "colorHarmony": number (0-100),
  "overallScore": number (0-100),
  "unmetConstraints": string[]
}`;

export async function generateOutfit(
  input: OutfitGenerationInput
): Promise<OutfitGenerationResult> {
  const client = getGeminiClient();

  const userPrompt = `Build one outfit from this wardrobe.

WARDROBE (only use items from this list, referenced by id):
${JSON.stringify(input.wardrobe, null, 2)}

USER STYLE PROFILE:
${JSON.stringify(input.styleProfile, null, 2)}

LEARNED PREFERENCES (from past like/dislike feedback):
${JSON.stringify(input.learnedPreferences, null, 2)}

REQUEST:
- Occasion: ${input.occasion}
- Desired style: ${input.desiredStyle}
- Adventure level: ${input.adventureLevel}/5
- Additional notes from user: ${input.notes || "(none)"}
${input.weather ? `- Current weather: ${input.weather.tempC}°C, ${input.weather.condition}` : ""}
${input.anchorItemId ? `- MUST include this exact item id in the outfit: ${input.anchorItemId}` : ""}

RECENTLY WORN OUTFITS (avoid repeating these combinations, and lightly deprioritize items worn most often):
${JSON.stringify(input.recentOutfitItemIds)}

Respond with the JSON object only.`;

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned no text content for outfit generation");
  }

  return extractJson<OutfitGenerationResult>(text);
}