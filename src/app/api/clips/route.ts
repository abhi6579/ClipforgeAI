import { db } from "@/db";
import { clips, projects } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail, guard, num, ok, str } from "@/lib/http";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    const user = await requireUser();
    const rows = await db
      .select({ clip: clips, projectTitle: projects.title, platform: projects.platform, sourceUrl: projects.sourceUrl })
      .from(clips)
      .innerJoin(projects, eq(projects.id, clips.projectId))
      .where(eq(clips.userId, user.id))
      .orderBy(desc(clips.score));
    return ok({
      clips: rows.map((r) => ({
        ...r.clip,
        projectTitle: r.projectTitle,
        platform: r.platform,
        sourceUrl: r.sourceUrl,
      })),
    });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const user = await requireUser();
    const body = await req.json();
    const projectId = num(body.projectId);
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
      .limit(1);
    if (!project) return fail("Pick a project for this clip.", 404);
    const title = str(body.title);
    if (title.length < 3) return fail("Clip needs a title.");
    const startSec = Math.max(0, num(body.startSec, 0));
    const endSec = Math.max(startSec + 1, num(body.endSec, startSec + 30));
    const [clip] = await db
      .insert(clips)
      .values({
        projectId,
        userId: user.id,
        title,
        hook: str(body.hook),
        caption: str(body.caption),
        hashtags: str(body.hashtags),
        startSec,
        endSec,
        score: Math.min(100, Math.max(0, num(body.score, 75))),
        status: str(body.status, "suggested") || "suggested",
      })
      .returning();
    return ok({ clip }, 201);
  });
}
