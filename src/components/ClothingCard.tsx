import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { ClothingItemDTO } from "@/lib/clientTypes";

export function ClothingCard({ item }: { item: ClothingItemDTO }) {
  return (
    <Link
      href={`/wardrobe/${item.id}`}
      className="group block rounded-2xl border border-line bg-white overflow-hidden transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(23,22,15,0.15)]"
    >
      <div className="relative aspect-[4/5] bg-paper-alt overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {item.uncertainFields.length > 0 && (
          <Badge tone="warning" className="absolute top-3 left-3">
            Review details
          </Badge>
        )}
        {item.isDemo && (
          <Badge className="absolute top-3 right-3 bg-white/90">Demo</Badge>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <p className="text-xs text-stone mt-0.5">
          {item.primaryColor} · {item.subcategory}
        </p>
      </div>
    </Link>
  );
}
