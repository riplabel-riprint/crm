"use client";

import { useState, useRef, useEffect } from "react";
import type { TodoTask, TodoPriority, TodoCategory, ChecklistItem } from "@/types/todo-task";

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dateLabel(d: string) {
  const t = todayStr();
  if (d === t) return "Dziś";
  const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (d === yest) return "Wczoraj";
  return new Date(d + "T12:00:00").toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function shiftDate(d: string, days: number) {
  const dt = new Date(d + "T12:00:00");
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
}

// Preset palette for category colors
const COLOR_PRESETS = [
  { label: "Pomarańczowy", value: "#fe4e00" },
  { label: "Niebieski",    value: "#3b82f6" },
  { label: "Zielony",      value: "#22c55e" },
  { label: "Fioletowy",    value: "#a855f7" },
  { label: "Różowy",       value: "#ec4899" },
  { label: "Żółty",        value: "#eab308" },
  { label: "Cyjan",        value: "#06b6d4" },
  { label: "Czerwony",     value: "#ef4444" },
];

const ICON_PRESETS = [
  "✏️", "🏠", "📦", "🛒", "💼", "📋", "👤", "🚗",
  "💡", "🔧", "🎯", "📸", "🧹", "📁", "🎨", "🔑",
];

type Filter = "all" | "active" | "done";

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  tasks: TodoTask[];
  categories: TodoCategory[];
  addTask: (title: string, priority: TodoPriority, dueDate: string, categoryId?: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Omit<TodoTask, "id" | "createdAt">>) => void;
  toggleChecklist: (taskId: string, itemId: string) => void;
  addChecklist: (taskId: string, text: string) => void;
  deleteChecklist: (taskId: string, itemId: string) => void;
  addCategory: (name: string, color: string, icon: string) => void;
  updateCategory: (id: string, updates: Partial<Omit<TodoCategory, "id">>) => void;
  deleteCategory: (id: string) => void;
};

// ── Category Manager Modal ────────────────────────────────────────────────────

