"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { useOrdersStore } from "@/store/orders-store";
import { useServicesStore } from "@/store/services-store";
import { useProductsStore } from "@/store/products-store";
import type { SpecSnapshot } from "@/lib/data/orders";
import type { ProductAttribute } from "@/types/products";
import {
  SERVICE_VARIANTS,
  SERVICE_INPUT_OPTIONS,
  type SpecOptionDef,
} from "@/lib/business/order-form-types";
import type { InputOptions } from "@/lib/business/order-form-types";

type Props = {
  orderId: string;
  snap?: SpecSnapshot;
};

const ORANGE = "#fe4e00";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
      <span className="w-36 shrink-0 text-xs text-white/30 pt-px">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function formatAttrValue(
  value: string | number | boolean | string[],
  attr?: ProductAttribute,
): string {
  if (typeof value === "boolean") return value ? "Tak" : "Nie";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    if (attr?.options)
      return value.map((v) => attr.options!.find((o) => o.value === v)?.label ?? v).join(", ");
    return value.join(", ");
  }
  if (typeof value === "number")
    return attr?.unit ? `${value} ${attr.unit}` : String(value);
  if (attr?.options)
    return attr.options.find((o) => o.value === value)?.label ?? value;
  return value || "—";
}

export function OrderSpecSnapshotCard({ orderId, snap }: Props) {
  const [editMode, setEditMode] = useState(false);
  const updateSpecSnapshot = useOrdersStore((s) => s.updateSpecSnapshot);
  const services = useServicesStore((s) => s.services);
  const serviceSpecDefs = useServicesStore((s) => s.serviceSpecDefs);
  const catalogProducts = useProductsStore((s) => s.products);
  const allAttributes = useProductsStore((s) => s.attributes);

  if (!snap) return null;

  const service = services.find((s) => s.id === snap.serviceId);
  const variants = SERVICE_VARIANTS[snap.serviceId] ?? [];
  const variant = variants.find((v) => v.id === snap.variantId);
  const specDefs = serviceSpecDefs[snap.serviceId] ?? [];
  const inputDef = SERVICE_INPUT_OPTIONS[snap.serviceId];
  const { widthCm, heightCm, quantity } = snap.inputOptions;

  const handleSave = (updated: SpecSnapshot) => {
    updateSpecSnapshot(orderId, updated);
    setEditMode(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Specyfikacja usługi / produktów</CardTitle>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="text-xs transition-colors" style={{ color: ORANGE }}
          >
            Edytuj
          </button>
        )}
      </CardHeader>

      {editMode ? (
        <EditForm snap={snap} specDefs={specDefs} onSave={handleSave} onClose={() => setEditMode(false)} />
      ) : (
        <CardBody className="py-1 px-5">
          {service && <Row label="Usługa" value={service.name} />}
          {variant && <Row label="Wariant" value={variant.name} />}
          {inputDef?.showWidth && widthCm && (
            <Row label="Szerokość" value={`${widthCm} cm`} />
          )}
          {inputDef?.showHeight && heightCm && (
            <Row label="Wysokość" value={`${heightCm} cm`} />
          )}
          {inputDef?.showWidth && inputDef.showHeight && widthCm && heightCm && (
            <Row
              label="Powierzchnia"
              value={`${((widthCm * heightCm) / 10000).toFixed(4)} m²`}
            />
          )}
          {inputDef?.showQuantity && quantity && (
            <Row label={inputDef.quantityLabel ?? "Ilość"} value={`${quantity} szt.`} />
          )}
          {specDefs.map((def) => {
            const val = snap.specOptions[def.key] ?? def.defaultValue;
            const choice = def.choices.find((c) => c.value === val);
            return (
              <Row key={def.key} label={def.label} value={choice?.label ?? val} />
            );
          })}
          {specDefs.length === 0 && !inputDef && !variant &&
            !snap.productAttributeValues && (
            <p className="py-3 text-sm text-white/30">Brak danych specyfikacji.</p>
          )}

          {/* Products — quantities + attributes */}
          {(() => {
            const hasQty   = snap.productQuantities   && Object.keys(snap.productQuantities).length   > 0;
            const hasAttrs = snap.productAttributeValues && Object.keys(snap.productAttributeValues).length > 0;
            if (!hasQty && !hasAttrs) return null;

            // Collect all productIds that appear in either map
            const productIds = Array.from(new Set([
              ...Object.keys(snap.productQuantities   ?? {}),
              ...Object.keys(snap.productAttributeValues ?? {}),
            ]));

            return (
              <div className="mt-1 pt-2 border-t border-white/[0.06]">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-white/25">
                  Produkty
                </p>
                {productIds.map((productId) => {
                  const product  = catalogProducts.find((p) => p.id === productId);
                  const qty      = snap.productQuantities?.[productId];
                  const attrVals = snap.productAttributeValues?.[productId] ?? {};

                  return (
                    <div key={productId} className="mb-4 last:mb-0">
                      {/* Product header — name + quantity badge */}
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-white/60">
                          {product?.name ?? productId}
                        </span>
                        {qty != null && (
                          <span className="rounded-md bg-white/[0.07] px-2 py-0.5 text-[11px] font-medium text-white/50">
                            {qty} szt.
                          </span>
                        )}
                      </div>

                      {/* Attribute rows */}
                      {Object.entries(attrVals).map(([attrName, value]) => {
                        const attr = allAttributes.find((a) => a.name === attrName);
                        return (
                          <Row
                            key={attrName}
                            label={attr?.label ?? attrName}
                            value={formatAttrValue(
                              value as string | number | boolean | string[],
                              attr,
                            )}
                          />
                        );
                      })}

                      {/* If product has no attributes but has qty, show nothing extra */}
                      {Object.keys(attrVals).length === 0 && (
                        <p className="text-[11px] text-white/20 pl-0.5">Brak atrybutów</p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardBody>
      )}
    </Card>
  );
}

function EditForm({
  snap,
  specDefs,
  onSave,
  onClose,
}: {
  snap: SpecSnapshot;
  specDefs: SpecOptionDef[];
  onSave: (s: SpecSnapshot) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<SpecSnapshot>({ ...snap, specOptions: { ...snap.specOptions }, inputOptions: { ...snap.inputOptions } });

  const variants = SERVICE_VARIANTS[snap.serviceId] ?? [];
  const inputDef = SERVICE_INPUT_OPTIONS[snap.serviceId];

  const setOption = (key: string, value: string) =>
    setDraft((d) => ({ ...d, specOptions: { ...d.specOptions, [key]: value } }));

  const setInput = (patch: Partial<InputOptions>) =>
    setDraft((d) => ({ ...d, inputOptions: { ...d.inputOptions, ...patch } }));

  const inputCls =
    "w-full rounded border border-white/[0.1] bg-white/[0.05] px-2.5 py-1.5 text-sm text-white placeholder:text-white/25 focus:border-orange-400/60 focus:outline-none focus:ring-1 focus:ring-orange-400/20";
  const labelCls = "block text-xs text-white/35 mb-1";

  return (
    <CardBody className="space-y-5">
      {/* Variant */}
      {variants.length > 0 && (
        <div>
          <p className={labelCls}>Wariant</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const active = draft.variantId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, variantId: v.id }))}
                  className="rounded-md border px-3 py-1.5 text-sm transition-all"
                  style={{
                    borderColor: active ? ORANGE : "rgba(255,255,255,0.1)",
                    backgroundColor: active ? `${ORANGE}18` : "transparent",
                    color: active ? ORANGE : "rgba(255,255,255,0.6)",
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input options */}
      {inputDef && (
        <div className="grid grid-cols-2 gap-3">
          {inputDef.showWidth && (
            <div>
              <label className={labelCls}>Szerokość (cm)</label>
              <input
                type="number"
                min={1}
                className={inputCls}
                value={draft.inputOptions.widthCm ?? ""}
                onChange={(e) => setInput({ widthCm: parseFloat(e.target.value) || undefined })}
              />
            </div>
          )}
          {inputDef.showHeight && (
            <div>
              <label className={labelCls}>Wysokość (cm)</label>
              <input
                type="number"
                min={1}
                className={inputCls}
                value={draft.inputOptions.heightCm ?? ""}
                onChange={(e) => setInput({ heightCm: parseFloat(e.target.value) || undefined })}
              />
            </div>
          )}
          {inputDef.showQuantity && (
            <div>
              <label className={labelCls}>{inputDef.quantityLabel ?? "Ilość (szt.)"}</label>
              <input
                type="number"
                min={1}
                className={inputCls}
                value={draft.inputOptions.quantity ?? ""}
                onChange={(e) => setInput({ quantity: parseInt(e.target.value) || undefined })}
              />
            </div>
          )}
        </div>
      )}

      {/* Spec options */}
      {specDefs.map((def) => {
        const currentValue = draft.specOptions[def.key] ?? def.defaultValue;
        return (
          <div key={def.key}>
            <p className={labelCls}>{def.label}</p>
            <div className="flex flex-wrap gap-2">
              {def.choices.map((choice) => {
                const active = currentValue === choice.value;
                return (
                  <button
                    key={choice.value}
                    type="button"
                    onClick={() => setOption(def.key, choice.value)}
                    className="rounded-md border px-3 py-1.5 text-sm transition-all"
                    style={{
                      borderColor: active ? ORANGE : "rgba(255,255,255,0.1)",
                      backgroundColor: active ? `${ORANGE}18` : "transparent",
                      color: active ? ORANGE : "rgba(255,255,255,0.6)",
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

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onClose}
          className="rounded px-3 py-1.5 text-sm text-white/40 hover:text-white/70 border border-white/[0.1] hover:border-white/20 transition-colors"
        >
          Anuluj
        </button>
        <button
          onClick={() => onSave(draft)}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Zapisz
        </button>
      </div>
    </CardBody>
  );
}
