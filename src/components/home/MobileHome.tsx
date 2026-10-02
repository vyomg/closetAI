import Link from "next/link";
import Image from "next/image";
import { Plus, Sparkles, Luggage, ShoppingBag } from "lucide-react";
import { WeatherLine } from "@/components/home/WeatherLine";
import { StyleProfileNudge } from "@/components/home/StyleProfileNudge";
import { TodaysOutfitCard } from "@/components/home/TodaysOutfitCard";
import { greeting } from "@/lib/greeting";
import type { HomeData } from "@/components/home/types";

export function MobileHome({ data }: { data: HomeData }) {
  const { firstName, weather, tempUnit, styleTags, recentItems, todaysOutfit, hasAppearanceProfile } = data;

  return (
    <div className="lg:hidden">
      <p className="text-stone mb-1">
        {greeting()}, {firstName}.
      </p>
      {weather ? (
        <WeatherLine weather={weather} tempUnit={tempUnit} compact />
      ) : (
        <Link href="/settings" className="text-sm text-stone hover:text-ink underline underline-offset-4">
          Set your location for weather-aware styling
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 mt-6 mb-8">
        <ActionTile href="/outfits/create?quick=today" icon={<Sparkles className="h-5 w-5" />} label="What should I wear?" emphasize />
        <ActionTile href="/wardrobe/add" icon={<Plus className="h-5 w-5" />} label="Add clothes" />
        <ActionTile href="/pack" icon={<Luggage className="h-5 w-5" />} label="Pack a trip" />
        <ActionTile href="/buy#should-i-buy" icon={<ShoppingBag className="h-5 w-5" />} label="Should I buy this?" />
      </div>

      {!hasAppearanceProfile && <StyleProfileNudge compact />}

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="font-display text-xl">Today&apos;s Outfit</h2>
          {todaysOutfit && (
            <Link href="/outfits" className="text-sm text-stone hover:text-ink">
              View all
            </Link>
          )}
        </div>
        <TodaysOutfitCard initial={todaysOutfit} compact />
      </section>

      {recentItems.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="font-display text-xl">Recently Added</h2>
            <Link href="/wardrobe" className="text-sm text-stone hover:text-ink">
              View all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1">
            {recentItems.map((item) => (
              <Link
                key={item.id}
                href={`/wardrobe/${item.id}`}
                className="relative aspect-[4/5] w-24 shrink-0 rounded-xl overflow-hidden border border-line bg-paper-alt block"
              >
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="96px" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {styleTags.length > 0 && (
        <section className="mb-4">
          <h2 className="font-display text-xl mb-3.5">Your Style</h2>
          <div className="flex flex-wrap gap-1.5">
            {styleTags.map((tag) => (
              <span key={tag} className="rounded-full bg-paper-alt px-3 py-1.5 text-sm">
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ActionTile({
  href,
  icon,
  label,
  emphasize = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  emphasize?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        emphasize
          ? "rounded-2xl bg-ink text-paper p-5 flex flex-col justify-between min-h-28 active:scale-[0.98] transition-transform"
          : "rounded-2xl border border-line bg-paper-alt p-5 flex flex-col justify-between min-h-28 active:scale-[0.98] transition-transform"
      }
    >
      {icon}
      <span className="text-sm font-medium leading-snug mt-3">{label}</span>
    </Link>
  );
}
