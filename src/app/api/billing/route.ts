import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail, guard, ok, str } from "@/lib/http";
import { addCredits } from "@/lib/credits";
import { eq } from "drizzle-orm";

const PLAN_BONUS: Record<string, number> = { free: 0, creator: 500, studio: 2000 };

export async function POST(req: Request) {
  return guard(async () => {
    const user = await requireUser();
    const body = await req.json();
    const plan = str(body.plan);
    if (!["free", "creator", "studio"].includes(plan)) return fail("Unknown plan.");
    if (plan === user.plan) return fail(`You are already on ${plan}.`, 409);

    await db.update(users).set({ plan }).where(eq(users.id, user.id));
    let credits = user.credits;
    const bonus = PLAN_BONUS[plan];
    if (bonus > 0) {
      credits = await addCredits(user.id, bonus, `${plan} plan monthly credits`, "plan");
    }
    return ok({ plan, credits });
  });
}
