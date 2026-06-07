"use client";

import { useState, useEffect } from "react";
import type { Goal, GoalFlex, GoalMilestoned, GoalTaskItem, GoalMilestone } from "@/types/goal";

const LS_KEY = "riprint_goals_v1";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadGoals(): Goal[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Goal[];
  } catch { /* ignore */ }
  return [];
}

function saveGoals(goals: Goal[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(goals)); } catch { /* ignore */ }
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  function update(next: Goal[]) {
    setGoals(next);
    saveGoals(next);
  }

  function addGoal(name: string, kind: "flex" | "milestoned", dueDate?: string) {
    const base = { id: uid(), name, createdAt: new Date().toISOString() };
    const goal: Goal =
      kind === "flex"
        ? ({ ...base, kind: "flex", tasks: [] } as GoalFlex)
        : ({
            ...base,
            kind: "milestoned",
            dueDate: dueDate ?? new Date().toISOString().slice(0, 10),
            milestones: [{ id: uid(), name: "Etap 1", tasks: [] }],
          } as GoalMilestoned);
    update([...goals, goal]);
  }

  function deleteGoal(id: string) {
    update(goals.filter((g) => g.id !== id));
  }

  function updateGoalName(id: string, name: string) {
    update(goals.map((g) => (g.id === id ? { ...g, name } : g)));
  }

  function updateGoalDueDate(id: string, dueDate: string) {
    update(
      goals.map((g) =>
        g.id === id && g.kind === "milestoned" ? { ...g, dueDate } : g
      )
    );
  }

  function addTask(goalId: string, text: string) {
    const task: GoalTaskItem = { id: uid(), text, done: false };
    update(
      goals.map((g) => {
        if (g.id !== goalId) return g;
        if (g.kind === "flex") {
          return { ...g, tasks: [...g.tasks, task] };
        }
        // milestoned: add to first incomplete milestone (or last if all done)
        const milestones = g.milestones.map((m, i) => {
          const firstIncomplete = g.milestones.findIndex(
            (ms) => ms.tasks.some((t) => !t.done) || ms.tasks.length === 0
          );
          const targetIdx = firstIncomplete >= 0 ? firstIncomplete : g.milestones.length - 1;
          if (i === targetIdx) return { ...m, tasks: [...m.tasks, task] };
          return m;
        });
        return { ...g, milestones };
      })
    );
  }

  function toggleTask(goalId: string, taskId: string, milestoneId?: string) {
    update(
      goals.map((g) => {
        if (g.id !== goalId) return g;
        if (g.kind === "flex") {
          return {
            ...g,
            tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
          };
        }
        return {
          ...g,
          milestones: g.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            return {
              ...m,
              tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
            };
          }),
        };
      })
    );
  }

  function deleteTask(goalId: string, taskId: string, milestoneId?: string) {
    update(
      goals.map((g) => {
        if (g.id !== goalId) return g;
        if (g.kind === "flex") {
          return { ...g, tasks: g.tasks.filter((t) => t.id !== taskId) };
        }
        return {
          ...g,
          milestones: g.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            return { ...m, tasks: m.tasks.filter((t) => t.id !== taskId) };
          }),
        };
      })
    );
  }

  function addMilestone(goalId: string, name: string) {
    const milestone: GoalMilestone = { id: uid(), name, tasks: [] };
    update(
      goals.map((g) => {
        if (g.id !== goalId || g.kind !== "milestoned") return g;
        return { ...g, milestones: [...g.milestones, milestone] };
      })
    );
  }

  function deleteMilestone(goalId: string, milestoneId: string) {
    update(
      goals.map((g) => {
        if (g.id !== goalId || g.kind !== "milestoned") return g;
        return { ...g, milestones: g.milestones.filter((m) => m.id !== milestoneId) };
      })
    );
  }

  return {
    goals,
    addGoal,
    deleteGoal,
    updateGoalName,
    updateGoalDueDate,
    addTask,
    toggleTask,
    deleteTask,
    addMilestone,
    deleteMilestone,
  };
}
