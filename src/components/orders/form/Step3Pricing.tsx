"use client";

import { useState, useEffect } from "react";
import type { Client } from "@/types/crm";
import type { Service } from "@/types";
import type { OrderFormState, DraftItem } from "@/lib/business/order-form-types";
import {
  SERVICE_VARIANTS,
  SERVICE_INPUT_OPTIONS,
  specOptionsToDescription,
} from "@/lib/business/order-form-types";
import { formatMoney } from "@/lib/utils";

type Props = {
  state: OrderFormState;
  clients: Client[];
  services: Service[];
  onChange: (patch: Partial<OrderFormState>) => void;
};

const PRIORITY_OPTIONS = [
  { value: "low",    label: "Niski" },
  { value: "normal", label: "Normalny" },
  { value: "high",   label: "Wysoki" },
  { value: "urgent", label: "Pilny" },
] as const;

const inputCls =
  "w-full rounded-lg border border-[#333] bg-[#222] px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#fe4e00]/60 focus:ring-1 focus:ring-[#fe4e00]/20 transition";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5 text-[13px] font-medium text-white/60">{children}</p>;
}

function buildAutoItem(state: OrderFormState, service: Service | undefined): DraftItem | null {
  if (!service) return null;

  const variants = SERVICE_VARIANTS[state.serviceId] ?? [];
  const variant = variants.find((v) => v.id === state.variantId);
  const modifier = variant?.priceModifier ?? 1.0;

  const inputDef = SERVICE_INPUT_OPTIONS[state.serviceId];
  const { widthCm, heightCm, quantity } = state.inputOptions;

  let unitAmountBase = service.basePrice.amount; // in cents
  let qty = 1;

  if (service.pricingModel === "per_sqm" && widthCm && heightCm) {
    const sqm = (widthCm * heightCm) / 10000;
    unitAmountBase = Math.round(service.basePrice.amount * sqm);
    qty = quantity ?? 1;
  } else if ((service.pricingModel === "unit" || service.pricingModel === "per_run") && quantity) {
    qty = quantity;
  } else if (inputDef?.showQuantity && quantity) {
    qty = quantity;
  }

  const unitAmount = Math.round(unitAmountBase * modifier);

  const specDesc = specOptionsToDescription(state.serviceId, state.specOptions);
  const dims =
    widthCm && heightCm
      ? `${widthCm}×${heightCm} cm`
      : widthCm
      ? `szer. ${widthCm} cm`
      : "";
  const descParts = [service.name, dims, specDesc].filter(Boolean);
  const description = descParts.join(" · ");

  return {
    id: crypto.randomUUID(),
    serviceId: state.serviceId,
    description,
    quantity: qty,
    unitPrice: { amount: unitAmount, currency: "PLN" },
  };
}

