"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Brand, Spark } from "@/components/Brand";
import { Mascot, MascotSparkField } from "@/components/Mascot";
import { StoreBadges } from "@/components/StoreBadges";
import { MatchinWheel } from "@/components/MatchinWheel";
import { OutfitBuilder } from "@/components/landing/OutfitBuilder";
import { StyleDiscovery } from "@/components/landing/StyleDiscovery";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { ArrowRight, Shirt, Compass, Sparkle } from "lucide-react";
import { wheelResultCardsFor, WHEEL_TOPS, WHEEL_BOTTOMS, WHEEL_ACCESSORIES } from "@/lib/publicFashion";

const WHEEL_SEGMENTS = ["STREET", "CLEAN", "SMART", "BOLD", "CASUAL", "CHILL", "DATE NIGHT", "SURPRISE ME"];

const FEATURES = [
  { label: "Digital Wardrobe", body: "Photograph what you own once. Every piece becomes a clean entry in your closet — for good." },
  { label: "Match Something", body: "Pick an item, we build the rest. Exactly one top, one bottom, one pair of shoes, zero guesswork." },
  { label: "Style DNA", body: "A profile that learns your colours, proportions and taste the more you wear, save and rate fits." },
  { label: "Shop Smarter", body: "Know exactly what's missing from your closet, and why it's worth adding — before you buy it." },
];

const HOW_IT_WORKS = [
  { icon: Compass, title: "Discover", body: "Tell matchin' a little about your style — a handful of quick taps, not a questionnaire." },
  { icon: Sparkle, title: "Explore", body: "See outfit combinations built from what's actually in your closet, instantly." },
  { icon: Shirt, title: "Refine", body: "Rate what you wear and matchin' keeps getting more precisely, quietly you." },
];

// A small, deliberately overlapping tile of individual garments — stands in
// for "a wardrobe full of clothes that still feels like nothing to wear."
// Reuses the same audited wheel-item pool as the rest of the page rather
// than new assets, so it stays honest about what's actually in the project.
const CLUTTER_ITEMS = [...WHEEL_TOPS, ...WHEEL_BOTTOMS, ...WHEEL_ACCESSORIES];

