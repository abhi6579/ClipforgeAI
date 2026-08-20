import { db } from "@/db";
import { tasks, users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";
import { fail, guard, isEmail, ok, str } from "@/lib/http";
import { addCredits } from "@/lib/credits";
import { clientIp, rateLimit, tooMany } from "@/lib/ratelimit";
import { ensureSeed } from "@/lib/seed";
import { eq } from "drizzle-orm";

const STARTER_TASKS = [
  { title: "Add your first video", detail: "Paste a link or describe a video you already filmed.", kind: "daily", reward: 15 },
  { title: "Run an AI overview", detail: "Let ClipForge summarise and score your video.", kind: "daily", reward: 10 },
  { title: "Approve 3 clip cuts", detail: "Pick the cuts you actually want to post.", kind: "quest", reward: 25 },
  { title: "Fill your idea backlog to 5", detail: "Never open the app with an empty slate.", kind: "quest", reward: 25 },
  { title: "Play Hook Rush", detail: "Beat 60 points in the hook-writing mini game.", kind: "quest", reward: 30 },
];

export async function POST(req: Request) {
  return guard(async () => {
    await ensureSeed();

    // Signup is a credit faucet (60 free credits) — throttle farm accounts.
    const limit = rateLimit(`register:${clientIp(req)}`, 5, 60 * 60_000);
    if (!limit.ok) return tooMany(limit.retryAfter);

    const body = await req.json();
    const email = str(body.email).toLowerCase();
    const name = str(body.name);
    const password = str(body.password);

    if (!isEmail(email)) return fail("Enter a valid email address.");
    if (email.length > 200) return fail("That email is too long.");
    if (name.length < 2) return fail("Tell us your creator name.");
    if (name.length > 60) return fail("Keep your name under 60 characters.");
    if (password.length < 6) return fail("Password must be at least 6 characters.");
    if (password.length > 200) return fail("That password is too long.");

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length) return fail("That email is already registered.", 409);

    const [user] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash: hashPassword(password),
        credits: 0,
        avatarHue: Math.floor(Math.random() * 360),
        niche: str(body.niche, "General").slice(0, 60) || "General",
      })
      .returning();

    await db.insert(tasks).values(STARTER_TASKS.map((t) => ({ ...t, userId: user.id })));
    await addCredits(user.id, 60, "Welcome bonus", "system");
    await createSession(user.id);
    return ok({ id: user.id, email: user.email, name: user.name });
  });
}
