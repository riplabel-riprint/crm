/**
 * createOrder — core business logic.
 *
 * Steps executed in order:
 *  1. Generate order number (RIP-YYYY-NNNN)
 *  2. Build Order record
 *  3. Build OrderRevision v1 with items, subtotal, VAT, total
 *  4. Instantiate OrderStages from workflow template
 *  5. Instantiate OrderStageTasks for each stage
 *  6. Set first stage as active
 *  7. Emit initial OrderEvents (order_created, revision_created, stage_started)
 *  8. Calculate initial progress snapshot
 *
 * Returns a fully hydrated OrderDetail ready to be persisted / stored.
 * When connecting to a real backend, replace the return-object construction
 * with db.transaction() calls — the logic stays identical.
 */

import type {
  Order,
  OrderRevision,
  OrderRevisionItem,
  OrderStage,
  OrderStageTask,
  OrderEvent,
  OrderPriority,
  Money,
  ServiceStage,
} from "@/types";
import type { OrderDetail, SpecSnapshot } from "@/lib/data/orders";
import { getWorkflowForCategory } from "@/lib/workflows/category-workflows";

// ─── Input types ─────────────────────────────────────────────────────────────

export type CreateOrderItemInput = {
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: Money;
  discount?: number;
};

export type CreateOrderInput = {
  clientId: string;
  productId?: string;
  title: string;
  description?: string;
  priority: OrderPriority;
  requestedDeadline?: string;

  // Revision items (the spec / pricing lines)
  items: CreateOrderItemInput[];
  vatRate: number; // e.g. 23

  // Optional: operator creating the order
  actorId?: string;
  actorName?: string;

  // Sequential counter — in real app comes from DB sequence
  sequenceNumber: number;

  // Category of the primary service — used to select the right workflow (fallback)
  serviceCategory?: string;

  // Stages from the service configuration — takes priority over category workflow
  serviceStages?: ServiceStage[];

  // Structured spec from Step 2 — stored for display/editing in workflow panel
  specSnapshot?: SpecSnapshot;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function buildOrderNumber(year: number, seq: number): string {
  return `RIP-${year}-${String(seq).padStart(4, "0")}`;
}

// ─── Main function ────────────────────────────────────────────────────────────

export function createOrder(input: CreateOrderInput): OrderDetail {
  const ts = now();
  const year = new Date().getFullYear();
  const orderId = uid();
  const revisionId = uid();

  // ── 1. Build revision items & financials ──────────────────────────────────
  const revisionItems: OrderRevisionItem[] = input.items.map((item) => {
    const gross = item.quantity * item.unitPrice.amount;
    const discounted = item.discount
      ? Math.round(gross * (1 - item.discount / 100))
      : gross;
    return {
      id: uid(),
      serviceId: item.serviceId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      total: { amount: discounted, currency: "PLN" },
    };
  });

  const subtotalAmount = revisionItems.reduce((s, i) => s + i.total.amount, 0);
  const vatAmount = Math.round(subtotalAmount * (input.vatRate / 100));
  const totalAmount = subtotalAmount + vatAmount;

  const revision: OrderRevision = {
    id: revisionId,
    orderId,
    revisionNumber: 1,
    status: "draft", // becomes "sent" when emailed to client
    items: revisionItems,
    subtotal: { amount: subtotalAmount, currency: "PLN" },
    vatRate: input.vatRate,
    vatAmount: { amount: vatAmount, currency: "PLN" },
    total: { amount: totalAmount, currency: "PLN" },
    createdAt: ts,
    updatedAt: ts,
  };

  // ── 2. Instantiate stages + tasks ────────────────────────────────────────
  const workflow = getWorkflowForCategory(input.serviceCategory ?? "");
  const stages: OrderStage[] = (() => {
    if (input.serviceStages && input.serviceStages.length > 0) {
      return input.serviceStages.map((ss, idx) => {
        const stageId = uid();
        const tasks: OrderStageTask[] = ss.tasks.map((t, tIdx) => ({
          id: uid(),
          stageId,
          name: t.name,
          position: tIdx + 1,
          status: (t.defaultStatus === "done" ? "done" : "pending") as "done" | "pending",
          isRequired: t.required,
        }));
        return {
          id: stageId,
          orderId,
          name: ss.name,
          position: ss.position,
          status: idx === 0 ? ("active" as const) : ("pending" as const),
          startedAt: idx === 0 ? ts : undefined,
          tasks,
        };
      });
    }
    return workflow.stages.map((stageTemplate, idx) => {
      const stageId = uid();
      const tasks: OrderStageTask[] = stageTemplate.taskTemplates.map((tmpl) => ({
        id: uid(),
        stageId,
        workflowTaskTemplateId: tmpl.id,
        name: tmpl.name,
        position: tmpl.position,
        status: "pending" as const,
        isRequired: tmpl.isRequired,
      }));
      return {
        id: stageId,
        orderId,
        workflowStageTemplateId: stageTemplate.id,
        name: stageTemplate.name,
        position: stageTemplate.position,
        status: idx === 0 ? ("active" as const) : ("pending" as const),
        startedAt: idx === 0 ? ts : undefined,
        tasks,
      };
    });
  })();

  const firstStage = stages[0];

  // ── 3. Build order ────────────────────────────────────────────────────────
  const order: Order = {
    id: orderId,
    orderNumber: buildOrderNumber(year, input.sequenceNumber),
    clientId: input.clientId,
    productId: input.productId || undefined,
    status: "draft",
    priority: input.priority,
    title: input.title,
    description: input.description,
    estimatedTotal: { amount: totalAmount, currency: "PLN" },
    requestedDeadline: input.requestedDeadline,
    workflowId: workflow.id,
    currentStageId: firstStage.id,
    tags: [],
    createdAt: ts,
    updatedAt: ts,
  };

  // ── 4. Initial events ─────────────────────────────────────────────────────
  const events: OrderEvent[] = [
    {
      id: uid(),
      orderId,
      type: "order_created",
      actorId: input.actorId,
      actorName: input.actorName,
      payload: {
        orderNumber: order.orderNumber,
        title: order.title,
      },
      createdAt: ts,
    },
    {
      id: uid(),
      orderId,
      type: "revision_created",
      actorId: input.actorId,
      actorName: input.actorName,
      payload: {
        revisionNumber: 1,
        total: totalAmount,
        itemCount: revisionItems.length,
      },
      createdAt: ts,
    },
    {
      id: uid(),
      orderId,
      type: "stage_started",
      actorId: input.actorId,
      actorName: input.actorName,
      payload: {
        stageId: firstStage.id,
        stageName: firstStage.name,
        stagePosition: 1,
      },
      createdAt: ts,
    },
  ];

  // ── 5. Progress snapshot ──────────────────────────────────────────────────
  // completedStages / totalStages = 0/6 = 0%
  // (used by StagesPanel — computed from stages array, no extra field needed)

  return {
    ...order,
    client: { id: input.clientId } as OrderDetail["client"], // shell — store fills from client list
    activeRevision: revision,
    specSnapshot: input.specSnapshot,
    stages,
    events: [...events].reverse(), // newest first for EventLog
  };
}

// ─── Progress helper (pure, used by UI) ──────────────────────────────────────

export function calcOrderProgress(stages: OrderStage[]): {
  completed: number;
  total: number;
  pct: number;
} {
  const active = stages.filter((s) => s.status !== "skipped");
  const completed = active.filter((s) => s.status === "completed").length;
  const total = active.length;
  return {
    completed,
    total,
    pct: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
