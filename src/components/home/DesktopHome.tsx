import Link from "next/link";
import Image from "next/image";
import { Plus, Luggage, Wand2, ShoppingBag, ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { Spark } from "@/components/Brand";
import { FloatingWords } from "@/components/FloatingWords";
import { DashboardStats } from "@/components/DashboardStats";
import { WeatherLine } from "@/components/home/WeatherLine";
import { StyleProfileNudge } from "@/components/home/StyleProfileNudge";
import { TodaysOutfitCard } from "@/components/home/TodaysOutfitCard";
import { greeting } from "@/lib/greeting";
import type { HomeData } from "@/components/home/types";

export function DesktopHome({ data }: { data: HomeData }) {
  const { firstName, weather, tempUnit, itemCount, styleTags, recentItems, recentOutfits, todaysOutfit, hasAppearanceProfile } = data;

  return (
    <div className="hidden lg:block">
      {!hasAppearanceProfile && <StyleProfileNudge />}

      {/* Hero + weather merged into one dark card — matchin's "today's match" moment. */}
      <div className="rounded-2xl bg-graphite text-white p-8 flex items-center justify-between gap-8 mb-10">
        <div className="relative flex-1 min-w-0">
          <FloatingWords words={["STYLE", "MATCH", "FIT", "WEAR"]} />
          <p className="text-white/40 mb-1 lowercase">
            {greeting().toLowerCase()}, {firstName}.
          </p>
          <h1 className="font-display text-4xl mb-5 flex items-center gap-2 relative">
            today&apos;s match <Spark className="h-6 w-6 text-lime" />
          </h1>
          <p className="text-white/50 mb-6 max-w-lg text-sm">
            One tap — matchin&apos; checks today&apos;s weather, your recent outfits, and your style to put
            something together right now.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/outfits/create?quick=today" variant="lime" size="lg" className="lowercase">
              <Spark className="h-4 w-4 mr-1.5" /> what should I wear today?
            </LinkButton>
            <LinkButton href="/outfits/create?quick=surprise" variant="outline-dark" size="lg" className="lowercase">
              <Wand2 className="h-4 w-4 mr-1.5" /> surprise me
            </LinkButton>
          </div>
        </div>

        <div className="shrink-0 pl-8 border-l border-white/10 text-white">
          {weather ? (
            <WeatherLine weather={weather} tempUnit={tempUnit} />
          ) : (
            <div>
              <p className="text-sm font-medium mb-1">Location not set</p>
              <Link href="/settings" className="text-sm text-white/50 hover:text-white underline underline-offset-4">
                Set your location for weather-aware styling
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-6 mb-10 items-stretch">
        <section className="rounded-2xl border border-line bg-paper-alt p-7">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl">Today&apos;s Outfit</h2>
            {todaysOutfit && (
              <Link href="/outfits" className="text-sm text-stone hover:text-ink">
                View all →
              </Link>
            )}
          </div>
          <TodaysOutfitCard initial={todaysOutfit} />
        </section>

        <Link
          href="/buy"
          className="rounded-2xl border border-line bg-paper-alt p-7 flex flex-col justify-between hover:border-ink/30 transition-colors"
        >
          <div>
            <ShoppingBag className="h-5 w-5 text-ink-soft mb-3" strokeWidth={1.75} />
            <h2 className="font-display text-xl mb-2">Shopping opportunities</h2>
            <p className="text-sm text-ink-soft">What&apos;s missing from your wardrobe — and worth buying.</p>
          </div>
          <p className="text-sm font-medium mt-5 inline-flex items-center gap-1.5">
            Explore Buy Clothes <ArrowRight className="h-3.5 w-3.5" />
          </p>
        </Link>
      </div>

      <div className="mb-10">
        <DashboardStats itemCount={itemCount} styleTags={styleTags} />
      </div>

      {recentItems.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl">Recently Added</h2>
            <Link href="/wardrobe" className="text-sm text-stone hover:text-ink">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-6 gap-4">
            {recentItems.map((item) => (
              <Link
                key={item.id}
                href={`/wardrobe/${item.id}`}
                className="relative aspect-[4/5] rounded-xl overflow-hidden border border-line bg-paper-alt block"
              >
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="200px" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {recentOutfits.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl">Recent Outfits</h2>
            <Link href="/outfits" className="text-sm text-stone hover:text-ink">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {recentOutfits.map((outfit) => (
              <Link
                key={outfit.id}
                href="/outfits"
                className="rounded-2xl border border-line bg-paper-alt p-5 flex gap-3 hover:border-ink/30 transition-colors"
              >
                {outfit.items.slice(0, 4).map((oi) => (
                  <div key={oi.id} className="relative aspect-[4/5] w-16 rounded-lg overflow-hidden bg-paper-alt shrink-0">
                    <Image src={oi.clothingItem.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                ))}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{outfit.occasion}</p>
                  <p className="text-xs text-stone mt-1">Score {outfit.overallScore}%</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <QuickAction href="/wardrobe/add" icon={<Plus className="h-5 w-5" />} label="Add Clothing" />
          <QuickAction href="/pack" icon={<Luggage className="h-5 w-5" />} label="Pack for Trip" />
        </div>
      </section>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-line bg-paper-alt p-5 flex flex-col items-center justify-center gap-2.5 text-center hover:border-ink/30 transition-colors"
    >
      <span className="text-ink-soft">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
