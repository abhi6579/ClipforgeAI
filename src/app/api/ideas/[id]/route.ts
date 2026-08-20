import { db } from "@/db";
import { ideas } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail, guard, ok, str } from "@/lib/http";
import { and, eq } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  return guard(async () => {
    const user = await requireUser();
    const id = Number((await params).id);
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    for (const key of ["title", "angle", "platform", "status", "scheduledFor"] as const) {
      if (body[key] !== undefined) patch[key] = str(body[key]);
    }
    const [updated] = await db
      .update(ideas)
      .set(patch)
      .where(and(eq(ideas.id, id), eq(ideas.userId, user.id)))
      .returning();
    if (!updated) return fail("Idea not found.", 404);
    return ok({ idea: updated });
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return guard(async () => {
    const user = await requireUser();
    const id = Number((await params).id);
    const deleted = await db
      .delete(ideas)
      .where(and(eq(ideas.id, id), eq(ideas.userId, user.id)))
      .returning({ id: ideas.id });
    if (!deleted.length) return fail("Idea not found.", 404);
    return ok({ ok: true });
  });
}
