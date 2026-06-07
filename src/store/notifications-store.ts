"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateNotifications } from "@/lib/notifications/generate-notifications";
import type { Notification } from "@/types/notifications";

type NotificationsState = {
  _readIds: string[];
  notifications: Notification[];

  init: (userId: string) => void;
  addNotification: (n: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      _readIds: [],
      notifications: [],

      init: (userId: string) => {
        const readIds = get()._readIds;
        const fresh = generateNotifications(userId).map((n) => ({
          ...n,
          read: readIds.includes(n.id),
        }));
        set({ notifications: fresh });
      },

      addNotification: (n) => {
        set((s) => {
          if (s.notifications.some((x) => x.id === n.id)) return {};
          return { notifications: [n, ...s.notifications] };
        });
      },

      markAsRead: (id: string) => {
        set((s) => ({
          _readIds: s._readIds.includes(id) ? s._readIds : [...s._readIds, id],
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((s) => ({
          _readIds: [...new Set([...s._readIds, ...s.notifications.map((n) => n.id)])],
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      removeNotification: (id: string) => {
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
          _readIds: s._readIds.filter((rid) => rid !== id),
        }));
      },
    }),
    {
      name: "riprint-notifications-store",
      partialize: (s) => ({ _readIds: s._readIds }),
    }
  )
);
