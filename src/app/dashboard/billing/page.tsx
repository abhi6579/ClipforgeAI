import { db } from "@/db";
import { creditEvents } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { and, desc, eq } from "drizzle-orm";
import { BillingView } from "@/components/billing-view";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireUser();
  const events = await db
    .select()
    .from(creditEvents)
    .where(and(eq(creditEvents.userId, user.id), eq(creditEvents.source, "plan")))
    .orderBy(desc(creditEvents.createdAt))
    .limit(20);
  return <BillingView events={events} />;
}