export default function LandingPage() {
  const [landed, setLanded] = useState<string | null>(null);
  const [resultCards, setResultCards] = useState<ReturnType<typeof wheelResultCardsFor>>([]);

  return (
    <div className="flex-1 bg-paper">
      {/* ===== HERO (dark) ===== */}
      <div className="bg-graphite text-white atmosphere">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-6 py-6">
          <Brand href="/" size="sm" className="text-white" />
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors px-2 sm:px-3 py-2 whitespace-nowrap lowercase">
              log in
            </Link>
            <LinkButton href="/signup" variant="lime" size="sm" className="lowercase">
              start now
            </LinkButton>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-5 sm:px-6 pt-10 pb-20 sm:pt-16 sm:pb-28 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div className="text-center lg:text-left">
            <div className="relative inline-block mb-6 animate-fade-up">
              <MascotSparkField className="absolute -inset-10" />
              <Mascot expression="welcoming" size={64} />
            </div>
            <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-5 animate-fade-up">your wardrobe, matched</p>
            <h1 className="font-display text-[12vw] leading-[0.95] sm:text-6xl lg:text-7xl tracking-tight uppercase animate-fade-up">
              your wardrobe is full.
              <br />
              <span className="text-lime">your next outfit</span>
              <br />
              is waiting.
            </h1>
            <p className="mt-7 text-base sm:text-lg text-white/60 max-w-md mx-auto lg:mx-0 leading-relaxed animate-fade-up">
              Discover combinations that fit your style, make more of the clothes you already own, and spend less time wondering what to wear.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center lg:justify-start gap-4 animate-fade-up">
              <LinkButton href="/signup" variant="lime" size="lg" className="lowercase">
                start now
              </LinkButton>
              <Link href="#how-it-works" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors font-medium">
                see how it works <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <StoreBadges dark className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3" />
          </div>

          <div className="mt-14 lg:mt-0 animate-fade-up">
            <OutfitBuilder />
          </div>
        </section>
      </div>

      {/* ===== THE PROBLEM (light) — clutter resolving into a clean fit ===== */}
      <section className="border-b border-line overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-20 sm:py-28 lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          <ScrollReveal>
            <p className="text-xs tracking-[0.25em] uppercase text-stone mb-4">the actual problem</p>
            <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-tight mb-5 leading-[0.95]">
              why does getting dressed take so long?
            </h2>
            <p className="text-ink-soft leading-relaxed max-w-md">
              A full closet and nothing to wear isn&apos;t a contradiction — it&apos;s what happens when every piece is on its own, with no
              obvious way to put them together. matchin&apos; looks at what you actually own and does the combining for you.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={150} className="mt-12 lg:mt-0">
            <div className="relative h-72 sm:h-80">
              {CLUTTER_ITEMS.slice(0, 7).map((item, i) => {
                const positions = [
                  "top-0 left-[8%] rotate-[-8deg]",
                  "top-[4%] left-[38%] rotate-[6deg]",
                  "top-[2%] right-[4%] rotate-[-4deg]",
                  "top-[34%] left-[0%] rotate-[10deg]",
                  "top-[30%] left-[32%] rotate-[-6deg]",
                  "top-[36%] right-[6%] rotate-[5deg]",
                  "top-[60%] left-[18%] rotate-[-3deg]",
                ];
                return (
                  <div
                    key={item.imageUrl}
                    className={`absolute w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden border border-line shadow-sm bg-paper-alt ${positions[i % positions.length]}`}
                  >
                    <Image src={item.imageUrl} alt="" fill sizes="112px" className="object-cover" />
                  </div>
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== MISSION & VISION (dark, editorial) ===== */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-20 sm:py-28">
          <ScrollReveal>
            <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-10">why matchin&apos; exists</p>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            <ScrollReveal>
              <p className="text-[10px] uppercase tracking-[0.2em] text-lime mb-3">mission</p>
              <p className="font-display text-2xl sm:text-3xl leading-tight">
                Make getting dressed easier, more personal, and more enjoyable — by helping everyone discover their style and make more of
                what they already own.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3">vision</p>
              <p className="font-display text-2xl sm:text-3xl leading-tight text-white/70">
                A future where everyone can confidently express themselves through what they wear, with a style experience that actually
                understands them.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ===== STYLE DISCOVERY (light) ===== */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-20 sm:py-28">
          <ScrollReveal>
            <p className="text-xs tracking-[0.25em] uppercase text-stone mb-4">your style, not a template</p>
            <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-tight mb-10 leading-[0.95] max-w-2xl">
              explore a few directions. see what fits.
            </h2>
            <StyleDiscovery />
          </ScrollReveal>
        </div>
      </section>

      {/* ===== THE WHEEL — product showcase (dark) ===== */}
      <div className="bg-graphite text-white atmosphere">
        <section className="mx-auto max-w-2xl px-5 sm:px-6 py-20 sm:py-28 text-center">
          <ScrollReveal>
            <p className="font-display text-xl mb-1.5">
              matchin&apos; <Spark className="inline h-3.5 w-3.5 text-lime -translate-y-0.5" />
            </p>
            <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-tight mb-2">what are you feelin&apos;?</h2>
            <p className="text-sm text-white/40 lowercase mb-10">spin it. find your vibe.</p>

            <MatchinWheel
              segments={WHEEL_SEGMENTS}
              onLand={(seg) => {
                setLanded(seg);
                setResultCards(wheelResultCardsFor(seg));
              }}
              size={300}
              className="mx-auto"
            />

            {landed && (
              <div className="mt-10 animate-fade-up">
                <Mascot expression="excited" size={44} className="mx-auto mb-3" />
                <p className="text-xs tracking-[0.2em] uppercase text-white/40 mb-1">you landed on</p>
                <p className="font-display text-2xl text-lime mb-6">{landed}</p>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 max-w-sm mx-auto text-left">
                  <div className="grid grid-cols-4 gap-2.5 mb-4">
                    {resultCards.map((item, i) => (
                      <div key={item.imageUrl + i} className="relative aspect-[4/5] rounded-lg overflow-hidden bg-white/10">
                        <Image src={item.imageUrl} alt={item.label} fill sizes="80px" className="object-cover" />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Spark className="h-3.5 w-3.5 text-lime shrink-0" /> this one&apos;s a match
                  </p>
                  <Link href="/signup" className="mt-3 inline-flex items-center gap-1.5 text-sm text-lime font-medium">
                    try it with my wardrobe <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </ScrollReveal>
        </section>
      </div>

      {/* ===== YOUR CLOSET, BUT SMARTER (light) ===== */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-20 sm:py-28 lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          <ScrollReveal className="max-w-lg">
            <p className="text-xs tracking-[0.25em] uppercase text-stone mb-4">digital wardrobe</p>
            <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-tight mb-5 leading-[0.95]">
              your closet, but smarter.
            </h2>
            <p className="text-ink-soft leading-relaxed mb-6">
              Photograph each piece once. matchin&apos; reads category, colour, fit and formality automatically — a wardrobe that actually looks like one.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-1.5 text-sm font-semibold">
              build your wardrobe <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </ScrollReveal>
          <ScrollReveal delay={150} className="mt-10 lg:mt-0 grid grid-cols-2 gap-4">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
              <Image src="/landing/wardrobe-rack.jpg" alt="Organized clothing rack" fill sizes="(max-width: 1024px) 45vw, 280px" className="object-cover grayscale contrast-125" />
              <div className="absolute inset-0 bg-lime mix-blend-color opacity-[0.08]" />
            </div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mt-8">
              <Image src="/landing/folded-sweaters.jpg" alt="Folded sweaters" fill sizes="(max-width: 1024px) 45vw, 280px" className="object-cover grayscale contrast-125" />
              <div className="absolute inset-0 bg-lime mix-blend-color opacity-[0.08]" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== MATCH SOMETHING (dark) ===== */}
      <section className="bg-graphite text-white border-b border-white/10">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-20 sm:py-28 lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          <ScrollReveal className="order-2 lg:order-1 mt-10 lg:mt-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="relative aspect-square rounded-xl overflow-hidden">
                <Image src="/landing/outfit-flatlay.jpg" alt="A coordinated outfit" fill sizes="(max-width: 1024px) 90vw, 460px" className="object-cover grayscale contrast-125" />
              </div>
              <div className="mt-4 flex items-center justify-between px-1">
                <p className="text-xs uppercase tracking-wide text-white/40">dinner · smart</p>
                <p className="text-sm font-medium flex items-center gap-1.5 text-lime">
                  <Spark className="h-3.5 w-3.5" /> match found
                </p>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={150} className="order-1 lg:order-2 max-w-lg">
            <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-4">match something</p>
            <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-tight mb-5 leading-[0.95]">
              pick one. we build the fit.
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Lock in a piece you want to wear and matchin&apos; builds around it — real pieces, real formality, real colour logic. Never something you&apos;d have to buy.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-1.5 text-sm font-semibold text-lime">
              style me with this <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== HOW IT WORKS (light) ===== */}
      <section id="how-it-works" className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-20 sm:py-28">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-tight mb-14 max-w-lg">how it works.</h2>
          </ScrollReveal>
          <div className="grid sm:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map((step, i) => (
              <ScrollReveal key={step.title} delay={i * 120}>
                <step.icon className="h-6 w-6 text-ink mb-4" strokeWidth={1.5} />
                <h3 className="font-display text-lg uppercase tracking-tight mb-2">{step.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{step.body}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURE GRID (light) ===== */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-20 sm:py-28">
          <ScrollReveal>
            <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-tight mb-14 max-w-lg">
              everything you need to wear what you own.
            </h2>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.label} delay={i * 80} className="border-t-2 border-ink pt-5">
                <p className="text-xs text-stone mb-3">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="font-display text-lg uppercase tracking-tight mb-2">{f.label}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{f.body}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA (dark) ===== */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-24 sm:py-32 text-center">
          <Mascot expression="excited" size={56} className="mx-auto mb-7" />
          <h2 className="font-display text-4xl sm:text-6xl uppercase tracking-tight mb-6 leading-[0.95]">
            make getting dressed
            <br />
            the easiest part of your day.
          </h2>
          <p className="text-white/50 mb-10 max-w-sm mx-auto lowercase">
            give it a few photos and see what it can put together.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <LinkButton href="/signup" variant="lime" size="lg" className="lowercase">
              start now
            </LinkButton>
            <LinkButton href="/login" variant="outline-dark" size="lg" className="lowercase">
              log in
            </LinkButton>
          </div>
        </div>

        <footer className="border-t border-white/10 py-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-10 mb-10">
              <div className="max-w-xs">
                <Brand size="sm" className="text-white mb-3" />
                <p className="text-sm text-white/40 leading-relaxed">
                  Making getting dressed easier, more personal, and more enjoyable — one closet at a time.
                </p>
              </div>
              <div className="flex flex-wrap gap-x-12 gap-y-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/30 mb-3">Product</p>
                  <div className="flex flex-col gap-2 text-sm text-white/60">
                    <Link href="/signup" className="hover:text-white transition-colors">Start now</Link>
                    <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
                    <Link href="/login" className="hover:text-white transition-colors">Log in</Link>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/30 mb-3">Legal</p>
                  <div className="flex flex-col gap-2 text-sm text-white/60">
                    <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
                    <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-white/40 pt-6 border-t border-white/10">
              <span>© {new Date().getFullYear()} matchin&apos;</span>
              <span className="lowercase">your wardrobe, matched</span>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
