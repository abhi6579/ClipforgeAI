import { db } from "@/db";
import { tasks, users, type User } from "@/db/schema";
import { and, eq } from "drizzle-orm";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export type DailyResult = {
  user: User;
  rolledOver: boolean;
  streakChanged: boolean;
};

/**
 * Runs once per user per day, on their first dashboard hit:
 *  - un-checks every `daily` task so they can be earned again
 *  - increments the streak on consecutive days, resets it after a gap
 * Idempotent: the UPDATE is guarded on last_seen_date so concurrent
 * requests on the same day can only apply it once.
 */
export async function ensureDaily(user: User): Promise<DailyResult> {
  const today = isoDate(new Date());
  if (user.lastSeenDate === today) {
    return { user, rolledOver: false, streakChanged: false };
  }

  const yesterday = isoDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const consecutive = user.lastSeenDate === yesterday;
  const nextStreak = consecutive ? user.streak + 1 : 1;
  const firstEver = user.lastSeenDate === "";

  const [updated] = await db
    .update(users)
    .set({
      lastSeenDate: today,
      streak: firstEver ? user.streak : nextStreak,
      bestStreak: Math.max(user.bestStreak, firstEver ? user.streak : nextStreak),
    })
    .where(and(eq(users.id, user.id), eq(users.lastSeenDate, user.lastSeenDate)))
    .returning();

  // Another concurrent request already rolled the day over.
  if (!updated) return { user, rolledOver: false, streakChanged: false };

  const reset = await db
    .update(tasks)
    .set({ done: false, completedAt: null })
    .where(and(eq(tasks.userId, user.id), eq(tasks.kind, "daily"), eq(tasks.done, true)))
    .returning({ id: tasks.id });

  return {
    user: updated,
    rolledOver: reset.length > 0,
    streakChanged: !firstEver && updated.streak !== user.streak,
  };
}
