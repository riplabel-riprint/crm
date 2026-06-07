"use client";

import { useState, useRef, useEffect } from "react";
import { useUserStore } from "@/store/user-store";
import { ResponsiveGridLayout, useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import type { DashboardData } from "@/lib/data/crm";
import { formatPLN, formatDatePL, grossAmount, isOverdue } from "@/lib/data/crm";
import type { Order, Client } from "@/types/crm";
import { cn } from "@/lib/utils";
import { TodoSection } from "./TodoSection";
import { GoalsPanel } from "./GoalsPanel";
import { Send, LayoutDashboard, RotateCcw, Check, AlertTriangle, Pencil, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useTodoTasks } from "@/lib/hooks/useTodoTasks";

type Props = DashboardData & { clients: Client[]; orders: Order[] };

type GridItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
};

// ── Layout config ─────────────────────────────────────────────────────────────

const LAYOUT_KEY = "dashboard-rgl-v5";
const ROW_H = 60;
const MARGIN: [number, number] = [14, 14];

const BREAKPOINTS = { xl: 1280, lg: 1024, md: 768, sm: 480, xs: 0 };
const COLS        = { xl: 4,    lg: 4,    md: 2,   sm: 2,   xs: 2 };

const TOP_H = 5;
const PANEL_H = 10;

function makeDefaultLayout(cols: number): GridItem[] {
  const half = Math.max(1, Math.floor(cols / 2));
  return [
    { i: "revenue",  x: 0,    y: 0,              w: half,        h: TOP_H,   minW: 1, minH: 4 },
    { i: "threats",  x: half, y: 0,              w: cols - half, h: TOP_H,   minW: 1, minH: 4 },
    { i: "orders",   x: 0,    y: TOP_H,          w: half,        h: PANEL_H, minW: 1, minH: 4 },
    { i: "todo",     x: half, y: TOP_H,          w: cols - half, h: PANEL_H, minW: 1, minH: 4 },
    { i: "goals",    x: 0,    y: TOP_H + PANEL_H,w: half,        h: PANEL_H, minW: 1, minH: 4 },
    { i: "monthly",  x: half, y: TOP_H + PANEL_H,w: cols - half, h: PANEL_H, minW: 1, minH: 4 },
  ];
}

type Layouts = Record<string, GridItem[]>;

function makeDefaultLayouts(): Layouts {
  const layouts = Object.fromEntries(
    Object.entries(COLS).map(([bp, cols]) => [bp, makeDefaultLayout(cols)])
  );
  // xs: full width stacked
  layouts.xs = [
    { i: "revenue",  x: 0, y: 0,                  w: 2, h: TOP_H,   minW: 1, minH: 4 },
    { i: "threats",  x: 0, y: TOP_H,              w: 2, h: TOP_H,   minW: 1, minH: 4 },
    { i: "orders",   x: 0, y: TOP_H * 2,          w: 2, h: PANEL_H, minW: 1, minH: 4 },
    { i: "todo",     x: 0, y: TOP_H * 2 + PANEL_H,w: 2, h: PANEL_H, minW: 1, minH: 4 },
    { i: "goals",    x: 0, y: TOP_H * 2 + PANEL_H * 2, w: 2, h: PANEL_H, minW: 1, minH: 4 },
    { i: "monthly",  x: 0, y: TOP_H * 2 + PANEL_H * 3, w: 2, h: PANEL_H, minW: 1, minH: 4 },
  ];
  return layouts;
}

function loadLayouts(): Layouts {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (raw) {
      const saved: Layouts = JSON.parse(raw);
      const def = makeDefaultLayouts();
      const valid = Object.entries(def).every(([bp, items]) =>
        items.every((d) => saved[bp]?.find((s) => s.i === d.i))
      );
      if (valid) return saved;
    }
  } catch { /* ignore */ }
  return makeDefaultLayouts();
}

function saveLayouts(layouts: Layouts) {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layouts)); } catch { /* ignore */ }
}

function clearLayouts() {
  try { localStorage.removeItem(LAYOUT_KEY); } catch { /* ignore */ }
}

