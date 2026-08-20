"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CreditEvent } from "@/db/schema";
import { PageHeader } from "@/components/dashboard-shell";
import { Badge, Button, Card, useToast } from "@/components/ui";
import { useUser } from "@/components/user-context";

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Learn the workflow, earn credits by playing.",
    perks: ["6 videos", "5 credits per AI run", "Games, tasks & sponsor credits", "Manual clip editor"],
  },
  {
    key: "creator",
    name: "Creator",
    price: "$19",
    cadence: "per month",
    blurb: "For the creator posting 3–5 times a week.",
    perks: ["50 videos", "Unlimited AI overviews", "+500 bonus credits monthly", "Caption & hashtag packs", "Priority queue"],
    highlight: true,
  },
  {
    key: "studio",
    name: "Studio",
    price: "$59",
    cadence: "per month",
    blurb: "Teams, agencies and podcast networks.",
    perks: ["Unlimited videos", "Unlimited AI + idea bursts", "+2000 bonus credits monthly", "Brand voice presets", "Export cut lists in bulk"],
  },
];

export function BillingView({ events }: { events: CreditEvent[] }) {
  const { user, setPlan, setCredits } = useUser();
  const [loading, setLoading] = useState("");
  const toast = useToast();
  const router = useRouter();

  async function choose(plan: string) {
    setLoading(plan);
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    setLoading("");
    if (!res.ok) {
      toast(data.error ?? "Could not switch plan", "error");
      return;
    }
    setPlan(data.plan);
    setCredits(data.credits);
    toast(plan === "free" ? "Switched to Free" : `Welcome to ${plan} 🎉`, "success");
    router.refresh();
  }

  return (
    <>
      <PageHeader
        title="Plans & credits"
        subtitle="Stay free forever with games and sponsor credits, or go unlimited when clipping becomes your job."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => {
          const current = user.plan === p.key;
          return (
            <Card
              key={p.key}
              className={`relative flex flex-col p-6 ${p.highlight ? "ring-1 ring-brand-500/40" : ""}`}
            >
              {p.highlight && (
                <span className="absolute -top-2.5 left-6 rounded-full bg-gradient-to-r from-brand-600 to-fuchsia-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                  Most popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                {current && <Badge tone="green">Current</Badge>}
              </div>
              <p className="mt-1 text-sm text-slate-400">{p.blurb}</p>
              <p className="mt-4">
                <span className="text-3xl font-black text-white">{p.price}</span>{" "}
                <span className="text-xs text-slate-500">{p.cadence}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-300">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex gap-2">
                    <span className="text-brand-400">✓</span>
                    {perk}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6"
                variant={current ? "outline" : p.highlight ? "primary" : "soft"}
                disabled={current}
                loading={loading === p.key}
                onClick={() => choose(p.key)}
              >
                {current ? "You're on this plan" : p.key === "free" ? "Downgrade" : `Upgrade to ${p.name}`}
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Billing history</h2>
          <div className="mt-4 space-y-2">
            {events.length === 0 && (
              <p className="text-sm text-slate-500">No plan activity yet — you're on the free tier.</p>
            )}
            {events.map((e) => (
              <div key={e.id} className="flex items-center justify-between border-b border-white/5 pb-2">
                <div>
                  <p className="text-sm capitalize text-slate-200">{e.reason}</p>
                  <p className="text-[11px] text-slate-600">{new Date(e.createdAt).toLocaleString()}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-300">+{e.amount} ⚡</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">How credits work</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-400">
            <li>⚡ <span className="text-slate-200">AI overview</span> — 5 credits (free on paid plans)</li>
            <li>✨ <span className="text-slate-200">AI idea burst</span> — 3 credits for 3 ideas</li>
            <li>🎮 <span className="text-slate-200">Mini-games</span> — up to 120 credits a day</li>
            <li>🎁 <span className="text-slate-200">Sponsor offers</span> — 25–60 credits each, one-time</li>
            <li>✅ <span className="text-slate-200">Daily tasks</span> — 10–50 credits each</li>
          </ul>
          <p className="mt-5 text-xs text-slate-600">
            This is a demo billing flow — no card is charged. Plan changes apply instantly.
          </p>
        </Card>
      </div>
    </>
  );
}
