"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Client, ClientType, Service } from "@/types";
import {
  INITIAL_FORM_STATE,
  type OrderFormState,
  type DraftItem,
  SERVICE_SPEC_OPTIONS,
  specOptionsToDescription,
} from "@/lib/business/order-form-types";
import { createOrder } from "@/lib/business/create-order";
import { useOrdersStore } from "@/store/orders-store";
import { useClientsStore } from "@/store/clients-store";
import { useNotificationsStore } from "@/store/notifications-store";
import { useUserStore } from "@/store/user-store";
import { formatMoney } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  services: Service[];
  onCreated?: () => void;
};

type ClientMode = "existing" | "new";

type NewClientDraft = {
  displayName: string;
  type: ClientType;
  companyName: string;
  taxId: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
};

const EMPTY_NEW_CLIENT: NewClientDraft = {
  displayName: "",
  type: "company",
  companyName: "",
  taxId: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  postalCode: "",
};

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIORITY_OPTIONS = [
  { value: "low", label: "Niski" },
  { value: "normal", label: "Normalny" },
  { value: "high", label: "Wysoki" },
  { value: "urgent", label: "Pilny" },
] as const;

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-slate-400",
  normal: "text-blue-400",
  high: "text-orange-400",
  urgent: "text-red-400",
};

const inputCls = "input-dark";

// ─── Main component ───────────────────────────────────────────────────────────

