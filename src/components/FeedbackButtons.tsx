"use client";

import { useState } from "react";
import { Heart, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { DISLIKE_REASONS } from "@/lib/constants";

export function FeedbackButtons({
  outfitId,
  initialFeedback,
}: {
  outfitId: string;
  initialFeedback?: { feedbackType: string; reasons: string[] } | null;
}) {
  const [feedback, setFeedback] = useState(initialFeedback ?? null);
  const [showReasons, setShowReasons] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(feedbackType: "like" | "dislike", reasons: string[] = []) {
    setSubmitting(true);
    await fetch(`/api/outfits/${outfitId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackType, reasons }),
    });
    setFeedback({ feedbackType, reasons });
    setSubmitting(false);
    setShowReasons(false);
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => submit("like")}
          disabled={submitting}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors cursor-pointer",
            feedback?.feedbackType === "like" ? "border-ink bg-ink text-paper" : "border-line hover:border-ink/40"
          )}
        >
          <Heart className="h-4 w-4" fill={feedback?.feedbackType === "like" ? "currentColor" : "none"} />
          Like
        </button>
        <button
          onClick={() => setShowReasons((s) => !s)}
          disabled={submitting}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors cursor-pointer",
            feedback?.feedbackType === "dislike" ? "border-warning bg-warning text-white" : "border-line hover:border-ink/40"
          )}
        >
          <X className="h-4 w-4" />
          Dislike
        </button>
      </div>

      {showReasons && (
        <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
          {DISLIKE_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => submit("dislike", [reason])}
              className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft hover:border-ink transition-colors cursor-pointer"
            >
              {reason}
            </button>
          ))}
        </div>
      )}

      {feedback?.reasons?.length ? (
        <p className="mt-2 text-xs text-stone">You said: {feedback.reasons.join(", ")}</p>
      ) : null}
    </div>
  );
}
