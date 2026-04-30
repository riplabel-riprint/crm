"use client";

import { useState, useEffect, useRef } from "react";
import type { DashboardData } from "@/lib/data/crm";
import { formatPLN, formatDatePL, grossAmount, isOverdue } from "@/lib/data/crm";
import type { Order, Client } from "@/types/crm";
import { cn } from "@/lib/utils";
import { TodoSection } from "./TodoSection";
import { StatCardGrid } from "./StatCardGrid";
import { ChevronDown, Send } from "lucide-react";
import Link from "next/link";

type Props = DashboardData & { clients: Client[]; orders: Order[] };

const USER_NAME = "Jan Kowalski";
const PANEL_ORDER_KEY = "dashboard-panel-order";
type PanelId = "orders" | "todo";
const DEFAULT_PANELS: PanelId[] = ["orders", "todo"];

function loadPanelOrder(): PanelId[] {
  try {
    const raw = localStorage.getItem(PANEL_ORDER_KEY);
    if (raw) {
      const parsed: PanelId[] = JSON.parse(raw);
      if (parsed.length === 2 && parsed.includes("orders") && parsed.includes("todo")) {
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_PANELS;
}

export function DashboardScreen({
  stats, recentOrders, clientsByStatus, ordersByStatus, clients, orders,
}: Props) {
  const [panels, setPanels] = useState<PanelId[]>(DEFAULT_PANELS);
  const dragIndex = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<PanelId | null>(null);
  const [overId, setOverId] = useState<PanelId | null>(null);

  useEffect(() => {
    setPanels(loadPanelOrder());
  }, []);

  function savePanelOrder(order: PanelId[]) {
    try { localStorage.setItem(PANEL_ORDER_KEY, JSON.stringify(order)); } catch { /* ignore */ }
  }

  function handleDragStart(index: number, id: PanelId) {
    dragIndex.current = index;
    setDraggingId(id);
  }

  function handleDragOver(e: React.DragEvent, index: number, id: PanelId) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;
    setOverId(id);
    const from = dragIndex.current;
    dragIndex.current = index;
    setPanels((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
  }

  function handleDrop() {
    savePanelOrder(panels);
    dragIndex.current = null;
    setDraggingId(null);
    setOverId(null);
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDraggingId(null);
    setOverId(null);
  }

  return (
    <div className="text-white">
      <div className="overflow-auto">
        <div className="px-7 py-6 space-y-6 w-full">

          {/* ── Greeting + actions ── */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[1.25rem] font-bold !text-white">
                Dzień dobry, {USER_NAME}! 👋
              </h2>
              <p className="mt-0.5 text-[13px] !text-white/40">
                Witaj ponownie na swoim panelu operacyjnym
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-[12px] text-white/70 hover:bg-white/[0.08] transition-colors">
                <span>📅</span>
                <span>10 kwi – 23 kwi 2026</span>
                <ChevronDown size={13} />
              </button>
              <button className="flex items-center gap-2 rounded-xl bg-[#fe4e00] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#e44500] transition-colors">
                <Send size={13} />
                Nowe zlecenie
              </button>
            </div>
          </div>

          {/* ── Stat cards (draggable) ── */}
          <StatCardGrid stats={stats} />

          {/* ── Main content (draggable panels) ── */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
            {panels.map((id, index) => {
              const isDragging = draggingId === id;
              const isOver = overId === id && !isDragging;
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => handleDragStart(index, id)}
                  onDragOver={(e) => handleDragOver(e, index, id)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "lg:col-span-2 group/panel relative cursor-grab active:cursor-grabbing select-none",
                    "rounded-2xl transition-all duration-200",
                    isDragging && "opacity-40 scale-[0.98]",
                    isOver && "ring-1 ring-white/20",
                  )}
                >
                  {/* drag hint dots */}
                  <div className="absolute right-4 top-4 z-10 flex flex-col gap-[3px] opacity-0 group-hover/panel:opacity-100 transition-opacity duration-150 pointer-events-none">
                    {[0, 1, 2].map((row) => (
                      <div key={row} className="flex gap-[3px]">
                        {[0, 1].map((col) => (
                          <span key={col} className="h-[3px] w-[3px] rounded-full bg-white/30" />
                        ))}
                      </div>
                    ))}
                  </div>

                  {id === "orders" && <RecentOrdersTable recentOrders={recentOrders} />}
                  {id === "todo" && <TodoSection />}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Recent orders table ──────────────────────────────────────────────────────

const orderStatusStyles: Record<string, string> = {
  Nowe:          "bg-[#fe4e00]/15 !text-[#fe4e00] ring-1 ring-[#fe4e00]/30",
  "W realizacji":"bg-indigo-500/20 !text-indigo-300 ring-1 ring-indigo-400/30",
  Zakończone:    "bg-emerald-500/20 !text-emerald-300 ring-1 ring-emerald-400/30",
  Anulowane:     "bg-white/[0.06] !text-zinc-400 ring-1 ring-white/10",
};

function RecentOrdersTable({
  recentOrders,
}: {
  recentOrders: (Order & { clientName: string })[];
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#141414] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <h3 className="!text-white text-[13px] font-semibold">Ostatnie zlecenia</h3>
        <span className="text-[11px] text-white/30">{recentOrders.length} pozycji</span>
      </div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-white/[0.05]">
            {["Numer", "Tytuł / Klient", "Status", "Brutto", "Termin"].map((col, i) => (
              <th
                key={col}
                className={cn(
                  "px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/30",
                  i >= 3 ? "text-right" : "text-left"
                )}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {recentOrders.map((order) => {
            const overdue = isOverdue(order);
            return (
              <tr key={order.id} className="group hover:bg-white/[0.03] transition-colors">
                <td className="px-5 py-3">
                  <Link href={`/orders/${order.id}`} className="font-mono text-[11px] font-medium text-white/30 hover:text-white/70 transition-colors">
                    {order.number}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <Link href={`/orders/${order.id}`} className="block group/link">
                    <p className="font-medium !text-white truncate max-w-[180px] group-hover/link:text-[#fe4e00] transition-colors">{order.title}</p>
                    <p className="text-[11px] !text-white/40">{order.clientName}</p>
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium", orderStatusStyles[order.status])}>
                    {order.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-medium !text-white tabular-nums">
                  {formatPLN(grossAmount(order))}
                </td>
                <td className={cn(
                  "px-5 py-3 text-right tabular-nums text-[12px]",
                  overdue ? "font-semibold !text-red-400" : "!text-white/40"
                )}>
                  {order.clientDeadline ? formatDatePL(order.clientDeadline) : "—"}
                  {overdue && <span className="ml-1">⚠</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Status breakdown widget ──────────────────────────────────────────────────

type BreakdownColor = "emerald" | "amber" | "slate" | "indigo" | "blue" | "orange";

const barColor: Record<BreakdownColor, string> = {
  emerald: "bg-emerald-400",
  amber:   "bg-amber-400",
  slate:   "bg-slate-400",
  indigo:  "bg-indigo-400",
  blue:    "bg-blue-400",
  orange:  "bg-[#fe4e00]",
};

const dotColor: Record<BreakdownColor, string> = {
  emerald: "bg-emerald-400",
  amber:   "bg-amber-400",
  slate:   "bg-slate-400",
  indigo:  "bg-indigo-400",
  blue:    "bg-blue-400",
  orange:  "bg-[#fe4e00]",
};

function StatusBreakdown({
  title, total, rows,
}: {
  title: string;
  total: number;
  rows: { label: string; count: number; color: BreakdownColor }[];
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#141414] p-5">
      <h3 className="text-[13px] font-semibold !text-white mb-4">{title}</h3>
      <div className="space-y-4">
        {rows.map((row) => {
          const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
          return (
            <div key={row.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full shrink-0", dotColor[row.color])} />
                  <span className="text-[13px] text-white/70">{row.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold text-white tabular-nums">{row.count}</span>
                  <span className="text-[11px] text-white/30 tabular-nums">{pct}%</span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", barColor[row.color])}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
