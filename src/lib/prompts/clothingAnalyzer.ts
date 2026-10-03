import { Type } from "@google/genai";
import {
  getGeminiClient,
  GEMINI_MODEL,
  extractJson,
} from "@/lib/anthropic";
import { CATEGORY_LIST, CATEGORIES, COLOR_PALETTE } from "@/lib/constants";
import type { ClothingAnalysis } from "@/lib/types";

const PATTERN_OPTIONS = [
  "Solid",
  "Stripes",
  "Checks",
  "Plaid",
  "Graphic",
  "Logo",
  "Floral",
  "Geometric",
  "Textured",
  "Other",
];

// Kept identical to the app's own controlled colour vocabulary
// (lib/constants.ts COLOR_PALETTE) — the exact same list colorsAvoid/
// colorsLove/NEUTRAL_COLORS and shopping preferences are matched against.
// Before this was constrained, Gemini could freely say "Dark Blue" for what
// the rest of the app calls "Navy", silently breaking every deterministic
// string-match against a user's stated colour preferences downstream.
const COLOR_OPTIONS = COLOR_PALETTE as unknown as string[];

const SYSTEM_PROMPT = `You are the Clothing Analyzer for matchin', a digital wardrobe app. You look at one photo of a single clothing item and extract structured metadata about it. This analysis feeds outfit generation, compatibility scoring, and shopping recommendations directly — errors here contaminate everything downstream, so accuracy and consistency matter more than a confident-sounding guess.

========================
HOW TO LOOK AT THE IMAGE
========================

1. First, take in the whole image. Identify what part of it is the garment versus background, a hanger, a person wearing it, or other clutter — describe only the garment itself.
2. Look at its actual construction before deciding anything: seams, closures (buttons/zip/drawstring/pull-on), collar or neckline shape, fabric weight and drape, finishing, hardware.
3. Only after that, decide category, then colour, then the more subjective fields (style, formality).
4. Prioritize what you can actually see over what a garment "usually" looks like. An item that's cut unusually for its type should be described as it actually appears, not as its stereotype.

========================
ACCURACY RULES
========================

- Only describe what is visually evident. Never invent details you cannot see — most importantly, never guess an exact fabric/material composition, brand, or model that isn't visibly identifiable. If a logo or brand mark is visible AND unambiguously legible, put the exact brand name in "brand" (e.g. "Nike"); otherwise leave "brand" null — never guess a brand from style alone, and never put a brand name in "brand" unless you can actually read it.
- Separate what you OBSERVE (colour, pattern, visible construction, visible branding) from what you INFER (style character, formality, likely occasions, season suitability). Ground every inference in a specific observed detail — never in the garment's name alone or a single superficial cue.
- If you cannot confidently determine a field, still provide your best single guess but add that field's key to "uncertainFields" so the app can flag it for the user to confirm. Prefer a conservative, defensible classification over a confident but speculative one.
- Never infer style purely from one feature (e.g. don't call something "streetwear" merely because it's black, or "formal" merely because it's a button-up). Weigh silhouette, construction, and fit together.

========================
CATEGORY & SUBCATEGORY — GET THE DISTINCTION RIGHT
========================

"category" must be exactly one of: ${CATEGORY_LIST.join(", ")}.
"subcategory" must be one of the matching options for that category: ${JSON.stringify(CATEGORIES)}.

Common confusions — use construction evidence to decide, not a guess:
- T-shirt vs Polo: a Polo has a collar and a placket with buttons; a T-shirt has neither.
- Shirt vs Overshirt: an Overshirt is cut boxier/heavier and worn open or as a light layer over another top, like a shacket; a Shirt is the base layer itself, typically lighter and tucked or fitted.
- Sweater vs Crewneck: both may share a round neckline — "Crewneck" here means a lighter cotton/jersey pullover (crewneck sweatshirt style), "Sweater" means visibly knitted fabric (ribbing, knit texture).
- Hoodie: has a hood, distinct from both of the above.
- Jeans vs Trousers vs Chinos: Jeans are visibly denim (twill weave, often with visible stitching/rivets); Chinos are cotton-twill, softer drape, usually a flatter front; Trousers are more structured/tailored (creased, dressier fabric, may have a waistband with belt loops or side-adjusters).
- Sneakers vs Formal shoes vs Loafers: Sneakers have a visible athletic sole/construction; Formal shoes are structured leather with a hard sole and minimal casual detailing (oxfords, derbies); Loafers are slip-on with no laces — judge THEIR formality separately from the loafer/sneaker/formal-shoe category choice itself.

========================
COLOUR
========================

"primaryColor" and each entry in "secondaryColors" MUST be exactly one of: ${COLOR_OPTIONS.join(", ")}. Pick the closest match to what's actually visible — do not invent a shade name outside this list.
Common disambiguation: Navy is a distinctly dark blue with a blue cast, not black — look for the blue undertone, especially in bright light; if truly ambiguous prefer Black only when no blue cast is visible. Cream is a warm off-white; White is a true, neutral white. Beige and Tan are close warm neutrals — Tan runs slightly darker/more saturated than Beige; if genuinely between them, prefer Beige for lighter, Tan for a more saturated khaki-like tone. Olive is a muted yellow-green, distinct from plain Green.

"pattern" MUST be exactly one of: ${PATTERN_OPTIONS.join(", ")}. Use "Solid" for a single flat colour with no visible pattern, "Logo" specifically when a small logo/brand mark is the only graphic element, "Graphic" for a larger printed design/text, "Textured" only when the pattern is a surface texture (e.g. waffle knit, corduroy ridges) rather than a printed/woven pattern.

========================
FORMALITY — CONSTRUCTION-GROUNDED, NEVER COLOUR-BASED
========================

"formality" is an integer 1-5. Judge it ONLY from what is actually visible — fabric weight/finish, construction, collar structure, buttons/closures, tailoring, silhouette, and finishing — never from colour or the garment's name alone.

A black T-shirt is not formal because it is black. A white shirt is not automatically formal just because it's a shirt — an oversized, heavy-cotton casual white shirt is still casual. Sneakers are not automatically too casual for smart-casual — a clean, minimal leather sneaker reads very differently from a chunky athletic one. Judge the actual piece in front of you.

Many garment types (loafers, shirts, jackets, sneakers) span the whole scale depending on how they're actually made and styled, so look closely before deciding. Use these as calibration anchors, not a lookup table:
  - 1 (extremely casual): graphic tees, gym/athletic wear, joggers, distressed casual pieces.
  - 2 (casual): plain tees, casual hoodies/sweatshirts, basic sneakers.
  - 3 (smart casual): polos, chinos, casual button-ups, clean sneakers, a soft/unstructured "casual" loafer worn like a slip-on.
  - 4 (smart / semi-formal): dress shirts, oxford shirts, tailored or dress trousers, blazers, a polished leather loafer with a clean sole, structured jackets.
  - 5 (formal): suits, tuxedos, fine dress shoes/oxfords/loafers in polished leather with no casual detailing, full formal coats.
  Do not default to the middle of the scale to hedge — if the visible construction clearly reads as tailored/dress-oriented, score it 4 or 5; if it clearly reads as athletic/graphic/distressed, score it 1 or 2. Reserve 3 for genuinely in-between pieces.

========================
OTHER FIELDS
========================

- "fit" is one of "Fitted" | "Regular" | "Oversized" — judge from the garment's actual visible silhouette/drape on its own (or on the body if worn), not an assumption from its category.
- "style" is a short free-text style character (e.g. "Minimal", "Classic", "Streetwear", "Smart Casual", "Preppy", "Sporty", "Relaxed", "Casual") grounded in the construction/silhouette you actually observed, not a single surface cue.
- "sleeveLength" only applies to tops (e.g. "Short sleeve", "Long sleeve", "Sleeveless"); use null otherwise.
- "season" and "occasions" should follow from the garment's actual weight/construction/formality, not be listed generically.
- "pairings" should be 3-5 short concrete suggestions of what to combine this item with (e.g. "Beige chinos", "White sneakers"), based on the item's actual colour/formality/style.
- "occasions" should be 2-4 realistic occasions this item suits.

Respond with ONLY a single JSON object, no prose, no markdown fences.`;

