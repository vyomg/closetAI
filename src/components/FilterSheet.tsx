"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { CATEGORY_LIST } from "@/lib/constants";
import { ClearButton } from "@/components/ui/ClearButton";
import { Button } from "@/components/ui/Button";
import type { SortOption } from "@/components/FilterBar";

export function FilterSheet({
  open,
  onClose,
  category,
  onCategory,
  sort,
  onSort,
  hasActiveFilters,
  onClearAll,
}: {
  open: boolean;
  onClose: () => void;
  category: string;
  onCategory: (v: string) => void;
  sort: SortOption;
  onSort: (v: SortOption) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
}) {
  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 bg-ink/40" onClick={onClose}>
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-paper p-6 animate-fade-up max-h-[80vh] overflow-y-auto"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="font-display text-xl">Filters</p>
          <button onClick={onClose} className="cursor-pointer p-1 -m-1" aria-label="Close filters">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs uppercase tracking-wide text-stone mb-2.5">Category</p>
        <div className="flex flex-wrap gap-1.5 mb-6">
          {["All", ...CATEGORY_LIST].map((c) => (
            <button
              key={c}
              onClick={() => onCategory(c)}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm transition-colors cursor-pointer min-h-11",
                category === c ? "bg-ink text-paper" : "bg-paper-alt text-ink-soft"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <p className="text-xs uppercase tracking-wide text-stone mb-2.5">Sort by</p>
        <div className="flex flex-col gap-1.5 mb-6">
          {(
            [
              { value: "recent", label: "Recently added" },
              { value: "mostWorn", label: "Most worn" },
              { value: "leastWorn", label: "Least worn" },
            ] as { value: SortOption; label: string }[]
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSort(opt.value)}
              className={cn(
                "rounded-xl px-3.5 py-3 text-sm text-left transition-colors cursor-pointer min-h-11",
                sort === opt.value ? "bg-paper-alt font-medium" : "hover:bg-paper-alt"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <ClearButton show={hasActiveFilters} onClick={onClearAll} className="min-h-11" />
          <Button onClick={onClose} className="flex-1 min-h-11">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
