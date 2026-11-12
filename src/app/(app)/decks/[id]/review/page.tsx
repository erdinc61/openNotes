import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { deck } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getDueCards, getAllCards } from "@/lib/due";
import { ReviewSession } from "@/components/flashcard/ReviewSession";
import { MobileBackHeader } from "@/components/MobileBackHeader";

export const instant = false;

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export default async function DeckReviewPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { mode } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [foundDeck, allDecks] = await Promise.all([
    db.query.deck.findFirst({
      where: and(eq(deck.id, id), eq(deck.userId, session.user.id)),
    }),
    db.query.deck.findMany({
      where: eq(deck.userId, session.user.id),
    }),
  ]);
  if (!foundDeck) notFound();

  const reviewAll = mode === "all";
  const cards = reviewAll
    ? await getAllCards(session.user.id, id)
    : await getDueCards(session.user.id, id);

  return (
    <>
      <MobileBackHeader fallbackHref={`/decks/${id}`} />
      <ReviewSession
        cards={cards}
        decks={allDecks.map((d) => ({ id: d.id, name: d.name }))}
        reviewAll={reviewAll}
      />
    </>
  );
}
