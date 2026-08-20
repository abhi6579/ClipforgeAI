import { db } from "@/db";
import { clips, projects } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { desc, eq, sql } from "drizzle-orm";
import { ProjectsView, type ProjectRow } from "@/components/projects-view";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireUser();
  const rows = await db
    .select({
      project: projects,
      clipCount: sql<number>`(select count(*)::int from ${clips} where ${clips.projectId} = ${projects.id})`,
    })
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.updatedAt));

  const initial: ProjectRow[] = rows.map((r) => ({ ...r.project, clipCount: r.clipCount }));
  return <ProjectsView initial={initial} />;
}
