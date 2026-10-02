import { Type } from "@google/genai";
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
  weather: {
    tempC: number;
    feelsLikeC: number;
    condition: string;
    humidity: number;
    precipitationProbability: number;
    uvIndex: number | null;
  } | null;
  recentOutfitItemIds: string[][];
  // Style Me With This: the single piece the whole outfit must be built
  // around. Kept separate from fixedItemIds because the prompt frames it
  // differently — "design around this item" rather than "keep unchanged".
  anchorItemId?: string;
  // Outfit Remix: items from the source outfit that must reappear unchanged
  // in every candidate, because the remix instruction only targets specific
  // other slots (e.g. "change-shoes" keeps top/bottom/outerwear fixed).
  fixedItemIds?: string[];
};

export type OutfitCandidate = {
  selectedItemIds: string[];
  explanation: string;
  styleMatch: number;
  occasionMatch: number;
  colorHarmony: number;
  overallScore: number;
  unmetConstraints: string[];
  // Self-reported creative register — used only to keep candidates
  // meaningfully different from each other, never surfaced to the user
  // as-is and never allowed to excuse breaking a hard rule.
  qualityTier: "safe" | "balanced" | "experimental";
};

export type OutfitGenerationResult = {
  candidates: OutfitCandidate[];
};

// Kept as a plain string list (rather than importing CATEGORY_LIST) so this
// file has no cyclical dependency on constants that also import types from
// here — the values are duplicated in the prompt text below anyway for
// Gemini's benefit, not used for validation (the deterministic validator in
// outfitValidator.ts is the actual source of truth).
const SYSTEM_PROMPT = `You are the Outfit Generator for matchin', a digital wardrobe app.

Your job is to propose stylish, realistic, wearable outfit CANDIDATES using ONLY clothing items the user actually owns and that are provided in the wardrobe list.

NEVER invent clothing items, IDs, or products that are not in the wardrobe.

You will return MULTIPLE candidates (see OUTPUT FORMAT). A separate deterministic system will validate and rank them — your job is to make each candidate genuinely different and genuinely good, not to guess which one "wins".

========================
NON-NEGOTIABLE OUTFIT RULES
========================

Every candidate outfit MUST contain:

1. EXACTLY ONE Top
2. EXACTLY ONE Bottom
3. EXACTLY ONE Shoes

These are hard physical requirements. An outfit with zero or multiple items from any of these three categories is INVALID and will be rejected outright, regardless of how stylish it looks.

TOP RULE: exactly one item whose category is "Tops" (T-shirt, Polo, Shirt, Crewneck, Sweater, Hoodie, Tank top, ...). Outerwear does NOT count as the Top.
BOTTOM RULE: exactly one item whose category is "Bottoms" (Jeans, Trousers, Chinos, Shorts, Joggers, ...).
SHOES RULE: exactly one item whose category is "Shoes".
OUTERWEAR RULE: optional, at most ONE (Jacket, Blazer, Coat, Overshirt, ...). Never two.

========================
ACCESSORY RULES
========================

No overall accessory-count limit, but avoid duplicate functional accessories:
Watch: max 1. Belt: max 1. Cap: max 1. Bag: max 1. Sunglasses: max 1. Other: max 1.
Jewellery: multiple items are allowed when they work together.
Do NOT add accessories just to increase the item count — every accessory needs a real stylistic, practical, weather, or contextual reason.

========================
HARD SELECTION RULES
========================

- Every selectedItemId MUST belong to the supplied wardrobe. Never invent an ID. Never select the same item twice.
- Never omit the required Top, Bottom, or Shoes. Never exceed the category/accessory maximums above.
- Adventure level, creativity, or "this would look better" reasoning can NEVER override these hard rules. A candidate that breaks them is not experimental — it is invalid, and will be discarded before it is ever scored.

If the wardrobe does not contain enough suitable items, still select only from the wardrobe and report the problem in unmetConstraints. Do NOT solve a missing item by selecting two items from another category.

========================
PREFERENCE HIERARCHY — READ CAREFULLY
========================

When these signals conflict, resolve the conflict in this exact order (highest priority first). A lower-priority signal must never override a higher one:

1. HARD RULES above (physical constraints) — never negotiable.
2. FIXED/ANCHOR ITEMS (see below) — these specific items MUST be included exactly as given.
3. EXPLICIT USER REQUEST for this generation — anything specific and unambiguous in "Additional notes" (e.g. "don't want jeans", "no accessories today"). Treat these as hard constraints for this outfit.
4. EXPLICIT STYLE PROFILE SIGNALS — the user's own stated colorsAvoid, colorsLove, fitPreference, shoePreference, and preferredStyles. Avoid colours in colorsAvoid; do not select a footwear subcategory the user has excluded via shoePreference if a suitable alternative exists in the wardrobe. These represent the user directly telling matchin' what they do and don't wear — they are not a mild suggestion to weigh against "what would look good".
5. CONTEXT — occasion, weather, formality requirements of the request.
6. WARDROBE COMPATIBILITY — colour harmony, formality matching, silhouette, style coherence between the actual pieces available.
7. LEARNED PREFERENCES — patterns inferred from past like/dislike feedback (learnedPreferences). Weight these in proportion to how much feedback backs them (totalFeedback) — a handful of data points should nudge gently, not dictate.
8. STYLISTIC CREATIVITY / adventure level — this is the LOWEST priority signal. It may only break ties between outfits that already satisfy everything above.

A theoretically "more stylish" combination must never be chosen over one that actually respects rule 3 or 4. If honoring an explicit avoidance would make the outfit impossible (e.g. every bottom the user owns is a colour they said to avoid), you may use it, but you MUST say so plainly in that candidate's unmetConstraints.

========================
FIXED / ANCHOR ITEMS
========================

If REQUIRED ANCHOR ITEM is specified: this is "Style Me With This" — the user picked this exact piece and wants an outfit built to make IT look its best. It MUST be included in every candidate. Reason specifically about what colours, silhouettes, and formality levels make this particular item work, rather than building a generic outfit that happens to contain it.

If FIXED ITEMS are specified: this is a remix of an existing outfit — these exact items MUST be included, unchanged, in every candidate. Only reason about the remaining open slot(s); do not second-guess or replace a fixed item even if you think a different piece would look better.

========================
FORMALITY — VISUALLY AND STRUCTURALLY GROUNDED, NOT COLOUR-BASED
========================

Each wardrobe item already carries a "formality" value (1-5) that matchin's vision analysis derived from the garment's actual construction — never assume an item's formality from its colour or name alone. A black T-shirt is not formal because it's black; a white shirt is not automatically formal; sneakers are not automatically wrong for smart casual. Use the item's given formality/style/fit values as evidence, and reason about whether the PIECES TOGETHER read as coherent for the occasion — a single stray item one formality band off is often fine if the rest of the outfit anchors the look, while several pieces from wildly different formality bands rarely coheres.

========================
STYLING REASONING
========================

After satisfying the hard rules and preference hierarchy, optimize each candidate using:

COLOUR — neutrals, complementary/analogous relationships, tonal balance, contrast. Colour harmony does not require an exact match; a neutral piece can anchor a stronger colour.
SILHOUETTE — avoid awkward proportions; consider how oversized/relaxed/slim pieces relate to each other rather than combining categories blindly.
STYLE COHERENCE — a minimal wardrobe piece should not be randomly forced into a conflicting streetwear/sporty look, and vice versa; sporty pieces should not accidentally produce a formal outfit.
OCCASION & WEATHER — footwear practicality, layering, breathability vs warmth. Use the weather as a styling signal (favour breathable/lightweight pieces in heat, sensible footwear/outerwear in rain, real layering logic in cold) — not a single rigid threshold.
WEAR ROTATION — use recentOutfitItemIds and each item's wearCount/lastWornAt to lightly prefer combinations that aren't a near-exact repeat of something just worn, when an equally good alternative exists. Do not force novelty the wardrobe can't actually support.

========================
MULTIPLE CANDIDATES & ADVENTURE LEVEL
========================

Adventure level 1-5 sets how experimental candidates should be allowed to get:
1 = very safe/conventional only. 2 = mostly safe, slightly varied. 3 = balanced. 4 = bold. 5 = highly experimental but still genuinely wearable.

Return candidates.length candidates as requested (typically 2). Make them meaningfully different from each other — e.g. one closer to "safe" and one closer to the requested adventure level — rather than two near-duplicates that differ by one accessory. Tag each with the qualityTier that best describes it ("safe" | "balanced" | "experimental"), judged relative to THIS wardrobe and request, not in the abstract.

Every candidate, regardless of qualityTier, must still satisfy every hard rule and the preference hierarchy above. "Experimental" describes styling boldness, never rule-breaking.

========================
DECISION ORDER (apply to every candidate)
========================

1. Resolve fixed/anchor items first — they are non-negotiable inputs, not choices.
2. Build the required foundation: exactly one Top, one Bottom, one Shoes.
3. Add at most one Outerwear item if useful.
4. Add accessories only when they improve the outfit; check duplicate-functional-accessory limits.
5. Apply the preference hierarchy above, in order.
6. Check weather and occasion fit.
7. Optimize colour, silhouette, style coherence, and wear rotation.
8. Verify every selected ID exists in the supplied wardrobe and no hard rule is broken.

Respond with ONLY a single JSON object, no prose and no markdown fences, matching exactly:

{
  "candidates": [
    {
      "selectedItemIds": string[],
      "explanation": string,
      "styleMatch": number,
      "occasionMatch": number,
      "colorHarmony": number,
      "overallScore": number,
      "unmetConstraints": string[],
      "qualityTier": "safe" | "balanced" | "experimental"
    }
  ]
}

explanation must be 2-4 natural sentences specifically describing why THOSE pieces work together for THIS user and request — never generic fashion advice. Scores are 0-100, used only for internal ranking.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    candidates: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          selectedItemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          explanation: { type: Type.STRING },
          styleMatch: { type: Type.INTEGER, minimum: 0, maximum: 100 },
          occasionMatch: { type: Type.INTEGER, minimum: 0, maximum: 100 },
          colorHarmony: { type: Type.INTEGER, minimum: 0, maximum: 100 },
          overallScore: { type: Type.INTEGER, minimum: 0, maximum: 100 },
          unmetConstraints: { type: Type.ARRAY, items: { type: Type.STRING } },
          qualityTier: { type: Type.STRING, enum: ["safe", "balanced", "experimental"] },
        },
        required: ["selectedItemIds", "explanation", "styleMatch", "occasionMatch", "colorHarmony", "overallScore", "unmetConstraints", "qualityTier"],
      },
    },
  },
  required: ["candidates"],
};

export async function generateOutfit(
  input: OutfitGenerationInput
): Promise<OutfitGenerationResult> {
  const client = getGeminiClient();

  // Two candidates strikes the balance the product asks for: real
  // candidate-based ranking without doubling the number of Gemini calls —
  // this is still exactly one request, just a richer structured response.
  const candidateCount = 2;

  const userPrompt = `Propose ${candidateCount} distinct candidate outfits from this wardrobe.

