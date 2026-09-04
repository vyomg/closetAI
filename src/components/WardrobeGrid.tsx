import { ClothingCard } from "@/components/ClothingCard";
import type { ClothingItemDTO } from "@/lib/clientTypes";

export function WardrobeGrid({ items }: { items: ClothingItemDTO[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line py-20 text-center">
        <p className="text-ink-soft">No items match these filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
      {items.map((item) => (
        <ClothingCard key={item.id} item={item} />
      ))}
    </div>
  );
}
