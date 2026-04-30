"use client";

import { useClientsStore } from "@/store/clients-store";
import { useOrdersStore } from "@/store/orders-store";
import { computeDashboard } from "@/lib/data/crm";
import { DashboardScreen } from "./DashboardScreen";

export function DashboardClientWrapper() {
  const clients = useClientsStore((s) => s.clients);
  const storeOrders = useOrdersStore((s) => s.orders);

  const crmOrders = storeOrders.map((o) => ({
    id: o.id,
    number: o.orderNumber,
    clientId: o.clientId ?? "",
    title: o.title,
    status: mapStatus(o.status),
    netAmount: o.activeRevision?.total?.amount ?? 0,
    vatRate: 23,
    clientDeadline: o.requestedDeadline ?? null,
    createdAt: o.createdAt,
  }));

  const dashboardData = computeDashboard(clients, crmOrders as never);
  return <DashboardScreen {...dashboardData} clients={clients} orders={crmOrders as never} />;
}

function mapStatus(s: string): string {
  const map: Record<string, string> = {
    draft: "Nowe",
    quote_sent: "Nowe",
    quote_accepted: "W realizacji",
    in_production: "W realizacji",
    ready_for_pickup: "W realizacji",
    delivered: "Zakończone",
    invoiced: "Zakończone",
    completed: "Zakończone",
    cancelled: "Anulowane",
  };
  return map[s] ?? "Nowe";
}
