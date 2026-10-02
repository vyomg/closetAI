import { Modality } from "@google/genai";
import { getGeminiClient, AIConfigError } from "@/lib/anthropic";

const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

const PROMPT = `You are shown one photo of a single clothing item, possibly on a person, a hanger, a bed, or a messy background.

Generate a new image showing ONLY that same clothing item, centered, laid flat or displayed as a clean product photo, on a plain soft off-white/neutral background — like a minimal e-commerce product photo. Preserve the garment's exact color, pattern, texture and shape. Do not invent a different garment. Do not add a person, mannequin, other clothing items, text, or logos that were not already part of the garment itself.

If you cannot confidently isolate the garment from this photo, respond with no image rather than guessing.`;

export type CleanedImage = { base64: string; mimeType: string };

// Best-effort only — the caller must keep the original upload either way.
// Returns null (never throws for expected failure modes) when the image
// model isn't available or declines to produce an image, so the clothing
// item still saves successfully with just its original photo.
export async function cleanClothingImage(base64Image: string, mimeType: string): Promise<CleanedImage | null> {
  let client;
  try {
    client = getGeminiClient();
  } catch (err) {
    if (err instanceof AIConfigError) return null;
    throw err;
  }

  try {
    const response = await client.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ inlineData: { mimeType, data: base64Image } }, { text: PROMPT }],
        },
      ],
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!imagePart?.inlineData?.data) return null;

    return {
      base64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || "image/png",
    };
  } catch (err) {
    console.error("Clothing image cleanup unavailable:", err instanceof Error ? err.message : err);
    return null;
  }
}
