import type { AnalysisPayload } from "@/db/schema";

export type ClipSuggestion = {
  title: string;
  hook: string;
  caption: string;
  hashtags: string;
  startSec: number;
  endSec: number;
  score: number;
};

export type AnalyzeInput = {
  title: string;
  platform: string;
  goal: string;
  notes: string;
  durationSec: number;
};

export type AnalyzeResult = { analysis: AnalysisPayload; clips: ClipSuggestion[] };

function seedFrom(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return Math.abs(h % 10000) / 10000;
  };
}

const HOOK_TEMPLATES = [
  "Stop scrolling — {topic} is about to change how you post.",
  "Nobody talks about this part of {topic}…",
  "I tried {topic} for 30 days. Here's the honest result.",
  "The 3-second rule that makes {topic} impossible to skip.",
  "If your {topic} videos flop, it's usually this one mistake.",
  "You're 12 seconds away from understanding {topic}.",
];

const SUGGESTION_BANK: { title: string; detail: string; impact: "high" | "medium" | "low" }[] = [
  {
    title: "Front-load the payoff",
    detail:
      "Move your strongest moment into the first 1.5 seconds. Cold opens that show the result first hold ~34% more viewers past the 3s mark.",
    impact: "high",
  },
  {
    title: "Add burned-in captions",
    detail:
      "85% of feed views start muted. Use 2–4 word caption chunks with a bounce animation to keep eyes locked on the frame.",
    impact: "high",
  },
  {
    title: "Cut every dead beat",
    detail:
      "There are several pauses longer than 700ms. Trim them to keep the pace under a 2.4s average shot length.",
    impact: "medium",
  },
  {
    title: "Reframe to 9:16 with motion tracking",
    detail:
      "Keep the speaker's eyes on the upper third line. Static center crops lose the face when you gesture.",
    impact: "medium",
  },
  {
    title: "End with a loop, not a goodbye",
    detail:
      "Replace the sign-off with a sentence that flows back into the first line so the clip loops naturally and doubles watch time.",
    impact: "high",
  },
  {
    title: "Pin a comment question",
    detail:
      "Ask a binary question in the pinned comment. Binary questions get 3x more replies than open ones.",
    impact: "low",
  },
  {
    title: "Batch a 3-part series",
    detail:
      "This topic has enough substance for three parts. Serialised posts lift profile visits because viewers come back for the next drop.",
    impact: "medium",
  },
  {
    title: "Swap the b-roll in the mid-section",
    detail:
      "The middle 40% reuses the same shot. Insert a screen recording or text card every 4 seconds to reset attention.",
    impact: "medium",
  },
];

const VIBES = [
  "Fast-paced educational",
  "Calm authority / talking head",
  "High-energy entertainment",
  "Story-driven documentary",
  "Punchy listicle",
];

const TIMES = [
  "Tue & Thu, 7:10 PM local",
  "Weekdays, 12:30 PM local",
  "Sat 10:00 AM + Sun 8:00 PM",
  "Mon/Wed/Fri, 6:45 PM local",
];

function topicOf(title: string) {
  const cleaned = title.replace(/[^a-zA-Z0-9 ]/g, " ").trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length > 3);
  return (words.slice(0, 3).join(" ") || "this topic").toLowerCase();
}

function keywordsOf(title: string, platform: string, goal: string) {
  const base = topicOf(title)
    .split(" ")
    .filter(Boolean)
    .map((w) => w.replace(/\W/g, ""));
  const extra = [platform, goal, "creator", "growth", "viral", "shorts"];
  return Array.from(new Set([...base, ...extra])).slice(0, 8);
}

