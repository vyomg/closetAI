"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Label, Textarea } from "@/components/ui/Field";
import { StyleSelector } from "@/components/StyleSelector";
import { ImportanceScale } from "@/components/ImportanceScale";
import { DESIRED_STYLES, OCCASIONS, FIT_OPTIONS, COLOR_PALETTE, SHOE_TYPES } from "@/lib/constants";
import type { StyleProfileData, LearnedPreferences } from "@/lib/types";

type ProfileResponse = StyleProfileData & { name: string; email: string; learnedPreferences: LearnedPreferences };

export default function StyleProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(setProfile);
  }, []);

  if (!profile) return <p className="text-stone">Loading…</p>;

  function set<K extends keyof ProfileResponse>(key: K, value: ProfileResponse[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
    setSaved(false);
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const { likedAttributes, dislikedAttributes, totalFeedback } = profile.learnedPreferences;
  const topLiked = Object.entries(likedAttributes).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topDisliked = Object.entries(dislikedAttributes).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl mb-2">Style Profile</h1>
      <p className="text-stone mb-10">
        This is what ClosetAI uses to style you. Update it any time — and it keeps learning from
        your outfit feedback automatically.
      </p>

      <div className="space-y-8">
        <div>
          <Label>Preferred styles</Label>
          <StyleSelector options={DESIRED_STYLES} selected={profile.preferredStyles} onChange={(v) => set("preferredStyles", v)} />
        </div>

        <div>
          <Label>How you'd describe your usual clothing</Label>
          <Textarea rows={3} value={profile.usualClothing} onChange={(e) => set("usualClothing", e.target.value)} />
        </div>

        <div>
          <Label>Occasions you dress for</Label>
          <StyleSelector options={OCCASIONS} selected={profile.occasions} onChange={(v) => set("occasions", v)} />
        </div>

        <div>
          <Label>Fit preference</Label>
          <StyleSelector options={FIT_OPTIONS} selected={[profile.fitPreference]} onChange={(v) => set("fitPreference", v[0])} multiple={false} />
        </div>

        <div>
          <Label>Colours you love</Label>
          <StyleSelector options={COLOR_PALETTE} selected={profile.colorsLove} onChange={(v) => set("colorsLove", v)} />
        </div>

        <div>
          <Label>Colours you avoid</Label>
          <StyleSelector options={COLOR_PALETTE} selected={profile.colorsAvoid} onChange={(v) => set("colorsAvoid", v)} />
        </div>

        <div>
          <Label>Footwear preference</Label>
          <StyleSelector options={SHOE_TYPES} selected={profile.shoePreference} onChange={(v) => set("shoePreference", v)} />
        </div>

        <div>
          <Label>Adventurousness — {profile.adventurousness}/5</Label>
          <ImportanceScale value={profile.adventurousness} onChange={(v) => set("adventurousness", v)} lowLabel="Very safe" highLabel="Bold" />
        </div>

        <div>
          <Label>Comfort importance — {profile.comfortImportance}/5</Label>
          <ImportanceScale value={profile.comfortImportance} onChange={(v) => set("comfortImportance", v)} />
        </div>
        <div>
          <Label>Fashion importance — {profile.fashionImportance}/5</Label>
          <ImportanceScale value={profile.fashionImportance} onChange={(v) => set("fashionImportance", v)} />
        </div>
        <div>
          <Label>Formality importance — {profile.formalImportance}/5</Label>
          <ImportanceScale value={profile.formalImportance} onChange={(v) => set("formalImportance", v)} />
        </div>

        <div className="flex items-center gap-4">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
          {saved && <span className="text-sm text-success">Saved</span>}
        </div>
      </div>

      <div className="mt-14 pt-10 border-t border-line">
        <h2 className="font-display text-2xl mb-2">Learned from your feedback</h2>
        <p className="text-stone text-sm mb-6">
          {totalFeedback > 0
            ? `Based on ${totalFeedback} outfit rating${totalFeedback === 1 ? "" : "s"}, ClosetAI has picked up on these patterns:`
            : "Like or dislike outfits and this section will start filling in."}
        </p>
        {totalFeedback > 0 && (
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-2 text-success">Leaning into</p>
              <div className="flex flex-wrap gap-1.5">
                {topLiked.length ? topLiked.map(([k]) => (
                  <span key={k} className="rounded-full bg-[#e3ebe0] text-success text-xs px-2.5 py-1">
                    {k.replace(":", ": ")}
                  </span>
                )) : <span className="text-xs text-stone">Nothing yet</span>}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2 text-warning">Backing away from</p>
              <div className="flex flex-wrap gap-1.5">
                {topDisliked.length ? topDisliked.map(([k]) => (
                  <span key={k} className="rounded-full bg-[#f4e6d8] text-warning text-xs px-2.5 py-1">
                    {k.replace(":", ": ")}
                  </span>
                )) : <span className="text-xs text-stone">Nothing yet</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
