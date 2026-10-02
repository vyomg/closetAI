"use client";

import { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { RETAILERS, RETAILER_QUICK_FILTERS } from "@/lib/retailers";

export function RetailerSearchSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = useMemo(() => {
    const filterFn = RETAILER_QUICK_FILTERS.find((f) => f.label === activeFilter)?.test ?? (() => true);
    const q = query.trim().toLowerCase();
    return RETAILERS.filter(filterFn).filter((r) => !q || r.name.toLowerCase().includes(q)).slice(0, 40);
  }, [query, activeFilter]);

  function toggle(name: string) {
    onChange(selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]);
  }

  return (
    <div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink text-paper px-3 py-1.5 text-xs"
            >
              {name}
              <button onClick={() => toggle(name)} className="cursor-pointer hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search brands or stores…"
          className="w-full rounded-xl border border-line bg-paper-alt pl-9 pr-4 py-2.5 text-sm outline-none focus:border-ink"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 mb-3">
        {RETAILER_QUICK_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setActiveFilter(f.label)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors cursor-pointer",
              activeFilter === f.label ? "bg-ink text-paper" : "bg-paper-alt text-ink-soft hover:bg-line"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="max-h-56 overflow-y-auto rounded-xl border border-line divide-y divide-line">
        {filtered.length === 0 ? (
          <p className="text-sm text-stone px-3.5 py-3">No stores match that search.</p>
        ) : (
          filtered.map((retailer) => {
            const active = selected.includes(retailer.name);
            return (
              <button
                key={retailer.id}
                onClick={() => toggle(retailer.name)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition-colors cursor-pointer",
                  active ? "bg-paper-alt" : "hover:bg-paper-alt/60"
                )}
              >
                <span className="flex items-center gap-2">
                  <span className={cn("h-4 w-4 rounded-full border flex items-center justify-center", active ? "border-ink bg-ink" : "border-line")}>
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-paper" />}
                  </span>
                  {retailer.name}
                </span>
                <span className="text-[11px] text-stone">{retailer.categories[0]}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