function CategoryManager({
  categories,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}: {
  categories: TodoCategory[];
  onAdd: (name: string, color: string, icon: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<TodoCategory, "id">>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_PRESETS[0].value);
  const [newIcon, setNewIcon] = useState(ICON_PRESETS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function handleAdd() {
    const n = newName.trim();
    if (!n) return;
    onAdd(n, newColor, newIcon);
    setNewName("");
    setNewColor(COLOR_PRESETS[0].value);
    setNewIcon(ICON_PRESETS[0]);
  }

  function startEdit(cat: TodoCategory) {
    setEditingId(cat.id);
    setEditName(cat.name);
  }

  function saveEdit(cat: TodoCategory) {
    const n = editName.trim();
    if (n && n !== cat.name) onUpdate(cat.id, { name: n });
    setEditingId(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#141414] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Zarządzaj kategoriami</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/70"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Existing categories */}
          {categories.length > 0 && (
            <ul className="space-y-1.5">
              {categories.map((cat) => (
                <li
                  key={cat.id}
                  className="group flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                >
                  {/* Color dot + icon */}
                  <span
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-sm"
                    style={{ background: cat.color + "22", border: `1px solid ${cat.color}44` }}
                  >
                    {cat.icon}
                  </span>

                  {editingId === cat.id ? (
                    <input
                      type="text"
                      value={editName}
                      autoFocus
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => saveEdit(cat)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(cat);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 rounded border border-white/[0.1] bg-[#1a1a1a] px-2 py-0.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  ) : (
                    <span className="flex-1 text-sm text-white/80">{cat.name}</span>
                  )}

                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => startEdit(cat)}
                      className="rounded p-1 text-white/30 hover:bg-white/[0.06] hover:text-white/70"
                      title="Edytuj nazwę"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(cat.id)}
                      className="rounded p-1 text-white/30 hover:bg-red-500/10 hover:text-red-400"
                      title="Usuń kategorię"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Add new category */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">Nowa kategoria</p>

            <input
              type="text"
              placeholder="Nazwa kategorii…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              className="w-full rounded-md border border-white/[0.1] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/[0.06]"
            />

            {/* Icon picker */}
            <div>
              <p className="mb-1.5 text-[10px] text-white/30">Ikona</p>
              <div className="flex flex-wrap gap-1.5">
                {ICON_PRESETS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewIcon(icon)}
                    className={`h-8 w-8 rounded-lg text-base transition-all ${
                      newIcon === icon
                        ? "bg-white/[0.12] ring-1 ring-white/30"
                        : "hover:bg-white/[0.06]"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <p className="mb-1.5 text-[10px] text-white/30">Kolor</p>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setNewColor(c.value)}
                    className={`h-6 w-6 rounded-full transition-all ${
                      newColor === c.value ? "ring-2 ring-white/60 ring-offset-2 ring-offset-[#141414]" : ""
                    }`}
                    style={{ background: c.value }}
                  />
                ))}
              </div>
            </div>

            {/* Preview + Add */}
            <div className="flex items-center gap-3 pt-1">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
                style={{ background: newColor + "22", border: `1px solid ${newColor}44` }}
              >
                {newIcon}
              </div>
              <span className="flex-1 text-sm" style={{ color: newColor }}>
                {newName || <span className="text-white/20">Podgląd nazwy…</span>}
              </span>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="rounded-lg bg-[#fe4e00] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#e44500] disabled:opacity-30"
              >
                Dodaj
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Task Form ─────────────────────────────────────────────────────────────

function AddTaskForm({
  selectedDate,
  categories,
  onAdd,
}: {
  selectedDate: string;
  categories: TodoCategory[];
  onAdd: (title: string, priority: TodoPriority, dueDate: string, categoryId?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("normal");
  const [dueDate, setDueDate] = useState(selectedDate);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDueDate(selectedDate);
      inputRef.current?.focus();
    }
  }, [open, selectedDate]);

  function submit() {
    const t = title.trim();
    if (!t) return;
    onAdd(t, priority, dueDate, categoryId);
    setTitle("");
    setPriority("normal");
    setDueDate(selectedDate);
    setCategoryId(undefined);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-white/[0.1] px-3 py-2.5 text-sm text-white/30 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white/60"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Dodaj zadanie
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-white/[0.1] bg-white/[0.04] p-3 space-y-2.5">
      <input
        ref={inputRef}
        type="text"
        placeholder="Tytuł zadania…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setOpen(false);
        }}
        className="w-full rounded-md border border-white/[0.1] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/[0.06]"
      />

      {/* Category select */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryId(undefined)}
            className={`rounded-full px-2.5 py-1 text-xs transition-all ${
              categoryId === undefined
                ? "bg-white/[0.12] text-white/80 ring-1 ring-white/20"
                : "text-white/30 hover:bg-white/[0.06] hover:text-white/60"
            }`}
          >
            Brak kategorii
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-all ${
                categoryId === cat.id
                  ? "ring-1"
                  : "hover:opacity-80"
              }`}
              style={
                categoryId === cat.id
                  ? { background: cat.color + "22", color: cat.color, borderColor: cat.color + "44" }
                  : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }
              }
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* Priority */}
        <div className="flex rounded-md border border-white/[0.1] bg-[#1a1a1a] text-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setPriority("normal")}
            className={`px-2.5 py-1.5 transition-colors ${
              priority === "normal"
                ? "bg-white/[0.08] font-semibold text-white/80"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            Normalny
          </button>
          <button
            type="button"
            onClick={() => setPriority("high")}
            className={`px-2.5 py-1.5 transition-colors ${
              priority === "high"
                ? "bg-red-500/20 font-semibold text-red-400"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            Wysoki
          </button>
        </div>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-md border border-white/[0.1] bg-[#1a1a1a] px-2.5 py-1.5 text-xs text-white/70 focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/[0.06] [color-scheme:dark]"
        />

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md px-2.5 py-1.5 text-xs text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim()}
            className="rounded-md bg-[#fe4e00] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#e44500] disabled:opacity-40"
          >
            Dodaj
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Checklist Panel ───────────────────────────────────────────────────────────

function ChecklistPanel({
  items,
  onToggle,
  onAdd,
  onDelete,
}: {
  taskId: string;
  items: ChecklistItem[];
  onToggle: (itemId: string) => void;
  onAdd: (text: string) => void;
  onDelete: (itemId: string) => void;
}) {
  const [newText, setNewText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const done = items.filter((i) => i.done).length;

  function submit() {
    const t = newText.trim();
    if (!t) return;
    onAdd(t);
    setNewText("");
    inputRef.current?.focus();
  }

  return (
    <div className="ml-6 mt-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-2">
      {items.length > 0 && (
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">
          Checklista {done}/{items.length}
        </p>
      )}
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="group flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => onToggle(item.id)}
              className="h-3.5 w-3.5 flex-none cursor-pointer rounded border-white/20 accent-[#fe4e00]"
            />
            <span className={`flex-1 text-xs ${item.done ? "text-white/30 line-through" : "text-white/70"}`}>
              {item.text}
            </span>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="hidden text-white/20 transition-colors hover:text-red-400 group-hover:block"
            >
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-1.5 flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="text"
          placeholder="+ Element listy…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          className="flex-1 bg-transparent text-xs text-white/60 placeholder-white/20 focus:outline-none"
        />
        {newText.trim() && (
          <button type="button" onClick={submit} className="text-[10px] font-semibold text-[#fe4e00] hover:text-[#e44500]">
            Dodaj
          </button>
        )}
      </div>
    </div>
  );
}

// ── Task Row ──────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  isOverdue,
  selectedDate,
  category,
  categories,
  onToggle,
  onDelete,
  onUpdate,
  onToggleChecklist,
  onAddChecklist,
  onDeleteChecklist,
}: {
  task: TodoTask;
  isOverdue?: boolean;
  selectedDate: string;
  category?: TodoCategory;
  categories: TodoCategory[];
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Omit<TodoTask, "id" | "createdAt">>) => void;
  onToggleChecklist: (itemId: string) => void;
  onAddChecklist: (text: string) => void;
  onDeleteChecklist: (itemId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const editRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) editRef.current?.select(); }, [editing]);
  useEffect(() => { if (showDatePicker) dateRef.current?.showPicker?.(); }, [showDatePicker]);

  function saveEdit() {
    const t = editTitle.trim();
    if (t && t !== task.title) onUpdate({ title: t });
    else setEditTitle(task.title);
    setEditing(false);
  }

  const checklistDone = task.checklist.filter((c) => c.done).length;
  const hasChecklist = task.checklist.length > 0;

  return (
    <li className={`group rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.04] ${isOverdue ? "bg-red-500/[0.06]" : ""}`}>
      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={task.done}
          onChange={onToggle}
          className="mt-0.5 h-4 w-4 flex-none cursor-pointer rounded border-white/20 accent-[#fe4e00]"
        />

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={editRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") { setEditTitle(task.title); setEditing(false); }
              }}
              className="w-full rounded border border-white/[0.1] bg-[#1a1a1a] px-2 py-0.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/[0.06]"
            />
          ) : (
            <p
              onDoubleClick={() => !task.done && setEditing(true)}
              className={`cursor-default select-none text-sm leading-snug ${task.done ? "!text-white/30 line-through" : "!text-white"}`}
              title="Dwuklik aby edytować"
            >
              {task.title}
            </p>
          )}

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {isOverdue && (
              <span className="text-[10px] font-semibold text-red-400">
                Przeterminowane · {new Date(task.dueDate + "T12:00:00").toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
              </span>
            )}
            {!isOverdue && task.dueDate !== selectedDate && (
              <span className="inline-flex items-center gap-1 text-[10px] text-white/40">
                <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {new Date(task.dueDate + "T12:00:00").toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
            {task.priority === "high" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-400 ring-1 ring-inset ring-red-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Wysoki
              </span>
            )}
            {category && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: category.color + "18", color: category.color, border: `1px solid ${category.color}30` }}
              >
                {category.icon} {category.name}
              </span>
            )}
            {hasChecklist && (
              <button type="button" onClick={() => setShowChecklist((v) => !v)} className="text-[10px] text-white/30 hover:text-white/60">
                ☑ {checklistDone}/{task.checklist.length}
              </button>
            )}
          </div>
        </div>

        <div className="relative flex flex-none items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button type="button" title="Checklista" onClick={() => setShowChecklist((v) => !v)}
            className="rounded p-1 text-white/30 hover:bg-white/[0.06] hover:text-white/60">
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Category picker button */}
          {categories.length > 0 && (
            <button
              type="button"
              title="Zmień kategorię"
              onClick={() => { setShowCatPicker((v) => !v); setShowDatePicker(false); }}
              className={`rounded p-1 transition-colors hover:bg-white/[0.06] ${showCatPicker ? "text-[#fe4e00]" : "text-white/30 hover:text-white/60"}`}
              style={category ? { color: category.color } : {}}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
            </button>
          )}

          <button type="button" title="Zmień datę" onClick={() => { setShowDatePicker((v) => !v); setShowCatPicker(false); }}
            className={`rounded p-1 transition-colors hover:bg-white/[0.06] ${showDatePicker ? "text-[#fe4e00]" : "text-white/30 hover:text-white/60"}`}>
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793z" />
              <path d="M11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          {!task.done && (
            <button type="button" title="Edytuj" onClick={() => setEditing(true)}
              className="rounded p-1 text-white/30 hover:bg-white/[0.06] hover:text-white/60">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          )}
          <button type="button" title="Usuń" onClick={onDelete}
            className="rounded p-1 text-white/30 hover:bg-red-500/10 hover:text-red-400">
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Category picker dropdown */}
          {showCatPicker && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-white/[0.1] bg-[#1e1e1e] p-1.5 shadow-xl">
              <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold text-white/30">Kategoria</p>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onUpdate({ categoryId: undefined }); setShowCatPicker(false); }}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                  !task.categoryId ? "bg-white/[0.08] text-white/80" : "text-white/40 hover:bg-white/[0.06] hover:text-white/70"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-white/20" />
                Brak kategorii
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); onUpdate({ categoryId: cat.id }); setShowCatPicker(false); }}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                    task.categoryId === cat.id ? "font-semibold" : "hover:bg-white/[0.06]"
                  }`}
                  style={task.categoryId === cat.id ? { background: cat.color + "18", color: cat.color } : { color: "rgba(255,255,255,0.5)" }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  {task.categoryId === cat.id && (
                    <svg className="ml-auto h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          {showDatePicker && (
            <div className="absolute right-0 top-full z-20 mt-1 rounded-lg border border-white/[0.1] bg-[#1e1e1e] p-2 shadow-xl">
              <p className="mb-1.5 text-[10px] font-semibold text-white/40">Zmień datę zadania</p>
              <input
                ref={dateRef}
                type="date"
                defaultValue={task.dueDate}
                onChange={(e) => {
                  if (e.target.value) { onUpdate({ dueDate: e.target.value }); setShowDatePicker(false); }
                }}
                onBlur={() => setShowDatePicker(false)}
                className="rounded border border-white/[0.1] bg-[#2a2a2a] px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#fe4e00]/50 [color-scheme:dark]"
              />
            </div>
          )}
        </div>
      </div>

      {showChecklist && (
        <ChecklistPanel
          taskId={task.id}
          items={task.checklist}
          onToggle={onToggleChecklist}
          onAdd={onAddChecklist}
          onDelete={onDeleteChecklist}
        />
      )}
    </li>
  );
}

// ── Category Section ──────────────────────────────────────────────────────────

function CategorySection({
  category,
  tasks,
  categories,
  isOverdue,
  selectedDate,
  onToggle,
  onDelete,
  onUpdate,
  onToggleChecklist,
  onAddChecklist,
  onDeleteChecklist,
}: {
  category: TodoCategory | null;
  tasks: TodoTask[];
  categories: TodoCategory[];
  isOverdue?: boolean;
  selectedDate: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, u: Partial<Omit<TodoTask, "id" | "createdAt">>) => void;
  onToggleChecklist: (taskId: string, itemId: string) => void;
  onAddChecklist: (taskId: string, text: string) => void;
  onDeleteChecklist: (taskId: string, itemId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const doneCount = tasks.filter((t) => t.done).length;

  const headerColor = isOverdue ? "#f87171" : (category?.color ?? "rgba(255,255,255,0.4)");
  const headerBg = isOverdue ? "rgba(239,68,68,0.08)" : (category ? category.color + "12" : "rgba(255,255,255,0.04)");
  const headerBorder = isOverdue ? "rgba(239,68,68,0.2)" : (category ? category.color + "30" : "transparent");

  return (
    <div>
      {/* Category header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors hover:opacity-80"
        style={{ background: headerBg, border: `1px solid ${headerBorder}` }}
      >
        {isOverdue ? (
          <svg className="h-3.5 w-3.5 flex-none" style={{ color: headerColor }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <span className="text-sm leading-none">{category?.icon ?? "·"}</span>
        )}

        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: headerColor }}>
          {isOverdue ? "Przeterminowane" : (category?.name ?? "Bez kategorii")}
        </span>

        <span
          className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
          style={{ background: headerColor + "22", color: headerColor }}
        >
          {tasks.length}
        </span>

        {doneCount > 0 && (
          <span className="text-[10px] text-white/30">
            {doneCount}/{tasks.length} ukończone
          </span>
        )}

        <svg
          className={`ml-auto h-3 w-3 flex-none transition-transform`}
          style={{ color: headerColor, transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {!collapsed && (
        <ul className="mt-0.5 space-y-0.5">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              isOverdue={isOverdue}
              selectedDate={selectedDate}
              category={category ?? undefined}
              categories={categories}
              onToggle={() => onToggle(task.id)}
              onDelete={() => onDelete(task.id)}
              onUpdate={(u) => onUpdate(task.id, u)}
              onToggleChecklist={(itemId) => onToggleChecklist(task.id, itemId)}
              onAddChecklist={(text) => onAddChecklist(task.id, text)}
              onDeleteChecklist={(itemId) => onDeleteChecklist(task.id, itemId)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function TodoDashboard({
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
}: Props) {
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [filter, setFilter] = useState<Filter>("all");
  const [showCatManager, setShowCatManager] = useState(false);

  const today = todayStr();

  const plannedAll = tasks.filter((t) => t.dueDate === selectedDate);
  const overdueAll =
    selectedDate <= today
      ? tasks.filter((t) => t.dueDate < selectedDate && !t.done)
      : [];

  const planned = plannedAll.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });
  const overdue = filter === "done" ? [] : overdueAll;

  const allForDay = [...overdueAll, ...plannedAll];
  const doneCount = allForDay.filter((t) => t.done).length;
  const activeCount = allForDay.filter((t) => !t.done).length;
  const total = allForDay.length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const doneToday = tasks.filter((t) => t.doneAt === today).length;

  const sortTasks = (list: TodoTask[]) =>
    [...list].sort((a, b) => {
      if (a.priority === "high" && b.priority !== "high") return -1;
      if (b.priority === "high" && a.priority !== "high") return 1;
      return a.createdAt.localeCompare(b.createdAt);
    });

  // Group tasks by category for a given list
  function groupByCategory(list: TodoTask[]) {
    const groups: { category: TodoCategory | null; tasks: TodoTask[] }[] = [];

    // For each category that has at least one task
    for (const cat of categories) {
      const catTasks = list.filter((t) => t.categoryId === cat.id);
      if (catTasks.length > 0) {
        groups.push({ category: cat, tasks: sortTasks(catTasks) });
      }
    }

    // Tasks without category
    const uncategorized = list.filter((t) => !t.categoryId || !categories.find((c) => c.id === t.categoryId));
    if (uncategorized.length > 0) {
      groups.push({ category: null, tasks: sortTasks(uncategorized) });
    }

    return groups;
  }

  const overdueGroups = groupByCategory(overdue);
  const plannedGroups = groupByCategory(planned);
  const hasContent = overdueGroups.length > 0 || plannedGroups.length > 0;

  const taskCallbacks = {
    onToggle: toggleTask,
    onDelete: deleteTask,
    onUpdate: updateTask,
    onToggleChecklist: toggleChecklist,
    onAddChecklist: addChecklist,
    onDeleteChecklist: deleteChecklist,
  };

  return (
    <>
      {showCatManager && (
        <CategoryManager
          categories={categories}
          onAdd={addCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
          onClose={() => setShowCatManager(false)}
        />
      )}

      <div className="flex flex-col rounded-2xl border border-white/[0.07] bg-[#141414] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold !text-white">Do zrobienia</h3>
            <button
              type="button"
              onClick={() => setShowCatManager(true)}
              title="Zarządzaj kategoriami"
              className="flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/70 transition-colors hover:border-white/20 hover:bg-white/[0.10] hover:text-white"
            >
              <svg className="h-3 w-3 flex-none" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
              Kategorie
              {categories.length > 0 ? (
                <span className="rounded-full bg-[#fe4e00]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#fe4e00]">
                  {categories.length}
                </span>
              ) : (
                <svg className="h-2.5 w-2.5 flex-none text-white/30" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
              className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/70"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="min-w-[90px] text-center text-xs font-medium text-white/60">
              {dateLabel(selectedDate)}
            </span>
            <button
              type="button"
              onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
              className="rounded-md p-1.5 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/70"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            {selectedDate !== today && (
              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className="ml-1 rounded-md px-2 py-1 text-[10px] font-semibold text-[#fe4e00] transition-colors hover:bg-[#fe4e00]/10"
              >
                Dziś
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="border-b border-white/[0.06] bg-white/[0.02] px-5 py-2.5">
            <div className="mb-1.5 flex items-center justify-between text-xs text-white/40">
              <span>
                <span className="font-semibold text-white/70">{activeCount}</span> aktywnych
                {selectedDate === today && (
                  <>
                    {" · "}
                    <span className="font-semibold text-white/70">{doneToday}</span> ukończonych dziś
                  </>
                )}
              </span>
              <span className="font-semibold text-[#fe4e00]">{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-[#fe4e00] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex border-b border-white/[0.06] bg-[#141414] px-4">
          {(["all", "active", "done"] as Filter[]).map((f) => {
            const labels: Record<Filter, string> = { all: "Wszystkie", active: "Aktywne", done: "Ukończone" };
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                  filter === f
                    ? "border-[#fe4e00] text-[#fe4e00]"
                    : "border-transparent text-white/40 hover:text-white/60"
                }`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {/* Overdue groups */}
          {overdueGroups.map(({ category, tasks: groupTasks }) => (
            <CategorySection
              key={`overdue-${category?.id ?? "none"}`}
              category={category}
              tasks={groupTasks}
              categories={categories}
              isOverdue
              selectedDate={selectedDate}
              {...taskCallbacks}
            />
          ))}

          {/* Planned groups */}
          {plannedGroups.map(({ category, tasks: groupTasks }) => (
            <CategorySection
              key={`planned-${category?.id ?? "none"}`}
              category={category}
              tasks={groupTasks}
              categories={categories}
              selectedDate={selectedDate}
              {...taskCallbacks}
            />
          ))}

          {/* Empty state */}
          {!hasContent && (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06]">
                <svg className="h-6 w-6 text-white/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white">
                {filter === "done" ? "Brak ukończonych zadań" : "Brak zadań na ten dzień"}
              </p>
              {filter !== "done" && (
                <p className="mt-1 text-xs text-white/40">Dodaj pierwsze zadanie poniżej</p>
              )}
            </div>
          )}

          {filter !== "done" && (
            <AddTaskForm selectedDate={selectedDate} categories={categories} onAdd={addTask} />
          )}
        </div>
      </div>
    </>
  );
}
