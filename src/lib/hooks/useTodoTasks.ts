"use client";
import { useState, useEffect, useCallback } from "react";
import type { TodoTask, TodoPriority, TodoCategory } from "@/types/todo-task";

const TASKS_KEY = "riprint_todos_v1";
const CATS_KEY = "riprint_todo_categories_v1";

function loadTasks(): TodoTask[] {
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function loadCategories(): TodoCategory[] {
  try {
    const saved = localStorage.getItem(CATS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return [];
}

export function useTodoTasks() {
  const [tasks, setRaw] = useState<TodoTask[]>([]);
  const [categories, setCatsRaw] = useState<TodoCategory[]>([]);

  useEffect(() => {
    setRaw(loadTasks());
    setCatsRaw(loadCategories());
  }, []);

  const set = useCallback((fn: (p: TodoTask[]) => TodoTask[]) => {
    setRaw((prev) => {
      const next = fn(prev);
      localStorage.setItem(TASKS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setCats = useCallback((fn: (p: TodoCategory[]) => TodoCategory[]) => {
    setCatsRaw((prev) => {
      const next = fn(prev);
      localStorage.setItem(CATS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addTask = useCallback(
    (title: string, priority: TodoPriority, dueDate: string, categoryId?: string) => {
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
          categoryId,
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

  const addCategory = useCallback(
    (name: string, color: string, icon: string) => {
      setCats((prev) => [
        ...prev,
        { id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name, color, icon },
      ]);
    },
    [setCats]
  );

  const updateCategory = useCallback(
    (id: string, updates: Partial<Omit<TodoCategory, "id">>) => {
      setCats((prev) => prev.map((c) => (c.id !== id ? c : { ...c, ...updates })));
    },
    [setCats]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      setCats((prev) => prev.filter((c) => c.id !== id));
      set((prev) => prev.map((t) => (t.categoryId === id ? { ...t, categoryId: undefined } : t)));
    },
    [setCats, set]
  );

  return {
    tasks,
    categories,
    addTask,
    toggleTask,
    deleteTask,
    updateTask,
    toggleChecklist,
    addChecklist,
    deleteChecklist,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
