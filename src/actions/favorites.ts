"use server";

import { db } from "@/db";
import { page } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUserId } from "@/lib/auth-helpers";

export async function toggleFavorite(pageId: string, value: boolean): Promise<void> {
  const userId = await requireUserId();
  const where = userId ? and(eq(page.id, pageId), eq(page.userId, userId)) : eq(page.id, pageId);
  await db.update(page).set({ isFavorite: value, updatedAt: new Date() }).where(where);
}
