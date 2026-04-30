"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  formatPLN,
  grossAmount,
  vatAmount,
  formatDatePL,
  isOverdue,
  clientById,
  stagesByOrder,
  tasksByStage,
  activeStage as findActiveStage,
} from "@/lib/data/crm";
import type { Client, Order, OrderStage, OrderStatus, OrderTask } from "@/types/crm";
import { useClientsStore } from "@/store/clients-store";

type Props = {
  orders: Order[];
  stages: OrderStage[];
  tasks: OrderTask[];
};

const ALL_STATUSES: (OrderStatus | "Wszystkie")[] = [
  "Wszystkie",
  "Nowe",
  "W realizacji",
  "Zakończone",
  "Anulowane",
];

export function OrdersScreen({ orders, stages, tasks }: Props) {
  const clients = useClientsStore((s) => s.clients);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "Wszystkie">("Wszystkie");
  const [activeId, setActiveId] = useState<string | null>(orders[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      const matchStatus = statusFilter === "Wszystkie" || o.status === statusFilter;
      const client = clientById(clients, o.clientId);
      const matchSearch =
        !q ||
        o.title.toLowerCase().includes(q) ||
        o.number.toLowerCase().includes(q) ||
        client?.name.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [orders, clients, search, statusFilter]);

  const activeOrder = orders.find((o) => o.id === activeId) ?? null;
  const activeClient = activeOrder ? clientById(clients, activeOrder.clientId) : undefined;
  const activeStages = activeOrder ? stagesByOrder(stages, activeOrder.id) : [];
  const currentActiveStage = findActiveStage(activeStages);
  const activeStageTasks = currentActiveStage ? tasksByStage(tasks, currentActiveStage.id) : [];

  return (
    <div className="flex h-full min-h-0 bg-slate-50">
      {/* ── Left panel ── */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
        {/* Header */}
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-[15px] font-semibold tracking-tight text-slate-800">Zlecenia</h1>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-slate-400">
            {orders.length} rekordów
          </p>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Szukaj zlecenia…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[13px] text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-1 px-4 pb-3">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                statusFilter === s
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mx-4 border-t border-slate-100" />

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-12 text-center">
              <span className="text-2xl">📋</span>
              <p className="text-[13px] font-medium text-slate-500">Brak wyników</p>
            </div>
          ) : (
            <ul className="space-y-0.5 px-2">
              {filtered.map((order) => (
                <OrderListRow
                  key={order.id}
                  order={order}
                  client={clientById(clients, order.clientId)}
                  isActive={order.id === activeId}
                  onClick={() => setActiveId(order.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* ── Right panel ── */}
      <main className="flex-1 overflow-y-auto">
        {activeOrder ? (
          <OrderDetail
            order={activeOrder}
            client={activeClient}
            stages={activeStages}
            activeStage={currentActiveStage}
            activeStageTasks={activeStageTasks}
          />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}

// ─── List row ─────────────────────────────────────────────────────────────────

function OrderListRow({
  order,
  client,
  isActive,
  onClick,
}: {
  order: Order;
  client: Client | undefined;
  isActive: boolean;
  onClick: () => void;
}) {
  const overdue = isOverdue(order);

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group w-full rounded-xl px-3 py-2.5 text-left transition-all duration-150",
          isActive
            ? "bg-indigo-50 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.25)]"
            : "hover:bg-slate-50"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={cn("font-mono text-[10px]", isActive ? "text-indigo-400" : "text-slate-400")}>
                {order.number}
              </span>
              <OrderStatusPill status={order.status} />
            </div>
            <p className={cn("truncate text-[13px] font-semibold leading-tight", isActive ? "text-indigo-700" : "text-slate-700")}>
              {order.title}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">{client?.name ?? "—"}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[12px] font-semibold text-slate-600 tabular-nums">
              {formatPLN(grossAmount(order))}
            </p>
            {order.clientDeadline && (
              <p className={cn("text-[10px] tabular-nums", overdue ? "font-semibold text-red-500" : "text-slate-400")}>
                {overdue && "⚠ "}
                {formatDatePL(order.clientDeadline)}
              </p>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function OrderDetail({
  order,
  client,
  stages,
  activeStage,
  activeStageTasks,
}: {
  order: Order;
  client: Client | undefined;
  stages: OrderStage[];
  activeStage: OrderStage | undefined;
  activeStageTasks: OrderTask[];
}) {
  const overdue = isOverdue(order);
  const completedStages = stages.filter((s) => s.status === "Zakończony").length;
  const totalStages = stages.length;
  const progressPct = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-[11px] font-medium text-slate-400">{order.number}</span>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">{order.title}</h2>
          {order.description && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{order.description}</p>
          )}
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Dates + financials */}
      <div className="grid grid-cols-2 gap-4">
        <Section title="Terminy">
          <div className="space-y-2.5">
            <MetaRow label="Termin klienta" value={order.clientDeadline ? formatDatePL(order.clientDeadline) : "—"} highlight={overdue ? "red" : undefined} />
            <MetaRow label="Termin planowany" value={order.plannedDeadline ? formatDatePL(order.plannedDeadline) : "—"} />
          </div>
        </Section>
        <Section title="Wycena">
          <div className="space-y-2.5">
            <MetaRow label="Netto" value={formatPLN(order.netAmount)} />
            <MetaRow label={`VAT ${order.vatRate}%`} value={formatPLN(vatAmount(order))} />
            <MetaRow label="Brutto" value={formatPLN(grossAmount(order))} bold />
          </div>
        </Section>
      </div>

      {/* Client */}
      {client && (
        <Section title="Klient">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-600 select-none">
              {initials(client.name)}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-800">{client.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {client.contactPerson && (
                  <p className="text-[11px] text-slate-400">{client.contactPerson}</p>
                )}
                <ClientStatusPill status={client.status} />
              </div>
              {client.email && (
                <a href={`mailto:${client.email}`} className="text-[12px] text-indigo-600 hover:underline">
                  {client.email}
                </a>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* Stages */}
      {stages.length > 0 && (
        <Section
          title="Etapy realizacji"
          action={
            <span className="text-[11px] text-slate-400 tabular-nums">
              {completedStages}/{totalStages} · {progressPct}%
            </span>
          }
        >
          {/* Progress bar */}
          <div className="mb-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-400 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="space-y-1">
            {stages.map((stage, idx) => (
              <StageRow key={stage.id} stage={stage} position={idx + 1} />
            ))}
          </div>
        </Section>
      )}

      {/* Active stage tasks */}
      {activeStage && activeStageTasks.length > 0 && (
        <Section title={`Zadania — ${activeStage.name}`}>
          <div className="space-y-1">
            {activeStageTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function StageRow({ stage, position }: { stage: OrderStage; position: number }) {
  const isCompleted = stage.status === "Zakończony";
  const isActive = stage.status === "Aktywny";

  return (
    <div className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors", isActive ? "bg-indigo-50" : "hover:bg-slate-50")}>
      {/* Icon */}
      {isCompleted ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : isActive ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white text-[9px] font-bold">
          {position}
        </span>
      ) : (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 text-[9px] text-slate-400 font-medium">
          {position}
        </span>
      )}

      {/* Name */}
      <p className={cn("flex-1 text-[13px] font-medium", isCompleted ? "text-slate-400 line-through" : isActive ? "text-indigo-700" : "text-slate-600")}>
        {stage.name}
      </p>

      {/* Progress */}
      {stage.totalTasks > 0 && (
        <span className={cn("text-[11px] tabular-nums", isActive ? "text-indigo-500" : "text-slate-400")}>
          {stage.completedTasks}/{stage.totalTasks}
        </span>
      )}

      {/* Status label */}
      <span className={cn("text-[11px] font-medium shrink-0", isCompleted ? "text-emerald-600" : isActive ? "text-indigo-600" : "text-slate-400")}>
        {stage.status}
      </span>
    </div>
  );
}

function TaskRow({ task }: { task: OrderTask }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50 transition-colors">
      {task.done ? (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-emerald-500 text-white">
          <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : (
        <span className="h-4 w-4 shrink-0 rounded border-2 border-slate-200 bg-white" />
      )}
      <p className={cn("flex-1 text-[13px]", task.done ? "text-slate-400 line-through" : "text-slate-700")}>
        {task.title}
        {task.required && !task.done && (
          <span className="ml-1.5 text-[10px] font-medium text-amber-500">wymagane</span>
        )}
      </p>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 8h10M7 12h7M7 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-[13px] font-medium text-slate-500">Wybierz zlecenie z listy</p>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <h3 className="text-[13px] font-semibold text-slate-700">{title}</h3>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ─── Meta row ─────────────────────────────────────────────────────────────────

function MetaRow({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: "red" }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[12px] text-slate-400">{label}</span>
      <span className={cn("text-[13px] tabular-nums", bold ? "font-semibold text-slate-800" : "text-slate-600", highlight === "red" && "font-semibold text-red-600")}>
        {value}
      </span>
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const orderStatusConfig: Record<OrderStatus, string> = {
  Nowe: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  "W realizacji": "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60",
  Zakończone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  Anulowane: "bg-slate-100 text-slate-500 ring-1 ring-slate-200/60",
};

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[12px] font-medium", orderStatusConfig[status])}>
      {status}
    </span>
  );
}

function OrderStatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", orderStatusConfig[status])}>
      {status}
    </span>
  );
}

const clientStatusConfig = {
  Aktywny: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70",
  Lead: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/70",
  Nieaktywny: "bg-slate-100 text-slate-500 ring-1 ring-slate-200/70",
} as const;

function ClientStatusPill({ status }: { status: keyof typeof clientStatusConfig }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", clientStatusConfig[status])}>
      {status}
    </span>
  );
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
