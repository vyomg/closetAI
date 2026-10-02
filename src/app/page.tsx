"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Brand, Spark } from "@/components/Brand";
import { StoreBadges } from "@/components/StoreBadges";
import { MatchinWheel } from "@/components/MatchinWheel";
import { ArrowRight } from "lucide-react";

const WHEEL_SEGMENTS = ["STREET", "CLEAN", "SMART", "BOLD", "CASUAL", "CHILL", "DATE NIGHT", "SURPRISE ME"];

const DEMO_OUTFIT = [
  { file: "navy-blazer.svg", label: "Outerwear" },
  { file: "white-oxford-shirt.svg", label: "Top" },
  { file: "grey-trousers.svg", label: "Bottom" },
  { file: "brown-loafers.svg", label: "Shoes" },
];

const FEATURES = [
  { label: "Digital Wardrobe", body: "Photograph what you own once. Every piece becomes a clean entry in your closet — for good." },
  { label: "Match Something", body: "Pick an item, we build the rest. Exactly one top, one bottom, one pair of shoes, zero guesswork." },
  { label: "Style DNA", body: "A profile that learns your colours, proportions and taste the more you wear, save and rate fits." },
  { label: "Shop Smarter", body: "Know exactly what's missing from your closet, and why it's worth adding — before you buy it." },
];

export default function LandingPage() {
  const [landed, setLanded] = useState<string | null>(null);

  return (
    <div className="flex-1 bg-paper">
      {/* ===== HERO (dark) ===== */}
      <div className="bg-graphite text-white">
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

        <section className="mx-auto max-w-6xl px-5 sm:px-6 pt-10 pb-20 sm:pt-16 sm:pb-28 text-center">
          <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-5 animate-fade-up">your wardrobe, matched</p>
          <h1 className="font-display text-[15vw] leading-[0.92] sm:text-7xl lg:text-8xl tracking-tight uppercase animate-fade-up">
            your wardrobe.
            <br />
            <span className="text-lime">matched.</span>
          </h1>
          <p className="mt-7 text-base sm:text-lg text-white/60 max-w-md mx-auto leading-relaxed animate-fade-up">
            matchin&apos; turns the clothes you already own into complete, wearable fits — built from your actual closet, not a catalogue.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4 animate-fade-up">
            <LinkButton href="/signup" variant="lime" size="lg" className="lowercase">
              start now
            </LinkButton>
            <LinkButton href="/login" variant="outline-dark" size="lg" className="lowercase">
              log in
            </LinkButton>
          </div>
          <StoreBadges dark className="mt-8 flex flex-wrap items-center justify-center gap-3" />
        </section>

        {/* ===== THE WHEEL ===== */}
        <section className="mx-auto max-w-2xl px-5 sm:px-6 pb-24 text-center">
          <p className="font-display text-xl mb-1.5">
            matchin&apos; <Spark className="inline h-3.5 w-3.5 text-lime -translate-y-0.5" />
          </p>
          <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-tight mb-2">what are you feelin&apos;?</h2>
          <p className="text-sm text-white/40 lowercase mb-10">spin it. find your vibe.</p>

          <MatchinWheel segments={WHEEL_SEGMENTS} onLand={(seg) => setLanded(seg)} size={300} className="mx-auto" />

          {landed && (
            <div className="mt-10 animate-fade-up">
              <p className="text-xs tracking-[0.2em] uppercase text-white/40 mb-1">you landed on</p>
              <p className="font-display text-2xl text-lime mb-6">{landed}</p>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 max-w-sm mx-auto text-left">
                <div className="grid grid-cols-4 gap-2.5 mb-4">
                  {DEMO_OUTFIT.map((item) => (
                    <div key={item.file} className="relative aspect-[4/5] rounded-lg overflow-hidden bg-white/10">
                      <Image src={`/demo-images/${item.file}`} alt={item.label} fill sizes="80px" className="object-cover" />
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
        </section>
      </div>

      {/* ===== YOUR CLOSET, BUT SMARTER (light) ===== */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-20 sm:py-28 lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div className="max-w-lg">
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
          </div>
          <div className="mt-10 lg:mt-0 grid grid-cols-2 gap-4">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
              <Image src="/landing/wardrobe-rack.jpg" alt="Organized clothing rack" fill sizes="(max-width: 1024px) 45vw, 280px" className="object-cover grayscale contrast-125" />
              <div className="absolute inset-0 bg-lime mix-blend-color opacity-[0.08]" />
            </div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mt-8">
              <Image src="/landing/folded-sweaters.jpg" alt="Folded sweaters" fill sizes="(max-width: 1024px) 45vw, 280px" className="object-cover grayscale contrast-125" />
              <div className="absolute inset-0 bg-lime mix-blend-color opacity-[0.08]" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== MATCH SOMETHING (dark) ===== */}
      <section className="bg-graphite text-white border-b border-white/10">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-20 sm:py-28 lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div className="order-2 lg:order-1 mt-10 lg:mt-0">
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
          </div>
          <div className="order-1 lg:order-2 max-w-lg">
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
          </div>
        </div>
      </section>

      {/* ===== FEATURE GRID (light) ===== */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-20 sm:py-28">
          <h2 className="font-display text-3xl sm:text-4xl uppercase tracking-tight mb-14 max-w-lg">
            everything you need to wear what you own.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {FEATURES.map((f, i) => (
              <div key={f.label} className="border-t-2 border-ink pt-5">
                <p className="text-xs text-stone mb-3">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="font-display text-lg uppercase tracking-tight mb-2">{f.label}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA (dark) ===== */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-24 sm:py-32 text-center">
          <Spark className="h-9 w-9 mx-auto mb-7 text-lime" />
          <h2 className="font-display text-4xl sm:text-6xl uppercase tracking-tight mb-6 leading-[0.95]">
            let&apos;s match.
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

        <footer className="border-t border-white/10 py-8">
          <div className="mx-auto max-w-6xl px-5 sm:px-6 flex items-center justify-between text-xs text-white/40">
            <Brand size="sm" className="text-white/60" />
            <span>© {new Date().getFullYear()} matchin&apos;</span>
          </div>
        </footer>
      </section>
    </div>
  );
}
