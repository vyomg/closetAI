"use client";

import { useState } from "react";
import { Check, Sparkles, Trash2 } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { FIT_OPTIONS, COLOR_PALETTE } from "@/lib/constants";
import type { PersonalAppearanceProfileDTO } from "@/lib/clientTypes";

function ConfidenceBadge({ level }: { level?: string }) {
  if (!level) return null;
  return (
    <span
      className={cn(
        "text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5",
        level === "high" ? "bg-success/15 text-success" : level === "medium" ? "bg-paper-alt text-ink-soft" : "bg-warning/15 text-warning"
      )}
    >
      {level} confidence
    </span>
  );
}

export function PersonalAppearanceReview({
  profile,
  fitPreference,
  onFitPreferenceChange,
  colorsLove,
  onColorsLoveChange,
}: {
  profile: PersonalAppearanceProfileDTO;
  fitPreference: string;
  onFitPreferenceChange: (v: string) => void;
  colorsLove: string[];
  onColorsLoveChange: (v: string[]) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  async function deletePhoto() {
    setDeleting(true);
    await fetch("/api/profile/appearance-photo", { method: "DELETE" });
    setDeleting(false);
    setDeleted(true);
  }

  if (profile.status === "FAILED") {
    return (
      <div className="rounded-2xl bg-warning/15 p-5 text-sm text-warning">
        {profile.errorMessage || "We couldn't analyze that photo."} You can go back and try again, or continue without it —
        your other style preferences already cover the essentials.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-paper-alt p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-ink-soft" strokeWidth={1.75} />
          <p className="font-medium text-sm">What matchin' noticed</p>
        </div>
        <div className="space-y-3 text-sm text-ink-soft">
          {profile.bodyProportionNotes && (
            <p className="flex items-start gap-2">
              <ConfidenceBadge level={profile.confidence?.bodyProportionNotes} />
              <span>{profile.bodyProportionNotes}</span>
            </p>
          )}
          {profile.styleStrengths && profile.styleStrengths.length > 0 && (
            <ul className="list-disc list-inside space-y-1">
              {profile.styleStrengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {profile.recommendedFits && profile.recommendedFits.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm font-medium">AI suggests this fit may suit you</p>
            <ConfidenceBadge level={profile.confidence?.recommendedFits} />
          </div>
          <p className="text-xs text-stone mb-3">Your choice always wins — pick whichever you actually prefer.</p>
          <div className="flex flex-wrap gap-2.5">
            {FIT_OPTIONS.map((option) => (
              <Chip key={option} active={fitPreference === option} onClick={() => onFitPreferenceChange(option)}>
                {option}
                {profile.recommendedFits?.includes(option) && <Check className="h-3 w-3 ml-1 inline" />}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {profile.recommendedPalette && profile.recommendedPalette.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-1">Colors that may complement you</p>
          <p className="text-xs text-stone mb-3">Tap to add to (or remove from) the colors you love.</p>
          <div className="flex flex-wrap gap-2.5">
            {COLOR_PALETTE.map((color) => {
              const suggested = profile.recommendedPalette?.includes(color);
              const active = colorsLove.includes(color);
              return (
                <Chip
                  key={color}
                  active={active}
                  onClick={() =>
                    onColorsLoveChange(active ? colorsLove.filter((c) => c !== color) : [...colorsLove, color])
                  }
                >
                  {color}
                  {suggested && <Sparkles className="h-3 w-3 ml-1 inline" />}
                </Chip>
              );
            })}
          </div>
        </div>
      )}

      {profile.experimentIdeas && profile.experimentIdeas.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Worth experimenting with</p>
          <ul className="text-sm text-ink-soft space-y-1 list-disc list-inside">
            {profile.experimentIdeas.map((idea) => (
              <li key={idea}>{idea}</li>
            ))}
          </ul>
        </div>
      )}

      {profile.photoUrl && !deleted && (
        <div className="rounded-xl bg-paper-alt p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Your profile is ready.</p>
            <p className="text-xs text-stone mt-0.5">
              Delete the original photo now? You can keep it if you'd like to re-analyze later without re-uploading.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={deletePhoto} disabled={deleting} className="shrink-0">
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> {deleting ? "Deleting…" : "Delete photo"}
          </Button>
        </div>
      )}
      {deleted && <p className="text-xs text-success">Original photo deleted — your styling profile is unaffected.</p>}
    </div>
  );
}
