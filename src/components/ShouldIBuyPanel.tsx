"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Loader2, Upload, ExternalLink, Search } from "lucide-react";
import { Spark } from "@/components/Brand";
import { cn } from "@/lib/cn";
import type { ShouldIBuyResultDTO, ProductResultDTO } from "@/lib/clientTypes";

const VERDICT_TONE: Record<string, "success" | "neutral" | "warning"> = {
  "Strong Buy": "success",
  Consider: "neutral",
  Skip: "warning",
};

export function ShouldIBuyPanel() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShouldIBuyResultDTO | null>(null);
  const [similar, setSimilar] = useState<{ results: ProductResultDTO[]; usedRealProvider: boolean } | null>(null);
  const [findingSimilar, setFindingSimilar] = useState(false);

  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setLoading(true);
    setError(null);
    setResult(null);
    setSimilar(null);

    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("/api/buy/should-i-buy", { method: "POST", body: formData });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Couldn't evaluate that item.");
      return;
    }
    setResult(data);
  }, []);

  async function findSimilarProducts() {
    if (!result) return;
    setFindingSimilar(true);
    const res = await fetch("/api/buy/similar-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: result.analysis.category,
        subcategory: result.analysis.subcategory,
        color: result.analysis.primaryColor,
      }),
    });
    setFindingSimilar(false);
    if (res.ok) setSimilar(await res.json());
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  return (
    <div id="should-i-buy" className="rounded-2xl border border-line bg-white p-6 sm:p-7 scroll-mt-6">
      <h2 className="font-display text-2xl mb-1">Should I buy this?</h2>
      <p className="text-sm text-stone mb-6">
        Photograph an item you&apos;re considering and matchin' will compare it against your wardrobe and preferences.
      </p>

      <div className="grid sm:grid-cols-[200px_1fr] gap-6">
        <div>
          <div
            {...getRootProps()}
            className={cn(
              "aspect-[4/5] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center p-4 cursor-pointer transition-colors relative overflow-hidden",
              isDragActive ? "border-ink bg-paper-alt" : "border-line hover:border-ink/40"
            )}
          >
            <input {...getInputProps()} />
            {previewUrl ? (
              <Image src={previewUrl} alt="" fill sizes="200px" className="object-cover" unoptimized />
            ) : (
              <>
                <Upload className="h-6 w-6 text-stone mb-2" strokeWidth={1.5} />
                <p className="text-xs text-stone">Upload a photo</p>
              </>
            )}
            {loading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-ink-soft" />
              </div>
            )}
          </div>
        </div>

        <div>
          {error && <p className="text-sm text-warning">{error}</p>}

          {!error && !result && !loading && (
            <div className="h-full flex items-center text-sm text-stone">
              Your verdict will appear here.
            </div>
          )}

          {result && (
            <div className="animate-fade-up">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium",
                    VERDICT_TONE[result.verdict] === "success" && "bg-lime text-lime-ink",
                    VERDICT_TONE[result.verdict] === "warning" && "bg-[#f4e6d8] text-warning",
                    VERDICT_TONE[result.verdict] === "neutral" && "bg-paper-alt text-ink-soft"
                  )}
                >
                  {VERDICT_TONE[result.verdict] === "success" && <Spark className="h-3 w-3" />}
                  {result.verdict}
                </span>
                <span className="font-display text-2xl">{result.buyScore}/100</span>
              </div>

              <p className="text-sm text-ink-soft mb-3">
                {result.analysis.primaryColor} {result.analysis.subcategory} · {result.analysis.style}
              </p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <ScoreBar label="Wardrobe fit" value={result.scores.wardrobeCompatibility} />
                <ScoreBar label="Versatility" value={result.scores.versatilityScore} />
                <ScoreBar label="Color match" value={result.scores.colorCompatibility} />
              </div>

              {result.reasons.length > 0 && (
                <ul className="text-sm text-ink-soft space-y-1.5 mb-3 list-disc list-inside">
                  {result.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}

              {result.concerns.length > 0 && (
                <div className="rounded-xl bg-[#f4e6d8] px-3.5 py-2.5 text-sm text-warning">
                  <p className="font-medium mb-1">Potential issues</p>
                  <ul className="list-disc list-inside space-y-1">
                    {result.concerns.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.duplicateCount > 0 && (
                <p className="text-xs text-stone mt-3">
                  You already own {result.duplicateCount} very similar item{result.duplicateCount === 1 ? "" : "s"}.
                </p>
              )}

              <button
                onClick={findSimilarProducts}
                disabled={findingSimilar}
                className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink underline underline-offset-4 cursor-pointer mt-4"
              >
                <Search className="h-3.5 w-3.5" />
                {findingSimilar ? "Searching…" : "Find similar products"}
              </button>

              {similar && (
                <div className="mt-3">
                  {!similar.usedRealProvider && (
                    <p className="text-[11px] text-stone mb-2">
                      Live product search isn&apos;t connected — these are retailer searches, not specific products.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {similar.results.map((r) =>
                      r.type === "retailer-search" ? (
                        <a
                          key={r.retailer}
                          href={r.searchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs text-ink-soft hover:border-ink transition-colors"
                        >
                          Search {r.retailer} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <a key={r.id} href={r.productUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                          {r.title}
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-paper-alt px-2.5 py-2">
      <p className="text-xs font-medium">{value}%</p>
      <p className="text-[10px] text-stone mt-0.5">{label}</p>
    </div>
  );
}
