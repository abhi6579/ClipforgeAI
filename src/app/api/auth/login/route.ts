import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";
import { fail, guard, ok, str } from "@/lib/http";
import { clientIp, rateLimit, tooMany } from "@/lib/ratelimit";
import { ensureSeed } from "@/lib/seed";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  return guard(async () => {
    await ensureSeed();
    const ip = clientIp(req);

    // Per-IP ceiling stops a spray across many accounts.
    const ipLimit = rateLimit(`login-ip:${ip}`, 20, 10 * 60_000);
    if (!ipLimit.ok) return tooMany(ipLimit.retryAfter);

    const body = await req.json();
    const email = str(body.email).toLowerCase();
    const password = str(body.password);

    // Per-account ceiling stops a brute force on one target.
    const acctLimit = rateLimit(`login-acct:${email}`, 8, 10 * 60_000);
    if (!acctLimit.ok) return tooMany(acctLimit.retryAfter);

    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = rows[0];
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return fail("Email or password is incorrect.", 401);
    }

    await createSession(user.id);
    return ok({ id: user.id, email: user.email, name: user.name });
  });
}
