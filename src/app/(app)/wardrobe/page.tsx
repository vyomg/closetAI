"use client";

import { useEffect, useMemo, useState } from "react";
import { FilterBar, type SortOption } from "@/components/FilterBar";
import { WardrobeGrid } from "@/components/WardrobeGrid";
import { LinkButton } from "@/components/ui/Button";
import type { ClothingItemDTO } from "@/lib/clientTypes";

export default function WardrobePage() {
  const [items, setItems] = useState<ClothingItemDTO[] | null>(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("recent");

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    params.set("sort", sort);
    fetch(`/api/clothing?${params.toString()}`)
      .then((r) => r.json())
      .then(setItems);
  }, [category, sort]);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.primaryColor.toLowerCase().includes(q) ||
        i.subcategory.toLowerCase().includes(q) ||
        i.style.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [items, search]);

  return (
    <div>
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-display text-4xl">My Wardrobe</h1>
          <p className="text-stone mt-2">{items ? `${items.length} items` : "Loading…"}</p>
        </div>
        <LinkButton href="/wardrobe/add">Add clothing</LinkButton>
      </div>

      <FilterBar
        category={category}
        onCategory={setCategory}
        search={search}
        onSearch={setSearch}
        sort={sort}
        onSort={setSort}
      />

      {items === null ? (
        <GridSkeleton />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <WardrobeGrid items={filtered} />
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-line bg-white overflow-hidden">
          <div className="aspect-[4/5] bg-paper-alt animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-2/3 bg-paper-alt rounded animate-pulse" />
            <div className="h-3 w-1/3 bg-paper-alt rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-line py-24 text-center">
      <p className="font-display text-2xl mb-3">Your closet is empty.</p>
      <p className="text-stone mb-8">Add your first item and let ClosetAI start learning your wardrobe.</p>
      <LinkButton href="/wardrobe/add">Add your first item</LinkButton>
    </div>
  );
}
