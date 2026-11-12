import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { page } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { ArchiveRestoreButton } from "@/components/ArchiveRestoreButton";
import { MobileBackHeader } from "@/components/MobileBackHeader";

export default async function ArchivePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const archivedPages = await db.query.page.findMany({
    where: and(eq(page.userId, session.user.id), eq(page.isArchived, true)),
    orderBy: [desc(page.updatedAt)],
  });

  return (
    <>
    <MobileBackHeader />
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-semibold">Archive</h1>

      {archivedPages.length === 0 ? (
        <p className="text-muted-foreground text-sm">No archived pages.</p>
      ) : (
        <div className="space-y-1">
          {archivedPages.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-3 py-2 rounded-md border border-border"
            >
              <span className="text-base">{p.icon ?? "📄"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  Archived {new Date(p.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <ArchiveRestoreButton pageId={p.id} />
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
