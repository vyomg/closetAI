import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, transactions] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id }, select: { creditBalance: true } }),
    db.creditTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    balance: user.creditBalance,
    transactions: transactions.map((t) => ({ id: t.id, amount: t.amount, reason: t.reason, createdAt: t.createdAt })),
  });
}
