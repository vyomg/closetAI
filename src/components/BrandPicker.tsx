"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { BRAND_CATALOG, type BrandEntry } from "@/lib/constants";
import { BRANDS_WITHOUT_LOGO } from "@/lib/brandLogoStatus";

// A brand's own site favicon, used as a lightweight stand-in for its logo —
// never a fabricated mark. Google's favicon service never 404s with an
// empty response for an unresolvable domain: it serves a generic fallback
// icon, as its own HTTP body, under a 404 status. Browser-side, there is no
// reliable way to tell that fallback apart from a genuine small/simple logo
// (byte-size and pixel-dimension checks both produce false positives — e.g.
// Nike's real logo is only 398 bytes, smaller than several broken domains —
// and a hash comparison would work in principle but Google's favicon
// endpoint does not send CORS headers, so a client-side `fetch()` to it
// fails outright). So the hash comparison instead runs server-side, ahead
// of time, across every brandCatalog.ts domain — see brandLogoStatus.ts's
// header for how to regenerate it — and its result (the set of domains
// confirmed to have no real logo) is baked in here as a static lookup.
function useBrandLogoUrl(domain: string): { url: string | null } {
  if (BRANDS_WITHOUT_LOGO.has(domain)) return { url: null };
  return { url: `https://www.google.com/s2/favicons?domain=${domain}&sz=64` };
}

function BrandLogo({ brand }: { brand: BrandEntry }) {
  const { url } = useBrandLogoUrl(brand.domain);
  const [failed, setFailed] = useState(false);
  return (
    <span className="relative h-5 w-5 shrink-0 rounded-full bg-paper overflow-hidden flex items-center justify-center">
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- tiny external favicon, not worth Next/Image's optimizer
        <img src={url} alt="" width={20} height={20} className="h-full w-full object-contain" onError={() => setFailed(true)} />
      ) : (
        <span className="text-[9px] font-semibold text-ink-soft">{brand.name.charAt(0)}</span>
      )}
    </span>
  );
}

// Category-grouped, searchable, logo-bearing brand picker — used in
// onboarding and again in Style Preferences so brand affinity can be set
// once and edited later, not just captured one time during onboarding.
export function BrandPicker({ selected, onChange }: { selected: string[]; onChange: (next: string[]) => void }) {
  const [search, setSearch] = useState("");

  function toggle(name: string) {
    onChange(selected.includes(name) ? selected.filter((b) => b !== name) : [...selected, name]);
  }

  const categories = Object.entries(BRAND_CATALOG)
    .map(([cat, brands]) => [cat, brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))] as const)
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
        {categories.length === 0 && <p className="text-sm text-stone py-4 text-center">No brands match &quot;{search}&quot;.</p>}
        {categories.map(([cat, brands]) => (
          <div key={cat}>
            <p className="text-xs uppercase tracking-wide text-stone mb-2">{cat}</p>
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <button
                  key={b.name}
                  onClick={() => toggle(b.name)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border pl-1.5 pr-3.5 py-1.5 text-sm transition-colors cursor-pointer",
                    selected.includes(b.name) ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:border-ink/40"
                  )}
                >
                  <BrandLogo brand={b} />
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
