"use server";

import { nanoid } from "nanoid";
import { db } from "@/db";
import { task } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

type Task = InferSelectModel<typeof task>;

interface CreateTaskInput {
  userId: string;
  title: string;
  isRecurring: boolean;
  scheduleDays: number[];
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
  const now = new Date();
  const id = nanoid();
  await db.insert(task).values({
    id,
    userId: data.userId,
    title: data.title,
    isRecurring: data.isRecurring,
    scheduleDays: JSON.stringify(data.scheduleDays),
    completedDates: JSON.stringify([]),
    createdAt: now,
    updatedAt: now,
  });
  const created = await db.query.task.findFirst({ where: eq(task.id, id) });
  return created!;
}

export async function completeTask(id: string, date: string): Promise<void> {
  const t = await db.query.task.findFirst({ where: eq(task.id, id) });
  if (!t) return;
  const dates: string[] = JSON.parse(t.completedDates);
  if (!dates.includes(date)) dates.push(date);
  await db.update(task)
    .set({ completedDates: JSON.stringify(dates), updatedAt: new Date() })
    .where(eq(task.id, id));
}

export async function uncompleteTask(id: string, date: string): Promise<void> {
  const t = await db.query.task.findFirst({ where: eq(task.id, id) });
  if (!t) return;
  const dates: string[] = JSON.parse(t.completedDates);
  const filtered = dates.filter((d) => d !== date);
  await db.update(task)
    .set({ completedDates: JSON.stringify(filtered), updatedAt: new Date() })
    .where(eq(task.id, id));
}

export async function updateTask(
  id: string,
  data: { title: string; isRecurring: boolean; scheduleDays: number[] }
): Promise<Task> {
  await db.update(task)
    .set({
      title: data.title,
      isRecurring: data.isRecurring,
      scheduleDays: JSON.stringify(data.scheduleDays),
      updatedAt: new Date(),
    })
    .where(eq(task.id, id));
  const updated = await db.query.task.findFirst({ where: eq(task.id, id) });
  return updated!;
}

export async function deleteTask(id: string): Promise<void> {
  await db.delete(task).where(eq(task.id, id));
}

export async function getTasksForToday(
  userId: string
): Promise<{ task: Task; doneToday: boolean }[]> {
  const today = new Date().toISOString().slice(0, 10);
  const todayDow = new Date().getDay(); // 0=Sun..6=Sat

  const allTasks = await db.query.task.findMany({ where: eq(task.userId, userId) });
  const result: { task: Task; doneToday: boolean }[] = [];

  for (const t of allTasks) {
    const completedDates: string[] = JSON.parse(t.completedDates);
    const doneToday = completedDates.includes(today);

    if (t.isRecurring) {
      const scheduleDays: number[] = JSON.parse(t.scheduleDays);
      // empty = every day; otherwise must include today's day-of-week
      const scheduledToday = scheduleDays.length === 0 || scheduleDays.includes(todayDow);
      if (scheduledToday) {
        result.push({ task: t, doneToday });
      }
    } else {
      // one-time: show until end of day it was completed, then gone forever
      if (completedDates.length === 0) {
        result.push({ task: t, doneToday: false });
      } else if (doneToday) {
        result.push({ task: t, doneToday: true });
      }
    }
  }

  return result;
}