// ── Revenue helpers ───────────────────────────────────────────────────────────

const PLAN_KEY = "riprint_month_plan_v1";
const DEFAULT_PLAN = 20_000;

function loadPlan(): number {
  try {
    const v = localStorage.getItem(PLAN_KEY);
    if (v) { const n = Number(v); if (n > 0) return n; }
  } catch { /* ignore */ }
  return DEFAULT_PLAN;
}

function savePlan(v: number) {
  try { localStorage.setItem(PLAN_KEY, String(v)); } catch { /* ignore */ }
}

function computeMonthRevenue(orders: Order[]) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  // Only completed orders created this month
  const monthOrders = orders.filter((o) => {
    if (o.status !== "Zakończone") return false;
    if (!o.createdAt) return false;
    const d = new Date(o.createdAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  // daily net revenue (non-cumulative)
  const daily: number[] = Array(daysInMonth).fill(0);
  for (const o of monthOrders) {
    const day = new Date(o.createdAt!).getDate() - 1;
    daily[day] += o.netAmount;
  }
  // make cumulative
  const dailyCumulative = [...daily];
  for (let i = 1; i < daysInMonth; i++) {
    dailyCumulative[i] += dailyCumulative[i - 1];
  }

  const currentRevenue = dailyCumulative[today - 1] ?? 0;
  return { dailyCumulative, currentRevenue, daysInMonth, today };
}

// ── Revenue SVG chart ─────────────────────────────────────────────────────────

function RevenueChart({ dailyCumulative, daysInMonth, today, plan }: {
  dailyCumulative: number[];
  daysInMonth: number;
  today: number;
  plan: number;
}) {
  const W = 560;
  const H = 80;
  const PAD = { t: 8, r: 8, b: 20, l: 8 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const maxVal = Math.max(plan, ...dailyCumulative) || 1;

  const xOf = (dayIdx: number) => PAD.l + (dayIdx / (daysInMonth - 1)) * innerW;
  const yOf = (val: number) => PAD.t + innerH - (val / maxVal) * innerH;

  // only plot up to today
  const points = dailyCumulative.slice(0, today).map((v, i) => ({ x: xOf(i), y: yOf(v) }));

  const pathD = points.length === 0 ? "" :
    points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const areaD = points.length === 0 ? "" :
    pathD +
    ` L${points[points.length - 1].x.toFixed(1)},${(PAD.t + innerH).toFixed(1)}` +
    ` L${points[0].x.toFixed(1)},${(PAD.t + innerH).toFixed(1)} Z`;

  // x axis day labels (1, 5, 10, 15, 20, 25, 31)
  const labelDays = [1, 5, 9, 13, 17, 21, 25, daysInMonth - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
      <defs>
        <linearGradient id="rev-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fe4e00" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fe4e00" stopOpacity="0.04" />
        </linearGradient>
        <clipPath id="rev-clip">
          <rect x={PAD.l} y={PAD.t} width={innerW} height={innerH} />
        </clipPath>
      </defs>

      {/* grid lines */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={PAD.l} x2={PAD.l + innerW}
          y1={yOf(maxVal * f)} y2={yOf(maxVal * f)}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1"
        />
      ))}

      {/* plan line */}
      <line
        x1={PAD.l} x2={PAD.l + innerW}
        y1={yOf(plan)} y2={yOf(plan)}
        stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 3"
      />

      {/* area fill */}
      {areaD && (
        <path d={areaD} fill="url(#rev-area)" clipPath="url(#rev-clip)" />
      )}

      {/* line */}
      {pathD && (
        <path d={pathD} fill="none" stroke="#fe4e00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" clipPath="url(#rev-clip)" />
      )}

      {/* current dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3.5" fill="#fe4e00"
        />
      )}

      {/* x axis labels */}
      {labelDays.map((d) => (
        <text
          key={d}
          x={xOf(d)}
          y={H - 2}
          textAnchor="middle"
          fontSize="9"
          fill="rgba(255,255,255,0.3)"
        >
          {d + 1}
        </text>
      ))}
    </svg>
  );
}

// ── Revenue Panel ─────────────────────────────────────────────────────────────

function RevenuePanel({ orders, editing }: { orders: Order[]; editing: boolean }) {
  const [plan, setPlan] = useState<number>(DEFAULT_PLAN);
  const [editingPlan, setEditingPlan] = useState(false);
  const [planInput, setPlanInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPlan(loadPlan()); }, []);

  const { dailyCumulative, currentRevenue, daysInMonth, today } = computeMonthRevenue(orders);
  const pct = Math.min(100, plan > 0 ? (currentRevenue / plan) * 100 : 0);

  function openEdit() {
    setPlanInput(String(plan));
    setEditingPlan(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commitEdit() {
    const v = parseFloat(planInput.replace(/\s/g, "").replace(",", "."));
    if (!isNaN(v) && v > 0) {
      setPlan(v);
      savePlan(v);
    }
    setEditingPlan(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditingPlan(false);
  }

  return (
    <div className={cn(
      "h-full rounded-2xl border border-white/[0.07] bg-[#141414] p-5 flex flex-col gap-3 overflow-hidden",
      editing && "ring-1 ring-[#fe4e00]/20"
    )}>
      <div className="flex items-start justify-between gap-2 flex-none">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#fe4e00]">Przychód na koniec miesiąca</p>
          <p className="mt-1 text-[2rem] font-bold tabular-nums leading-none text-white">{formatPLN(currentRevenue)}</p>
        </div>
        <div className="text-right flex-none">
          <div className="flex items-center justify-end gap-1.5">
            <p className="text-[10px] uppercase tracking-widest text-white/30">Plan</p>
            <button
              onClick={openEdit}
              className="flex items-center justify-center h-5 w-5 rounded-md text-white/25 hover:text-[#fe4e00] hover:bg-[#fe4e00]/10 transition-colors"
              title="Ustaw plan"
            >
              <Pencil size={10} />
            </button>
          </div>
          {editingPlan ? (
            <input
              ref={inputRef}
              value={planInput}
              onChange={(e) => setPlanInput(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={onKeyDown}
              className="mt-0.5 w-28 text-right text-[1.15rem] font-bold tabular-nums bg-white/[0.06] border border-[#fe4e00]/40 rounded-lg px-2 py-0.5 text-white outline-none focus:border-[#fe4e00]"
            />
          ) : (
            <p className="text-[1.15rem] font-bold text-white/60 tabular-nums">{formatPLN(plan)}</p>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <RevenueChart
          dailyCumulative={dailyCumulative}
          daysInMonth={daysInMonth}
          today={today}
          plan={plan}
        />
      </div>

      <div className="flex-none space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="uppercase tracking-widest text-white/30">Postęp do celu</span>
          <span className="font-bold text-[#fe4e00]">{pct.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#fe4e00] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Threats Panel ─────────────────────────────────────────────────────────────

function daysUntil(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr + "T00:00:00");
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function ThreatsPanel({ editing }: { editing: boolean }) {
  const { tasks } = useTodoTasks();
  const today = new Date().toISOString().slice(0, 10);

  const threats = tasks
    .filter((t) => !t.done && t.dueDate <= new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const preview = threats.slice(0, 3);

  function badgeClass(days: number) {
    if (days <= 1) return "bg-red-600 text-white";
    if (days <= 3) return "bg-[#b84800] text-white";
    return "bg-[#7a3400] text-orange-200";
  }

  function badgeLabel(days: number) {
    if (days < 0) return `${Math.abs(days)}d po`;
    if (days === 0) return "dziś";
    if (days === 1) return "1 dzień";
    return `${days} dni`;
  }

  function formatDueDate(dueDate: string) {
    const days = daysUntil(dueDate);
    if (days === 0) return "Deadline: dziś";
    if (days === 1) return "Deadline: jutro";
    return `Deadline: ${new Date(dueDate + "T00:00:00").toLocaleDateString("pl-PL", { day: "numeric", month: "long" })}`;
  }

  return (
    <div className={cn(
      "h-full rounded-2xl border border-white/[0.07] bg-[#141414] p-5 flex flex-col gap-3 overflow-hidden",
      editing && "ring-1 ring-[#fe4e00]/20"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 flex-none">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 flex-none">
          <AlertTriangle size={16} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">Zagrożenia</p>
          <p className="text-[2rem] font-bold leading-none text-white">{threats.length}</p>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
        {preview.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[12px] text-white/25">
            Brak zagrożeń w najbliższych 7 dniach
          </div>
        ) : (
          preview.map((task) => {
            const days = daysUntil(task.dueDate);
            return (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#fe4e00]/20 bg-[#1a1008] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[13px] text-white truncate">{task.title}</p>
                  <p className="text-[11px] text-white/35 mt-0.5">{formatDueDate(task.dueDate)}</p>
                </div>
                <span className={cn("flex-none rounded-lg px-2.5 py-1 text-[11px] font-bold tabular-nums", badgeClass(days))}>
                  {badgeLabel(days)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {threats.length > 0 && (
        <button className="flex-none w-full rounded-xl border border-[#fe4e00]/30 py-2.5 text-[12px] font-semibold uppercase tracking-widest text-[#fe4e00] hover:bg-[#fe4e00]/10 transition-colors">
          Pokaż wszystkie
        </button>
      )}
    </div>
  );
}

// ── Monthly Revenue Panel ─────────────────────────────────────────────────────

const MONTH_NAMES_PL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

type MonthlyRevenueEntry = { year: number; month: number; total: number };

function computeMonthlyRevenue(orders: Order[], monthsCount = 6): MonthlyRevenueEntry[] {
  const now = new Date();
  const months: MonthlyRevenueEntry[] = [];
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), total: 0 });
  }

  for (const o of orders) {
    if (o.status !== "Zakończone") continue;
    if (!o.createdAt) continue;
    const d = new Date(o.createdAt);
    const entry = months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth());
    if (entry) entry.total += o.netAmount;
  }

  return months;
}

function MonthlyRevenuePanel({ orders, editing }: { orders: Order[]; editing: boolean }) {
  const months = computeMonthlyRevenue(orders, 6);
  const maxVal = Math.max(1, ...months.map((m) => m.total));
  const total = months.reduce((sum, m) => sum + m.total, 0);

  return (
    <div className={cn(
      "h-full rounded-2xl border border-white/[0.07] bg-[#141414] p-5 flex flex-col gap-3 overflow-hidden",
      editing && "ring-1 ring-[#fe4e00]/20"
    )}>
      <div className="flex items-center gap-3 flex-none">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fe4e00]/15 text-[#fe4e00] flex-none">
          <BarChart3 size={16} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#fe4e00]">Przychody miesięczne</p>
          <p className="text-[2rem] font-bold leading-none text-white tabular-nums">{formatPLN(total)}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex items-end gap-3 px-1 pt-2">
        {months.map((m) => {
          const heightPct = m.total > 0 ? Math.max(4, (m.total / maxVal) * 100) : 0;
          const isCurrent = m.year === new Date().getFullYear() && m.month === new Date().getMonth();
          return (
            <div key={`${m.year}-${m.month}`} className="flex-1 h-full flex flex-col items-center justify-end gap-2 min-w-0">
              <span className="text-[11px] font-semibold tabular-nums text-white/60 truncate">
                {formatPLN(m.total)}
              </span>
              <div className="w-full h-full flex items-end">
                <div
                  className={cn(
                    "w-full rounded-t-md transition-all duration-500",
                    isCurrent ? "bg-[#fe4e00]" : "bg-[#fe4e00]/30"
                  )}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className={cn(
                "text-[10px] uppercase tracking-wider truncate",
                isCurrent ? "text-[#fe4e00] font-semibold" : "text-white/30"
              )}>
                {MONTH_NAMES_PL[m.month].slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Panel wrapper ─────────────────────────────────────────────────────────────

function Panel({ children, editing }: { children: React.ReactNode; editing: boolean }) {
  return (
    <div className={cn(
      "h-full relative rounded-2xl overflow-hidden transition-all duration-150",
      editing && "ring-1 ring-[#fe4e00]/25",
    )}>
      {editing && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none z-10 ring-1 ring-[#fe4e00]/20" />
      )}
      {children}
    </div>
  );
}

// ── DashboardScreen ───────────────────────────────────────────────────────────

export function DashboardScreen({ recentOrders, clients, orders }: Props) {
  const { currentUser } = useUserStore();
  const userName = currentUser?.name ?? "Użytkowniku";
  const [editMode, setEditMode] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [layouts, setLayouts] = useState<Layouts>(() => loadLayouts());
  const loaded = useRef(false);
  const { width, containerRef } = useContainerWidth({ measureBeforeMount: false, initialWidth: 1280 });

  function handleLayoutsChange(_: unknown, allLayouts: Layouts) {
    if (!loaded.current) {
      loaded.current = true;
      return;
    }
    setLayouts(allLayouts);
    saveLayouts(allLayouts);
  }

  function reset() {
    const def = makeDefaultLayouts();
    setLayouts(def);
    clearLayouts();
    loaded.current = false;
  }

  return (
    <>
      <style precedence="default">{`
        .rgl-resizing-active .react-resizable-handle {
          background-color: rgba(254, 78, 0, 0.6) !important;
          box-shadow: 0 0 0 2px rgba(254, 78, 0, 0.3);
        }
        .react-resizable-handle {
          background-color: rgba(255,255,255,0.15);
          border-radius: 3px;
          transition: background-color 0.15s, box-shadow 0.15s;
          width: 14px !important;
          height: 14px !important;
          bottom: 6px !important;
          right: 6px !important;
        }
        .react-resizable-handle:hover {
          background-color: rgba(254, 78, 0, 0.7) !important;
          box-shadow: 0 0 0 2px rgba(254, 78, 0, 0.25);
        }
        .react-grid-item.react-grid-placeholder {
          background: rgba(254, 78, 0, 0.12) !important;
          border: 1.5px dashed rgba(254, 78, 0, 0.35) !important;
          border-radius: 12px !important;
          opacity: 1 !important;
        }
        .react-grid-item.resizing {
          z-index: 50;
          box-shadow: 0 0 0 2px rgba(254, 78, 0, 0.4), 0 12px 40px rgba(0,0,0,0.4);
          border-radius: 12px;
        }
        .react-grid-item.react-draggable-dragging {
          z-index: 50;
          box-shadow: 0 0 0 1.5px rgba(254, 78, 0, 0.3), 0 16px 48px rgba(0,0,0,0.5);
          border-radius: 12px;
        }
      `}</style>

      <div className="text-white min-h-0">
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-5 w-full">

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Dzień dobry, {userName}! 👋</h2>
              <p className="mt-0.5 text-[13px] text-white/40">Witaj ponownie na swoim panelu operacyjnym</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {editMode && (
                <button
                  onClick={reset}
                  className="hidden md:flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white/40 hover:text-white/60 hover:bg-white/[0.07] transition-colors"
                >
                  <RotateCcw size={12} />
                  Resetuj
                </button>
              )}
              <button
                onClick={() => setEditMode((v) => !v)}
                className={cn(
                  "hidden md:flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[12px] font-medium transition-colors",
                  editMode
                    ? "border-[#fe4e00]/40 bg-[#fe4e00]/10 text-[#fe4e00] hover:bg-[#fe4e00]/15"
                    : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08]"
                )}
              >
                {editMode ? <Check size={12} /> : <LayoutDashboard size={12} />}
                {editMode ? "Zapisz układ" : "Edytuj układ"}
              </button>
              <Link href="/orders/new" className="flex items-center gap-2 rounded-xl bg-[#fe4e00] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#e54400] transition-colors">
                <Send size={12} />
                <span className="hidden sm:inline">Nowe zlecenie</span>
                <span className="sm:hidden">Nowe</span>
              </Link>
            </div>
          </div>

          {editMode && (
            <p className="text-[11px] text-white/25 -mt-1">
              Tryb edycji — przeciągaj panele, zmieniaj rozmiar za prawy-dolny uchwyt.
            </p>
          )}

          {/* Responsive Grid */}
          <div ref={containerRef as React.RefObject<HTMLDivElement>} className={cn("w-full", resizing && "rgl-resizing-active")}>
            {width > 0 && (
              <ResponsiveGridLayout
                width={width}
                layouts={layouts}
                breakpoints={BREAKPOINTS}
                cols={COLS}
                rowHeight={ROW_H}
                margin={MARGIN}
                containerPadding={[0, 0]}
                onLayoutChange={handleLayoutsChange}
                onResizeStart={() => setResizing(true)}
                onResizeStop={() => setResizing(false)}
                isDraggable={editMode}
                isResizable={editMode}
                useCSSTransforms
              >
                <div key="revenue" className={cn(editMode && "cursor-grab active:cursor-grabbing")}>
                  <Panel editing={editMode}>
                    <RevenuePanel orders={orders} editing={editMode} />
                  </Panel>
                </div>

                <div key="threats" className={cn(editMode && "cursor-grab active:cursor-grabbing")}>
                  <Panel editing={editMode}>
                    <ThreatsPanel editing={editMode} />
                  </Panel>
                </div>

                <div key="orders" className={cn(editMode && "cursor-grab active:cursor-grabbing")}>
                  <Panel editing={editMode}>
                    <RecentOrdersTable recentOrders={recentOrders} />
                  </Panel>
                </div>

                <div key="todo" className={cn(editMode && "cursor-grab active:cursor-grabbing")}>
                  <Panel editing={editMode}>
                    <TodoSection />
                  </Panel>
                </div>

                <div key="goals" className={cn(editMode && "cursor-grab active:cursor-grabbing")}>
                  <Panel editing={editMode}>
                    <GoalsPanel />
                  </Panel>
                </div>

                <div key="monthly" className={cn(editMode && "cursor-grab active:cursor-grabbing")}>
                  <Panel editing={editMode}>
                    <MonthlyRevenuePanel orders={orders} editing={editMode} />
                  </Panel>
                </div>
              </ResponsiveGridLayout>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

// ── Recent orders table ───────────────────────────────────────────────────────

const orderStatusStyles: Record<string, string> = {
  Nowe:           "bg-[#fe4e00]/15 text-[#fe4e00] ring-1 ring-[#fe4e00]/30",
  "W realizacji": "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30",
  Zakończone:     "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30",
  Anulowane:      "bg-white/[0.06] text-zinc-400 ring-1 ring-white/10",
};

function RecentOrdersTable({ recentOrders }: { recentOrders: (Order & { clientName: string })[] }) {
  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/[0.07] bg-[#141414] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 flex-none">
        <h3 className="text-white text-[13px] font-semibold">Ostatnie zlecenia</h3>
        <span className="text-[11px] text-white/30">{recentOrders.length} pozycji</span>
      </div>
      <div className="overflow-y-auto flex-1 min-h-0">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 bg-[#141414] z-10">
            <tr className="border-b border-white/[0.05]">
              {["Numer", "Tytuł / Klient", "Status", "Kwota", "Termin"].map((col, i) => (
                <th
                  key={col}
                  className={cn(
                    "px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/25",
                    i >= 3 ? "text-right" : "text-left",
                    i === 0 && "hidden sm:table-cell",
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
                <tr key={order.id} className="group hover:bg-white/[0.025] transition-colors">
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Link href={`/orders/${order.id}`} className="font-mono text-[11px] font-medium text-white/25 hover:text-white/60 transition-colors">
                      {order.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/orders/${order.id}`} className="block group/link">
                      <p className="font-medium text-white truncate max-w-[160px] group-hover/link:text-[#fe4e00] transition-colors">{order.title}</p>
                      <p className="text-[11px] text-white/35">{order.clientName}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium", orderStatusStyles[order.status])}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white tabular-nums text-[12px]">
                    {formatPLN(order.netAmount)}
                  </td>
                  <td className={cn(
                    "px-4 py-3 text-right tabular-nums text-[12px]",
                    overdue ? "font-semibold text-red-400" : "text-white/35"
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
    </div>
  );
}
