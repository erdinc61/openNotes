import { db } from "@/db";
import { card } from "@/db/schema";
import { and, eq, lte, ne, sql } from "drizzle-orm";

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getDueCount(userId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(card)
    .where(
      and(
        eq(card.userId, userId),
        lte(card.dueDate, endOfToday()),
        ne(card.isArchived, true)
      )
    );
  return rows[0]?.count ?? 0;
}

export async function getDueCards(userId: string, deckId?: string) {
  const conditions = [
    eq(card.userId, userId),
    lte(card.dueDate, endOfToday()),
    ne(card.isArchived, true),
  ];
  if (deckId) {
    conditions.push(eq(card.deckId, deckId));
  }
  return db.query.card.findMany({ where: and(...conditions) });
}

export async function getAllCards(userId: string, deckId?: string) {
  const conditions = [
    eq(card.userId, userId),
    ne(card.isArchived, true),
  ];
  if (deckId) {
    conditions.push(eq(card.deckId, deckId));
  }
  return db.query.card.findMany({ where: and(...conditions) });
}
