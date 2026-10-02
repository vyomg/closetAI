// Deterministic re-ranking applied AFTER Gemini proposes candidates and
// AFTER the protected validator (outfitValidator.ts) has already thrown out
// anything that breaks a hard rule. This is where explicit user preferences
// get real enforcement teeth, rather than being only advisory prompt text —
// see PREFERENCE HIERARCHY in prompts/outfitGenerator.ts for the priority
// order this mirrors. Nothing here can ever accept an invalid outfit; it
// only decides which VALID candidate is actually the best one to keep.
import type { ClothingItem } from "@prisma/client";
import type { StyleProfileData } from "@/lib/types";

export type ScoreAdjustment = {
  adjustedScore: number;
  notes: string[];
};

const REPEAT_PENALTY = 30;
const AVOIDED_COLOR_PENALTY = 20;
const WEAR_ROTATION_MAX_PENALTY = 8;

export function adjustCandidateScore(
  baseOverallScore: number,
  items: ClothingItem[],
  styleProfile: Pick<StyleProfileData, "colorsAvoid">,
  recentOutfitItemIds: string[][]
): ScoreAdjustment {
  let score = baseOverallScore;
  const notes: string[] = [];

  // Explicit preference enforcement: colorsAvoid is the user directly
  // telling matchin' what they don't wear. Gemini is instructed to
  // respect it, but this is untrusted AI output — verify it deterministically
  // rather than trusting the prompt alone.
  const avoided = new Set(styleProfile.colorsAvoid);
  const avoidedItems = items.filter((i) => avoided.has(i.primaryColor));
  if (avoidedItems.length > 0) {
    score -= AVOIDED_COLOR_PENALTY * avoidedItems.length;
    notes.push(
      `Includes a colour you said you'd rather avoid (${[...new Set(avoidedItems.map((i) => i.primaryColor))].join(", ")}).`
    );
  }

  // Exact-repeat detection: penalize (don't reject — the wardrobe may
  // genuinely have no better option) an outfit that is identical, item for
  // item, to something recently generated.
  const idSet = new Set(items.map((i) => i.id));
  const isExactRepeat = recentOutfitItemIds.some(
    (recent) => recent.length === idSet.size && recent.every((id) => idSet.has(id))
  );
  if (isExactRepeat) {
    score -= REPEAT_PENALTY;
    notes.push("Identical to a recently generated outfit.");
  }

  // Mild wear-rotation nudge: prefer combinations of items that haven't all
  // been worn constantly, when the alternative is otherwise comparable.
  // Deliberately small and capped so it can never dominate real style
  // scoring — it only breaks near-ties.
  const avgWear = items.reduce((sum, i) => sum + i.wearCount, 0) / Math.max(1, items.length);
  score -= Math.min(WEAR_ROTATION_MAX_PENALTY, avgWear * 0.4);

  return { adjustedScore: score, notes };
}
