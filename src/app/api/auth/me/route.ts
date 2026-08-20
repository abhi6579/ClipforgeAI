import { getCurrentUser } from "@/lib/auth";
import { guard, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return guard(async () => {
    const user = await getCurrentUser();
    if (!user) return ok({ user: null });
    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        credits: user.credits,
        streak: user.streak,
      },
    });
  });
}
