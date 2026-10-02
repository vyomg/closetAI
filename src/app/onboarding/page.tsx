"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { StyleSelector } from "@/components/StyleSelector";
import { ImportanceScale } from "@/components/ImportanceScale";
import { PersonalAppearanceUpload } from "@/components/PersonalAppearanceUpload";
import { PersonalAppearanceReview } from "@/components/PersonalAppearanceReview";
import { Spark } from "@/components/Brand";
import { DESIRED_STYLES, OCCASIONS, FIT_OPTIONS, COLOR_PALETTE, SHOE_TYPES } from "@/lib/constants";
import type { PersonalAppearanceProfileDTO } from "@/lib/clientTypes";

type Data = {
  preferredStyles: string[];
  usualClothing: string;
  occasions: string[];
  fitPreference: string;
  colorsLove: string[];
  colorsAvoid: string[];
  shoePreference: string[];
  adventurousness: number;
  comfortImportance: number;
  fashionImportance: number;
  formalImportance: number;
};

const INITIAL: Data = {
  preferredStyles: [],
  usualClothing: "",
  occasions: [],
  fitPreference: "Regular",
  colorsLove: [],
  colorsAvoid: [],
  shoePreference: [],
  adventurousness: 3,
  comfortImportance: 3,
  fashionImportance: 3,
  formalImportance: 3,
};

const TOTAL_STEPS = 10;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Data>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [appearanceProfile, setAppearanceProfile] = useState<PersonalAppearanceProfileDTO | null>(null);

  function set<K extends keyof Data>(key: K, value: Data[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function finish() {
    setSubmitting(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.push("/dashboard");
    router.refresh();
  }

  const canAdvance = (() => {
    switch (step) {
      case 1:
        return data.preferredStyles.length > 0;
      case 3:
        return data.occasions.length > 0;
      default:
        return true;
    }
  })();

  return (
    <div className="theme-dark-app bg-paper text-ink flex-1 flex items-start sm:items-center justify-center px-6 py-14">
      <div className="w-full max-w-xl animate-fade-up">
        <div className="flex items-center gap-2 mb-10">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-lime" : "bg-line"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <Step title="what's your vibe?" subtitle="Pick as many as feel like you.">
            <StyleSelector options={DESIRED_STYLES} selected={data.preferredStyles} onChange={(v) => set("preferredStyles", v)} />
          </Step>
        )}

        {step === 2 && (
          <Step title="How would you describe your usual clothing?" subtitle="A sentence or two is plenty.">
            <Textarea
              rows={4}
              value={data.usualClothing}
              onChange={(e) => set("usualClothing", e.target.value)}
              placeholder="e.g. Mostly neutral tones, clean fits, not too flashy."
            />
          </Step>
        )}

        {step === 3 && (
          <Step title="What occasions do you dress for?" subtitle="Select everything that applies to your week.">
            <StyleSelector options={OCCASIONS} selected={data.occasions} onChange={(v) => set("occasions", v)} />
          </Step>
        )}

        {step === 4 && (
          <Step title="Fitted, regular, or oversized?" subtitle="Your general fit preference.">
            <StyleSelector options={FIT_OPTIONS} selected={[data.fitPreference]} onChange={(v) => set("fitPreference", v[0])} multiple={false} />
          </Step>
        )}

        {step === 5 && (
          <Step title="What colours do you usually wear?" subtitle="And which ones would you rather avoid?">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-3">Colours you love</p>
                <StyleSelector options={COLOR_PALETTE} selected={data.colorsLove} onChange={(v) => set("colorsLove", v)} />
              </div>
              <div>
                <p className="text-sm font-medium mb-3">Colours you avoid</p>
                <StyleSelector
                  options={COLOR_PALETTE.filter((c) => !data.colorsLove.includes(c))}
                  selected={data.colorsAvoid}
                  onChange={(v) => set("colorsAvoid", v)}
                />
              </div>
            </div>
          </Step>
        )}

        {step === 6 && (
          <Step title="What footwear do you gravitate to?" subtitle="Sneakers, loafers, boots — pick your regulars.">
            <StyleSelector options={SHOE_TYPES} selected={data.shoePreference} onChange={(v) => set("shoePreference", v)} />
          </Step>
        )}

        {step === 7 && (
          <Step title="how far should we push it?" subtitle="1 is safe and familiar, 5 is surprise me.">
            <ImportanceScale value={data.adventurousness} onChange={(v) => set("adventurousness", v)} lowLabel="safe" highLabel="surprise me" />
          </Step>
        )}

        {step === 8 && (
          <Step title="What matters most when you get dressed?" subtitle="Rate each from 1 to 5.">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-3">Comfort</p>
                <ImportanceScale value={data.comfortImportance} onChange={(v) => set("comfortImportance", v)} />
              </div>
              <div>
                <p className="text-sm font-medium mb-3">Looking fashionable</p>
                <ImportanceScale value={data.fashionImportance} onChange={(v) => set("fashionImportance", v)} />
              </div>
              <div>
                <p className="text-sm font-medium mb-3">Looking formal / polished</p>
                <ImportanceScale value={data.formalImportance} onChange={(v) => set("formalImportance", v)} />
              </div>
            </div>
          </Step>
        )}

        {step === 9 && (
          <Step
            title="Help matchin' understand your proportions"
            subtitle="For better outfit recommendations, upload a full-body photo so matchin' can understand your proportions and what styles are likely to suit you. This is optional and only used for styling — you can skip it."
          >
            <PersonalAppearanceUpload onAnalyzed={(profile) => { setAppearanceProfile(profile); setStep(10); }} />
            <button
              onClick={() => { setAppearanceProfile(null); setStep(10); }}
              className="mt-5 text-sm text-stone hover:text-ink underline underline-offset-4 cursor-pointer"
            >
              Skip for now
            </button>
          </Step>
        )}

        {step === 10 && (
          <Step
            title={appearanceProfile ? "Your personal style profile" : "Almost there"}
            subtitle={
              appearanceProfile
                ? "Here's what matchin' noticed — your own choices always take priority."
                : "You skipped the photo step. You can add one later from Settings."
            }
          >
            {appearanceProfile ? (
              <PersonalAppearanceReview
                profile={appearanceProfile}
                fitPreference={data.fitPreference}
                onFitPreferenceChange={(v) => set("fitPreference", v)}
                colorsLove={data.colorsLove}
                onColorsLoveChange={(v) => set("colorsLove", v)}
              />
            ) : (
              <p className="text-sm text-ink-soft">Ready to finish setting up your closet.</p>
            )}
          </Step>
        )}

        <div className="flex items-center justify-between mt-10">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
            Back
          </Button>
          {step < TOTAL_STEPS ? (
            step === 9 ? null : (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
                Continue
              </Button>
            )
          ) : (
            <Button variant="lime" onClick={finish} disabled={submitting} className="lowercase">
              {submitting ? "setting up your closet…" : <>let&apos;s go <Spark className="h-3.5 w-3.5 inline ml-1 -translate-y-px" /></>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-3xl mb-2 leading-tight lowercase">{title}</h1>
      <p className="text-sm text-stone mb-8">{subtitle}</p>
      {children}
    </div>
  );
}
