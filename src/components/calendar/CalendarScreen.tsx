"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useOrdersStore } from "@/store/orders-store";
import { useClientsStore } from "@/store/clients-store";
import type { Client as CrmClient } from "@/types/crm";
import { cn } from "@/lib/utils";

const DAYS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nie"];

const MONTHS = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

type CalendarEvent = {
  id: string;
  orderId: string;
  orderNumber: string;
  title: string;
  clientName: string;
  status: string;
  date: string; // YYYY-MM-DD
  type: "deadline" | "planned";
};

const STATUS_COLORS: Record<string, string> = {
  "Nowe":         "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "W realizacji": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Zakończone":   "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Anulowane":    "bg-red-500/20 text-red-300 border-red-500/30",
  draft:          "bg-blue-500/20 text-blue-300 border-blue-500/30",
  in_production:  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  completed:      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  delivered:      "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  cancelled:      "bg-red-500/20 text-red-300 border-red-500/30",
};

const DOT_COLORS: Record<string, string> = {
  "Nowe":         "bg-blue-400",
  "W realizacji": "bg-[#fe4e00]",
  "Zakończone":   "bg-emerald-400",
  "Anulowane":    "bg-red-400",
  draft:          "bg-blue-400",
  in_production:  "bg-[#fe4e00]",
  completed:      "bg-emerald-400",
  delivered:      "bg-emerald-400",
  cancelled:      "bg-red-400",
};

function toYMD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDate(str: string): string {
  // handles both "2026-04-20" and "2026-04-20T12:00:00Z"
  return str.slice(0, 10);
}

