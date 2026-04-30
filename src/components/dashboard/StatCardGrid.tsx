"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { DashboardStat } from "@/types/crm";

const STORAGE_KEY = "dashboard-stat-card-order";

const cardAccent: Record<string, { glow: string; value: string; badge: string; icon: string; dots: string }> = {
  emerald: {
    glow: "hover:shadow-emerald-900/40",
    value: "!text-emerald-200",
    badge: "bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-400/40",
    icon: "text-emerald-300",
    dots: "bg-emerald-400/50",
  },
  indigo: {
    glow: "hover:shadow-indigo-900/40",
    value: "!text-indigo-200",
    badge: "bg-indigo-500/25 text-indigo-200 ring-1 ring-indigo-400/40",
    icon: "text-indigo-300",
    dots: "bg-indigo-400/50",
  },
  violet: {
    glow: "hover:shadow-violet-900/40",
    value: "!text-violet-200",
    badge: "bg-violet-500/25 text-violet-200 ring-1 ring-violet-400/40",
    icon: "text-violet-300",
    dots: "bg-violet-400/50",
  },
  red: {
    glow: "hover:shadow-red-900/40",
    value: "!text-red-200",
    badge: "bg-red-500/25 text-red-200 ring-1 ring-red-400/40",
    icon: "text-red-300",
    dots: "bg-red-400/50",
  },
};

const statIcons: Record<string, React.ReactNode> = {
  "Aktywni klienci": (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
      <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 17c0-3.314 3.134-5 7-5s7 1.686 7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 12c2 .5 3.5 1.9 3.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  "Zlecenia w realizacji": (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 7h8M6 10h5M6 13h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  "Przychód netto": (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
      <path d="M10 2v16M6 5.5C6 4.12 7.34 3 10 3s4 1.12 4 2.5-1.34 2-4 2-4 1.12-4 2.5S7.34 14 10 14s4-1.12 4-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  "Zaległe zlecenia": (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v4.5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function applyStoredOrder(stats: DashboardStat[], stored: string[]): DashboardStat[] {
  const byLabel = new Map(stats.map((s) => [s.label, s]));
  // cards present in stored order first, then new ones appended
  const ordered: DashboardStat[] = [];
  for (const label of stored) {
    const s = byLabel.get(label);
    if (s) ordered.push(s);
  }
  for (const s of stats) {
    if (!ordered.includes(s)) ordered.push(s);
  }
  return ordered;
}

export function StatCardGrid({ stats }: { stats: DashboardStat[] }) {
  const [cards, setCards] = useState<DashboardStat[]>(() => stats);
  const dragIndex = useRef<number | null>(null);
  const [draggingLabel, setDraggingLabel] = useState<string | null>(null);
  const [overLabel, setOverLabel] = useState<string | null>(null);

  // restore order from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored: string[] = JSON.parse(raw);
        setCards(applyStoredOrder(stats, stored));
      }
    } catch {
      // ignore malformed storage
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveOrder(ordered: DashboardStat[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ordered.map((s) => s.label)));
    } catch {
      // ignore quota errors
    }
  }

  function handleDragStart(index: number, label: string) {
    dragIndex.current = index;
    setDraggingLabel(label);
  }

  function handleDragOver(e: React.DragEvent, index: number, label: string) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;
    setOverLabel(label);

    const from = dragIndex.current;
    dragIndex.current = index; // must be outside setCards — StrictMode runs updaters twice

    setCards((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
  }

  function handleDrop() {
    saveOrder(cards);
    dragIndex.current = null;
    setDraggingLabel(null);
    setOverLabel(null);
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDraggingLabel(null);
    setOverLabel(null);
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((stat, index) => {
        const accent = cardAccent[stat.color] ?? cardAccent.indigo;
        const trendUp = stat.trend && stat.trend.delta > 0;
        const trendDown = stat.trend && stat.trend.delta < 0;
        const trendNeutral = stat.trend && stat.trend.delta === 0;
        const isDragging = draggingLabel === stat.label;
        const isOver = overLabel === stat.label;

        return (
          <div
            key={stat.label}
            draggable
            onDragStart={() => handleDragStart(index, stat.label)}
            onDragOver={(e) => handleDragOver(e, index, stat.label)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className={cn(
              "group relative cursor-grab active:cursor-grabbing select-none",
              "rounded-3xl border border-white/[0.06] bg-[#0d1117] p-5",
              "shadow-lg hover:shadow-xl transition-all duration-200",
              "hover:border-white/[0.10] hover:-translate-y-0.5",
              accent.glow,
              isDragging && "opacity-40 scale-95 shadow-none border-white/[0.12]",
              isOver && !isDragging && "ring-1 ring-white/20 border-white/[0.14]",
            )}
          >
            {/* drag hint dots */}
            <div className="absolute right-4 top-4 flex flex-col gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex gap-[3px]">
                  {[0, 1].map((col) => (
                    <span key={col} className={cn("h-[3px] w-[3px] rounded-full", accent.dots)} />
                  ))}
                </div>
              ))}
            </div>

            <span className={cn("mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08]", accent.icon)}>
              {statIcons[stat.label]}
            </span>

            <p className={cn("text-[2rem] font-bold tabular-nums leading-none tracking-tight", accent.value)}>
              {stat.value}
            </p>

            <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest !text-white">
              {stat.label}
            </p>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {stat.sub && (
                <span className="text-[12px] text-zinc-400">{stat.sub}</span>
              )}
              {stat.trend && !trendNeutral && (
                <span className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  trendUp ? "bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-400/40" : "",
                  trendDown ? "bg-red-500/25 text-red-200 ring-1 ring-red-400/40" : "",
                )}>
                  {trendUp ? "▲" : "▼"}
                  {Math.abs(stat.trend.delta)}
                  {stat.trend.label && <span className="ml-1 font-normal text-zinc-400">{stat.trend.label}</span>}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
