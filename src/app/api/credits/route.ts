import { db } from "@/db";
import { creditEvents } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { guard, ok } from "@/lib/http";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    const user = await requireUser();
    const events = await db
      .select()
      .from(creditEvents)
      .where(eq(creditEvents.userId, user.id))
      .orderBy(desc(creditEvents.createdAt))
      .limit(40);
    return ok({ events, credits: user.credits });
  });
}
