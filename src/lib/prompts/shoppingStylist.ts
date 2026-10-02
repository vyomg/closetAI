import { Type } from "@google/genai";
import { getGeminiClient, GEMINI_MODEL, extractJson } from "@/lib/anthropic";
import type { StyleProfileData, LearnedPreferences, ClothingAnalysis } from "@/lib/types";
import type { GapCandidate, WardrobeStats, ShoppingPreferenceData } from "@/lib/wardrobeAnalysis";

const GAP_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    selections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          candidateId: { type: Type.STRING },
          keep: { type: Type.BOOLEAN },
          styleMatch: { type: Type.INTEGER, minimum: 0, maximum: 100 },
          reason: { type: Type.STRING },
        },
        required: ["candidateId", "keep", "styleMatch", "reason"],
      },
    },
    overallAdvice: { type: Type.STRING },
  },
  required: ["selections", "overallAdvice"],
};

const SHOULD_I_BUY_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING, enum: ["Strong Buy", "Consider", "Skip"] },
    reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
    concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["verdict", "reasons", "concerns"],
};

const GAP_SYSTEM_PROMPT = `You are the Shopping Stylist for matchin'. You never see a product catalogue — you only see deterministic facts matchin' already computed about the user's wardrobe, plus a short list of candidate gaps matchin's code identified.

Your job is judgment, not invention:
- Decide which candidates are genuinely worth recommending to this specific user, given their style profile, learned likes/dislikes, shopping preferences (budget, colours, retailers, fit, materials, priorities), what they're currently shopping for (their "shopping mode"), and their current climate/weather context when provided.
- Weather/climate is a styling signal, not a rigid rule — a single hot day should not force shorts, but a long-standing climate mismatch (e.g. no lightweight pieces in a consistently warm climate) is worth naming.
- You may reject a candidate ("keep": false) if it doesn't actually fit the user, if the wardrobe is already well covered, or if it conflicts with a stated shopping priority.
- Pay attention to the wardrobe statistics' duplicateClusters: if a candidate closely resembles something the user already owns several of, either reject it or say so plainly in "reason" (e.g. "You already own similar pieces — this would add little variety") rather than recommending it uncritically.
- You may reject ALL candidates. A well-balanced wardrobe should not be forced into a purchase. Say so plainly in "overallAdvice" (e.g. "Your wardrobe already covers this well — nothing urgent to buy.").
- For every candidate you keep, set "styleMatch" (0-100) grounded specifically in the user's preferredStyles, learned liked/disliked attributes, and usualClothing description — do not invent a number disconnected from that data.
- Never invent a candidate that wasn't given to you. Never invent specific products, prices, or brands.
- Keep "reason" concise (1-2 sentences), specific to this user, not generic shopping advice.

Respond with ONLY a JSON object:
{
  "selections": [{ "candidateId": string, "keep": boolean, "styleMatch": number, "reason": string }],
  "overallAdvice": string
}`;

export type GapReviewInput = {
  candidates: GapCandidate[];
  stats: WardrobeStats;
  styleProfile: StyleProfileData;
  learnedPreferences: LearnedPreferences;
  shoppingPreference: ShoppingPreferenceData;
  weatherContext: string | null;
};

export type GapReviewResult = {
  selections: { candidateId: string; keep: boolean; styleMatch: number; reason: string }[];
  overallAdvice: string;
};

export async function reviewGapCandidates(input: GapReviewInput): Promise<GapReviewResult> {
  const client = getGeminiClient();

  const userPrompt = `CANDIDATE GAPS IDENTIFIED BY CODE:
${JSON.stringify(input.candidates, null, 2)}

WARDROBE STATISTICS:
${JSON.stringify(input.stats, null, 2)}

USER STYLE PROFILE:
${JSON.stringify(input.styleProfile, null, 2)}

LEARNED PREFERENCES (from past outfit feedback):
${JSON.stringify(input.learnedPreferences, null, 2)}

SHOPPING PREFERENCES:
${JSON.stringify(input.shoppingPreference, null, 2)}

WHAT THE USER IS SHOPPING FOR RIGHT NOW: ${input.shoppingPreference.shoppingMode || "(not specified — assume general wardrobe improvement)"}

CURRENT CLIMATE/WEATHER CONTEXT:
${input.weatherContext ?? "(unavailable — do not assume a climate)"}

Respond with the JSON object only.`;

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: GAP_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: GAP_RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned no text content for gap review");

  return extractJson<GapReviewResult>(text);
}

const SHOULD_I_BUY_SYSTEM_PROMPT = `You are the Shopping Stylist for matchin', evaluating one specific item the user is considering buying (already analyzed by matchin's vision system into structured attributes). You are given deterministic wardrobe-fit numbers matchin's code already computed — use them as the basis for your verdict rather than inventing your own numbers.

Verdict must be one of: "Strong Buy", "Consider", "Skip".
- "Strong Buy": fills a real gap, pairs with several existing items, fits stated style and budget.
- "Consider": some upside but a real caveat (duplication, unclear style fit, budget stretch).
- "Skip": largely duplicates what they own, clashes with stated preferences/avoided colours, or adds little.

Ground every reason and concern in the actual data provided — the wardrobe stats, the deterministic scores, the user's style profile/learned preferences, and their current climate/weather context when given (a styling signal, not a rigid rule). Never fabricate product details. Be willing to recommend "Skip" — the goal is a better wardrobe, not more purchases.

Respond with ONLY a JSON object:
{
  "verdict": "Strong Buy" | "Consider" | "Skip",
  "reasons": string[],
  "concerns": string[]
}`;

export type ShouldIBuyInput = {
  candidateAnalysis: ClothingAnalysis;
  deterministicScores: {
    wardrobeCompatibility: number;
    outfitPotential: number;
    colorCompatibility: number;
    budgetFit: number | null;
    duplicateCount: number;
  };
  stats: WardrobeStats;
  styleProfile: StyleProfileData;
  learnedPreferences: LearnedPreferences;
  shoppingPreference: ShoppingPreferenceData;
  weatherContext: string | null;
};

export type ShouldIBuyResult = {
  verdict: "Strong Buy" | "Consider" | "Skip";
  reasons: string[];
  concerns: string[];
};

export async function evaluateShouldIBuy(input: ShouldIBuyInput): Promise<ShouldIBuyResult> {
  const client = getGeminiClient();

  const userPrompt = `ITEM BEING CONSIDERED (from matchin's clothing analysis):
${JSON.stringify(input.candidateAnalysis, null, 2)}

DETERMINISTIC WARDROBE-FIT SCORES (already computed by code):
${JSON.stringify(input.deterministicScores, null, 2)}

WARDROBE STATISTICS:
${JSON.stringify(input.stats, null, 2)}

USER STYLE PROFILE:
${JSON.stringify(input.styleProfile, null, 2)}

LEARNED PREFERENCES:
${JSON.stringify(input.learnedPreferences, null, 2)}

SHOPPING PREFERENCES:
${JSON.stringify(input.shoppingPreference, null, 2)}

CURRENT CLIMATE/WEATHER CONTEXT:
${input.weatherContext ?? "(unavailable — do not assume a climate)"}

Respond with the JSON object only.`;

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: SHOULD_I_BUY_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: SHOULD_I_BUY_RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned no text content for should-I-buy evaluation");

  return extractJson<ShouldIBuyResult>(text);
}
