"use client";

import { useEffect, useState, use as usePromise } from "react";
import Image from "next/image";
import { Heart, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { Brand } from "@/components/Brand";
import { cn } from "@/lib/cn";

type PublicOutfit = {
  occasion: string;
  style: string;
  explanation: string;
  overallScore: number;
  items: { slot: string; imageUrl: string; name: string }[];
};

type RequestData = {
  question: string;
  responseType: string | null;
  responseComment: string | null;
  respondedAt: string | null;
  outfit: PublicOutfit;
};

const RESPONSES = [
  { value: "love", label: "Love it", icon: Heart },
  { value: "change-something", label: "Change something", icon: Pencil },
  { value: "suggest-another", label: "Suggest another", icon: Sparkles },
] as const;

export default function AskFriendPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = usePromise(params);
  const [data, setData] = useState<RequestData | null | "not-found">(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/public/friend-request/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData("not-found"));
  }, [token]);

  async function submit() {
    if (!selected) return;
    setSubmitting(true);
    const res = await fetch(`/api/public/friend-request/${token}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responseType: selected, responseComment: comment || undefined }),
    });
    setSubmitting(false);
    if (res.ok) setSubmitted(true);
  }

  if (data === null) return <div className="flex-1 flex items-center justify-center p-14 text-stone">Loading…</div>;
  if (data === "not-found") {
    return (
      <div className="flex-1 flex items-center justify-center p-14 text-center">
        <p className="text-stone">This link is no longer available.</p>
      </div>
    );
  }

  const alreadyResponded = !!data.respondedAt || submitted;

  return (
    <div className="flex-1 flex items-start sm:items-center justify-center px-6 py-14">
      <div className="w-full max-w-lg animate-fade-up">
        <Brand size="sm" className="mb-2" />
        <h1 className="font-display text-3xl mb-8">{data.question}</h1>

        <div className="rounded-2xl border border-line bg-white p-6 sm:p-7 mb-6">
          <p className="text-xs uppercase tracking-wide text-stone mb-4">
            {data.outfit.occasion} · {data.outfit.style}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {data.outfit.items.map((item, i) => (
              <div key={i}>
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-line bg-paper-alt">
                  <Image src={item.imageUrl} alt={item.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
                </div>
                <p className="text-sm font-medium truncate mt-2">{item.name}</p>
              </div>
            ))}
          </div>
        </div>

        {alreadyResponded ? (
          <div className="rounded-2xl bg-paper-alt p-5 text-center">
            <p className="font-medium">Thanks — your response was sent.</p>
            {(data.responseComment || comment) && (
              <p className="text-sm text-stone mt-2">&ldquo;{data.responseComment || comment}&rdquo;</p>
            )}
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap gap-2.5 mb-4">
              {RESPONSES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSelected(r.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors cursor-pointer",
                    selected === r.value ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/40"
                  )}
                >
                  <r.icon className="h-3.5 w-3.5" /> {r.label}
                </button>
              ))}
            </div>
            <Textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note (optional)"
              className="mb-4"
            />
            <Button onClick={submit} disabled={!selected || submitting}>
              {submitting ? "Sending…" : "Send response"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
