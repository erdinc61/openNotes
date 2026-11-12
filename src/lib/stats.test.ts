import { describe, it, expect, beforeEach } from "vitest";
import { getReviewStreak, getReviewHistory } from "./stats";
import { db } from "@/db";
import { user, deck, card, reviewLog } from "@/db/schema";
import { eq } from "drizzle-orm";

const TEST_USER_ID = "test-user-stats";
let testCardId: string;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}

async function insertReviewLog(reviewedAt: Date) {
  const { nanoid } = await import("nanoid");
  await db.insert(reviewLog).values({
    id: nanoid(),
    cardId: testCardId,
    userId: TEST_USER_ID,
    rating: 2,
    reviewedAt,
  });
}

beforeEach(async () => {
  const existing = await db.query.user.findFirst({ where: eq(user.id, TEST_USER_ID) });
  if (!existing) {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Test Stats User",
      email: "test-stats@example.com",
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await db.delete(reviewLog).where(eq(reviewLog.userId, TEST_USER_ID));
  await db.delete(card).where(eq(card.userId, TEST_USER_ID));
  await db.delete(deck).where(eq(deck.userId, TEST_USER_ID));

  const { nanoid } = await import("nanoid");
  const deckId = nanoid();
  await db.insert(deck).values({
    id: deckId,
    userId: TEST_USER_ID,
    name: "Stats Test Deck",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  testCardId = nanoid();
  await db.insert(card).values({
    id: testCardId,
    deckId,
    userId: TEST_USER_ID,
    front: "Q",
    back: "A",
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    dueDate: new Date(),
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

describe("getReviewStreak", () => {
  it("streak is 0 when no reviews exist", async () => {
    const result = await getReviewStreak(TEST_USER_ID);
    expect(result.streak).toBe(0);
    expect(result.reviewedToday).toBe(0);
  });

  it("streak is 1 after reviewing today", async () => {
    await insertReviewLog(new Date());
    const result = await getReviewStreak(TEST_USER_ID);
    expect(result.streak).toBe(1);
    expect(result.reviewedToday).toBe(1);
  });

  it("streak is 2 when reviewed today and yesterday", async () => {
    await insertReviewLog(new Date());
    await insertReviewLog(daysAgo(1));
    const result = await getReviewStreak(TEST_USER_ID);
    expect(result.streak).toBe(2);
  });

  it("streak breaks when yesterday has no reviews (only 2 days ago and today)", async () => {
    await insertReviewLog(new Date());
    await insertReviewLog(daysAgo(2));
    const result = await getReviewStreak(TEST_USER_ID);
    expect(result.streak).toBe(1);
  });

  it("streak is 0 when only older reviews exist (no today or yesterday)", async () => {
    await insertReviewLog(daysAgo(2));
    const result = await getReviewStreak(TEST_USER_ID);
    expect(result.streak).toBe(0);
  });

  it("reviewedToday counts all reviews today", async () => {
    await insertReviewLog(new Date());
    await insertReviewLog(new Date());
    await insertReviewLog(new Date());
    const result = await getReviewStreak(TEST_USER_ID);
    expect(result.reviewedToday).toBe(3);
  });
});

describe("getReviewHistory", () => {
  it("returns 7 entries", async () => {
    const history = await getReviewHistory(TEST_USER_ID, 7);
    expect(history).toHaveLength(7);
  });

  it("counts reviews correctly for today", async () => {
    await insertReviewLog(new Date());
    await insertReviewLog(new Date());
    const history = await getReviewHistory(TEST_USER_ID, 7);
    const today = history[history.length - 1];
    expect(today.count).toBe(2);
  });
});
