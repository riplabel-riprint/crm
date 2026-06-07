"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Notification, ReminderState } from "@/types/notifications";
import { remindersStorage } from "@/lib/reminders-storage";
import {
  formatTimeUntilReminder,
  sendBrowserNotification,
  playReminderSound,
  shouldTriggerReminder,
} from "@/utils/reminder-helpers";

type ReminderCallback = (notification: Notification) => void;

export function useReminders(notifications: Notification[]) {
  const [reminders, setReminders] = useState<Map<string, ReminderState>>(new Map());
  const [tick, setTick] = useState(0);
  const callbacksRef = useRef<Set<ReminderCallback>>(new Set());
  const triggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const stored = remindersStorage.getAll();
    setReminders(stored);
    stored.forEach((state) => {
      if (state.wasTriggered) triggeredRef.current.add(state.notificationId);
    });
  }, []);

  const triggerReminder = useCallback((notification: Notification, state: ReminderState) => {
    sendBrowserNotification(`⏰ Przypomnienie: ${notification.title}`, {
      body: notification.message,
      tag: `reminder-${notification.id}`,
      requireInteraction: true,
    });
    playReminderSound();
    callbacksRef.current.forEach((cb) => cb(notification));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);

      const map = remindersStorage.getAll();
      map.forEach((state, notificationId) => {
        const notification = notifications.find((n) => n.id === notificationId);
        if (!notification) return;
        if (shouldTriggerReminder(state.remindAt, state.wasTriggered)) {
          if (!triggeredRef.current.has(notificationId)) {
            triggerReminder(notification, state);
            triggeredRef.current.add(notificationId);
            const updated = { ...state, wasTriggered: true };
            remindersStorage.set(notificationId, updated);
            setReminders((prev) => new Map(prev).set(notificationId, updated));
          }
        }
      });
    }, 10_000);

    return () => clearInterval(interval);
  }, [notifications, triggerReminder]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const map = remindersStorage.getAll();
      setReminders(map);
      map.forEach((state, notificationId) => {
        if (state.wasTriggered) return;
        const notification = notifications.find((n) => n.id === notificationId);
        if (notification && shouldTriggerReminder(state.remindAt, false)) {
          triggerReminder(notification, state);
          triggeredRef.current.add(notificationId);
        }
      });
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [notifications, triggerReminder]);

  const setReminder = useCallback((notificationId: string, date: Date) => {
    const state: ReminderState = {
      notificationId,
      remindAt: date,
      snoozedCount: 0,
      wasTriggered: false,
    };
    remindersStorage.set(notificationId, state);
    setReminders((prev) => new Map(prev).set(notificationId, state));
    triggeredRef.current.delete(notificationId);
  }, []);

  const snoozeReminder = useCallback((notificationId: string, ms: number) => {
    const current = remindersStorage.get(notificationId);
    if (!current) return;
    const updated: ReminderState = {
      ...current,
      remindAt: new Date(Date.now() + ms),
      snoozedCount: current.snoozedCount + 1,
      wasTriggered: false,
    };
    remindersStorage.set(notificationId, updated);
    setReminders((prev) => new Map(prev).set(notificationId, updated));
    triggeredRef.current.delete(notificationId);
  }, []);

  const clearReminder = useCallback((notificationId: string) => {
    remindersStorage.delete(notificationId);
    setReminders((prev) => {
      const next = new Map(prev);
      next.delete(notificationId);
      return next;
    });
    triggeredRef.current.delete(notificationId);
  }, []);

  const getActiveReminders = useCallback((): (Notification & { remindAt: Date; formatted: string })[] => {
    const active = remindersStorage.getActive();
    return active
      .map((state) => {
        const notif = notifications.find((n) => n.id === state.notificationId);
        if (!notif) return null;
        return { ...notif, remindAt: state.remindAt, formatted: formatTimeUntilReminder(state.remindAt) };
      })
      .filter(Boolean) as (Notification & { remindAt: Date; formatted: string })[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, tick]);

  const onReminderTriggered = useCallback((callback: ReminderCallback) => {
    callbacksRef.current.add(callback);
    return () => callbacksRef.current.delete(callback);
  }, []);

  return {
    reminders,
    setReminder,
    snoozeReminder,
    clearReminder,
    getActiveReminders,
    onReminderTriggered,
    hasReminder: (id: string) => reminders.has(id),
    getReminder: (id: string) => reminders.get(id),
    getReminderStatus: (id: string): "none" | "pending" | "overdue" | "triggered" => {
      const r = reminders.get(id);
      if (!r) return "none";
      if (r.wasTriggered) return "triggered";
      if (r.remindAt <= new Date()) return "overdue";
      return "pending";
    },
  };
}
