"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Clip } from "@/db/schema";
import { PageHeader } from "@/components/dashboard-shell";
import { Badge, Button, Card, EmptyState, ScoreRing, useCopy, useToast } from "@/components/ui";
import { ffmpegCommand, fmtTime } from "@/lib/ai";

export type ClipRow = Clip & { projectTitle: string; platform: string; sourceUrl: string };

const TABS = ["all", "suggested", "approved", "exported"] as const;

export function ClipsView({ initial }: { initial: ClipRow[] }) {
  const [clips, setClips] = useState(initial);
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const toast = useToast();
  const copy = useCopy();

  const visible = useMemo(() => clips.filter((c) => tab === "all" || c.status === tab), [clips, tab]);
  const counts = useMemo(
    () => ({
      all: clips.length,
      suggested: clips.filter((c) => c.status === "suggested").length,
      approved: clips.filter((c) => c.status === "approved").length,
      exported: clips.filter((c) => c.status === "exported").length,
    }),
    [clips],
  );

  async function patch(clip: ClipRow, status: string) {
    const snapshot = clips;
    setClips((list) => list.map((c) => (c.id === clip.id ? { ...c, status } : c)));
    const res = await fetch(`/api/clips/${clip.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setClips(snapshot);
      toast("Update failed", "error");
    } else {
      toast(`Marked ${status}`, "success");
    }
  }

  async function remove(clip: ClipRow) {
    const snapshot = clips;
    setClips((list) => list.filter((c) => c.id !== clip.id));
    const res = await fetch(`/api/clips/${clip.id}`, { method: "DELETE" });
    if (!res.ok) {
      setClips(snapshot);
      toast("Delete failed", "error");
    }
  }

  return (
    <>
      <PageHeader
        title="Clip Studio"
        subtitle="Every AI-suggested cut across your library, ranked by predicted hook strength."
        action={
          <Button
            variant="outline"
            onClick={() =>
              copy(
                visible
                  .map((c) => `${c.projectTitle} | ${fmtTime(c.startSec)}-${fmtTime(c.endSec)} | ${c.title}`)
                  .join("\n") || "No clips",
                "Cut list copied",
              )
            }
          >
            Copy visible list
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3.5 py-2 text-xs capitalize transition ${
              tab === t ? "bg-brand-500/20 text-brand-200 ring-1 ring-brand-500/30" : "text-slate-400 hover:bg-white/6"
            }`}
          >
            {t} <span className="ml-1 text-slate-500">{counts[t]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon="✂️"
          title={clips.length === 0 ? "No clips in the studio yet" : `Nothing ${tab}`}
          body={
            clips.length === 0
              ? "Add a video and run the AI overview — cut suggestions land here automatically."
              : "Switch tabs or approve a few suggestions to fill this list."
          }
          action={
            clips.length === 0 ? (
              <Link href="/dashboard/projects">
                <Button>Go to videos</Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((c) => (
            <Card key={c.id} className="animate-fade-up p-5">
              <div className="flex gap-4">
                <ScoreRing value={c.score} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={c.status === "exported" ? "green" : c.status === "approved" ? "violet" : "neutral"}>
                      {c.status}
                    </Badge>
                    <Badge tone="sky">{c.platform}</Badge>
                    <span className="font-mono text-[11px] text-slate-500">
                      {fmtTime(c.startSec)} → {fmtTime(c.endSec)}
                    </span>
                  </div>
                  <h3 className="mt-2 truncate text-sm font-semibold text-white">{c.title}</h3>
                  <Link
                    href={`/dashboard/projects/${c.projectId}`}
                    className="text-[11px] text-slate-500 hover:text-brand-300"
                  >
                    from “{c.projectTitle}”
                  </Link>
                  {c.hook && <p className="mt-2 line-clamp-2 text-sm text-brand-200">“{c.hook}”</p>}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.status === "suggested" && (
                      <Button size="sm" variant="soft" onClick={() => patch(c, "approved")}>
                        ✓ Approve
                      </Button>
                    )}
                    {c.status !== "exported" && (
                      <Button size="sm" variant="soft" onClick={() => patch(c, "exported")}>
                        ⬇ Export
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copy(`${c.hook}\n\n${c.caption}\n${c.hashtags}`, "Caption pack copied")}
                    >
                      Copy caption
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copy(ffmpegCommand(c.sourceUrl, c.startSec, c.endSec, c.title), "ffmpeg copied")}
                    >
                      ⌘
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => remove(c)}>
                      🗑
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
