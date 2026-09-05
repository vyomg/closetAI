import {
  getGeminiClient,
  GEMINI_MODEL,
  extractJson,
} from "@/lib/anthropic";
import type { StyleProfileData } from "@/lib/types";
import type { WardrobeItemForAI } from "@/lib/prompts/outfitGenerator";

const SYSTEM_PROMPT = `You are the Outfit Explainer for ClosetAI. Given an already-chosen outfit, explain in plain, natural language why it works. Keep it concise (4-6 short sentences or bullet-style clauses). Cover: why the colours work together, why the formality matches the occasion, why the pieces are stylistically compatible, how it fits the user's stated style, and what occasion(s) it suits. Do not suggest changes or alternatives — only explain the outfit as given. Respond with ONLY a JSON object: { "explanation": string }`;

export async function explainOutfit(params: {
  items: WardrobeItemForAI[];
  occasion: string;
  style: string;
  styleProfile: StyleProfileData;
}): Promise<string> {
  const client = getGeminiClient();

  const userPrompt = `OUTFIT ITEMS:
${JSON.stringify(params.items, null, 2)}

OCCASION: ${params.occasion}
STYLE: ${params.style}

USER STYLE PROFILE:
${JSON.stringify(params.styleProfile, null, 2)}`;

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
    throw new Error("Gemini returned no text content for outfit explanation");
  }

  const parsed = extractJson<{ explanation: string }>(text);
  return parsed.explanation;
}