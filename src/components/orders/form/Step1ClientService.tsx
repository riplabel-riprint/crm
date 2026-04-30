"use client";

import type { Client } from "@/types/crm";
import type { Service } from "@/types";
import type { OrderFormState } from "@/lib/business/order-form-types";
import { SERVICE_PRODUCTS } from "@/lib/business/order-form-types";

type Props = {
  state: OrderFormState;
  clients: Client[];
  services: Service[];
  onChange: (patch: Partial<OrderFormState>) => void;
};

const ORANGE = "#fe4e00";

const selectCls =
  "w-full rounded-lg border border-[#333] bg-[#222] px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#fe4e00]/60 focus:ring-1 focus:ring-[#fe4e00]/20 transition cursor-pointer";

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[13px] font-medium text-white/60">{children}</p>;
}

export function Step1ClientService({ state, clients, services, onChange }: Props) {
  const selectedClient = clients.find((c) => c.id === state.clientId);
  const selectedService = services.find((s) => s.id === state.serviceId);
  const availableProducts = state.serviceId ? (SERVICE_PRODUCTS[state.serviceId] ?? []) : [];

  const handleServiceChange = (serviceId: string) => {
    onChange({ serviceId, productId: "", variantId: "", specOptions: {} });
  };

  return (
    <div className="space-y-6">
      {/* Client */}
      <section>
        <Label>Klient</Label>
        <select
          value={state.clientId}
          onChange={(e) => onChange({ clientId: e.target.value })}
          className={selectCls}
        >
          <option value="" className="bg-[#222]">— wybierz klienta —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id} className="bg-[#222]">
              {c.name}{c.companyName && c.companyName !== c.name ? ` (${c.companyName})` : ""}
            </option>
          ))}
        </select>

        {selectedClient && (
          <div className="mt-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm space-y-0.5">
            <p className="font-medium text-white">{selectedClient.name}</p>
            {selectedClient.email && <p className="text-white/50">{selectedClient.email}</p>}
            {selectedClient.phone && <p className="text-white/50">{selectedClient.phone}</p>}
          </div>
        )}
      </section>

      {/* Service */}
      <section>
        <Label>Usługa</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {services.filter((s) => s.isActive).map((s) => {
            const active = state.serviceId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleServiceChange(s.id)}
                className="flex flex-col items-start rounded-lg border px-4 py-3 text-left text-sm transition-all"
                style={{
                  borderColor: active ? ORANGE : "rgba(255,255,255,0.07)",
                  backgroundColor: active ? `${ORANGE}18` : "rgba(255,255,255,0.02)",
                }}
              >
                <span className="font-medium" style={{ color: active ? ORANGE : "#fff" }}>
                  {s.name}
                </span>
                {s.description && (
                  <span className="mt-0.5 text-xs text-white/40 line-clamp-2">{s.description}</span>
                )}
                <span className="mt-1.5 text-xs text-white/30">{formatBasePrice(s)}</span>
              </button>
            );
          })}
        </div>
        {selectedService && (
          <p className="mt-2 text-xs" style={{ color: ORANGE }}>
            Wybrano: <span className="font-medium">{selectedService.name}</span>
          </p>
        )}
      </section>

      {/* Product */}
      {availableProducts.length > 0 && (
        <section>
          <Label>Produkt</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {availableProducts.map((p) => {
              const active = state.productId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange({ productId: p.id, variantId: "" })}
                  className="flex flex-col items-start rounded-lg border px-4 py-3 text-left text-sm transition-all"
                  style={{
                    borderColor: active ? ORANGE : "rgba(255,255,255,0.07)",
                    backgroundColor: active ? `${ORANGE}18` : "rgba(255,255,255,0.02)",
                  }}
                >
                  <span className="font-medium" style={{ color: active ? ORANGE : "#fff" }}>
                    {p.name}
                  </span>
                  {p.description && (
                    <span className="mt-0.5 text-xs text-white/40 line-clamp-2">{p.description}</span>
                  )}
                </button>
              );
            })}
          </div>
          {!state.productId && (
            <p className="mt-1.5 text-xs text-amber-400/80">Wybierz produkt, aby kontynuować.</p>
          )}
        </section>
      )}
    </div>
  );
}

function formatBasePrice(s: Service): string {
  const price = (s.basePrice.amount / 100).toFixed(2).replace(".", ",");
  const models: Record<string, string> = {
    unit: `${price} zł/${s.unit ?? "szt."}`,
    per_sqm: `${price} zł/m²`,
    per_run: `${price} zł/nakład`,
    fixed: `${price} zł (ryczałt)`,
    custom: "wycena indywidualna",
  };
  return models[s.pricingModel] ?? `${price} zł`;
}
