import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderPriorityBadge } from "@/components/orders/OrderPriorityBadge";
import { ClientCard } from "@/components/orders/ClientCard";
import { OrderMetaCard } from "@/components/orders/OrderMetaCard";
import { OrderSpecCard } from "@/components/orders/OrderSpecCard";
import { OrderJobSpecCard } from "@/components/orders/OrderJobSpecCard";
import { StagesPanel } from "@/components/orders/StagesPanel";
import { EventLog } from "@/components/orders/EventLog";
import type { OrderDetail } from "@/lib/data/orders";
import type { OrderView } from "@/types/order-view";

type Props = {
  order: OrderDetail | null;
  isOverdue: boolean;
  view: OrderView;
};

export function OrderDetailView({ order, isOverdue, view }: Props) {
  if (!order) return notFound();

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <nav className="mb-1 flex items-center gap-1.5 text-xs text-gray-400">
              <Link href="/orders" className="hover:text-gray-600 transition-colors">
                Zlecenia
              </Link>
              <span>/</span>
              <span className="font-mono text-gray-600">{view.number}</span>
            </nav>
            <h1 className="truncate text-xl font-semibold text-gray-900">{view.title}</h1>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <OrderPriorityBadge priority={order.priority} />
            {view.clientDeadline && (
              <span
                className={[
                  "text-xs",
                  isOverdue ? "font-semibold text-red-600" : "text-gray-500",
                ].join(" ")}
              >
                Termin: {formatDate(view.clientDeadline)}
                {isOverdue && " — po terminie"}
              </span>
            )}
          </div>
        </div>
        {view.description && (
          <p className="mt-2 max-w-3xl text-sm text-gray-500">{view.description}</p>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-1">
            <ClientCard client={view.client} />
            <OrderMetaCard order={view} />
            <OrderJobSpecCard orderId={order.id} spec={order.jobSpec} />
            <OrderSpecCard revision={order.activeRevision} description={view.description} />
          </div>
          <div className="space-y-5 lg:col-span-2">
            <StagesPanel stages={view.stages} tasks={view.tasks} />
            <EventLog events={order.events} />
          </div>
        </div>
      </div>
    </div>
  );
}
