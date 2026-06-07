"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrderJobSpec, OrderEvent, PaymentMethod } from "@/types";
import type { OrderDetail, SpecSnapshot } from "@/lib/data/orders";
import { ordersApi, productionApi, qualityApi, shipmentApi } from "@/lib/api";
import type {
  ApiCreateOrderRequest,
  ApiUpdateStatusRequest,
  ApiUpdateProductionRequest,
  ApiQualityCheckRequest,
  ApiCreateShipmentRequest,
  ApiUpdateShipmentRequest,
} from "@/lib/api/types";

function uid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

type OrdersState = {
  orders: OrderDetail[];
  nextSequence: number;
  deletedSeedIds: string[];

  // ── Local mock actions (dev / offline) ──
  addOrder: (order: OrderDetail) => void;
  deleteOrder: (id: string) => void;
  getOrderById: (id: string) => OrderDetail | undefined;
  updateJobSpec: (orderId: string, spec: OrderJobSpec) => void;
  updateSpecSnapshot: (orderId: string, snap: SpecSnapshot) => void;
  updateTaskDone: (orderId: string, stageId: string, taskId: string, done: boolean) => void;
  advanceStage: (orderId: string, completedStageId: string) => void;
  setActiveStage: (orderId: string, targetStageId: string) => void;
  updateOrderStatus: (orderId: string, status: string) => void;
  updateOrderPriority: (orderId: string, priority: string) => void;
  updateOrderDeadlines: (orderId: string, patch: { requestedDeadline?: string | null; estimatedDeadline?: string | null }) => void;
  updateOrderClient: (orderId: string, clientId: string, displayName: string, email?: string, phone?: string) => void;
  updateOrderFinancials: (orderId: string, netAmountPLN: number, vatRate: number) => void;
  updateOrderPaymentMethod: (orderId: string, method: PaymentMethod | null) => void;

  // ── API actions (production backend) ──
  apiCreateOrder: (data: ApiCreateOrderRequest) => Promise<{ id: number; order_number: string }>;
  apiUpdateStatus: (orderId: number | string, data: ApiUpdateStatusRequest) => Promise<void>;
  apiUpdateProduction: (orderId: number | string, data: ApiUpdateProductionRequest) => Promise<void>;
  apiCompleteProduction: (orderId: number | string, notes?: string) => Promise<void>;
  apiSaveQualityCheck: (orderId: number | string, data: ApiQualityCheckRequest) => Promise<void>;
  apiCreateShipment: (orderId: number | string, data: ApiCreateShipmentRequest) => Promise<void>;
  apiUpdateShipment: (orderId: number | string, data: ApiUpdateShipmentRequest) => Promise<void>;
};

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      nextSequence: 1,
      deletedSeedIds: [],

      addOrder: (order) =>
        set((state) => ({
          orders: [order, ...state.orders],
          nextSequence: state.nextSequence + 1,
        })),

      deleteOrder: (id) =>
        set((state) => {
          const isStoreOrder = state.orders.some((o) => o.id === id);
          if (isStoreOrder) {
            return { orders: state.orders.filter((o) => o.id !== id) };
          }
          return { deletedSeedIds: [...state.deletedSeedIds, id] };
        }),

      getOrderById: (id) => get().orders.find((o) => o.id === id),

      updateJobSpec: (orderId, spec) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, jobSpec: spec } : o
          ),
        })),

      updateSpecSnapshot: (orderId, snap) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, specSnapshot: snap } : o
          ),
        })),

      updateTaskDone: (orderId, stageId, taskId, done) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          const stage = order?.stages?.find((s) => s.id === stageId);
          const task = stage?.tasks.find((t) => t.id === taskId);
          const event: OrderEvent = {
            id: uid(),
            orderId,
            type: "task_completed",
            actorName: "Operator",
            payload: { taskId, taskName: task?.name ?? "", done, stageId, stageName: stage?.name ?? "" },
            createdAt: now(),
          };
          return {
            orders: state.orders.map((o) => {
              if (o.id !== orderId) return o;
              return {
                ...o,
                stages: (o.stages ?? []).map((s) => {
                  if (s.id !== stageId) return s;
                  return {
                    ...s,
                    tasks: s.tasks.map((t) =>
                      t.id === taskId
                        ? { ...t, status: done ? ("done" as const) : ("pending" as const) }
                        : t
                    ),
                  };
                }),
                events: [event, ...(o.events ?? [])],
              };
            }),
          };
        }),

      advanceStage: (orderId, completedStageId) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          const stgs = order?.stages ?? [];
          const currentIdx = stgs.findIndex((s) => s.id === completedStageId);
          const completedStage = stgs[currentIdx];
          const nextStage = stgs[currentIdx + 1];
          const ts = now();
          const newEvents: OrderEvent[] = [
            {
              id: uid(), orderId, type: "stage_completed", actorName: "Operator",
              payload: { stageId: completedStageId, stageName: completedStage?.name ?? "" },
              createdAt: ts,
            },
          ];
          if (nextStage) {
            newEvents.push({
              id: uid(), orderId, type: "stage_started", actorName: "Operator",
              payload: { stageId: nextStage.id, stageName: nextStage.name },
              createdAt: ts,
            });
          }
          return {
            orders: state.orders.map((o) => {
              if (o.id !== orderId) return o;
              const stgs = o.stages ?? [];
              const idx = stgs.findIndex((s) => s.id === completedStageId);
              const next = stgs[idx + 1];
              return {
                ...o,
                stages: stgs.map((s) => {
                  if (s.id === completedStageId) return { ...s, status: "completed" as const, completedAt: ts };
                  if (next && s.id === next.id) return { ...s, status: "active" as const, startedAt: ts };
                  return s;
                }),
                events: [...newEvents, ...(o.events ?? [])],
              };
            }),
          };
        }),

      setActiveStage: (orderId, targetStageId) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          const targetStage = order?.stages?.find((s) => s.id === targetStageId);
          const ts = now();
          const event: OrderEvent = {
            id: uid(), orderId, type: "stage_started", actorName: "Operator",
            payload: { stageId: targetStageId, stageName: targetStage?.name ?? "", manual: true },
            createdAt: ts,
          };
          return {
            orders: state.orders.map((o) => {
              if (o.id !== orderId) return o;
              const stgs = o.stages ?? [];
              const targetIdx = stgs.findIndex((s) => s.id === targetStageId);
              return {
                ...o,
                stages: stgs.map((s, idx) => {
                  if (idx < targetIdx) return { ...s, status: "completed" as const, completedAt: ts };
                  if (s.id === targetStageId) return { ...s, status: "active" as const, startedAt: ts };
                  return { ...s, status: "pending" as const, completedAt: undefined };
                }),
                events: [event, ...(o.events ?? [])],
              };
            }),
          };
        }),

      updateOrderStatus: (orderId, status) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          const event: OrderEvent = {
            id: uid(), orderId, type: "order_status_changed", actorName: "Operator",
            payload: { from: order?.status ?? "", to: status },
            createdAt: now(),
          };
          return {
            orders: state.orders.map((o) =>
              o.id === orderId
                ? { ...o, status: status as any, events: [event, ...(o.events ?? [])] }
                : o
            ),
          };
        }),

      updateOrderPriority: (orderId, priority) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          const event: OrderEvent = {
            id: uid(), orderId, type: "priority_changed", actorName: "Operator",
            payload: { from: order?.priority ?? "", to: priority },
            createdAt: now(),
          };
          return {
            orders: state.orders.map((o) =>
              o.id === orderId
                ? { ...o, priority: priority as any, events: [event, ...(o.events ?? [])] }
                : o
            ),
          };
        }),

      updateOrderDeadlines: (orderId, patch) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          const ts = now();
          const events: OrderEvent[] = [];
          if (patch.requestedDeadline !== undefined) {
            events.push({
              id: uid(), orderId, type: "deadline_changed", actorName: "Operator",
              payload: { field: "clientDeadline", from: order?.requestedDeadline ?? null, to: patch.requestedDeadline },
              createdAt: ts,
            });
          }
          if (patch.estimatedDeadline !== undefined) {
            events.push({
              id: uid(), orderId, type: "deadline_changed", actorName: "Operator",
              payload: { field: "plannedDeadline", from: order?.estimatedDeadline ?? null, to: patch.estimatedDeadline },
              createdAt: ts,
            });
          }
          return {
            orders: state.orders.map((o) =>
              o.id !== orderId ? o : {
                ...o,
                ...(patch.requestedDeadline !== undefined ? { requestedDeadline: patch.requestedDeadline ?? undefined } : {}),
                ...(patch.estimatedDeadline !== undefined ? { estimatedDeadline: patch.estimatedDeadline ?? undefined } : {}),
                events: [...events, ...(o.events ?? [])],
              }
            ),
          };
        }),

      updateOrderClient: (orderId, clientId, displayName, email, phone) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          const event: OrderEvent = {
            id: uid(), orderId, type: "client_changed", actorName: "Operator",
            payload: { from: order?.client?.displayName ?? "", to: displayName, clientId },
            createdAt: now(),
          };
          return {
            orders: state.orders.map((o) =>
              o.id !== orderId ? o : {
                ...o,
                clientId,
                client: { ...o.client, displayName, email: email ?? o.client.email, phone: phone ?? o.client.phone },
                events: [event, ...(o.events ?? [])],
              }
            ),
          };
        }),

      updateOrderFinancials: (orderId, netAmountPLN, vatRate) =>
        set((state) => {
          const netAmount = Math.round(netAmountPLN * 100);
          const vatAmount = Math.round(netAmount * (vatRate / 100));
          const total = netAmount + vatAmount;
          const order = state.orders.find((o) => o.id === orderId);
          const event: OrderEvent = {
            id: uid(), orderId, type: "pricing_updated", actorName: "Operator",
            payload: {
              from: order?.activeRevision?.subtotal?.amount ?? 0,
              to: netAmount,
              vatRate,
            },
            createdAt: now(),
          };
          return {
            orders: state.orders.map((o) =>
              o.id !== orderId ? o : {
                ...o,
                estimatedTotal: { amount: total, currency: "PLN" },
                activeRevision: {
                  ...o.activeRevision,
                  subtotal: { amount: netAmount, currency: "PLN" },
                  vatRate,
                  vatAmount: { amount: vatAmount, currency: "PLN" },
                  total: { amount: total, currency: "PLN" },
                },
                events: [event, ...(o.events ?? [])],
              }
            ),
          };
        }),

      updateOrderPaymentMethod: (orderId, method) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id !== orderId ? o : {
              ...o,
              paymentMethod: method ?? undefined,
              updatedAt: now(),
            }
          ),
        })),

      // ── API actions ──────────────────────────────────────────────────────────

      apiCreateOrder: async (data) => {
        const res = await ordersApi.create(data);
        return { id: res.id, order_number: res.order_number };
      },

      apiUpdateStatus: async (orderId, data) => {
        await ordersApi.updateStatus(orderId, data);
      },

      apiUpdateProduction: async (orderId, data) => {
        await productionApi.update(orderId, data);
      },

      apiCompleteProduction: async (orderId, notes) => {
        await productionApi.complete(orderId, { notes });
      },

      apiSaveQualityCheck: async (orderId, data) => {
        await qualityApi.save(orderId, data);
      },

      apiCreateShipment: async (orderId, data) => {
        await shipmentApi.create(orderId, data);
      },

      apiUpdateShipment: async (orderId, data) => {
        await shipmentApi.update(orderId, data);
      },
    }),
    {
      name: "riprint-orders-store",
      partialize: (state) => ({
        orders: state.orders,
        nextSequence: state.nextSequence,
        deletedSeedIds: state.deletedSeedIds,
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<OrdersState>;
        const hydratedOrders = p.orders ?? current.orders;
        return { ...current, ...p, orders: hydratedOrders, deletedSeedIds: p.deletedSeedIds ?? [] };
      },
    }
  )
);
