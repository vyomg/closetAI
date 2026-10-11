"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ThumbsDown, ThumbsUp, Sparkles, Shuffle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { StyleSelector } from "@/components/StyleSelector";
import { ImportanceScale } from "@/components/ImportanceScale";
import { PersonalAppearanceUpload } from "@/components/PersonalAppearanceUpload";
import { PersonalAppearanceReview } from "@/components/PersonalAppearanceReview";
import { Spark } from "@/components/Brand";
import { Mascot } from "@/components/Mascot";
import { type HeightUnit } from "@/components/HeightUnitInput";
import { cn } from "@/lib/cn";
import {
  DESIRED_STYLES,
  OCCASIONS,
  FIT_OPTIONS,
  ONBOARDING_INTENTS,
  SHOP_FOR_OPTIONS,
} from "@/lib/constants";
import { styleLearningDeckFor } from "@/lib/publicFashion";
import type { PersonalAppearanceProfileDTO } from "@/lib/clientTypes";

const INTENT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "build-wardrobe": Sparkles,
  "utilize-wardrobe": Shuffle,
  "shop-mindfully": ShoppingBag,
};

type StyleReaction = { style: string; fit: string; primaryColor: string; formality: number; category: string; reaction: "like" | "dislike" };

type Data = {
  nickname: string;
  shopFor: string;
  ageRange: string;
  profession: string;
  intent: string;
  heightCm: string;
  heightUnit: HeightUnit;
  preferredStyles: string[];
  usualClothing: string;
  occasions: string[];
  fitPreference: string;
  colorsLove: string[];
  colorsAvoid: string[];
  shoePreference: string[];
  preferredBrands: string[];
  adventurousness: number;
  comfortImportance: number;
  fashionImportance: number;
  formalImportance: number;
  styleReactions: StyleReaction[];
};

const INITIAL: Data = {
  nickname: "",
  shopFor: "",
  ageRange: "",
  profession: "",
  intent: "",
  heightCm: "",
  heightUnit: "cm",
  preferredStyles: [],
  usualClothing: "",
  occasions: [],
  fitPreference: "Regular",
  colorsLove: [],
  colorsAvoid: [],
  shoePreference: [],
  preferredBrands: [],
  adventurousness: 3,
  comfortImportance: 3,
  fashionImportance: 3,
  formalImportance: 3,
  styleReactions: [],
};

const AGE_RANGES = ["Under 18", "18–24", "25–34", "35–44", "45–54", "55+"];

