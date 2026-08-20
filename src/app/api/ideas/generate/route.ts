import { db } from "@/db";
import { ideas } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail, guard, ok, str } from "@/lib/http";
import { IDEA_COST, planLimits, refundCredits, spendCredits } from "@/lib/credits";
import { generateIdeas } from "@/lib/ai";
import { rateLimit, tooMany } from "@/lib/ratelimit";

export async function POST(req: Request) {
  return guard(async () => {
    const user = await requireUser();

    const limit = rateLimit(`ideas:${user.id}`, 20, 60_000);
    if (!limit.ok) return tooMany(limit.retryAfter);

    const body = await req.json().catch(() => ({}));
    const platform = str(body.platform, "reels") || "reels";
    const niche = str(body.niche, user.niche) || user.niche;

    const free = planLimits(user.plan).unlimitedAi;
    let credits = user.credits;

    if (!free) {
      const spent = await spendCredits(user.id, IDEA_COST, "AI idea burst", "ai");
      if (spent === null) {
        return fail(`You need ${IDEA_COST} credits. Earn more in the Earn tab.`, 402);
      }
      credits = spent;
    }

    try {
      const generated = generateIdeas(niche, platform, 3);
      const inserted = await db
        .insert(ideas)
        .values(generated.map((g) => ({ ...g, userId: user.id })))
        .returning();
      return ok({ ideas: inserted, credits }, 201);
    } catch (err) {
      if (!free) await refundCredits(user.id, IDEA_COST, "Refund: idea burst failed");
      throw err;
    }
  });
}
