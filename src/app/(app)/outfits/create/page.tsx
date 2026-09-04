"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OutfitGenerator } from "@/components/OutfitGenerator";

function CreateOutfitContent() {
  const params = useSearchParams();
  const anchor = params.get("anchor") ?? undefined;
  const quick = params.get("quick") as "today" | "surprise" | null;

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Create an Outfit</h1>
      <p className="text-stone mb-10 max-w-xl">
        Tell ClosetAI the occasion and it'll style a complete outfit from the clothes you already
        own.
      </p>
      <OutfitGenerator initialAnchorId={anchor} autoGenerate={quick} />
    </div>
  );
}

export default function CreateOutfitPage() {
  return (
    <Suspense>
      <CreateOutfitContent />
    </Suspense>
  );
}
