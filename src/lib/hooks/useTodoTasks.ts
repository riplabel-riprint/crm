"use client";
import { useState, useEffect, useCallback } from "react";
import type { TodoTask, TodoPriority } from "@/types/todo-task";

const KEY = "riprint_todos_v1";

function load(): TodoTask[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function useTodoTasks() {
  const [tasks, setRaw] = useState<TodoTask[]>([]);

  useEffect(() => {
    setRaw(load());
  }, []);

  const set = useCallback((fn: (p: TodoTask[]) => TodoTask[]) => {
    setRaw((prev) => {
      const next = fn(prev);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addTask = useCallback(
    (title: string, priority: TodoPriority, dueDate: string) => {
      set((prev) => [
        ...prev,
        {
          id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title,
          priority,
          dueDate,
          done: false,
          createdAt: new Date().toISOString(),
          checklist: [],
        },
      ]);
    },
    [set]
  );

  const toggleTask = useCallback(
    (id: string) => {
      const today = new Date().toISOString().slice(0, 10);
      set((prev) =>
        prev.map((t) =>
          t.id !== id ? t : { ...t, done: !t.done, doneAt: !t.done ? today : undefined }
        )
      );
    },
    [set]
  );

  const deleteTask = useCallback(
    (id: string) => {
      set((prev) => prev.filter((t) => t.id !== id));
    },
    [set]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Omit<TodoTask, "id" | "createdAt">>) => {
      set((prev) => prev.map((t) => (t.id !== id ? t : { ...t, ...updates })));
    },
    [set]
  );

  const toggleChecklist = useCallback(
    (taskId: string, itemId: string) => {
      set((prev) =>
        prev.map((t) =>
          t.id !== taskId
            ? t
            : {
                ...t,
                checklist: t.checklist.map((c) =>
                  c.id !== itemId ? c : { ...c, done: !c.done }
                ),
              }
        )
      );
    },
    [set]
  );

  const addChecklist = useCallback(
    (taskId: string, text: string) => {
      set((prev) =>
        prev.map((t) =>
          t.id !== taskId
            ? t
            : {
                ...t,
                checklist: [
                  ...t.checklist,
                  { id: `c_${Date.now()}`, text, done: false },
                ],
              }
        )
      );
    },
    [set]
  );

  const deleteChecklist = useCallback(
    (taskId: string, itemId: string) => {
      set((prev) =>
        prev.map((t) =>
          t.id !== taskId
            ? t
            : { ...t, checklist: t.checklist.filter((c) => c.id !== itemId) }
        )
      );
    },
    [set]
  );

  return {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    updateTask,
    toggleChecklist,
    addChecklist,
    deleteChecklist,
  };
}
