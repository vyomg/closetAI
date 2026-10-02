"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ClearButton } from "@/components/ui/ClearButton";
import { Input, Label } from "@/components/ui/Field";
import { StyleSelector } from "@/components/StyleSelector";
import { Chip } from "@/components/ui/Chip";
import { RetailerSearchSelect } from "@/components/RetailerSearchSelect";
import { cn } from "@/lib/cn";
import {
  COLOR_PALETTE,
  CATEGORIES,
  CATEGORY_LIST,
  SHOPPING_PRIORITIES,
  SHOPPING_FITS,
  MATERIAL_OPTIONS,
  SHOPPING_MODES,
  BUDGET_PRESETS,
  type Category,
} from "@/lib/constants";
import { CURRENCIES, formatCurrency, getCurrencyOption, resolveAutoCurrency } from "@/lib/currency";
import type { ShoppingPreferenceDTO } from "@/lib/clientTypes";

const EMPTY_PREFS: ShoppingPreferenceDTO = {
  budgetMin: null,
  budgetMax: null,
  currency: "AUTO",
  preferredColors: [],
  avoidedColors: [],
  preferredCategories: [],
  preferredSubcategories: [],
  preferredRetailers: [],
  preferredFits: [],
  preferredMaterials: [],
  priorities: [],
  shoppingMode: "",
};

