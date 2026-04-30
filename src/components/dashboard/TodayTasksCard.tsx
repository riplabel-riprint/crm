"use client";

import { Fragment, useState, useRef, useEffect } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ItemPriority, ItemStatus, ItemKind, TodayItem } from "@/types/today-item";
import { getTodayItems } from "@/lib/data/today-items";

const MOCK_USERS = [
  { id: "u1", name: "Anna Nowak" },
  { id: "u2", name: "Piotr Wiśniewski" },
  { id: "u3", name: "Marta Kowalska" },
  { id: "u4", name: "Tomasz Zając" },
];

// ── Config ──────────────────────────────────────────────────────────────────

type PriorityConfig = {
  label: string;
  dot: string;
  pill: string;
};

const PRIORITY_CONFIG: Record<ItemPriority, PriorityConfig> = {
  high: {
    label: "Wysoki",
    dot: "bg-red-500",
    pill: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  },
  medium: {
    label: "Średni",
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  },
  low: {
    label: "Niski",
    dot: "bg-gray-300",
    pill: "bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-200",
  },
};

type KindConfig = {
  label: string;
  icon: string;
  color: string;
  bg: string;
};

const KIND_CONFIG: Record<ItemKind, KindConfig> = {
  order_start: {
    label: "Zlecenia do startu",
    icon: "▶",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
  },
  stage_close: {
    label: "Etapy do zamknięcia",
    icon: "◻",
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  checklist_task: {
    label: "Zadania checklist",
    icon: "✓",
    color: "text-teal-700",
    bg: "bg-teal-50",
  },
  client_approval: {
    label: "Akceptacje klienta",
    icon: "✉",
    color: "text-purple-700",
    bg: "bg-purple-50",
  },
  overdue: {
    label: "Po terminie",
    icon: "⚠",
    color: "text-red-700",
    bg: "bg-red-50",
  },
  blocker: {
    label: "Blokady do wyjaśnienia",
    icon: "⛔",
    color: "text-orange-700",
    bg: "bg-orange-50",
  },
};

type StatusConfig = {
  label: string;
  badge: string;
  rowBg?: string;
};

const STATUS_CONFIG: Record<ItemStatus, StatusConfig> = {
  in_progress: {
    label: "W toku",
    badge: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  },
  pending: {
    label: "Oczekuje",
    badge: "bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-200",
  },
  done: {
    label: "Gotowe",
    badge: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  },
  overdue: {
    label: "Po terminie",
    badge: "bg-red-100 text-red-800 ring-1 ring-inset ring-red-300 font-semibold",
    rowBg: "bg-red-50/60",
  },
  blocked: {
    label: "Zablokowane",
    badge: "bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-300 font-semibold",
    rowBg: "bg-orange-50/60",
  },
};

const KIND_ORDER: ItemKind[] = [
  "order_start",
  "stage_close",
  "checklist_task",
  "client_approval",
  "overdue",
  "blocker",
];

// ── Quick actions ────────────────────────────────────────────────────────────

type QuickActionsProps = {
  item: TodayItem;
  onMarkDone: (id: string) => void;
  onAssign: (id: string, userId: string, userName: string) => void;
  onOpenRecord: (item: TodayItem) => void;
};

function AssignDropdown({
  onSelect,
  onClose,
}: {
  onSelect: (userId: string, userName: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
    >
      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Przypisz do
      </p>
      {MOCK_USERS.map((u) => (
        <button
          key={u.id}
          type="button"
          className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
          onClick={() => onSelect(u.id, u.name)}
        >
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-600">
            {u.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
          {u.name}
        </button>
      ))}
    </div>
  );
}

function QuickActions({ item, onMarkDone, onAssign, onOpenRecord }: QuickActionsProps) {
  const [assignOpen, setAssignOpen] = useState(false);
  const isDone = item.status === "done";

  return (
    <div className="relative flex items-center gap-0.5">
      <button
        type="button"
        title="Otwórz rekord"
        onClick={() => onOpenRecord(item)}
        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
        </svg>
      </button>

      {!isDone && (
        <button
          type="button"
          title="Oznacz jako zrobione"
          onClick={() => onMarkDone(item.id)}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      <div className="relative">
        <button
          type="button"
          title={item.assignee ? `Przypisano: ${item.assignee}` : "Przypisz do użytkownika"}
          onClick={() => setAssignOpen((v) => !v)}
          className={`rounded-md p-1.5 transition-colors hover:bg-indigo-50 hover:text-indigo-600 ${
            item.assignee ? "text-indigo-500" : "text-gray-400"
          }`}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
        </button>
        {assignOpen && (
          <AssignDropdown
            onSelect={(userId, userName) => {
              onAssign(item.id, userId, userName);
              setAssignOpen(false);
            }}
            onClose={() => setAssignOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PriorityPill({ priority }: { priority: ItemPriority }) {
  const { label, dot, pill } = PRIORITY_CONFIG[priority];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${pill}`}
      title={`Priorytet: ${label}`}
    >
      <span className={`h-1.5 w-1.5 flex-none rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

type ItemRowProps = {
  item: TodayItem;
  onMarkDone: (id: string) => void;
  onAssign: (id: string, userId: string, userName: string) => void;
  onOpenRecord: (item: TodayItem) => void;
};

function ItemRow({ item, onMarkDone, onAssign, onOpenRecord }: ItemRowProps) {
  const { badge, rowBg } = STATUS_CONFIG[item.status];
  const { label: statusLabel } = STATUS_CONFIG[item.status];
  const isDone = item.status === "done";

  return (
    <li
      className={`group flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-gray-50 ${rowBg ?? ""}`}
    >
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium leading-snug ${
            isDone ? "text-gray-400 line-through" : "text-gray-800"
          }`}
        >
          {item.label}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
          <span>{item.sub}</span>
          {item.dueTime && (
            <span className="inline-flex items-center gap-1 text-gray-400">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              {item.dueTime}
            </span>
          )}
          {item.assignee && (
            <span className="inline-flex items-center gap-1 text-indigo-500">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
              {item.assignee}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-none items-center gap-2">
        <div className="opacity-0 transition-opacity group-hover:opacity-100">
          <QuickActions
            item={item}
            onMarkDone={onMarkDone}
            onAssign={onAssign}
            onOpenRecord={onOpenRecord}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <PriorityPill priority={item.priority} />
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${badge}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>
    </li>
  );
}

function SectionHeader({ kind }: { kind: ItemKind }) {
  const { label, icon, color, bg } = KIND_CONFIG[kind];
  return (
    <li className="px-1 pb-1 pt-5 first:pt-2">
      <div className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${bg}`}>
        <span className={`text-xs leading-none ${color}`} aria-hidden="true">
          {icon}
        </span>
        <span className={`text-xs font-semibold uppercase tracking-wider ${color}`}>
          {label}
        </span>
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 ring-4 ring-green-50/50">
        <svg
          className="h-7 w-7 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p className="text-sm font-semibold text-gray-700">Wszystko gotowe!</p>
      <p className="mt-1.5 max-w-[18rem] text-xs leading-relaxed text-gray-400">
        Brak zadań operacyjnych na dziś. Możesz zająć się zaplanowaniem kolejnych zleceń.
      </p>
    </div>
  );
}

// ── Legend ───────────────────────────────────────────────────────────────────

function PriorityLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-5 py-2.5">
      <span className="text-xs text-gray-400">Priorytet:</span>
      {(["high", "medium", "low"] as ItemPriority[]).map((p) => {
        const { label, dot, pill } = PRIORITY_CONFIG[p];
        return (
          <span
            key={p}
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${pill}`}
          >
            <span className={`h-1.5 w-1.5 flex-none rounded-full ${dot}`} aria-hidden="true" />
            {label}
          </span>
        );
      })}
    </div>
  );
}

// ── Record modal ─────────────────────────────────────────────────────────────

function RecordModal({
  item,
  onClose,
}: {
  item: TodayItem;
  onClose: () => void;
}) {
  const kind = KIND_CONFIG[item.kind];
  const status = STATUS_CONFIG[item.status];
  const priority = PRIORITY_CONFIG[item.priority];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className={`mb-1.5 text-xs font-semibold uppercase tracking-wider ${kind.color}`}>
              {kind.icon} {kind.label}
            </p>
            <h2 className="text-base font-semibold text-gray-900">{item.label}</h2>
            <p className="mt-1 text-sm text-gray-500">{item.sub}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Zamknij"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <dl className="divide-y divide-gray-100 text-sm">
          <div className="flex items-center justify-between py-2.5">
            <dt className="text-gray-500">Status</dt>
            <dd>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.badge}`}>
                {status.label}
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <dt className="text-gray-500">Priorytet</dt>
            <dd>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${priority.pill}`}
              >
                <span className={`h-1.5 w-1.5 flex-none rounded-full ${priority.dot}`} aria-hidden="true" />
                {priority.label}
              </span>
            </dd>
          </div>
          {item.dueTime && (
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-gray-500">Termin</dt>
              <dd className="font-medium text-gray-800">{item.dueTime}</dd>
            </div>
          )}
          {item.assignee && (
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-gray-500">Przypisano</dt>
              <dd className="font-medium text-indigo-600">{item.assignee}</dd>
            </div>
          )}
        </dl>

        <p className="mt-5 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-400">
          ID rekordu: {item.id} · Widok szczegółowy dostępny po integracji z backendem.
        </p>
      </div>
    </div>
  );
}

// ── Filters ──────────────────────────────────────────────────────────────────

type Filters = {
  priority: ItemPriority | "all";
  assignee: string | "all";
  kind: ItemKind | "all";
};

const FILTERS_DEFAULT: Filters = { priority: "all", assignee: "all", kind: "all" };

function FilterBar({
  filters,
  onChange,
  assignees,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  assignees: string[];
}) {
  const active =
    filters.priority !== "all" || filters.assignee !== "all" || filters.kind !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50/60 px-5 py-2.5">
      <select
        value={filters.priority}
        onChange={(e) =>
          onChange({ ...filters, priority: e.target.value as Filters["priority"] })
        }
        className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-0"
        aria-label="Filtruj po priorytecie"
      >
        <option value="all">Priorytet: wszystkie</option>
        <option value="high">Wysoki</option>
        <option value="medium">Średni</option>
        <option value="low">Niski</option>
      </select>

      <select
        value={filters.assignee}
        onChange={(e) => onChange({ ...filters, assignee: e.target.value })}
        className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-0"
        aria-label="Filtruj po opiekunie"
      >
        <option value="all">Opiekun: wszyscy</option>
        <option value="__unassigned__">Nieprzypisane</option>
        {assignees.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <select
        value={filters.kind}
        onChange={(e) =>
          onChange({ ...filters, kind: e.target.value as Filters["kind"] })
        }
        className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 shadow-sm transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-0"
        aria-label="Filtruj po typie zadania"
      >
        <option value="all">Typ: wszystkie</option>
        {KIND_ORDER.map((k) => (
          <option key={k} value={k}>
            {KIND_CONFIG[k].label}
          </option>
        ))}
      </select>

      {active && (
        <button
          type="button"
          onClick={() => onChange(FILTERS_DEFAULT)}
          className="ml-auto rounded-md px-2.5 py-1 text-xs text-gray-400 transition-colors hover:bg-white hover:text-gray-700"
        >
          Wyczyść filtry
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TodayTasksCard() {
  const [items, setItems] = useState<TodayItem[]>([]);

  useEffect(() => {
    getTodayItems().then(setItems);
  }, []);

  const [openRecord, setOpenRecord] = useState<TodayItem | null>(null);
  const [filters, setFilters] = useState<Filters>(FILTERS_DEFAULT);

  const pending = items.filter((i) => i.status !== "done").length;
  const total = items.length;

  const handleMarkDone = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "done" } : item))
    );
  };

  const handleAssign = (id: string, _userId: string, userName: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, assignee: userName } : item))
    );
  };

  const assigneeOptions = Array.from(
    new Set(items.flatMap((i) => (i.assignee ? [i.assignee] : [])))
  ).sort();

  const visibleItems = items.filter((i) => {
    if (filters.priority !== "all" && i.priority !== filters.priority) return false;
    if (filters.assignee === "__unassigned__" && i.assignee) return false;
    if (
      filters.assignee !== "all" &&
      filters.assignee !== "__unassigned__" &&
      i.assignee !== filters.assignee
    )
      return false;
    if (filters.kind !== "all" && i.kind !== filters.kind) return false;
    return true;
  });

  function sortKey(i: TodayItem): number {
    if (i.status === "blocked") return 0;
    if (i.status === "overdue") return 1;
    if (i.priority === "high") return 2;
    return 3;
  }

  const grouped = KIND_ORDER.reduce<Record<ItemKind, TodayItem[]>>(
    (acc, kind) => {
      acc[kind] = visibleItems
        .filter((i) => i.kind === kind)
        .sort((a, b) => sortKey(a) - sortKey(b));
      return acc;
    },
    {} as Record<ItemKind, TodayItem[]>
  );

  const filtersActive =
    filters.priority !== "all" || filters.assignee !== "all" || filters.kind !== "all";

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Do zrobienia dziś</CardTitle>
          {total > 0 && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {pending} z {total}
            </span>
          )}
        </CardHeader>

        <FilterBar filters={filters} onChange={setFilters} assignees={assigneeOptions} />

        <CardBody className="px-3 py-0">
          {visibleItems.length === 0 ? (
            filtersActive ? (
              <div className="flex flex-col items-center py-10 text-center">
                <p className="text-sm text-gray-500">Brak zadań pasujących do filtrów.</p>
                <button
                  type="button"
                  onClick={() => setFilters(FILTERS_DEFAULT)}
                  className="mt-2 rounded px-2 py-1 text-xs text-indigo-500 transition-colors hover:bg-indigo-50 hover:underline"
                >
                  Wyczyść filtry
                </button>
              </div>
            ) : (
              <EmptyState />
            )
          ) : (
            <ul className="pb-3">
              {KIND_ORDER.map((kind) => {
                const group = grouped[kind];
                if (group.length === 0) return null;
                return (
                  <Fragment key={kind}>
                    <SectionHeader kind={kind} />
                    {group.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        onMarkDone={handleMarkDone}
                        onAssign={handleAssign}
                        onOpenRecord={setOpenRecord}
                      />
                    ))}
                  </Fragment>
                );
              })}
            </ul>
          )}
        </CardBody>

        {items.length > 0 && <PriorityLegend />}
      </Card>

      {openRecord && (
        <RecordModal item={openRecord} onClose={() => setOpenRecord(null)} />
      )}
    </>
  );
}
