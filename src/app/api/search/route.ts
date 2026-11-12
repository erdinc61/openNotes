import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { page, card } from "@/db/schema";
import { and, eq, like, or, ne } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ pages: [], cards: [] }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ pages: [], cards: [] });

  const pattern = `%${q}%`;
  const userId = session.user.id;

  const [pages, cards] = await Promise.all([
    db.query.page.findMany({
      where: and(
        eq(page.userId, userId),
        eq(page.isArchived, false),
        or(like(page.title, pattern), like(page.content, pattern))
      ),
      columns: { id: true, title: true, icon: true },
      limit: 10,
    }),
    db.query.card.findMany({
      where: and(
        eq(card.userId, userId),
        ne(card.isArchived, true),
        or(like(card.front, pattern), like(card.back, pattern))
      ),
      columns: { id: true, front: true, back: true, deckId: true },
      limit: 10,
    }),
  ]);

  return NextResponse.json({ pages, cards });
}
