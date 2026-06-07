import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ViewClient } from "@/types/order-view";

const statusVariant: Record<NonNullable<ViewClient["status"]>, "green" | "gray"> = {
  Aktywny: "green",
  Nieaktywny: "gray",
  Lead: "gray",
};

export function ClientCard({ client }: { client: ViewClient }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Klient</CardTitle>
        {client.status && (
          <Badge variant={statusVariant[client.status]}>{client.status}</Badge>
        )}
      </CardHeader>
      <CardBody className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-white/90">{client.name}</p>
          {client.companyName && client.companyName !== client.name && (
            <p className="text-white/50">{client.companyName}</p>
          )}
          {client.taxId && (
            <p className="text-white/30 text-xs">NIP: {client.taxId}</p>
          )}
        </div>

        <div className="space-y-1 text-white/60">
          {client.email && <Row label="E-mail" value={client.email} />}
          {client.phone && <Row label="Tel." value={client.phone} />}
          {client.address && <Row label="Adres" value={client.address} />}
        </div>

        {client.tags && client.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {client.tags.map((tag) => (
              <Badge key={tag} variant="gray">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {client.notes && (
          <p className="rounded-md bg-white/[0.04] p-2 text-xs text-white/40 italic leading-relaxed">
            {client.notes}
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-12 shrink-0 text-white/30">{label}</span>
      <span className="text-white/70">{value}</span>
    </div>
  );
}
