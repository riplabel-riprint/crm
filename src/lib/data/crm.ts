/**
 * CRM data access layer.
 * Clients are served from useClientsStore (Zustand + localStorage).
 * Orders/stages/tasks are served from seed data.
 * To connect to a real backend: replace each function body with a fetch/db call.
 * Compute helpers are pure functions — they stay unchanged after backend migration.
 */

import type { Client, Order, OrderStage, OrderTask, DashboardStat, ClientStatus, OrderStatus } from "@/types/crm";
import { seedOrders, seedStages, seedTasks } from "@/lib/data/crm-seed";

// ─── Fetch functions (swap body for API call later) ──────────────────────────

export async function getOrders(): Promise<Order[]> {
  return seedOrders;
}

export async function getStages(): Promise<OrderStage[]> {
  return seedStages;
}

export async function getTasks(): Promise<OrderTask[]> {
  return seedTasks;
}

// ─── Relational helpers (pure, synchronous) ──────────────────────────────────

export function clientById(clients: Client[], id: string): Client | undefined {
  return clients.find((c) => c.id === id);
}

export function ordersByClient(orders: Order[], clientId: string): Order[] {
  return orders.filter((o) => o.clientId === clientId);
}

export function stagesByOrder(stages: OrderStage[], orderId: string): OrderStage[] {
  return stages.filter((s) => s.orderId === orderId);
}

export function tasksByOrder(tasks: OrderTask[], orderId: string): OrderTask[] {
  return tasks.filter((t) => t.orderId === orderId);
}

export function tasksByStage(tasks: OrderTask[], stageId: string): OrderTask[] {
  return tasks.filter((t) => t.stageId === stageId);
}

export function activeStage(stages: OrderStage[]): OrderStage | undefined {
  return stages.find((s) => s.status === "Aktywny");
}

// ─── Financial helpers ────────────────────────────────────────────────────────

export function vatAmount(order: Order): number {
  return order.netAmount * (order.vatRate / 100);
}

export function grossAmount(order: Order): number {
  return order.netAmount + vatAmount(order);
}

export function formatPLN(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function isOverdue(order: Order): boolean {
  if (!order.clientDeadline) return false;
  if (order.status === "Zakończone" || order.status === "Anulowane") return false;
  return new Date(order.clientDeadline) < new Date();
}

export function formatDatePL(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

// ─── Dashboard aggregations ───────────────────────────────────────────────────

export type DashboardData = {
  stats: DashboardStat[];
  recentOrders: (Order & { clientName: string })[];
  clientsByStatus: Record<ClientStatus, number>;
  ordersByStatus: Record<OrderStatus, number>;
};

export function computeDashboard(clients: Client[], orders: Order[]): DashboardData {
  const activeClients = clients.filter((c) => c.status === "Aktywny").length;
  const inProgress = orders.filter((o) => o.status === "W realizacji").length;
  const completedRevenue = orders
    .filter((o) => o.status === "Zakończone")
    .reduce((sum, o) => sum + o.netAmount, 0);
  const overdueCount = orders.filter(isOverdue).length;

  const stats: DashboardStat[] = [
    { label: "Aktywni klienci", value: activeClients, sub: `z ${clients.length} łącznie`, color: "emerald", trend: { delta: 12, label: "vs. poprzedni mies." } },
    { label: "Zlecenia w realizacji", value: inProgress, sub: "aktywnych procesów", color: "indigo", trend: { delta: -3, label: "vs. tydzień temu" } },
    { label: "Przychód netto", value: formatPLN(completedRevenue), sub: "zakończone zlecenia", color: "violet", trend: { delta: 8, label: "vs. poprzedni mies." } },
    { label: "Zaległe zlecenia", value: overdueCount, sub: "po terminie klienta", color: "red", trend: { delta: overdueCount > 0 ? overdueCount : 0 } },
  ];

  const recentOrders = [...orders]
    .slice()
    .reverse()
    .slice(0, 6)
    .map((o) => ({
      ...o,
      clientName: clientById(clients, o.clientId)?.name ?? "—",
    }));

  const clientsByStatus: Record<ClientStatus, number> = {
    Aktywny: clients.filter((c) => c.status === "Aktywny").length,
    Lead: clients.filter((c) => c.status === "Lead").length,
    Nieaktywny: clients.filter((c) => c.status === "Nieaktywny").length,
  };

  const ordersByStatus: Record<OrderStatus, number> = {
    Nowe: orders.filter((o) => o.status === "Nowe").length,
    "W realizacji": orders.filter((o) => o.status === "W realizacji").length,
    Zakończone: orders.filter((o) => o.status === "Zakończone").length,
    Anulowane: orders.filter((o) => o.status === "Anulowane").length,
  };

  return { stats, recentOrders, clientsByStatus, ordersByStatus };
}
