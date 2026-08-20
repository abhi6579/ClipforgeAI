import { notFound } from "next/navigation";
import { db } from "@/db";
import { clips, projects } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { and, asc, eq } from "drizzle-orm";
import { ProjectDetail } from "@/components/project-detail";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = Number((await params).id);
  if (!Number.isFinite(id)) notFound();

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
    .limit(1);
  if (!project) notFound();

  const list = await db.select().from(clips).where(eq(clips.projectId, id)).orderBy(asc(clips.startSec));
  return <ProjectDetail project={project} clips={list} />;
}
