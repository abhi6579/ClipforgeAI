import { db } from "@/db";
import { creditEvents, offers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail, guard, ok } from "@/lib/http";
import { addCredits } from "@/lib/credits";
import { and, eq } from "drizzle-orm";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  return guard(async () => {
    const user = await requireUser();
    const id = Number((await params).id);
    const [offer] = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
    if (!offer) return fail("Offer not found.", 404);

    const reason = `Sponsor offer: ${offer.brand}`;
    const existing = await db
      .select({ id: creditEvents.id })
      .from(creditEvents)
      .where(and(eq(creditEvents.userId, user.id), eq(creditEvents.reason, reason)))
      .limit(1);
    if (existing.length) return fail("You already claimed this offer.", 409);

    const credits = await addCredits(user.id, offer.reward, reason, "sponsor");
    return ok({ credits, reward: offer.reward });
  });
}
