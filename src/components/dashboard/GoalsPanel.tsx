"use client";

import { useState, useRef, useEffect } from "react";
import { useGoals } from "@/lib/hooks/useGoals";
import type { Goal, GoalFlex, GoalMilestoned, GoalMilestone } from "@/types/goal";

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(dueDate: string): number {
  const today = new Date(todayStr() + "T00:00:00");
  const due = new Date(dueDate + "T00:00:00");
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function getFlexProgress(goal: GoalFlex): { done: number; total: number; pct: number } {
  const total = goal.tasks.length;
  const done = goal.tasks.filter((t) => t.done).length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

function getActiveMilestone(goal: GoalMilestoned): GoalMilestone | null {
  return goal.milestones.find((m) => m.tasks.some((t) => !t.done) || m.tasks.length === 0) ?? null;
}

function isMilestoneDone(m: GoalMilestone): boolean {
  return m.tasks.length > 0 && m.tasks.every((t) => t.done);
}

function getMilestonedProgress(goal: GoalMilestoned): { label: string; pct: number } {
  const active = getActiveMilestone(goal);
  if (!active) {
    return { label: "Wszystkie etapy ukończone", pct: 100 };
  }
  const done = active.tasks.filter((t) => t.done).length;
  const total = active.tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { label: `${active.name}: ${done}/${total} tasków`, pct };
}

// ── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ goal }: { goal: Goal }) {
  const badges: React.ReactNode[] = [];

  if (goal.kind === "flex") {
    const { pct } = getFlexProgress(goal);
    badges.push(
      <span key="nodate" className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-medium text-white/40">
        Bez daty
      </span>
    );
    if (pct === 100 && goal.tasks.length > 0) {
      badges.push(
        <span key="done" className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
          Ukończony ✓
        </span>
      );
    } else {
      badges.push(
        <span key="inprogress" className="rounded-full bg-[#fe4e00]/15 px-2 py-0.5 text-[10px] font-semibold text-[#fe4e00] ring-1 ring-[#fe4e00]/25">
          W toku
        </span>
      );
    }
  } else {
    const { pct } = getMilestonedProgress(goal);
    if (pct === 100) {
      badges.push(
        <span key="done" className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
          Ukończony ✓
        </span>
      );
    } else {
      badges.push(
        <span key="inprogress" className="rounded-full bg-[#fe4e00]/15 px-2 py-0.5 text-[10px] font-semibold text-[#fe4e00] ring-1 ring-[#fe4e00]/25">
          W toku
        </span>
      );
    }
    const days = daysUntil(goal.dueDate);
    if (days < 0) {
      badges.push(
        <span key="overdue" className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400 ring-1 ring-red-500/20">
          Termin minął
        </span>
      );
    } else {
      badges.push(
        <span key="days" className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400 ring-1 ring-blue-500/20">
          {days === 0 ? "Dziś termin" : `${days} dni pozostało`}
        </span>
      );
    }
  }

  return <div className="flex flex-wrap items-center gap-1.5">{badges}</div>;
}

// ── Inline Task Input ─────────────────────────────────────────────────────────

function InlineTaskInput({ onAdd, onCancel }: { onAdd: (text: string) => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  function submit() {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText("");
    ref.current?.focus();
  }

  return (
    <div className="mt-1.5 flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5">
      <input
        ref={ref}
        type="text"
        placeholder="Nowy task…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onCancel();
        }}
        className="flex-1 bg-transparent text-xs text-white placeholder-white/30 focus:outline-none"
      />
      {text.trim() && (
        <button type="button" onClick={submit} className="text-[10px] font-semibold text-[#fe4e00] hover:text-[#e44500]">
          Dodaj
        </button>
      )}
      <button type="button" onClick={onCancel} className="text-[10px] text-white/30 hover:text-white/60">
        ✕
      </button>
    </div>
  );
}

// ── Flex Goal Card ────────────────────────────────────────────────────────────

