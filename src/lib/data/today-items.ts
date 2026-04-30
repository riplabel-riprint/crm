/**
 * Data access layer for "Do zrobienia dziś" dashboard items.
 *
 * All functions currently return mock data.
 * To connect to a real backend, replace each function body with a fetch/db call.
 * The function signatures and return types must remain stable.
 */

import type { TodayItem } from "@/types/today-item";

// ── Mock adapter ───────────────────────────────────────────────────────────────

const MOCK_TODAY_ITEMS: TodayItem[] = [
  // Zlecenia do startu
  {
    id: "os1",
    kind: "order_start",
    label: "ZL-2024-047 – Ulotki A5",
    sub: "Agencja Reklamowa Nord · 500 szt.",
    status: "pending",
    priority: "high",
    dueTime: "09:00",
  },
  {
    id: "os2",
    kind: "order_start",
    label: "ZL-2024-048 – Wizytówki premium",
    sub: "Studio Forma · 1 000 szt.",
    status: "pending",
    priority: "medium",
    dueTime: "10:30",
  },

  // Etapy do zamknięcia
  {
    id: "sc1",
    kind: "stage_close",
    label: "Druk offsetowy",
    sub: "ZL-2024-041 · Agencja Nord",
    status: "in_progress",
    priority: "high",
    dueTime: "12:00",
  },
  {
    id: "sc2",
    kind: "stage_close",
    label: "Laminowanie",
    sub: "ZL-2024-039 · Studio Forma",
    status: "in_progress",
    priority: "medium",
    dueTime: "14:00",
  },

  // Zadania checklist
  {
    id: "ct1",
    kind: "checklist_task",
    label: "Kontrola jakości wydruku",
    sub: "ZL-2024-041 · etap: Druk",
    status: "in_progress",
    priority: "high",
    dueTime: "11:00",
  },
  {
    id: "ct2",
    kind: "checklist_task",
    label: "Pakowanie do wysyłki",
    sub: "ZL-2024-038 · Jan Kowalski",
    status: "pending",
    priority: "medium",
    dueTime: "15:00",
  },
  {
    id: "ct3",
    kind: "checklist_task",
    label: "Przygotowanie pliku PDF",
    sub: "ZL-2024-035 · PrintMax",
    status: "done",
    priority: "low",
  },

  // Akceptacje klienta
  {
    id: "ca1",
    kind: "client_approval",
    label: "Zatwierdzenie próbnego wydruku",
    sub: "ZL-2024-044 · Kowalski & Syn",
    status: "pending",
    priority: "high",
    dueTime: "13:00",
  },
  {
    id: "ca2",
    kind: "client_approval",
    label: "Akceptacja projektu etykiet",
    sub: "ZL-2024-046 · FreshBrand",
    status: "pending",
    priority: "low",
  },

  // Rzeczy po terminie
  {
    id: "ov1",
    kind: "overdue",
    label: "Wysyłka kurierska",
    sub: "ZL-2024-036 · wczoraj 16:00",
    status: "overdue",
    priority: "high",
  },
  {
    id: "ov2",
    kind: "overdue",
    label: "Faktura końcowa",
    sub: "ZL-2024-033 · 2 dni temu",
    status: "overdue",
    priority: "medium",
  },

  // Blokady do wyjaśnienia
  {
    id: "bl1",
    kind: "blocker",
    label: "Brak pliku od klienta",
    sub: "ZL-2024-045 · oczekuje od wczoraj",
    status: "blocked",
    priority: "high",
  },
  {
    id: "bl2",
    kind: "blocker",
    label: "Awaria plotera – zamówiony serwis",
    sub: "Wpływa na: ZL-2024-047, ZL-2024-048",
    status: "blocked",
    priority: "high",
  },
];

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Returns today's task items for the dashboard.
 *
 * TODO: replace with `fetch("/api/dashboard/today-items")` or a db query.
 */
export async function getTodayItems(): Promise<TodayItem[]> {
  return MOCK_TODAY_ITEMS;
}
