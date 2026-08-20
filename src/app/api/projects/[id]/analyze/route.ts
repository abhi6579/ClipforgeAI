import { db } from "@/db";
import { clips, projects } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail, guard, ok } from "@/lib/http";
import { ANALYSIS_COST, planLimits, refundCredits, spendCredits } from "@/lib/credits";
import { analyzeProject } from "@/lib/ai";
import { clientIp, rateLimit, tooMany } from "@/lib/ratelimit";
import { and, asc, eq } from "drizzle-orm";

export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  return guard(async () => {
    const user = await requireUser();

    // AI is the expensive path — cap it per user regardless of credits.
    const limit = rateLimit(`analyze:${user.id}`, 20, 60_000);
    if (!limit.ok) return tooMany(limit.retryAfter);
    const ipLimit = rateLimit(`analyze-ip:${clientIp(req)}`, 40, 60_000);
    if (!ipLimit.ok) return tooMany(ipLimit.retryAfter);

    const id = Number((await params).id);
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
      .limit(1);
    if (!project) return fail("Project not found.", 404);

    const free = planLimits(user.plan).unlimitedAi;
    let credits = user.credits;

    // Debit atomically BEFORE doing the work so parallel requests cannot
    // both pass a balance check and spend the same credits.
    if (!free) {
      const spent = await spendCredits(
        user.id,
        ANALYSIS_COST,
        `AI overview: ${project.title.slice(0, 40)}`,
        "ai",
      );
      if (spent === null) {
        return fail(
          `You need ${ANALYSIS_COST} credits to run an AI overview. Earn free credits in the Earn tab.`,
          402,
        );
      }
      credits = spent;
    }

    let result;
    try {
      result = await analyzeProject({
        title: project.title,
        platform: project.platform,
        goal: project.goal,
        notes: project.notes,
        durationSec: project.durationSec,
      });
    } catch (err) {
      if (!free) {
        credits = await refundCredits(user.id, ANALYSIS_COST, "Refund: AI overview failed");
      }
      throw err;
    }

    await db.delete(clips).where(and(eq(clips.projectId, id), eq(clips.status, "suggested")));
    if (result.clips.length) {
      await db.insert(clips).values(
        result.clips.map((c) => ({
          projectId: id,
          userId: user.id,
          title: c.title,
          hook: c.hook,
          caption: c.caption,
          hashtags: c.hashtags,
          startSec: Math.max(0, Math.round(c.startSec)),
          endSec: Math.max(1, Math.round(c.endSec)),
          score: Math.round(c.score),
          status: "suggested",
        })),
      );
    }

    const [updated] = await db
      .update(projects)
      .set({ analysis: result.analysis, status: "ready", updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();

    const list = await db.select().from(clips).where(eq(clips.projectId, id)).orderBy(asc(clips.startSec));
    return ok({ project: updated, clips: list, credits });
  });
}
