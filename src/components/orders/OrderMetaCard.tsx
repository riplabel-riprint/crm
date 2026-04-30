import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import type { OrderView } from "@/types/order-view";

function formatPLN(amount: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function OrderMetaCard({ order }: { order: OrderView }) {
  const isOverdue =
    order.clientDeadline && new Date(order.clientDeadline) < new Date();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Szczegóły zlecenia</CardTitle>
      </CardHeader>
      <CardBody className="space-y-2 text-sm">
        <Row label="Numer" value={order.number} mono />
        <Row
          label="Termin klienta"
          value={order.clientDeadline ? formatDate(order.clientDeadline) : "—"}
          highlight={isOverdue ? "red" : undefined}
        />
        <Row
          label="Termin planowany"
          value={order.plannedDeadline ? formatDate(order.plannedDeadline) : "—"}
        />
        <Row label="Wycena netto" value={formatPLN(order.netAmount)} />
        <Row label={`VAT ${order.vatRate}%`} value={formatPLN(order.vatAmount)} />
        <Row label="Razem brutto" value={formatPLN(order.grossAmount)} bold />
      </CardBody>
    </Card>
  );
}

function Row({
  label,
  value,
  bold,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
  highlight?: "red";
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span
        className={[
          bold ? "font-semibold text-gray-900" : "text-gray-700",
          mono ? "font-mono text-xs" : "",
          highlight === "red" ? "text-red-600 font-medium" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
