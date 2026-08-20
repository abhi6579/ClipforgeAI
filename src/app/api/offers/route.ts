import { db } from "@/db";
import { creditEvents, offers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { guard, ok } from "@/lib/http";
import { and, eq, like } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    const user = await requireUser();
    const list = await db.select().from(offers).where(eq(offers.active, true));
    const claims = await db
      .select({ reason: creditEvents.reason })
      .from(creditEvents)
      .where(and(eq(creditEvents.userId, user.id), eq(creditEvents.source, "sponsor"), like(creditEvents.reason, "Sponsor offer:%")));
    const claimed = new Set(claims.map((c) => c.reason.replace("Sponsor offer: ", "")));
    return ok({ offers: list.map((o) => ({ ...o, claimed: claimed.has(o.brand) })) });
  });
}
