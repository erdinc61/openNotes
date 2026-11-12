"use server";

import { db } from "@/db";
import { page } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { randomUUID } from "crypto";
import { requireUserId } from "@/lib/auth-helpers";

export async function createPage(userId: string, parentId?: string) {
  const now = new Date();
  const id = randomUUID();
  await db.insert(page).values({
    id,
    userId,
    parentId: parentId ?? null,
    title: "Untitled",
    content: "",
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  });
  const created = await db.query.page.findFirst({ where: eq(page.id, id) });
  return created!;
}

export async function updatePage(
  id: string,
  data: { title?: string; content?: string; icon?: string | null; coverImage?: string | null }
) {
  const userId = await requireUserId();
  const where = userId ? and(eq(page.id, id), eq(page.userId, userId)) : eq(page.id, id);
  await db.update(page).set({ ...data, updatedAt: new Date() }).where(where);
}

export async function archivePage(id: string) {
  const userId = await requireUserId();
  const where = userId ? and(eq(page.id, id), eq(page.userId, userId)) : eq(page.id, id);
  await db.update(page).set({ isArchived: true, updatedAt: new Date() }).where(where);
}

export async function restorePage(id: string) {
  const userId = await requireUserId();
  const where = userId ? and(eq(page.id, id), eq(page.userId, userId)) : eq(page.id, id);
  await db.update(page).set({ isArchived: false, updatedAt: new Date() }).where(where);
}

async function getDescendantIds(pageId: string): Promise<string[]> {
  const children = await db.query.page.findMany({
    where: (p) => and(eq(p.parentId, pageId), ne(p.isArchived, true)),
  });
  const ids: string[] = children.map((c) => c.id);
  for (const child of children) {
    const childDescendants = await getDescendantIds(child.id);
    ids.push(...childDescendants);
  }
  return ids;
}

export async function deletePage(id: string) {
  const userId = await requireUserId();
  const where = userId ? and(eq(page.id, id), eq(page.userId, userId)) : eq(page.id, id);
  await db.delete(page).where(where);
}

export async function movePage(id: string, newParentId: string | null) {
  if (newParentId !== null) {
    if (id === newParentId) {
      throw new Error("Cannot move a page under itself");
    }
    const descendants = await getDescendantIds(id);
    if (descendants.includes(newParentId)) {
      throw new Error("Cannot move a page under its own descendant");
    }
  }
  await db
    .update(page)
    .set({ parentId: newParentId, updatedAt: new Date() })
    .where(eq(page.id, id));
}
