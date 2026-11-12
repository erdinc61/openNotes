import { describe, it, expect, beforeEach } from "vitest";
import { createCard, updateCard, submitReview, deleteCard } from "./cards";
import { createDeck } from "./decks";
import { getDueCards } from "@/lib/due";
import { db } from "@/db";
import { card, deck, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const TEST_USER_ID = "test-user-cards";
let testDeckId: string;

beforeEach(async () => {
  // Ensure test user exists
  const existing = await db.query.user.findFirst({ where: eq(user.id, TEST_USER_ID) });
  if (!existing) {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Test Cards User",
      email: "test-cards@example.com",
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  // Clean up cards and decks
  await db.delete(card).where(eq(card.userId, TEST_USER_ID));
  await db.delete(deck).where(eq(deck.userId, TEST_USER_ID));
  // Create a test deck
  const d = await createDeck(TEST_USER_ID, "Test Deck");
  testDeckId = d.id;
});

describe("submitReview", () => {
  it("Again resets repetitions to 0 and interval to 1", async () => {
    const c = await createCard({ deckId: testDeckId, userId: TEST_USER_ID, front: "Q", back: "A" });
    // Two Good reviews first
    await submitReview(c.id, 2);
    await submitReview(c.id, 2);
    // Then Again
    await submitReview(c.id, 0);
    const updated = await db.query.card.findFirst({ where: eq(card.id, c.id) });
    expect(updated!.repetitions).toBe(0);
    expect(updated!.interval).toBe(1);
  });

  it("submitReview logs a review entry", async () => {
    const c = await createCard({ deckId: testDeckId, userId: TEST_USER_ID, front: "Q", back: "A" });
    await submitReview(c.id, 2);
    const { reviewLog } = await import("@/db/schema");
    const logs = await db.query.reviewLog.findMany({ where: eq(reviewLog.cardId, c.id) });
    expect(logs.length).toBe(1);
    expect(logs[0].rating).toBe(2);
  });
});

describe("getDueCards", () => {
  it("returns newly created cards (due immediately)", async () => {
    const c = await createCard({ deckId: testDeckId, userId: TEST_USER_ID, front: "Q", back: "A" });
    const due = await getDueCards(TEST_USER_ID);
    expect(due.map((x) => x.id)).toContain(c.id);
  });

  it("filters by deckId when provided", async () => {
    const otherDeck = await createDeck(TEST_USER_ID, "Other Deck");
    const c = await createCard({ deckId: otherDeck.id, userId: TEST_USER_ID, front: "Q", back: "A" });
    const due = await getDueCards(TEST_USER_ID, testDeckId);
    expect(due.map((x) => x.id)).not.toContain(c.id);
  });

  it("includes cards with dueDate exactly at end of today", async () => {
    const c = await createCard({ deckId: testDeckId, userId: TEST_USER_ID, front: "Q", back: "A" });
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    await db.update(card).set({ dueDate: endOfToday }).where(eq(card.id, c.id));
    const due = await getDueCards(TEST_USER_ID);
    expect(due.map((x) => x.id)).toContain(c.id);
  });

  it("does not return archived cards", async () => {
    const c = await createCard({ deckId: testDeckId, userId: TEST_USER_ID, front: "Q", back: "A" });
    await deleteCard(c.id);
    const due = await getDueCards(TEST_USER_ID);
    expect(due.map((x) => x.id)).not.toContain(c.id);
  });
});

describe("updateCard", () => {
  it("updates front and back text", async () => {
    const c = await createCard({ deckId: testDeckId, userId: TEST_USER_ID, front: "Old Q", back: "Old A" });
    await updateCard(c.id, { front: "New Q", back: "New A" });
    const updated = await db.query.card.findFirst({ where: eq(card.id, c.id) });
    expect(updated!.front).toBe("New Q");
    expect(updated!.back).toBe("New A");
  });
});
