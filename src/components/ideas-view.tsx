"use client";

import { useState } from "react";
import type { Idea } from "@/db/schema";
import { PageHeader } from "@/components/dashboard-shell";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, useToast } from "@/components/ui";
import { useUser } from "@/components/user-context";

const COLUMNS = [
  { key: "backlog", label: "Backlog", tone: "neutral" as const },
  { key: "scripting", label: "Scripting", tone: "violet" as const },
  { key: "filming", label: "Filming", tone: "amber" as const },
  { key: "posted", label: "Posted", tone: "green" as const },
];

const PLATFORMS = ["reels", "tiktok", "shorts", "youtube", "podcast", "linkedin"];

export function IdeasView({ initial }: { initial: Idea[] }) {
  const [ideas, setIdeas] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Idea | null>(null);
  const [saving, setSaving] = useState(false);
  const [bursting, setBursting] = useState(false);
  const toast = useToast();
  const { user, setCredits } = useUser();

  const blank = { title: "", angle: "", platform: "reels", status: "backlog", scheduledFor: "" };
  const [form, setForm] = useState(blank);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(editing ? `/api/ideas/${editing.id}` : "/api/ideas", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast(data.error ?? "Could not save", "error");
      return;
    }
    if (editing) setIdeas((l) => l.map((i) => (i.id === editing.id ? data.idea : i)));
    else setIdeas((l) => [data.idea, ...l]);
    setOpen(false);
    setEditing(null);
    toast(editing ? "Idea updated" : "Idea added", "success");
  }

  async function move(idea: Idea, status: string) {
    const snapshot = ideas;
    setIdeas((l) => l.map((i) => (i.id === idea.id ? { ...i, status } : i)));
    const res = await fetch(`/api/ideas/${idea.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setIdeas(snapshot);
      toast("Move failed", "error");
    }
  }

  async function remove(idea: Idea) {
    const snapshot = ideas;
    setIdeas((l) => l.filter((i) => i.id !== idea.id));
    const res = await fetch(`/api/ideas/${idea.id}`, { method: "DELETE" });
    if (!res.ok) {
      setIdeas(snapshot);
      toast("Delete failed", "error");
    }
  }

  async function burst() {
    setBursting(true);
    const res = await fetch("/api/ideas/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche: user.niche, platform: "reels" }),
    });
    const data = await res.json();
    setBursting(false);
    if (!res.ok) {
      toast(data.error ?? "Could not generate", "error");
      return;
    }
    setIdeas((l) => [...data.ideas, ...l]);
    setCredits(data.credits);
    toast("3 fresh ideas dropped in your backlog ✨", "success");
  }

  return (
    <>
      <PageHeader
        title="Idea Board"
        subtitle="Never open the app with an empty slate. Move ideas from backlog to posted."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={burst} loading={bursting}>
              ✨ AI idea burst {user.plan === "free" && <span className="text-[11px] opacity-70">3⚡</span>}
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setForm(blank);
                setOpen(true);
              }}
            >
              + New idea
            </Button>
          </div>
        }
      />

      {ideas.length === 0 ? (
        <EmptyState
          icon="✦"
          title="Your board is empty"
          body="Capture rough ideas here, or let the AI generate three tuned to your niche."
          action={
            <Button onClick={burst} loading={bursting}>
              Generate 3 ideas
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = ideas.filter((i) => i.status === col.key);
            return (
              <div key={col.key} className="rounded-2xl border border-white/8 bg-white/[0.02] p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className="text-sm font-semibold text-white">{col.label}</span>
                  <Badge tone={col.tone}>{items.length}</Badge>
                </div>
                <div className="space-y-2.5">
                  {items.length === 0 && (
                    <p className="rounded-xl border border-dashed border-white/8 px-3 py-6 text-center text-xs text-slate-600">
                      Nothing here
                    </p>
                  )}
                  {items.map((idea) => (
                    <Card key={idea.id} className="animate-fade-up p-3.5">
                      <p className="text-sm font-medium leading-snug text-white">{idea.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                        {idea.angle && <span className="rounded bg-white/6 px-1.5 py-0.5">{idea.angle}</span>}
                        <span className="rounded bg-white/6 px-1.5 py-0.5">{idea.platform}</span>
                        {idea.scheduledFor && <span className="text-brand-300">📅 {idea.scheduledFor}</span>}
                      </div>
                      <div className="mt-3 flex items-center gap-1">
                        <Select
                          value={idea.status}
                          onChange={(e) => move(idea, e.target.value)}
                          className="!py-1 !text-[11px]"
                        >
                          {COLUMNS.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.label}
                            </option>
                          ))}
                        </Select>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(idea);
                            setForm({
                              title: idea.title,
                              angle: idea.angle,
                              platform: idea.platform,
                              status: idea.status,
                              scheduledFor: idea.scheduledFor,
                            });
                            setOpen(true);
                          }}
                        >
                          ✎
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => remove(idea)}>
                          🗑
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit idea" : "New idea"}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Idea">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="Angle" hint="Story, comparison, reaction, tutorial…">
            <Input value={form.angle} onChange={(e) => setForm({ ...form, angle: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Platform">
              <Select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {COLUMNS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Scheduled">
              <Input
                value={form.scheduledFor}
                onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
                placeholder="Fri"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save idea
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
