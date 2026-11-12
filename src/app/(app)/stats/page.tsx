import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { reviewLog, card, deck } from "@/db/schema";
import { eq, and, gte, ne, lte, sql, asc } from "drizzle-orm";
import { getReviewStreak } from "@/lib/stats";
import { ReviewHeatmap } from "@/components/stats/ReviewHeatmap";

export const instant = false;

export default async function StatsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const userId = session.user.id;

  const now = new Date();
  const msPerDay = 86400000;
  const start90 = new Date(now.getTime() - 90 * msPerDay);
  start90.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const endOfWeek = new Date(now.getTime() + 7 * msPerDay);

  const [
    allReviews90,
    streak,
    totalCardsRow,
    totalReviewsRow,
    dueNowRow,
    dueWeekRow,
    allDecks,
    hardestRaw,
  ] = await Promise.all([
    db.select({ rating: reviewLog.rating, reviewedAt: reviewLog.reviewedAt })
      .from(reviewLog)
      .where(and(eq(reviewLog.userId, userId), gte(reviewLog.reviewedAt, start90))),
    getReviewStreak(userId),
    db.select({ count: sql<number>`count(*)` }).from(card)
      .where(and(eq(card.userId, userId), ne(card.isArchived, true))),
    db.select({ count: sql<number>`count(*)` }).from(reviewLog)
      .where(eq(reviewLog.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(card)
      .where(and(eq(card.userId, userId), ne(card.isArchived, true), lte(card.dueDate, endOfToday))),
    db.select({ count: sql<number>`count(*)` }).from(card)
      .where(and(eq(card.userId, userId), ne(card.isArchived, true), lte(card.dueDate, endOfWeek))),
    db.query.deck.findMany({ where: eq(deck.userId, userId) }),
    db.select({
      cardId: reviewLog.cardId,
      avgRating: sql<number>`avg(${reviewLog.rating})`,
      reviewCount: sql<number>`count(*)`,
      againCount: sql<number>`sum(case when ${reviewLog.rating} = 0 then 1 else 0 end)`,
    })
      .from(reviewLog)
      .where(eq(reviewLog.userId, userId))
      .groupBy(reviewLog.cardId)
      .orderBy(asc(sql`avg(${reviewLog.rating})`))
      .limit(10),
  ]);

  // Heatmap data: last 90 days
  const heatmapMap = new Map<string, number>();
  for (const r of allReviews90) {
    const d = new Date(r.reviewedAt);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    heatmapMap.set(key, (heatmapMap.get(key) ?? 0) + 1);
  }
  const heatmapData: { date: string; count: number }[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now.getTime() - i * msPerDay);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    heatmapData.push({ date: key, count: heatmapMap.get(key) ?? 0 });
  }

  // Overall accuracy
  const totalGood = allReviews90.filter((r) => r.rating >= 2).length;
  const avgAccuracy = allReviews90.length > 0 ? Math.round((totalGood / allReviews90.length) * 100) : 0;

  // Hardest cards with details
  const hardestCardIds = hardestRaw.map((r) => r.cardId);
  const hardestCards = hardestCardIds.length > 0
    ? await db.query.card.findMany({
        where: and(eq(card.userId, userId), sql`${card.id} IN (${sql.join(hardestCardIds.map(id => sql`${id}`), sql`, `)})`)
      })
    : [];
  const deckMap = new Map(allDecks.map((d) => [d.id, d.name]));
  const hardest = hardestRaw.map((r) => {
    const c = hardestCards.find((c) => c.id === r.cardId);
    return {
      front: c?.front ?? "?",
      deckName: deckMap.get(c?.deckId ?? "") ?? "?",
      avgRating: Number(r.avgRating).toFixed(1),
      reviewCount: r.reviewCount,
      againCount: r.againCount ?? 0,
    };
  });

  // Deck breakdown
  const allCards = await db.query.card.findMany({
    where: and(eq(card.userId, userId), ne(card.isArchived, true)),
    columns: { deckId: true, interval: true, easeFactor: true, dueDate: true },
  });
  const deckBreakdown = allDecks.map((d) => {
    const cards = allCards.filter((c) => c.deckId === d.id);
    const dueCount = cards.filter((c) => new Date(c.dueDate) <= endOfToday).length;
    const mastered = cards.filter((c) => c.interval > 21).length;
    const avgEase = cards.length > 0
      ? (cards.reduce((sum, c) => sum + c.easeFactor, 0) / cards.length).toFixed(2)
      : "\u2014";
    return {
      id: d.id,
      name: d.name,
      cardCount: cards.length,
      dueCount,
      mastery: cards.length > 0 ? Math.round((mastered / cards.length) * 100) : 0,
      avgEase,
    };
  });

  return (
    <div className="max-w-[900px] mx-auto py-8 px-4 md:py-12 md:px-8 space-y-8">
      <h1 className="text-3xl md:text-5xl font-bold">Statistics</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Cards", value: totalCardsRow[0]?.count ?? 0 },
          { label: "Total Reviews", value: totalReviewsRow[0]?.count ?? 0 },
          { label: "Accuracy", value: `${avgAccuracy}%` },
          { label: "Streak", value: `${streak.streak}d` },
          { label: "Reviewed Today", value: streak.reviewedToday },
          { label: "Due Today", value: dueNowRow[0]?.count ?? 0 },
          { label: "Due This Week", value: dueWeekRow[0]?.count ?? 0 },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3 rounded-2xl border border-border bg-card">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Review Activity</h2>
        <ReviewHeatmap data={heatmapData} />
      </div>

      {/* Deck breakdown */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Deck Breakdown</h2>
        <div className="space-y-2">
          {deckBreakdown.map((d) => (
            <div key={d.id} className="flex items-center gap-4 px-4 py-3 rounded-2xl border border-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{d.name}</p>
                <p className="text-sm text-muted-foreground">{d.cardCount} cards · {d.dueCount} due · ease {d.avgEase}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold">{d.mastery}%</p>
                <p className="text-xs text-muted-foreground">mastered</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hardest cards */}
      {hardest.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Hardest Cards</h2>
          <div className="space-y-2">
            {hardest.map((c, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-2xl border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.front}</p>
                  <p className="text-sm text-muted-foreground">{c.deckName}</p>
                </div>
                <div className="text-right shrink-0 text-sm text-muted-foreground">
                  <p>avg {c.avgRating} · {c.reviewCount} reviews</p>
                  {Number(c.againCount) > 0 && <p className="text-destructive">{c.againCount}x Again</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
