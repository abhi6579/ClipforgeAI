import Link from "next/link";
import { ensureSeed } from "@/lib/seed";
import { getCurrentUser } from "@/lib/auth";
import { SUPPORT_EMAIL } from "@/lib/site";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: "🧠",
    title: "AI overview in seconds",
    body: "Drop a link or describe your footage. Get a summary, vibe read, retention risk and a 0–100 virality score.",
  },
  {
    icon: "✂️",
    title: "Auto clip cut plan",
    body: "Timestamped cuts with hooks, captions and hashtags — plus a copy-paste ffmpeg command for each one.",
  },
  {
    icon: "✦",
    title: "Idea board that refills itself",
    body: "Kanban from backlog to posted, with an AI idea burst tuned to your niche when you run dry.",
  },
  {
    icon: "🎮",
    title: "Play, earn, create",
    body: "Hook Rush and Trend Spin mini-games plus daily tasks pay real credits you spend on AI runs.",
  },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Learn the workflow, earn credits by playing.",
    perks: ["6 videos", "5 credits per AI run", "Games, tasks & sponsor credits", "Manual clip editor"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Creator",
    price: "$19",
    cadence: "/month",
    blurb: "For creators posting 3–5 times a week.",
    perks: ["50 videos", "Unlimited AI overviews", "+500 bonus credits monthly", "Caption & hashtag packs", "Priority queue"],
    cta: "Go Creator",
    highlight: true,
  },
  {
    name: "Studio",
    price: "$59",
    cadence: "/month",
    blurb: "Teams, agencies and podcast networks.",
    perks: ["Unlimited videos", "Unlimited AI + idea bursts", "+2000 bonus credits monthly", "Brand voice presets", "Bulk cut-list export"],
    cta: "Go Studio",
    highlight: false,
  },
];

const STEPS = [
  { n: "01", t: "Add the video", d: "Paste a URL or describe the raw footage and length." },
  { n: "02", t: "Run the AI overview", d: "Score, hooks, suggestions and cut points in one pass." },
  { n: "03", t: "Approve the cuts", d: "Edit titles and captions, then export the cut list." },
  { n: "04", t: "Post & repeat", d: "Tick off daily tasks, keep the streak, earn credits back." },
];

export default async function LandingPage() {
  await ensureSeed();
  const user = await getCurrentUser();

  return (
    <div className="grid-glow min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-lg font-black text-white">
            C
          </span>
          <span className="font-semibold text-white">ClipForge AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="rounded-xl px-3.5 py-2 text-sm text-slate-300 hover:bg-white/8 hover:text-white"
          >
            {user ? "Dashboard" : "Sign in"}
          </Link>
          <Link
            href={user ? "/dashboard" : "/register"}
            className="rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-brand-600/25 hover:brightness-110"
          >
            {user ? "Open studio" : "Start free"}
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-3 py-1 text-xs text-brand-300">
              ⚡ Free credits every single day
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
              Turn one long video into a{" "}
              <span className="bg-gradient-to-r from-brand-400 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
                week of scroll-stopping clips
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              ClipForge reads your footage, tells you exactly where to cut, writes the hook and caption, and scores the
              result — so you stop guessing what the algorithm wants.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={user ? "/dashboard" : "/register"}
                className="rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-500 px-6 py-3 font-medium text-white shadow-xl shadow-brand-600/30 hover:brightness-110"
              >
                Create free account
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-white/12 px-6 py-3 text-slate-200 hover:border-white/25 hover:bg-white/5"
              >
                Try the demo studio →
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-500">
              <span>✓ No card required</span>
              <span>✓ 60 welcome credits</span>
              <span>✓ Cancel anytime</span>
            </div>
          </div>

          <div className="animate-fade-up glass rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <span className="text-sm font-medium text-white">Podcast ep. 12 — 58:00</span>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] text-emerald-300">
                Score 87
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { t: "Hook cut — audience without ads", r: "02:14 → 02:41", s: 92 },
                { t: "Proof cut — the failed launch", r: "18:03 → 18:38", s: 84 },
                { t: "Contrarian cut — 'ads are a tax'", r: "31:50 → 32:19", s: 79 },
              ].map((c) => (
                <div key={c.t} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm text-slate-100">{c.t}</p>
                    <span className="shrink-0 text-xs font-semibold text-brand-300">{c.s}</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">{c.r}</p>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-400"
                      style={{ width: `${c.s}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-xl bg-brand-500/10 p-3 text-xs leading-relaxed text-brand-200">
              💡 Move the funding story to 0:00 — it promises a payoff in the first 1.5 seconds.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">Everything a growing creator needs</h2>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-5 transition hover:-translate-y-1 hover:border-brand-500/30">
              <div className="mb-3 text-2xl">{f.icon}</div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">Four steps, ten minutes</h2>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/8 p-5">
              <span className="text-3xl font-black text-white/10">{s.n}</span>
              <h3 className="mt-2 font-semibold text-white">{s.t}</h3>
              <p className="mt-1 text-sm text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">Free forever, or unlimited</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-400">
          Earn credits by playing games and completing tasks — or skip the grind and go unlimited.
        </p>
        <div className="mt-9 grid gap-4 lg:grid-cols-3">
          {PRICING.map((p) => (
            <div
              key={p.name}
              className={`glass relative flex flex-col rounded-2xl p-6 ${
                p.highlight ? "ring-1 ring-brand-500/40" : ""
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-2.5 left-6 rounded-full bg-gradient-to-r from-brand-600 to-fuchsia-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-white">{p.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{p.blurb}</p>
              <p className="mt-4">
                <span className="text-3xl font-black text-white">{p.price}</span>
                <span className="ml-1 text-xs text-slate-500">{p.cadence}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-300">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex gap-2">
                    <span className="text-brand-400">✓</span>
                    {perk}
                  </li>
                ))}
              </ul>
              <Link
                href={user ? "/dashboard/billing" : "/register"}
                className={`mt-6 rounded-xl px-4 py-2.5 text-center text-sm font-medium transition ${
                  p.highlight
                    ? "bg-gradient-to-r from-brand-600 to-fuchsia-500 text-white shadow-lg shadow-brand-600/25 hover:brightness-110"
                    : "bg-white/8 text-slate-100 hover:bg-white/14"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="glass overflow-hidden rounded-3xl p-8 text-center sm:p-14">
          <h2 className="text-2xl font-bold text-white sm:text-4xl">Your next viral clip is already filmed.</h2>
          <p className="mx-auto mt-3 max-w-lg text-slate-400">
            It's sitting in a 40-minute file. ClipForge finds it in under a minute.
          </p>
          <Link
            href={user ? "/dashboard" : "/register"}
            className="mt-7 inline-block rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-500 px-7 py-3 font-medium text-white shadow-xl shadow-brand-600/30 hover:brightness-110"
          >
            Open ClipForge free
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/8 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <Link href="#pricing" className="hover:text-slate-300">
              Pricing
            </Link>
            <Link href="/terms" className="hover:text-slate-300">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-slate-300">
              Privacy
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-slate-300">
              Support
            </a>
          </div>
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} ClipForge AI · Built for creators who ship.
          </p>
          <p className="text-xs text-slate-700">
            Try it instantly — demo@clipforge.ai / demo1234
          </p>
        </div>
      </footer>
    </div>
  );
}