export function IntakeOrderForm({ services, onCreated }: Props) {
  const router = useRouter();
  const { addOrder, nextSequence } = useOrdersStore();
  const { clients: allClients, addClient: addCrmClient } = useClientsStore();
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const currentUser = useUserStore((s) => s.currentUser);

  const [state, setState] = useState<OrderFormState>(INITIAL_FORM_STATE);
  const [clientMode, setClientMode] = useState<ClientMode>("existing");
  const [newClientData, setNewClientData] = useState<NewClientDraft>(EMPTY_NEW_CLIENT);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const patch = (partial: Partial<OrderFormState>) => {
    setState((s) => ({ ...s, ...partial }));
    setError(null);
  };

  const patchClient = (partial: Partial<NewClientDraft>) => {
    setNewClientData((s) => ({ ...s, ...partial }));
    setError(null);
  };

  const reset = () => {
    setState(INITIAL_FORM_STATE);
    setClientMode("existing");
    setNewClientData(EMPTY_NEW_CLIENT);
    setError(null);
  };

  const switchMode = (mode: ClientMode) => {
    setClientMode(mode);
    patch({ clientId: "" });
    setError(null);
  };

  // ─── Derived values ─────────────────────────────────────────────────────────

  const selectedClient = allClients.find((c) => c.id === state.clientId);
  const selectedService = services.find((s) => s.id === state.serviceId);
  const specDefs = SERVICE_SPEC_OPTIONS[state.serviceId] ?? [];

  const subtotal = state.items.reduce((s, i) => s + i.quantity * i.unitPrice.amount, 0);
  const vatAmount = Math.round(subtotal * (state.vatRate / 100));
  const total = subtotal + vatAmount;

  // client shown in summary
  const summaryClientName =
    clientMode === "existing"
      ? (selectedClient as any)?.displayName ?? (selectedClient as any)?.name
      : newClientData.displayName || undefined;
  const summaryClientEmail =
    clientMode === "existing"
      ? selectedClient?.email
      : newClientData.email || undefined;

  // ─── Validation ──────────────────────────────────────────────────────────────

  const validate = (): string | null => {
    if (clientMode === "existing") {
      if (!state.clientId) return "Wybierz klienta.";
    } else {
      if (!newClientData.displayName.trim()) return "Wpisz nazwę nowego klienta.";
      if (!newClientData.email.trim()) return "Wpisz e-mail nowego klienta.";
    }
    if (!state.serviceId) return "Wybierz usługę.";
    if (!state.title.trim()) return "Wpisz tytuł zlecenia.";
    if (state.items.length === 0) return "Dodaj co najmniej jedną pozycję wyceny.";
    return null;
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setSubmitting(true);
    try {
      let clientId = state.clientId;
      let resolvedClient: Client | undefined = selectedClient as unknown as Client;

      if (clientMode === "new") {
        const now = new Date().toISOString();
        const newClient: Client = {
          id: crypto.randomUUID(),
          type: newClientData.type,
          status: "active",
          displayName: newClientData.displayName.trim(),
          companyName: newClientData.companyName.trim() || undefined,
          taxId: newClientData.taxId.trim() || undefined,
          email: newClientData.email.trim(),
          phone: newClientData.phone.trim() || undefined,
          address:
            newClientData.street || newClientData.city
              ? {
                  street: newClientData.street.trim(),
                  city: newClientData.city.trim(),
                  postalCode: newClientData.postalCode.trim(),
                  country: "PL",
                }
              : undefined,
          notes: undefined,
          tags: [],
          createdAt: now,
          updatedAt: now,
        };
        addCrmClient({
          name: newClientData.displayName.trim(),
          type: newClientData.type === "company" ? "Firma" : "Osoba prywatna",
          email: newClientData.email.trim() || undefined,
          phone: newClientData.phone.trim() || undefined,
          address: newClientData.street ? `${newClientData.street}, ${newClientData.postalCode} ${newClientData.city}`.trim() : undefined,
          status: "Aktywny",
        });
        clientId = newClient.id;
        resolvedClient = newClient;
      }

      const specDesc = specOptionsToDescription(state.serviceId, state.specOptions);
      const fullDescription = [state.description, specDesc].filter(Boolean).join("\n\n");

      const result = createOrder({
        clientId,
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

      result.client = resolvedClient ?? result.client;
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
      if (onCreated) onCreated();
      router.push(`/orders/${result.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Readiness for new client ─────────────────────────────────────────────

  const clientReady =
    clientMode === "existing"
      ? !!state.clientId
      : !!(newClientData.displayName.trim() && newClientData.email.trim());

  return (
    <div className="flex gap-6 items-start">
      {/* ── LEFT: form sections ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* ── Section 1 — Klient ─────────────────────────────────────────── */}
        <FormSection title="1. Klient">
          {/* Mode toggle */}
          <div className="flex gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-1">
            <ModeButton
              active={clientMode === "existing"}
              onClick={() => switchMode("existing")}
            >
              Wybierz istniejącego
            </ModeButton>
            <ModeButton
              active={clientMode === "new"}
              onClick={() => switchMode("new")}
            >
              + Nowy klient
            </ModeButton>
          </div>

          {clientMode === "existing" ? (
            <ExistingClientSection
              clients={allClients as any}
              selectedClientId={state.clientId}
              selectedClient={selectedClient as any}
              onSelect={(id) => patch({ clientId: id })}
            />
          ) : (
            <NewClientSection
              data={newClientData}
              onChange={patchClient}
            />
          )}
        </FormSection>

        {/* ── Section 2 — Szczegóły zlecenia ─────────────────────────────── */}
        <FormSection title="2. Szczegóły zlecenia">
          <Field label="Tytuł zlecenia *">
            <input
              type="text"
              value={state.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="np. Banery na targi Drema 2026"
              className={inputCls}
            />
          </Field>

          <Field label="Opis / uwagi">
            <textarea
              value={state.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={3}
              placeholder="Dodatkowe informacje, wymiary, materiały, uwagi…"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Priorytet">
              <select
                value={state.priority}
                onChange={(e) =>
                  patch({ priority: e.target.value as OrderFormState["priority"] })
                }
                className={inputCls}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Termin realizacji">
              <input
                type="date"
                value={state.requestedDeadline ? state.requestedDeadline.slice(0, 10) : ""}
                onChange={(e) =>
                  patch({
                    requestedDeadline: e.target.value
                      ? `${e.target.value}T12:00:00.000Z`
                      : "",
                  })
                }
                className={inputCls}
              />
            </Field>
          </div>
        </FormSection>

        {/* ── Section 3 — Usługa i specyfikacja ──────────────────────────── */}
        <FormSection title="3. Usługa i specyfikacja">
          <Field label="Usługa *">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {services.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => {
                    const defs = SERVICE_SPEC_OPTIONS[svc.id] ?? [];
                    const defaults = Object.fromEntries(
                      defs.map((d) => [d.key, d.defaultValue])
                    );
                    patch({ serviceId: svc.id, specOptions: defaults });
                  }}
                  className={[
                    "rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-150",
                    state.serviceId === svc.id
                      ? "border-accent bg-[var(--accent-subtle)] text-accent font-medium shadow-[var(--shadow-glow)]"
                      : "border-[var(--border)] bg-[var(--surface-2)] text-text-secondary hover:border-[var(--border-focus)] hover:text-text-primary",
                  ].join(" ")}
                >
                  <span className="block font-medium leading-tight">{svc.name}</span>
                  {svc.description && (
                    <span className="mt-0.5 block text-xs text-text-muted line-clamp-1">
                      {svc.description}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Field>

          {specDefs.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {specDefs.map((def) => (
                <Field key={def.key} label={def.label}>
                  <select
                    value={state.specOptions[def.key] ?? def.defaultValue}
                    onChange={(e) =>
                      patch({
                        specOptions: { ...state.specOptions, [def.key]: e.target.value },
                      })
                    }
                    className={inputCls}
                  >
                    {def.choices.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
          )}
        </FormSection>

        {/* ── Section 4 — Pozycje wyceny ─────────────────────────────────── */}
        <FormSection title="4. Pozycje wyceny">
          <PricingSection state={state} onChange={patch} />
        </FormSection>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-5">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-text-secondary hover:bg-white/5 hover:text-text-primary transition-all duration-150"
          >
            Wyczyść formularz
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="motion-safe rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-accent-hover hover:shadow-[var(--shadow-glow)] disabled:opacity-50 transition-all duration-150"
          >
            {submitting ? "Zapisywanie…" : "Utwórz zlecenie →"}
          </button>
        </div>
      </div>

      {/* ── RIGHT: summary panel ────────────────────────────────────────────── */}
      <div className="w-72 shrink-0">
        <div className="glass-card sticky top-6 overflow-hidden">
          <div className="border-b border-[var(--border-subtle)] px-4 py-3.5">
            <h3 className="text-sm font-semibold text-text-primary tracking-tight">Podsumowanie zlecenia</h3>
          </div>

          <div className="divide-y divide-[var(--border-subtle)] text-sm">
            <SummaryRow label="Klient">
              {summaryClientName ? (
                <div>
                  <span className="font-medium text-text-primary">{summaryClientName}</span>
                  {summaryClientEmail && (
                    <span className="block text-xs text-text-muted">{summaryClientEmail}</span>
                  )}
                  {clientMode === "new" && (
                    <span className="mt-0.5 inline-block rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                      nowy
                    </span>
                  )}
                </div>
              ) : (
                <span className="italic text-text-muted">nie wybrano</span>
              )}
            </SummaryRow>

            <SummaryRow label="Tytuł">
              {state.title ? (
                <span className="font-medium text-text-primary line-clamp-2">{state.title}</span>
              ) : (
                <span className="italic text-text-muted">—</span>
              )}
            </SummaryRow>

            <SummaryRow label="Usługa">
              {selectedService ? (
                <span className="font-medium text-text-primary">{selectedService.name}</span>
              ) : (
                <span className="italic text-text-muted">nie wybrano</span>
              )}
            </SummaryRow>

            {selectedService && specDefs.length > 0 && (
              <SummaryRow label="Specyfikacja">
                <span className="text-text-secondary leading-snug">
                  {specOptionsToDescription(state.serviceId, state.specOptions) || "—"}
                </span>
              </SummaryRow>
            )}

            <SummaryRow label="Priorytet">
              <span className={PRIORITY_COLORS[state.priority] ?? "text-text-secondary"}>
                {PRIORITY_OPTIONS.find((p) => p.value === state.priority)?.label ?? state.priority}
              </span>
            </SummaryRow>

            <SummaryRow label="Termin">
              {state.requestedDeadline ? (
                <span className="text-text-primary tabular-nums">
                  {new Date(state.requestedDeadline).toLocaleDateString("pl-PL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              ) : (
                <span className="italic text-text-muted">—</span>
              )}
            </SummaryRow>

            <SummaryRow label="Pozycje">
              {state.items.length > 0 ? (
                <span className="text-text-primary">{state.items.length} poz.</span>
              ) : (
                <span className="italic text-text-muted">brak</span>
              )}
            </SummaryRow>
          </div>

          {state.items.length > 0 ? (
            <div className="border-t border-[var(--border-subtle)] px-4 py-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Netto</span>
                <span className="tabular-nums">{formatMoney({ amount: subtotal, currency: "PLN" })}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>VAT {state.vatRate}%</span>
                <span className="tabular-nums">{formatMoney({ amount: vatAmount, currency: "PLN" })}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border-subtle)] pt-2 font-semibold text-text-primary">
                <span>Brutto</span>
                <span className="tabular-nums text-accent">{formatMoney({ amount: total, currency: "PLN" })}</span>
              </div>
            </div>
          ) : (
            <div className="border-t border-[var(--border-subtle)] px-4 py-3 text-sm italic text-text-muted">
              Dodaj pozycje wyceny, aby zobaczyć sumę.
            </div>
          )}

          <div className="border-t border-[var(--border-subtle)] px-4 py-3">
            <ReadinessIndicator
              clientReady={clientReady}
              serviceReady={!!state.serviceId}
              titleReady={!!state.title.trim()}
              itemsReady={state.items.length > 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Client sections ──────────────────────────────────────────────────────────

function ExistingClientSection({
  clients,
  selectedClientId,
  selectedClient,
  onSelect,
}: {
  clients: Client[];
  selectedClientId: string;
  selectedClient: Client | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Klient *">
        <select
          value={selectedClientId}
          onChange={(e) => onSelect(e.target.value)}
          className={inputCls}
        >
          <option value="">— wybierz klienta —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}{c.companyName && c.companyName !== c.displayName ? ` (${c.companyName})` : ""}
            </option>
          ))}
        </select>
      </Field>

      {selectedClient && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] divide-y divide-[var(--border-subtle)]">
          {/* Basic data */}
          <div className="px-4 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Dane podstawowe
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <DataRow label="Nazwa" value={selectedClient.displayName} />
              <DataRow
                label="Typ"
                value={selectedClient.type === "company" ? "Firma" : "Osoba fizyczna"}
              />
              {selectedClient.companyName && (
                <DataRow label="Nazwa firmy" value={selectedClient.companyName} />
              )}
              {selectedClient.taxId && (
                <DataRow label="NIP" value={selectedClient.taxId} />
              )}
              <DataRow
                label="Status"
                value={
                  selectedClient.status === "active" ? "Aktywny"
                  : selectedClient.status === "vip" ? "VIP"
                  : selectedClient.status === "inactive" ? "Nieaktywny"
                  : "Zablokowany"
                }
              />
            </dl>
          </div>

          {/* Contact */}
          <div className="px-4 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Kontakt
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <DataRow label="E-mail" value={selectedClient.email} />
              {selectedClient.phone && (
                <DataRow label="Telefon" value={selectedClient.phone} />
              )}
              {selectedClient.address && (
                <DataRow
                  label="Adres"
                  value={[
                    selectedClient.address.street,
                    [selectedClient.address.postalCode, selectedClient.address.city]
                      .filter(Boolean)
                      .join(" "),
                  ]
                    .filter(Boolean)
                    .join(", ")}
                />
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function NewClientSection({
  data,
  onChange,
}: {
  data: NewClientDraft;
  onChange: (partial: Partial<NewClientDraft>) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Basic data */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          Dane podstawowe
        </p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nazwa / imię i nazwisko *">
              <input
                type="text"
                value={data.displayName}
                onChange={(e) => onChange({ displayName: e.target.value })}
                placeholder="np. Jan Kowalski"
                className={inputCls}
              />
            </Field>
            <Field label="Typ klienta">
              <select
                value={data.type}
                onChange={(e) => onChange({ type: e.target.value as ClientType })}
                className={inputCls}
              >
                <option value="company">Firma</option>
                <option value="individual">Osoba fizyczna</option>
              </select>
            </Field>
          </div>

          {data.type === "company" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nazwa firmy">
                <input
                  type="text"
                  value={data.companyName}
                  onChange={(e) => onChange({ companyName: e.target.value })}
                  placeholder="np. Agencja BOLD Sp. z o.o."
                  className={inputCls}
                />
              </Field>
              <Field label="NIP">
                <input
                  type="text"
                  value={data.taxId}
                  onChange={(e) => onChange({ taxId: e.target.value })}
                  placeholder="000-000-00-00"
                  className={inputCls}
                />
              </Field>
            </div>
          )}
        </div>
      </div>

      {/* Contact */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          Kontakt
        </p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Field label="E-mail *">
              <input
                type="email"
                value={data.email}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="kontakt@firma.pl"
                className={inputCls}
              />
            </Field>
            <Field label="Telefon">
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder="+48 000 000 000"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Ulica i numer">
            <input
              type="text"
              value={data.street}
              onChange={(e) => onChange({ street: e.target.value })}
              placeholder="ul. Przykładowa 1/2"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Kod pocztowy">
              <input
                type="text"
                value={data.postalCode}
                onChange={(e) => onChange({ postalCode: e.target.value })}
                placeholder="00-000"
                className={inputCls}
              />
            </Field>
            <Field label="Miasto">
              <input
                type="text"
                value={data.city}
                onChange={(e) => onChange({ city: e.target.value })}
                placeholder="Warszawa"
                className={inputCls}
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150",
        active
          ? "bg-[var(--surface)] text-text-primary shadow-sm border border-[var(--border)]"
          : "text-text-muted hover:text-text-secondary",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="border-b border-[var(--border-subtle)] px-5 py-3.5">
        <h3 className="text-sm font-semibold text-text-primary tracking-tight">{title}</h3>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      {children}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="col-span-1">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-text-secondary">{value}</dd>
    </div>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function ReadinessIndicator({
  clientReady,
  serviceReady,
  titleReady,
  itemsReady,
}: {
  clientReady: boolean;
  serviceReady: boolean;
  titleReady: boolean;
  itemsReady: boolean;
}) {
  const checks = [
    { label: "Klient", ok: clientReady },
    { label: "Usługa", ok: serviceReady },
    { label: "Tytuł", ok: titleReady },
    { label: "Pozycje wyceny", ok: itemsReady },
  ];
  const doneCount = checks.filter((c) => c.ok).length;
  const allDone = doneCount === checks.length;

  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
        Gotowość: {doneCount}/{checks.length}
      </p>
      <ul className="space-y-1.5">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-xs">
            <span
              className={[
                "flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                c.ok
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-white/5 text-text-muted",
              ].join(" ")}
            >
              {c.ok ? "✓" : "·"}
            </span>
            <span className={c.ok ? "text-text-secondary" : "text-text-muted"}>{c.label}</span>
          </li>
        ))}
      </ul>
      {allDone && (
        <p className="mt-2.5 text-xs text-emerald-400 font-medium">
          Formularz gotowy do wysłania.
        </p>
      )}
    </div>
  );
}

// ─── Pricing section ──────────────────────────────────────────────────────────

function PricingSection({
  state,
  onChange,
}: {
  state: OrderFormState;
  onChange: (patch: Partial<OrderFormState>) => void;
}) {
  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newPrice, setNewPrice] = useState("");

  const addItem = () => {
    if (!newDesc || !newPrice) return;
    const item: DraftItem = {
      id: crypto.randomUUID(),
      description: newDesc,
      quantity: parseInt(newQty) || 1,
      unitPrice: {
        amount: Math.round(parseFloat(newPrice.replace(",", ".")) * 100),
        currency: "PLN",
      },
    };
    onChange({ items: [...state.items, item] });
    setNewDesc("");
    setNewQty("1");
    setNewPrice("");
  };

  const removeItem = (id: string) =>
    onChange({ items: state.items.filter((i) => i.id !== id) });

  const updateItem = (id: string, p: Partial<DraftItem>) =>
    onChange({ items: state.items.map((i) => (i.id === id ? { ...i, ...p } : i)) });

  return (
    <div className="space-y-4">
      {state.items.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[10px] text-text-muted uppercase tracking-widest">
              <th className="pb-2 text-left font-semibold">Opis</th>
              <th className="pb-2 text-right font-semibold w-16">Ilość</th>
              <th className="pb-2 text-right font-semibold w-28">Cena jedn.</th>
              <th className="pb-2 text-right font-semibold w-24">Razem</th>
              <th className="pb-2 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {state.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2 pr-2">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-text-primary hover:border-[var(--border)] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                  />
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })
                    }
                    className="w-14 rounded-lg border border-transparent bg-transparent px-1 py-1 text-right text-text-primary hover:border-[var(--border)] focus:border-accent focus:outline-none transition-colors"
                  />
                </td>
                <td className="py-2 text-right text-text-secondary tabular-nums">
                  {formatMoney(item.unitPrice)}
                </td>
                <td className="py-2 text-right font-medium text-text-primary tabular-nums">
                  {formatMoney({ amount: item.quantity * item.unitPrice.amount, currency: "PLN" })}
                </td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-text-muted hover:text-red-400 transition-colors text-lg leading-none"
                    title="Usuń pozycję"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Opis pozycji…"
          className={`${inputCls} flex-1`}
        />
        <input
          type="number"
          min={1}
          value={newQty}
          onChange={(e) => setNewQty(e.target.value)}
          placeholder="Ilość"
          className={`${inputCls} w-20`}
        />
        <input
          type="text"
          inputMode="decimal"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          placeholder="Cena (zł)"
          className={`${inputCls} w-28`}
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!newDesc || !newPrice}
          className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40 transition-all duration-150 shadow-sm shadow-blue-500/20 shrink-0"
        >
          + Dodaj
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-text-secondary shrink-0">Stawka VAT</label>
        <select
          value={state.vatRate}
          onChange={(e) => onChange({ vatRate: parseInt(e.target.value) })}
          className={`${inputCls} w-40`}
        >
          <option value={23}>23%</option>
          <option value={8}>8%</option>
          <option value={5}>5%</option>
          <option value={0}>0% (zwolnione)</option>
        </select>
      </div>
    </div>
  );
}
