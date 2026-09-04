"use client";

import { useEffect, useState, use as usePromise } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { StyleSelector } from "@/components/StyleSelector";
import { Badge } from "@/components/ui/Badge";
import { CATEGORIES, CATEGORY_LIST, FIT_OPTIONS, SEASONS, type Category } from "@/lib/constants";
import type { ClothingItemDTO } from "@/lib/clientTypes";

export default function ClothingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const [item, setItem] = useState<ClothingItemDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [pairingsInput, setPairingsInput] = useState("");

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
    return <div className="text-stone">Loading…</div>;
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

  const subcategoryOptions = CATEGORIES[item.category as Category] ?? [];

  return (
    <div>
      <Link href="/wardrobe" className="text-sm text-stone hover:text-ink transition-colors">
        ← Back to wardrobe
      </Link>

      <div className="mt-6 grid md:grid-cols-2 gap-10">
        <div>
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-line bg-paper-alt">
            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-stone">
            <span>Worn {item.wearCount} time{item.wearCount === 1 ? "" : "s"}</span>
            <button onClick={remove} className="inline-flex items-center gap-1.5 text-warning hover:underline cursor-pointer">
              <Trash2 className="h-3.5 w-3.5" /> Remove item
            </button>
          </div>
        </div>

        <div>
          {item.uncertainFields.length > 0 && (
            <div className="mb-6 rounded-xl bg-[#f4e6d8] px-4 py-3 text-sm text-warning flex gap-2">
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