export function ShoppingPreferencesPanel({ onSaved }: { onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<ShoppingPreferenceDTO | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<Category | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoCurrency, setAutoCurrency] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/buy/preferences", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then(setPrefs)
      .catch(() => setPrefs({ ...EMPTY_PREFS }));

    fetch("/api/profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAutoCurrency(resolveAutoCurrency(data?.country ?? null, data?.countryCode ?? null)))
      .catch(() => {});
  }, []);

  if (!prefs) return null;

  function set<K extends keyof ShoppingPreferenceDTO>(key: K, value: ShoppingPreferenceDTO[K]) {
    setPrefs((p) => (p ? { ...p, [key]: value } : p));
    setSaved(false);
  }

  function toggleSubcategory(category: Category, subcategory: string) {
    const key = `${category}::${subcategory}`;
    const has = prefs!.preferredSubcategories.includes(key);
    const nextSubs = has
      ? prefs!.preferredSubcategories.filter((k) => k !== key)
      : [...prefs!.preferredSubcategories, key];

    const categoryStillSelected = nextSubs.some((k) => k.startsWith(`${category}::`));
    const nextCategories = categoryStillSelected
      ? Array.from(new Set([...prefs!.preferredCategories, category]))
      : prefs!.preferredCategories.filter((c) => c !== category);

    setPrefs((p) => (p ? { ...p, preferredSubcategories: nextSubs, preferredCategories: nextCategories } : p));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/buy/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    setSaved(true);
    if (data) setPrefs((p) => (p ? { ...p, budgetMin: data.budgetMin, budgetMax: data.budgetMax } : p));
    onSaved?.();
    setTimeout(() => setSaved(false), 2000);
  }

  const isAuto = prefs.currency === "AUTO";
  const resolvedCurrency = isAuto ? autoCurrency : prefs.currency;
  const currencyOption = resolvedCurrency ? getCurrencyOption(resolvedCurrency) : null;
  const currencyLabel = resolvedCurrency
    ? `${isAuto ? "Auto — " : ""}${resolvedCurrency} (${currencyOption?.symbol})`
    : "Auto — waiting for location";

  const summaryParts = [
    prefs.budgetMin || prefs.budgetMax
      ? resolvedCurrency
        ? `Budget ${prefs.budgetMin ? formatCurrency(prefs.budgetMin, resolvedCurrency) : "0"}–${prefs.budgetMax ? formatCurrency(prefs.budgetMax, resolvedCurrency) : "∞"}`
        : `Budget ${prefs.budgetMin ?? 0}–${prefs.budgetMax ?? "∞"}`
      : null,
    prefs.preferredSubcategories.length > 0 ? `${prefs.preferredSubcategories.length} item type${prefs.preferredSubcategories.length === 1 ? "" : "s"} selected` : null,
  ].filter(Boolean);

  const hasAnyPreference =
    prefs.budgetMin !== null ||
    prefs.budgetMax !== null ||
    prefs.currency !== "AUTO" ||
    prefs.preferredColors.length > 0 ||
    prefs.avoidedColors.length > 0 ||
    prefs.preferredCategories.length > 0 ||
    prefs.preferredSubcategories.length > 0 ||
    prefs.preferredRetailers.length > 0 ||
    prefs.preferredFits.length > 0 ||
    prefs.preferredMaterials.length > 0 ||
    prefs.priorities.length > 0 ||
    prefs.shoppingMode !== "";

  function resetAll() {
    setPrefs({ ...EMPTY_PREFS });
    setSaved(false);
  }

  return (
    <div className="rounded-2xl border border-line bg-white overflow-hidden mb-8">
      <div className="w-full flex items-center gap-3 p-5 sm:p-6">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 min-w-0 flex items-center justify-between gap-4 text-left cursor-pointer"
        >
          <div className="min-w-0">
            <p className="font-medium">Shopping preferences</p>
            <p className="text-sm text-stone mt-0.5 truncate">{summaryParts.length > 0 ? summaryParts.join(" · ") : "Not set"}</p>
          </div>
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
        </button>
        <ClearButton show={hasAnyPreference} onClick={resetAll} label="Reset" className="shrink-0" />
      </div>

      {open && (
        <div className="px-5 sm:px-6 pb-6 space-y-7 border-t border-line pt-6 animate-fade-in">
          <div>
            <Label>What are you shopping for?</Label>
            <StyleSelector
              options={SHOPPING_MODES}
              selected={prefs.shoppingMode ? [prefs.shoppingMode] : []}
              onChange={(v) => set("shoppingMode", v[0] ?? "")}
              multiple={false}
            />
          </div>

          <div>
            <Label>Item types</Label>
            <p className="text-xs text-stone mb-3 -mt-1">
              Pick a category to reveal its item types. Selecting any item type adds it to your request.
            </p>
            <div className="space-y-2">
              {CATEGORY_LIST.map((category) => {
                const isExpanded = expandedCategory === category;
                const selectedCount = prefs.preferredSubcategories.filter((k) => k.startsWith(`${category}::`)).length;
                return (
                  <div key={category} className="rounded-xl border border-line overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : category)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer hover:bg-paper-alt transition-colors"
                    >
                      <span className="text-sm font-medium flex items-center gap-2">
                        {category}
                        {selectedCount > 0 && (
                          <span className="rounded-full bg-ink text-paper text-[11px] px-2 py-0.5">{selectedCount}</span>
                        )}
                      </span>
                      <ChevronDown className={cn("h-4 w-4 text-stone transition-transform", isExpanded && "rotate-180")} />
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 flex flex-wrap gap-2 animate-fade-in">
                        {CATEGORIES[category].map((subcategory) => {
                          const key = `${category}::${subcategory}`;
                          const active = prefs.preferredSubcategories.includes(key);
                          return (
                            <Chip key={key} active={active} onClick={() => toggleSubcategory(category, subcategory)}>
                              {active && <Check className="h-3 w-3 mr-1 inline" />}
                              {subcategory}
                            </Chip>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="mb-0">Currency</Label>
              <button
                onClick={() => setShowCurrencyPicker((s) => !s)}
                className="text-xs text-ink-soft hover:text-ink underline underline-offset-4 cursor-pointer"
              >
                {isAuto ? "Change currency" : "Return to Auto"}
              </button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="rounded-full bg-paper-alt px-3.5 py-1.5 text-sm">{currencyLabel}</span>
              {!isAuto && <span className="rounded-full bg-[#f4e6d8] text-warning px-2.5 py-1 text-[11px]">Manual override</span>}
            </div>
            {showCurrencyPicker && (
              <div className="flex flex-wrap gap-2 mb-3 animate-fade-in">
                <Chip
                  active={isAuto}
                  onClick={() => {
                    set("currency", "AUTO");
                    setShowCurrencyPicker(false);
                  }}
                >
                  Auto{autoCurrency ? ` (${autoCurrency})` : ""}
                </Chip>
                {CURRENCIES.map((c) => (
                  <Chip
                    key={c.code}
                    active={prefs.currency === c.code}
                    onClick={() => {
                      set("currency", c.code);
                      setShowCurrencyPicker(false);
                    }}
                  >
                    {c.code}
                  </Chip>
                ))}
              </div>
            )}

            <Label className="mt-4">Budget</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {BUDGET_PRESETS.map((preset) => {
                const active = prefs.budgetMin === preset.min && prefs.budgetMax === preset.max;
                return (
                  <Chip
                    key={preset.label}
                    active={active}
                    onClick={() => {
                      set("budgetMin", preset.min);
                      set("budgetMax", preset.max);
                    }}
                  >
                    {preset.label}
                  </Chip>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <Input
                type="number"
                min={0}
                value={prefs.budgetMin ?? ""}
                onChange={(e) => set("budgetMin", e.target.value ? Number(e.target.value) : null)}
                placeholder="Min"
              />
              <Input
                type="number"
                min={0}
                value={prefs.budgetMax ?? ""}
                onChange={(e) => set("budgetMax", e.target.value ? Number(e.target.value) : null)}
                placeholder="No limit"
              />
            </div>
            {(prefs.budgetMin || prefs.budgetMax) && (
              <p className="text-xs text-stone mt-2">
                {resolvedCurrency
                  ? `Shown as ${formatCurrency(prefs.budgetMin ?? 0, resolvedCurrency)}${prefs.budgetMax ? ` – ${formatCurrency(prefs.budgetMax, resolvedCurrency)}` : ""}. Switching currency converts this amount so your budget stays the same in real terms.`
                  : "Set your location in Settings to see this budget formatted in your currency."}
              </p>
            )}
          </div>

          <div>
            <Label>Preferred colours to buy in</Label>
            <StyleSelector options={COLOR_PALETTE} selected={prefs.preferredColors} onChange={(v) => set("preferredColors", v)} />
          </div>

          <div>
            <Label>Colours to avoid</Label>
            <StyleSelector options={COLOR_PALETTE} selected={prefs.avoidedColors} onChange={(v) => set("avoidedColors", v)} />
          </div>

          <div>
            <Label>Preferred stores & brands</Label>
            <RetailerSearchSelect selected={prefs.preferredRetailers} onChange={(v) => set("preferredRetailers", v)} />
          </div>

          <div>
            <Label>Why are you shopping?</Label>
            <StyleSelector options={SHOPPING_PRIORITIES} selected={prefs.priorities} onChange={(v) => set("priorities", v)} />
          </div>

          <button
            onClick={() => setShowMore((s) => !s)}
            className="text-sm text-ink-soft hover:text-ink underline underline-offset-4 cursor-pointer"
          >
            {showMore ? "Hide fit & material preferences" : "More preferences (fit, material)"}
          </button>

          {showMore && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <Label>Fit</Label>
                <StyleSelector options={SHOPPING_FITS} selected={prefs.preferredFits} onChange={(v) => set("preferredFits", v)} />
              </div>
              <div>
                <Label>Material</Label>
                <StyleSelector
                  options={MATERIAL_OPTIONS}
                  selected={prefs.preferredMaterials}
                  onChange={(v) => set("preferredMaterials", v)}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button onClick={save} disabled={saving} size="sm">
              {saving ? "Saving…" : "Save preferences"}
            </Button>
            {saved && <span className="text-sm text-success">Saved</span>}
          </div>
        </div>
      )}
    </div>
  );
}
