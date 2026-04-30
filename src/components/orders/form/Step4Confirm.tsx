"use client";

import type { OrderFormState } from "@/lib/business/order-form-types";
import { specOptionsToDescription } from "@/lib/business/order-form-types";
import { ORDER_PRIORITY_LABELS } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/utils";
import type { Client } from "@/types/crm";
import type { Service } from "@/types";

type Props = {
  state: OrderFormState;
  clients: Client[];
  services: Service[];
  onChange: (patch: Partial<OrderFormState>) => void;
};

export function Step4Confirm({ state, clients, services, onChange }: Props) {
  const client  = clients.find((c) => c.id === state.clientId);
  const service = services.find((s) => s.id === state.serviceId);

  const subtotal  = state.items.reduce((s, i) => s + i.quantity * i.unitPrice.amount, 0);
  const vatAmount = Math.round(subtotal * (state.vatRate / 100));
  const total     = subtotal + vatAmount;
  const specDesc  = specOptionsToDescription(state.serviceId, state.specOptions);

  return (
    <div className="space-y-5">
      <p className="text-sm text-white/40">
        Sprawdź dane przed zapisaniem. Po zapisaniu zostanie utworzone zlecenie
        w statusie <span className="text-white/70 font-medium">Szkic</span> z wyceną rewizji #1 i pierwszym aktywnym etapem workflow.
      </p>

      {/* Summary grid */}
      <div className="rounded-lg border border-white/[0.07] divide-y divide-white/[0.04] overflow-hidden">
        <Row label="Klient"         value={client?.name ?? "—"} />
        <Row label="Usługa"         value={service?.name ?? "—"} />
        {specDesc && <Row label="Specyfikacja" value={specDesc} />}
        <Row label="Tytuł zlecenia" value={state.title || "—"} />
        {state.description && <Row label="Opis" value={state.description} />}
        <Row label="Priorytet"      value={ORDER_PRIORITY_LABELS[state.priority]} />
        {state.requestedDeadline && (
          <Row label="Termin" value={formatDate(state.requestedDeadline)} />
        )}
        <Row
          label={`Wycena (brutto, VAT ${state.vatRate}%)`}
          value={formatMoney({ amount: total, currency: "PLN" })}
          highlight
        />
        <Row label="Liczba pozycji" value={`${state.items.length}`} />
      </div>

      {/* Positions detail */}
      {state.items.length > 0 && (
        <div className="rounded-lg border border-white/[0.07] overflow-hidden">
          <p className="border-b border-white/[0.06] bg-white/[0.02] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/30">
            Pozycje wyceny
          </p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/[0.04]">
              {state.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2.5 text-white/70">{item.description}</td>
                  <td className="px-4 py-2.5 text-right text-white/30">{item.quantity} ×</td>
                  <td className="px-4 py-2.5 text-right text-white/30">{formatMoney(item.unitPrice)}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-white">
                    {formatMoney({ amount: item.quantity * item.unitPrice.amount, currency: "PLN" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes */}
      <section>
        <p className="mb-1.5 text-[13px] font-medium text-white/60">Notatka do zlecenia (opcjonalna)</p>
        <textarea
          value={state.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={3}
          placeholder="Dodatkowe uwagi, preferencje, informacje dla operatora…"
          className="w-full rounded-lg border border-[#333] bg-[#222] px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#fe4e00]/60 focus:ring-1 focus:ring-[#fe4e00]/20 transition resize-none"
        />
      </section>

      {/* Workflow info */}
      <div className="rounded-lg border border-[#fe4e00]/20 bg-[#fe4e00]/5 px-4 py-3 text-xs text-[#fe4e00]/80 space-y-1">
        <p className="font-semibold text-[#fe4e00]">Co zostanie utworzone automatycznie:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Zlecenie w statusie <strong>Szkic</strong></li>
          <li>Rewizja wyceny #1 (status: szkic)</li>
          <li>Workflow: <strong>Standardowy workflow drukarni</strong> (6 etapów)</li>
          <li>Etap 1 <strong>&bdquo;Przyjęcie zlecenia&rdquo;</strong> ustawiony jako aktywny</li>
          <li>3 zdarzenia w historii (order_created, revision_created, stage_started)</li>
        </ul>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-2.5 text-sm">
      <span className="text-white/30 shrink-0">{label}</span>
      <span className={highlight ? "font-semibold text-white" : "text-white/60 text-right"}>
        {value}
      </span>
    </div>
  );
}
