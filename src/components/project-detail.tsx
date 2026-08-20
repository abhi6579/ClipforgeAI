"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Clip, Project } from "@/db/schema";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  ScoreRing,
  Select,
  Textarea,
  useCopy,
  useToast,
} from "@/components/ui";
import { useUser } from "@/components/user-context";
import { ffmpegCommand, fmtTime } from "@/lib/ai";

const IMPACT_TONE = { high: "green", medium: "violet", low: "neutral" } as const;

export function ProjectDetail({ project: initialProject, clips: initialClips }: { project: Project; clips: Clip[] }) {
  const [project, setProject] = useState(initialProject);
  const [clips, setClips] = useState(initialClips);
  const [analyzing, setAnalyzing] = useState(false);
  const [editing, setEditing] = useState<Clip | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const copy = useCopy();
  const router = useRouter();
  const { user, setCredits } = useUser();

  const blank = { title: "", hook: "", caption: "", hashtags: "", startSec: 0, endSec: 30, score: 75, status: "suggested" };
  const [form, setForm] = useState(blank);

  async function runAnalysis() {
    setAnalyzing(true);
    setProject((p) => ({ ...p, status: "analyzing" }));
    const res = await fetch(`/api/projects/${project.id}/analyze`, { method: "POST" });
    const data = await res.json();
    setAnalyzing(false);
    if (!res.ok) {
      setProject((p) => ({ ...p, status: initialProject.status }));
      toast(data.error ?? "Analysis failed", "error");
      return;
    }
    setProject(data.project);
    setClips(data.clips);
    setCredits(data.credits);
    toast("AI overview ready ✨", "success");
    router.refresh();
  }

  async function patchClip(clip: Clip, patch: Partial<Clip>) {
    const snapshot = clips;
    setClips((list) => list.map((c) => (c.id === clip.id ? { ...c, ...patch } : c)));
    const res = await fetch(`/api/clips/${clip.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      setClips(snapshot);
      toast("Update failed", "error");
    }
  }

  async function deleteClip(clip: Clip) {
    const snapshot = clips;
    setClips((list) => list.filter((c) => c.id !== clip.id));
    const res = await fetch(`/api/clips/${clip.id}`, { method: "DELETE" });
    if (!res.ok) {
      setClips(snapshot);
      toast("Delete failed", "error");
      return;
    }
    toast("Clip removed", "success");
  }

  async function saveClip(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = editing ? `/api/clips/${editing.id}` : "/api/clips";
    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, projectId: project.id }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast(data.error ?? "Could not save clip", "error");
      return;
    }
    if (editing) {
      setClips((list) => list.map((c) => (c.id === editing.id ? data.clip : c)));
      toast("Clip saved", "success");
    } else {
      setClips((list) => [...list, data.clip].sort((a, b) => a.startSec - b.startSec));
      toast("Clip added", "success");
    }
    setEditing(null);
    setCreating(false);
  }

  function exportList() {
    const text = clips
      .map((c) => `${fmtTime(c.startSec)} - ${fmtTime(c.endSec)} | ${c.title}\n${c.hook}\n${c.caption} ${c.hashtags}`)
      .join("\n\n");
    copy(text || "No clips yet", "Cut list copied — paste it into your editor");
  }

  const analysis = project.analysis;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/dashboard/projects" className="text-xs text-slate-500 hover:text-slate-300">
            ← Back to videos
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{project.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <Badge tone="violet">{project.platform}</Badge>
            <Badge>{project.goal}</Badge>
            <span className="font-mono">{fmtTime(project.durationSec)}</span>
            <span className="capitalize">· {project.status}</span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={exportList}>
            Export cut list
          </Button>
          <Button onClick={runAnalysis} loading={analyzing}>
            {analysis ? "Re-run AI overview" : "Run AI overview"}
            {user.plan === "free" && <span className="text-[11px] opacity-80">· 5⚡</span>}
          </Button>
        </div>
      </div>

      {analyzing && (
        <Card className="p-6">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
            Watching your footage, scoring hooks, finding cut points…
          </div>
          <div className="mt-4 space-y-3">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton h-24 rounded-xl" />
          </div>
        </Card>
      )}

      {!analyzing && !analysis && (
        <EmptyState
          icon="🧠"
          title="No AI overview yet"
          body="Run the analysis to get a summary, a virality score, hook rewrites and timestamped cut suggestions."
          action={<Button onClick={runAnalysis}>Run AI overview</Button>}
        />
      )}

      {!analyzing && analysis && (
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <ScoreRing value={analysis.score} size={64} />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">AI overview</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{analysis.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="sky">{analysis.vibe}</Badge>
                  <Badge tone={analysis.score >= 78 ? "green" : "amber"}>{analysis.retentionRisk}</Badge>
                  <Badge>Best time: {analysis.bestPostTime}</Badge>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Suggestions</h3>
              <div className="mt-3 space-y-2.5">
                {analysis.suggestions.map((s) => (
                  <div key={s.title} className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{s.title}</p>
                      <Badge tone={IMPACT_TONE[s.impact] ?? "neutral"}>{s.impact} impact</Badge>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{s.detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-[11px] text-slate-600">Generated by {analysis.engine}</p>
          </Card>

          <div className="space-y-5">
            <Card className="p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hook rewrites</h3>
              <div className="mt-3 space-y-2">
                {analysis.hooks.map((h) => (
                  <button
                    key={h}
                    onClick={() => copy(h, "Hook copied")}
                    className="w-full rounded-xl border border-white/8 bg-white/[0.03] p-3 text-left text-sm text-slate-200 transition hover:border-brand-500/40 hover:bg-brand-500/8"
                  >
                    {h}
                    <span className="mt-1 block text-[11px] text-slate-500">Click to copy</span>
                  </button>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Keywords</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {analysis.keywords.map((k) => (
                  <span key={k} className="rounded-lg bg-white/6 px-2.5 py-1 text-xs text-slate-300">
                    #{k}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Clip cut plan ({clips.length})</h2>
          <Button
            size="sm"
            variant="soft"
            onClick={() => {
              setForm(blank);
              setEditing(null);
              setCreating(true);
            }}
          >
            + Manual clip
          </Button>
        </div>

        {clips.length === 0 ? (
          <EmptyState
            icon="✂️"
            title="No clips yet"
            body="Run the AI overview or add a cut manually with your own timestamps."
            action={
              <Button
                variant="soft"
                onClick={() => {
                  setForm(blank);
                  setCreating(true);
                }}
              >
                Add a manual clip
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {clips.map((c) => (
              <Card key={c.id} className="animate-fade-up p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <ScoreRing value={c.score} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{c.title}</h3>
                      <Badge tone={c.status === "exported" ? "green" : c.status === "approved" ? "violet" : "neutral"}>
                        {c.status}
                      </Badge>
                      <span className="font-mono text-[11px] text-slate-500">
                        {fmtTime(c.startSec)} → {fmtTime(c.endSec)} ({c.endSec - c.startSec}s)
                      </span>
                    </div>
                    {c.hook && <p className="mt-2 text-sm text-brand-200">“{c.hook}”</p>}
                    {c.caption && <p className="mt-1.5 text-sm text-slate-400">{c.caption}</p>}
                    {c.hashtags && <p className="mt-1 text-xs text-slate-500">{c.hashtags}</p>}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {c.status !== "approved" && (
                        <Button size="sm" variant="soft" onClick={() => patchClip(c, { status: "approved" })}>
                          ✓ Approve
                        </Button>
                      )}
                      {c.status !== "exported" && (
                        <Button size="sm" variant="soft" onClick={() => patchClip(c, { status: "exported" })}>
                          ⬇ Mark exported
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copy(ffmpegCommand(project.sourceUrl, c.startSec, c.endSec, c.title), "ffmpeg command copied")
                        }
                      >
                        ⌘ ffmpeg
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(c);
                          setCreating(false);
                          setForm({
                            title: c.title,
                            hook: c.hook,
                            caption: c.caption,
                            hashtags: c.hashtags,
                            startSec: c.startSec,
                            endSec: c.endSec,
                            score: c.score,
                            status: c.status,
                          });
                        }}
                      >
                        ✎ Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => deleteClip(c)}>
                        🗑
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? "Edit clip" : "New clip"}
        description="Fine-tune the cut, hook and caption before you export."
      >
        <form onSubmit={saveClip} className="space-y-4">
          <Field label="Clip title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="Hook (first line on screen)">
            <Input value={form.hook} onChange={(e) => setForm({ ...form, hook: e.target.value })} />
          </Field>
          <Field label="Caption">
            <Textarea value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
          </Field>
          <Field label="Hashtags">
            <Input value={form.hashtags} onChange={(e) => setForm({ ...form, hashtags: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Start (s)">
              <Input
                type="number"
                min={0}
                value={form.startSec}
                onChange={(e) => setForm({ ...form, startSec: Number(e.target.value) })}
              />
            </Field>
            <Field label="End (s)">
              <Input
                type="number"
                min={1}
                value={form.endSec}
                onChange={(e) => setForm({ ...form, endSec: Number(e.target.value) })}
              />
            </Field>
            <Field label="Score">
              <Input
                type="number"
                min={0}
                max={100}
                value={form.score}
                onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
              />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="suggested">suggested</option>
                <option value="approved">approved</option>
                <option value="exported">exported</option>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save clip
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
