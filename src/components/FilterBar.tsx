"use client";

import { cn } from "@/lib/cn";
import { CATEGORY_LIST } from "@/lib/constants";

export type SortOption = "recent" | "mostWorn" | "leastWorn";

export function FilterBar({
  category,
  onCategory,
  search,
  onSearch,
  sort,
  onSort,
}: {
  category: string;
  onCategory: (v: string) => void;
  search: string;
  onSearch: (v: string) => void;
  sort: SortOption;
  onSort: (v: SortOption) => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
      <div className="flex flex-wrap gap-1.5">
        {["All", ...CATEGORY_LIST].map((c) => (
          <button
            key={c}
            onClick={() => onCategory(c)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm transition-colors cursor-pointer",
              category === c ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-alt"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search wardrobe…"
          className="rounded-full border border-line bg-white px-4 py-2 text-sm outline-none focus:border-ink w-44"
        />
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as SortOption)}
          className="rounded-full border border-line bg-white px-3.5 py-2 text-sm outline-none focus:border-ink cursor-pointer"
        >
          <option value="recent">Recently added</option>
          <option value="mostWorn">Most worn</option>
          <option value="leastWorn">Least worn</option>
        </select>
      </div>
    </div>
  );
}
