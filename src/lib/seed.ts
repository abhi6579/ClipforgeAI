import { db } from "@/db";
import { clips, creditEvents, ideas, offers, projects, tasks, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { localAnalyze } from "@/lib/ai";
import { sql } from "drizzle-orm";

export const DEMO_EMAIL = "demo@clipforge.ai";
export const DEMO_PASSWORD = "demo1234";

const globalForSeed = globalThis as typeof globalThis & { __clipforgeSeed?: Promise<void> };

const OFFERS = [
  {
    brand: "Nova Editor",
    headline: "Try Nova Editor free for 7 days",
    detail: "Install the partner mobile editor and render one project to unlock credits.",
    reward: 60,
    accent: "violet",
  },
  {
    brand: "Loopfund",
    headline: "Creator payouts in 24h",
    detail: "Connect a Loopfund creator wallet and verify your handle.",
    reward: 45,
    accent: "emerald",
  },
  {
    brand: "Thumbly",
    headline: "AI thumbnails, 10 free renders",
    detail: "Generate your first thumbnail with our sponsor and come back to claim.",
    reward: 35,
    accent: "amber",
  },
  {
    brand: "SoundCrate",
    headline: "Royalty-free trending audio",
    detail: "Browse the trending pack for 60 seconds to claim your bonus.",
    reward: 25,
    accent: "sky",
  },
];

const DEMO_PROJECTS = [
  {
    title: "How I edit a 60-second Reel in under 10 minutes",
    platform: "reels",
    sourceUrl: "https://cdn.clipforge.ai/demo/reel-workflow.mp4",
    durationSec: 742,
    goal: "growth",
    notes:
      "Screen recording walkthrough of my editing workflow, timeline tricks, and the caption preset I reuse.",
    status: "ready",
  },
  {
    title: "3 camera settings that instantly look cinematic",
    platform: "youtube",
    sourceUrl: "https://cdn.clipforge.ai/demo/cinematic-settings.mp4",
    durationSec: 1265,
    goal: "authority",
    notes: "Talking head + b-roll comparisons shot on a 35mm lens, indoor natural light.",
    status: "ready",
  },
  {
    title: "Podcast ep. 12 — building an audience without ads",
    platform: "podcast",
    sourceUrl: "https://cdn.clipforge.ai/demo/podcast-12.mp4",
    durationSec: 3480,
    goal: "reach",
    notes: "Long form interview. Best moments around the funding story and the failed launch.",
    status: "draft",
  },
  {
    title: "Street food tour: 5 stalls, 5 hours",
    platform: "tiktok",
    sourceUrl: "",
    durationSec: 908,
    goal: "entertainment",
    notes: "Vlog style, lots of ambient audio, reaction shots at stall 3 are gold.",
    status: "published",
  },
];

const DEMO_IDEAS = [
  { title: "Duet the worst editing advice on my feed", angle: "Contrarian reaction", platform: "tiktok", status: "scripting", scheduledFor: "Fri" },
  { title: "My $0 lighting setup vs $900 setup", angle: "Comparison / proof", platform: "reels", status: "backlog", scheduledFor: "" },
  { title: "Answer: 'how do I get my first 1k followers?'", angle: "Comment reply", platform: "shorts", status: "filming", scheduledFor: "Tue" },
  { title: "Behind the scenes of a 4M view video", angle: "Story", platform: "youtube", status: "posted", scheduledFor: "Last Sun" },
  { title: "Trend check: the slow-zoom talking head", angle: "Trend jack", platform: "reels", status: "backlog", scheduledFor: "" },
];

const DEMO_TASKS = [
  { title: "Post one clip today", detail: "Publish any exported clip to a platform.", kind: "daily", reward: 15, done: true },
  { title: "Analyze a new video", detail: "Run the AI overview on a fresh upload.", kind: "daily", reward: 10, done: true },
  { title: "Reply to 10 comments", detail: "Engagement in the first hour compounds reach.", kind: "daily", reward: 10, done: false },
  { title: "Fill your idea backlog to 5", detail: "Keep at least five ideas ready to shoot.", kind: "quest", reward: 25, done: false },
  { title: "Export 3 approved clips", detail: "Approve and export a full batch.", kind: "quest", reward: 40, done: false },
  { title: "Invite a creator friend", detail: "Both of you get bonus credits.", kind: "quest", reward: 50, done: false },
];

async function seedNow() {
  const existing = await db.select({ n: sql<number>`count(*)::int` }).from(users);
  const offerCount = await db.select({ n: sql<number>`count(*)::int` }).from(offers);
  if ((offerCount[0]?.n ?? 0) === 0) {
    await db.insert(offers).values(OFFERS);
  }
  if ((existing[0]?.n ?? 0) > 0) return;

  const [user] = await db
    .insert(users)
    .values({
      email: DEMO_EMAIL,
      name: "Demo Creator",
      passwordHash: hashPassword(DEMO_PASSWORD),
      plan: "free",
      credits: 145,
      streak: 6,
      avatarHue: 272,
      niche: "Creator education",
    })
    .returning();

  for (const p of DEMO_PROJECTS) {
    const { analysis, clips: suggested } = localAnalyze({
      title: p.title,
      platform: p.platform,
      goal: p.goal,
      notes: p.notes,
      durationSec: p.durationSec,
    });
    const [project] = await db
      .insert(projects)
      .values({
        userId: user.id,
        ...p,
        analysis: p.status === "draft" ? null : analysis,
      })
      .returning();
    if (p.status === "draft") continue;
    await db.insert(clips).values(
      suggested.map((c, i) => ({
        projectId: project.id,
        userId: user.id,
        ...c,
        status: i === 0 ? "exported" : i === 1 ? "approved" : "suggested",
      })),
    );
  }

  await db.insert(ideas).values(DEMO_IDEAS.map((i) => ({ ...i, userId: user.id })));
  await db.insert(tasks).values(
    DEMO_TASKS.map((t) => ({
      ...t,
      userId: user.id,
      completedAt: t.done ? new Date() : null,
    })),
  );
  await db.insert(creditEvents).values([
    { userId: user.id, amount: 60, reason: "Welcome bonus", source: "system" },
    { userId: user.id, amount: 15, reason: "Daily task: Post one clip today", source: "task" },
    { userId: user.id, amount: 10, reason: "Daily task: Analyze a new video", source: "task" },
    { userId: user.id, amount: 80, reason: "Sponsor offer: Nova Editor", source: "sponsor" },
    { userId: user.id, amount: -5, reason: "AI analysis: cinematic settings", source: "ai" },
    { userId: user.id, amount: -5, reason: "AI analysis: reel workflow", source: "ai" },
    { userId: user.id, amount: 30, reason: "Hook Rush high score", source: "game" },
  ]);
}

export function ensureSeed(): Promise<void> {
  if (!globalForSeed.__clipforgeSeed) {
    globalForSeed.__clipforgeSeed = seedNow().catch((err) => {
      globalForSeed.__clipforgeSeed = undefined;
      console.error("seed failed", err);
    });
  }
  return globalForSeed.__clipforgeSeed;
}
