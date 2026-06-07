"use client";

import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { Check, X, Pencil } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { OrderView } from "@/types/order-view";
import { useServicesStore } from "@/store/services-store";
import { useOrdersStore } from "@/store/orders-store";
import { useClientsStore } from "@/store/clients-store";
import { useNotificationsStore } from "@/store/notifications-store";
import { useUserStore } from "@/store/user-store";
import { SEED_CLIENTS } from "@/lib/data/clients-seed";
import type { OrderStatus, OrderPriority, PaymentMethod } from "@/types";

function formatPLN(amount: number) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", minimumFractionDigits: 2 }).format(amount);
}

function isoToDateInput(iso?: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function dateInputToIso(val: string): string {
  if (!val) return "";
  return val + "T12:00:00.000Z";
}

const STATUS_OPTIONS: { value: OrderStatus; label: string; cls: string }[] = [
  { value: "draft",            label: "Szkic",              cls: "text-white/50 bg-white/[0.06]" },
  { value: "quote_sent",       label: "Wycena wysłana",     cls: "text-blue-300 bg-blue-500/10" },
  { value: "quote_accepted",   label: "Wycena przyjęta",    cls: "text-cyan-300 bg-cyan-500/10" },
  { value: "in_production",    label: "W produkcji",        cls: "text-violet-300 bg-violet-500/10" },
  { value: "ready_for_pickup", label: "Gotowe do odbioru",  cls: "text-amber-300 bg-amber-500/10" },
  { value: "delivered",        label: "Dostarczone",        cls: "text-green-300 bg-green-500/10" },
  { value: "invoiced",         label: "Zafakturowane",      cls: "text-emerald-300 bg-emerald-500/10" },
  { value: "completed",        label: "Zakończone",         cls: "text-green-400 bg-green-500/15" },
  { value: "cancelled",        label: "Anulowane",          cls: "text-red-400 bg-red-500/10" },
];

const PRIORITY_OPTIONS: { value: OrderPriority; label: string; cls: string; dot: string }[] = [
  { value: "low",    label: "Niski",    cls: "text-white/40 bg-white/[0.05]",    dot: "bg-white/30" },
  { value: "normal", label: "Normalny", cls: "text-blue-300 bg-blue-500/10",     dot: "bg-blue-400" },
  { value: "high",   label: "Wysoki",   cls: "text-amber-300 bg-amber-500/10",   dot: "bg-amber-400" },
  { value: "urgent", label: "Pilny",    cls: "text-red-300 bg-red-500/10",       dot: "bg-red-400" },
];

const VAT_RATES = [0, 5, 8, 23];

const inputCls =
  "w-full rounded-md border border-white/[0.12] bg-white/[0.05] px-2.5 py-1.5 text-sm text-white placeholder:text-white/25 focus:border-[#fe4e00]/60 focus:outline-none focus:ring-1 focus:ring-[#fe4e00]/20 transition";

type EditField = "clientDeadline" | "plannedDeadline" | "client" | "pricing" | null;

export function OrderMetaCard({ order }: { order: OrderView & { status?: string; priority?: string } }) {
  const allProducts = useServicesStore((s) => s.products);
  const product = order.productId ? allProducts.find((p) => p.id === order.productId) : undefined;

  const updateStatus    = useOrdersStore((s) => s.updateOrderStatus);
  const updatePriority  = useOrdersStore((s) => s.updateOrderPriority);
  const updateDeadlines = useOrdersStore((s) => s.updateOrderDeadlines);
  const updateClient    = useOrdersStore((s) => s.updateOrderClient);
  const updateFinancials       = useOrdersStore((s) => s.updateOrderFinancials);
  const updatePaymentMethod    = useOrdersStore((s) => s.updateOrderPaymentMethod);
  const liveOrder       = useOrdersStore((s) => s.getOrderById(order.id));

  const storeClients = useClientsStore((s) => s.clients);
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const currentUser = useUserStore((s) => s.currentUser);

  // Merge store clients with seed clients (deduplicate by id)
  const allClients = [
    ...storeClients,
    ...SEED_CLIENTS.filter((sc) => !storeClients.some((c) => c.id === sc.id)),
  ];

  // Live values (prefer store, fall back to view prop)
  const clientDeadline  = liveOrder?.requestedDeadline ?? order.clientDeadline;
  const plannedDeadline = liveOrder?.estimatedDeadline  ?? order.plannedDeadline;
  const clientName      = liveOrder?.client?.displayName ?? order.client.name;
  const clientId        = liveOrder?.clientId ?? order.client.id;
  const netAmount       = liveOrder?.activeRevision
    ? liveOrder.activeRevision.subtotal.amount / 100
    : order.netAmount;
  const vatRate         = liveOrder?.activeRevision?.vatRate ?? order.vatRate;
  const grossAmount     = liveOrder?.activeRevision
    ? liveOrder.activeRevision.total.amount / 100
    : order.grossAmount;
  const paymentMethod   = liveOrder?.paymentMethod ?? undefined;
  const isOverdue = clientDeadline && new Date(clientDeadline) < new Date();

  // Edit state
  const [editField, setEditField] = useState<EditField>(null);
  const [deadlineDraft, setDeadlineDraft]   = useState("");
  const [plannedDraft, setPlannedDraft]     = useState("");
  const [clientDraft, setClientDraft]       = useState("");
  const [clientSearch, setClientSearch]     = useState("");
  const [netDraft, setNetDraft]             = useState(0);
  const [vatDraft, setVatDraft]             = useState(23);

  function startEdit(field: EditField) {
    setEditField(field);
    if (field === "clientDeadline")  setDeadlineDraft(isoToDateInput(clientDeadline));
    if (field === "plannedDeadline") setPlannedDraft(isoToDateInput(plannedDeadline));
    if (field === "client")  { setClientDraft(clientId); setClientSearch(""); }
    if (field === "pricing") { setNetDraft(netAmount); setVatDraft(vatRate); }
  }

  function cancel() { setEditField(null); }

  function saveClientDeadline() {
    updateDeadlines(order.id, { requestedDeadline: deadlineDraft ? dateInputToIso(deadlineDraft) : null });
    setEditField(null);
  }

  function savePlannedDeadline() {
    updateDeadlines(order.id, { estimatedDeadline: plannedDraft ? dateInputToIso(plannedDraft) : null });
    setEditField(null);
  }

  function saveClient() {
    const chosen = allClients.find((c) => c.id === clientDraft);
    if (!chosen) return;
    updateClient(order.id, chosen.id, chosen.name, chosen.email, chosen.phone);
    setEditField(null);
  }

  function savePricing() {
    if (netDraft <= 0) return;
    updateFinancials(order.id, netDraft, vatDraft);
    setEditField(null);
  }

  function fireCompletedConfetti() {
    const colors = ["#fe4e00", "#ff8c4b", "#4ade80", "#facc15", "#fff"];
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { x: 0.5, y: 0.45 },
      colors,
      scalar: 1.2,
      zIndex: 9999,
    });
  }

  function handleStatusChange(newStatus: OrderStatus) {
    if (newStatus === currentStatus.value) return;
    updateStatus(order.id, newStatus);
    if (newStatus === "completed") fireCompletedConfetti();
    if (currentUser) {
      const label = STATUS_OPTIONS.find((s) => s.value === newStatus)?.label ?? newStatus;
      addNotification({
        id: `order-status-${order.id}-${newStatus}-${Date.now()}`,
        userId: currentUser.id,
        title: "Zmiana statusu zlecenia",
        message: `${order.number} — ${order.title}: ${label}`,
        type: "info",
        priority: "low",
        read: false,
        createdAt: new Date().toISOString(),
        relatedEntityType: "order",
        relatedEntityId: order.id,
        actionUrl: `/orders/${order.id}`,
      });
    }
  }

  const currentStatus   = STATUS_OPTIONS.find((s) => s.value === order.status)   ?? STATUS_OPTIONS[0];
  const currentPriority = PRIORITY_OPTIONS.find((p) => p.value === order.priority) ?? PRIORITY_OPTIONS[1];

  const filteredClients = clientSearch.trim()
    ? allClients.filter((c) =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (c.email ?? "").toLowerCase().includes(clientSearch.toLowerCase())
      )
    : allClients;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Szczegóły zlecenia</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3 text-sm">
        {/* Status */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium transition-all",
                  currentStatus.value === opt.value
                    ? opt.cls + " ring-1 ring-white/20"
                    : "text-white/25 bg-white/[0.03] hover:bg-white/[0.07] hover:text-white/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/[0.05]" />

        {/* Priority */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/25 mb-1.5">Priorytet</p>
          <div className="flex gap-1.5">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updatePriority(order.id, opt.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all flex-1 justify-center",
                  currentPriority.value === opt.value
                    ? opt.cls + " ring-1 ring-white/20"
                    : "text-white/25 bg-white/[0.03] hover:bg-white/[0.07] hover:text-white/50"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", opt.dot)} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/[0.05]" />

        {/* Meta rows */}
        <div className="space-y-2">
          <Row label="Numer" value={order.number} mono />

          {product && <Row label="Produkt" value={product.name} />}

          {/* Klient */}
          <div className="flex justify-between gap-2 group/row items-start">
            <span className="text-white/40 shrink-0 pt-0.5">Klient</span>
            {editField === "client" ? (
              <div className="flex-1 min-w-0 space-y-1.5">
                <input
                  autoFocus
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Szukaj klienta…"
                  className={inputCls}
                />
                <div className="max-h-36 overflow-y-auto rounded-md border border-white/[0.1] bg-[#1a1a1a]">
                  {filteredClients.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-white/30">Brak wyników</p>
                  ) : filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setClientDraft(c.id)}
                      className={cn(
                        "w-full px-3 py-2 text-left text-xs transition-colors hover:bg-white/[0.06]",
                        clientDraft === c.id ? "bg-[#fe4e00]/15 text-[#fe4e00]" : "text-white/70"
                      )}
                    >
                      {c.name}
                      {c.email && <span className="ml-1 text-white/30">{c.email}</span>}
                    </button>
                  ))}
                </div>
                <EditActions onSave={saveClient} onCancel={cancel} saveDisabled={!clientDraft} />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
                <Link
                  href={`/clients?client=${order.client.id}`}
                  className="text-white/70 hover:text-orange-400 transition-colors truncate"
                >
                  {clientName}
                </Link>
                <EditIcon onClick={() => startEdit("client")} />
              </div>
            )}
          </div>

          {/* Termin klienta */}
          <div className="flex justify-between gap-2 group/row items-start">
            <span className="text-white/40 shrink-0 pt-0.5">Termin klienta</span>
            {editField === "clientDeadline" ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <input
                  autoFocus
                  type="date"
                  value={deadlineDraft}
                  onChange={(e) => setDeadlineDraft(e.target.value)}
                  className={inputCls + " [color-scheme:dark]"}
                  onKeyDown={(e) => { if (e.key === "Enter") saveClientDeadline(); if (e.key === "Escape") cancel(); }}
                />
                <SaveBtn onClick={saveClientDeadline} />
                <CancelBtn onClick={cancel} />
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  clientDeadline ? (isOverdue ? "text-red-400 font-medium" : "text-white/70") : "text-white/25"
                )}>
                  {clientDeadline ? formatDate(clientDeadline) : "—"}
                </span>
                <EditIcon onClick={() => startEdit("clientDeadline")} />
              </div>
            )}
          </div>

          {/* Termin planowany */}
          <div className="flex justify-between gap-2 group/row items-start">
            <span className="text-white/40 shrink-0 pt-0.5">Termin planowany</span>
            {editField === "plannedDeadline" ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <input
                  autoFocus
                  type="date"
                  value={plannedDraft}
                  onChange={(e) => setPlannedDraft(e.target.value)}
                  className={inputCls + " [color-scheme:dark]"}
                  onKeyDown={(e) => { if (e.key === "Enter") savePlannedDeadline(); if (e.key === "Escape") cancel(); }}
                />
                <SaveBtn onClick={savePlannedDeadline} />
                <CancelBtn onClick={cancel} />
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className={plannedDeadline ? "text-white/70" : "text-white/25"}>
                  {plannedDeadline ? formatDate(plannedDeadline) : "—"}
                </span>
                <EditIcon onClick={() => startEdit("plannedDeadline")} />
              </div>
            )}
          </div>

          {/* Wycena */}
          <div className="flex flex-col gap-2.5">
          <div className="flex justify-between gap-2 group/row items-start">
            <span className="text-white/40 shrink-0 pt-0.5">Wycena</span>
            {editField === "pricing" ? (
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    type="number"
                    min={0}
                    step={0.01}
                    value={netDraft}
                    onChange={(e) => setNetDraft(parseFloat(e.target.value) || 0)}
                    className={inputCls}
                    onKeyDown={(e) => { if (e.key === "Enter") savePricing(); if (e.key === "Escape") cancel(); }}
                  />
                  <span className="text-xs text-white/40 shrink-0">zł netto</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-1">
                    {VAT_RATES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setVatDraft(r)}
                        className={cn(
                          "rounded px-2 py-1 text-xs font-medium transition-all border",
                          vatDraft === r
                            ? "border-[#fe4e00]/50 bg-[#fe4e00]/15 text-[#fe4e00]"
                            : "border-white/[0.1] text-white/40 hover:text-white/60"
                        )}
                      >
                        {r}%
                      </button>
                    ))}
                  </div>
                </div>
                {netDraft > 0 && (
                  <p className="text-[11px] text-white/30">
                    Brutto: {formatPLN(netDraft * (1 + vatDraft / 100))}
                  </p>
                )}
                <EditActions onSave={savePricing} onCancel={cancel} saveDisabled={netDraft <= 0} />
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white/90">{formatPLN(netAmount)}</span>
                {grossAmount !== netAmount && (
                  <span className="text-xs text-white/30">brutto {formatPLN(grossAmount)}</span>
                )}
                <EditIcon onClick={() => startEdit("pricing")} />
              </div>
            )}
          </div>

          {/* Płatność */}
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-sm shrink-0">Płatność</span>
            <div className="flex gap-1.5">
              {(
                [
                  { value: "transfer", label: "Przelew" },
                  { value: "gotowka", label: "Gotówka" },
                  { value: "cash",    label: "Cash"    },
                ] as { value: PaymentMethod; label: string }[]
              ).map((opt) => {
                const active = paymentMethod === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      updatePaymentMethod(order.id, active ? null : opt.value)
                    }
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium transition-all",
                      active
                        ? "border-[#fe4e00]/50 bg-[#fe4e00]/15 text-[#fe4e00]"
                        : "border-white/[0.1] text-white/40 hover:border-white/20 hover:text-white/60"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function EditIcon({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="opacity-0 group-hover/row:opacity-100 shrink-0 rounded p-0.5 text-white/30 hover:text-[#fe4e00] transition-all"
      title="Edytuj"
    >
      <Pencil size={11} />
    </button>
  );
}

function SaveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded p-1 text-green-400 hover:bg-green-400/10 transition-colors"
      title="Zapisz"
    >
      <Check size={13} />
    </button>
  );
}

function CancelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded p-1 text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors"
      title="Anuluj"
    >
      <X size={13} />
    </button>
  );
}

function EditActions({ onSave, onCancel, saveDisabled }: {
  onSave: () => void; onCancel: () => void; saveDisabled?: boolean;
}) {
  return (
    <div className="flex justify-end gap-1.5">
      <button
        type="button"
        onClick={onCancel}
        className="rounded px-2.5 py-1 text-xs text-white/40 hover:text-white/60 border border-white/[0.1] hover:border-white/20 transition-colors"
      >
        Anuluj
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saveDisabled}
        className={cn(
          "rounded px-2.5 py-1 text-xs font-medium transition-colors",
          saveDisabled
            ? "bg-white/[0.05] text-white/20 cursor-not-allowed"
            : "bg-[#fe4e00] text-white hover:bg-[#e04500]"
        )}
      >
        Zapisz
      </button>
    </div>
  );
}

function Row({ label, value, bold, mono, highlight }: {
  label: string; value: string; bold?: boolean; mono?: boolean; highlight?: "red";
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-white/40">{label}</span>
      <span className={cn(
        bold ? "font-semibold text-white/90" : "text-white/70",
        mono ? "font-mono text-xs" : "",
        highlight === "red" ? "text-red-400 font-medium" : "",
      )}>
        {value}
      </span>
    </div>
  );
}
