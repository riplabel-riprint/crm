import { seedOrders, seedTasks } from "@/lib/data/crm-seed";
import type { Notification } from "@/types/notifications";

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Difference in whole days: positive = future, negative = past, 0 = today */
function dayDiff(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today().getTime()) / 86_400_000);
}

function isoNow(): string {
  return new Date().toISOString();
}

function plural(n: number, one: string, few: string): string {
  return Math.abs(n) === 1 ? one : few;
}

// ── Gadget project type (no dedicated store yet) ──────────────────────────────

type GadgetProject = {
  id: string;
  title: string;
  status: "draft" | "inProgress" | "needsApproval" | "approved" | "cancelled";
};

const GADGET_PROJECTS: GadgetProject[] = [
  { id: "gp-001", title: "Bluza firmowa — kolekcja wiosna 2026", status: "needsApproval" },
  { id: "gp-002", title: "Koszulki polo z haftowanym logo", status: "inProgress" },
];

// ── Generator ─────────────────────────────────────────────────────────────────

/**
 * Generates rule-based notifications from real seed data.
 * Returns a deduplicated array — each notification ID is unique.
 * Deduplication is enforced via a Map keyed on notification ID,
 * so repeated calls always produce the same set (no accumulation).
 */
export function generateNotifications(userId: string): Notification[] {
  // Map<id, Notification> guarantees uniqueness — later entries with the same
  // id overwrite earlier ones (they'd be identical anyway).
  const map = new Map<string, Notification>();

  function push(n: Notification) {
    map.set(n.id, n);
  }

  const INACTIVE = new Set(["Zakończone", "Anulowane"]);

  // Build a lookup: orderId → clientDeadline (for task rules)
  const orderDeadline = new Map<string, string>();
  const orderTitle = new Map<string, string>();
  const orderNumber = new Map<string, string>();
  for (const o of seedOrders) {
    if (o.clientDeadline) orderDeadline.set(o.id, o.clientDeadline);
    orderTitle.set(o.id, o.title);
    orderNumber.set(o.id, o.number);
  }

  // ── 1. Order deadline rules ─────────────────────────────────────────────────
  for (const order of seedOrders) {
    if (INACTIVE.has(order.status)) continue;
    if (!order.clientDeadline) continue;

    const diff = dayDiff(order.clientDeadline);
    const label = `${order.number} — ${order.title}`;

    if (diff === 1) {
      push({
        id: `order-deadline-tomorrow-${order.id}`,
        userId,
        title: "Termin zlecenia jutro",
        message: `${label} musi być gotowe jutro.`,
        type: "deadline",
        priority: "medium",
        read: false,
        createdAt: isoNow(),
        relatedEntityType: "order",
        relatedEntityId: order.id,
        actionUrl: `/orders/${order.id}`,
      });
    } else if (diff === 0) {
      push({
        id: `order-deadline-today-${order.id}`,
        userId,
        title: "Termin zlecenia dzisiaj",
        message: `${label} musi zostać ukończone do końca dnia.`,
        type: "urgent",
        priority: "high",
        read: false,
        createdAt: isoNow(),
        relatedEntityType: "order",
        relatedEntityId: order.id,
        actionUrl: `/orders/${order.id}`,
      });
    } else if (diff < 0) {
      const days = Math.abs(diff);
      push({
        id: `order-overdue-${order.id}`,
        userId,
        title: "Zlecenie po terminie",
        message: `${label} przekroczyło termin o ${days} ${plural(days, "dzień", "dni")}.`,
        type: "urgent",
        priority: "high",
        read: false,
        createdAt: isoNow(),
        relatedEntityType: "order",
        relatedEntityId: order.id,
        actionUrl: `/orders/${order.id}`,
      });
    }

    // High-priority order still active
    if ((order.priority === "high" || order.priority === "urgent") && !INACTIVE.has(order.status)) {
      push({
        id: `order-high-priority-${order.id}`,
        userId,
        title: "Zlecenie o wysokim priorytecie",
        message: `${label} wymaga pilnej uwagi.`,
        type: "warning",
        priority: "high",
        read: false,
        createdAt: isoNow(),
        relatedEntityType: "order",
        relatedEntityId: order.id,
        actionUrl: `/orders/${order.id}`,
      });
    }
  }

  // ── 2. Task deadline rules — derived from parent order's deadline ────────────
  // Tasks inherit their order's clientDeadline (no separate task deadline field).
  // Only tasks belonging to active orders with a deadline are checked.
  for (const task of seedTasks) {
    if (task.done) continue;

    const deadline = orderDeadline.get(task.orderId);
    if (!deadline) continue;

    // Skip if parent order is completed/cancelled
    const parentOrder = seedOrders.find((o) => o.id === task.orderId);
    if (!parentOrder || INACTIVE.has(parentOrder.status)) continue;

    const diff = dayDiff(deadline);
    const taskLabel = `„${task.title}"`;
    const orderLabel = orderNumber.get(task.orderId) ?? task.orderId;

    if (diff === 1) {
      push({
        id: `task-deadline-tomorrow-${task.id}`,
        userId,
        title: "Zadanie do wykonania jutro",
        message: `${taskLabel} (${orderLabel}) musi być gotowe do jutra.`,
        type: "deadline",
        priority: "medium",
        read: false,
        createdAt: isoNow(),
        relatedEntityType: "task",
        relatedEntityId: task.id,
        actionUrl: `/orders/${task.orderId}`,
      });
    } else if (diff < 0) {
      push({
        id: `task-overdue-${task.id}`,
        userId,
        title: "Zadanie opóźnione",
        message: `${taskLabel} (${orderLabel}) nie zostało wykonane w terminie.`,
        type: "urgent",
        priority: "high",
        read: false,
        createdAt: isoNow(),
        relatedEntityType: "task",
        relatedEntityId: task.id,
        actionUrl: `/orders/${task.orderId}`,
      });
    }
  }

  // ── 3. Gadget project approval ──────────────────────────────────────────────
  for (const project of GADGET_PROJECTS) {
    if (project.status === "needsApproval") {
      push({
        id: `gadget-approval-${project.id}`,
        userId,
        title: "Projekt wymaga zatwierdzenia",
        message: `„${project.title}" czeka na akceptację.`,
        type: "info",
        priority: "medium",
        read: false,
        createdAt: isoNow(),
        relatedEntityType: "gadgetProject",
        relatedEntityId: project.id,
        actionUrl: `/clothing`,
      });
    }
  }

  return Array.from(map.values());
}
