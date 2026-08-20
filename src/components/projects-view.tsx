"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/db/schema";
import { PageHeader } from "@/components/dashboard-shell";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Textarea, useToast } from "@/components/ui";
import { useUser } from "@/components/user-context";
import { fmtTime } from "@/lib/ai";

export type ProjectRow = Project & { clipCount: number };

const PLATFORMS = ["reels", "tiktok", "shorts", "youtube", "podcast", "linkedin"];
const GOALS = ["growth", "authority", "reach", "sales", "entertainment"];

const STATUS_TONE: Record<string, "neutral" | "violet" | "green" | "amber"> = {
  draft: "neutral",
  analyzing: "amber",
  ready: "violet",
  published: "green",
};

export function ProjectsView({ initial }: { initial: ProjectRow[] }) {
  const [projects, setProjects] = useState<ProjectRow[]>(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const { user } = useUser();

  const empty = { title: "", platform: "reels", sourceUrl: "", durationSec: 600, goal: "growth", notes: "" };
  const [form, setForm] = useState(empty);

  const visible = useMemo(
    () =>
      projects.filter(
        (p) =>
          (filter === "all" || p.status === filter) &&
          (query.trim() === "" || p.title.toLowerCase().includes(query.toLowerCase())),
      ),
    [projects, filter, query],
  );

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(p: ProjectRow) {
    setEditing(p);
    setForm({
      title: p.title,
      platform: p.platform,
      sourceUrl: p.sourceUrl,
      durationSec: p.durationSec,
      goal: p.goal,
      notes: p.notes,
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = editing ? `/api/projects/${editing.id}` : "/api/projects";
    const res = await fetch(url, {
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
    if (editing) {
      setProjects((list) => list.map((p) => (p.id === editing.id ? { ...p, ...data.project } : p)));
      toast("Video updated", "success");
    } else {
      setProjects((list) => [data.project, ...list]);
      toast("Video added — run the AI overview next", "success");
    }
    setOpen(false);
    startTransition(() => router.refresh());
  }

  async function remove(p: ProjectRow) {
    const snapshot = projects;
    setProjects((list) => list.filter((x) => x.id !== p.id)); // optimistic
    const res = await fetch(`/api/projects/${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      setProjects(snapshot);
      toast("Delete failed", "error");
      return;
    }
    toast(`Deleted “${p.title}”`, "success");
    startTransition(() => router.refresh());
  }

  async function cycleStatus(p: ProjectRow) {
    const next = p.status === "published" ? "ready" : "published";
    setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    const res = await fetch(`/api/projects/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, status: p.status } : x)));
      toast("Could not update status", "error");
    }
  }

  return (
    <>
      <PageHeader
        title="Videos"
        subtitle="Every piece of raw footage you want to slice. Add a link or just describe it — the AI works with both."
        action={
          <Button onClick={openCreate}>
            + Add video
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search videos…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {["all", "draft", "ready", "published"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs capitalize transition ${
                filter === s ? "bg-brand-500/20 text-brand-200 ring-1 ring-brand-500/30" : "text-slate-400 hover:bg-white/6"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-500">
          {projects.length} / {user.plan === "free" ? 6 : user.plan === "creator" ? 50 : "∞"} slots used
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon="🎬"
          title={projects.length === 0 ? "No videos yet" : "Nothing matches that filter"}
          body={
            projects.length === 0
              ? "Add your first video and ClipForge will find the moments worth posting."
              : "Try a different status or clear your search."
          }
          action={projects.length === 0 ? <Button onClick={openCreate}>Add your first video</Button> : null}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <Card key={p.id} className="animate-fade-up flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <Badge tone={STATUS_TONE[p.status] ?? "neutral"}>{p.status}</Badge>
                <span className="font-mono text-[11px] text-slate-500">{fmtTime(p.durationSec)}</span>
              </div>
              <Link href={`/dashboard/projects/${p.id}`} className="mt-3 block">
                <h3 className="line-clamp-2 text-base font-semibold text-white hover:text-brand-300">{p.title}</h3>
              </Link>
              <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-slate-400">
                {p.notes || "No production notes yet."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span className="rounded-md bg-white/6 px-2 py-0.5 capitalize">{p.platform}</span>
                <span className="rounded-md bg-white/6 px-2 py-0.5 capitalize">{p.goal}</span>
                <span className="rounded-md bg-white/6 px-2 py-0.5">✂ {p.clipCount} clips</span>
                {p.analysis && (
                  <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
                    score {p.analysis.score}
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center gap-1.5 border-t border-white/6 pt-3">
                <Link href={`/dashboard/projects/${p.id}`} className="flex-1">
                  <Button size="sm" variant="soft" className="w-full">
                    Open
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={() => cycleStatus(p)} title="Toggle published">
                  {p.status === "published" ? "↩" : "🚀"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                  ✎
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(p)}>
                  🗑
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit video" : "Add a video"}
        description="The more context you give, the sharper the AI cut plan."
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="How I edit a Reel in 10 minutes"
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Platform">
              <Select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p} className="capitalize">
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Goal">
              <Select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
                {GOALS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Source URL" hint="Optional — used in the ffmpeg export command.">
              <Input
                value={form.sourceUrl}
                onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                placeholder="https://…/raw.mp4"
              />
            </Field>
            <Field label="Duration (seconds)">
              <Input
                type="number"
                min={15}
                max={14400}
                value={form.durationSec}
                onChange={(e) => setForm({ ...form, durationSec: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="What happens in this video?">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Talking head + b-roll, best story around the 18 minute mark…"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving || pending}>
              {editing ? "Save changes" : "Add video"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
