"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INITIAL_FORM_STATE, type OrderFormState, specOptionsToDescription } from "@/lib/business/order-form-types";
import { createOrder } from "@/lib/business/create-order";
import { useOrdersStore } from "@/store/orders-store";
import { useClientsStore } from "@/store/clients-store";
import { useServicesStore } from "@/store/services-store";
import { useProductsStore } from "@/store/products-store";
import { useNotificationsStore } from "@/store/notifications-store";
import { useUserStore } from "@/store/user-store";
import { Step1ClientService } from "./Step1ClientService";
import { Step2Specification } from "./Step2Specification";
import { Step3Pricing } from "./Step3Pricing";
import { Step4Confirm } from "./Step4Confirm";

const STEPS = [
  { number: 1, label: "Klient i usługa", info: "Zacznij od wyboru klienta i co najmniej jednej usługi, którą chcesz wycenić." },
  { number: 2, label: "Specyfikacja", info: "Określ parametry techniczne wybranej usługi — format, materiał, rozdzielczość." },
  { number: 3, label: "Wycena i termin", info: "Podaj tytuł zlecenia, pozycje wyceny, termin realizacji oraz stawkę VAT." },
  { number: 4, label: "Potwierdzenie", info: "Sprawdź wszystkie dane przed wysłaniem. Po potwierdzeniu zlecenie zostanie utworzone." },
];

function validateStep(step: number, state: OrderFormState, linkedProductIds: string[]): string | null {
  if (step === 1) {
    if (!state.clientId) return "Wybierz klienta.";
    if (!state.serviceId && state.selectedProducts.length === 0) return "Wybierz usługę lub dodaj produkty do koszyka.";
  }
  if (step === 3) {
    if (!state.title.trim()) return "Wpisz tytuł zlecenia.";
    if (!state.requestedDeadline) return "Podaj termin realizacji.";
    if (state.items.length === 0) return "Dodaj co najmniej jedną pozycję wyceny.";
  }
  return null;
}

