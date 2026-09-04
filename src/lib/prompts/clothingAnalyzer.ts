import { getAnthropicClient, CLAUDE_MODEL, extractJson } from "@/lib/anthropic";
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
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as "image/jpeg" | "image/png" | "image/webp",
              data: base64Image,
            },
          },
          {
            type: "text",
            text: `Analyze this clothing item and respond with JSON matching exactly this shape:\n${RESPONSE_SHAPE}`,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content for clothing analysis");
  }

  return extractJson<ClothingAnalysis>(textBlock.text);
}