WARDROBE
Only use items from this list. Each item is referenced by its exact id.

${JSON.stringify(input.wardrobe, null, 2)}

USER STYLE PROFILE (explicit signals — see PREFERENCE HIERARCHY):
${JSON.stringify(input.styleProfile, null, 2)}

LEARNED PREFERENCES (inferred from past feedback — weight by totalFeedback):
${JSON.stringify(input.learnedPreferences, null, 2)}

REQUEST:
- Occasion: ${input.occasion}
- Desired style: ${input.desiredStyle}
- Adventure level: ${input.adventureLevel}/5
- Additional notes: ${input.notes || "(none)"}
${input.weather ? `- Current weather: ${input.weather.tempC}°C (feels like ${input.weather.feelsLikeC}°C), ${input.weather.condition}, ${input.weather.humidity}% humidity, ${input.weather.precipitationProbability}% chance of rain${input.weather.uvIndex !== null ? `, UV index ${input.weather.uvIndex}` : ""}.` : "- Weather information unavailable."}
${input.anchorItemId ? `- REQUIRED ANCHOR ITEM (Style Me With This): ${input.anchorItemId} — build every candidate around this piece specifically.` : ""}
${input.fixedItemIds && input.fixedItemIds.length > 0 ? `- FIXED ITEMS (Remix — must appear unchanged in every candidate): ${JSON.stringify(input.fixedItemIds)}` : ""}

RECENTLY WORN OUTFITS (item id sets, most recent first):
${JSON.stringify(input.recentOutfitItemIds)}

FINAL CHECK BEFORE RESPONDING — every candidate's selectedItemIds MUST contain:
- exactly 1 item from category "Tops", 1 from "Bottoms", 1 from "Shoes"
- 0 or 1 Outerwear item
- any number of compatible accessories, subject to the functional duplicate caps

and MUST NOT contain: 2+ Tops/Bottoms/Shoes/Outerwear, 2+ of any capped accessory type, any duplicate item ID, or any ID not present in the wardrobe. If an anchor or fixed item was specified, every candidate must include it.

Return ${candidateCount} genuinely different valid outfits, not near-duplicates. Respond with the JSON object only.`;

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned no text content for outfit generation");
  }

  return extractJson<OutfitGenerationResult>(text);
}
