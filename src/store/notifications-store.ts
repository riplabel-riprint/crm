"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateNotifications } from "@/lib/notifications/generate-notifications";
import type { Notification } from "@/types/notifications";

type NotificationsState = {
  _readIds: string[];
  notifications: Notification[];

  init: (userId: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
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
    }),
    {
      name: "riprint-notifications-store",
      partialize: (s) => ({ _readIds: s._readIds }),
    }
  )
);
