"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { BRAND_CATALOG } from "@/lib/constants";

// Category-grouped, searchable brand picker — used in onboarding and again
// in Style Preferences so brand affinity can be set once and edited later,
// not just captured one time during onboarding.
export function BrandPicker({ selected, onChange }: { selected: string[]; onChange: (next: string[]) => void }) {
  const [search, setSearch] = useState("");

  function toggle(brand: string) {
    onChange(selected.includes(brand) ? selected.filter((b) => b !== brand) : [...selected, brand]);
  }

  const categories = Object.entries(BRAND_CATALOG)
    .map(([cat, brands]) => [cat, brands.filter((b) => b.toLowerCase().includes(search.toLowerCase()))] as const)
    .filter(([, brands]) => brands.length > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="relative flex-1 mr-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands…"
            className="w-full rounded-full border border-line bg-paper px-4 py-2 pl-9 text-sm outline-none focus:border-ink"
          />
        </div>
        <p className="text-xs text-stone shrink-0">{selected.length} selected</p>
      </div>
      <div className="flex gap-3 mb-4 text-xs">
        <button onClick={() => onChange([])} className="text-ink-soft hover:text-ink underline underline-offset-4 cursor-pointer">
          Clear
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto space-y-5 pr-1">
        {categories.map(([cat, brands]) => (
          <div key={cat}>
            <p className="text-xs uppercase tracking-wide text-stone mb-2">{cat}</p>
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => toggle(b)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm transition-colors cursor-pointer",
                    selected.includes(b) ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink/40"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
