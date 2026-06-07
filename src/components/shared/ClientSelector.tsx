"use client";

import { useState } from "react";
import { useClientsStore } from "@/store/clients-store";

type Props = {
  /** localStorage key for persisting selected clientId */
  storeKey: string;
  /** Optional label override */
  label?: string;
  /** Called when selection changes */
  onChange?: (clientId: string | null) => void;
  /** Controlled value */
  value?: string | null;
  /** Hides label and selected-client info block — for inline/header use */
  compact?: boolean;
};

export function ClientSelector({ storeKey, label = "Przypisz do klienta", onChange, value, compact = false }: Props) {
  const clients = useClientsStore((s) => s.clients);

  // Uncontrolled mode: persist to localStorage
  const [localId, setLocalId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(storeKey) ?? null;
  });

  const selectedId = value !== undefined ? value : localId;
  const selected = clients.find((c) => c.id === selectedId) ?? null;

  const handleChange = (id: string | null) => {
    if (onChange) {
      onChange(id);
    } else {
      setLocalId(id);
      if (id) localStorage.setItem(storeKey, id);
      else localStorage.removeItem(storeKey);
    }
  };

  if (compact) {
    return (
      <select
        value={selectedId ?? ""}
        onChange={(e) => handleChange(e.target.value || null)}
        className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors"
      >
        <option value="">— Wybierz klienta —</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}{c.type === "Firma" && c.contactPerson ? ` (${c.contactPerson})` : ""}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-500">{label}</label>
      <select
        value={selectedId ?? ""}
        onChange={(e) => handleChange(e.target.value || null)}
        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition-colors"
      >
        <option value="">— Brak klienta —</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}{c.type === "Firma" && c.contactPerson ? ` (${c.contactPerson})` : ""}
          </option>
        ))}
      </select>

      {selected && (
        <div className="mt-1.5 rounded-md bg-gray-50 border border-gray-100 px-3 py-2 text-xs text-gray-600 space-y-0.5">
          {selected.email && <p>✉ {selected.email}</p>}
          {selected.phone && <p>📞 {selected.phone}</p>}
        </div>
      )}

      {clients.length === 0 && (
        <p className="text-xs text-gray-400 italic">
          Brak klientów — dodaj klienta w panelu Klienci.
        </p>
      )}
    </div>
  );
}
