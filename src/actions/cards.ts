"use server";

import { db } from "@/db";
import { card, reviewLog } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { calculateSM2 } from "@/lib/sm2";
import { requireUserId } from "@/lib/auth-helpers";

interface CreateCardData {
  deckId: string;
  userId: string;
  front: string;
  back: string;
  frontImage?: string;
  backImage?: string;
  sourcePageId?: string;
}

export async function createCard(data: CreateCardData) {
  const now = new Date();
  const id = randomUUID();
  await db.insert(card).values({
    id,
    deckId: data.deckId,
    userId: data.userId,
    front: data.front,
    back: data.back,
    frontImage: data.frontImage ?? null,
    backImage: data.backImage ?? null,
    sourcePageId: data.sourcePageId ?? null,
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    isArchived: false,
    dueDate: now,
    createdAt: now,
    updatedAt: now,
  });
  return db.query.card.findFirst({ where: eq(card.id, id) }).then((c) => c!);
}

export async function updateCard(
  id: string,
  data: { front?: string; back?: string; frontImage?: string; backImage?: string }
) {
  const userId = await requireUserId();
  const where = userId ? and(eq(card.id, id), eq(card.userId, userId)) : eq(card.id, id);
  await db.update(card).set({ ...data, updatedAt: new Date() }).where(where);
}

export async function deleteCard(id: string) {
  const userId = await requireUserId();
  const where = userId ? and(eq(card.id, id), eq(card.userId, userId)) : eq(card.id, id);
  await db.update(card).set({ isArchived: true, updatedAt: new Date() }).where(where);
}

export async function submitReview(cardId: string, rating: 0 | 1 | 2 | 3) {
  if (![0, 1, 2, 3].includes(rating)) throw new Error("Invalid rating");
  const userId = await requireUserId();
  const existing = userId
    ? await db.query.card.findFirst({ where: and(eq(card.id, cardId), eq(card.userId, userId)) })
    : await db.query.card.findFirst({ where: eq(card.id, cardId) });
  if (!existing) throw new Error("Card not found");

  const result = calculateSM2(
    { interval: existing.interval, easeFactor: existing.easeFactor, repetitions: existing.repetitions },
    rating
  );

  const now = new Date();
  await db
    .update(card)
    .set({
      interval: result.interval,
      easeFactor: result.easeFactor,
      repetitions: result.repetitions,
      dueDate: result.dueDate,
      updatedAt: now,
    })
    .where(eq(card.id, cardId));

  await db.insert(reviewLog).values({
    id: randomUUID(),
    cardId,
    userId: existing.userId,
    rating,
    reviewedAt: now,
  });
}
