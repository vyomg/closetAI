import {
  getGeminiClient,
  GEMINI_MODEL,
  extractJson,
} from "@/lib/anthropic";
import type { WardrobeItemForAI } from "@/lib/prompts/outfitGenerator";
import type { StyleProfileData } from "@/lib/types";

export type PackingRequest = {
  wardrobe: WardrobeItemForAI[];
  destination: string;
  days: number;
  weatherNotes: string;
  occasions: string[];
  styleProfile: StyleProfileData;
};

export type PackingResult = {
  items: { itemId: string; reason: string }[];
  outfitCombinations: { itemIds: string[]; occasion: string }[];
  summary: string;
};

const SYSTEM_PROMPT = `You are the Packing Assistant for ClosetAI. Build a minimal, versatile travel wardrobe using ONLY items from the user's actual wardrobe list provided to you. Never invent items.

Principles:
- Favor pieces that can be mixed into multiple outfits (versatility over novelty).
- Match the trip length, destination climate/season, and stated occasions.
- Don't over-pack: a good rule of thumb is roughly (days / 2) to (days / 1.5) tops, fewer bottoms than tops (bottoms are reused across outfits), 2-3 pairs of shoes max, and a light accessory selection.
- Include at least one outfit combination per distinct occasion mentioned.
- If the wardrobe can't fully cover a stated occasion (e.g. no formal wear for a "formal dinner"), still do your best and mention the gap in "summary".

Respond with ONLY a JSON object:
{
  "items": [{ "itemId": string, "reason": string }],
  "outfitCombinations": [{ "itemIds": string[], "occasion": string }],
  "summary": string (2-3 sentences)
}`;

export async function generatePackingList(
  input: PackingRequest
): Promise<PackingResult> {
  const client = getGeminiClient();

  const userPrompt = `WARDROBE:
${JSON.stringify(input.wardrobe, null, 2)}

TRIP:
- Destination: ${input.destination}
- Days: ${input.days}
- Weather/season notes: ${input.weatherNotes}
- Occasions: ${input.occasions.join(", ")}

USER STYLE PROFILE:
${JSON.stringify(input.styleProfile, null, 2)}

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
    throw new Error("Gemini returned no text content for packing list");
  }

  return extractJson<PackingResult>(text);
}