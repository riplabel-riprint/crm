"use client";

import { useNotificationsStore } from "@/store/notifications-store";
import { useUserStore } from "@/store/user-store";
import type { NotificationEntityType, UserRole } from "@/types/notifications";

const ROLE_ENTITY_MAP: Record<UserRole, NotificationEntityType[]> = {
  admin: ["order", "task", "client", "gadgetProject"],
  manager: ["order", "task", "client"],
  marketing: ["gadgetProject"],
};

export function useNotifications() {
  const { currentUser } = useUserStore();
  const { notifications, init, addNotification, markAsRead, markAllAsRead, removeNotification } = useNotificationsStore();

  const allowed = currentUser ? ROLE_ENTITY_MAP[currentUser.role] : [];
  const filtered = currentUser
    ? notifications.filter(
        (n) => n.userId === currentUser.id && allowed.includes(n.relatedEntityType)
      )
    : [];

  const unreadCount = filtered.filter((n) => !n.read).length;

  return {
    notifications: filtered,
    unreadCount,
    currentUser,
    init: () => { if (currentUser) init(currentUser.id); },
    addNotification: (n: Parameters<typeof addNotification>[0]) => addNotification(n),
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}
