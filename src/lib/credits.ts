// Credits ledger — User.creditBalance is the fast-read running total,
// CreditTransaction is the auditable history behind it. Nothing in the
// product charges credits yet except outfit generation (the one Gemini call
// users repeat often); every other action stays free until there's an
// explicit product decision to price it. Never deduct silently: callers
// that gate on cost should show the cost before calling spend().
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export const WELCOME_CREDIT_GRANT = 50;
export const OUTFIT_GENERATE_COST = 1;
const LOW_BALANCE_WARNING_THRESHOLD = 10;

export async function grantCredits(userId: string, amount: number, reason: string) {
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { creditBalance: { increment: amount } } }),
    db.creditTransaction.create({ data: { userId, amount, reason } }),
  ]);
}

export type SpendResult = { ok: true; balance: number } | { ok: false; balance: number };

export async function spendCredits(userId: string, amount: number, reason: string): Promise<SpendResult> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { creditBalance: true } });
  if (!user || user.creditBalance < amount) {
    return { ok: false, balance: user?.creditBalance ?? 0 };
  }
  const [updated] = await db.$transaction([
    db.user.update({ where: { id: userId }, data: { creditBalance: { decrement: amount } }, select: { creditBalance: true } }),
    db.creditTransaction.create({ data: { userId, amount: -amount, reason } }),
  ]);

  if (updated.creditBalance <= LOW_BALANCE_WARNING_THRESHOLD && user.creditBalance > LOW_BALANCE_WARNING_THRESHOLD) {
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
