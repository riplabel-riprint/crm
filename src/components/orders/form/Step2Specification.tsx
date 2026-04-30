"use client";

import type { OrderFormState, SpecOptionDef, InputOptions } from "@/lib/business/order-form-types";
import {
  SERVICE_SPEC_OPTIONS,
  SERVICE_VARIANTS,
  SERVICE_INPUT_OPTIONS,
} from "@/lib/business/order-form-types";

type Props = {
  state: OrderFormState;
  onChange: (patch: Partial<OrderFormState>) => void;
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

export function Step2Specification({ state, onChange }: Props) {
  const specDefs = SERVICE_SPEC_OPTIONS[state.serviceId] ?? [];
  const variants = SERVICE_VARIANTS[state.serviceId] ?? [];
  const inputDef = SERVICE_INPUT_OPTIONS[state.serviceId];
  const hasContent = variants.length > 0 || inputDef || specDefs.length > 0;

  const setOption = (key: string, value: string) => {
    onChange({ specOptions: { ...state.specOptions, [key]: value } });
  };
  const setInput = (patch: Partial<InputOptions>) => {
    onChange({ inputOptions: { ...state.inputOptions, ...patch } });
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

      {/* Spec options */}
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
    </div>
  );
}

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
