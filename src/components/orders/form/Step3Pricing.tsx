"use client";

import { useState } from "react";
import type { OrderFormState, DraftItem } from "@/lib/business/order-form-types";
import { formatMoney } from "@/lib/utils";

type Props = {
  state: OrderFormState;
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

export function Step3Pricing({ state, onChange }: Props) {
  const [newItemDesc,  setNewItemDesc]  = useState("");
  const [newItemQty,   setNewItemQty]   = useState("1");
  const [newItemPrice, setNewItemPrice] = useState("");

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

  const removeItem = (id: string) =>
    onChange({ items: state.items.filter((i) => i.id !== id) });

  const updateItem = (id: string, patch: Partial<DraftItem>) =>
    onChange({ items: state.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  const subtotal  = state.items.reduce((s, i) => s + i.quantity * i.unitPrice.amount, 0);
  const vatAmount = Math.round(subtotal * (state.vatRate / 100));
  const total     = subtotal + vatAmount;

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
          placeholder="np. Banery na targi Drema 2026"
          className={inputCls}
        />
      </section>

      {/* Description */}
      <section>
        <Label>Opis / specyfikacja (tekst)</Label>
        <textarea
          value={state.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          placeholder="Dodatkowe informacje, wymiary, materiały, uwagi…"
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
          <Label>Termin realizacji</Label>
          <input
            type="date"
            value={state.requestedDeadline ? state.requestedDeadline.slice(0, 10) : ""}
            onChange={(e) =>
              onChange({ requestedDeadline: e.target.value ? `${e.target.value}T12:00:00.000Z` : "" })
            }
            className={inputCls}
          />
        </section>
      </div>

      {/* Pricing items */}
      <section>
        <Label>Pozycje wyceny *</Label>

        {state.items.length > 0 && (
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
            </table>
          </div>
        )}

        {/* Add item row */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemDesc}
            onChange={(e) => setNewItemDesc(e.target.value)}
            placeholder="Opis pozycji…"
            className={`${inputCls} flex-1`}
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
            onClick={addItem}
            disabled={!newItemDesc || !newItemPrice}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-30 transition hover:opacity-90 active:scale-95 shrink-0"
            style={{ backgroundColor: "#fe4e00" }}
          >
            + Dodaj
          </button>
        </div>
      </section>

      {/* VAT rate */}
      <section>
        <Label>Stawka VAT</Label>
        <select
          value={state.vatRate}
          onChange={(e) => onChange({ vatRate: parseInt(e.target.value) })}
          className={`${inputCls} w-44`}
        >
          <option value={23} className="bg-[#222]">23%</option>
          <option value={8}  className="bg-[#222]">8%</option>
          <option value={5}  className="bg-[#222]">5%</option>
          <option value={0}  className="bg-[#222]">0% (zwolnione)</option>
        </select>
      </section>

      {/* Totals */}
      {state.items.length > 0 && (
        <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-4 text-sm space-y-1.5">
          <div className="flex justify-between text-white/40">
            <span>Netto</span>
            <span>{formatMoney({ amount: subtotal, currency: "PLN" })}</span>
          </div>
          <div className="flex justify-between text-white/40">
            <span>VAT {state.vatRate}%</span>
            <span>{formatMoney({ amount: vatAmount, currency: "PLN" })}</span>
          </div>
          <div className="flex justify-between border-t border-white/[0.06] pt-2 font-semibold text-white">
            <span>Brutto</span>
            <span>{formatMoney({ amount: total, currency: "PLN" })}</span>
          </div>
        </div>
      )}
    </div>
  );
}
