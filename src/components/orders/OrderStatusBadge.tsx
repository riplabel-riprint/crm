import { Badge } from "@/components/ui/Badge";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/types";

const statusVariant: Record<OrderStatus, "gray" | "blue" | "yellow" | "green" | "red" | "orange" | "purple"> = {
  draft: "gray",
  quote_sent: "blue",
  quote_accepted: "purple",
  in_production: "orange",
  ready_for_pickup: "yellow",
  delivered: "green",
  invoiced: "blue",
  completed: "green",
  cancelled: "red",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={statusVariant[status]}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
