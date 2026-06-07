/**
 * Data access layer for orders.
 *
 * All functions currently return mock data.
 * To connect to a real backend, replace each function body with a fetch/db call.
 * The function signatures and return types must remain stable.
 */

import { getMockOrderById } from "@/lib/mock-data";
import { seedOrders, seedStages, seedTasks } from "@/lib/data/crm-seed";
import { SEED_CLIENTS } from "@/lib/data/clients-seed";
import type { Client, Order, OrderJobSpec, OrderRevision, OrderStage, OrderEvent, TaskStatus } from "@/types";
import type { OrderView, ViewClient, ViewOrderStage, ViewOrderTask } from "@/types/order-view";

export type SpecSnapshot = {
  serviceId: string;
  variantId?: string;
  specOptions: Record<string, string>;
  inputOptions: { widthCm?: number; heightCm?: number; quantity?: number };
  /** productId → qty (from selectedProducts at order creation) */
  productQuantities?: Record<string, number>;
  productAttributeValues?: Record<string, Record<string, string | number | boolean | string[]>>;
};

export type OrderDetail = Order & {
  client: Client;
  activeRevision: OrderRevision;
  jobSpec?: OrderJobSpec;
  specSnapshot?: SpecSnapshot;
  stages: OrderStage[];
  events: OrderEvent[];
};

export async function getOrderDetail(_id: string): Promise<OrderDetail | null> {
  return null;
}

const CRM_STATUS_MAP: Record<string, Order["status"]> = {
  "Nowe": "draft",
  "W realizacji": "in_production",
  "Zakończone": "completed",
  "Anulowane": "cancelled",
};

function getCrmSeedOrderById(id: string): OrderDetail | null {
  const crmOrder = seedOrders.find((o) => o.id === id);
  if (!crmOrder) return null;

  const crmClient = SEED_CLIENTS.find((c) => c.id === crmOrder.clientId);
  if (!crmClient) return null;

  const client: Client = {
    id: crmClient.id,
    type: crmClient.type === "Firma" ? "company" : "individual",
    status: crmClient.status === "Aktywny" ? "active" : crmClient.status === "Lead" ? "active" : "inactive",
    displayName: crmClient.name,
    companyName: crmClient.companyName,
    email: crmClient.email ?? "",
    phone: crmClient.phone,
    address: crmClient.address
      ? { street: crmClient.address, city: "", postalCode: "", country: "PL" }
      : undefined,
    notes: crmClient.notes,
    tags: crmClient.tags ?? [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  const subtotalAmount = crmOrder.netAmount * 100;
  const vatAmount = Math.round(subtotalAmount * crmOrder.vatRate / 100);
  const activeRevision: OrderRevision = {
    id: `rev-${crmOrder.id}`,
    orderId: crmOrder.id,
    revisionNumber: 1,
    status: "accepted",
    items: [],
    subtotal: { amount: subtotalAmount, currency: "PLN" },
    vatRate: crmOrder.vatRate,
    vatAmount: { amount: vatAmount, currency: "PLN" },
    total: { amount: subtotalAmount + vatAmount, currency: "PLN" },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  const orderStages: OrderStage[] = seedStages
    .filter((s) => s.orderId === id)
    .map((s, index) => {
      const stageTasks = seedTasks.filter((t) => t.stageId === s.id);
      return {
        id: s.id,
        orderId: s.orderId,
        name: s.name,
        position: index,
        status:
          s.status === "Aktywny" ? "active"
          : s.status === "Zakończony" ? "completed"
          : "pending",
        tasks: stageTasks.map((t, ti) => ({
          id: t.id,
          stageId: t.stageId,
          name: t.title,
          isRequired: t.required ?? false,
          status: (t.done ? "done" : "pending") as TaskStatus,
          position: ti,
        })),
      };
    });

  const order: Order = {
    id: crmOrder.id,
    orderNumber: crmOrder.number,
    clientId: crmOrder.clientId,
    status: CRM_STATUS_MAP[crmOrder.status] ?? "draft",
    priority: "normal",
    title: crmOrder.title,
    description: crmOrder.description,
    estimatedTotal: { amount: subtotalAmount + vatAmount, currency: "PLN" },
    requestedDeadline: crmOrder.clientDeadline ?? undefined,
    estimatedDeadline: crmOrder.plannedDeadline ?? undefined,
    tags: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  return {
    ...order,
    client,
    activeRevision,
    stages: orderStages,
    events: [],
  };
}

// ─── View mapper ──────────────────────────────────────────────────────────────

const clientStatusMap: Record<string, ViewClient["status"]> = {
  active: "Aktywny",
  vip: "Aktywny",
  inactive: "Nieaktywny",
  blocked: "Nieaktywny",
};

function mapClient(c: Client): ViewClient {
  return {
    id: c.id,
    name: c.displayName,
    companyName: c.companyName,
    taxId: c.taxId,
    email: c.email,
    phone: c.phone,
    address: c.address
      ? `${c.address.street}, ${c.address.postalCode} ${c.address.city}`
      : undefined,
    tags: c.tags,
    notes: c.notes,
    status: clientStatusMap[c.status] ?? "Aktywny",
  };
}

function mapStages(stages: OrderStage[]): { viewStages: ViewOrderStage[]; viewTasks: ViewOrderTask[] } {
  const viewStages: ViewOrderStage[] = stages.map((s) => ({
    id: s.id,
    name: s.name,
    status:
      s.status === "active"
        ? "Aktywny"
        : s.status === "completed"
        ? "Zakończony"
        : "Oczekuje",
    completedTasks: s.tasks.filter((t) => t.status === "done").length,
    totalTasks: s.tasks.length,
  }));

  const viewTasks: ViewOrderTask[] = stages.flatMap((s) =>
    s.tasks.map((t) => ({
      id: t.id,
      stageId: t.stageId,
      title: t.name,
      required: t.isRequired,
      done: t.status === "done",
    }))
  );

  return { viewStages, viewTasks };
}

export function toOrderView(detail: OrderDetail): OrderView {
  const { viewStages, viewTasks } = mapStages(detail.stages);
  const rev = detail.activeRevision;

  return {
    id: detail.id,
    number: detail.orderNumber,
    title: detail.title,
    description: detail.description,
    productId: detail.productId,
    status: detail.status,
    priority: detail.priority,
    client: mapClient(detail.client),
    clientDeadline: detail.requestedDeadline ?? null,
    plannedDeadline: detail.estimatedDeadline ?? null,
    netAmount: rev.subtotal.amount / 100,
    vatRate: rev.vatRate,
    vatAmount: rev.vatAmount.amount / 100,
    grossAmount: rev.total.amount / 100,
    stages: viewStages,
    tasks: viewTasks,
  };
}
