"use client";

import { useEffect, useState } from "react";
import { Coins, Sparkles, MessageCircle, Shirt, Luggage, Wand2, Clock } from "lucide-react";
import { Spark, BrandLoading } from "@/components/Brand";
import { cn } from "@/lib/cn";

type Transaction = { id: string; amount: number; reason: string; createdAt: string };

// Mirrors CREDIT_COSTS in lib/credits.ts — kept as a separate client-safe
// copy because that module imports the Prisma client, which can't be
// bundled into the browser. If the server-side costs change, update both.
const COST_ROWS = [
  { icon: MessageCircle, label: "General AI chat message", cost: 1 },
  { icon: Wand2, label: "Ask about or refine an existing outfit", cost: 1 },
  { icon: Sparkles, label: "Generate a new AI outfit", cost: 3 },
  { icon: Shirt, label: "Analyse clothing using AI", cost: 2 },
  { icon: Luggage, label: "Generate a trip packing list", cost: 3 },
];

const REASON_LABEL: Record<string, string> = {
  welcome_grant: "Welcome bonus",
  outfit_generate: "Generated an outfit",
  outfit_remix: "Remixed an outfit",
  chat_outfit_generate: "Asked matchin' for an outfit",
};

const BUNDLES = [
  { credits: 100, blurb: "A light top-up for occasional use." },
  { credits: 300, blurb: "For regular outfit generation and chat." },
  { credits: 1000, blurb: "Best value for frequent stylists." },
];

export default function BuyCreditsPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [unlimited, setUnlimited] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => {
        setBalance(typeof d.balance === "number" ? d.balance : 0);
        setUnlimited(Boolean(d.unlimited));
        setTransactions(d.transactions ?? []);
      });
  }, []);

  if (balance === null) return <BrandLoading tagline="loading your credits..." />;

  return (
    <div className="max-w-3xl">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-paper-alt px-3.5 py-1.5 text-xs font-medium text-ink-soft mb-5">
        <Coins className="h-3.5 w-3.5" strokeWidth={1.75} />
        Credits
      </div>

      <h1 className="font-display text-4xl sm:text-5xl mb-4">Buy Credits.</h1>
      <p className="text-ink-soft text-lg max-w-xl mb-8">
        matchin&apos; runs real AI generation for every outfit it builds — credits are how that usage is metered. No
        subscription, no lock-in: you only ever pay for what you actually use.
      </p>

      {/* Current balance */}
      <div className="rounded-2xl border border-line bg-paper-alt p-6 sm:p-7 mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wide text-stone mb-1.5">Current balance</p>
          <p className="font-display text-4xl flex items-center gap-2">
            {unlimited ? "∞" : balance} <Spark className="h-5 w-5 text-lime" />
          </p>
          {unlimited && (
            <p className="text-sm text-ink-soft mt-2 max-w-sm">
              Credits are unlimited for everyone right now — use every feature freely. Nothing is being deducted.
            </p>
          )}
        </div>
      </div>

      {/* How credits work */}
      <h2 className="font-display text-2xl mb-4">How credits work</h2>
      <div className="rounded-2xl border border-line bg-paper-alt p-5 sm:p-6 mb-8">
        <div className="space-y-3.5">
          {COST_ROWS.map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <row.icon className="h-4 w-4 text-ink-soft shrink-0" strokeWidth={1.75} />
              <p className="text-sm flex-1">{row.label}</p>
              <span className="text-sm font-medium text-ink-soft shrink-0">{row.cost} credit{row.cost === 1 ? "" : "s"}</span>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-2 border-t border-line">
            <Sparkles className="h-4 w-4 text-stone shrink-0" strokeWidth={1.75} />
            <p className="text-sm flex-1 text-stone">Browsing, saving, and viewing your wardrobe</p>
            <span className="text-sm font-medium text-stone shrink-0">Free</span>
          </div>
        </div>
        {unlimited && (
          <p className="text-xs text-stone mt-4 pt-4 border-t border-line">
            These are the configured costs for when paid credits launch — nothing is charged against them while
            unlimited access is active.
          </p>
        )}
      </div>

      {/* Bundles — informational only, purchasing isn't live yet */}
      <h2 className="font-display text-2xl mb-4">Credit bundles</h2>
      <div className="rounded-2xl border border-dashed border-line bg-paper-alt/40 p-5 sm:p-6 mb-3">
        <div className="flex items-center gap-2 mb-4 text-sm text-stone">
          <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
          Purchasing isn&apos;t live yet — this is what&apos;s planned.
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {BUNDLES.map((b) => (
            <div key={b.credits} className="rounded-xl border border-line bg-paper p-4 text-center">
              <p className="font-display text-2xl mb-1">{b.credits}</p>
              <p className="text-xs text-stone mb-3">credits</p>
              <p className="text-xs text-ink-soft mb-4">{b.blurb}</p>
              <button
                disabled
                className="w-full inline-flex items-center justify-center rounded-full bg-ink text-paper px-4 py-2.5 text-sm font-medium opacity-40 cursor-not-allowed"
              >
                Coming soon
              </button>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-stone mb-10">
        Everyone currently has unlimited access while matchin&apos; is in this launch period — there&apos;s nothing to buy
        right now.
      </p>

      {/* Transaction history */}
      <h2 className="font-display text-2xl mb-4">Transaction history</h2>
      {transactions && transactions.length === 0 ? (
        <p className="text-sm text-stone">No credit activity yet.</p>
      ) : (
        <div className="rounded-2xl border border-line bg-paper-alt divide-y divide-line">
          {transactions?.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div className="min-w-0">
                <p className="text-sm truncate">{REASON_LABEL[t.reason] ?? t.reason}</p>
                <p className="text-xs text-stone">{new Date(t.createdAt).toLocaleString()}</p>
              </div>
              <span className={cn("text-sm font-medium shrink-0", t.amount >= 0 ? "text-success" : "text-ink-soft")}>
                {t.amount >= 0 ? "+" : ""}
                {t.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
