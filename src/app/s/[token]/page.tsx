import Image from "next/image";
import { notFound } from "next/navigation";
import { Shirt } from "lucide-react";
import { db } from "@/lib/db";
import { outfitToPublicJSON } from "@/lib/serializers";
import { ShareActions } from "@/components/ShareActions";
import { Brand } from "@/components/Brand";

const SLOT_ORDER = ["outerwear", "top", "bottom", "shoes", "accessory"];
const SLOT_LABEL: Record<string, string> = {
  outerwear: "Outerwear",
  top: "Top",
  bottom: "Bottom",
  shoes: "Shoes",
  accessory: "Accessory",
};

export default async function SharedOutfitPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const shared = await db.sharedOutfit.findUnique({
    where: { token },
    include: { outfit: { include: { items: { include: { clothingItem: true } } } } },
  });

  if (!shared || shared.revoked) notFound();

  const outfit = outfitToPublicJSON(shared.outfit);
  const grouped = SLOT_ORDER.map((slot) => ({ slot, items: outfit.items.filter((i) => i.slot === slot) })).filter(
    (g) => g.items.length > 0
  );

  return (
    <div className="flex-1 flex items-start sm:items-center justify-center px-6 py-14">
      <div className="w-full max-w-lg animate-fade-up">
        <Brand href="/" size="sm" className="mb-8" />

        <div className="rounded-2xl border border-line bg-white overflow-hidden">
          <div className="p-6 sm:p-7">
            <p className="text-xs uppercase tracking-wide text-stone mb-1">
              {outfit.occasion} · {outfit.style}
            </p>
            <p className="font-display text-2xl mb-6">Score {outfit.overallScore}%</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {grouped.map((group) =>
                group.items.map((item, i) => (
                  <div key={`${group.slot}-${i}`}>
                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-line bg-paper-alt">
                      <Image src={item.imageUrl} alt={item.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                    </div>
                    <p className="text-xs text-stone mt-2">{SLOT_LABEL[group.slot]}</p>
                    <p className="text-sm font-medium truncate">{item.name}</p>
                  </div>
                ))
              )}
            </div>

            <p className="text-sm text-ink-soft leading-relaxed">{outfit.explanation}</p>
          </div>

          <div className="border-t border-line px-6 sm:px-7 py-4 flex items-center justify-between">
            <p className="text-xs text-stone flex items-center gap-1.5">
              <Shirt className="h-3.5 w-3.5" /> Styled with matchin'
            </p>
            <ShareActions url={`/s/${token}`} title={`${outfit.occasion} outfit`} />
          </div>
        </div>
      </div>
    </div>
  );
}
