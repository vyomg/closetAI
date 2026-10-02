"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { RefreshCw, Trash2, Upload, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Label, Textarea } from "@/components/ui/Field";
import { StyleSelector } from "@/components/StyleSelector";
import { ImportanceScale } from "@/components/ImportanceScale";
import { PersonalAppearanceUpload } from "@/components/PersonalAppearanceUpload";
import { PersonalAppearanceReview } from "@/components/PersonalAppearanceReview";
import { StyleConstellation } from "@/components/StyleConstellation";
import { FloatingWords } from "@/components/FloatingWords";
import { DESIRED_STYLES, OCCASIONS, FIT_OPTIONS, COLOR_PALETTE, SHOE_TYPES } from "@/lib/constants";
import { BrandLoading } from "@/components/Brand";
import type { StyleProfileData, LearnedPreferences } from "@/lib/types";
import type { StyleDNA } from "@/lib/styleDNA";
import type { PersonalAppearanceProfileDTO } from "@/lib/clientTypes";

type ProfileResponse = StyleProfileData & {
  name: string;
  email: string;
  learnedPreferences: LearnedPreferences;
  hasAppearanceProfile: boolean;
  appearanceProfileStatus: string;
  styleDNA: StyleDNA;
};

export default function StyleProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [appearancePhoto, setAppearancePhoto] = useState<PersonalAppearanceProfileDTO | null>(null);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(setProfile);
    refetchAppearancePhoto();
  }, []);

  function refetchAppearancePhoto() {
    fetch("/api/profile/appearance-photo")
      .then((r) => r.json())
      .then(setAppearancePhoto);
  }

  if (!profile) return <BrandLoading />;

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

  async function refetch() {
    const res = await fetch("/api/profile");
    setProfile(await res.json());
    refetchAppearancePhoto();
  }

  async function deletePhoto() {
    await fetch("/api/profile/appearance-photo", { method: "DELETE" });
  }

  async function reanalyzeFromFile(file: File) {
    setReanalyzing(true);
    const formData = new FormData();
    formData.append("image", file);
    await fetch("/api/profile/appearance-photo", { method: "POST", body: formData });
    setReanalyzing(false);
    refetch();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-4xl mb-2">Style Profile</h1>
      <p className="text-stone mb-6">
        This is what matchin' uses to style you. Update it any time — and it keeps learning from
        your outfit feedback automatically.
      </p>

      <div className="relative rounded-2xl bg-graphite text-white p-6 sm:p-8 mb-10">
        <FloatingWords words={["YOU", "DNA", "✦", "TASTE"]} />
        <p className="font-display text-xl lowercase mb-1 relative">style dna</p>
        <p className="text-sm text-white/50 leading-relaxed mb-2 max-w-sm">{profile.styleDNA.summary}</p>
        <p className="text-[11px] text-white/30 mb-2 lowercase">tap a node for why it&apos;s there</p>
        <div className="text-white">
          <StyleConstellation dna={profile.styleDNA} learnedPreferences={profile.learnedPreferences} />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-paper-alt p-5 mb-10">
        <p className="font-medium text-sm mb-1">Personal Style Profile</p>
        <p className="text-xs text-stone mb-4">
          A full-body photo lets matchin' understand your proportions and suggest fits/colors that may suit
          you — your own choices here always take priority. Purely for styling; never used for identification.
        </p>
        {appearancePhoto?.photoUrl ? (
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="shrink-0">
              <p className="text-xs uppercase tracking-wide text-stone mb-2">Your style photo</p>
              <div className="relative w-32 aspect-[3/4] rounded-xl overflow-hidden border border-line bg-paper-alt">
                <Image
                  src={appearancePhoto.photoUrl}
                  alt="Your uploaded style photo"
                  fill
                  sizes="128px"
                  className="object-cover"
                />
                {reanalyzing && (
                  <div className="absolute inset-0 bg-paper/80 flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 animate-spin text-ink-soft" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 pt-1 sm:pt-6">
              <p className="text-sm text-success mb-3">Your styling profile is set up.</p>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink cursor-pointer">
                  <RefreshCw className="h-3.5 w-3.5" /> Replace / Re-analyze
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={reanalyzing}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      await reanalyzeFromFile(file);
                    }}
                  />
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await deletePhoto();
                    refetch();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete photo
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {profile.appearanceProfileStatus === "COMPLETE" && (
              <p className="text-xs text-stone mb-4 flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" /> Your styling analysis is still saved — upload a new photo to
                replace it.
              </p>
            )}
            <PersonalAppearanceUpload onAnalyzed={() => refetch()} />
          </div>
        )}

        {appearancePhoto && profile.appearanceProfileStatus === "COMPLETE" && (
          <div className="mt-5 pt-4 border-t border-line">
            <button
              onClick={() => setShowAnalysis((s) => !s)}
              className="flex items-center gap-1.5 text-sm font-medium cursor-pointer"
            >
              Detailed analysis
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAnalysis ? "rotate-180" : ""}`} />
            </button>
            {showAnalysis && (
              <div className="mt-4 animate-fade-in">
                <PersonalAppearanceReview
                  profile={appearancePhoto}
                  fitPreference={profile.fitPreference}
                  onFitPreferenceChange={(v) => set("fitPreference", v)}
                  colorsLove={profile.colorsLove}
                  onColorsLoveChange={(v) => set("colorsLove", v)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <h2 className="font-display text-2xl mb-5">Style preferences</h2>
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
          <Label className="mb-3">What matters most when you get dressed?</Label>
          <div className="space-y-5">
            <div>
              <p className="text-xs text-stone mb-2">Comfort — {profile.comfortImportance}/5</p>
              <ImportanceScale value={profile.comfortImportance} onChange={(v) => set("comfortImportance", v)} />
            </div>
            <div>
              <p className="text-xs text-stone mb-2">Looking fashionable — {profile.fashionImportance}/5</p>
              <ImportanceScale value={profile.fashionImportance} onChange={(v) => set("fashionImportance", v)} />
            </div>
            <div>
              <p className="text-xs text-stone mb-2">Looking formal / polished — {profile.formalImportance}/5</p>
              <ImportanceScale value={profile.formalImportance} onChange={(v) => set("formalImportance", v)} />
            </div>
          </div>
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
            ? `Based on ${totalFeedback} outfit rating${totalFeedback === 1 ? "" : "s"}, matchin' has picked up on these patterns:`
            : "Like or dislike outfits and this section will start filling in."}
        </p>
        {totalFeedback > 0 && (
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-2 text-success">Leaning into</p>
              <div className="flex flex-wrap gap-1.5">
                {topLiked.length ? topLiked.map(([k]) => (
                  <span key={k} className="rounded-full bg-success/15 text-success text-xs px-2.5 py-1">
                    {k.replace(":", ": ")}
                  </span>
                )) : <span className="text-xs text-stone">Nothing yet</span>}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2 text-warning">Backing away from</p>
              <div className="flex flex-wrap gap-1.5">
                {topDisliked.length ? topDisliked.map(([k]) => (
                  <span key={k} className="rounded-full bg-warning/15 text-warning text-xs px-2.5 py-1">
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
