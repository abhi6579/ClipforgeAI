import { db } from "@/db";
import { creditEvents } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail, guard, num, ok, str } from "@/lib/http";
import { addCredits } from "@/lib/credits";
import { and, desc, eq, gt, sql } from "drizzle-orm";

const DAILY_GAME_CAP = 120;

export async function POST(req: Request) {
  return guard(async () => {
    const user = await requireUser();
    const body = await req.json();
    const game = str(body.game, "hook-rush") || "hook-rush";
    const score = Math.max(0, Math.min(200, num(body.score, 0)));

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [{ earned }] = await db
      .select({ earned: sql<number>`coalesce(sum(${creditEvents.amount}), 0)::int` })
      .from(creditEvents)
      .where(
        and(
          eq(creditEvents.userId, user.id),
          eq(creditEvents.source, "game"),
          gt(creditEvents.createdAt, since),
        ),
      );

    if (earned >= DAILY_GAME_CAP) {
      return fail("You hit today's game credit cap. Come back tomorrow!", 429);
    }

    const raw = Math.round(score / 4) + (score > 60 ? 10 : 0);
    const reward = Math.max(2, Math.min(raw, DAILY_GAME_CAP - earned));
    const credits = await addCredits(user.id, reward, `${game === "spin" ? "Trend Spin" : "Hook Rush"} reward`, "game");

    const recent = await db
      .select()
      .from(creditEvents)
      .where(and(eq(creditEvents.userId, user.id), eq(creditEvents.source, "game")))
      .orderBy(desc(creditEvents.createdAt))
      .limit(5);

    return ok({ reward, credits, remainingToday: Math.max(0, DAILY_GAME_CAP - earned - reward), recent });
  });
}
