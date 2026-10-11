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
        <div className="grid grid-cols-4 gap-2.5 max-w-md" key={active}>
          {combo.map((item, i) => (
            <div
              key={item.imageUrl}
              className="relative aspect-[4/5] rounded-lg overflow-hidden bg-paper-alt animate-fade-up transition-transform duration-200 hover:scale-105"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Image src={item.imageUrl} alt={`${item.primaryColor} ${item.category}`} fill sizes="110px" className="object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone">Pick a direction above to see a matching look.</p>
      )}
    </div>
  );
}
