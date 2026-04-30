"use client";

import { BellOff } from "lucide-react";
import { NotificationItem } from "./NotificationItem";
import type { Notification } from "@/types/notifications";

type Props = {
  notifications: Notification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
};

export function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
}: Props) {
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div
      className="absolute right-0 top-full mt-3 w-[340px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#161616] shadow-2xl shadow-black/60"
      style={{ zIndex: 9999 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-white">Powiadomienia</span>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#fe4e00] px-1.5 text-[11px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[12px] font-medium text-[#fe4e00] transition-opacity hover:opacity-70"
          >
            Oznacz wszystkie
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-white/30">
            <BellOff size={24} />
            <span className="text-[13px]">Brak powiadomień</span>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {sorted.map((n) => (
              <NotificationItem key={n.id} notification={n} onRead={onMarkRead} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.07] px-4 py-2.5">
        <p className="text-center text-[11px] text-white">
          {notifications.length} {notifications.length === 1 ? "powiadomienie" : "powiadomień"} łącznie
        </p>
      </div>
    </div>
  );
}