// Trimmed from an earlier 18-step version: pure transition screens (no
// input) were cut, several low-stakes optional preferences — usual
// clothing, colours, footwear, preferred brands — are deferred to Style
// Profile (src/app/(app)/style-profile/page.tsx already edits every one of
// them post-onboarding), and the two preference-slider steps were merged
// into one. Pairs with the swipe deck itself being trimmed from 20 cards to
// 8 (see sampleSpread in lib/publicFashion.ts) — together, a real ~2-3
// minute first pass rather than a 20-minute survey.
const STEPS = [
  "welcome",
  "nickname",
  "shopFor",
  "intent",
  "vibe",
  "occasions",
  "swipe",
  "preferences",
  "photo",
  "review",
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<Data>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [appearanceProfile, setAppearanceProfile] = useState<PersonalAppearanceProfileDTO | null>(null);
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [lastSwipeReaction, setLastSwipeReaction] = useState<"like" | "dislike" | null>(null);

  const step = STEPS[stepIndex];
  const totalSteps = STEPS.length;

  // Full-outfit looks, never the user's own wardrobe (see
  // lib/publicFashion.ts). Filtered by both the "how do you want me to shop
  // for you?" answer and the selected age range, so under-18 users only
  // ever see the audited teen set (or the no-model fallback deck) — never
  // an adult-modeled photo. Computed once per answer pair so it doesn't
  // reshuffle mid-swipe.
  const swipeDeck = useMemo(() => styleLearningDeckFor(data.shopFor, data.ageRange), [data.shopFor, data.ageRange]);

  function set<K extends keyof Data>(key: K, value: Data[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function goNext() {
    setStepIndex((i) => Math.min(totalSteps - 1, i + 1));
  }
  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function swipe(reaction: "like" | "dislike") {
    const card = swipeDeck[swipeIndex];
    set("styleReactions", [
      ...data.styleReactions,
      { style: card.style, fit: card.fit, primaryColor: card.primaryColor, formality: card.formality, category: card.category, reaction },
    ]);
    setLastSwipeReaction(reaction);
    if (swipeIndex < swipeDeck.length - 1) {
      setSwipeIndex((i) => i + 1);
    } else {
      goNext();
    }
  }

  async function finish() {
    setSubmitting(true);
    // heightUnit is a client-only display preference — the server only
    // ever receives the canonical heightCm value, never a unit.
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        heightUnit: undefined,
        heightCm: data.heightCm ? Number(data.heightCm) : undefined,
      }),
    });
    // ?tour=1 tells the dashboard to launch the guided tour once, right
    // after a real onboarding completion — see components/GuidedTour.tsx.
    router.push("/dashboard?tour=1");
    router.refresh();
  }

  const canAdvance = (() => {
    switch (step) {
      case "nickname":
        return data.nickname.trim().length > 0;
      case "shopFor":
        return data.shopFor.length > 0;
      case "intent":
        return data.intent.length > 0;
      case "vibe":
        return data.preferredStyles.length > 0;
      case "occasions":
        return data.occasions.length > 0;
      default:
        return true;
    }
  })();

  // Steps that render their own nav (swipe deck handles its own
  // like/dislike buttons; the final review step shows "let's go" instead
  // of "Continue"), so the generic Back/Continue bar hides there.
  const hideGenericNav = step === "swipe" || step === "review" || step === "photo";

  return (
    <div
      className={cn(
        "theme-dark-app bg-paper atmosphere text-ink flex-1 flex items-start sm:items-center justify-center px-6 py-14 relative overflow-hidden"
      )}
    >
      <div className="w-full max-w-xl animate-fade-up relative">
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= stepIndex ? "bg-lime" : "bg-line"}`} />
          ))}
        </div>

        <div className="relative">

        {step === "welcome" && (
          <div className="relative animate-fade-in text-center py-6">
            <Mascot expression="welcoming" size={48} className="mx-auto mb-6" />
            <h1 className="font-display text-3xl mb-3 leading-tight lowercase relative">hi, i&apos;m matchin&apos;.</h1>
            <p className="text-sm text-stone mb-8 max-w-sm mx-auto relative">
              Think of me as your most honest, stylish friend — the one who actually knows your closet. A few quick things
              before we start.
            </p>
          </div>
        )}

        {step === "nickname" && (
          <Step title="first, what should i call you?" subtitle="This is how matchin' will address you.">
            <Input
              value={data.nickname}
              onChange={(e) => set("nickname", e.target.value)}
              placeholder="Your name or nickname"
              autoFocus
            />
          </Step>
        )}

        {step === "shopFor" && (
          <Step title="how do you want me to shop for you?" subtitle="Helps me understand fit and category defaults.">
            <div className="grid grid-cols-3 gap-3 mb-6">
              {SHOP_FOR_OPTIONS.map((o) => (
                <button
                  key={o}
                  onClick={() => set("shopFor", o)}
                  className={cn(
                    "rounded-2xl border-2 py-5 text-sm font-medium transition-colors cursor-pointer",
                    data.shopFor === o ? "border-lime bg-lime/10" : "border-line hover:border-ink/30"
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
            <p className="text-sm font-medium mb-2.5">Age range</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {AGE_RANGES.map((a) => (
                <button
                  key={a}
                  onClick={() => set("ageRange", data.ageRange === a ? "" : a)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm transition-colors cursor-pointer",
                    data.ageRange === a ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink/40"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
            <p className="text-sm font-medium mb-2.5">Profession (optional)</p>
            <Input value={data.profession} onChange={(e) => set("profession", e.target.value)} placeholder="e.g. Student, Designer, Engineer" />
          </Step>
        )}

        {step === "intent" && (
          <Step title="so, why are you here?" subtitle="Pick what matters most right now.">
            <div className="space-y-3">
              {ONBOARDING_INTENTS.map((o) => {
                const Icon = INTENT_ICON[o.key] ?? Sparkles;
                const active = data.intent === o.key;
                return (
                  <button
                    key={o.key}
                    onClick={() => set("intent", o.key)}
                    className={cn(
                      "w-full flex items-start gap-3.5 text-left rounded-2xl border-2 p-4 transition-colors cursor-pointer",
                      active ? "border-lime bg-lime/10" : "border-line hover:border-ink/30"
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition-colors",
                        active ? "bg-lime text-lime-ink" : "bg-paper-alt text-ink-soft"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <p className="font-medium text-sm mb-0.5">{o.title}</p>
                      <p className="text-xs text-stone">{o.description}</p>
                    </span>
                  </button>
                );
              })}
            </div>
          </Step>
        )}

        {step === "vibe" && (
          <Step title="what's your vibe?" subtitle="Pick as many as feel like you — this builds your Style DNA.">
            <div className="mb-6">
              <StyleSelector options={DESIRED_STYLES} selected={data.preferredStyles} onChange={(v) => set("preferredStyles", v)} />
            </div>
            <p className="text-sm font-medium mb-3">Fit preference</p>
            <StyleSelector options={FIT_OPTIONS} selected={[data.fitPreference]} onChange={(v) => set("fitPreference", v[0])} multiple={false} />
          </Step>
        )}

        {step === "occasions" && (
          <Step title="what occasions do you dress for?" subtitle="Select everything that applies to your week.">
            <StyleSelector options={OCCASIONS} selected={data.occasions} onChange={(v) => set("occasions", v)} />
          </Step>
        )}

        {step === "swipe" && (
          <div className="animate-fade-in">
            <Mascot
              key={`${swipeIndex}-${lastSwipeReaction}`}
              expression={lastSwipeReaction === "like" ? "happy" : lastSwipeReaction === "dislike" ? "thoughtful" : "curious"}
              size={36}
              className="mb-3"
            />
            <h1 className="font-display text-3xl mb-2 leading-tight lowercase">right if you&apos;d wear it.</h1>
            <p className="text-sm text-stone mb-8">
              Swipe right if you&apos;d actually wear it, left if you wouldn&apos;t — no wrong answers. {swipeDeck.length - swipeIndex} left.
            </p>
            <div className="relative mx-auto max-w-xs">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-line bg-paper-alt">
                {swipeDeck[swipeIndex].images.length === 1 ? (
                  <Image
                    key={swipeDeck[swipeIndex].images[0]}
                    src={swipeDeck[swipeIndex].images[0]}
                    alt={swipeDeck[swipeIndex].label}
                    fill
                    sizes="320px"
                    className="object-cover animate-fade-in"
                  />
                ) : (
                  // No-model fallback deck: a flatlay combo grid rather than
                  // a single photo (see teenFallbackDeck in publicFashion.ts).
                  <div key={swipeDeck[swipeIndex].images.join(",")} className="grid grid-cols-2 gap-1 h-full p-1 animate-fade-in">
                    {swipeDeck[swipeIndex].images.map((src) => (
                      <div key={src} className="relative rounded-lg overflow-hidden bg-paper">
                        <Image src={src} alt={swipeDeck[swipeIndex].label} fill sizes="160px" className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-ink/70 to-transparent p-4">
                  <p className="text-white text-sm font-medium">{swipeDeck[swipeIndex].label}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-5 mt-6">
                <button
                  onClick={() => swipe("dislike")}
                  aria-label="Not my style"
                  className="h-14 w-14 rounded-full border border-line flex items-center justify-center text-warning hover:border-warning transition-colors cursor-pointer"
                >
                  <ThumbsDown className="h-5 w-5" />
                </button>
                <button
                  onClick={() => swipe("like")}
                  aria-label="I'd wear this"
                  className="h-16 w-16 rounded-full bg-lime text-lime-ink flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                >
                  <ThumbsUp className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "preferences" && (
          <Step title="a few last things." subtitle="Rate each from 1 to 5 — these fine-tune every suggestion.">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-3">How far should we push it?</p>
                <ImportanceScale value={data.adventurousness} onChange={(v) => set("adventurousness", v)} lowLabel="safe" highLabel="surprise me" />
              </div>
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

        {step === "photo" && (
          <Step
            title="help matchin' understand your proportions"
            subtitle="Upload a full-body photo so matchin' can suggest fits that are likely to suit you. Optional — you can skip it."
          >
            <PersonalAppearanceUpload onAnalyzed={(profile) => { setAppearanceProfile(profile); goNext(); }} />
            <button
              onClick={() => { setAppearanceProfile(null); goNext(); }}
              className="mt-5 text-sm text-stone hover:text-ink underline underline-offset-4 cursor-pointer"
            >
              Skip for now
            </button>
          </Step>
        )}

        {step === "review" && (
          <div className="relative animate-fade-in text-center py-6">
            <Mascot expression="celebratory" size={48} className="mx-auto mb-6" />
            <h1 className="font-display text-3xl mb-3 leading-tight lowercase relative">
              {appearanceProfile ? "your personal style profile" : "that's it" }{data.nickname ? `, ${data.nickname}.` : "."}
            </h1>
            <p className="text-sm text-stone mb-8 max-w-sm mx-auto relative">
              {appearanceProfile
                ? "Here's what matchin' noticed — your own choices always take priority."
                : "It takes a few conversations to really get your style right — matchin' gets better every time."}
            </p>
            {appearanceProfile && (
              <div className="text-left mb-8">
                <PersonalAppearanceReview
                  profile={appearanceProfile}
                  fitPreference={data.fitPreference}
                  onFitPreferenceChange={(v) => set("fitPreference", v)}
                  colorsLove={data.colorsLove}
                  onColorsLoveChange={(v) => set("colorsLove", v)}
                />
              </div>
            )}
            <Button variant="lime" onClick={finish} disabled={submitting} className="lowercase">
              {submitting ? "setting up your closet…" : <>let&apos;s go <Spark className="h-3.5 w-3.5 inline ml-1 -translate-y-px" /></>}
            </Button>
          </div>
        )}

        {!hideGenericNav && (
          <div className="flex items-center justify-between mt-10">
            <Button variant="ghost" onClick={goBack} disabled={stepIndex === 0}>
              Back
            </Button>
            <Button onClick={goNext} disabled={!canAdvance}>
              {step === "welcome" ? "Continue" : "Continue"}
            </Button>
          </div>
        )}
        {step === "swipe" && (
          <div className="flex items-center justify-start mt-10">
            <Button variant="ghost" onClick={goBack}>
              Back
            </Button>
          </div>
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