export function CreateOrderForm() {
  const router = useRouter();
  const { addOrder, nextSequence } = useOrdersStore();
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const currentUser = useUserStore((s) => s.currentUser);
  const allClients = useClientsStore((s) => s.clients);
  const services = useServicesStore((s) => s.services);
  const serviceStagesMap = useServicesStore((s) => s.stages);
  const catalogProducts = useProductsStore((s) => s.products);
  const allAttributes = useProductsStore((s) => s.attributes);
  const [step, setStep] = useState(1);
  const [state, setState] = useState<OrderFormState>(INITIAL_FORM_STATE);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const patch = (partial: Partial<OrderFormState>) => {
    setState((s) => ({ ...s, ...partial }));
    setError(null);
  };

  const goNext = () => {
    const selectedService = services.find((s) => s.id === state.serviceId);
    const linkedIds = selectedService?.productIds ?? [];
    const err = validateStep(step, state, linkedIds);
    if (err) { setError(err); return; }
    setError(null);
    const nextStep = Math.min(step + 1, 4);
    if (nextStep === 3) {
      const client = allClients.find((c) => c.id === state.clientId);
      const service = services.find((s) => s.id === state.serviceId);
      const patches: Partial<OrderFormState> = {};
      if (!state.title.trim()) {
        const seq = String(nextSequence).padStart(4, "0");
        patches.title = `${service?.name ?? "Zlecenie"} dla ${client?.name ?? "klienta"} - RIP-2026-${seq}`;
      }
      if (!state.requestedDeadline && service?.estimatedDays) {
        const d = new Date();
        d.setDate(d.getDate() + service.estimatedDays);
        patches.requestedDeadline = d.toISOString().slice(0, 10) + "T12:00:00.000Z";
      }
      if (Object.keys(patches).length > 0) patch(patches);
    }
    setStep(nextStep);
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    const err = validateStep(3, state, []);
    if (err) { setError(err); return; }
    setSubmitting(true);
    try {
      const specDesc = specOptionsToDescription(state.serviceId, state.specOptions);
      const fullDescription = [state.description, specDesc].filter(Boolean).join("\n\n");
      const client = allClients.find((c) => c.id === state.clientId);
      const primaryService = services.find((s) => s.id === state.serviceId);
      const svcStages = serviceStagesMap
        .filter((ss) => ss.serviceId === state.serviceId)
        .sort((a, b) => a.position - b.position);
      const result = createOrder({
        clientId: state.clientId,
        productId: state.productId || undefined,
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
        specSnapshot: {
          serviceId: state.serviceId,
          variantId: state.variantId || undefined,
          specOptions: state.specOptions,
          inputOptions: state.inputOptions,
          productQuantities: state.selectedProducts.length > 0
            ? Object.fromEntries(state.selectedProducts.map((p) => [p.productId, p.qty]))
            : undefined,
          productAttributeValues: Object.keys(state.productAttributeValues).length > 0
            ? state.productAttributeValues
            : undefined,
        },
        actorId: "user-operator-1",
        actorName: "Operator",
        sequenceNumber: nextSequence,
        serviceCategory: primaryService?.category,
        serviceStages: svcStages.length > 0 ? svcStages : undefined,
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
      if (currentUser) {
        addNotification({
          id: `order-created-${result.id}`,
          userId: currentUser.id,
          title: "Nowe zlecenie utworzone",
          message: `${result.orderNumber} — ${result.title}`,
          type: "success",
          priority: "low",
          read: false,
          createdAt: new Date().toISOString(),
          relatedEntityType: "order",
          relatedEntityId: result.id,
          actionUrl: `/orders/${result.id}`,
        });
      }
      router.push(`/orders/${result.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  const currentStepDef = STEPS[step - 1];

  return (
    <div>
      <StepTracker current={step} steps={STEPS} />

      <div style={{
        background: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: 8,
        padding: 32,
        marginTop: 0,
      }}>
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{
            background: "#ff6b35",
            color: "#fff",
            width: 28,
            height: 28,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {step}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", margin: 0 }}>
            {currentStepDef.label}
          </h2>
        </div>

        {/* Step content */}
        {step === 1 && <Step1ClientService state={state} clients={allClients} services={services} catalogProducts={catalogProducts} onChange={patch} />}
        {step === 2 && <Step2Specification state={state} onChange={patch} allAttributes={allAttributes} catalogProducts={catalogProducts} />}
        {step === 3 && <Step3Pricing state={state} clients={allClients} services={services} onChange={patch} />}
        {step === 4 && <Step4Confirm state={state} clients={allClients} services={services} onChange={patch} />}

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 20,
            borderRadius: 6,
            border: "1px solid rgba(255, 85, 85, 0.35)",
            background: "rgba(255, 85, 85, 0.1)",
            padding: "10px 16px",
            fontSize: 13,
            color: "#ff5555",
          }}>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 32 }}>
          <NavButton
            onClick={step === 1 ? () => router.push("/orders") : goBack}
            variant="secondary"
          >
            {step === 1 ? "Anuluj" : "← Wstecz"}
          </NavButton>

          {step < 4 ? (
            <NavButton onClick={goNext} variant="primary">
              Dalej →
            </NavButton>
          ) : (
            <NavButton onClick={handleSubmit} variant="primary" disabled={submitting}>
              {submitting ? "Zapisywanie…" : "Utwórz zlecenie"}
            </NavButton>
          )}
        </div>
      </div>
    </div>
  );
}

function NavButton({
  children,
  onClick,
  variant,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant: "primary" | "secondary";
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const base: React.CSSProperties = {
    padding: "12px 24px",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    opacity: disabled ? 0.5 : 1,
  };

  const styles: Record<string, React.CSSProperties> = {
    primary: {
      ...base,
      background: hovered && !disabled ? "#ff5520" : "#ff6b35",
      color: "#fff",
      transform: hovered && !disabled ? "translateY(-1px)" : "none",
      boxShadow: hovered && !disabled ? "0 4px 12px rgba(255, 107, 53, 0.3)" : "none",
    },
    secondary: {
      ...base,
      background: "transparent",
      border: `1px solid ${hovered ? "#ff6b35" : "#333"}`,
      color: hovered ? "#e0e0e0" : "#b0b0b0",
    },
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={styles[variant]}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}

function StepTracker({ current, steps }: { current: number; steps: typeof STEPS }) {
  return (
    <div style={{ position: "relative", marginBottom: 48 }}>
      {/* Background line */}
      <div style={{
        position: "absolute",
        top: 20,
        left: "calc(12.5%)",
        right: "calc(12.5%)",
        height: 1,
        background: "#333",
        zIndex: 0,
      }} />

      {/* Progress fill */}
      <div style={{
        position: "absolute",
        top: 20,
        left: "calc(12.5%)",
        width: `calc(${((current - 1) / (steps.length - 1)) * 75}%)`,
        height: 1,
        background: "#4ade80",
        zIndex: 0,
        transition: "width 0.4s ease",
      }} />

      <div style={{ display: "flex", position: "relative", zIndex: 1 }}>
        {steps.map((s) => {
          const done = s.number < current;
          const active = s.number === current;
          return (
            <div key={s.number} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Circle */}
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: 16,
                transition: "all 0.3s ease",
                marginBottom: 12,
                ...(done ? {
                  background: "#4ade80",
                  border: "2px solid #4ade80",
                  color: "#fff",
                } : active ? {
                  background: "#ff6b35",
                  border: "2px solid #ff6b35",
                  color: "#fff",
                  boxShadow: "0 0 0 6px rgba(255, 107, 53, 0.15)",
                } : {
                  background: "#1a1a1a",
                  border: "2px solid #333",
                  color: "rgba(255,255,255,0.35)",
                }),
              }}>
                {done ? "✓" : s.number}
              </div>

              {/* Label */}
              <span style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                textAlign: "center",
                transition: "color 0.3s ease",
                ...(done ? { color: "#4ade80", fontWeight: 500 }
                  : active ? { color: "#ff6b35", fontWeight: 600 }
                  : { color: "rgba(255,255,255,0.35)", fontWeight: 400 }),
              }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
