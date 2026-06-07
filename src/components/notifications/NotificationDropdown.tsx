"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { BellOff, Clock, Plus } from "lucide-react";
import { NotificationItem, timeAgo } from "./NotificationItem";
import type { Notification, NotificationEntityType } from "@/types/notifications";
import type { useReminders } from "@/hooks/useReminders";

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterId = "all" | "unread" | "reminders";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all",       label: "Wszystkie" },
  { id: "unread",    label: "Nieprzeczytane" },
  { id: "reminders", label: "Przypomnienia" },
];

const ENTITY_CATEGORY: Record<NotificationEntityType, FilterId> = {
  order:         "orders",
  task:          "orders",
  client:        "clients",
  gadgetProject: "system",
};

function matchesFilter(n: Notification, filter: FilterId): boolean {
  if (filter === "all")       return true;
  if (filter === "unread")    return !n.read;
  if (filter === "reminders") return !!n.remindAt;
  return ENTITY_CATEGORY[n.relatedEntityType] === filter;
}

// ─── Time grouping ────────────────────────────────────────────────────────────

type TimeGroup = "Dzisiaj" | "Wczoraj" | "Ostatnie 7 dni" | "Starsze";

function getTimeGroup(iso: string): TimeGroup {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 86400)  return "Dzisiaj";
  if (diff < 172800) return "Wczoraj";
  if (diff < 604800) return "Ostatnie 7 dni";
  return "Starsze";
}

const GROUP_ORDER: TimeGroup[] = ["Dzisiaj", "Wczoraj", "Ostatnie 7 dni", "Starsze"];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex gap-3 px-4 py-3 animate-pulse">
      <div className="mt-0.5 h-7 w-7 shrink-0 rounded-lg bg-white/[0.07]" />
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="h-3 w-2/3 rounded bg-white/[0.07]" />
        <div className="h-2.5 w-full rounded bg-white/[0.05]" />
        <div className="h-2 w-1/3 rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

type Props = {
  notifications: Notification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
  reminders?: ReturnType<typeof useReminders>;
};

export function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  reminders,
}: Props) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { setPage(1); }, [filter]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const connectSentinel = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    if (!el) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setPage((p) => p + 1); },
      { root: scrollRef.current, threshold: 0.1 }
    );
    observerRef.current.observe(el);
  }, []);

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filtered = sorted.filter((n) => matchesFilter(n, filter));
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  const groups = GROUP_ORDER.reduce<Record<TimeGroup, Notification[]>>((acc, g) => {
    acc[g] = visible.filter((n) => getTimeGroup(n.createdAt) === g);
    return acc;
  }, { Dzisiaj: [], Wczoraj: [], "Ostatnie 7 dni": [], Starsze: [] });

  const activeGroups = GROUP_ORDER.filter((g) => groups[g].length > 0);

  const filterUnreadCount = (id: FilterId) => {
    if (id === "unread")    return unreadCount;
    if (id === "reminders") return reminders?.getActiveReminders().length ?? 0;
    return notifications.filter((n) => matchesFilter(n, id) && !n.read).length;
  };

  const activeReminders = reminders?.getActiveReminders() ?? [];

  return (
    <div
      className="absolute right-0 top-full mt-3 w-[380px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#161616] shadow-2xl shadow-black/60 flex flex-col"
      style={{ zIndex: 9999, maxHeight: "min(600px, 90vh)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-white">Powiadomienia</span>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#fe4e00] px-1.5 text-[11px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-[12px] font-medium text-white/40 hover:text-white/70 transition"
            >
              Oznacz wszystkie
            </button>
          )}
          <Link
            href="/orders/new"
            className="flex items-center gap-1.5 rounded-lg bg-[#fe4e00] px-2.5 py-1.5 text-[12px] font-semibold text-white hover:bg-[#e04500] transition"
          >
            <Plus size={12} />
            Nowe zlecenie
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-white/[0.06] shrink-0">
        {FILTERS.map((f) => {
          const badge = filterUnreadCount(f.id);
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={[
                "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium transition border-b-2 -mb-px",
                active
                  ? "border-[#fe4e00] text-white"
                  : "border-transparent text-white/40 hover:text-white/70",
              ].join(" ")}
            >
              {f.label}
              {badge > 0 && (
                <span className={[
                  "flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                  active ? "bg-[#fe4e00] text-white" : "bg-white/10 text-white/50",
                ].join(" ")}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Reminders tab */}
      {filter === "reminders" ? (
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeReminders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-white/40">
              <BellOff size={28} />
              <span className="text-[13px]">Brak zaplanowanych przypomnień</span>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {activeReminders.map((notif) => {
                const isOverdue = notif.remindAt <= new Date();
                return (
                  <div
                    key={notif.id}
                    className={[
                      "flex gap-3 px-4 py-3 transition-colors",
                      isOverdue ? "bg-red-400/5 border-l-2 border-red-400" : "hover:bg-white/[0.03]",
                    ].join(" ")}
                  >
                    <div className={["mt-1.5 h-3 w-3 shrink-0 rounded-full", isOverdue ? "bg-red-400" : "bg-orange-400"].join(" ")} />

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white">{notif.title}</p>
                      <p className="mt-0.5 text-[12px] text-white/50 line-clamp-1">{notif.message}</p>
                      <p className={["mt-1.5 text-[11px] font-medium", isOverdue ? "text-red-400" : "text-orange-400"].join(" ")}>
                        ⏰ {notif.formatted}
                      </p>
                    </div>

                    <button
                      onClick={() => reminders?.snoozeReminder(notif.id, 5 * 60 * 1000)}
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition"
                      title="Snoozuj o 5 minut"
                    >
                      <Clock size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Normal notifications list */
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="divide-y divide-white/[0.04]">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-white/40">
              <BellOff size={28} />
              <span className="text-[13px]">Brak powiadomień</span>
            </div>
          ) : (
            <div>
              {activeGroups.map((group) => (
                <div key={group}>
                  <div className="sticky top-0 z-10 bg-[#161616] px-4 py-1.5 border-b border-white/[0.04]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                      {group}
                    </span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {groups[group].map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onRead={onMarkRead}
                        onDelete={onDelete}
                        onReminder={reminders}
                        tick={tick}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {hasMore && <div ref={connectSentinel} className="h-4" />}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {!loading && filter !== "reminders" && (
        <div className="border-t border-white/[0.07] px-4 py-2.5 shrink-0">
          <p className="text-center text-[11px] text-white/50">
            {visible.length < filtered.length
              ? `${visible.length} z ${filtered.length} powiadomień`
              : `${filtered.length} ${filtered.length === 1 ? "powiadomienie" : "powiadomień"} łącznie`
            }
          </p>
        </div>
      )}
    </div>
  );
}
