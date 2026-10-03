"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { CATEGORY_LIST } from "@/lib/constants";
import { FilterSheet } from "@/components/FilterSheet";
import { ClearButton } from "@/components/ui/ClearButton";

export type SortOption = "recent" | "mostWorn" | "leastWorn";

const DEFAULT_SORT: SortOption = "recent";

export function FilterBar({
  category,
  onCategory,
  search,
  onSearch,
  sort,
  onSort,
  brand,
  onBrand,
  brandOptions,
  season,
  onSeason,
  seasonOptions,
}: {
  category: string;
  onCategory: (v: string) => void;
  search: string;
  onSearch: (v: string) => void;
  sort: SortOption;
  onSort: (v: SortOption) => void;
  brand: string;
  onBrand: (v: string) => void;
  brandOptions: string[];
  season: string;
  onSeason: (v: string) => void;
  seasonOptions: string[];
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasActiveFilters =
    category !== "All" || sort !== DEFAULT_SORT || search.trim() !== "" || brand !== "All" || season !== "All";
  const activeFilterCount =
    (category !== "All" ? 1 : 0) +
    (sort !== DEFAULT_SORT ? 1 : 0) +
    (search.trim() !== "" ? 1 : 0) +
    (brand !== "All" ? 1 : 0) +
    (season !== "All" ? 1 : 0);

  function clearAll() {
    onCategory("All");
    onSort(DEFAULT_SORT);
    onSearch("");
    onBrand("All");
    onSeason("All");
  }

  return (
    <>
      {/* Desktop: everything inline, filters always visible. */}
      <div className="hidden lg:flex lg:items-center lg:justify-between gap-4 mb-8">
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...CATEGORY_LIST].map((c) => (
            <button
              key={c}
              onClick={() => onCategory(c)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm transition-colors cursor-pointer",
                category === c ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-alt"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ClearButton show={hasActiveFilters} onClick={clearAll} />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search wardrobe…"
            className="rounded-full border border-line bg-paper-alt px-4 py-2 text-sm outline-none focus:border-ink w-52"
          />
          {brandOptions.length > 0 && (
            <select
              value={brand}
              onChange={(e) => onBrand(e.target.value)}
              className="shrink-0 rounded-full border border-line bg-paper-alt px-3.5 py-2 text-sm outline-none focus:border-ink cursor-pointer"
            >
              <option value="All">All brands</option>
              {brandOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}
          {seasonOptions.length > 0 && (
            <select
              value={season}
              onChange={(e) => onSeason(e.target.value)}
              className="shrink-0 rounded-full border border-line bg-paper-alt px-3.5 py-2 text-sm outline-none focus:border-ink cursor-pointer"
            >
              <option value="All">All seasons</option>
              {seasonOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
          <select
            value={sort}
            onChange={(e) => onSort(e.target.value as SortOption)}
            className="shrink-0 rounded-full border border-line bg-paper-alt px-3.5 py-2 text-sm outline-none focus:border-ink cursor-pointer"
          >
            <option value="recent">Recently added</option>
            <option value="mostWorn">Most worn</option>
            <option value="leastWorn">Least worn</option>
          </select>
        </div>
      </div>

      {/* Mobile: search bar + a "Filters" button that opens a bottom sheet, so
          filters don't take over the page (per product spec). */}
      <div className="lg:hidden flex items-center gap-2.5 mb-6">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search wardrobe…"
          className="flex-1 min-w-0 rounded-full border border-line bg-paper-alt px-4 py-2.5 text-sm outline-none focus:border-ink"
        />
        <button
          onClick={() => setSheetOpen(true)}
          className="relative shrink-0 flex items-center gap-1.5 rounded-full border border-line bg-paper-alt px-4 py-2.5 text-sm cursor-pointer min-h-11"
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[10px] text-paper">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        category={category}
        onCategory={onCategory}
        sort={sort}
        onSort={onSort}
        hasActiveFilters={hasActiveFilters}
        onClearAll={clearAll}
        brand={brand}
        onBrand={onBrand}
        brandOptions={brandOptions}
        season={season}
        onSeason={onSeason}
        seasonOptions={seasonOptions}
      />
    </>
  );
}
