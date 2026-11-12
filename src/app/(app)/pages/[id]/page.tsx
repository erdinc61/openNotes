import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { page, deck } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { PageWrapper } from "@/components/pages/PageWrapper";

interface PageRouteProps {
  params: Promise<{ id: string }>;
}

async function getAncestors(pageId: string | null, userId: string) {
  const ancestors: { id: string; title: string; icon: string | null }[] = [];
  let currentId = pageId;
  while (currentId) {
    const p = await db.query.page.findFirst({
      where: and(eq(page.id, currentId), eq(page.userId, userId)),
      columns: { id: true, title: true, icon: true, parentId: true },
    });
    if (!p) break;
    ancestors.unshift({ id: p.id, title: p.title, icon: p.icon });
    currentId = p.parentId;
  }
  return ancestors;
}

export default async function PageRoute({ params }: PageRouteProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [foundPage, decks] = await Promise.all([
    db.query.page.findFirst({
      where: and(eq(page.id, id), eq(page.userId, session.user.id)),
    }),
    db.query.deck.findMany({
      where: eq(deck.userId, session.user.id),
    }),
  ]);

  if (!foundPage || foundPage.isArchived) notFound();

  const ancestors = await getAncestors(foundPage.parentId, session.user.id);

  return (
    <PageWrapper
      pageId={foundPage.id}
      initialContent={foundPage.content}
      initialTitle={foundPage.title}
      initialIcon={foundPage.icon}
      initialCover={foundPage.coverImage}
      ancestors={ancestors}
      decks={decks.map((d) => ({ id: d.id, name: d.name }))}
      userId={session.user.id}
    />
  );
}
