"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bookmark, Plus, X, Trash2, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { BrandLoading, Spark } from "@/components/Brand";
import { FloatingWords } from "@/components/FloatingWords";
import { CATEGORY_LIST } from "@/lib/constants";

type WishlistItemDTO = {
  id: string;
  name: string;
  imageUrl: string | null;
  category: string | null;
  retailer: string | null;
  sourceUrl: string | null;
  price: number | null;
  currency: string | null;
  notes: string | null;
  createdAt: string;
};

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItemDTO[] | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then(setItems);
  }, []);

  async function remove(id: string) {
    setItems((prev) => prev?.filter((i) => i.id !== id) ?? null);
    await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
  }

  function askMatchin(item: WishlistItemDTO) {
    router.push(`/chat?ask=${encodeURIComponent(`If I bought the ${item.name}, how many outfits could I make with my current wardrobe?`)}`);
  }

  if (!items) return <BrandLoading />;

  return (
    <div className="max-w-5xl">
      <div className="relative rounded-2xl bg-graphite text-white p-6 sm:p-8 mb-8">
        <FloatingWords words={["WANT", "SAVE", "NEXT", "✦"]} />
        <div className="flex items-center justify-between gap-4 flex-wrap relative">
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-white/40 mb-3">wishlist</p>
            <h1 className="font-display text-3xl sm:text-4xl mb-2">things you want.</h1>
            <p className="text-sm text-white/50 max-w-md">
              Not your wardrobe — just what you&apos;re eyeing. matchin&apos; can tell you how it&apos;d fit in.
            </p>
          </div>
          <Button variant="lime" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add New
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20">
          <Bookmark className="h-8 w-8 text-stone mb-4" strokeWidth={1.5} />
          <p className="font-display text-lg mb-1">Your wishlist is empty</p>
          <p className="text-sm text-stone mb-6 max-w-xs">
            Tap &quot;Add New&quot; to save items from Zara, H&amp;M, Myntra, or any store.
          </p>
          <Button variant="lime" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add New
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-line bg-paper-alt overflow-hidden group">
              <div className="relative aspect-[4/5] bg-paper">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill sizes="300px" className="object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <Bookmark className="h-6 w-6 text-stone" strokeWidth={1.5} />
                  </div>
                )}
                <button
                  onClick={() => remove(item.id)}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-paper/90 flex items-center justify-center text-ink-soft hover:text-warning transition-colors cursor-pointer"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-stone mt-0.5">
                  {[item.category, item.retailer].filter(Boolean).join(" · ") || "No details added"}
                </p>
                {item.price != null && (
                  <p className="text-sm font-display mt-1">
                    {item.currency ?? ""} {item.price}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => askMatchin(item)}
                    className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" /> Ask matchin&apos;
                  </button>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink"
                    >
                      <ExternalLink className="h-3 w-3" /> View
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <AddWishlistModal
          onClose={() => setAdding(false)}
          onAdded={(item) => {
            setItems((prev) => [item, ...(prev ?? [])]);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}

function AddWishlistModal({ onClose, onAdded }: { onClose: () => void; onAdded: (item: WishlistItemDTO) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [retailer, setRetailer] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const formData = new FormData();
    formData.append("name", name);
    if (category) formData.append("category", category);
    if (retailer) formData.append("retailer", retailer);
    if (sourceUrl) formData.append("sourceUrl", sourceUrl);
    if (price) formData.append("price", price);
    if (notes) formData.append("notes", notes);
    if (file) formData.append("image", file);

    const res = await fetch("/api/wishlist", { method: "POST", body: formData });
    setSaving(false);
    if (res.ok) onAdded(await res.json());
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div
        className="bg-paper rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl">Add to wishlist</h3>
          <button onClick={onClose} className="cursor-pointer p-1 -m-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Item name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Oversized denim jacket" />
          </div>
          <div>
            <Label>Photo (optional)</Label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-paper-alt file:px-3.5 file:py-2 file:text-sm file:cursor-pointer"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Not set</option>
                {CATEGORY_LIST.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Price</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div>
            <Label>Retailer</Label>
            <Input value={retailer} onChange={(e) => setRetailer(e.target.value)} placeholder="e.g. Zara, H&M, Myntra" />
          </div>
          <div>
            <Label>Link</Label>
            <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why you want it…" />
          </div>
        </div>

        <Button onClick={save} disabled={!name.trim() || saving} className="w-full mt-6">
          {saving ? "Saving…" : "Save to wishlist"}
        </Button>
      </div>
    </div>
  );
}
