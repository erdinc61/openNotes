import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { page } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NewPageButton } from "@/components/pages/NewPageButton";
import { MobileBackHeader } from "@/components/MobileBackHeader";

export default async function PagesIndexPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const allPages = await db.query.page.findMany({
    where: and(eq(page.userId, session.user.id), eq(page.isArchived, false)),
    orderBy: [desc(page.updatedAt)],
  });

  return (
    <>
      <div className="max-w-[900px] mx-auto py-8 px-4 md:py-16 md:px-8">
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <h1 className="text-3xl md:text-5xl font-bold">Pages</h1>
          <NewPageButton userId={session.user.id} />
        </div>

        {allPages.length === 0 ? (
          <p className="text-lg text-muted-foreground py-4">No pages yet. Create your first page!</p>
        ) : (
          <div className="space-y-px">
            {allPages.map((p) => (
              <Link
                key={p.id}
                href={`/pages/${p.id}`}
                className="flex items-center gap-3.5 px-4 py-3 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors duration-100"
              >
                <span className="text-lg">{p.icon ?? "📄"}</span>
                <span className="text-lg flex-1 truncate">{p.title || "Untitled"}</span>
                <span className="text-sm text-muted-foreground/60 shrink-0">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
