"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Luggage } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { BrandLoading } from "@/components/Brand";

type TripSummary = {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  occasions: string[];
  outfitCount: number;
};

export default function TripsPage() {
  const [trips, setTrips] = useState<TripSummary[] | null>(null);

  useEffect(() => {
    fetch("/api/trips")
      .then((r) => r.json())
      .then(setTrips);
  }, []);

  return (
    <div>
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="font-display text-4xl">Trips</h1>
          <p className="text-stone mt-2">Saved trip wardrobes, built from your own closet.</p>
        </div>
        <LinkButton href="/pack">Plan a new trip</LinkButton>
      </div>

      {trips === null ? (
        <BrandLoading />
      ) : trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-24 text-center">
          <Luggage className="h-6 w-6 text-stone mx-auto mb-3" strokeWidth={1.5} />
          <p className="font-display text-2xl mb-3">No trips saved yet.</p>
          <p className="text-stone mb-8">Build a packing list and save it to keep the plan.</p>
          <LinkButton href="/pack">Plan a trip</LinkButton>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/trips/${trip.id}`}
              className="rounded-2xl border border-line bg-white p-5 hover:border-ink/30 transition-colors"
            >
              <p className="flex items-center gap-1.5 font-medium mb-1">
                <MapPin className="h-4 w-4 text-ink-soft" /> {trip.destination}
              </p>
              <p className="text-xs text-stone mb-3">
                {trip.startDate} → {trip.endDate}
              </p>
              <p className="text-sm text-ink-soft">{trip.outfitCount} outfit{trip.outfitCount === 1 ? "" : "s"} planned</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
