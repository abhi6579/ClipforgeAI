import Link from "next/link";
import { db } from "@/db";
import { clips, creditEvents, ideas, projects, tasks } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { desc, eq, sql } from "drizzle-orm";
import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/dashboard-shell";
import { fmtTime } from "@/lib/ai";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const user = await requireUser();
  const count = sql<number>`count(*)::int`;

  const [projectRows, topClips, openTasks, recentEvents, [clipStats], [ideaCount]] = await Promise.all([
    db.select().from(projects).where(eq(projects.userId, user.id)).orderBy(desc(projects.updatedAt)).limit(4),
    db.select().from(clips).where(eq(clips.userId, user.id)).orderBy(desc(clips.score)).limit(5),
    db.select().from(tasks).where(eq(tasks.userId, user.id)).limit(20),
    db
      .select()
      .from(creditEvents)
      .where(eq(creditEvents.userId, user.id))
      .orderBy(desc(creditEvents.createdAt))
      .limit(6),
    db
      .select({ n: count, avg: sql<number>`coalesce(round(avg(${clips.score})), 0)::int` })
      .from(clips)
      .where(eq(clips.userId, user.id)),
    db.select({ n: count }).from(ideas).where(eq(ideas.userId, user.id)),
  ]);

  const pendingTasks = openTasks.filter((t) => !t.done);
  const stats = [
    { label: "Videos in library", value: projectRows.length ? `${projectRows.length}+` : "0", hint: "Ready to slice", href: "/dashboard/projects" },
    { label: "Clips generated", value: clipStats?.n ?? 0, hint: `avg score ${clipStats?.avg ?? 0}`, href: "/dashboard/clips" },
    { label: "Ideas queued", value: ideaCount?.n ?? 0, hint: "Backlog to posted", href: "/dashboard/ideas" },
    { label: "Credits", value: user.credits, hint: `${pendingTasks.length} tasks pending`, href: "/dashboard/earn" },
  ];

  return (
    <>
      <PageHeader
        title={`Hey ${user.name.split(" ")[0]} 👋`}
        subtitle="Here's what your studio looks like today. Pick a video, run the AI, ship a clip."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="p-5 transition hover:-translate-y-0.5 hover:border-brand-500/30">
              <p className="text-xs uppercase tracking-wide text-slate-500">{s.label}</p>
              <p className="mt-1.5 text-3xl font-bold text-white">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.hint}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Recent videos</h2>
              <Link href="/dashboard/projects" className="text-xs text-brand-400 hover:underline">
                View all →
              </Link>
            </div>
            {projectRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                <p className="text-sm text-slate-400">No videos yet.</p>
                <Link href="/dashboard/projects" className="mt-2 inline-block text-sm text-brand-400 hover:underline">
                  Add your first video →
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {projectRows.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/projects/${p.id}`}
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3.5 transition hover:border-brand-500/35"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-600/40 to-fuchsia-500/25 text-sm">
                      ▶
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{p.title}</span>
                      <span className="block text-[11px] text-slate-500">
                        {p.platform} · {fmtTime(p.durationSec)} · {p.status}
                      </span>
                    </span>
                    {p.analysis && <Badge tone="green">{p.analysis.score}</Badge>}
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Top scoring clips</h2>
              <Link href="/dashboard/clips" className="text-xs text-brand-400 hover:underline">
                Clip studio →
              </Link>
            </div>
            {topClips.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
                Run an AI overview to fill this list.
              </p>
            ) : (
              <div className="space-y-2.5">
                {topClips.map((c) => (
                  <div key={c.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm text-white">{c.title}</p>
                      <span className="shrink-0 text-xs font-semibold text-brand-300">{Math.round(c.score)}</span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-slate-500">
                      {fmtTime(c.startSec)} → {fmtTime(c.endSec)} · {c.status}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-400"
                        style={{ width: `${c.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Today&apos;s tasks</h2>
              <Link href="/dashboard/earn" className="text-xs text-brand-400 hover:underline">
                Earn →
              </Link>
            </div>
            {pendingTasks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">
                All caught up 🎉
              </p>
            ) : (
              <div className="space-y-2">
                {pendingTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-xl border border-white/8 p-3">
                    <span className="h-5 w-5 shrink-0 rounded-md border border-white/15" />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{t.title}</span>
                    <span className="text-xs font-semibold text-amber-300">+{t.reward}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Credit activity</h2>
            {recentEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No activity yet.</p>
            ) : (
              <div className="space-y-2">
                {recentEvents.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 border-b border-white/5 pb-2">
                    <p className="truncate text-sm text-slate-300">{e.reason}</p>
                    <span
                      className={`shrink-0 text-sm font-semibold ${e.amount >= 0 ? "text-emerald-300" : "text-rose-300"}`}
                    >
                      {e.amount >= 0 ? "+" : ""}
                      {e.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="bg-gradient-to-br from-brand-600/25 to-transparent p-5">
            <h2 className="text-sm font-semibold text-white">Go unlimited</h2>
            <p className="mt-1 text-sm text-slate-300">
              Unlimited AI overviews, 500 bonus credits and priority processing on the Creator plan.
            </p>
            <Link
              href="/dashboard/billing"
              className="mt-4 inline-block rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
            >
              See plans →
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
