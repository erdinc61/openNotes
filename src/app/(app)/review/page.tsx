import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDueCards, getAllCards } from "@/lib/due";
import { ReviewSession } from "@/components/flashcard/ReviewSession";
import { db } from "@/db";
import { deck } from "@/db/schema";
import { eq } from "drizzle-orm";

export const instant = false;

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function GlobalReviewPage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { mode } = await searchParams;
  const reviewAll = mode === "all";

  const [cards, decks] = await Promise.all([
    reviewAll
      ? getAllCards(session.user.id)
      : getDueCards(session.user.id),
    db.query.deck.findMany({ where: eq(deck.userId, session.user.id) }),
  ]);

  return (
    <div>
      <ReviewSession
        cards={cards}
        decks={decks.map((d) => ({ id: d.id, name: d.name }))}
        reviewAll={reviewAll}
      />
    </div>
  );
}
