import { db } from "@/db";
import { clips, ideas, projects } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { SettingsView } from "@/components/settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const count = sql<number>`count(*)::int`;
  const [[p], [c], [i]] = await Promise.all([
    db.select({ n: count }).from(projects).where(eq(projects.userId, user.id)),
    db.select({ n: count }).from(clips).where(eq(clips.userId, user.id)),
    db.select({ n: count }).from(ideas).where(eq(ideas.userId, user.id)),
  ]);
  return <SettingsView stats={{ projects: p?.n ?? 0, clips: c?.n ?? 0, ideas: i?.n ?? 0 }} />;
}
