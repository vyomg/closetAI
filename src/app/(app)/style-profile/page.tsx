"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { RefreshCw, Trash2, Upload, ChevronDown, X, Plus, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Label, Textarea, Input } from "@/components/ui/Field";
import { StyleSelector } from "@/components/StyleSelector";
import { ImportanceScale } from "@/components/ImportanceScale";
import { PersonalAppearanceUpload } from "@/components/PersonalAppearanceUpload";
import { PersonalAppearanceReview } from "@/components/PersonalAppearanceReview";
import { StyleConstellation } from "@/components/StyleConstellation";
import { BrandPicker } from "@/components/BrandPicker";
import { FloatingWords } from "@/components/FloatingWords";
import { Spark } from "@/components/Brand";
import { cn } from "@/lib/cn";
import {
  DESIRED_STYLES,
  OCCASIONS,
  FIT_OPTIONS,
  COLOR_PALETTE,
  SHOE_TYPES,
  STYLE_PLAY_CONTEXTS,
  STYLE_PLAY_QUESTIONS,
} from "@/lib/constants";
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
  neverPreferences: string[];
  preferredBrands: string[];
};

const MAIN_TABS = ["Overview", "Style Play"] as const;
const DNA_TABS = ["Learned", "Learning", "Never"] as const;

