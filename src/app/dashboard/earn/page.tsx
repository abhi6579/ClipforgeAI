import { db } from "@/db";
import { creditEvents, offers, tasks } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { and, asc, desc, eq, like } from "drizzle-orm";
import { EarnView } from "@/components/earn-view";

export const dynamic = "force-dynamic";

export default async function EarnPage() {
  const user = await requireUser();
  const [taskRows, offerRows, eventRows, claims] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.userId, user.id)).orderBy(asc(tasks.id)),
    db.select().from(offers).where(eq(offers.active, true)).orderBy(asc(offers.id)),
    db
      .select()
      .from(creditEvents)
      .where(eq(creditEvents.userId, user.id))
      .orderBy(desc(creditEvents.createdAt))
      .limit(30),
    db
      .select({ reason: creditEvents.reason })
      .from(creditEvents)
      .where(and(eq(creditEvents.userId, user.id), like(creditEvents.reason, "Sponsor offer:%"))),
  ]);

  const claimed = new Set(claims.map((c) => c.reason.replace("Sponsor offer: ", "")));

  return (
    <EarnView
      initialTasks={taskRows}
      initialOffers={offerRows.map((o) => ({ ...o, claimed: claimed.has(o.brand) }))}
      initialEvents={eventRows}
    />
  );
}
