"use client";

/**
 * Zustand store — orders + clients.
 *
 * This is the mock backend. All data lives in memory (and localStorage
 * via persist middleware so it survives page reloads during development).
 *
 * To switch to a real backend:
 *  1. Remove the store persistence.
 *  2. Replace addOrder() with fetch('/api/orders', { method:'POST', body:... })
 *  3. Replace getOrderById() / allOrders with SWR/React Query hooks hitting the API.
 *  4. The form and page components don't change — they call the same interface.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrderJobSpec } from "@/types";
import type { OrderDetail } from "@/lib/data/orders";
import { mockOrders, mockClients } from "@/lib/mock-data";

type OrdersState = {
  orders: OrderDetail[];
  nextSequence: number;

  addOrder: (order: OrderDetail) => void;
  getOrderById: (id: string) => OrderDetail | undefined;
  updateJobSpec: (orderId: string, spec: OrderJobSpec) => void;
};

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: mockOrders.map((o) => ({
        ...o,
        client: mockClients.find((c) => c.id === o.clientId)!,
      })) as OrderDetail[],
      nextSequence: 43, // mock order is RIP-2026-0042, so next is 43

      addOrder: (order) =>
        set((state) => ({
          orders: [order, ...state.orders],
          nextSequence: state.nextSequence + 1,
        })),

      getOrderById: (id) => get().orders.find((o) => o.id === id),

      updateJobSpec: (orderId, spec) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, jobSpec: spec } : o
          ),
        })),
    }),
    {
      name: "riprint-orders-store",
      partialize: (state) => ({
        orders: state.orders,
        nextSequence: state.nextSequence,
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<OrdersState>;
        const hydratedOrders = (p.orders ?? current.orders).map((o) =>
          o.client ? o : { ...o, client: mockClients.find((c) => c.id === o.clientId)! }
        );
        return { ...current, ...p, orders: hydratedOrders };
      },
    }
  )
);
