import type { ReminderState } from "@/types/notifications";

const STORAGE_KEY = "notification-reminders-v1";

export const remindersStorage = {
  getAll(): Map<string, ReminderState> {
    try {
      if (typeof window === "undefined") return new Map();
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return new Map();

      const parsed = JSON.parse(data) as Record<string, ReminderState>;
      const map = new Map<string, ReminderState>();
      Object.entries(parsed).forEach(([key, value]) => {
        map.set(key, { ...value, remindAt: new Date(value.remindAt) });
      });
      return map;
    } catch {
      return new Map();
    }
  },

  get(notificationId: string): ReminderState | undefined {
    return this.getAll().get(notificationId);
  },

  set(notificationId: string, state: ReminderState): void {
    try {
      if (typeof window === "undefined") return;
      const all = this.getAll();
      all.set(notificationId, state);
      const data = Object.fromEntries(
        Array.from(all.entries()).map(([key, value]) => [
          key,
          { ...value, remindAt: value.remindAt.toISOString() },
        ])
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  },

  delete(notificationId: string): void {
    try {
      if (typeof window === "undefined") return;
      const all = this.getAll();
      all.delete(notificationId);
      const data = Object.fromEntries(
        Array.from(all.entries()).map(([key, value]) => [
          key,
          { ...value, remindAt: value.remindAt.toISOString() },
        ])
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore
    }
  },

  getPending(): ReminderState[] {
    const now = new Date();
    return Array.from(this.getAll().values()).filter(
      (r) => !r.wasTriggered && r.remindAt <= now
    );
  },

  getActive(): ReminderState[] {
    return Array.from(this.getAll().values())
      .filter((r) => !r.wasTriggered)
      .sort((a, b) => a.remindAt.getTime() - b.remindAt.getTime());
  },
};
