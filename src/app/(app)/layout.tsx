import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { page } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { PageTree } from "@/components/sidebar/PageTree";
import { buildPageTree } from "@/lib/page-tree";
import { getDueCount } from "@/lib/due";
import { DueNotifier } from "@/components/DueNotifier";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const [flatPages, dueCount] = await Promise.all([
    db.query.page.findMany({
      where: and(eq(page.userId, session.user.id), eq(page.isArchived, false)),
      columns: { id: true, title: true, icon: true, parentId: true, isFavorite: true },
    }),
    getDueCount(session.user.id),
  ]);

  const pageTree = buildPageTree(flatPages);
  const favoritePages = flatPages.filter((p) => p.isFavorite);

  return (
    <div className="flex h-dvh md:h-auto md:min-h-screen">
      <Sidebar
        dueCount={dueCount}
        pageTree={<PageTree pages={pageTree} userId={session.user.id} />}
        favoritePages={favoritePages}
      />
      <div className="flex-1 min-w-0 flex flex-col md:border-l border-sidebar-border">
        <main className="flex-1 overflow-y-auto bg-background">
          <DueNotifier />
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
