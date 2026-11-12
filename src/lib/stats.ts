import { db } from "@/db";
import { reviewLog } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getReviewHistory(
  userId: string,
  days: number
): Promise<{ date: string; count: number }[]> {
  const msPerDay = 86400000;
  const now = new Date();
  const startDate = new Date(startOfDay(now).getTime() - (days - 1) * msPerDay);

  const logs = await db
    .select({ reviewedAt: reviewLog.reviewedAt })
    .from(reviewLog)
    .where(and(eq(reviewLog.userId, userId), gte(reviewLog.reviewedAt, startDate)));

  const countsByDay = new Map<string, number>();
  for (const log of logs) {
    const key = startOfDay(log.reviewedAt).toISOString().slice(0, 10);
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }

  const result: { date: string; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate.getTime() + i * msPerDay);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: countsByDay.get(key) ?? 0 });
  }
  return result;
}

export async function getReviewStreak(
  userId: string
): Promise<{ streak: number; reviewedToday: number }> {
  // Count reviews today
  const todayStart = startOfDay(new Date());
  const todayRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(reviewLog)
    .where(and(eq(reviewLog.userId, userId), gte(reviewLog.reviewedAt, todayStart)));
  const reviewedToday = todayRows[0]?.count ?? 0;

  // Get all distinct calendar dates with at least one review, descending
  const allLogs = await db
    .select({ reviewedAt: reviewLog.reviewedAt })
    .from(reviewLog)
    .where(eq(reviewLog.userId, userId));

  if (allLogs.length === 0) return { streak: 0, reviewedToday };

  // Build a set of ISO date strings "YYYY-MM-DD"
  const daySet = new Set<string>();
  for (const row of allLogs) {
    const d = startOfDay(row.reviewedAt);
    daySet.add(d.toISOString().slice(0, 10));
  }

  // Walk backwards from today, counting consecutive days
  let streak = 0;
  const cursor = startOfDay(new Date());
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!daySet.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { streak, reviewedToday };
}
