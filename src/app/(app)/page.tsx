import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { page } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getDueCount } from "@/lib/due";
import { getReviewStreak } from "@/lib/stats";
import { getTasksForToday } from "@/actions/tasks";
import { getReviewHistory } from "@/lib/stats";
import { NewPageButton } from "@/components/pages/NewPageButton";
import { TaskChecklist } from "@/components/tasks/TaskChecklist";
import { ReviewChart } from "@/components/ReviewChart";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const [recentPages, dueCount, streak, todayTasks, reviewHistory] = await Promise.all([
    db.query.page.findMany({
      where: and(eq(page.userId, session.user.id), eq(page.isArchived, false)),
      orderBy: [desc(page.updatedAt)],
      limit: 10,
    }),
    getDueCount(session.user.id),
    getReviewStreak(session.user.id),
    getTasksForToday(session.user.id),
    getReviewHistory(session.user.id, 7),
  ]);

  return (
    <div className="max-w-[900px] mx-auto py-8 px-4 md:py-16 md:px-8">
      <div className="flex items-center justify-between mb-8 md:mb-10">
        <h1 className="text-3xl md:text-5xl font-bold">Home</h1>
        <NewPageButton userId={session.user.id} />
      </div>

      <ReviewChart data={reviewHistory} />

      {(streak.streak > 0 || streak.reviewedToday > 0) && (
        <div className="flex items-center gap-5 px-6 py-4 rounded-xl bg-muted/50 text-lg mt-8">
          {streak.streak > 0 && (
            <span className="font-medium">🔥 {streak.streak} day streak</span>
          )}
          <span className="text-muted-foreground">{streak.reviewedToday} cards reviewed today</span>
        </div>
      )}

      {dueCount > 0 && (
        <Link
          href="/review"
          className="flex items-center gap-5 px-6 py-4 mt-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors duration-150"
        >
          <span className="text-3xl font-bold text-primary">{dueCount}</span>
          <div>
            <p className="font-medium text-lg">Cards due for review</p>
            <p className="text-base text-muted-foreground">Start reviewing now</p>
          </div>
        </Link>
      )}

      <div className="mt-10">
        <TaskChecklist tasks={todayTasks} userId={session.user.id} />
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Recent Pages</h2>
        {recentPages.length === 0 ? (
          <p className="text-lg text-muted-foreground py-4">No pages yet. Create your first page!</p>
        ) : (
          <div className="space-y-px">
            {recentPages.map((p) => (
              <Link
                key={p.id}
                href={`/pages/${p.id}`}
                className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl hover:bg-muted/50 transition-colors duration-100 group"
              >
                <span className="text-lg">{p.icon ?? "📄"}</span>
                <span className="text-lg flex-1 truncate">{p.title || "Untitled"}</span>
                <span className="text-sm text-muted-foreground/60 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
