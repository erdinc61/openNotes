import { describe, it, expect, beforeEach } from "vitest";
import { createPage, movePage } from "./pages";
import { db } from "@/db";
import { page, user } from "@/db/schema";
import { eq } from "drizzle-orm";

const TEST_USER_ID = "test-user-pages";

beforeEach(async () => {
  // Ensure test user exists
  const existing = await db.query.user.findFirst({ where: eq(user.id, TEST_USER_ID) });
  if (!existing) {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Test User",
      email: "test-pages@example.com",
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  // Clean up test pages
  await db.delete(page).where(eq(page.userId, TEST_USER_ID));
});

describe("movePage", () => {
  it("movePage throws if newParentId is a descendant of id", async () => {
    const parent = await createPage(TEST_USER_ID);
    const child = await createPage(TEST_USER_ID, parent.id);

    await expect(movePage(parent.id, child.id)).rejects.toThrow(
      "Cannot move a page under its own descendant"
    );
  });

  it("movePage throws if newParentId is a deep descendant", async () => {
    const grandparent = await createPage(TEST_USER_ID);
    const parent = await createPage(TEST_USER_ID, grandparent.id);
    const child = await createPage(TEST_USER_ID, parent.id);

    await expect(movePage(grandparent.id, child.id)).rejects.toThrow(
      "Cannot move a page under its own descendant"
    );
  });

  it("movePage to null makes page a root page", async () => {
    const parent = await createPage(TEST_USER_ID);
    const child = await createPage(TEST_USER_ID, parent.id);

    await movePage(child.id, null);

    const updated = await db.query.page.findFirst({ where: eq(page.id, child.id) });
    expect(updated!.parentId).toBeNull();
  });

  it("movePage throws if page is moved under itself", async () => {
    const a = await createPage(TEST_USER_ID);
    await expect(movePage(a.id, a.id)).rejects.toThrow("Cannot move a page under itself");
  });

  it("movePage to a valid new parent updates parentId", async () => {
    const a = await createPage(TEST_USER_ID);
    const b = await createPage(TEST_USER_ID);

    await movePage(a.id, b.id);

    const updated = await db.query.page.findFirst({ where: eq(page.id, a.id) });
    expect(updated!.parentId).toBe(b.id);
  });
});
