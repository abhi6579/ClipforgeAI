import { db } from "@/db";
import { tasks } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail, guard, num, ok, str } from "@/lib/http";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    const user = await requireUser();
    const rows = await db.select().from(tasks).where(eq(tasks.userId, user.id)).orderBy(asc(tasks.id));
    return ok({ tasks: rows });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const user = await requireUser();
    const body = await req.json();
    const title = str(body.title);
    if (title.length < 3) return fail("Task needs a title.");
    const [task] = await db
      .insert(tasks)
      .values({
        userId: user.id,
        title,
        detail: str(body.detail),
        kind: str(body.kind, "quest") || "quest",
        reward: Math.min(100, Math.max(5, num(body.reward, 10))),
      })
      .returning();
    return ok({ task }, 201);
  });
}
