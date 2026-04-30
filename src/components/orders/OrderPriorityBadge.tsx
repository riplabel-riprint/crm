import { Badge } from "@/components/ui/Badge";
import { ORDER_PRIORITY_LABELS } from "@/lib/constants";
import type { OrderPriority } from "@/types";

const priorityVariant: Record<OrderPriority, "gray" | "blue" | "yellow" | "red"> = {
  low: "gray",
  normal: "blue",
  high: "yellow",
  urgent: "red",
};

export function OrderPriorityBadge({ priority }: { priority: OrderPriority }) {
  return (
    <Badge variant={priorityVariant[priority]}>
      {ORDER_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