function FlexGoalCard({
  goal,
  onDelete,
  onToggleTask,
  onDeleteTask,
  onAddTask,
}: {
  goal: GoalFlex;
  onDelete: () => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (text: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const { done, total, pct } = getFlexProgress(goal);

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v); }}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
      >
        <span className="text-base leading-none">📌</span>
        <span className="flex-1 truncate text-sm font-semibold text-white">{goal.name}</span>
        <StatusBadge goal={goal} />
        <svg
          className="h-3.5 w-3.5 flex-none text-white/30 transition-transform"
          style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="rounded p-1 text-white/20 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          title="Usuń cel"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between mb-1 text-[10px] text-white/40">
          <span>{done}/{total} tasków</span>
          <span className="font-semibold text-[#fe4e00]">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full bg-[#fe4e00] transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Tasks (expanded) */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-4 py-3 space-y-1">
          {goal.tasks.length === 0 && (
            <p className="text-xs text-white/30 py-1">Brak tasków. Dodaj pierwszy poniżej.</p>
          )}
          {goal.tasks.map((task) => (
            <div key={task.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/[0.04]">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => onToggleTask(task.id)}
                className="h-3.5 w-3.5 flex-none cursor-pointer rounded border-white/20 accent-[#fe4e00]"
              />
              <span className={`flex-1 text-xs ${task.done ? "text-white/30 line-through" : "text-white/80"}`}>
                {task.text}
              </span>
              <button
                type="button"
                onClick={() => onDeleteTask(task.id)}
                className="hidden text-white/20 hover:text-red-400 group-hover:block transition-colors"
              >
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}

          {addingTask ? (
            <InlineTaskInput
              onAdd={(text) => { onAddTask(text); setAddingTask(false); }}
              onCancel={() => setAddingTask(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAddingTask(true)}
              className="mt-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-white/30 hover:bg-white/[0.04] hover:text-white/60 transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Dodaj task
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Milestoned Goal Card ──────────────────────────────────────────────────────

function MilestonedGoalCard({
  goal,
  onDelete,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onAddMilestone,
  onDeleteMilestone,
}: {
  goal: GoalMilestoned;
  onDelete: () => void;
  onToggleTask: (taskId: string, milestoneId: string) => void;
  onDeleteTask: (taskId: string, milestoneId: string) => void;
  onAddTask: (text: string) => void;
  onAddMilestone: (name: string) => void;
  onDeleteMilestone: (milestoneId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const activeMilestone = getActiveMilestone(goal);
  const { label, pct } = getMilestonedProgress(goal);

  function submitMilestone() {
    const n = newMilestoneName.trim();
    if (!n) return;
    onAddMilestone(n);
    setNewMilestoneName("");
    setAddingMilestone(false);
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#1a1a1a] overflow-hidden">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v); }}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
      >
        <span className="text-base leading-none">🗓</span>
        <span className="flex-1 truncate text-sm font-semibold text-white">{goal.name}</span>
        <StatusBadge goal={goal} />
        <svg
          className="h-3.5 w-3.5 flex-none text-white/30 transition-transform"
          style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="rounded p-1 text-white/20 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          title="Usuń cel"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between mb-1 text-[10px] text-white/40">
          <span>{label}</span>
          <span className="font-semibold text-[#fe4e00]">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div className="h-full rounded-full bg-[#fe4e00] transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Milestones (expanded) */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-4 py-3 space-y-3">
          {goal.milestones.map((milestone) => {
            const done = isMilestoneDone(milestone);
            const isActive = activeMilestone?.id === milestone.id;
            const isFuture = !done && !isActive;

            return (
              <div
                key={milestone.id}
                className={`rounded-lg border transition-all ${
                  isActive
                    ? "border-[#fe4e00]/40 bg-[#fe4e00]/[0.06]"
                    : done
                    ? "border-white/[0.05] bg-white/[0.02]"
                    : "border-white/[0.05] bg-white/[0.01]"
                }`}
                style={isActive ? { borderLeftWidth: 2, borderLeftColor: "#fe4e00" } : undefined}
              >
                {/* Milestone header */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    done ? "text-white/30" : isActive ? "text-[#fe4e00]" : "text-white/20"
                  }`}>
                    {done ? "✓ " : isActive ? "▶ " : "○ "}
                    {milestone.name}
                  </span>
                  <span className={`text-[10px] ${done ? "text-white/25" : isActive ? "text-white/40" : "text-white/20"}`}>
                    {milestone.tasks.filter((t) => t.done).length}/{milestone.tasks.length}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    {!done && isActive && (
                      <button
                        type="button"
                        onClick={() => setAddingTask((v) => !v)}
                        className="rounded px-1.5 py-0.5 text-[10px] text-[#fe4e00]/70 hover:text-[#fe4e00] transition-colors"
                      >
                        + task
                      </button>
                    )}
                    {goal.milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteMilestone(milestone.id)}
                        className="rounded p-0.5 text-white/20 hover:text-red-400 transition-colors"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Tasks */}
                {milestone.tasks.length > 0 && (
                  <div className="px-3 pb-2 space-y-0.5">
                    {milestone.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`group flex items-center gap-2 rounded px-1.5 py-1 hover:bg-white/[0.04] ${done || isFuture ? "opacity-50" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          disabled={isFuture}
                          onChange={() => onToggleTask(task.id, milestone.id)}
                          className="h-3.5 w-3.5 flex-none cursor-pointer rounded border-white/20 accent-[#fe4e00] disabled:cursor-not-allowed"
                        />
                        <span className={`flex-1 text-xs ${task.done ? "text-white/30 line-through" : done || isFuture ? "text-white/40" : "text-white/80"}`}>
                          {task.text}
                        </span>
                        {!isFuture && (
                          <button
                            type="button"
                            onClick={() => onDeleteTask(task.id, milestone.id)}
                            className="hidden text-white/20 hover:text-red-400 group-hover:block transition-colors"
                          >
                            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline task input for active milestone */}
                {isActive && addingTask && (
                  <div className="px-3 pb-2">
                    <InlineTaskInput
                      onAdd={(text) => { onAddTask(text); setAddingTask(false); }}
                      onCancel={() => setAddingTask(false)}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Add milestone */}
          {addingMilestone ? (
            <div className="flex items-center gap-1.5 rounded-md border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5">
              <input
                type="text"
                placeholder="Nazwa etapu…"
                value={newMilestoneName}
                autoFocus
                onChange={(e) => setNewMilestoneName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitMilestone();
                  if (e.key === "Escape") { setAddingMilestone(false); setNewMilestoneName(""); }
                }}
                className="flex-1 bg-transparent text-xs text-white placeholder-white/30 focus:outline-none"
              />
              {newMilestoneName.trim() && (
                <button type="button" onClick={submitMilestone} className="text-[10px] font-semibold text-[#fe4e00] hover:text-[#e44500]">
                  Dodaj
                </button>
              )}
              <button type="button" onClick={() => { setAddingMilestone(false); setNewMilestoneName(""); }} className="text-[10px] text-white/30 hover:text-white/60">
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingMilestone(true)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-white/30 hover:bg-white/[0.04] hover:text-white/60 transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Dodaj etap
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── New Goal Form ─────────────────────────────────────────────────────────────

function NewGoalForm({ onAdd, onCancel }: { onAdd: (name: string, kind: "flex" | "milestoned", dueDate?: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"flex" | "milestoned">("flex");
  const [dueDate, setDueDate] = useState(todayStr());
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  function submit() {
    const n = name.trim();
    if (!n) return;
    onAdd(n, kind, kind === "milestoned" ? dueDate : undefined);
  }

  return (
    <div className="rounded-xl border border-white/[0.1] bg-white/[0.04] p-4 space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">Nowy cel</p>

      <input
        ref={ref}
        type="text"
        placeholder="Nazwa celu…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
        className="w-full rounded-md border border-white/[0.1] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/[0.06]"
      />

      {/* Kind toggle */}
      <div className="flex rounded-md border border-white/[0.1] bg-[#1a1a1a] text-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setKind("flex")}
          className={`flex-1 px-3 py-2 transition-colors ${kind === "flex" ? "bg-white/[0.08] font-semibold text-white/80" : "text-white/30 hover:text-white/60"}`}
        >
          Bez daty
        </button>
        <button
          type="button"
          onClick={() => setKind("milestoned")}
          className={`flex-1 px-3 py-2 transition-colors ${kind === "milestoned" ? "bg-white/[0.08] font-semibold text-white/80" : "text-white/30 hover:text-white/60"}`}
        >
          Z datą i etapami
        </button>
      </div>

      {kind === "milestoned" && (
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full rounded-md border border-white/[0.1] bg-[#1a1a1a] px-3 py-2 text-sm text-white/70 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/[0.06] [color-scheme:dark]"
        />
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-xs text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-colors"
        >
          Anuluj
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!name.trim()}
          className="rounded-md bg-[#fe4e00] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#e44500] disabled:opacity-40"
        >
          Dodaj
        </button>
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function GoalsPanel() {
  const {
    goals,
    addGoal,
    deleteGoal,
    toggleTask,
    deleteTask,
    addTask,
    addMilestone,
    deleteMilestone,
  } = useGoals();

  const [showForm, setShowForm] = useState(false);

  const activeGoals = goals.filter((g) => {
    if (g.kind === "flex") {
      const { pct } = getFlexProgress(g);
      return pct < 100 || g.tasks.length === 0;
    }
    const { pct } = getMilestonedProgress(g);
    return pct < 100;
  });

  return (
    <div className="flex flex-col rounded-2xl border border-white/[0.07] bg-[#141414] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-semibold text-white">🎯 Twoje cele</h3>
          {activeGoals.length > 0 && (
            <span className="rounded-full bg-[#fe4e00]/20 px-2 py-0.5 text-[10px] font-bold text-[#fe4e00]">
              {activeGoals.length} aktywne
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-white/70 transition-colors hover:border-white/20 hover:bg-white/[0.10] hover:text-white"
        >
          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Nowy cel
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* New goal form */}
        {showForm && (
          <NewGoalForm
            onAdd={(name, kind, dueDate) => { addGoal(name, kind, dueDate); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Goal cards */}
        {goals.length === 0 && !showForm && (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fe4e00]/10">
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-sm font-medium text-white/50">Brak celów</p>
            <p className="mt-1 text-xs text-white/30">Ustaw swój pierwszy cel</p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-lg bg-[#fe4e00] px-4 py-2 text-xs font-semibold text-white hover:bg-[#e44500] transition-colors"
            >
              + Nowy cel
            </button>
          </div>
        )}

        {goals.map((goal) => {
          if (goal.kind === "flex") {
            return (
              <FlexGoalCard
                key={goal.id}
                goal={goal}
                onDelete={() => deleteGoal(goal.id)}
                onToggleTask={(taskId) => toggleTask(goal.id, taskId)}
                onDeleteTask={(taskId) => deleteTask(goal.id, taskId)}
                onAddTask={(text) => addTask(goal.id, text)}
              />
            );
          }
          return (
            <MilestonedGoalCard
              key={goal.id}
              goal={goal}
              onDelete={() => deleteGoal(goal.id)}
              onToggleTask={(taskId, milestoneId) => toggleTask(goal.id, taskId, milestoneId)}
              onDeleteTask={(taskId, milestoneId) => deleteTask(goal.id, taskId, milestoneId)}
              onAddTask={(text) => addTask(goal.id, text)}
              onAddMilestone={(name) => addMilestone(goal.id, name)}
              onDeleteMilestone={(milestoneId) => deleteMilestone(goal.id, milestoneId)}
            />
          );
        })}
      </div>
    </div>
  );
}
