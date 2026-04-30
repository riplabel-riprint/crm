"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Info,
} from "lucide-react";
import type { Notification, NotificationType } from "@/types/notifications";

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  urgent: <AlertTriangle size={15} />,
  deadline: <Clock size={15} />,
  warning: <AlertCircle size={15} />,
  success: <CheckCircle2 size={15} />,
  task: <CheckSquare size={15} />,
  info: <Info size={15} />,
};

const TYPE_COLOR: Record<NotificationType, string> = {
  urgent: "text-red-400 bg-red-400/10",
  deadline: "text-orange-400 bg-orange-400/10",
  warning: "text-yellow-400 bg-yellow-400/10",
  success: "text-emerald-400 bg-emerald-400/10",
  task: "text-blue-400 bg-blue-400/10",
  info: "text-sky-400 bg-sky-400/10",
};

const UNREAD_DOT: Record<NotificationType, string> = {
  urgent: "bg-red-400",
  deadline: "bg-orange-400",
  warning: "bg-yellow-400",
  success: "bg-emerald-400",
  task: "bg-blue-400",
  info: "bg-sky-400",
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "przed chwilą";
  if (diff < 3600) return `${Math.floor(diff / 60)} min temu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} godz. temu`;
  return `${Math.floor(diff / 86400)} dni temu`;
}

type Props = {
  notification: Notification;
  onRead: (id: string) => void;
};

export function NotificationItem({ notification, onRead }: Props) {
  const { id, title, message, type, read, createdAt, actionUrl } = notification;

  const content = (
    <div
      className={[
        "flex gap-3 px-4 py-3 transition-colors cursor-pointer",
        read
          ? "hover:bg-white/[0.03]"
          : "bg-white/[0.04] hover:bg-white/[0.07]",
      ].join(" ")}
      onClick={() => !read && onRead(id)}
    >
      {/* Icon */}
      <div
        className={[
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          TYPE_COLOR[type],
        ].join(" ")}
      >
        {TYPE_ICON[type]}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <p
          className={[
            "text-[13px] leading-snug",
            read ? "font-normal text-white" : "font-semibold text-white",
          ].join(" ")}
        >
          {title}
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-white line-clamp-2">
          {message}
        </p>
        <p className="mt-1.5 text-[11px] text-white/30">{timeAgo(createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!read && (
        <div
          className={[
            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
            UNREAD_DOT[type],
          ].join(" ")}
        />
      )}
    </div>
  );

  if (actionUrl) {
    return (
      <Link href={actionUrl} onClick={() => !read && onRead(id)}>
        {content}
      </Link>
    );
  }

  return content;
}
