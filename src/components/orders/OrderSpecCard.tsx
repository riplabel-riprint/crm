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
        <CardTitle>Specyfikacja — wycena #{revision.revisionNumber}</CardTitle>
        <Badge variant={revisionStatusVariant[revision.status]}>
          {revisionStatusLabel[revision.status]}
        </Badge>
      </CardHeader>
      <CardBody className="p-0">
        {description && (
          <p className="px-5 py-3 text-sm text-gray-600 border-b border-gray-100">{description}</p>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-2.5 text-left font-medium">Pozycja</th>
              <th className="px-3 py-2.5 text-right font-medium">Ilość</th>
              <th className="px-3 py-2.5 text-right font-medium">Cena jedn.</th>
              <th className="px-5 py-2.5 text-right font-medium">Razem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {revision.items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-gray-700">{item.description}</td>
                <td className="px-3 py-3 text-right text-gray-500">{item.quantity}</td>
                <td className="px-3 py-3 text-right text-gray-500">
                  {formatMoney(item.unitPrice)}
                </td>
                <td className="px-5 py-3 text-right font-medium text-gray-900">
                  {formatMoney(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-gray-200 bg-gray-50">
            <tr>
              <td colSpan={3} className="px-5 py-2.5 text-right text-sm text-gray-500">
                Netto
              </td>
              <td className="px-5 py-2.5 text-right text-sm text-gray-700">
                {formatMoney(revision.subtotal)}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="px-5 pb-2.5 text-right text-sm text-gray-500">
                VAT {revision.vatRate}%
              </td>
              <td className="px-5 pb-2.5 text-right text-sm text-gray-700">
                {formatMoney(revision.vatAmount)}
              </td>
            </tr>
            <tr className="border-t border-gray-200">
              <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-gray-900">
                Brutto
              </td>
              <td className="px-5 py-3 text-right text-sm font-bold text-gray-900">
                {formatMoney(revision.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </CardBody>
    </Card>
  );
}
