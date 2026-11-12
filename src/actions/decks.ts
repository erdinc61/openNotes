"use server";

import { db } from "@/db";
import { deck } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function createDeck(userId: string, name: string, description?: string) {
  const now = new Date();
  const id = randomUUID();
  await db.insert(deck).values({ id, userId, name, description: description ?? null, createdAt: now, updatedAt: now });
  return db.query.deck.findFirst({ where: eq(deck.id, id) }).then((d) => d!);
}

export async function renameDeck(id: string, name: string) {
  await db.update(deck).set({ name, updatedAt: new Date() }).where(eq(deck.id, id));
}

export async function deleteDeck(id: string) {
  await db.delete(deck).where(eq(deck.id, id));
}
