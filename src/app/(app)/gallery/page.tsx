"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Sparkles } from "lucide-react";
import { BrandLoading } from "@/components/Brand";
import { FloatingWords } from "@/components/FloatingWords";
import { cn } from "@/lib/cn";
import type { ClothingItemDTO } from "@/lib/clientTypes";

const TABS = ["all", "uploads", "try-ons"] as const;

export default function GalleryPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [items, setItems] = useState<ClothingItemDTO[] | null>(null);

  useEffect(() => {
    fetch("/api/clothing")
      .then((r) => r.json())
      .then(setItems);
  }, []);

  const uploads = useMemo(() => items ?? [], [items]);

  if (!items) return <BrandLoading />;

  return (
    <div className="max-w-5xl">
      <div className="relative rounded-2xl bg-graphite text-white p-6 sm:p-8 mb-8">
        <FloatingWords words={["LOOK", "SAVE", "YOU", "✦"]} />
        <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-3 relative">gallery</p>
        <h1 className="font-display text-3xl sm:text-4xl mb-2 relative">every photo in one place.</h1>
        <p className="text-sm text-white/50 relative max-w-md">Every wardrobe photo you&apos;ve uploaded, all together.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-2 text-sm capitalize transition-colors cursor-pointer",
              tab === t ? "bg-ink text-paper" : "border border-line text-ink-soft hover:border-ink/40"
            )}
          >
            {t === "try-ons" ? "Try-Ons" : t} {t === "uploads" ? uploads.length : t === "try-ons" ? 0 : uploads.length}
          </button>
        ))}
      </div>

      {tab === "try-ons" ? (
        <TryOnsEmptyState />
      ) : uploads.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20">
          <ImageOff className="h-8 w-8 text-stone mb-4" strokeWidth={1.5} />
          <p className="font-display text-lg mb-1">No images found</p>
          <p className="text-sm text-stone max-w-xs">Upload wardrobe photos to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {uploads.map((item) => (
            <Link
              key={item.id}
              href={`/wardrobe/${item.id}`}
              className="relative aspect-[4/5] rounded-xl overflow-hidden border border-line bg-paper-alt block"
            >
              <Image src={item.imageUrl} alt={item.name} fill sizes="200px" className="object-cover" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function TryOnsEmptyState() {
  return (
    <div className="flex flex-col items-center text-center py-20">
      <Sparkles className="h-8 w-8 text-stone mb-4" strokeWidth={1.5} />
      <p className="font-display text-lg mb-1">Try-ons are coming soon</p>
      <p className="text-sm text-stone max-w-xs">
        Virtual try-on is on the roadmap. Once it ships, your generated looks will show up here.
      </p>
    </div>
  );
}
