"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useUser } from "@/components/user-context";
import { Button, cn } from "@/components/ui";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "◎" },
  { href: "/dashboard/projects", label: "Videos", icon: "▶" },
  { href: "/dashboard/clips", label: "Clip Studio", icon: "✂" },
  { href: "/dashboard/ideas", label: "Idea Board", icon: "✦" },
  { href: "/dashboard/earn", label: "Earn Credits", icon: "🎮" },
  { href: "/dashboard/billing", label: "Plans", icon: "◆" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙" },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((item) => {
        const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
              active
                ? "bg-gradient-to-r from-brand-600/25 to-transparent text-white shadow-inner ring-1 ring-brand-500/25"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
            )}
          >
            <span className={cn("text-base", active ? "text-brand-400" : "text-slate-500")}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar - desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/8 bg-ink-900/70 p-4 lg:flex">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-2 py-1">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-lg font-black text-white">
            C
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight text-white">ClipForge AI</span>
            <span className="block text-[11px] text-slate-500">Creator studio</span>
          </span>
        </Link>
        {nav}
        <div className="mt-4 rounded-2xl border border-white/8 bg-gradient-to-br from-brand-600/20 to-transparent p-4">
          <p className="text-xs text-slate-400">Credit balance</p>
          <p className="mt-0.5 text-2xl font-bold text-white">{user.credits}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {user.plan === "free" ? "Free plan · 5 credits per AI run" : `${user.plan} plan · unlimited AI`}
          </p>
          <Link href="/dashboard/earn">
            <Button size="sm" variant="soft" className="mt-3 w-full">
              Earn more free →
            </Button>
          </Link>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="animate-fade-up relative flex h-full w-64 flex-col border-r border-white/10 bg-ink-900 p-4">
            <span className="mb-6 px-2 text-sm font-semibold text-white">ClipForge AI</span>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/8 bg-ink-950/85 px-4 py-3 backdrop-blur-xl sm:px-6">
          <button
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-sm text-slate-300 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            ☰
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {NAV.find((n) => (n.href === "/dashboard" ? pathname === n.href : pathname.startsWith(n.href)))?.label ??
                "Dashboard"}
            </p>
            <p className="hidden text-[11px] text-slate-500 sm:block">
              🔥 {user.streak}-day streak · {user.niche}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="hidden items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200 sm:inline-flex">
              ⚡ {user.credits}
            </span>
            <span
              className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white"
              style={{ background: `hsl(${user.avatarHue} 70% 45%)` }}
              title={user.email}
            >
              {user.name.charAt(0).toUpperCase()}
            </span>
            <Button size="sm" variant="ghost" onClick={logout} loading={loggingOut}>
              Log out
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
