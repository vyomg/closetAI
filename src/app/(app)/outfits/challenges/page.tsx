"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OutfitCard } from "@/components/OutfitCard";
import { OUTFIT_CHALLENGES } from "@/lib/constants";
import type { OutfitDTO } from "@/lib/clientTypes";

export default function OutfitChallengesPage() {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [result, setResult] = useState<OutfitDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function tryChallenge(key: string) {
    setActiveKey(key);
    setResult(null);
    setError(null);
    const res = await fetch(`/api/outfits/challenges/${key}`, { method: "POST" });
    const data = await res.json();
    setActiveKey(null);
    if (!res.ok) {
      setError(data.error || "Couldn't complete that challenge.");
      return;
    }
    setResult(data);
  }

  return (
    <div>
      <h1 className="font-display text-4xl mb-2">Outfit Challenges</h1>
      <p className="text-stone mb-10 max-w-xl">
        Quick, focused prompts that put your wardrobe to work in a specific way. Try one — matchin' builds
        a real outfit from what you own.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {OUTFIT_CHALLENGES.map((c) => (
          <div key={c.key} className="rounded-2xl border border-line bg-paper-alt p-5 flex flex-col justify-between">
            <div>
              <p className="font-medium mb-1.5">{c.title}</p>
              <p className="text-sm text-stone">{c.description}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-4 w-full"
              onClick={() => tryChallenge(c.key)}
              disabled={activeKey === c.key}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {activeKey === c.key ? "Building…" : "Try this challenge"}
            </Button>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-warning mb-8">{error}</p>}

      {result && (
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl mb-4">Your result</h2>
          <OutfitCard outfit={result} showSocialActions showFeedback={false} />
        </div>
      )}
    </div>
  );
}
