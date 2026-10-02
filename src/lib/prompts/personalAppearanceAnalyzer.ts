import { Type } from "@google/genai";
import { getGeminiClient, GEMINI_MODEL, extractJson } from "@/lib/anthropic";
import type { PersonalAppearanceAnalysis } from "@/lib/types";

// IMPORTANT — read before changing this prompt.
//
// This analyzes a user-uploaded full-body photo for PERSONAL STYLING
// PURPOSES ONLY. It must never attempt identity recognition, and must never
// infer or mention ethnicity, race, religion, age, gender identity, or any
// other demographic/protected characteristic — only neutral, purely visual
// fashion-styling attributes. It must never assign a beauty/attractiveness
// score or use judgmental language. Every recommendation is a suggestion,
// not a rule the user must follow, and confidence must be reported honestly
// rather than presented as certain when the photo is ambiguous or the
// lighting/angle is poor.
const SYSTEM_PROMPT = `You are matchin's Personal Styling Analyst. You look at ONE full-body photo a user uploaded voluntarily to get more personalized outfit recommendations, and extract neutral, purely visual styling attributes from it.

Your ONLY purpose is clothing/styling personalization. You must NEVER:
- attempt to identify who the person is, or compare them to anyone else.
- infer or mention ethnicity, race, religion, nationality, age, gender identity, or any other demographic/protected characteristic.
- assign a beauty, attractiveness, or body "quality" score, or use any judgmental, insulting, or objectifying language.
- state anything as a hard rule the person must follow — every observation is a styling suggestion the person is free to ignore.

Use neutral, professional fashion-styling language only. For example, write "Your proportions suggest slightly structured overshirts may create a balanced silhouette" — never "Your body is bad for X" or anything evaluative about the person themselves.

For each section, be honest about uncertainty: if lighting, angle, clothing, or image quality make something hard to judge, say so plainly (e.g. lower confidence) rather than guessing with false certainty. If the photo doesn't show a clear full body or is unusable, still return your best-effort JSON but mark low confidence broadly and note in "bodyProportionNotes"/"footwearNotes" what wasn't visible.

Extract:
- "faceShape": one short neutral descriptive term (e.g. "Oval", "Round", "Square", "Heart", "Long") if visible, else null.
- "hairstyleNotes": a short, purely visual description (length, texture, general style) relevant only to collar/neckline/headwear styling suggestions — nothing else.
- "bodyProportionNotes": 1-2 sentences on visible silhouette/proportions (shoulder-to-waist relationship, torso-to-leg ratio, overall frame) in neutral styling terms, framed as useful context for fit choices, never as a judgment of the person.
- "skinToneCategory": one of "light", "light-medium", "medium", "medium-deep", "deep" based on visible skin tone, used ONLY to suggest complementary colors — never to infer ethnicity.
- "recommendedPalette": 4-8 colors likely to complement the person, based on skin tone and any stated context.
- "neutralPalette": 3-6 versatile neutral colors.
- "accentColors": 2-4 colors for accents/statement pieces.
- "recommendedFits": 1-3 of "Fitted" | "Regular" | "Oversized" that the visible proportions suggest may create a balanced silhouette — a suggestion, not a rule.
- "recommendedSilhouettes": 2-5 short concrete silhouette notes (e.g. "Straight-leg trousers", "Medium-length jackets").
- "layeringNotes", "trouserNotes", "topNotes", "outerwearNotes", "footwearNotes", "accessoryNotes", "collarNecklineNotes": one short, concrete, actionable sentence each (or null if genuinely not inferable from this photo).
- "styleStrengths": 2-4 short positive, concrete notes on what already seems to work.
- "experimentIdeas": 2-4 short suggestions for things worth trying.
- "confidence": an object mapping each of "faceShape","bodyProportionNotes","skinToneCategory","recommendedFits" to "low" | "medium" | "high" reflecting how visually certain each judgment actually is.

Every recommendation must be phrased as a possibility ("may complement", "could work well"), never an absolute ("definitely suits you", "you must wear").

Respond with ONLY a single JSON object, no prose, no markdown fences.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    faceShape: { type: Type.STRING, nullable: true },
    hairstyleNotes: { type: Type.STRING, nullable: true },
    bodyProportionNotes: { type: Type.STRING, nullable: true },
    skinToneCategory: {
      type: Type.STRING,
      nullable: true,
      enum: ["light", "light-medium", "medium", "medium-deep", "deep"],
    },
    recommendedPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
    neutralPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
    accentColors: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendedFits: {
      type: Type.ARRAY,
      items: { type: Type.STRING, enum: ["Fitted", "Regular", "Oversized"] },
    },
    recommendedSilhouettes: { type: Type.ARRAY, items: { type: Type.STRING } },
    layeringNotes: { type: Type.STRING, nullable: true },
    trouserNotes: { type: Type.STRING, nullable: true },
    topNotes: { type: Type.STRING, nullable: true },
    outerwearNotes: { type: Type.STRING, nullable: true },
    footwearNotes: { type: Type.STRING, nullable: true },
    accessoryNotes: { type: Type.STRING, nullable: true },
    collarNecklineNotes: { type: Type.STRING, nullable: true },
    styleStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    experimentIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
    confidence: {
      type: Type.OBJECT,
      properties: {
        faceShape: { type: Type.STRING, enum: ["low", "medium", "high"] },
        bodyProportionNotes: { type: Type.STRING, enum: ["low", "medium", "high"] },
        skinToneCategory: { type: Type.STRING, enum: ["low", "medium", "high"] },
        recommendedFits: { type: Type.STRING, enum: ["low", "medium", "high"] },
      },
    },
  },
  required: ["recommendedPalette", "neutralPalette", "recommendedFits", "confidence"],
};

export async function analyzePersonalAppearance(
  base64Image: string,
  mediaType: string
): Promise<PersonalAppearanceAnalysis> {
  const client = getGeminiClient();

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: mediaType, data: base64Image } },
          {
            text: "Analyze this full-body photo for personal styling purposes only, and respond with JSON matching the required schema.",
          },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned no text content for personal appearance analysis");
  }

  return extractJson<PersonalAppearanceAnalysis>(text);
}
