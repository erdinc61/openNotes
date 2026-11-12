import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { page, card } from "@/db/schema";
import { and, eq, like, or, ne } from "drizzle-orm";
import { FileText, BookOpen } from "lucide-react";
import { MobileBackHeader } from "@/components/MobileBackHeader";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { q = "" } = await searchParams;
  const query = q.trim();
  const userId = session.user.id;

  let pages: { id: string; title: string; icon: string | null }[] = [];
  let cards: { id: string; front: string; back: string; deckId: string }[] = [];

  if (query) {
    const pattern = `%${query}%`;
    [pages, cards] = await Promise.all([
      db.query.page.findMany({
        where: and(
          eq(page.userId, userId),
          eq(page.isArchived, false),
          or(like(page.title, pattern), like(page.content, pattern))
        ),
        columns: { id: true, title: true, icon: true },
        limit: 10,
      }),
      db.query.card.findMany({
        where: and(
          eq(card.userId, userId),
          ne(card.isArchived, true),
          or(like(card.front, pattern), like(card.back, pattern))
        ),
        columns: { id: true, front: true, back: true, deckId: true },
        limit: 10,
      }),
    ]);
  }

  const hasResults = pages.length > 0 || cards.length > 0;

  return (
    <>
    <MobileBackHeader />
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-semibold">
        {query ? `Results for "${query}"` : "Search"}
      </h1>

      {query && !hasResults && (
        <p className="text-muted-foreground text-sm">No results found.</p>
      )}

      {pages.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pages</h2>
          <div className="space-y-1">
            {pages.map((p) => (
              <Link
                key={p.id}
                href={`/pages/${p.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                <span className="text-base">{p.icon ?? "📄"}</span>
                <span className="text-sm font-medium flex-1 truncate">{p.title}</span>
                <FileText className="size-3.5 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {cards.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Flashcards</h2>
          <div className="space-y-1">
            {cards.map((c) => (
              <Link
                key={c.id}
                href={`/decks/${c.deckId}/review`}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
              >
                <BookOpen className="size-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.front}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.back}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
