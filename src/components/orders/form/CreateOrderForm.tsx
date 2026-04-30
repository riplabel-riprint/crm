"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client } from "@/types/crm";
import type { Service } from "@/types";
import { INITIAL_FORM_STATE, type OrderFormState, specOptionsToDescription, SERVICE_PRODUCTS } from "@/lib/business/order-form-types";
import { createOrder } from "@/lib/business/create-order";
import { useOrdersStore } from "@/store/orders-store";
import { useClientsStore } from "@/store/clients-store";
import { Step1ClientService } from "./Step1ClientService";
import { Step2Specification } from "./Step2Specification";
import { Step3Pricing } from "./Step3Pricing";
import { Step4Confirm } from "./Step4Confirm";

type Props = { services: Service[] };

const STEPS = [
  { number: 1, label: "Klient i usługa" },
  { number: 2, label: "Specyfikacja" },
  { number: 3, label: "Wycena i termin" },
  { number: 4, label: "Potwierdzenie" },
];

function validateStep(step: number, state: OrderFormState): string | null {
  if (step === 1) {
    if (!state.clientId) return "Wybierz klienta.";
    if (!state.serviceId) return "Wybierz usługę.";
    const products = SERVICE_PRODUCTS[state.serviceId] ?? [];
    if (products.length > 0 && !state.productId) return "Wybierz produkt.";
  }
  if (step === 3) {
    if (!state.title.trim()) return "Wpisz tytuł zlecenia.";
    if (state.items.length === 0) return "Dodaj co najmniej jedną pozycję wyceny.";
  }
  return null;
}

export function CreateOrderForm({ services }: Props) {
  const router = useRouter();
  const { addOrder, nextSequence } = useOrdersStore();
  const allClients = useClientsStore((s) => s.clients);
  const [step, setStep] = useState(1);
  const [state, setState] = useState<OrderFormState>(INITIAL_FORM_STATE);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const patch = (partial: Partial<OrderFormState>) => {
    setState((s) => ({ ...s, ...partial }));
    setError(null);
  };

  const goNext = () => {
    const err = validateStep(step, state);
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => Math.min(s + 1, 4));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    const err = validateStep(3, state);
    if (err) { setError(err); return; }
    setSubmitting(true);
    try {
      const specDesc = specOptionsToDescription(state.serviceId, state.specOptions);
      const fullDescription = [state.description, specDesc].filter(Boolean).join("\n\n");
      const client = allClients.find((c) => c.id === state.clientId);
      const result = createOrder({
        clientId: state.clientId,
        title: state.title,
        description: fullDescription || undefined,
        priority: state.priority,
        requestedDeadline: state.requestedDeadline || undefined,
        items: state.items.map((item) => ({
          serviceId: item.serviceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
        vatRate: state.vatRate,
        actorId: "user-operator-1",
        actorName: "Operator",
        sequenceNumber: nextSequence,
      });
      if (client) {
        result.client = {
          ...result.client,
          displayName: client.name,
          email: client.email ?? result.client.email,
          phone: client.phone ?? result.client.phone,
        } as typeof result.client;
      }
      addOrder(result);
      router.push(`/orders/${result.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <StepIndicator current={step} steps={STEPS} />

      <div className="mt-6 rounded-xl border border-white/[0.07] bg-[#1a1a1a] overflow-hidden">
        {/* Card header */}
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-[15px] font-semibold text-white">
            Krok {step} — {STEPS[step - 1].label}
          </h2>
        </div>

        {/* Card body */}
        <div className="px-6 py-6">
          {step === 1 && <Step1ClientService state={state} clients={allClients} services={services} onChange={patch} />}
          {step === 2 && <Step2Specification state={state} onChange={patch} />}
          {step === 3 && <Step3Pricing state={state} onChange={patch} />}
          {step === 4 && <Step4Confirm state={state} clients={allClients} services={services} onChange={patch} />}

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-4">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/50 hover:border-white/20 hover:text-white/80 disabled:opacity-30 transition-all"
          >
            ← Wstecz
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: "#fe4e00" }}
            >
              Dalej →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg px-6 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: "#fe4e00" }}
            >
              {submitting ? "Zapisywanie…" : "Utwórz zlecenie"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ current, steps }: { current: number; steps: typeof STEPS }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, idx) => {
        const done = s.number < current;
        const active = s.number === current;
        return (
          <div key={s.number} className="flex items-center gap-0 flex-1">
            <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all"
                style={{
                  backgroundColor: done ? "#22c55e" : active ? "#fe4e00" : "rgba(255,255,255,0.08)",
                  color: done || active ? "#fff" : "rgba(255,255,255,0.3)",
                }}
              >
                {done ? "✓" : s.number}
              </div>
              <span
                className="text-center text-xs leading-tight transition-colors"
                style={{ color: active ? "#fff" : "rgba(255,255,255,0.3)", fontWeight: active ? 500 : 400 }}
              >
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className="h-px w-full -mt-5 mb-5"
                style={{ backgroundColor: done ? "#22c55e" : "rgba(255,255,255,0.08)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
