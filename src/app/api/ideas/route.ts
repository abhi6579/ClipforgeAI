import { db } from "@/db";
import { ideas } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail, guard, ok, str } from "@/lib/http";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    const user = await requireUser();
    const rows = await db.select().from(ideas).where(eq(ideas.userId, user.id)).orderBy(desc(ideas.createdAt));
    return ok({ ideas: rows });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const user = await requireUser();
    const body = await req.json();
    const title = str(body.title);
    if (title.length < 3) return fail("Idea needs a title.");
    const [idea] = await db
      .insert(ideas)
      .values({
        userId: user.id,
        title,
        angle: str(body.angle),
        platform: str(body.platform, "reels") || "reels",
        status: str(body.status, "backlog") || "backlog",
        scheduledFor: str(body.scheduledFor),
      })
      .returning();
    return ok({ idea }, 201);
  });
}
