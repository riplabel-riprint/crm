"use client";

import Link from "next/link";
import { useOrdersStore } from "@/store/orders-store";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderPriorityBadge } from "@/components/orders/OrderPriorityBadge";
import { formatDate } from "@/lib/utils";

export function OrdersListClient() {
  const orders = useOrdersStore((s) => s.orders);

  if (orders.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="text-4xl opacity-20">📋</div>
        <p className="text-sm text-text-secondary">Brak zleceń.</p>
        <Link
          href="/orders/new"
          className="mt-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent-hover hover:shadow-[var(--shadow-glow)]"
        >
          Utwórz pierwsze zlecenie →
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-[var(--border-subtle)]">
          <tr className="text-[11px] text-text-muted uppercase tracking-widest">
            <th className="px-5 py-3.5 text-left font-semibold">Numer</th>
            <th className="px-4 py-3.5 text-left font-semibold">Tytuł</th>
            <th className="px-4 py-3.5 text-left font-semibold">Status</th>
            <th className="px-4 py-3.5 text-left font-semibold">Priorytet</th>
            <th className="px-4 py-3.5 text-left font-semibold">Termin</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {orders.map((order) => (
            <tr
              key={order.id}
              className="group transition-colors duration-150 hover:bg-white/[0.03]"
            >
              <td className="px-5 py-3.5">
                <Link
                  href={`/orders/${order.id}`}
                  className="font-mono text-[11px] text-accent hover:text-accent-hover transition-colors"
                >
                  {order.orderNumber}
                </Link>
              </td>
              <td className="px-4 py-3.5 font-medium text-text-primary">
                <Link
                  href={`/orders/${order.id}`}
                  className="hover:text-accent transition-colors"
                >
                  {order.title}
                </Link>
              </td>
              <td className="px-4 py-3.5">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3.5">
                <OrderPriorityBadge priority={order.priority} />
              </td>
              <td className="px-4 py-3.5 text-text-secondary tabular-nums">
                {order.requestedDeadline ? formatDate(order.requestedDeadline) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
