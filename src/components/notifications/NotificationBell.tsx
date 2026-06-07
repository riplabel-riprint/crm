"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useReminders } from "@/hooks/useReminders";
import { NotificationDropdown } from "./NotificationDropdown";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, init, markAsRead, markAllAsRead, removeNotification } =
    useNotifications();

  const reminders = useReminders(notifications);

  useEffect(() => {
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!open || isMobile) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, isMobile]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center text-white/60 hover:text-white transition-colors"
        aria-label="Powiadomienia"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#fe4e00] px-1 text-[10px] font-bold text-white leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && isMobile && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 px-4"
          onClick={() => setOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px]">
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkRead={(id) => markAsRead(id)}
              onMarkAllRead={markAllAsRead}
              onDelete={(id) => removeNotification(id)}
              reminders={reminders}
            />
          </div>
        </div>
      )}

      {open && !isMobile && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkRead={(id) => markAsRead(id)}
          onMarkAllRead={markAllAsRead}
          onDelete={(id) => removeNotification(id)}
          reminders={reminders}
        />
      )}
    </div>
  );
}
