import type { OrderStatus, StageStatus, TaskStatus, OrderPriority } from "@/types";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Szkic",
  quote_sent: "Wycena wysłana",
  quote_accepted: "Wycena zaakceptowana",
  in_production: "W realizacji",
  ready_for_pickup: "Gotowe do odbioru",
  delivered: "Dostarczone",
  invoiced: "Faktura wystawiona",
  completed: "Zakończone",
  cancelled: "Anulowane",
};

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  pending: "Oczekuje",
  active: "Aktywny",
  completed: "Ukończony",
  skipped: "Pominięty",
  blocked: "Zablokowany",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Do zrobienia",
  in_progress: "W toku",
  done: "Gotowe",
  skipped: "Pominięte",
};

export const ORDER_PRIORITY_LABELS: Record<OrderPriority, string> = {
  low: "Niski",
  normal: "Normalny",
  high: "Wysoki",
  urgent: "Pilny",
};

export const ORDER_NUMBER_PREFIX = "RIP";

// Terminal statuses — no further transitions allowed
export const TERMINAL_ORDER_STATUSES: OrderStatus[] = ["completed", "cancelled"];

// Valid transitions for order status (simple state machine)
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["quote_sent", "cancelled"],
  quote_sent: ["quote_accepted", "draft", "cancelled"],
  quote_accepted: ["in_production", "cancelled"],
  in_production: ["ready_for_pickup", "cancelled"],
  ready_for_pickup: ["delivered", "cancelled"],
  delivered: ["invoiced", "completed"],
  invoiced: ["completed"],
  completed: [],
  cancelled: [],
};
