import { db } from "@/db";
import { clips } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail, guard, num, ok, str } from "@/lib/http";
import { and, eq } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  return guard(async () => {
    const user = await requireUser();
    const id = Number((await params).id);
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = str(body.title);
    if (body.hook !== undefined) patch.hook = str(body.hook);
    if (body.caption !== undefined) patch.caption = str(body.caption);
    if (body.hashtags !== undefined) patch.hashtags = str(body.hashtags);
    if (body.status !== undefined) patch.status = str(body.status);
    if (body.startSec !== undefined) patch.startSec = Math.max(0, num(body.startSec));
    if (body.endSec !== undefined) patch.endSec = Math.max(1, num(body.endSec));
    if (body.score !== undefined) patch.score = Math.min(100, Math.max(0, num(body.score)));

    const [updated] = await db
      .update(clips)
      .set(patch)
      .where(and(eq(clips.id, id), eq(clips.userId, user.id)))
      .returning();
    if (!updated) return fail("Clip not found.", 404);
    return ok({ clip: updated });
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return guard(async () => {
    const user = await requireUser();
    const id = Number((await params).id);
    const deleted = await db
      .delete(clips)
      .where(and(eq(clips.id, id), eq(clips.userId, user.id)))
      .returning({ id: clips.id });
    if (!deleted.length) return fail("Clip not found.", 404);
    return ok({ ok: true });
  });
}
