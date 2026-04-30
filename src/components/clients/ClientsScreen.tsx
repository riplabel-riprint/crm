"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatPLN, grossAmount, formatDatePL, isOverdue, ordersByClient } from "@/lib/data/crm";
import type { Client, ClientStatus, ClientType, Order } from "@/types/crm";
import { useClientsStore, type ClientInput } from "@/store/clients-store";

type Props = {
  orders: Order[];
};

export function ClientsScreen({ orders }: Props) {
  const { clients, addClient, updateClient, deleteClient } = useClientsStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "Wszyscy">("Wszyscy");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return clients.filter((c) => {
      const matchStatus = statusFilter === "Wszyscy" || c.status === statusFilter;
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.contactPerson?.toLowerCase().includes(q) ||
        c.phone?.includes(q);
      return matchStatus && matchSearch;
    });
  }, [clients, search, statusFilter]);

  const active = clients.find((c) => c.id === activeId) ?? null;
  const activeOrders = active ? ordersByClient(orders, active.id) : [];

  const statusFilters: (ClientStatus | "Wszyscy")[] = ["Wszyscy", "Aktywny", "Lead", "Nieaktywny"];

  const handleDelete = (id: string) => {
    deleteClient(id);
    if (activeId === id) setActiveId(null);
  };

  const openAdd = () => {
    setEditingClient(null);
    setShowForm(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleSave = (input: ClientInput) => {
    if (editingClient) {
      updateClient(editingClient.id, input);
      setActiveId(editingClient.id);
    } else {
      const c = addClient(input);
      setActiveId(c.id);
    }
    setShowForm(false);
    setEditingClient(null);
  };

  return (
    <div className="flex h-full min-h-0 bg-[#111111]">
      {/* ── Main table area ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold !text-white tracking-tight">Klienci</h1>
            <p className="mt-0.5 text-[13px] text-[#666]">
              Panel zarządzania klientami i kontrahentami.
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="mt-1 flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-[13px] font-semibold text-black hover:bg-gray-100 transition-colors"
          >
            <span className="text-[16px] leading-none">+</span> Dodaj klienta
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 px-8 pb-5">
          {/* Search */}
          <div className="relative w-72">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555]"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Szukaj klienta…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] py-2 pl-9 pr-3 text-[13px] !text-white placeholder-[#555] outline-none transition focus:border-[#444] focus:bg-[#1f1f1f]"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1.5">
            {statusFilters.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                  statusFilter === s
                    ? "bg-white text-black"
                    : "bg-[#1f1f1f] text-[#888] hover:bg-[#2a2a2a] hover:text-white border border-[#2a2a2a]"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-8 pb-8">
          <div className="min-w-[720px] rounded-xl border border-[#222] overflow-hidden">
            {/* Table head */}
            <div className="grid grid-cols-[2fr_2fr_2fr_1.2fr_1fr_1fr_auto] border-b border-[#222] bg-[#161616] px-5 py-3">
              {["Klient", "Email", "Telefon", "Status", "Typ", "Zlecenia", ""].map((h) => (
                <span key={h} className="text-[12px] font-semibold text-[#555] uppercase tracking-wider">
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 bg-[#161616]">
                <span className="text-3xl">👥</span>
                <p className="text-[14px] text-[#555]">Brak klientów. Dodaj pierwszego!</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 bg-[#161616]">
                <span className="text-3xl">🔍</span>
                <p className="text-[14px] text-[#555]">Brak wyników</p>
              </div>
            ) : (
              filtered.map((client, i) => {
                const orderCount = ordersByClient(orders, client.id).length;
                const isActive = client.id === activeId;
                return (
                  <div
                    key={client.id}
                    className={cn(
                      "grid w-full grid-cols-[2fr_2fr_2fr_1.2fr_1fr_1fr_auto] items-center gap-0 px-5 py-4 transition-colors",
                      i !== filtered.length - 1 && "border-b border-[#1e1e1e]",
                      isActive ? "bg-[#1c1c1c]" : "bg-[#161616] hover:bg-[#1a1a1a]"
                    )}
                  >
                    {/* Klient */}
                    <button
                      type="button"
                      onClick={() => setActiveId(isActive ? null : client.id)}
                      className="flex items-center gap-3 min-w-0 text-left"
                    >
                      <ClientAvatar name={client.name} active={isActive} />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-white leading-tight">
                          {client.name}
                        </p>
                        {client.contactPerson && (
                          <p className="truncate text-[11px] text-white leading-tight mt-0.5">
                            {client.contactPerson}
                          </p>
                        )}
                      </div>
                    </button>

                    {/* Email */}
                    <span className="truncate text-[13px] text-[#888] pr-4">
                      {client.email ?? "—"}
                    </span>

                    {/* Telefon */}
                    <span className="truncate text-[13px] text-[#888] pr-4">
                      {client.phone ?? "—"}
                    </span>

                    {/* Status */}
                    <div>
                      <ClientStatusBadge status={client.status} />
                    </div>

                    {/* Typ */}
                    <div>
                      <TypePill type={client.type} />
                    </div>

                    {/* Zlecenia */}
                    <span className="text-[13px] font-semibold text-white">
                      {orderCount > 0 ? orderCount : <span className="text-[#444]">—</span>}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 pl-2">
                      <button
                        type="button"
                        onClick={() => openEdit(client)}
                        title="Edytuj"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-[#555] hover:text-white hover:bg-[#2a2a2a] transition-colors"
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(client.id)}
                        title="Usuń"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-[#555] hover:text-red-400 hover:bg-[#2a1a1a] transition-colors"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Detail panel ── */}
      {active && !showForm && (
        <aside className="w-[380px] shrink-0 border-l border-[#1e1e1e] overflow-y-auto bg-[#111111]">
          <ClientDetail
            client={active}
            orders={activeOrders}
            onClose={() => setActiveId(null)}
            onEdit={() => openEdit(active)}
            onDelete={() => handleDelete(active.id)}
          />
        </aside>
      )}

      {/* ── Add / Edit form panel ── */}
      {showForm && (
        <aside className="w-[420px] shrink-0 border-l border-[#1e1e1e] overflow-y-auto bg-[#111111]">
          <ClientForm
            initial={editingClient}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingClient(null); }}
          />
        </aside>
      )}
    </div>
  );
}

// ─── Client Form ──────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  type: ClientType;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  status: ClientStatus;
  tags: string;
};

function ClientForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Client | null;
  onSave: (input: ClientInput) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? "",
    type: initial?.type ?? "Firma",
    companyName: initial?.companyName ?? "",
    contactPerson: initial?.contactPerson ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    address: initial?.address ?? "",
    notes: initial?.notes ?? "",
    status: initial?.status ?? "Aktywny",
    tags: initial?.tags?.join(", ") ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    if (!form.name.trim()) { setError("Podaj nazwę klienta."); return; }
    const input: ClientInput = {
      name: form.name.trim(),
      type: form.type,
      companyName: form.companyName.trim() || undefined,
      contactPerson: form.contactPerson.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      notes: form.notes.trim() || undefined,
      status: form.status,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    };
    onSave(input);
  };

  return (
    <div className="px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-white">
          {initial ? "Edytuj klienta" : "Nowy klient"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1e1e1e] text-[#666] hover:text-white transition-colors"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <FormField label="Nazwa *">
          <input
            className={INPUT_CLS}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="np. Jan Kowalski"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Typ">
            <select className={INPUT_CLS} value={form.type} onChange={(e) => set("type", e.target.value as ClientType)}>
              <option value="Firma">Firma</option>
              <option value="Osoba prywatna">Osoba prywatna</option>
            </select>
          </FormField>
          <FormField label="Status">
            <select className={INPUT_CLS} value={form.status} onChange={(e) => set("status", e.target.value as ClientStatus)}>
              <option value="Aktywny">Aktywny</option>
              <option value="Lead">Lead</option>
              <option value="Nieaktywny">Nieaktywny</option>
            </select>
          </FormField>
        </div>

        {form.type === "Firma" && (
          <>
            <FormField label="Nazwa firmy">
              <input className={INPUT_CLS} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="Pełna nazwa prawna" />
            </FormField>
            <FormField label="Osoba kontaktowa">
              <input className={INPUT_CLS} value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} placeholder="Imię i nazwisko" />
            </FormField>
          </>
        )}

        <FormField label="E-mail">
          <input type="email" className={INPUT_CLS} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="adres@przykład.pl" />
        </FormField>

        <FormField label="Telefon">
          <input className={INPUT_CLS} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+48 …" />
        </FormField>

        <FormField label="Adres">
          <input className={INPUT_CLS} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="ul. …" />
        </FormField>

        <FormField label="Tagi (oddzielone przecinkami)">
          <input className={INPUT_CLS} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="stały, agencja, B2B" />
        </FormField>

        <FormField label="Notatki">
          <textarea
            className={cn(INPUT_CLS, "resize-none h-20")}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Dodatkowe informacje…"
          />
        </FormField>
      </div>

      {error && (
        <p className="rounded-lg bg-red-900/30 border border-red-800/50 px-3 py-2 text-[13px] text-red-400">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-[#2a2a2a] py-2 text-[13px] font-medium text-[#888] hover:text-white hover:border-[#444] transition-colors"
        >
          Anuluj
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 rounded-lg bg-white py-2 text-[13px] font-semibold text-black hover:bg-gray-100 transition-colors"
        >
          {initial ? "Zapisz zmiany" : "Dodaj klienta"}
        </button>
      </div>
    </div>
  );
}

const INPUT_CLS =
  "w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-[13px] text-white placeholder-[#555] outline-none focus:border-[#444] transition-colors";

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-[#555]">{label}</label>
      {children}
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function ClientDetail({
  client,
  orders,
  onClose,
  onEdit,
  onDelete,
}: {
  client: Client;
  orders: Order[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="px-6 py-6 space-y-5">
      {/* Close + hero */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1e1e1e] text-base font-bold text-white select-none">
            {initials(client.name)}
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-white tracking-tight leading-tight">
              {client.name}
            </h2>
            {client.companyName && client.companyName !== client.name && (
              <p className="mt-0.5 text-[12px] text-[#666]">{client.companyName}</p>
            )}
            {client.contactPerson && (
              <p className="mt-0.5 text-[12px] text-[#555]">{client.contactPerson}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            title="Edytuj"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1e1e1e] text-[#666] hover:text-white transition-colors"
          >
            <EditIcon />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Usuń"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1e1e1e] text-[#666] hover:text-red-400 hover:bg-[#2a1a1a] transition-colors"
          >
            <TrashIcon />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1e1e1e] text-[#666] hover:text-white transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <ClientStatusBadge status={client.status} />
        <TypePill type={client.type} />
      </div>

      {/* Tags */}
      {client.tags && client.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {client.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#1e1e1e] px-2.5 py-0.5 text-[11px] font-medium text-[#777] border border-[#2a2a2a]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Contact */}
      <DetailSection title="Dane kontaktowe">
        <div className="space-y-3">
          <DetailField icon={<EmailIcon />} label="E-mail" value={client.email} href={client.email ? `mailto:${client.email}` : undefined} />
          <DetailField icon={<PhoneIcon />} label="Telefon" value={client.phone} href={client.phone ? `tel:${client.phone}` : undefined} />
          {client.address && <DetailField icon={<PinIcon />} label="Adres" value={client.address} />}
        </div>
      </DetailSection>

      {/* Notes */}
      {client.notes && (
        <DetailSection title="Notatki">
          <p className="text-[13px] leading-relaxed text-[#888] whitespace-pre-wrap">{client.notes}</p>
        </DetailSection>
      )}

      {/* Orders */}
      <DetailSection title="Zlecenia" badge={orders.length}>
        {orders.length === 0 ? (
          <p className="text-[13px] text-[#555] italic">Brak zleceń.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <ClientOrderRow key={order.id} order={order} />
            ))}
          </div>
        )}
      </DetailSection>
    </div>
  );
}

function ClientOrderRow({ order }: { order: Order }) {
  const overdue = isOverdue(order);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#222] bg-[#161616] px-3.5 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#555]">{order.number}</span>
          <OrderStatusPill status={order.status} />
        </div>
        <p className="mt-0.5 text-[12px] font-medium text-white truncate">{order.title}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[13px] font-bold text-white">{formatPLN(grossAmount(order))}</p>
        {order.clientDeadline && (
          <p className={cn("text-[11px]", overdue ? "font-semibold text-red-400" : "text-[#555]")}>
            {formatDatePL(order.clientDeadline)}
            {overdue && " ⚠"}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Detail helpers ───────────────────────────────────────────────────────────

function DetailSection({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#1e1e1e] bg-[#161616] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#1e1e1e] px-4 py-2.5">
        <h3 className="text-[12px] font-semibold text-white uppercase tracking-wider">{title}</h3>
        {badge !== undefined && (
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold", badge > 0 ? "bg-white/10 text-white" : "bg-[#1e1e1e] text-[#555]")}>
            {badge}
          </span>
        )}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function DetailField({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1e1e1e] text-[#666] mt-0.5">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[#555] leading-none mb-0.5">{label}</p>
        {value ? (
          href ? (
            <a href={href} className="block truncate text-[13px] font-medium text-white hover:text-[#aaa] transition-colors">
              {value}
            </a>
          ) : (
            <p className="truncate text-[13px] font-medium text-white">{value}</p>
          )
        ) : (
          <p className="text-[12px] text-[#444] italic">Nie podano</p>
        )}
      </div>
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const clientStatusConfig: Record<ClientStatus, { label: string; cls: string }> = {
  Aktywny: { label: "Aktywny", cls: "bg-[#1a3a2a] text-[#4ade80] border border-[#2a5a3a]" },
  Lead: { label: "Lead", cls: "bg-[#3a2a00] text-[#fbbf24] border border-[#5a4400]" },
  Nieaktywny: { label: "Nieaktywny", cls: "bg-[#1e1e1e] text-[#666] border border-[#2a2a2a]" },
};

function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const { label, cls } = clientStatusConfig[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", cls)}>
      {label}
    </span>
  );
}

const orderStatusConfig: Record<string, string> = {
  Nowe: "bg-[#0a1a3a] text-[#60a5fa] border border-[#1a3a6a]",
  "W realizacji": "bg-[#1a1040] text-[#a78bfa] border border-[#2a2060]",
  Zakończone: "bg-[#1a3a2a] text-[#4ade80] border border-[#2a5a3a]",
  Anulowane: "bg-[#1e1e1e] text-[#666] border border-[#2a2a2a]",
};

function OrderStatusPill({ status }: { status: string }) {
  const cls = orderStatusConfig[status] ?? "bg-[#1e1e1e] text-[#666] border border-[#2a2a2a]";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", cls)}>
      {status}
    </span>
  );
}

function TypePill({ type }: { type: Client["type"] }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        type === "Firma"
          ? "bg-[#0f1f3a] text-[#60a5fa] border border-[#1a3a6a]"
          : "bg-[#1e1e1e] text-[#888] border border-[#2a2a2a]"
      )}
    >
      {type}
    </span>
  );
}

function ClientAvatar({ name, active }: { name: string; active: boolean }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold select-none transition-colors",
        active ? "bg-white text-black" : "bg-[#1e1e1e] text-[#888]"
      )}
    >
      {initials(name)}
    </span>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function EditIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
      <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9.5 4.5l2 2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M5 4V2.5h6V4M6 7v5M10 7v5M3 4l1 9.5h8L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1.5 4l6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 2h3l1.5 3.5-1.75 1.25a8.5 8.5 0 004.5 4.5L11.5 9.5 15 11v3a1 1 0 01-1 1C6.268 15 1 9.732 1 3a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.5A4.5 4.5 0 0113.5 6c0 3-4.5 8.5-4.5 8.5S4.5 9 4.5 6A4.5 4.5 0 018 1.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
