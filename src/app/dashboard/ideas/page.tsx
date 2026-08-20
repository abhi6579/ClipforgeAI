import { db } from "@/db";
import { ideas } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import { IdeasView } from "@/components/ideas-view";

export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const user = await requireUser();
  const rows = await db.select().from(ideas).where(eq(ideas.userId, user.id)).orderBy(desc(ideas.createdAt));
  return <IdeasView initial={rows} />;
}
