import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatMoney } from "@/lib/utils";
import type { OrderRevision } from "@/types";

type Props = {
  revision: OrderRevision;
  description?: string;
};

const revisionStatusLabel = {
  draft: "Szkic",
  sent: "Wysłana",
  accepted: "Zaakceptowana",
  rejected: "Odrzucona",
  superseded: "Zastąpiona",
} as const;

const revisionStatusVariant = {
  draft: "gray",
  sent: "blue",
  accepted: "green",
  rejected: "red",
  superseded: "gray",
} as const;

export function OrderSpecCard({ revision, description }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Szczegółowy cennik</CardTitle>
        <Badge variant={revisionStatusVariant[revision.status]}>
          {revisionStatusLabel[revision.status]}
        </Badge>
      </CardHeader>
      <CardBody className="p-0">
        {description && (
          <p className="px-5 py-3 text-sm text-white/50 border-b border-white/[0.06]">{description}</p>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] bg-white/[0.02] text-[10px] font-medium text-white/30 uppercase tracking-widest">
              <th className="px-5 py-2.5 text-left font-medium">Pozycja</th>
              <th className="px-3 py-2.5 text-right font-medium">Ilość</th>
              <th className="px-3 py-2.5 text-right font-medium">Cena jedn.</th>
              <th className="px-5 py-2.5 text-right font-medium">Razem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {revision.items.map((item) => (
              <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                <td className="px-5 py-3 text-white/70">{item.description}</td>
                <td className="px-3 py-3 text-right text-white/40">{item.quantity}</td>
                <td className="px-3 py-3 text-right text-white/40">
                  {formatMoney(item.unitPrice)}
                </td>
                <td className="px-5 py-3 text-right font-medium text-white/80">
                  {formatMoney(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-white/[0.06] bg-white/[0.03]">
            <tr>
              <td colSpan={3} className="px-5 py-2.5 text-right text-sm text-white/40">
                Netto
              </td>
              <td className="px-5 py-2.5 text-right text-sm text-white/60">
                {formatMoney(revision.subtotal)}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="px-5 pb-2.5 text-right text-sm text-white/40">
                VAT {revision.vatRate}%
              </td>
              <td className="px-5 pb-2.5 text-right text-sm text-white/60">
                {formatMoney(revision.vatAmount)}
              </td>
            </tr>
            <tr className="border-t border-white/[0.06]">
              <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-white/80">
                Brutto
              </td>
              <td className="px-5 py-3 text-right text-sm font-bold text-white">
                {formatMoney(revision.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </CardBody>
    </Card>
  );
}
