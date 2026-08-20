"use client";

import { useState } from "react";
import type { CreditEvent, Offer, Task } from "@/db/schema";
import { PageHeader } from "@/components/dashboard-shell";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, useToast } from "@/components/ui";
import { useUser } from "@/components/user-context";

type OfferRow = Offer & { claimed: boolean };

const ROUNDS = [
  {
    q: "Which opener holds more viewers past 3 seconds?",
    a: "Hey guys, welcome back to another video…",
    b: "I deleted 400 videos. These 3 survived.",
    correct: "b",
  },
  {
    q: "Which caption drives more saves?",
    a: "New video is up, link in bio!",
    b: "Save this before your next shoot — 5 settings, 30 seconds.",
    correct: "b",
  },
  {
    q: "Which first frame is stronger?",
    a: "Talking head, arms crossed, static wide shot",
    b: "Close-up of the finished result, then cut to you",
    correct: "b",
  },
  {
    q: "Which ending gets more replays?",
    a: "Thanks for watching, see you next time!",
    b: "…and that's why step one matters. (loops to step one)",
    correct: "b",
  },
  {
    q: "Which pinned comment gets more replies?",
    a: "What did you think?",
    b: "Team hard cut or team crossfade? 👇",
    correct: "b",
  },
];

export function EarnView({
  initialTasks,
  initialOffers,
  initialEvents,
}: {
  initialTasks: Task[];
  initialOffers: OfferRow[];
  initialEvents: CreditEvent[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [offers, setOffers] = useState(initialOffers);
  const [events, setEvents] = useState(initialEvents);
  const { user, setCredits } = useUser();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", detail: "", reward: 10 });

  // game state
  const [round, setRound] = useState(-1);
  const [score, setScore] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinFace, setSpinFace] = useState("🎰");

  const doneCount = tasks.filter((t) => t.done).length;
  const potential = tasks.filter((t) => !t.done).reduce((s, t) => s + t.reward, 0);

  function pushEvent(amount: number, reason: string, source: string) {
    setEvents((e) => [
      { id: Math.random(), userId: user.id, amount, reason, source, createdAt: new Date() } as CreditEvent,
      ...e,
    ]);
  }

  async function toggle(task: Task) {
    const next = !task.done;
    const snapshot = tasks;
    setTasks((l) => l.map((t) => (t.id === task.id ? { ...t, done: next } : t)));
    setCredits(user.credits + (next ? task.reward : -task.reward)); // optimistic
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: next }),
    });
    const data = await res.json();
    if (!res.ok) {
      setTasks(snapshot);
      setCredits(user.credits);
      toast("Could not update task", "error");
      return;
    }
    setCredits(data.credits);
    if (next) {
      pushEvent(task.reward, `Completed: ${task.title}`, "task");
      toast(`+${task.reward} credits earned ⚡`, "success");
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast(data.error ?? "Could not add task", "error");
      return;
    }
    setTasks((l) => [...l, data.task]);
    setForm({ title: "", detail: "", reward: 10 });
    setOpen(false);
    toast("Custom quest added", "success");
  }

  async function removeTask(task: Task) {
    const snapshot = tasks;
    setTasks((l) => l.filter((t) => t.id !== task.id));
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (!res.ok) {
      setTasks(snapshot);
      toast("Delete failed", "error");
    }
  }

  async function submitGame(game: string, points: number) {
    const res = await fetch("/api/games/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game, score: points }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error ?? "Could not save score", "error");
      return;
    }
    setCredits(data.credits);
    pushEvent(data.reward, game === "spin" ? "Trend Spin reward" : "Hook Rush reward", "game");
    toast(`+${data.reward} credits! ${data.remainingToday} left in today's cap`, "success");
  }

  function answer(choice: "a" | "b") {
    const correct = ROUNDS[round].correct === choice;
    const points = correct ? 20 : 0;
    const total = score + points;
    setScore(total);
    if (round + 1 >= ROUNDS.length) {
      setRound(-2);
      submitGame("hook-rush", total);
    } else {
      setRound(round + 1);
    }
    toast(correct ? "Nice — that's the scroll-stopper" : "Close! The other one wins", correct ? "success" : "info");
  }

  async function spin() {
    setSpinning(true);
    const faces = ["🎬", "🔥", "⚡", "✨", "🎯", "🚀"];
    let i = 0;
    const timer = setInterval(() => {
      setSpinFace(faces[i++ % faces.length]);
    }, 90);
    await new Promise((r) => setTimeout(r, 1400));
    clearInterval(timer);
    setSpinFace("🎉");
    setSpinning(false);
    await submitGame("spin", 20 + Math.floor(Math.random() * 60));
  }

  async function claim(offer: OfferRow) {
    const snapshot = offers;
    setOffers((l) => l.map((o) => (o.id === offer.id ? { ...o, claimed: true } : o)));
    const res = await fetch(`/api/offers/${offer.id}/claim`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setOffers(snapshot);
      toast(data.error ?? "Could not claim", "error");
      return;
    }
    setCredits(data.credits);
    pushEvent(offer.reward, `Sponsor offer: ${offer.brand}`, "sponsor");
    toast(`+${offer.reward} credits from ${offer.brand} 🎁`, "success");
  }

  return (
    <>
      <PageHeader
        title="Earn Credits"
        subtitle="Credits pay for AI runs. Complete tasks, beat mini-games, or try a sponsor app — all free."
        action={
          <Button variant="outline" onClick={() => setOpen(true)}>
            + Custom quest
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Balance", value: `${user.credits} ⚡`, sub: `${user.plan} plan` },
          { label: "Tasks done", value: `${doneCount}/${tasks.length}`, sub: `${potential} credits still on the table` },
          { label: "Streak", value: `${user.streak} days`, sub: "Keep it alive for bonus quests" },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{s.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{s.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Tasks & quests</h2>
            {tasks.length === 0 ? (
              <EmptyState icon="✅" title="No tasks yet" body="Add a custom quest to start earning credits." />
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`group flex items-center gap-3 rounded-xl border p-3.5 transition ${
                      t.done ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/8 bg-white/[0.03]"
                    }`}
                  >
                    <button
                      onClick={() => toggle(t)}
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border text-xs transition ${
                        t.done
                          ? "border-emerald-400/50 bg-emerald-500/25 text-emerald-200"
                          : "border-white/15 text-transparent hover:border-brand-400"
                      }`}
                    >
                      ✓
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${t.done ? "text-slate-500 line-through" : "text-white"}`}>{t.title}</p>
                      {t.detail && <p className="truncate text-xs text-slate-500">{t.detail}</p>}
                    </div>
                    <Badge tone={t.kind === "daily" ? "sky" : "violet"}>{t.kind}</Badge>
                    <span className="text-xs font-semibold text-amber-300">+{t.reward}</span>
                    <button
                      onClick={() => removeTask(t)}
                      className="text-xs text-slate-600 opacity-0 transition group-hover:opacity-100 hover:text-rose-300"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Hook Rush</h2>
              <Badge tone="amber">up to 100 ⚡</Badge>
            </div>
            {round === -1 && (
              <div className="text-center">
                <p className="text-sm text-slate-400">
                  5 rounds. Pick the hook that actually stops the scroll. Train your instinct, earn credits.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setScore(0);
                    setRound(0);
                  }}
                >
                  Play Hook Rush
                </Button>
              </div>
            )}
            {round >= 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Round {round + 1} / {ROUNDS.length}
                  </span>
                  <span>Score {score}</span>
                </div>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-400 transition-all"
                    style={{ width: `${((round + 1) / ROUNDS.length) * 100}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-white">{ROUNDS[round].q}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(["a", "b"] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => answer(k)}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-left text-sm text-slate-200 transition hover:border-brand-500/50 hover:bg-brand-500/10"
                    >
                      {ROUNDS[round][k]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {round === -2 && (
              <div className="text-center">
                <p className="text-3xl">🏆</p>
                <p className="mt-2 text-sm text-white">You scored {score} / 100</p>
                <Button
                  variant="soft"
                  className="mt-3"
                  onClick={() => {
                    setScore(0);
                    setRound(-1);
                  }}
                >
                  Play again
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Trend Spin</h2>
              <Badge tone="sky">random bonus</Badge>
            </div>
            <div className="flex items-center gap-5">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border border-white/10 bg-ink-900 text-4xl">
                {spinFace}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-400">One spin, one random credit drop. Daily cap applies.</p>
                <Button className="mt-3" onClick={spin} loading={spinning}>
                  Spin the wheel
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Sponsored offers</h2>
            <p className="mb-4 text-xs text-slate-500">Try a partner app, keep the credits. This is how we stay free.</p>
            <div className="space-y-3">
              {offers.map((o) => (
                <div key={o.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{o.brand}</p>
                    <span className="text-xs font-semibold text-amber-300">+{o.reward} ⚡</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{o.headline}</p>
                  <p className="mt-1 text-xs text-slate-500">{o.detail}</p>
                  <Button
                    size="sm"
                    variant={o.claimed ? "ghost" : "soft"}
                    className="mt-3 w-full"
                    disabled={o.claimed}
                    onClick={() => claim(o)}
                  >
                    {o.claimed ? "Claimed ✓" : "Try & claim"}
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Credit activity</h2>
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {events.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}
              {events.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 border-b border-white/5 pb-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-200">{e.reason}</p>
                    <p className="text-[11px] capitalize text-slate-600">{e.source}</p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${e.amount >= 0 ? "text-emerald-300" : "text-rose-300"}`}
                  >
                    {e.amount >= 0 ? "+" : ""}
                    {e.amount}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add a custom quest" description="Hold yourself accountable — and get paid in credits.">
        <form onSubmit={addTask} className="space-y-4">
          <Field label="Quest">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Film 3 b-roll shots"
              required
            />
          </Field>
          <Field label="Detail">
            <Input value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
          </Field>
          <Field label="Reward (5–100 credits)">
            <Input
              type="number"
              min={5}
              max={100}
              value={form.reward}
              onChange={(e) => setForm({ ...form, reward: Number(e.target.value) })}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add quest
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
