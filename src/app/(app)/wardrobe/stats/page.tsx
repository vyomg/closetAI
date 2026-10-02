"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { BrandLoading } from "@/components/Brand";
import type { ClothingItemDTO } from "@/lib/clientTypes";

type StatsResponse = {
  empty: boolean;
  totalItems: number;
  byCategory: Record<string, number>;
  byColor: Record<string, number>;
  byFormalityBand: Record<string, number>;
  averageWearCount: number;
  mostWorn: ClothingItemDTO[];
  leastWorn: ClothingItemDTO[];
  neverWorn: ClothingItemDTO[];
  versatileItems: { item: ClothingItemDTO; outfitCount: number }[];
  repeatedCombinations: { count: number; occasion: string; itemIds: string[] }[];
  weeklyFrequency: { weekStart: string; count: number }[];
  missingCategories: string[];
  totalOutfits: number;
};

export default function WardrobeStatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    fetch("/api/wardrobe/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <BrandLoading />;

  if (stats.empty) {
    return (
      <div className="rounded-2xl border border-dashed border-line py-24 text-center">
        <p className="font-display text-2xl mb-3">No stats yet.</p>
        <p className="text-stone mb-8">Add some wardrobe items and this page will fill in.</p>
        <LinkButton href="/wardrobe/add">Add clothing</LinkButton>
      </div>
    );
  }

  const topColors = Object.entries(stats.byColor).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxWeekly = Math.max(1, ...stats.weeklyFrequency.map((w) => w.count));

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Wardrobe Stats</h1>
      <p className="text-stone mb-10">
        {stats.totalItems} items · {stats.totalOutfits} outfits generated · avg {stats.averageWearCount} wears/item
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard label="Total items" value={stats.totalItems} />
        <StatCard label="Outfits created" value={stats.totalOutfits} />
        <StatCard label="Avg. wears / item" value={stats.averageWearCount} />
        <StatCard label="Never worn" value={stats.neverWorn.length} warn={stats.neverWorn.length > 0} />
      </div>

      <section className="mb-12">
        <h2 className="font-display text-2xl mb-4">Outfit activity (last 8 weeks)</h2>
        <div className="flex items-end gap-2 h-24 rounded-2xl border border-line bg-white p-5">
          {stats.weeklyFrequency.map((w) => (
            <div key={w.weekStart} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <div
                className="w-full bg-ink rounded-t-sm"
                style={{ height: `${Math.max(4, (w.count / maxWeekly) * 100)}%` }}
                title={`${w.count} outfits`}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        <section>
          <h2 className="font-display text-2xl mb-4">Most worn</h2>
          <ItemGrid items={stats.mostWorn} showWearCount />
        </section>
        <section>
          <h2 className="font-display text-2xl mb-4">Never worn</h2>
          {stats.neverWorn.length === 0 ? (
            <p className="text-sm text-stone">Everything's had at least one outing.</p>
          ) : (
            <ItemGrid items={stats.neverWorn.slice(0, 8)} />
          )}
        </section>
      </div>

      {stats.versatileItems.length > 0 && (
        <section className="mb-12">
          <h2 className="font-display text-2xl mb-4">Most versatile</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {stats.versatileItems.map(({ item, outfitCount }) => (
              <Link key={item.id} href={`/wardrobe/${item.id}`} className="block">
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-line bg-paper-alt">
                  <Image src={item.imageUrl} alt={item.name} fill sizes="150px" className="object-cover" />
                </div>
                <p className="text-xs text-stone mt-1.5">{outfitCount} outfits</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid sm:grid-cols-2 gap-8 mb-12">
        <section>
          <h2 className="font-display text-xl mb-4">Most-worn colors</h2>
          <div className="space-y-2">
            {topColors.map(([color, count]) => (
              <div key={color} className="flex items-center justify-between text-sm">
                <span>{color}</span>
                <span className="text-stone">{count}</span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-display text-xl mb-4">Formality mix</h2>
          <div className="space-y-2">
            {Object.entries(stats.byFormalityBand).map(([band, count]) => (
              <div key={band} className="flex items-center justify-between text-sm">
                <span className="capitalize">{band.replace("-", " ")}</span>
                <span className="text-stone">{count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {stats.missingCategories.length > 0 && (
        <section className="rounded-2xl bg-paper-alt p-5">
          <p className="text-sm font-medium mb-1">Wardrobe gaps</p>
          <p className="text-sm text-stone">
            You don't own any {stats.missingCategories.join(", ").toLowerCase()} yet.{" "}
            <Link href="/buy" className="underline underline-offset-4">
              See shopping recommendations
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className={`font-display text-3xl ${warn ? "text-warning" : ""}`}>{value}</p>
      <p className="text-sm text-stone mt-1">{label}</p>
    </div>
  );
}

function ItemGrid({ items, showWearCount }: { items: ClothingItemDTO[]; showWearCount?: boolean }) {
  if (items.length === 0) return <p className="text-sm text-stone">Nothing here yet.</p>;
  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map((item) => (
        <Link key={item.id} href={`/wardrobe/${item.id}`} className="block">
          <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-line bg-paper-alt">
            <Image src={item.imageUrl} alt={item.name} fill sizes="120px" className="object-cover" />
          </div>
          {showWearCount && <p className="text-xs text-stone mt-1.5">Worn {item.wearCount}×</p>}
        </Link>
      ))}
    </div>
  );
}
