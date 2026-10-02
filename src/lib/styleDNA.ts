// Style DNA — a single derived view combining everything matchin' already
// knows about how a user dresses. This is intentionally NOT a new
// source-of-truth table: it's a pure function over data that already lives
// on User (explicit preferences), User.learnedPreferences (feedback-derived
// attribute weights, updated by lib/prompts/styleLearner.ts), the optional
// PersonalAppearanceProfile (photo-derived suggestions), and wardrobe
// formality distribution. Explicit user choices always take priority over
// AI-inferred signals — the appearance profile only fills in where the user
// hasn't stated a preference.

import type { StyleProfileData, LearnedPreferences } from "@/lib/types";
import type { WardrobeStats } from "@/lib/wardrobeAnalysis";
import { formalityBand } from "@/lib/wardrobeAnalysis";
import type { PersonalAppearanceProfile } from "@prisma/client";
import { parseList } from "@/lib/json";

export type StyleDNA = {
  // 0 = fully casual, 100 = fully formal.
  formalityAxis: number;
  // 0 = minimal, 100 = expressive (pattern/color variety).
  expressivenessAxis: number;
  // 0 = sporty, 100 = tailored.
  tailoredAxis: number;
  preferredColors: string[];
  avoidedColors: string[];
  fitPreference: string;
  recommendedSilhouettes: string[];
  footwearPreference: string[];
  styleTags: string[];
  hasAppearanceProfile: boolean;
  summary: string;
};

function weightedAttributeScore(
  learned: LearnedPreferences,
  prefix: string,
  bandOrder: string[]
): number {
  // Maps liked/disliked attribute weights for a prefix (e.g. "formality:")
  // onto a 0-100 axis using bandOrder's position as the axis value.
  let weightedSum = 0;
  let totalWeight = 0;
  for (const [key, weight] of Object.entries(learned.likedAttributes)) {
    if (!key.startsWith(prefix)) continue;
    const band = key.slice(prefix.length);
    const idx = bandOrder.indexOf(band);
    if (idx === -1) continue;
    const value = (idx / Math.max(1, bandOrder.length - 1)) * 100;
    weightedSum += value * weight;
    totalWeight += weight;
  }
  for (const [key, weight] of Object.entries(learned.dislikedAttributes)) {
    if (!key.startsWith(prefix)) continue;
    const band = key.slice(prefix.length);
    const idx = bandOrder.indexOf(band);
    if (idx === -1) continue;
    // A dislike pulls the axis away from that band.
    const value = (idx / Math.max(1, bandOrder.length - 1)) * 100;
    weightedSum += (100 - value) * weight * 0.5;
    totalWeight += weight * 0.5;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 50;
}

export function computeStyleDNA(
  styleProfile: StyleProfileData,
  learnedPreferences: LearnedPreferences,
  wardrobeStats: WardrobeStats | null,
  appearanceProfile: PersonalAppearanceProfile | null
): StyleDNA {
  // Formality axis: explicit formalImportance (1-5) is the base signal,
  // nudged by learned feedback and the wardrobe's actual formality mix.
  const explicitFormality = ((styleProfile.formalImportance - 1) / 4) * 100;
  const learnedFormality = weightedAttributeScore(learnedPreferences, "formality:", ["casual", "smart-casual", "formal"]);
  const wardrobeFormality = wardrobeStats
    ? (wardrobeStats.byFormalityBand.formal * 100 + wardrobeStats.byFormalityBand["smart-casual"] * 55) /
      Math.max(1, wardrobeStats.totalItems)
    : 50;
  const formalityAxis = Math.round(explicitFormality * 0.5 + learnedFormality * 0.3 + wardrobeFormality * 0.2);

  // Expressiveness: driven by adventurousness + how many distinct colors/styles are loved.
  const explicitAdventure = ((styleProfile.adventurousness - 1) / 4) * 100;
  const colorVariety = Math.min(100, styleProfile.colorsLove.length * 12);
  const expressivenessAxis = Math.round(explicitAdventure * 0.7 + colorVariety * 0.3);

  // Tailored vs sporty: derived from fit preference + preferred styles.
  const sportyStyles = new Set(["Streetwear", "Sporty", "Relaxed", "Trendy"]);
  const tailoredStyles = new Set(["Classic", "Formal", "Smart Casual", "Preppy"]);
  let tailoredScore = 50;
  const sportyCount = styleProfile.preferredStyles.filter((s) => sportyStyles.has(s)).length;
  const tailoredCount = styleProfile.preferredStyles.filter((s) => tailoredStyles.has(s)).length;
  if (sportyCount + tailoredCount > 0) {
    tailoredScore = Math.round((tailoredCount / (sportyCount + tailoredCount)) * 100);
  }
  if (styleProfile.fitPreference === "Fitted") tailoredScore = Math.min(100, tailoredScore + 10);
  if (styleProfile.fitPreference === "Oversized") tailoredScore = Math.max(0, tailoredScore - 10);

  // Explicit preferences always win; the appearance profile's palette only
  // fills gaps the user hasn't already stated an opinion on.
  const appearancePalette = appearanceProfile ? parseList(appearanceProfile.recommendedPalette) : [];
  const preferredColors =
    styleProfile.colorsLove.length > 0
      ? styleProfile.colorsLove
      : appearancePalette.filter((c) => !styleProfile.colorsAvoid.includes(c));

  const recommendedSilhouettes = appearanceProfile ? parseList(appearanceProfile.recommendedSilhouettes) : [];

  const styleTags = [...styleProfile.preferredStyles];

  const summaryParts: string[] = [];
  summaryParts.push(
    formalityAxis >= 65 ? "leans polished/formal" : formalityAxis <= 35 ? "leans casual" : "balances casual and smart-casual"
  );
  if (styleProfile.preferredStyles.length > 0) {
    summaryParts.push(`favors ${styleProfile.preferredStyles.slice(0, 2).join(" and ").toLowerCase()} style`);
  }
  if (preferredColors.length > 0) {
    summaryParts.push(`gravitates to ${preferredColors.slice(0, 3).join(", ").toLowerCase()}`);
  }

  return {
    formalityAxis: Math.max(0, Math.min(100, formalityAxis)),
    expressivenessAxis: Math.max(0, Math.min(100, expressivenessAxis)),
    tailoredAxis: Math.max(0, Math.min(100, tailoredScore)),
    preferredColors,
    avoidedColors: styleProfile.colorsAvoid,
    fitPreference: styleProfile.fitPreference,
    recommendedSilhouettes,
    footwearPreference: styleProfile.shoePreference,
    styleTags,
    hasAppearanceProfile: appearanceProfile?.status === "COMPLETE",
    summary: summaryParts.length > 0 ? `Style DNA: ${summaryParts.join(", ")}.` : "Style DNA still forming — set a few preferences to get started.",
  };
}

export { formalityBand };
