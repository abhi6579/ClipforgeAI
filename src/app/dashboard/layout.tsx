import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import { ensureDaily } from "@/lib/daily";
import { UserProvider } from "@/components/user-context";
import { DashboardShell } from "@/components/dashboard-shell";
import { ToastProvider } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await ensureSeed();
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  // Roll the day over: reset daily tasks, advance or break the streak.
  const { user } = await ensureDaily(current);

  return (
    <UserProvider
      value={{
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        credits: user.credits,
        streak: user.streak,
        niche: user.niche,
        avatarHue: user.avatarHue,
      }}
    >
      <ToastProvider>
        <div className="grid-glow min-h-screen">
          <DashboardShell>{children}</DashboardShell>
        </div>
      </ToastProvider>
    </UserProvider>
  );
}
