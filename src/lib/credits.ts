// Credits ledger — User.creditBalance is the fast-read running total,
// CreditTransaction is the auditable history behind it. Never deduct
// silently: callers that gate on cost should show the cost before calling
// spend().
//
// UNLIMITED_CREDITS (temporary launch policy, see below) makes spendCredits
// a no-op that never blocks and never decrements, while still logging a
// transaction row so real usage stays observable for when pricing is
// actually turned on. Every operation cost below is "configured" in the
// sense the brief means it — defined centrally, ready to enforce — but only
// the three generation endpoints actually call spendCredits() today
// (clothing analysis / packing-list / wardrobe-analysis stay free, same as
// before this pass; wiring them in is a later, deliberate product decision,
// not something to slip in silently while unlimited mode masks the effect).
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export const WELCOME_CREDIT_GRANT = 50;
const LOW_BALANCE_WARNING_THRESHOLD = 10;

// Temporary launch policy: no credit deductions, no blocking, no
// insufficient-credit errors, for roughly the first month. Flip this back
// to `false` (or set the env var) when pricing actually goes live — nothing
// else needs to change, spendCredits() already does the real accounting
// below, this just stops short-circuiting it.
export const UNLIMITED_CREDITS = process.env.UNLIMITED_CREDITS !== "false";

// Central, configurable operation-cost map (Section 17). These are
// provisional product settings, not verified provider-cost calculations.
export const CREDIT_COSTS = {
  CHAT_MESSAGE: 1,
  OUTFIT_REFINE: 1,
  OUTFIT_GENERATE: 3,
  CLOTHING_ANALYZE: 2,
  PACKING_LIST: 3,
  WARDROBE_ANALYSIS: 3,
} as const;

export async function grantCredits(userId: string, amount: number, reason: string) {
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { creditBalance: { increment: amount } } }),
    db.creditTransaction.create({ data: { userId, amount, reason } }),
  ]);
}

export type SpendResult = { ok: true; balance: number } | { ok: false; balance: number };

export async function spendCredits(userId: string, amount: number, reason: string): Promise<SpendResult> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { creditBalance: true } });
  const currentBalance = user?.creditBalance ?? 0;

  if (UNLIMITED_CREDITS) {
    // Logged (never decremented) so real per-operation usage is still
    // observable while nothing is actually charged — see the module
    // comment. Never let a logging failure block the action it's logging.
    await db.creditTransaction.create({ data: { userId, amount: -amount, reason } }).catch(() => {});
    return { ok: true, balance: currentBalance };
  }

  if (!user || currentBalance < amount) {
    return { ok: false, balance: currentBalance };
  }
  const [updated] = await db.$transaction([
    db.user.update({ where: { id: userId }, data: { creditBalance: { decrement: amount } }, select: { creditBalance: true } }),
    db.creditTransaction.create({ data: { userId, amount: -amount, reason } }),
  ]);

  if (updated.creditBalance <= LOW_BALANCE_WARNING_THRESHOLD && currentBalance > LOW_BALANCE_WARNING_THRESHOLD) {
    await createNotification({
      userId,
      type: "credit_warning",
      title: "Running low on credits",
      body: `You have ${updated.creditBalance} credit${updated.creditBalance === 1 ? "" : "s"} left.`,
      link: "/settings",
    });
  }

  return { ok: true, balance: updated.creditBalance };
}
