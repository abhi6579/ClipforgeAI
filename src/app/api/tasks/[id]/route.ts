import { db } from "@/db";
import { tasks } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail, guard, num, ok, str } from "@/lib/http";
import { addCredits } from "@/lib/credits";
import { and, eq } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  return guard(async () => {
    const user = await requireUser();
    const id = Number((await params).id);
    const body = await req.json();

    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
      .limit(1);
    if (!task) return fail("Task not found.", 404);

    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = str(body.title);
    if (body.detail !== undefined) patch.detail = str(body.detail);
    if (body.reward !== undefined) patch.reward = Math.min(100, Math.max(5, num(body.reward, 10)));

    let credits = user.credits;
    if (body.done !== undefined) {
      const done = Boolean(body.done);
      patch.done = done;
      patch.completedAt = done ? new Date() : null;
      if (done && !task.done) {
        credits = await addCredits(user.id, task.reward, `Completed: ${task.title}`, "task");
      } else if (!done && task.done) {
        credits = await addCredits(user.id, -task.reward, `Undo: ${task.title}`, "task");
      }
    }

    const [updated] = await db.update(tasks).set(patch).where(eq(tasks.id, id)).returning();
    return ok({ task: updated, credits });
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return guard(async () => {
    const user = await requireUser();
    const id = Number((await params).id);
    const deleted = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
      .returning({ id: tasks.id });
    if (!deleted.length) return fail("Task not found.", 404);
    return ok({ ok: true });
  });
}
