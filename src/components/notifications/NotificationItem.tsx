"use client";

import { memo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Info,
  ArrowRight,
  X,
} from "lucide-react";
import type { Notification, NotificationType, ReminderState } from "@/types/notifications";
import { ReminderModal } from "./ReminderModal";

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  urgent:   <AlertTriangle size={14} />,
  deadline: <Clock size={14} />,
  warning:  <AlertCircle size={14} />,
  success:  <CheckCircle2 size={14} />,
  task:     <CheckSquare size={14} />,
  info:     <Info size={14} />,
};

const TYPE_COLOR: Record<NotificationType, string> = {
  urgent:   "text-red-400 bg-red-400/10",
  deadline: "text-orange-400 bg-orange-400/10",
  warning:  "text-yellow-400 bg-yellow-400/10",
  success:  "text-emerald-400 bg-emerald-400/10",
  task:     "text-blue-400 bg-blue-400/10",
  info:     "text-sky-400 bg-sky-400/10",
};

const UNREAD_DOT: Record<NotificationType, string> = {
  urgent:   "bg-red-400",
  deadline: "bg-orange-400",
  warning:  "bg-yellow-400",
  success:  "bg-emerald-400",
  task:     "bg-blue-400",
  info:     "bg-sky-400",
};

export function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return "przed chwilą";
  if (diff < 3600)  return `${Math.floor(diff / 60)} min temu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} godz. temu`;
  if (diff < 172800) return "wczoraj";
  return `${Math.floor(diff / 86400)} dni temu`;
}

type ReminderProps = {
  hasReminder: (id: string) => boolean;
  getReminderStatus: (id: string) => "none" | "pending" | "overdue" | "triggered";
  setReminder: (id: string, date: Date) => void;
  snoozeReminder: (id: string, ms: number) => void;
  getReminder: (id: string) => ReminderState | undefined;
};

type Props = {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onReminder?: ReminderProps;
  tick: number;
};

export const NotificationItem = memo(function NotificationItem({
  notification,
  onRead,
  onDelete,
  onReminder,
}: Props) {
  const { id, title, message, type, read, createdAt, actionUrl } = notification;
  const [hovered, setHovered] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  function handleClick() {
    if (!read) onRead(id);
  }

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onDelete(id);
  }

  function handleReminderClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setReminderModalOpen(true);
  }

  const reminderStatus = onReminder?.getReminderStatus(id) ?? "none";
  const hasReminder = reminderStatus !== "none";

  const reminderButtonColor =
    reminderStatus === "triggered" || reminderStatus === "overdue"
      ? "bg-red-500/20 text-red-400"
      : hasReminder
        ? "bg-orange-500/20 text-orange-400"
        : "bg-white/[0.07] text-white/50 hover:bg-white/10 hover:text-white";

  const body = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      className={[
        "group relative flex gap-3 px-4 py-3 transition-colors cursor-pointer select-none",
        read ? "hover:bg-white/[0.03]" : "bg-white/[0.04] hover:bg-white/[0.07]",
      ].join(" ")}
    >
      <div className={["mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", TYPE_COLOR[type]].join(" ")}>
        {TYPE_ICON[type]}
      </div>

      <div className="min-w-0 flex-1 pr-6">
        <p className={["text-[13px] leading-snug", read ? "font-normal text-white/70" : "font-semibold text-white"].join(" ")}>
          {title}
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-white/50 line-clamp-2">{message}</p>
        <p className="mt-1.5 text-[11px] text-white/40">{timeAgo(createdAt)}</p>
      </div>

      {!read && !hovered && (
        <div className={["absolute right-4 top-4 h-2 w-2 rounded-full", UNREAD_DOT[type]].join(" ")} />
      )}

      {hovered && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {onReminder && (
            <button
              onClick={handleReminderClick}
              className={["flex h-6 w-6 items-center justify-center rounded-md transition", reminderButtonColor].join(" ")}
              title={
                reminderStatus === "triggered" ? "Przypomnienie uruchomione"
                : reminderStatus === "overdue"  ? "Przypomnienie przeminęło"
                : hasReminder                   ? "Zmień przypomnienie"
                : "Ustaw przypomnienie"
              }
            >
              <Clock size={12} />
            </button>
          )}
          {actionUrl && (
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.07] text-white/50 hover:bg-white/10 hover:text-white transition">
              <ArrowRight size={12} />
            </span>
          )}
          <button
            onClick={handleDelete}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.07] text-white/50 hover:bg-red-500/20 hover:text-red-400 transition"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {reminderModalOpen && onReminder && (
        <ReminderModal
          notification={notification}
          reminder={onReminder.getReminder(id)}
          onConfirm={(date) => onReminder.setReminder(id, date)}
          onSnooze={(ms) => onReminder.snoozeReminder(id, ms)}
          onClose={() => setReminderModalOpen(false)}
        />
      )}
    </div>
  );

  if (actionUrl) {
    return <Link href={actionUrl}>{body}</Link>;
  }
  return body;
});