export function Step3Pricing({ state, clients, services, onChange }: Props) {
  const [newItemDesc,  setNewItemDesc]  = useState("");
  const [newItemQty,   setNewItemQty]   = useState("1");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [showAddRow, setShowAddRow]     = useState(false);

  const client  = clients.find((c) => c.id === state.clientId);
  const service = services.find((s) => s.id === state.serviceId);

  // Auto-fill from spec on mount if no items yet
  useEffect(() => {
    if (state.items.length === 0 && service) {
      const item = buildAutoItem(state, service);
      if (item) onChange({ items: [item] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientName  = client?.name ?? "klienta";
  const serviceName = service?.name ?? "Zlecenie";
  const titlePlaceholder = `${serviceName} dla ${clientName}`;

  const addItem = () => {
    if (!newItemDesc || !newItemPrice) return;
    const item: DraftItem = {
      id: crypto.randomUUID(),
      description: newItemDesc,
      quantity: parseInt(newItemQty) || 1,
      unitPrice: { amount: Math.round(parseFloat(newItemPrice.replace(",", ".")) * 100), currency: "PLN" },
    };
    onChange({ items: [...state.items, item] });
    setNewItemDesc(""); setNewItemQty("1"); setNewItemPrice("");
  };

  const autoFill = () => {
    const item = buildAutoItem(state, service);
    if (!item) return;
    onChange({ items: [...state.items, item] });
  };

  const removeItem = (id: string) =>
    onChange({ items: state.items.filter((i) => i.id !== id) });

  const updateItem = (id: string, patch: Partial<DraftItem>) =>
    onChange({ items: state.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  const subtotal = state.items.reduce((s, i) => s + i.quantity * i.unitPrice.amount, 0);

  const cellInput =
    "rounded border border-transparent bg-transparent px-1 py-0.5 text-white hover:border-white/10 focus:border-[#fe4e00]/50 focus:outline-none transition";

  return (
    <div className="space-y-6">
      {/* Title */}
      <section>
        <Label>Tytuł zlecenia *</Label>
        <input
          type="text"
          value={state.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={titlePlaceholder}
          className={inputCls}
        />
      </section>

      {/* Description */}
      <section>
        <Label>Notatka od klienta</Label>
        <textarea
          value={state.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          placeholder="Dodaj notatkę od klienta…"
          className={`${inputCls} resize-none`}
        />
      </section>

      {/* Priority + Deadline */}
      <div className="grid grid-cols-2 gap-4">
        <section>
          <Label>Priorytet</Label>
          <select
            value={state.priority}
            onChange={(e) => onChange({ priority: e.target.value as OrderFormState["priority"] })}
            className={inputCls}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value} className="bg-[#222]">{p.label}</option>
            ))}
          </select>
        </section>
        <section>
          <Label>Termin realizacji *</Label>
          <input
            type="date"
            value={state.requestedDeadline ? state.requestedDeadline.slice(0, 10) : ""}
            onChange={(e) =>
              onChange({ requestedDeadline: e.target.value ? `${e.target.value}T12:00:00.000Z` : "" })
            }
            className={inputCls}
            style={{ colorScheme: "dark" }}
          />
        </section>
      </div>

      {/* Pricing items */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <Label>Pozycje wyceny *</Label>
          <div className="flex items-center gap-2">
            {service && state.items.length > 0 && (
              <button
                type="button"
                onClick={autoFill}
                className="rounded-md px-3 py-1 text-xs font-medium text-white/50 border border-white/[0.08] hover:border-[#fe4e00]/40 hover:text-white/80 transition"
              >
                + Dodaj z spec.
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAddRow((v) => !v)}
              className="rounded-md px-3 py-1 text-xs font-medium text-white/50 border border-white/[0.08] hover:border-[#fe4e00]/40 hover:text-white/80 transition"
            >
              {showAddRow ? "Anuluj" : "+ Dodaj pozycję"}
            </button>
          </div>
        </div>

        {/* Items table */}
        {state.items.length > 0 ? (
          <div className="mb-3 rounded-lg border border-white/[0.07] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="pb-2 pt-2.5 px-3 text-left text-xs font-medium text-white/30">Opis</th>
                  <th className="pb-2 pt-2.5 px-3 text-right text-xs font-medium text-white/30 w-16">Ilość</th>
                  <th className="pb-2 pt-2.5 px-3 text-right text-xs font-medium text-white/30 w-28">Cena jedn.</th>
                  <th className="pb-2 pt-2.5 px-3 text-right text-xs font-medium text-white/30 w-24">Razem</th>
                  <th className="pb-2 pt-2.5 px-3 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {state.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 px-3">
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        className={`${cellInput} w-full`}
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                        className={`${cellInput} w-14 text-right`}
                      />
                    </td>
                    <td className="py-2 px-3 text-right text-white/50">{formatMoney(item.unitPrice)}</td>
                    <td className="py-2 px-3 text-right font-medium text-white">
                      {formatMoney({ amount: item.quantity * item.unitPrice.amount, currency: "PLN" })}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-white/20 hover:text-red-400 transition-colors text-base leading-none"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-white/[0.07] bg-white/[0.02]">
                <tr>
                  <td colSpan={3} className="px-3 py-2.5 text-right text-xs text-white/40">Razem netto</td>
                  <td className="px-3 py-2.5 text-right text-sm font-semibold text-white" colSpan={2}>
                    {formatMoney({ amount: subtotal, currency: "PLN" })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="mb-3 rounded-lg border border-dashed border-white/[0.08] px-4 py-5 text-center text-sm text-white/25">
            Brak pozycji wyceny — zostaną uzupełnione automatycznie.
          </div>
        )}

        {/* Add item row — hidden by default */}
        {showAddRow && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newItemDesc}
              onChange={(e) => setNewItemDesc(e.target.value)}
              placeholder="Opis pozycji…"
              className={`${inputCls} flex-1`}
              autoFocus
            />
            <input
              type="number"
              min={1}
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              placeholder="Ilość"
              className={`${inputCls} w-20`}
            />
            <input
              type="text"
              inputMode="decimal"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              placeholder="Cena (zł)"
              className={`${inputCls} w-28`}
            />
            <button
              type="button"
              onClick={() => { addItem(); setShowAddRow(false); }}
              disabled={!newItemDesc || !newItemPrice}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-30 transition hover:opacity-90 active:scale-95 shrink-0"
              style={{ backgroundColor: "#fe4e00" }}
            >
              Dodaj
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