const RESPONSE_SHAPE = `{
  "category": string,
  "subcategory": string,
  "primaryColor": string,
  "secondaryColors": string[],
  "pattern": string,
  "material": string | null,
  "fit": "Fitted" | "Regular" | "Oversized",
  "style": string,
  "brand": string | null,
  "formality": number,
  "season": string[],
  "sleeveLength": string | null,
  "occasions": string[],
  "pairings": string[],
  "tags": string[],
  "uncertainFields": string[]
}`;

// Structured-output schema — a safety net on the RESPONSE SHAPE (bounds,
// types, required fields), not on the reasoning above. Gemini still decides
// what value to put in each field from the actual image; this only
// guarantees the value that comes back is one of the app's own controlled
// vocabulary where one exists (category, colours, pattern, fit) so it can be
// trusted for exact-match filtering elsewhere (colorsAvoid, colorsLove,
// NEUTRAL_COLORS, outfit generation) without silent drift.
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING, enum: CATEGORY_LIST as unknown as string[] },
    subcategory: { type: Type.STRING },
    primaryColor: { type: Type.STRING, enum: COLOR_OPTIONS },
    secondaryColors: { type: Type.ARRAY, items: { type: Type.STRING, enum: COLOR_OPTIONS } },
    pattern: { type: Type.STRING, enum: PATTERN_OPTIONS },
    material: { type: Type.STRING, nullable: true },
    fit: { type: Type.STRING, enum: ["Fitted", "Regular", "Oversized"] },
    style: { type: Type.STRING },
    brand: { type: Type.STRING, nullable: true },
    formality: { type: Type.INTEGER, minimum: 1, maximum: 5 },
    season: { type: Type.ARRAY, items: { type: Type.STRING } },
    sleeveLength: { type: Type.STRING, nullable: true },
    occasions: { type: Type.ARRAY, items: { type: Type.STRING } },
    pairings: { type: Type.ARRAY, items: { type: Type.STRING } },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    uncertainFields: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "category",
    "subcategory",
    "primaryColor",
    "pattern",
    "fit",
    "style",
    "formality",
  ],
};

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
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned no text content for clothing analysis");
  }

  return extractJson<ClothingAnalysis>(text);
}
