import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const startedAt = Date.now();

/**
 * Uptime-monitor friendly health check.
 * Point BetterStack / UptimeRobot / Vercel checks at this and alert on non-200.
 */
export async function GET() {
  const began = Date.now();
  try {
    await db.execute(sql`select 1`);
    return Response.json({
      ok: true,
      db: "up",
      dbLatencyMs: Date.now() - began,
      uptimeSec: Math.round((Date.now() - startedAt) / 1000),
      aiProvider: process.env.OPENAI_API_KEY ? "openai" : "heuristic",
      env: process.env.NODE_ENV,
    });
  } catch (err) {
    console.error("[health] db check failed", err);
    return Response.json({ ok: false, db: "down" }, { status: 503 });
  }
}
