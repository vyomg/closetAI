"use client";

import { useState } from "react";
import Image from "next/image";
import { comboForStyle, STYLE_DISCOVERY_OPTIONS, type WheelItem } from "@/lib/publicFashion";
import { Chip } from "@/components/ui/Chip";

// "Your style is not a template" — explore a few directions, no account and
// no onboarding survey required. Picking a chip composes a fresh combo from
// the same unisex item pool the wheel uses (see publicFashion.ts), so this
// is a real preview of the same logic, not a canned screenshot.
export function StyleDiscovery() {
  const [active, setActive] = useState<string | null>(null);
  const [combo, setCombo] = useState<WheelItem[]>([]);

  function pick(style: string) {
    setActive(style);
    setCombo(comboForStyle(style));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2.5 mb-8">
        {STYLE_DISCOVERY_OPTIONS.map((style) => (
          <Chip key={style} active={active === style} onClick={() => pick(style)}>
            {style}
          </Chip>
        ))}
      </div>

      {combo.length > 0 ? (
        <div className="grid grid-cols-4 gap-3 max-w-lg animate-fade-in" key={active}>
          {combo.map((item) => (
            <div key={item.imageUrl} className="relative aspect-[4/5] rounded-xl overflow-hidden bg-paper-alt">
              <Image src={item.imageUrl} alt={`${item.primaryColor} ${item.category}`} fill sizes="140px" className="object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone">Pick a direction above to see a matching look.</p>
      )}
    </div>
  );
}
