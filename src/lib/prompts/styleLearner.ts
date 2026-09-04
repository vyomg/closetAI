// The Style Learner updates the user's learned-preference weights from
// outfit feedback. This is deliberately NOT an AI call: the inputs are
// already fully structured (item attributes + feedback type), so a plain
// weighted-counter update is faster, free, and fully deterministic — the
// same "prefer structured metadata over re-prompting Claude" principle used
// for outfit generation. generateOutfit() reads these weights back in as
// context for future recommendations.

import type { LearnedPreferences } from "@/lib/types";
import { EMPTY_LEARNED_PREFERENCES } from "@/lib/types";

type FeedbackAttributeSource = {
  style: string;
  fit: string;
  primaryColor: string;
  formality: number;
  category: string;
};

const STEP = 1;

export function updateLearnedPreferences(
  current: LearnedPreferences | null,
  items: FeedbackAttributeSource[],
  feedbackType: "like" | "dislike",
  reasons: string[]
): LearnedPreferences {
  const prefs: LearnedPreferences = current
    ? {
        likedAttributes: { ...current.likedAttributes },
        dislikedAttributes: { ...current.dislikedAttributes },
        totalFeedback: current.totalFeedback,
      }
    : {
        likedAttributes: { ...EMPTY_LEARNED_PREFERENCES.likedAttributes },
        dislikedAttributes: { ...EMPTY_LEARNED_PREFERENCES.dislikedAttributes },
        totalFeedback: 0,
      };

  const bucket = feedbackType === "like" ? prefs.likedAttributes : prefs.dislikedAttributes;

  const attributeKeys = new Set<string>();
  for (const item of items) {
    attributeKeys.add(`style:${item.style}`);
    attributeKeys.add(`fit:${item.fit}`);
    attributeKeys.add(`color:${item.primaryColor}`);
    attributeKeys.add(`formality:${formalityBand(item.formality)}`);
  }

  // Specific reasons ("Too formal", "Don't like the colours", etc.) sharpen
  // which attribute the negative signal should attach to, rather than
  // penalizing the whole outfit's attributes equally.
  const reasonFocus = focusFromReasons(reasons);

  for (const key of attributeKeys) {
    if (feedbackType === "dislike" && reasonFocus && !key.startsWith(reasonFocus)) {
      continue;
    }
    bucket[key] = (bucket[key] ?? 0) + STEP;
  }

  prefs.totalFeedback += 1;
  return prefs;
}

function formalityBand(formality: number): string {
  if (formality <= 2) return "casual";
  if (formality === 3) return "smart-casual";
  return "formal";
}

function focusFromReasons(reasons: string[]): string | null {
  if (reasons.includes("Too formal") || reasons.includes("Too casual")) return "formality:";
  if (reasons.includes("Don't like the colours")) return "color:";
  if (reasons.includes("Not my style")) return "style:";
  return null;
}
