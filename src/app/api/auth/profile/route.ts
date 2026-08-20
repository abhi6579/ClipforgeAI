import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { fail, guard, ok, str } from "@/lib/http";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request) {
  return guard(async () => {
    const user = await requireUser();
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    const name = str(body.name);
    const niche = str(body.niche);
    if (name) patch.name = name;
    if (niche) patch.niche = niche;
    if (body.avatarHue !== undefined) patch.avatarHue = Number(body.avatarHue) || 260;

    const newPassword = str(body.newPassword);
    if (newPassword) {
      if (newPassword.length < 6) return fail("New password must be at least 6 characters.");
      if (!verifyPassword(str(body.currentPassword), user.passwordHash)) {
        return fail("Current password is incorrect.");
      }
      patch.passwordHash = hashPassword(newPassword);
    }

    if (Object.keys(patch).length === 0) return fail("Nothing to update.");
    const [updated] = await db.update(users).set(patch).where(eq(users.id, user.id)).returning();
    return ok({ user: { id: updated.id, name: updated.name, niche: updated.niche, avatarHue: updated.avatarHue } });
  });
}
