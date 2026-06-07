"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  formatPLN,
  grossAmount,
  formatDatePL,
  isOverdue,
  clientById,
  stagesByOrder,
} from "@/lib/data/crm";
import type { Client, Order, OrderStage, OrderStatus, OrderTask } from "@/types/crm";
import { useClientsStore } from "@/store/clients-store";
import { useOrdersStore } from "@/store/orders-store";
import type { OrderDetail } from "@/lib/data/orders";
import Link from "next/link";

type Props = {
  seedOrders: Order[];
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

const DOMAIN_TO_CRM_STATUS: Record<string, OrderStatus> = {
  draft: "Nowe",
  quote_sent: "Nowe",
  quote_accepted: "Nowe",
  in_production: "W realizacji",
  ready_for_pickup: "W realizacji",
  delivered: "Zakończone",
  invoiced: "Zakończone",
  completed: "Zakończone",
  cancelled: "Anulowane",
};

function toCrmOrder(detail: OrderDetail): Order {
  const rev = detail.activeRevision;
  return {
    id: detail.id,
    number: detail.orderNumber,
    title: detail.title,
    description: detail.description,
    clientId: detail.clientId,
    status: DOMAIN_TO_CRM_STATUS[detail.status] ?? "Nowe",
    priority: detail.priority === "high" || detail.priority === "urgent" ? "high" : "normal",
    netAmount: rev ? rev.subtotal.amount / 100 : 0,
    vatRate: rev ? rev.vatRate : 23,
    clientDeadline: detail.requestedDeadline ?? null,
    plannedDeadline: detail.estimatedDeadline ?? null,
  };
}

export function OrdersScreen({ seedOrders, stages: initialStages }: Props) {
  const clients = useClientsStore((s) => s.clients);
  const storeOrders = useOrdersStore((s) => s.orders);
  const deletedSeedIds = useOrdersStore((s) => s.deletedSeedIds);
  const deleteOrder = useOrdersStore((s) => s.deleteOrder);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "Wszystkie">("Wszystkie");
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Derive CRM display stages from store orders (reactive — updates when store changes)
  const stages: OrderStage[] = useMemo(() => {
    const storeOrderIds = new Set(storeOrders.map((o) => o.id));
    const storeStages = storeOrders.flatMap((o) =>
      ((o as any).stages ?? []).map((s: any) => ({
        id: s.id,
        orderId: o.id,
        name: s.name,
        status: s.status === "completed" ? "Zakończony" : s.status === "active" ? "Aktywny" : "Oczekuje",
        completedTasks: (s.tasks ?? []).filter((t: any) => t.status === "done").length,
        totalTasks: (s.tasks ?? []).length,
      } as OrderStage))
    );
    const seedFiltered = initialStages.filter((s) => !storeOrderIds.has(s.orderId));
    return [...storeStages, ...seedFiltered];
  }, [storeOrders, initialStages]);

  const orders: Order[] = useMemo(() => {
    const storeConverted = storeOrders.map(toCrmOrder);
    const storeIds = new Set(storeConverted.map((o) => o.id));
    const deletedSet = new Set(deletedSeedIds);
    const dedupedSeed = seedOrders.filter((o) => !storeIds.has(o.id) && !deletedSet.has(o.id));
    return [...storeConverted, ...dedupedSeed];
  }, [storeOrders, seedOrders, deletedSeedIds]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { Wszystkie: orders.length };
    for (const s of ["Nowe", "W realizacji", "Zakończone", "Anulowane"] as OrderStatus[]) {
      c[s] = orders.filter((o) => o.status === s).length;
    }
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      const matchStatus = statusFilter === "Wszystkie" || o.status === statusFilter;
      const client = clientById(clients, o.clientId);
      const matchSearch =
        !q ||
        o.title.toLowerCase().includes(q) ||
        o.number.toLowerCase().includes(q) ||
        (client?.name ?? "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [orders, clients, search, statusFilter]);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + grossAmount(o), 0),
    [orders]
  );

  const setActiveStage = useOrdersStore((s) => s.setActiveStage);

  function handleStageChange(orderId: string, targetStageId: string) {
    setActiveStage(orderId, targetStageId);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteOrder(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="min-h-full" style={{ background: "#0f0f0f", color: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* ── Header ── */}
      <div className="px-4 sm:px-8" style={{ paddingTop: "24px", borderBottom: "1px solid #1e1e1e" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", margin: 0 }}>
              Zlecenia
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#555" }}>
              {orders.length === 0 ? "Brak zleceń" : `${orders.length} ${orders.length === 1 ? "zlecenie" : orders.length < 5 ? "zlecenia" : "zleceń"} łącznie`}
            </p>
          </div>
          <Link
            href="/orders/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#ff6b35",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              padding: "10px 18px",
              borderRadius: "8px",
              textDecoration: "none",
              transition: "all 0.2s ease",
              boxShadow: "0 0 0 0 rgba(255,107,53,0)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#ff5520";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(255,107,53,0.35)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#ff6b35";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 0 rgba(255,107,53,0)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Nowe zlecenie
          </Link>
        </div>

        {/* Search */}
        <SearchInput value={search} onChange={setSearch} />

        {/* Filter chips */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "16px", paddingBottom: "16px" }}>
          {ALL_STATUSES.map((s) => (
            <FilterChip
              key={s}
              label={s}
              count={counts[s] ?? 0}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
            />
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "28px 32px 48px" }}>
        {orders.length === 0 ? (
          <EmptyState mounted={mounted} />
        ) : (
          <div style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.4s ease" }}>
            {/* Stats */}
            <StatsGrid orders={orders} totalRevenue={totalRevenue} />

            {/* Table */}
            <div style={{ marginTop: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#fff", margin: 0 }}>
                  {statusFilter === "Wszystkie" ? "Wszystkie zlecenia" : statusFilter}
                  {search && ` — wyniki dla "${search}"`}
                </h2>
                <span style={{ fontSize: "12px", color: "#555" }}>{filtered.length} wyników</span>
              </div>

              {filtered.length === 0 ? (
                <NoResults onClear={() => { setSearch(""); setStatusFilter("Wszystkie"); }} />
              ) : (
                <OrdersTable
                  orders={filtered}
                  clients={clients}
                  stages={stages}
                  onDeleteRequest={setDeleteTarget}
                  onStageChange={handleStageChange}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <DeleteModal
          order={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Search ───────────────────────────────────────────────────────────────────

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <svg
        style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#555" }}
        width="15" height="15" viewBox="0 0 15 15" fill="none"
      >
        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        placeholder="Szukaj zlecenia..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: "#1a1a1a",
          border: `1px solid ${focused ? "#ff6b35" : "#2a2a2a"}`,
          borderRadius: "8px",
          padding: "10px 12px 10px 42px",
          fontSize: "13px",
          color: "#fff",
          outline: "none",
          boxShadow: focused ? "0 0 0 2px rgba(255,107,53,0.15)" : "none",
          transition: "all 0.2s ease",
          boxSizing: "border-box",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: "16px",
            lineHeight: 1, padding: "2px",
          }}
        >×</button>
      )}
    </div>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 12px",
        borderRadius: "20px",
        border: `1px solid ${active ? "#ff6b35" : hovered ? "#ff6b35" : "#2a2a2a"}`,
        background: active ? "#ff6b35" : "transparent",
        color: active ? "#fff" : hovered ? "#e0e0e0" : "#b0b0b0",
        fontSize: "12px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {label}
      <span style={{
        background: active ? "rgba(0,0,0,0.2)" : "#252525",
        color: active ? "#fff" : "#666",
        borderRadius: "10px",
        padding: "0 6px",
        fontSize: "11px",
        minWidth: "18px",
        textAlign: "center",
      }}>
        {count}
      </span>
    </button>
  );
}

// ─── Stats cards ──────────────────────────────────────────────────────────────

function StatsGrid({ orders, totalRevenue }: { orders: Order[]; totalRevenue: number }) {
  const inProgress = orders.filter((o) => o.status === "W realizacji").length;
  const completed = orders.filter((o) => o.status === "Zakończone").length;
  const pct = orders.length > 0 ? Math.round((completed / orders.length) * 100) : 0;

  const stats = [
    { label: "Łącznie zleceń", value: String(orders.length), sub: "Wszystkie statusy", color: "#fff" },
    { label: "W realizacji", value: String(inProgress), sub: "Aktywne projekty", color: "#3b82f6" },
    { label: "Zakończone", value: String(completed), sub: `${pct}% ukończonych`, color: "#4ade80" },
    { label: "Przychód brutto", value: formatPLN(totalRevenue), sub: "Łącznie ze zleceń", color: "#ff6b35" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            background: "#1a1a1a",
            border: "1px solid #252525",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <p style={{ fontSize: "11px", fontWeight: 500, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
            {s.label}
          </p>
          <p style={{ fontSize: "22px", fontWeight: 700, color: s.color, margin: "0 0 4px", letterSpacing: "-0.5px" }}>
            {s.value}
          </p>
          <p style={{ fontSize: "11px", color: "#555", margin: 0 }}>{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Orders table ─────────────────────────────────────────────────────────────

function OrdersTable({
  orders,
  clients,
  stages,
  onDeleteRequest,
  onStageChange,
}: {
  orders: Order[];
  clients: Client[];
  stages: OrderStage[];
  onDeleteRequest: (o: Order) => void;
  onStageChange: (orderId: string, stageId: string) => void;
}) {
  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #252525", borderRadius: "8px", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#212121" }}>
              {["#", "Zlecenie", "Etap realizacji", "Klient", "Status", "Brutto", "Termin"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "11px 16px",
                    textAlign: "left",
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "#555",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: "1px solid #2a2a2a",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
              <th style={{ padding: "11px 16px", borderBottom: "1px solid #2a2a2a", width: "40px" }} />
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              <OrderRow
                key={order.id}
                order={order}
                client={clientById(clients, order.clientId)}
                stages={stagesByOrder(stages, order.id)}
                isLast={idx === orders.length - 1}
                onDeleteRequest={() => onDeleteRequest(order)}
                onStageChange={(stageId) => onStageChange(order.id, stageId)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderRow({
  order,
  client,
  stages,
  isLast,
  onDeleteRequest,
  onStageChange,
}: {
  order: Order;
  client: Client | undefined;
  stages: OrderStage[];
  isLast: boolean;
  onDeleteRequest: () => void;
  onStageChange: (stageId: string) => void;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const overdue = isOverdue(order);

  const navigate = () => router.push(`/orders/${order.id}`);

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={navigate}
      style={{
        borderBottom: isLast ? "none" : "1px solid #222",
        background: hovered ? "#1e1e1e" : "transparent",
        cursor: "pointer",
        transition: "background 0.15s ease",
      }}
    >
      <td style={{ padding: "12px 16px", color: "#444", fontFamily: "monospace", fontSize: "11px", whiteSpace: "nowrap" }}>
        {order.number}
      </td>
      <td style={{ padding: "12px 16px", maxWidth: "220px" }}>
        <p style={{ margin: 0, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {order.title}
        </p>
      </td>
      <td
        style={{ padding: "10px 16px", minWidth: "200px", maxWidth: "260px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <StagePipeline stages={stages} onStageChange={onStageChange} />
      </td>
      <td style={{ padding: "12px 16px", color: "#888", whiteSpace: "nowrap" }}>
        {client?.name ?? "—"}
      </td>
      <td style={{ padding: "12px 16px" }}>
        <StatusBadge status={order.status} />
      </td>
      <td style={{ padding: "12px 16px", color: "#fff", fontWeight: 600, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
        {formatPLN(grossAmount(order))}
      </td>
      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
        {order.clientDeadline ? (
          <span style={{ color: overdue ? "#ff5555" : "#666", fontSize: "12px", fontWeight: overdue ? 600 : 400 }}>
            {overdue && "⚠ "}{formatDatePL(order.clientDeadline)}
          </span>
        ) : (
          <span style={{ color: "#333" }}>—</span>
        )}
      </td>
      <td
        style={{ padding: "12px 16px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onDeleteRequest}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: hovered ? "#ff5555" : "#333",
            padding: "4px",
            borderRadius: "4px",
            transition: "color 0.2s ease",
            display: "flex",
            alignItems: "center",
          }}
          title="Usuń"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1.5 3.5h11M4.5 3.5V2.5A1 1 0 015.5 1.5h3a1 1 0 011 1V3.5M5.5 6v4M8.5 6v4M2.5 3.5l.8 8.2a1 1 0 001 .8h5.4a1 1 0 001-.8l.8-8.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

// ─── Stage pipeline (inline in table row) ────────────────────────────────────

function StagePipeline({
  stages,
  onStageChange,
}: {
  stages: OrderStage[];
  onStageChange: (stageId: string) => void;
}) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  if (stages.length === 0) {
    return <span style={{ fontSize: "11px", color: "#333" }}>—</span>;
  }

  const activeIdx = stages.findIndex((s) => s.status === "Aktywny");
  const activeName = activeIdx >= 0 ? stages[activeIdx].name : null;
  const completedCount = stages.filter((s) => s.status === "Zakończony").length;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ display: "flex", flexDirection: "column", gap: "5px" }}
    >
      {/* Active stage label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
        <span style={{ fontSize: "11px", color: activeName ? "#ff6b35" : "#444", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>
          {activeName ?? "Brak etapu"}
        </span>
        <span style={{ fontSize: "10px", color: "#444", whiteSpace: "nowrap", flexShrink: 0 }}>
          {completedCount}/{stages.length}
        </span>
      </div>

      {/* Dots pipeline */}
      <div style={{ display: "flex", alignItems: "center", gap: "3px", position: "relative" }}>
        {stages.map((stage, idx) => {
          const isCompleted = stage.status === "Zakończony";
          const isActive = stage.status === "Aktywny";
          return (
            <React.Fragment key={stage.id}>
              <button
                type="button"
                title={stage.name}
                onMouseEnter={() => setTooltip(stage.id)}
                onMouseLeave={() => setTooltip(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onStageChange(stage.id);
                }}
                style={{
                  width: isActive ? "20px" : "10px",
                  height: "10px",
                  borderRadius: isActive ? "5px" : "50%",
                  background: isCompleted
                    ? "#4ade80"
                    : isActive
                    ? "#ff6b35"
                    : "#2a2a2a",
                  border: isActive ? "none" : isCompleted ? "none" : "1px solid #333",
                  cursor: "pointer",
                  padding: 0,
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                  outline: tooltip === stage.id && !isActive ? "1px solid #ff6b35" : "none",
                  outlineOffset: "1px",
                  position: "relative",
                }}
              />
              {idx < stages.length - 1 && (
                <div style={{
                  flex: 1,
                  height: "1px",
                  minWidth: "4px",
                  background: isCompleted ? "rgba(74,222,128,0.3)" : "#222",
                  transition: "background 0.3s",
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Tooltip label */}
      {tooltip && (
        <span style={{ fontSize: "10px", color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          → {stages.find((s) => s.id === tooltip)?.name}
        </span>
      )}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const statusStyles: Record<OrderStatus, { bg: string; color: string }> = {
  Nowe: { bg: "rgba(74,222,128,0.1)", color: "#4ade80" },
  "W realizacji": { bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
  Zakończone: { bg: "rgba(168,85,247,0.1)", color: "#a855f7" },
  Anulowane: { bg: "rgba(255,85,85,0.08)", color: "#666" },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const s = statusStyles[status];
  return (
    <span style={{
      display: "inline-block",
      background: s.bg,
      color: s.color,
      fontSize: "11px",
      fontWeight: 600,
      padding: "4px 10px",
      borderRadius: "4px",
      whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ mounted }: { mounted: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "460px",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px", opacity: 0.5, lineHeight: 1 }}>📋</div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.3px" }}>
          Brak zlecenia
        </h2>
        <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.6, margin: "0 0 32px" }}>
          Zacznij od utworzenia nowego zlecenia, aby zarządzać swoimi projektami i śledzić postępy.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
          <QuickAction icon="➕" label="Nowe zlecenie" href="/orders/new" />
          <QuickAction icon="❓" label="Pomoc" href="/settings" />
          <QuickAction icon="🔧" label="Ustawienia" href="/settings" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, href }: { icon: string; label: string; href: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        padding: "20px 16px",
        background: hovered ? "#1f1f1f" : "#1a1a1a",
        border: `1px solid ${hovered ? "#ff6b35" : "#252525"}`,
        borderRadius: "8px",
        cursor: "pointer",
        textDecoration: "none",
        transition: "all 0.2s ease",
        color: hovered ? "#e0e0e0" : "#b0b0b0",
      } as React.CSSProperties}
    >
      <span style={{ fontSize: "24px", lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: "12px", fontWeight: 500 }}>{label}</span>
    </Link>
  );
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 20px",
      background: "#1a1a1a",
      border: "1px solid #252525",
      borderRadius: "8px",
      textAlign: "center",
    }}>
      <span style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.4 }}>🔍</span>
      <p style={{ color: "#555", fontSize: "14px", margin: "0 0 16px" }}>Brak wyników dla podanych kryteriów</p>
      <button
        type="button"
        onClick={onClear}
        style={{
          background: "none",
          border: "1px solid #333",
          borderRadius: "6px",
          padding: "7px 14px",
          color: "#888",
          fontSize: "12px",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        Wyczyść filtry
      </button>
    </div>
  );
}

// ─── Delete modal ─────────────────────────────────────────────────────────────

function DeleteModal({ order, onConfirm, onCancel }: { order: Order; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        onClick={onCancel}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      />
      <div style={{
        position: "relative",
        width: "min(380px, calc(100vw - 32px))",
        background: "#141414",
        border: "1px solid #2a2a2a",
        borderRadius: "12px",
        padding: "24px",
        zIndex: 10,
      }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "10px",
          background: "rgba(255,85,85,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "16px",
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 6h14M8 6V4.5A1.5 1.5 0 019.5 3h1A1.5 1.5 0 0112 4.5V6M5 6l.9 10.1A1 1 0 006.9 17h6.2a1 1 0 001-.9L15 6" stroke="#ff5555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: "15px", fontWeight: 700, color: "#fff" }}>Usuń zlecenie</h3>
        <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#666", lineHeight: 1.5 }}>
          Czy na pewno chcesz usunąć zlecenie{" "}
          <span style={{ color: "#fff", fontWeight: 600 }}>{order.number}</span>?{" "}
          Tej operacji nie można cofnąć.
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1, padding: "9px 16px", borderRadius: "8px",
              border: "1px solid #2a2a2a", background: "none",
              color: "#888", fontSize: "13px", fontWeight: 500, cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#888"; }}
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1, padding: "9px 16px", borderRadius: "8px",
              border: "none", background: "#ff5555",
              color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#e04444"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#ff5555"; }}
          >
            Usuń zlecenie
          </button>
        </div>
      </div>
    </div>
  );
}

