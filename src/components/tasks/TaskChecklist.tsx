"use client";

import { useState } from "react";
import { createTask, completeTask, uncompleteTask, deleteTask, updateTask } from "@/actions/tasks";
import { Plus, X, Pencil } from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import type { task } from "@/db/schema";

type Task = InferSelectModel<typeof task>;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface TaskChecklistProps {
  tasks: { task: Task; doneToday: boolean }[];
  userId: string;
}

function DayPicker({ scheduleDays, onToggle }: { scheduleDays: number[]; onToggle: (day: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {DAY_LABELS.map((label, i) => (
        <button
          key={i}
          onClick={() => onToggle(i)}
          className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
            scheduleDays.includes(i)
              ? "bg-primary text-primary-foreground border-primary"
              : "border-input hover:bg-muted"
          }`}
        >
          {label}
        </button>
      ))}
      <span className="text-sm text-muted-foreground self-center ml-1.5">
        {scheduleDays.length === 0 ? "(every day)" : ""}
      </span>
    </div>
  );
}

export function TaskChecklist({ tasks: initialTasks, userId }: TaskChecklistProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [scheduleDays, setScheduleDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editRecurring, setEditRecurring] = useState(false);
  const [editDays, setEditDays] = useState<number[]>([]);

  const today = new Date().toISOString().slice(0, 10);

  async function handleCheck(taskId: string, currentlyDone: boolean) {
    if (currentlyDone) {
      await uncompleteTask(taskId, today);
      setTasks((prev) =>
        prev.map((t) => t.task.id === taskId ? { ...t, doneToday: false } : t)
      );
    } else {
      await completeTask(taskId, today);
      setTasks((prev) =>
        prev.map((t) => t.task.id === taskId ? { ...t, doneToday: true } : t)
      );
    }
  }

  async function handleDelete(taskId: string) {
    await deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.task.id !== taskId));
  }

  async function handleAdd() {
    if (!newTitle.trim()) return;
    setSaving(true);
    const created = await createTask({
      userId,
      title: newTitle.trim(),
      isRecurring,
      scheduleDays: isRecurring ? scheduleDays : [],
    });
    setTasks((prev) => [...prev, { task: created, doneToday: false }]);
    setNewTitle("");
    setIsRecurring(false);
    setScheduleDays([]);
    setShowAdd(false);
    setSaving(false);
  }

  function toggleDay(day: number) {
    setScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function startEdit(t: Task) {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditRecurring(t.isRecurring);
    setEditDays(JSON.parse(t.scheduleDays) as number[]);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function toggleEditDay(day: number) {
    setEditDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSaveEdit() {
    if (!editingId || !editTitle.trim()) return;
    setSaving(true);
    const updated = await updateTask(editingId, {
      title: editTitle.trim(),
      isRecurring: editRecurring,
      scheduleDays: editRecurring ? editDays : [],
    });
    setTasks((prev) =>
      prev.map((t) => t.task.id === editingId ? { ...t, task: updated } : t)
    );
    setEditingId(null);
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tasks</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {tasks.length === 0 && !showAdd && (
        <p className="text-lg text-muted-foreground py-1">No tasks for today.</p>
      )}

      <div className="space-y-1.5">
        {tasks.map(({ task: t, doneToday }) =>
          editingId === t.id ? (
            <div key={t.id} className="space-y-3 py-2 px-3 border border-border rounded-xl bg-muted/50">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                className="w-full px-4 py-2.5 text-lg border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editRecurring}
                    onChange={(e) => setEditRecurring(e.target.checked)}
                    className="size-5 rounded"
                  />
                  Recurring
                </label>
              </div>
              {editRecurring && (
                <DayPicker scheduleDays={editDays} onToggle={toggleEditDay} />
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving || !editTitle.trim()}
                  className="px-5 py-2.5 text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-5 py-2.5 text-lg rounded-xl border border-input hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div key={t.id} className="flex items-center gap-3 group">
              <input
                type="checkbox"
                checked={doneToday}
                onChange={() => handleCheck(t.id, doneToday)}
                className="size-5 rounded"
              />
              <span className={`flex-1 text-lg ${doneToday ? "line-through text-muted-foreground" : ""}`}>
                {t.title}
                {t.isRecurring && (
                  <span className="ml-1.5 text-sm text-muted-foreground">
                    {JSON.parse(t.scheduleDays).length === 0
                      ? "(daily)"
                      : `(${(JSON.parse(t.scheduleDays) as number[]).map((d) => DAY_LABELS[d]).join(", ")})`}
                  </span>
                )}
              </span>
              <button
                onClick={() => startEdit(t)}
                className="md:opacity-0 md:group-hover:opacity-100 p-1 rounded-lg hover:bg-muted transition-opacity text-muted-foreground"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                className="md:opacity-0 md:group-hover:opacity-100 p-1 rounded-lg hover:bg-muted transition-opacity text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          )
        )}
      </div>

      {showAdd && (
        <div className="space-y-3 pt-2 border-t border-border">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Task name…"
            className="w-full px-4 py-2.5 text-lg border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-lg cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="size-5 rounded"
              />
              Recurring
            </label>
          </div>
          {isRecurring && (
            <DayPicker scheduleDays={scheduleDays} onToggle={toggleDay} />
          )}
          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              disabled={saving || !newTitle.trim()}
              className="px-5 py-2.5 text-lg rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewTitle(""); setIsRecurring(false); setScheduleDays([]); }}
              className="px-5 py-2.5 text-lg rounded-xl border border-input hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
