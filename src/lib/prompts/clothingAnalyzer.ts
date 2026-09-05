import {
  getGeminiClient,
  GEMINI_MODEL,
  extractJson,
} from "@/lib/anthropic";
import { CATEGORY_LIST, CATEGORIES } from "@/lib/constants";
import type { ClothingAnalysis } from "@/lib/types";

const SYSTEM_PROMPT = `You are the Clothing Analyzer for ClosetAI, a digital wardrobe app. You look at one photo of a single clothing item and extract structured metadata about it.

Rules:
- Only describe what is visually evident in the image. Never invent details you cannot see (e.g. material from a photo where fabric texture isn't visible).
- If you cannot confidently determine a field, still provide your best guess but add that field's key to "uncertainFields" so the app can flag it for the user to confirm.
- "category" must be exactly one of: ${CATEGORY_LIST.join(", ")}.
- "subcategory" must be one of the matching options for that category: ${JSON.stringify(CATEGORIES)}.
- "formality" is an integer 1-5 (1 = extremely casual, 5 = black tie formal).
- "sleeveLength" only applies to tops (e.g. "Short sleeve", "Long sleeve", "Sleeveless"); use null otherwise.
- "pairings" should be 3-5 short concrete suggestions of what to combine this item with (e.g. "Beige chinos", "White sneakers"), based on the item's colour/formality/style.
- "occasions" should be 2-4 realistic occasions this item suits.
- Respond with ONLY a single JSON object, no prose, no markdown fences.`;

const RESPONSE_SHAPE = `{
  "category": string,
  "subcategory": string,
  "primaryColor": string,
  "secondaryColors": string[],
  "pattern": string,
  "material": string | null,
  "fit": "Fitted" | "Regular" | "Oversized",
  "style": string,
  "formality": number,
  "season": string[],
  "sleeveLength": string | null,
  "occasions": string[],
  "pairings": string[],
  "tags": string[],
  "uncertainFields": string[]
}`;

export async function analyzeClothingImage(
  base64Image: string,
  mediaType: string
): Promise<ClothingAnalysis> {
  const client = getGeminiClient();

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mediaType,
              data: base64Image,
            },
          },
          {
            text: `Analyze this clothing item and respond with JSON matching exactly this shape:\n${RESPONSE_SHAPE}`,
          },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned no text content for clothing analysis");
  }

  return extractJson<ClothingAnalysis>(text);
}