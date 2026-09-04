import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

const STEPS = [
  {
    n: "01",
    title: "Photograph your wardrobe",
    body: "Upload every piece you own — shirts, jeans, jackets, sneakers, the works. One photo per item is all it takes.",
  },
  {
    n: "02",
    title: "AI reads every item",
    body: "ClosetAI identifies category, colour, fit, formality and more — then lets you correct anything it got wrong.",
  },
  {
    n: "03",
    title: "Get outfits, not suggestions",
    body: "Tell it the occasion. It builds a complete, wearable outfit using only clothes you actually own.",
  },
];

const FEATURES = [
  {
    title: "Built from your closet, not a catalogue",
    body: "Every recommendation uses pieces you already own — never something you'd have to buy.",
  },
  {
    title: "Learns your taste over time",
    body: "Like or dislike an outfit and ClosetAI quietly adjusts — more of what works, less of what doesn't.",
  },
  {
    title: "Dressed for the weather",
    body: "Tell it your city and outfits adapt to what it's actually like outside today.",
  },
  {
    title: "Never repeats itself",
    body: "Wardrobe rotation keeps track of what you've worn recently so the same combination doesn't resurface every week.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex-1">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-xl tracking-tight">ClosetAI</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-ink-soft hover:text-ink transition-colors px-3 py-2">
            Log in
          </Link>
          <LinkButton href="/signup" size="sm">
            Get started
          </LinkButton>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="max-w-3xl animate-fade-up">
          <p className="text-sm tracking-[0.2em] uppercase text-stone mb-6">Your wardrobe, understood</p>
          <h1 className="font-display text-5xl sm:text-7xl leading-[1.05] tracking-tight">
            Get dressed with the closet you already have.
          </h1>
          <p className="mt-7 text-lg text-ink-soft max-w-xl leading-relaxed">
            ClosetAI turns photos of your actual clothes into a digital wardrobe, then styles
            complete outfits from it — for any occasion, any weather, using nothing you don't own.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <LinkButton href="/signup" size="lg">
              Build your wardrobe
            </LinkButton>
            <a href="#how-it-works" className="text-sm text-ink-soft hover:text-ink transition-colors">
              See how it works →
            </a>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 animate-fade-in">
          {[
            { label: "Navy Polo", color: "#2d3b52" },
            { label: "Beige Chinos", color: "#d9c9a8" },
            { label: "White Sneakers", color: "#f2efe6" },
            { label: "Silver Watch", color: "#b9b9b0" },
          ].map((swatch) => (
            <div
              key={swatch.label}
              className="rounded-2xl border border-line bg-white p-5 aspect-[4/5] flex flex-col justify-end"
            >
              <div
                className="mb-4 aspect-square rounded-xl"
                style={{ background: swatch.color, border: "1px solid var(--line)" }}
              />
              <p className="text-xs text-stone">{swatch.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-line bg-paper-alt/50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="font-display text-3xl sm:text-4xl mb-14">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-10">
            {STEPS.map((step) => (
              <div key={step.n}>
                <p className="font-display text-3xl text-stone mb-4">{step.n}</p>
                <h3 className="text-lg font-medium mb-2">{step.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-display text-3xl sm:text-4xl mb-14 max-w-lg">
          A personal stylist that only recommends what's already yours.
        </h2>
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-12">
          {FEATURES.map((f) => (
            <div key={f.title} className="border-t border-line pt-6">
              <h3 className="text-lg font-medium mb-2">{f.title}</h3>
              <p className="text-sm text-ink-soft leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="font-display text-3xl sm:text-5xl mb-6">Your closet is smarter than you think.</h2>
          <p className="text-ink-soft mb-10 max-w-md mx-auto">
            Give it a few photos and see what it can put together.
          </p>
          <LinkButton href="/signup" size="lg">
            Start your wardrobe
          </LinkButton>
        </div>
      </section>

      <footer className="border-t border-line py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between text-xs text-stone">
          <span>ClosetAI — a personal styling prototype</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
