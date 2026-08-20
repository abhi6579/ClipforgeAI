import { db } from "@/db";
import { clips, projects } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import { ClipsView, type ClipRow } from "@/components/clips-view";

export const dynamic = "force-dynamic";

export default async function ClipsPage() {
  const user = await requireUser();
  const rows = await db
    .select({
      clip: clips,
      projectTitle: projects.title,
      platform: projects.platform,
      sourceUrl: projects.sourceUrl,
    })
    .from(clips)
    .innerJoin(projects, eq(projects.id, clips.projectId))
    .where(eq(clips.userId, user.id))
    .orderBy(desc(clips.score));

  const initial: ClipRow[] = rows.map((r) => ({
    ...r.clip,
    projectTitle: r.projectTitle,
    platform: r.platform,
    sourceUrl: r.sourceUrl,
  }));
  return <ClipsView initial={initial} />;
}
