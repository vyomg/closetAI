"use client";

import { useEffect, useState } from "react";
import { OutfitGenerator } from "@/components/OutfitGenerator";

// No useSearchParams() here on purpose — Next.js requires wrapping it in
// <Suspense>. OutfitGenerator only reads initialAnchorId/autoGenerate
// inside its own effects (never for initial markup), so starting both at
// undefined/null (matching the server-rendered output exactly) and filling
// them in from window.location right after mount is behaviourally
// identical — generation just starts one tick later — with no hydration
// mismatch and no Suspense boundary needed.
export default function CreateOutfitPage() {
  const [anchor, setAnchor] = useState<string | undefined>(undefined);
  const [quick, setQuick] = useState<"today" | "surprise" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAnchor(params.get("anchor") ?? undefined);
    setQuick(params.get("quick") as "today" | "surprise" | null);
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Create an Outfit</h1>
      <p className="text-stone mb-10 max-w-xl">
        Tell matchin&apos; the occasion and it&apos;ll style a complete outfit from the clothes you already
        own.
      </p>
      <OutfitGenerator initialAnchorId={anchor} autoGenerate={quick} />
    </div>
  );
}
