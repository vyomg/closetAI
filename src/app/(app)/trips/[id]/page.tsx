"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OutfitCard } from "@/components/OutfitCard";
import { BrandLoading } from "@/components/Brand";
import type { OutfitDTO } from "@/lib/clientTypes";

type TripDetail = {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  occasions: string[];
  outfits: OutfitDTO[];
  packingItems: { id: string; note: string | null; item: { id: string; name: string; imageUrl: string } }[];
};

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const [trip, setTrip] = useState<TripDetail | null>(null);

  useEffect(() => {
    fetch(`/api/trips/${id}`)
      .then((r) => r.json())
      .then(setTrip);
  }, [id]);

  async function removeTrip() {
    if (!confirm("Delete this trip? Its outfits will stay in your outfit history.")) return;
    await fetch(`/api/trips/${id}`, { method: "DELETE" });
    router.push("/trips");
  }

  if (!trip) return <BrandLoading />;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="flex items-center gap-1.5 font-display text-3xl mb-2">
            <MapPin className="h-6 w-6 text-ink-soft" /> {trip.destination}
          </p>
          <p className="text-stone">
            {trip.startDate} → {trip.endDate}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={removeTrip}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete trip
        </Button>
      </div>

      {trip.outfits.length === 0 ? (
        <p className="text-stone">No outfits were generated for this trip.</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          {trip.outfits.map((outfit) => (
            <OutfitCard key={outfit.id} outfit={outfit} showSocialActions showFeedback={false} />
          ))}
        </div>
      )}

      {trip.packingItems.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-4">Also pack</h2>
          <ul className="space-y-2">
            {trip.packingItems.map((p) => (
              <li key={p.id} className="text-sm text-ink-soft">
                {p.item.name}
                {p.note ? ` — ${p.note}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
