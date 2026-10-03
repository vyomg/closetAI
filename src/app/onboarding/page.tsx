"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { StyleSelector } from "@/components/StyleSelector";
import { ImportanceScale } from "@/components/ImportanceScale";
import { PersonalAppearanceUpload } from "@/components/PersonalAppearanceUpload";
import { PersonalAppearanceReview } from "@/components/PersonalAppearanceReview";
import { BrandPicker } from "@/components/BrandPicker";
import { Spark } from "@/components/Brand";
import { FloatingWords } from "@/components/FloatingWords";
import { cn } from "@/lib/cn";
import {
  DESIRED_STYLES,
  OCCASIONS,
  FIT_OPTIONS,
  SHOE_TYPES,
  NAMED_COLORS,
  ONBOARDING_INTENTS,
  SHOP_FOR_OPTIONS,
  ONBOARDING_SWIPE_DECK,
} from "@/lib/constants";
import type { PersonalAppearanceProfileDTO } from "@/lib/clientTypes";

type StyleReaction = { style: string; fit: string; primaryColor: string; formality: number; category: string; reaction: "like" | "dislike" };

type Data = {
  nickname: string;
  shopFor: string;
  ageRange: string;
  profession: string;
  intent: string;
  heightCm: string;
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

const STEPS = [
  "welcome",
  "nickname",
  "shopFor",
  "intent",
  "vibe",
  "usualClothing",
  "occasions",
  "fitHeight",
  "colors",
  "footwear",
  "brands",
  "swipe",
  "adventurousness",
  "importance",
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

  const step = STEPS[stepIndex];
  const totalSteps = STEPS.length;

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
    const card = ONBOARDING_SWIPE_DECK[swipeIndex];
    set("styleReactions", [
      ...data.styleReactions,
      { style: card.style, fit: card.fit, primaryColor: card.primaryColor, formality: card.formality, category: card.category, reaction },
    ]);
    if (swipeIndex < ONBOARDING_SWIPE_DECK.length - 1) {
      setSwipeIndex((i) => i + 1);
    } else {
      goNext();
    }
  }

  async function finish() {
    setSubmitting(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        heightCm: data.heightCm ? Number(data.heightCm) : undefined,
      }),
    });
    router.push("/dashboard");
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
    <div className="theme-dark-app bg-paper text-ink flex-1 flex items-start sm:items-center justify-center px-6 py-14">
      <div className="w-full max-w-xl animate-fade-up">
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= stepIndex ? "bg-lime" : "bg-line"}`} />
          ))}
        </div>

        {step === "welcome" && (
          <div className="relative animate-fade-in text-center py-6">
            <FloatingWords words={["MATCH", "FIT", "YOU", "✦"]} />
            <Spark className="h-8 w-8 text-lime mx-auto mb-6" />
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
              {ONBOARDING_INTENTS.map((o) => (
                <button
                  key={o.key}
                  onClick={() => set("intent", o.key)}
                  className={cn(
                    "w-full text-left rounded-2xl border-2 p-4 transition-colors cursor-pointer",
                    data.intent === o.key ? "border-lime bg-lime/10" : "border-line hover:border-ink/30"
                  )}
                >
                  <p className="font-medium text-sm mb-0.5">{o.title}</p>
                  <p className="text-xs text-stone">{o.description}</p>
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === "vibe" && (
          <Step title="what's your vibe?" subtitle="Pick as many as feel like you.">
            <StyleSelector options={DESIRED_STYLES} selected={data.preferredStyles} onChange={(v) => set("preferredStyles", v)} />
          </Step>
        )}

        {step === "usualClothing" && (
          <Step title="how would you describe your usual clothing?" subtitle="A sentence or two is plenty.">
            <Textarea
              rows={4}
              value={data.usualClothing}
              onChange={(e) => set("usualClothing", e.target.value)}
              placeholder="e.g. Mostly neutral tones, clean fits, not too flashy."
            />
          </Step>
        )}

        {step === "occasions" && (
          <Step title="what occasions do you dress for?" subtitle="Select everything that applies to your week.">
            <StyleSelector options={OCCASIONS} selected={data.occasions} onChange={(v) => set("occasions", v)} />
          </Step>
        )}

        {step === "fitHeight" && (
          <Step title="let's get your fit right" subtitle="Helps proportion-aware recommendations from the start.">
            <div className="mb-6">
              <p className="text-sm font-medium mb-3">Fit preference</p>
              <StyleSelector options={FIT_OPTIONS} selected={[data.fitPreference]} onChange={(v) => set("fitPreference", v[0])} multiple={false} />
            </div>
            <div>
              <p className="text-sm font-medium mb-2.5">Height (optional)</p>
              <div className="flex items-center gap-2 max-w-[160px]">
                <Input
                  type="number"
                  value={data.heightCm}
                  onChange={(e) => set("heightCm", e.target.value)}
                  placeholder="170"
                />
                <span className="text-sm text-stone shrink-0">cm</span>
              </div>
            </div>
          </Step>
        )}

        {step === "colors" && (
          <Step title="what colours do you usually wear?" subtitle="Tap to mark love or avoid — nice, specific names, not just hex codes.">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-3">Colours you love</p>
                <div className="flex flex-wrap gap-2">
                  {NAMED_COLORS.map((c) => {
                    const active = data.colorsLove.includes(c.label);
                    return (
                      <button
                        key={c.label}
                        onClick={() =>
                          set(
                            "colorsLove",
                            active ? data.colorsLove.filter((v) => v !== c.label) : [...data.colorsLove, c.label]
                          )
                        }
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors cursor-pointer",
                          active ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/40"
                        )}
                      >
                        <span className="h-3.5 w-3.5 rounded-full border border-line/50 shrink-0" style={{ backgroundColor: c.hex }} />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-3">Colours you avoid</p>
                <div className="flex flex-wrap gap-2">
                  {NAMED_COLORS.filter((c) => !data.colorsLove.includes(c.label)).map((c) => {
                    const active = data.colorsAvoid.includes(c.label);
                    return (
                      <button
                        key={c.label}
                        onClick={() =>
                          set(
                            "colorsAvoid",
                            active ? data.colorsAvoid.filter((v) => v !== c.label) : [...data.colorsAvoid, c.label]
                          )
                        }
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors cursor-pointer",
                          active ? "border-warning bg-warning/15 text-warning" : "border-line text-ink-soft hover:border-ink/40"
                        )}
                      >
                        <span className="h-3.5 w-3.5 rounded-full border border-line/50 shrink-0" style={{ backgroundColor: c.hex }} />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Step>
        )}

        {step === "footwear" && (
          <Step title="what footwear do you gravitate to?" subtitle="Sneakers, loafers, boots — pick your regulars.">
            <StyleSelector options={SHOE_TYPES} selected={data.shoePreference} onChange={(v) => set("shoePreference", v)} />
          </Step>
        )}

        {step === "brands" && (
          <Step title="pick brands you love" subtitle="I'll figure out the rest. Totally optional.">
            <BrandPicker selected={data.preferredBrands} onChange={(v) => set("preferredBrands", v)} />
          </Step>
        )}

        {step === "swipe" && (
          <div className="animate-fade-in">
            <h1 className="font-display text-3xl mb-2 leading-tight lowercase">right if you&apos;d wear it.</h1>
            <p className="text-sm text-stone mb-8">Left if you wouldn&apos;t. {ONBOARDING_SWIPE_DECK.length - swipeIndex} left.</p>
            <div className="relative mx-auto max-w-xs">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-line bg-paper-alt">
                <Image
                  key={ONBOARDING_SWIPE_DECK[swipeIndex].imageUrl}
                  src={ONBOARDING_SWIPE_DECK[swipeIndex].imageUrl}
                  alt={ONBOARDING_SWIPE_DECK[swipeIndex].label}
                  fill
                  sizes="320px"
                  className="object-cover animate-fade-in"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-ink/70 to-transparent p-4">
                  <p className="text-white text-sm font-medium">{ONBOARDING_SWIPE_DECK[swipeIndex].label}</p>
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

        {step === "adventurousness" && (
          <Step title="how far should we push it?" subtitle="1 is safe and familiar, 5 is surprise me.">
            <ImportanceScale value={data.adventurousness} onChange={(v) => set("adventurousness", v)} lowLabel="safe" highLabel="surprise me" />
          </Step>
        )}

        {step === "importance" && (
          <Step title="what matters most when you get dressed?" subtitle="Rate each from 1 to 5.">
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
            <FloatingWords words={["READY", "YOU", "✦", "GO"]} />
            <Spark className="h-8 w-8 text-lime mx-auto mb-6" />
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