export function CalendarScreen() {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based
  const [selectedDay, setSelectedDay] = useState<string | null>(toYMD(today));

  const storeOrders = useOrdersStore((s) => s.orders);
  const clients = useClientsStore((s) => s.clients) as unknown as CrmClient[];

  // Build combined event list from store + seed
  const events = useMemo<CalendarEvent[]>(() => {
    const list: CalendarEvent[] = [];

    const clientName = (id: string) => {
      const c = clients.find((c) => c.id === id);
      return c?.name ?? id;
    };

    // Store orders
    for (const o of storeOrders) {
      const name = o.client?.displayName ?? clientName(o.clientId ?? "");
      if (o.requestedDeadline) {
        list.push({
          id: `${o.id}-deadline`,
          orderId: o.id,
          orderNumber: o.orderNumber,
          title: o.title,
          clientName: name,
          status: o.status,
          date: parseDate(o.requestedDeadline),
          type: "deadline",
        });
      }
      if (o.estimatedDeadline) {
        list.push({
          id: `${o.id}-planned`,
          orderId: o.id,
          orderNumber: o.orderNumber,
          title: o.title,
          clientName: name,
          status: o.status,
          date: parseDate(o.estimatedDeadline),
          type: "planned",
        });
      }
    }

    return list;
  }, [storeOrders, clients]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events]);

  // Calendar grid computation
  const { days } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    // Monday-based: 0=Mon, 6=Sun
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { date: string; inMonth: boolean; dayNum: number }[] = [];

    // Prev month filler
    for (let i = startDow - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      days.push({ date: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, inMonth: false, dayNum: d });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        inMonth: true,
        dayNum: d,
      });
    }

    // Next month filler
    const remainder = days.length % 7;
    if (remainder !== 0) {
      const toFill = 7 - remainder;
      for (let d = 1; d <= toFill; d++) {
        const m = month === 11 ? 0 : month + 1;
        const y = month === 11 ? year + 1 : year;
        days.push({ date: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, inMonth: false, dayNum: d });
      }
    }

    return { days };
  }, [year, month]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const todayStr = toYMD(today);
  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : [];

  // Deduplicate by orderId for the panel (show each order once)
  const selectedOrders = useMemo(() => {
    const seen = new Set<string>();
    return selectedEvents.filter(ev => {
      if (seen.has(ev.orderId)) return false;
      seen.add(ev.orderId);
      return true;
    });
  }, [selectedEvents]);

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-3">
          <CalendarDays size={20} className="text-[#fe4e00]" />
          <h1 className="text-[15px] font-semibold text-white">Kalendarz</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDay(todayStr); }}
            className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors"
          >
            Dziś
          </button>
          <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-white/40 hover:bg-white/[0.05] hover:text-white transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[140px] text-center text-[14px] font-semibold text-white">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-white/40 hover:bg-white/[0.05] hover:text-white transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Calendar grid */}
        <div className="flex flex-1 flex-col overflow-hidden p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-widest text-white/25">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 flex-1 gap-px bg-white/[0.04] rounded-xl overflow-hidden border border-white/[0.04]">
            {days.map(({ date, inMonth, dayNum }) => {
              const evs = eventsByDay[date] ?? [];
              const isToday = date === todayStr;
              const isSelected = date === selectedDay;
              const hasDeadline = evs.some(e => e.type === "deadline");
              const hasPlanned = evs.some(e => e.type === "planned");
              const statuses = [...new Set(evs.map(e => e.status))];

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDay(date)}
                  className={cn(
                    "relative flex flex-col bg-[#111111] p-2 text-left transition-colors hover:bg-white/[0.04]",
                    !inMonth && "opacity-30",
                    isSelected && "ring-1 ring-inset ring-[#fe4e00]/50 bg-[#fe4e00]/[0.04]",
                  )}
                >
                  {/* Day number */}
                  <span className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-medium",
                    isToday ? "bg-[#fe4e00] text-white font-bold" : isSelected ? "text-[#fe4e00]" : "text-white/50",
                  )}>
                    {dayNum}
                  </span>

                  {/* Event dots */}
                  {evs.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {statuses.slice(0, 3).map((st, i) => (
                        <span key={i} className={cn("h-1.5 w-1.5 rounded-full", DOT_COLORS[st] ?? "bg-white/40")} />
                      ))}
                      {evs.length > 3 && (
                        <span className="text-[9px] text-white/30">+{evs.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Event pills (visible on larger cells) */}
                  <div className="mt-1 hidden xl:flex flex-col gap-0.5 w-full">
                    {evs.slice(0, 2).map((ev) => (
                      <span
                        key={ev.id}
                        className={cn(
                          "truncate rounded px-1 py-px text-[10px] border",
                          STATUS_COLORS[ev.status] ?? "bg-white/10 text-white/50 border-white/10",
                        )}
                      >
                        {ev.type === "planned" ? "⟳ " : ""}{ev.title}
                      </span>
                    ))}
                    {evs.length > 2 && (
                      <span className="text-[10px] text-white/30">+{evs.length - 2} więcej</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <div className="w-[280px] shrink-0 border-l border-white/[0.06] flex flex-col overflow-hidden">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <p className="text-[12px] font-semibold text-white">
              {selectedDay
                ? new Date(selectedDay + "T12:00:00").toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })
                : "Wybierz dzień"}
            </p>
            {selectedOrders.length > 0 && (
              <p className="mt-0.5 text-[11px] text-white/30">{selectedOrders.length} {selectedOrders.length === 1 ? "zlecenie" : selectedOrders.length < 5 ? "zlecenia" : "zleceń"}</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {selectedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarDays size={28} className="mb-3 text-white/10" />
                <p className="text-[12px] text-white/25">Brak zleceń w tym dniu</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedOrders.map((ev) => {
                  const allEvForOrder = selectedEvents.filter(e => e.orderId === ev.orderId);
                  const isDeadline = allEvForOrder.some(e => e.type === "deadline");
                  const isPlanned = allEvForOrder.some(e => e.type === "planned");

                  return (
                    <button
                      key={ev.orderId}
                      onClick={() => router.push(`/orders/${ev.orderId}`)}
                      className={cn(
                        "w-full rounded-xl border p-3 text-left transition-colors hover:bg-white/[0.04]",
                        STATUS_COLORS[ev.status] ?? "border-white/[0.08] bg-white/[0.02]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-semibold text-white leading-snug">{ev.title}</p>
                        <span className={cn(
                          "shrink-0 rounded-full h-2 w-2 mt-1",
                          DOT_COLORS[ev.status] ?? "bg-white/40",
                        )} />
                      </div>
                      <p className="mt-1 text-[10px] text-white/40">{ev.orderNumber}</p>
                      <p className="text-[10px] text-white/40">{ev.clientName}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {isDeadline && (
                          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] text-white/40">Termin klienta</span>
                        )}
                        {isPlanned && (
                          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] text-white/40">Termin planowany</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="border-t border-white/[0.06] p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/20">Legenda</p>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "W realizacji", color: "bg-[#fe4e00]" },
                { label: "Nowe",         color: "bg-blue-400" },
                { label: "Zakończone",   color: "bg-emerald-400" },
                { label: "Anulowane",    color: "bg-red-400" },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", color)} />
                  <span className="text-[11px] text-white/40">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
