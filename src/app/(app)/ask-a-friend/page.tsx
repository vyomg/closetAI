"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Heart, Pencil, Sparkles, Clock, MessageSquareHeart, X } from "lucide-react";
import { BrandLoading } from "@/components/Brand";
import { LinkButton } from "@/components/ui/Button";
import { ClearButton } from "@/components/ui/ClearButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type PublicOutfitPreview = {
  occasion: string;
  style: string;
  overallScore: number;
  items: { slot: string; imageUrl: string; name: string }[];
};

type FriendRequest = {
  token: string;
  question: string;
  responseType: "love" | "change-something" | "suggest-another" | null;
  responseComment: string | null;
  respondedAt: string | null;
  createdAt: string;
  outfit: PublicOutfitPreview;
};

const RESPONSE_META: Record<string, { label: string; icon: typeof Heart }> = {
  love: { label: "Love it", icon: Heart },
  "change-something": { label: "Change something", icon: Pencil },
  "suggest-another": { label: "Suggest another", icon: Sparkles },
};

// Deterministic, per-viewer read tracking — no server-side schema change.
// A response is "new" if its respondedAt is later than the last time this
// browser recorded viewing that specific request token. This mirrors the
// same localStorage-dismissal pattern already used by StyleProfileNudge.
const VIEWED_KEY = "closetai:friendRequestsViewedAt";

function readViewedMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(VIEWED_KEY) || "{}");
  } catch {
    return {};
  }
}

