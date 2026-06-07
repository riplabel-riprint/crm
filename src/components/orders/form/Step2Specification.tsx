"use client";

import type { OrderFormState, SpecOptionDef, InputOptions, SelectedProduct } from "@/lib/business/order-form-types";
import {
  SERVICE_VARIANTS,
  SERVICE_INPUT_OPTIONS,
} from "@/lib/business/order-form-types";
import { useServicesStore } from "@/store/services-store";
import type { ProductAttribute, ProductItem } from "@/types/products";

type AttrValue = string | number | boolean | string[];

type Props = {
  state: OrderFormState;
  onChange: (patch: Partial<OrderFormState>) => void;
  allAttributes?: ProductAttribute[];
  catalogProducts?: ProductItem[];
};

const ORANGE = "#fe4e00";

const inputCls =
  "w-full rounded-lg border border-[#333] bg-[#222] px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#fe4e00]/60 focus:ring-1 focus:ring-[#fe4e00]/20 transition";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[13px] font-semibold text-white/60 border-b border-white/[0.06] pb-1.5">
      {children}
    </p>
  );
}

export function Step2Specification({ state, onChange, allAttributes = [], catalogProducts = [] }: Props) {
  const serviceSpecDefs = useServicesStore((s) => s.serviceSpecDefs);
  const specDefs = serviceSpecDefs[state.serviceId] ?? [];
  const variants = SERVICE_VARIANTS[state.serviceId] ?? [];
  const inputDef = SERVICE_INPUT_OPTIONS[state.serviceId];

  // Resolve products with attributes from the cart
  const productsWithAttrs = state.selectedProducts
    .map((sp) => {
      const product = catalogProducts.find((p) => p.id === sp.productId);
      if (!product || product.attributeIds.length === 0) return null;
      const attrs = product.attributeIds
        .map((id) => allAttributes.find((a) => a.id === id))
        .filter((a): a is ProductAttribute => !!a && a.isActive);
      if (attrs.length === 0) return null;
      return { product, attrs, qty: sp.qty };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const hasContent =
    variants.length > 0 ||
    inputDef ||
    specDefs.length > 0 ||
    productsWithAttrs.length > 0;

  // ── handlers ──────────────────────────────────────────────────────────────

  const setOption = (key: string, value: string) => {
    onChange({ specOptions: { ...state.specOptions, [key]: value } });
  };

  const setInput = (patch: Partial<InputOptions>) => {
    onChange({ inputOptions: { ...state.inputOptions, ...patch } });
  };

  const setAttrValue = (productId: string, attrName: string, value: AttrValue) => {
    onChange({
      productAttributeValues: {
        ...state.productAttributeValues,
        [productId]: {
          ...(state.productAttributeValues[productId] ?? {}),
          [attrName]: value,
        },
      },
    });
  };

  const getAttrValue = (product: ProductItem, attrName: string): AttrValue => {
    const stored = state.productAttributeValues[product.id]?.[attrName];
    if (stored !== undefined) return stored;
    return product.attributeValues[attrName] ?? "";
  };

  if (!hasContent) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 px-6 py-8 text-center text-sm text-white/30">
        Brak konfigurowalnych opcji dla tej usługi.
        <br />
        Przejdź do następnego kroku, aby wpisać opis ręcznie.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Variant selector */}
      {variants.length > 0 && (
        <section>
          <SectionLabel>Wariant usługi</SectionLabel>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {variants.map((v) => {
              const active = state.variantId === v.id;
              const modifier = v.priceModifier !== 1.0
                ? `+${Math.round((v.priceModifier - 1) * 100)}%`
                : null;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onChange({ variantId: v.id })}
                  className="flex flex-col items-start rounded-lg border px-4 py-3 text-left text-sm transition-all"
                  style={{
                    borderColor: active ? ORANGE : "rgba(255,255,255,0.07)",
                    backgroundColor: active ? `${ORANGE}18` : "rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="font-medium" style={{ color: active ? ORANGE : "#fff" }}>
                      {v.name}
                    </span>
                    {modifier && (
                      <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-xs font-semibold text-amber-400">
                        {modifier}
                      </span>
                    )}
                  </div>
                  {v.description && (
                    <span className="mt-0.5 text-xs text-white/40 line-clamp-2">{v.description}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Input options */}
      {inputDef && (
        <section>
          <SectionLabel>Parametry wejściowe</SectionLabel>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {inputDef.showWidth && (
              <InputField
                label="Szerokość (cm)"
                value={state.inputOptions.widthCm ?? ""}
                min={1}
                onChange={(v) => setInput({ widthCm: v })}
              />
            )}
            {inputDef.showHeight && (
              <InputField
                label="Wysokość (cm)"
                value={state.inputOptions.heightCm ?? ""}
                min={1}
                onChange={(v) => setInput({ heightCm: v })}
              />
            )}
            {inputDef.showQuantity && (
              <InputField
                label={inputDef.quantityLabel ?? "Ilość (szt.)"}
                value={state.inputOptions.quantity ?? ""}
                min={1}
                onChange={(v) => setInput({ quantity: v })}
              />
            )}
          </div>
          {inputDef.showWidth && inputDef.showHeight &&
            state.inputOptions.widthCm && state.inputOptions.heightCm && (
              <p className="mt-2 text-xs text-white/30">
                Powierzchnia:{" "}
                <span className="font-medium text-white/60">
                  {((state.inputOptions.widthCm * state.inputOptions.heightCm) / 10000).toFixed(4)} m²
                </span>
              </p>
            )}
        </section>
      )}

      {/* Service spec options */}
      {specDefs.length > 0 && (
        <section className="space-y-6">
          <SectionLabel>Specyfikacja techniczna</SectionLabel>
          {specDefs.map((def) => {
            const currentValue = state.specOptions[def.key] ?? def.defaultValue;
            return (
              <div key={def.key}>
                <p className="mb-2 text-[13px] font-medium text-white/60">{def.label}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {def.choices.map((choice) => {
                    const active = currentValue === choice.value;
                    return (
                      <button
                        key={choice.value}
                        type="button"
                        onClick={() => setOption(def.key, choice.value)}
                        className="rounded-lg border px-3 py-2 text-left text-sm transition-all"
                        style={{
                          borderColor: active ? ORANGE : "rgba(255,255,255,0.07)",
                          backgroundColor: active ? `${ORANGE}18` : "rgba(255,255,255,0.02)",
                          color: active ? ORANGE : "rgba(255,255,255,0.7)",
                          fontWeight: active ? 500 : 400,
                        }}
                      >
                        {choice.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Spec preview */}
      {specDefs.length > 0 && <SpecPreview options={state.specOptions} defs={specDefs} />}

      {/* Product attributes */}
      {productsWithAttrs.map(({ product, attrs }) => (
        <section key={product.id} className="space-y-5">
          <SectionLabel>
            Atrybuty produktu — {product.name}
            {state.selectedProducts.find((sp) => sp.productId === product.id)!.qty > 1 && (
              <span className="ml-2 text-[11px] font-normal text-white/30">
                ×{state.selectedProducts.find((sp) => sp.productId === product.id)!.qty}
              </span>
            )}
          </SectionLabel>
          {attrs.map((attr) => (
            <AttributeInput
              key={attr.id}
              attr={attr}
              value={getAttrValue(product, attr.name)}
              onChange={(v) => setAttrValue(product.id, attr.name, v)}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

// ─── Attribute input ──────────────────────────────────────────────────────────

function AttributeInput({
  attr,
  value,
  onChange,
}: {
  attr: ProductAttribute;
  value: AttrValue;
  onChange: (v: AttrValue) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <p className="text-[13px] font-medium text-white/60">{attr.label}</p>
        {attr.required && (
          <span className="rounded-full bg-[#fe4e00]/15 px-1.5 py-px text-[10px] font-semibold text-[#fe4e00]">
            wymagane
          </span>
        )}
        {attr.unit && (
          <span className="text-[11px] text-white/25">{attr.unit}</span>
        )}
      </div>

      {attr.type === "select" && attr.options && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {attr.options.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.value)}
                className="rounded-lg border px-3 py-2 text-left text-sm transition-all"
                style={{
                  borderColor: active ? ORANGE : "rgba(255,255,255,0.07)",
                  backgroundColor: active ? `${ORANGE}18` : "rgba(255,255,255,0.02)",
                  color: active ? ORANGE : "rgba(255,255,255,0.7)",
                  fontWeight: active ? 500 : 400,
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {attr.type === "multiselect" && attr.options && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {attr.options.map((opt) => {
            const selected = Array.isArray(value) && value.includes(opt.value);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  const current = Array.isArray(value) ? value : [];
                  onChange(
                    selected
                      ? current.filter((v) => v !== opt.value)
                      : [...current, opt.value]
                  );
                }}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all"
                style={{
                  borderColor: selected ? ORANGE : "rgba(255,255,255,0.07)",
                  backgroundColor: selected ? `${ORANGE}18` : "rgba(255,255,255,0.02)",
                  color: selected ? ORANGE : "rgba(255,255,255,0.7)",
                }}
              >
                <span
                  className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border transition-all"
                  style={{
                    borderColor: selected ? ORANGE : "rgba(255,255,255,0.2)",
                    backgroundColor: selected ? ORANGE : "transparent",
                  }}
                >
                  {selected && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {attr.type === "number" && (
        <input
          type="number"
          value={typeof value === "number" ? value : ""}
          min={0}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            if (!isNaN(n)) onChange(n);
          }}
          className={inputCls}
          placeholder={attr.unit ? `Podaj wartość (${attr.unit})` : "Podaj wartość"}
        />
      )}

      {attr.type === "boolean" && (
        <div className="flex gap-2">
          {(["true", "false"] as const).map((v) => {
            const active = String(value) === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => onChange(v === "true")}
                className="rounded-lg border px-5 py-2 text-sm font-medium transition-all"
                style={{
                  borderColor: active ? ORANGE : "rgba(255,255,255,0.07)",
                  backgroundColor: active ? `${ORANGE}18` : "rgba(255,255,255,0.02)",
                  color: active ? ORANGE : "rgba(255,255,255,0.5)",
                }}
              >
                {v === "true" ? "Tak" : "Nie"}
              </button>
            );
          })}
        </div>
      )}

      {(attr.type === "text" || attr.type === "color") && (
        <input
          type={attr.type === "color" ? "color" : "text"}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={attr.type === "color" ? "h-10 w-20 cursor-pointer rounded-lg border border-[#333] bg-[#222] p-1" : inputCls}
          placeholder="Wpisz wartość"
        />
      )}

      {attr.type === "textarea" && (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={inputCls + " resize-none"}
          placeholder="Wpisz wartość"
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InputField({
  label, value, min, onChange,
}: {
  label: string; value: number | ""; min: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/50">{label}</label>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (!isNaN(n) && n >= min) onChange(n);
        }}
        className="w-full rounded-lg border border-[#333] bg-[#222] px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#fe4e00]/60 focus:ring-1 focus:ring-[#fe4e00]/20 transition"
        placeholder="—"
      />
    </div>
  );
}

function SpecPreview({ options, defs }: { options: Record<string, string>; defs: SpecOptionDef[] }) {
  const lines = defs
    .map((d) => {
      const val = options[d.key] ?? d.defaultValue;
      const choice = d.choices.find((c) => c.value === val);
      return `${d.label}: ${choice?.label ?? val}`;
    })
    .join(" · ");
  if (!lines) return null;
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-xs text-white/40">
      <span className="font-medium text-white/60">Snapshot specyfikacji: </span>
      {lines}
    </div>
  );
}

export {};
