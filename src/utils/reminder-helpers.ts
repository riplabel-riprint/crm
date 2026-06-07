import type { ReminderOption } from "@/types/notifications";

export const REMINDER_OPTIONS: ReminderOption[] = [
  {
    id: "now",
    label: "Teraz",
    getTime: () => new Date(),
  },
  {
    id: "5min",
    label: "Za 5 minut",
    getTime: () => new Date(Date.now() + 5 * 60 * 1000),
  },
  {
    id: "1hour",
    label: "Za 1 godzinę",
    getTime: () => new Date(Date.now() + 60 * 60 * 1000),
  },
  {
    id: "tomorrow-9am",
    label: "Jutro o 9:00",
    getTime: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
  {
    id: "3days",
    label: "Za 3 dni",
    getTime: () => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
];

export const SNOOZE_OPTIONS = [
  { label: "5 minut", ms: 5 * 60 * 1000 },
  { label: "30 minut", ms: 30 * 60 * 1000 },
  { label: "1 godzina", ms: 60 * 60 * 1000 },
  { label: "1 dzień", ms: 24 * 60 * 60 * 1000 },
];

export function formatTimeUntilReminder(remindAt: Date): string {
  const diff = remindAt.getTime() - Date.now();
  if (diff < 0) return "Przypomnienie przeminęło";
  const minutes = Math.floor(diff / (60 * 1000));
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (minutes < 1) return "za chwilę";
  if (minutes < 60) return `za ${minutes} min`;
  if (hours < 24) return `za ${hours} godz`;
  if (days < 7) return `za ${days} dni`;
  return `${remindAt.toLocaleDateString("pl-PL")} o ${remindAt.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`;
}

export function shouldTriggerReminder(remindAt: Date, wasTriggered: boolean): boolean {
  if (wasTriggered) return false;
  return remindAt <= new Date();
}

export async function sendBrowserNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, { icon: "/notification-icon.png", ...options });
  } else if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification(title, { icon: "/notification-icon.png", ...options });
    }
  }
}

export function playReminderSound(): void {
  const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    const beep = 0.1;
    const gap = 0.05;

    [400, 500, 600].forEach((freq, i) => {
      const t = now + i * (beep + gap);
      oscillator.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.setValueAtTime(0, t + beep);
    });

    oscillator.start(now);
    oscillator.stop(now + 3 * (beep + gap));
  } catch {
    // ignore
  }
}

export function dateToInputDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function inputDateTimeToDate(input: string): Date {
  return new Date(input);
}
