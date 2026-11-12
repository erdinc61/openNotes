import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { deck, card } from "@/db/schema";
import { eq, and, lte, ne, sql, asc } from "drizzle-orm";
import { DeckList } from "@/components/flashcard/DeckList";

export const instant = false;

export default async function DecksPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const decks = await db.query.deck.findMany({
    where: eq(deck.userId, session.user.id),
  });

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const deckItems = await Promise.all(
    decks.map(async (d) => {
      const [cardCountRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(card)
        .where(and(eq(card.deckId, d.id), ne(card.isArchived, true)));

      const [dueCountRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(card)
        .where(and(eq(card.deckId, d.id), ne(card.isArchived, true), lte(card.dueDate, endOfToday)));

      const nextDueCard = await db.query.card.findFirst({
        where: and(eq(card.deckId, d.id), ne(card.isArchived, true)),
        orderBy: [asc(card.dueDate)],
        columns: { dueDate: true },
      });

      return {
        id: d.id,
        name: d.name,
        description: d.description,
        cardCount: cardCountRow?.count ?? 0,
        dueCount: dueCountRow?.count ?? 0,
        nextDue: nextDueCard?.dueDate ?? null,
      };
    })
  );

  return (
    <div className="max-w-[900px] mx-auto py-8 px-4 md:py-12 md:px-8">
      <DeckList decks={deckItems} userId={session.user.id} />
    </div>
  );
}
