import { db } from "@/db";
import { creditEvents, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function addCredits(
  userId: number,
  amount: number,
  reason: string,
  source: string,
): Promise<number> {
  const [updated] = await db
    .update(users)
    .set({ credits: sql`GREATEST(0, ${users.credits} + ${amount})` })
    .where(eq(users.id, userId))
    .returning({ credits: users.credits });
  await db.insert(creditEvents).values({ userId, amount, reason, source });
  return updated?.credits ?? 0;
}

/**
 * Atomically spend credits. The balance check happens inside the UPDATE's
 * WHERE clause, so two concurrent requests can never both pass the check and
 * double-spend the same balance. Returns null when funds are insufficient.
 */
export async function spendCredits(
  userId: number,
  amount: number,
  reason: string,
  source: string,
): Promise<number | null> {
  if (amount <= 0) return null;
  const [updated] = await db
    .update(users)
    .set({ credits: sql`${users.credits} - ${amount}` })
    .where(sql`${users.id} = ${userId} AND ${users.credits} >= ${amount}`)
    .returning({ credits: users.credits });

  if (!updated) return null;
  await db.insert(creditEvents).values({ userId, amount: -amount, reason, source });
  return updated.credits;
}

/** Give credits back when a paid operation fails after the debit. */
export async function refundCredits(userId: number, amount: number, reason: string) {
  return addCredits(userId, amount, reason, "refund");
}

export const ANALYSIS_COST = 5;
export const IDEA_COST = 3;

export function planLimits(plan: string) {
  if (plan === "studio") return { projects: Infinity, label: "Studio", unlimitedAi: true };
  if (plan === "creator") return { projects: 50, label: "Creator", unlimitedAi: true };
  return { projects: 6, label: "Free", unlimitedAi: false };
}
