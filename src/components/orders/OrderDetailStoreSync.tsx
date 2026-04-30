"use client";

import { notFound } from "next/navigation";
import { useOrdersStore } from "@/store/orders-store";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import { toOrderView } from "@/lib/data/orders";

export function OrderDetailStoreSync({ id }: { id: string }) {
  const order = useOrdersStore((s) => s.getOrderById(id));

  if (!order) notFound();

  const view = toOrderView(order);
  const isOverdue =
    !!view.clientDeadline && new Date(view.clientDeadline) < new Date();

  return <OrderDetailView order={order} isOverdue={isOverdue} view={view} />;
}