// Compact relative time — "2h ago", "1d ago" — quieter than a full sentence.
function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AskAFriendInboxPage() {
  const [requests, setRequests] = useState<FriendRequest[] | null>(null);
  // Captured once, at load, so "New" badges stay visible for this visit even
  // though we persist the viewed timestamp moments later for future visits.
  const [unreadAtLoad, setUnreadAtLoad] = useState<Set<string>>(new Set());
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetch("/api/friend-requests")
      .then((r) => r.json())
      .then((data: FriendRequest[]) => {
        setRequests(data);

        const viewed = readViewedMap();
        const unread = new Set<string>();
        for (const r of data) {
          if (r.respondedAt && (!viewed[r.token] || new Date(viewed[r.token]) < new Date(r.respondedAt))) {
            unread.add(r.token);
          }
        }
        setUnreadAtLoad(unread);

        // Mark everything with a response as viewed now, for future visits.
        const now = new Date().toISOString();
        const nextViewed = { ...viewed };
        for (const r of data) {
          if (r.respondedAt) nextViewed[r.token] = now;
        }
        try {
          localStorage.setItem(VIEWED_KEY, JSON.stringify(nextViewed));
        } catch {
          // best-effort convenience only
        }
      });
  }, []);

  const { responded, waiting } = useMemo(() => {
    const responded: FriendRequest[] = [];
    const waiting: FriendRequest[] = [];
    for (const r of requests ?? []) {
      (r.respondedAt ? responded : waiting).push(r);
    }
    return { responded, waiting };
  }, [requests]);

  const unreadCount = unreadAtLoad.size;

  // Archiving only ever hides rows from THIS inbox — the underlying Outfit
  // and FriendOutfitRequest row (and the friend's response) are untouched.
  async function clearOne(token: string) {
    setRequests((prev) => (prev ? prev.filter((r) => r.token !== token) : prev));
    await fetch("/api/friend-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  }

  async function clearAll() {
    setClearing(true);
    await fetch("/api/friend-requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setClearing(false);
    setConfirmClearAll(false);
    setRequests([]);
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl">Ask a Friend</h1>
          <p className="text-stone mt-2">
            {unreadCount > 0
              ? `${unreadCount} new response${unreadCount === 1 ? "" : "s"} since you last checked.`
              : "Requests you've sent, and what your friends said."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ClearButton show={!!requests && requests.length > 0} onClick={() => setConfirmClearAll(true)} />
          <LinkButton href="/outfits" variant="outline">
            Go to My Outfits
          </LinkButton>
        </div>
      </div>

      {requests === null ? (
        <BrandLoading />
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-24 text-center">
          <MessageSquareHeart className="h-6 w-6 text-stone mx-auto mb-3" strokeWidth={1.5} />
          <p className="font-display text-2xl mb-3">No requests yet.</p>
          <p className="text-stone mb-8">
            Open an outfit and tap &ldquo;Ask a Friend&rdquo; to get a second opinion.
          </p>
          <LinkButton href="/outfits">View my outfits</LinkButton>
        </div>
      ) : (
        <div className="space-y-10">
          {responded.length > 0 && (
            <section>
              <h2 className="font-display text-2xl mb-4">Responded</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {responded.map((r) => (
                  <ResponseCard key={r.token} request={r} isNew={unreadAtLoad.has(r.token)} onClear={() => clearOne(r.token)} />
                ))}
              </div>
            </section>
          )}

          {waiting.length > 0 && (
            <section>
              <h2 className="font-display text-2xl mb-4">Waiting for response</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {waiting.map((r) => (
                  <WaitingCard key={r.token} request={r} onClear={() => clearOne(r.token)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmClearAll}
        title="Clear all inbox items?"
        description="This will remove them from your inbox. Your outfits and responses won't be deleted."
        confirmLabel={clearing ? "Clearing…" : "Clear all"}
        onConfirm={clearAll}
        onCancel={() => setConfirmClearAll(false)}
      />
    </div>
  );
}

function OutfitPreview({ outfit }: { outfit: PublicOutfitPreview }) {
  return (
    <div className="flex gap-2 mb-4">
      {outfit.items.slice(0, 4).map((item, i) => (
        <div key={i} className="relative aspect-[4/5] w-14 rounded-lg overflow-hidden bg-paper-alt border border-line shrink-0">
          <Image src={item.imageUrl} alt={item.name} fill sizes="56px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

function CardClear({ onClear }: { onClear: () => void }) {
  return (
    <button
      onClick={onClear}
      aria-label="Clear this request"
      title="Clear"
      className="absolute top-4 right-4 text-stone hover:text-ink cursor-pointer p-1 -m-1"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

function ResponseCard({ request, isNew, onClear }: { request: FriendRequest; isNew: boolean; onClear: () => void }) {
  const meta = request.responseType ? RESPONSE_META[request.responseType] : null;
  const Icon = meta?.icon ?? Heart;

  return (
    <div className="rounded-2xl border border-line bg-white p-5 relative">
      <CardClear onClear={onClear} />
      <p className="text-xs uppercase tracking-wide text-stone mb-1 flex items-center gap-1.5">
        Responded
        {isNew && <span className="inline-flex items-center rounded-full bg-ink text-paper text-[10px] font-medium px-2 py-0.5 normal-case tracking-normal">New</span>}
      </p>
      <p className="text-sm font-medium mb-4 pr-6">{request.question}</p>

      <OutfitPreview outfit={request.outfit} />

      <p className="inline-flex items-center gap-1.5 text-sm font-medium mb-1.5">
        <Icon className="h-4 w-4" /> {meta?.label ?? "Responded"}
      </p>
      {request.responseComment && (
        <p className="text-sm text-ink-soft leading-relaxed mb-2">&ldquo;{request.responseComment}&rdquo;</p>
      )}
      <p className="text-xs text-stone flex items-center gap-1">
        <Clock className="h-3 w-3" /> {timeAgo(request.respondedAt!)}
      </p>
    </div>
  );
}

function WaitingCard({ request, onClear }: { request: FriendRequest; onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white p-5 relative">
      <CardClear onClear={onClear} />
      <p className="text-xs uppercase tracking-wide text-stone mb-1">Waiting for response</p>
      <p className="text-sm font-medium mb-4 pr-6">{request.question}</p>
      <OutfitPreview outfit={request.outfit} />
      <p className="text-xs text-stone flex items-center gap-1">
        <Clock className="h-3 w-3" /> Sent {timeAgo(request.createdAt)}
      </p>
    </div>
  );
}