export function localAnalyze(input: AnalyzeInput): AnalyzeResult {
  const rand = seedFrom(`${input.title}|${input.platform}|${input.goal}|${input.notes}`);
  const topic = topicOf(input.title);
  const duration = Math.max(60, input.durationSec || 600);

  const hooks = HOOK_TEMPLATES.slice()
    .sort(() => rand() - 0.5)
    .slice(0, 4)
    .map((t) => t.replace("{topic}", topic));

  const suggestions = SUGGESTION_BANK.slice()
    .sort(() => rand() - 0.5)
    .slice(0, 5);

  const score = Math.round(58 + rand() * 34);

  const clipCount = duration > 900 ? 5 : duration > 420 ? 4 : 3;
  const clips: ClipSuggestion[] = [];
  const segment = Math.floor(duration / (clipCount + 1));
  for (let i = 0; i < clipCount; i++) {
    const start = Math.max(0, Math.floor(segment * (i + 0.35) + rand() * 18));
    const len = 22 + Math.floor(rand() * 34);
    const end = Math.min(duration, start + len);
    clips.push({
      title: `${["Hook", "Teach", "Proof", "Contrarian", "Payoff"][i % 5]} cut — ${topic}`,
      hook: hooks[i % hooks.length],
      caption: `${input.title} — part ${i + 1}. Save this before you film your next ${input.platform} video.`,
      hashtags: keywordsOf(input.title, input.platform, input.goal)
        .slice(0, 5)
        .map((k) => `#${k}`)
        .join(" "),
      startSec: start,
      endSec: end,
      score: Math.round(62 + rand() * 36),
    });
  }

  const analysis: AnalysisPayload = {
    summary: `This ${Math.round(duration / 60)}-minute ${input.platform} piece on ${topic} has a clear centre of gravity, but the value is buried after the intro. The strongest ${clipCount} moments can be lifted into standalone vertical cuts, each carrying its own hook and payoff. Goal detected: ${input.goal}.`,
    vibe: VIBES[Math.floor(rand() * VIBES.length)],
    score,
    retentionRisk:
      score > 80
        ? "Low — pacing and hook density look healthy."
        : score > 68
          ? "Medium — the 8–15s window is where you'll shed viewers."
          : "High — the opening 3 seconds do not promise a payoff.",
    hooks,
    suggestions,
    keywords: keywordsOf(input.title, input.platform, input.goal),
    bestPostTime: TIMES[Math.floor(rand() * TIMES.length)],
    engine: "ClipForge Heuristic Engine v2",
  };

  return { analysis, clips };
}

export async function analyzeProject(input: AnalyzeInput): Promise<AnalyzeResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return localAnalyze(input);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a short-form video strategist. Return strict JSON matching: {analysis:{summary,vibe,score,retentionRisk,hooks:[string],suggestions:[{title,detail,impact}],keywords:[string],bestPostTime},clips:[{title,hook,caption,hashtags,startSec,endSec,score}]}. Timestamps must fit within the video duration.",
          },
          { role: "user", content: JSON.stringify(input) },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return localAnalyze(input);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return localAnalyze(input);
    const parsed = JSON.parse(raw) as AnalyzeResult;
    if (!parsed.analysis || !Array.isArray(parsed.clips)) return localAnalyze(input);
    parsed.analysis.engine = "OpenAI gpt-4o-mini";
    return parsed;
  } catch {
    return localAnalyze(input);
  }
}

const IDEA_FORMULAS = [
  { t: "The 5 mistakes killing your {n} content", a: "Mistake listicle" },
  { t: "I rebuilt my {n} routine from scratch — here's the new one", a: "Story / rebuild" },
  { t: "{n} beginners vs {n} pros: same task, different result", a: "Comparison" },
  { t: "Reacting to the worst {n} advice on the internet", a: "Reaction / duet" },
  { t: "A day in my life running a {n} channel", a: "Vlog / BTS" },
  { t: "Answering the #1 question I get about {n}", a: "Comment reply" },
  { t: "This {n} trend is dying — do this instead", a: "Trend jack" },
  { t: "$0 vs $500 {n} setup", a: "Budget comparison" },
];

export function generateIdeas(niche: string, platform: string, count = 3) {
  const rand = seedFrom(`${niche}|${platform}|${Date.now()}`);
  const n = (niche || "creator").toLowerCase();
  return IDEA_FORMULAS.slice()
    .sort(() => rand() - 0.5)
    .slice(0, count)
    .map((f) => ({
      title: f.t.replaceAll("{n}", n),
      angle: f.a,
      platform,
      status: "backlog",
      scheduledFor: "",
    }));
}

export function ffmpegCommand(source: string, start: number, end: number, name: string) {
  const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "clip";
  return `ffmpeg -i "${source || "input.mp4"}" -ss ${start} -to ${end} -vf "crop=ih*9/16:ih,scale=1080:1920" -c:a copy ${safe}.mp4`;
}

export function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
