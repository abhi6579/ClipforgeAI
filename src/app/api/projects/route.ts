import { db } from "@/db";
import { clips, projects } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail, guard, num, ok, str } from "@/lib/http";
import { planLimits } from "@/lib/credits";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    const user = await requireUser();
    const rows = await db
      .select({
        project: projects,
        clipCount: sql<number>`(select count(*)::int from ${clips} where ${clips.projectId} = ${projects.id})`,
      })
      .from(projects)
      .where(eq(projects.userId, user.id))
      .orderBy(desc(projects.updatedAt));
    return ok({ projects: rows.map((r) => ({ ...r.project, clipCount: r.clipCount })) });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const user = await requireUser();
    const body = await req.json();
    const title = str(body.title);
    if (title.length < 3) return fail("Give your video a title (3+ characters).");

    const limit = planLimits(user.plan).projects;
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(projects)
      .where(eq(projects.userId, user.id));
    if (n >= limit) {
      return fail(`Your ${planLimits(user.plan).label} plan holds ${limit} projects. Upgrade to add more.`, 402);
    }

    const [project] = await db
      .insert(projects)
      .values({
        userId: user.id,
        title,
        platform: str(body.platform, "reels") || "reels",
        sourceUrl: str(body.sourceUrl),
        durationSec: Math.min(14400, Math.max(15, num(body.durationSec, 600))),
        goal: str(body.goal, "growth") || "growth",
        notes: str(body.notes),
        status: "draft",
      })
      .returning();
    return ok({ project: { ...project, clipCount: 0 } }, 201);
  });
}