export default function StyleProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [appearancePhoto, setAppearancePhoto] = useState<PersonalAppearanceProfileDTO | null>(null);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [mainTab, setMainTab] = useState<(typeof MAIN_TABS)[number]>("Overview");
  const [dnaTab, setDnaTab] = useState<(typeof DNA_TABS)[number]>("Learned");
  const [playContext, setPlayContext] = useState<(typeof STYLE_PLAY_CONTEXTS)[number]>("Everyday");
  const [neverInput, setNeverInput] = useState("");
  const [answeredKeys, setAnsweredKeys] = useState<Set<string>>(new Set());

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
  // "Learned" = enough repeated signal to say something confident (weight
  // >= 2). "Learning" = seen once — real, but not confident yet. Nothing
  // here is invented; both buckets come straight from the same weighted
  // counters outfit feedback and Style Play both write to.
  const confidentLiked = Object.entries(likedAttributes).filter(([, w]) => w >= 2).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const confidentDisliked = Object.entries(dislikedAttributes).filter(([, w]) => w >= 2).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const learning = [...Object.entries(likedAttributes), ...Object.entries(dislikedAttributes)]
    .filter(([, w]) => w === 1)
    .slice(0, 10);
  const topLiked = confidentLiked;
  const topDisliked = confidentDisliked;

  async function refetch() {
    const res = await fetch("/api/profile");
    setProfile(await res.json());
    refetchAppearancePhoto();
  }

  async function deletePhoto() {
    await fetch("/api/profile/appearance-photo", { method: "DELETE" });
  }

  async function teachMatchin(key: string, liked: boolean) {
    setAnsweredKeys((prev) => new Set(prev).add(`${playContext}:${key}`));
    const res = await fetch("/api/style-dna/teach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, liked }),
    });
    if (res.ok) {
      const learnedPreferences = await res.json();
      setProfile((p) => (p ? { ...p, learnedPreferences } : p));
    }
  }

  async function addNeverPreference() {
    const value = neverInput.trim();
    if (!value || !profile) return;
    const next = [...profile.neverPreferences, value];
    setProfile((p) => (p ? { ...p, neverPreferences: next } : p));
    setNeverInput("");
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ neverPreferences: next }),
    });
  }

  async function removeNeverPreference(value: string) {
    if (!profile) return;
    const next = profile.neverPreferences.filter((v) => v !== value);
    setProfile((p) => (p ? { ...p, neverPreferences: next } : p));
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ neverPreferences: next }),
    });
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

      <div className="flex gap-2 mb-8">
        {MAIN_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setMainTab(t)}
            className={cn(
              "rounded-full px-4 py-2 text-sm transition-colors cursor-pointer",
              mainTab === t ? "bg-ink text-paper" : "border border-line text-ink-soft hover:border-ink/40"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {mainTab === "Overview" && (
        <>
          <div className="flex gap-2 mb-6">
            {DNA_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setDnaTab(t)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs transition-colors cursor-pointer",
                  dnaTab === t ? "bg-ink text-paper" : "border border-line text-ink-soft hover:border-ink/40"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-line bg-paper-alt p-5 mb-10">
            {dnaTab === "Learned" && (
              <>
                {totalFeedback === 0 && topLiked.length === 0 && topDisliked.length === 0 ? (
                  <p className="text-sm text-stone">No confirmed style beliefs yet. Answer a few Style Play questions or rate some outfits.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium mb-2 text-success">Leaning into</p>
                      <div className="flex flex-wrap gap-1.5">
                        {topLiked.length ? topLiked.map(([k, w]) => (
                          <span key={k} className="rounded-full bg-success/15 text-success text-xs px-2.5 py-1">
                            {describeAttribute(k, w)}
                          </span>
                        )) : <span className="text-xs text-stone">Nothing confirmed yet</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2 text-warning">Backing away from</p>
                      <div className="flex flex-wrap gap-1.5">
                        {topDisliked.length ? topDisliked.map(([k, w]) => (
                          <span key={k} className="rounded-full bg-warning/15 text-warning text-xs px-2.5 py-1">
                            {describeAttribute(k, w)}
                          </span>
                        )) : <span className="text-xs text-stone">Nothing confirmed yet</span>}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            {dnaTab === "Learning" && (
              <>
                <p className="text-xs text-stone mb-3">Seen once — not confident yet. Keep rating outfits or answering Style Play to confirm these.</p>
                {learning.length === 0 ? (
                  <p className="text-sm text-stone">matchin&apos; is still learning how you feel about most things.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {learning.map(([k]) => (
                      <span key={k} className="rounded-full bg-paper text-ink-soft text-xs px-2.5 py-1 border border-line">
                        {describeAttribute(k, 1)}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
            {dnaTab === "Never" && (
              <>
                <p className="text-xs text-stone mb-3">Explicit rules — always respected, never overridden by a learned signal.</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {profile.neverPreferences.length === 0 ? (
                    <span className="text-sm text-stone">Nothing ruled out yet.</span>
                  ) : (
                    profile.neverPreferences.map((v) => (
                      <span key={v} className="inline-flex items-center gap-1.5 rounded-full bg-paper border border-line text-ink-soft text-xs pl-2.5 pr-1.5 py-1">
                        {v}
                        <button onClick={() => removeNeverPreference(v)} className="cursor-pointer hover:text-warning">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={neverInput}
                    onChange={(e) => setNeverInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addNeverPreference()}
                    placeholder="e.g. no skinny jeans, no bright red"
                  />
                  <Button variant="outline" onClick={addNeverPreference} disabled={!neverInput.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {mainTab === "Style Play" && (
        <div className="mb-10">
          <div className="flex flex-wrap gap-2 mb-6">
            {STYLE_PLAY_CONTEXTS.map((c) => (
              <button
                key={c}
                onClick={() => setPlayContext(c)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs transition-colors cursor-pointer",
                  playContext === c ? "bg-ink text-paper" : "border border-line text-ink-soft hover:border-ink/40"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {STYLE_PLAY_QUESTIONS[playContext].map((q, i) => {
              const aAnswered = answeredKeys.has(`${playContext}:${q.a.key}`);
              const bAnswered = answeredKeys.has(`${playContext}:${q.b.key}`);
              return (
                <div key={i} className="rounded-2xl border border-line bg-paper-alt p-6">
                  <p className="text-xs uppercase tracking-wide text-stone mb-4">{q.prompt}</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[q.a, q.b].map((opt, idx) => {
                      const answered = idx === 0 ? aAnswered : bAnswered;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => teachMatchin(opt.key, true)}
                          className={cn(
                            "rounded-xl border-2 p-5 text-left transition-colors cursor-pointer",
                            answered ? "border-lime bg-lime/10" : "border-line hover:border-ink/30"
                          )}
                        >
                          <p className="font-display text-lg mb-1">{opt.label}</p>
                          <p className="text-xs text-stone">{opt.sub}</p>
                          {answered && <Spark className="h-3.5 w-3.5 text-lime mt-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-stone mt-6 flex items-center gap-1.5">
            <ThumbsUp className="h-3 w-3" /> Answers feed the exact same Style DNA your outfit ratings do.
          </p>
        </div>
      )}

      {mainTab === "Overview" && (
      <>
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
          <Label>Brands you love</Label>
          <BrandPicker selected={profile.preferredBrands} onChange={(v) => set("preferredBrands", v)} />
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
      </>
      )}
    </div>
  );
}

// Turns a raw learnedPreferences key ("style:Streetwear", "formality:casual")
// into a real, non-fabricated sentence — every number here is the actual
// weight stored for that key, never invented.
function describeAttribute(key: string, weight: number): string {
  const [prefix, value] = key.split(":");
  const times = `${weight} time${weight === 1 ? "" : "s"}`;
  if (prefix === "style") return `${value} style (${times})`;
  if (prefix === "fit") return `${value} fit (${times})`;
  if (prefix === "color") return `${value} (${times})`;
  if (prefix === "formality") return `${value.replace("-", " ")} (${times})`;
  return `${key} (${times})`;
}
