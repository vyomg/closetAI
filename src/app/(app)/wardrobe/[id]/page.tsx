"use client";

import { useEffect, useState, use as usePromise } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, Sparkles, RefreshCw } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { StyleSelector } from "@/components/StyleSelector";
import { Badge } from "@/components/ui/Badge";
import { CATEGORIES, CATEGORY_LIST, FIT_OPTIONS, SEASONS, type Category } from "@/lib/constants";
import { BrandLoading } from "@/components/Brand";
import type { ClothingItemDTO } from "@/lib/clientTypes";
import type { ClothingAnalysis } from "@/lib/types";

export default function ClothingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const [item, setItem] = useState<ClothingItemDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [pairingsInput, setPairingsInput] = useState("");
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalysis, setReanalysis] = useState<ClothingAnalysis | null>(null);
  const [reanalyzeError, setReanalyzeError] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    fetch(`/api/clothing/${id}`)
      .then((r) => r.json())
      .then((data: ClothingItemDTO) => {
        setItem(data);
        setTagsInput(data.tags.join(", "));
        setPairingsInput(data.pairings.join(", "));
      });
  }, [id]);

  if (!item) {
    return <BrandLoading />;
  }

  function set<K extends keyof ClothingItemDTO>(key: K, value: ClothingItemDTO[K]) {
    setItem((i) => (i ? { ...i, [key]: value } : i));
    setSaved(false);
  }

  async function save() {
    if (!item) return;
    setSaving(true);
    const res = await fetch(`/api/clothing/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: item.name,
        category: item.category,
        subcategory: item.subcategory,
        primaryColor: item.primaryColor,
        secondaryColors: item.secondaryColors,
        pattern: item.pattern,
        material: item.material,
        fit: item.fit,
        style: item.style,
        brand: item.brand,
        formality: item.formality,
        season: item.season,
        sleeveLength: item.sleeveLength,
        occasions: item.occasions,
        pairings: pairingsInput.split(",").map((s) => s.trim()).filter(Boolean),
        tags: tagsInput.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function remove() {
    if (!confirm(`Remove "${item?.name}" from your wardrobe? This can't be undone.`)) return;
    await fetch(`/api/clothing/${item!.id}`, { method: "DELETE" });
    router.push("/wardrobe");
  }

  async function reanalyze() {
    setReanalyzing(true);
    setReanalyzeError(null);
    setReanalysis(null);
    const res = await fetch(`/api/clothing/${item!.id}/reanalyze`, { method: "POST" });
    const data = await res.json();
    setReanalyzing(false);
    if (!res.ok) {
      setReanalyzeError(data.error || "Re-analysis failed.");
      return;
    }
    setReanalysis(data.analysis);
  }

  function applyReanalysis() {
    if (!reanalysis) return;
    setItem((i) =>
      i
        ? {
            ...i,
            primaryColor: reanalysis.primaryColor,
            secondaryColors: reanalysis.secondaryColors,
            pattern: reanalysis.pattern,
            material: reanalysis.material,
            fit: reanalysis.fit,
            style: reanalysis.style,
            formality: reanalysis.formality,
            season: reanalysis.season,
            occasions: reanalysis.occasions,
            pairings: reanalysis.pairings,
            tags: reanalysis.tags,
          }
        : i
    );
    setTagsInput(reanalysis.tags.join(", "));
    setPairingsInput(reanalysis.pairings.join(", "));
    setReanalysis(null);
    setSaved(false);
  }

  const subcategoryOptions = CATEGORIES[item.category as Category] ?? [];

  return (
    <div>
      <Link href="/wardrobe" className="text-sm text-stone hover:text-ink transition-colors">
        ← Back to wardrobe
      </Link>

      <div className="mt-6 grid md:grid-cols-2 gap-10">
        <div>
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-line bg-paper-alt">
            <Image src={showOriginal ? item.originalImageUrl : item.imageUrl} alt={item.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-stone">
            <span>Worn {item.wearCount} time{item.wearCount === 1 ? "" : "s"}</span>
            <button onClick={remove} className="inline-flex items-center gap-1.5 text-warning hover:underline cursor-pointer">
              <Trash2 className="h-3.5 w-3.5" /> Remove item
            </button>
          </div>
          {item.hasProcessedImage && (
            <button
              onClick={() => setShowOriginal((s) => !s)}
              className="mt-2 text-xs text-stone hover:text-ink underline underline-offset-4 cursor-pointer"
            >
              {showOriginal ? "Show cleaned photo" : "View original photo"}
            </button>
          )}

          <div className="mt-5 flex flex-col gap-2.5">
            <LinkButton href={`/outfits/create?anchor=${item.id}`} className="w-full">
              <Sparkles className="h-4 w-4 mr-1.5" /> Style Me With This
            </LinkButton>
            <Button variant="outline" onClick={reanalyze} disabled={reanalyzing} className="w-full">
              <RefreshCw className={`h-4 w-4 mr-1.5 ${reanalyzing ? "animate-spin" : ""}`} />
              {reanalyzing ? "Re-analyzing…" : "Re-analyze with AI"}
            </Button>
          </div>

          {reanalyzeError && <p className="mt-3 text-sm text-warning">{reanalyzeError}</p>}

          {reanalysis && (
            <div className="mt-4 rounded-xl bg-paper-alt p-4">
              <p className="text-sm font-medium mb-2">New analysis</p>
              <div className="text-sm text-ink-soft space-y-1 mb-4">
                <p>
                  Formality: {item.formality}/5 → <strong>{reanalysis.formality}/5</strong>
                </p>
                <p>
                  Style: {item.style} → <strong>{reanalysis.style}</strong>
                </p>
                <p>
                  Fit: {item.fit} → <strong>{reanalysis.fit}</strong>
                </p>
              </div>
              <div className="flex gap-2.5">
                <Button size="sm" onClick={applyReanalysis}>
                  Apply changes
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReanalysis(null)}>
                  Discard
                </Button>
              </div>
            </div>
          )}
        </div>

        <div>
          {item.uncertainFields.length > 0 && (
            <div className="mb-6 rounded-xl bg-warning/15 px-4 py-3 text-sm text-warning flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                The AI wasn't fully confident about: {item.uncertainFields.join(", ")}. Please review and correct
                below.
              </span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <Label>Name</Label>
              <Input value={item.name} onChange={(e) => set("name", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={item.category}
                  onChange={(e) => {
                    const category = e.target.value as Category;
                    set("category", category);
                    set("subcategory", CATEGORIES[category][0]);
                  }}
                >
                  {CATEGORY_LIST.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Subcategory</Label>
                <Select value={item.subcategory} onChange={(e) => set("subcategory", e.target.value)}>
                  {subcategoryOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Primary colour</Label>
                <Input value={item.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} />
              </div>
              <div>
                <Label>Pattern</Label>
                <Input value={item.pattern} onChange={(e) => set("pattern", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fit</Label>
                <Select value={item.fit} onChange={(e) => set("fit", e.target.value)}>
                  {FIT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Style</Label>
                <Input value={item.style} onChange={(e) => set("style", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Formality — {item.formality}/5</Label>
              <input
                type="range"
                min={1}
                max={5}
                value={item.formality}
                onChange={(e) => set("formality", Number(e.target.value))}
                className="w-full accent-[var(--ink)]"
              />
            </div>

            <div>
              <Label>Material</Label>
              <Input value={item.material ?? ""} onChange={(e) => set("material", e.target.value)} placeholder="Unknown" />
            </div>

            <div>
              <Label>Brand</Label>
              <Input value={item.brand ?? ""} onChange={(e) => set("brand", e.target.value)} placeholder="Unknown" />
            </div>

            <div>
              <Label>Season</Label>
              <StyleSelector options={SEASONS} selected={item.season} onChange={(v) => set("season", v)} />
            </div>

            <div>
              <Label>Suitable occasions</Label>
              <OccasionsEditor value={item.occasions} onChange={(v) => set("occasions", v)} />
            </div>

            <div>
              <Label>Pairing suggestions (comma separated)</Label>
              <Textarea rows={2} value={pairingsInput} onChange={(e) => setPairingsInput(e.target.value)} />
            </div>

            <div>
              <Label>Tags (comma separated)</Label>
              <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              {saved && <span className="text-sm text-success">Saved</span>}
              {item.userEdited && <Badge>Edited by you</Badge>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OccasionsEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(value.join(", "));
  useEffect(() => setText(value.join(", ")), [value]);
  return (
    <Input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onChange(text.split(",").map((s) => s.trim()).filter(Boolean))}
      placeholder="Casual dinner, School event, Weekend outing"
    />
  );
}
