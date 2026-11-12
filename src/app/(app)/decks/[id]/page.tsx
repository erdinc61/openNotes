import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { deck, card } from "@/db/schema";
import { eq, and, ne, lte, sql } from "drizzle-orm";
import { DeckDetail } from "@/components/flashcard/DeckDetail";
import { MobileBackHeader } from "@/components/MobileBackHeader";

export const instant = false;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DeckDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const foundDeck = await db.query.deck.findFirst({
    where: and(eq(deck.id, id), eq(deck.userId, session.user.id)),
  });
  if (!foundDeck) notFound();

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [cards, allDecks, [dueCountRow]] = await Promise.all([
    db.query.card.findMany({
      where: and(eq(card.deckId, id), ne(card.isArchived, true)),
      orderBy: (c, { asc }) => [asc(c.dueDate)],
    }),
    db.query.deck.findMany({
      where: eq(deck.userId, session.user.id),
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(card)
      .where(and(eq(card.deckId, id), ne(card.isArchived, true), lte(card.dueDate, endOfToday))),
  ]);

  return (
    <>
    <MobileBackHeader fallbackHref="/decks" />
    <div className="max-w-[900px] mx-auto py-8 px-4 md:py-12 md:px-8">
      <DeckDetail
        deck={{ id: foundDeck.id, name: foundDeck.name }}
        cards={cards}
        decks={allDecks.map((d) => ({ id: d.id, name: d.name }))}
        userId={session.user.id}
        dueCount={dueCountRow?.count ?? 0}
      />
    </div>
    </>
  );
}
