import { db } from "@/db";
import { clips, projects } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail, guard, num, ok, str } from "@/lib/http";
import { and, asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  return guard(async () => {
    const user = await requireUser();
    const id = Number((await params).id);
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
      .limit(1);
    if (!project) return fail("Project not found.", 404);
    const list = await db
      .select()
      .from(clips)
      .where(eq(clips.projectId, id))
      .orderBy(asc(clips.startSec));
    return ok({ project, clips: list });
  });
}

export async function PATCH(req: Request, { params }: Ctx) {
  return guard(async () => {
    const user = await requireUser();
    const id = Number((await params).id);
    const body = await req.json();
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title !== undefined) patch.title = str(body.title);
    if (body.platform !== undefined) patch.platform = str(body.platform);
    if (body.sourceUrl !== undefined) patch.sourceUrl = str(body.sourceUrl);
    if (body.goal !== undefined) patch.goal = str(body.goal);
    if (body.notes !== undefined) patch.notes = str(body.notes);
    if (body.status !== undefined) patch.status = str(body.status);
    if (body.durationSec !== undefined)
      patch.durationSec = Math.min(14400, Math.max(15, num(body.durationSec, 600)));

    const [updated] = await db
      .update(projects)
      .set(patch)
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
      .returning();
    if (!updated) return fail("Project not found.", 404);
    return ok({ project: updated });
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return guard(async () => {
    const user = await requireUser();
    const id = Number((await params).id);
    const deleted = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
      .returning({ id: projects.id });
    if (!deleted.length) return fail("Project not found.", 404);
    return ok({ ok: true });
  });
}
