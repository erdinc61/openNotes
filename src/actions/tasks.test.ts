import { describe, it, expect, beforeEach } from "vitest";
import { createTask, completeTask, uncompleteTask, getTasksForToday, deleteTask } from "./tasks";
import { db } from "@/db";
import { task, user } from "@/db/schema";
import { eq } from "drizzle-orm";

const TEST_USER_ID = "test-user-tasks";

beforeEach(async () => {
  const existing = await db.query.user.findFirst({ where: eq(user.id, TEST_USER_ID) });
  if (!existing) {
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Test Tasks User",
      email: "test-tasks@example.com",
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  await db.delete(task).where(eq(task.userId, TEST_USER_ID));
});

const today = new Date().toISOString().slice(0, 10);

describe("getTasksForToday", () => {
  it("includes daily recurring task (empty scheduleDays = every day)", async () => {
    await createTask({ userId: TEST_USER_ID, title: "Daily", isRecurring: true, scheduleDays: [] });
    const tasks = await getTasksForToday(TEST_USER_ID);
    expect(tasks.map((t) => t.task.title)).toContain("Daily");
  });

  it("excludes recurring task not scheduled today", async () => {
    const tomorrow = (new Date().getDay() + 1) % 7;
    await createTask({ userId: TEST_USER_ID, title: "Not today", isRecurring: true, scheduleDays: [tomorrow] });
    const tasks = await getTasksForToday(TEST_USER_ID);
    expect(tasks.map((t) => t.task.title)).not.toContain("Not today");
  });

  it("includes one-time task before completion", async () => {
    await createTask({ userId: TEST_USER_ID, title: "Once", isRecurring: false, scheduleDays: [] });
    const tasks = await getTasksForToday(TEST_USER_ID);
    expect(tasks.map((t) => t.task.title)).toContain("Once");
  });

  it("doneToday is true after completeTask for recurring task", async () => {
    const t = await createTask({ userId: TEST_USER_ID, title: "Task", isRecurring: true, scheduleDays: [] });
    await completeTask(t.id, today);
    const tasks = await getTasksForToday(TEST_USER_ID);
    const found = tasks.find((x) => x.task.id === t.id);
    expect(found?.doneToday).toBe(true);
  });

  it("one-time task disappears after completion", async () => {
    const t = await createTask({ userId: TEST_USER_ID, title: "Once", isRecurring: false, scheduleDays: [] });
    await completeTask(t.id, today);
    const tasks = await getTasksForToday(TEST_USER_ID);
    expect(tasks.find((x) => x.task.id === t.id)).toBeUndefined();
  });

  it("recurring task stays visible after completion (doneToday=true)", async () => {
    const t = await createTask({ userId: TEST_USER_ID, title: "Daily", isRecurring: true, scheduleDays: [] });
    await completeTask(t.id, today);
    const tasks = await getTasksForToday(TEST_USER_ID);
    const found = tasks.find((x) => x.task.id === t.id);
    expect(found).toBeDefined();
    expect(found?.doneToday).toBe(true);
  });
});
