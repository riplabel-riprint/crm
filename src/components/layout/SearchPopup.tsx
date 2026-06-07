"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, User, X } from "lucide-react";
import { useOrdersStore } from "@/store/orders-store";
import { seedOrders } from "@/lib/data/crm-seed";
import { SEED_CLIENTS } from "@/lib/data/clients-seed";

type SearchResult =
  | { kind: "order"; id: string; number: string; title: string; clientName: string; status: string }
  | { kind: "client"; id: string; name: string; type: string };

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function matchesQuery(haystack: string, query: string) {
  return normalize(haystack).includes(normalize(query));
}

export function SearchPopup() {
  const router = useRouter();
  const storeOrders = useOrdersStore((s) => s.orders);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [focused, setFocused] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(
    (q: string) => {
      if (!q.trim()) { setResults([]); return; }

      const out: SearchResult[] = [];

      // Store orders
      for (const o of storeOrders) {
        const clientName =
          (o.client as { displayName?: string; name?: string })?.displayName ||
          (o.client as { name?: string })?.name || "";
        if (
          matchesQuery(o.number ?? "", q) ||
          matchesQuery(o.title ?? "", q) ||
          matchesQuery(clientName, q)
        ) {
          out.push({
            kind: "order",
            id: o.id,
            number: o.number ?? o.id,
            title: o.title ?? "",
            clientName,
            status: o.status ?? "",
          });
        }
      }

      // Seed orders (not already in store)
      const storeIds = new Set(storeOrders.map((o) => o.id));
      for (const o of seedOrders) {
        if (storeIds.has(o.id)) continue;
        const crmClient = SEED_CLIENTS.find((c) => c.id === o.clientId);
        const clientName = crmClient?.name ?? "";
        if (
          matchesQuery(o.number ?? "", q) ||
          matchesQuery(o.title ?? "", q) ||
          matchesQuery(clientName, q)
        ) {
          out.push({
            kind: "order",
            id: o.id,
            number: o.number ?? o.id,
            title: o.title ?? "",
            clientName,
            status: o.status ?? "",
          });
        }
      }

      // Clients
      for (const c of SEED_CLIENTS) {
        if (
          matchesQuery(c.name ?? "", q) ||
          matchesQuery(c.companyName ?? "", q) ||
          matchesQuery(c.contactPerson ?? "", q)
        ) {
          out.push({ kind: "client", id: c.id, name: c.name, type: c.type ?? "Firma" });
        }
      }

      setResults(out.slice(0, 8));
      setFocused(0);
    },
    [storeOrders]
  );

  useEffect(() => { search(query); }, [query, search]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setFocused((f) => Math.min(f + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocused((f) => Math.max(f - 1, 0)); }
    if (e.key === "Enter" && results[focused]) navigate(results[focused]);
    if (e.key === "Escape") setOpen(false);
  }

  function navigate(r: SearchResult) {
    setOpen(false);
    if (r.kind === "order") router.push(`/orders/${r.id}`);
    else router.push(`/clients`);
  }

  const statusColor: Record<string, string> = {
    "W realizacji": "bg-blue-500/15 text-blue-400",
    "Zakończone":   "bg-green-500/15 text-green-400",
    "Anulowane":    "bg-red-500/15 text-red-400",
    "Nowe":         "bg-orange-500/15 text-orange-400",
    "draft":        "bg-orange-500/15 text-orange-400",
    "in_production":"bg-blue-500/15 text-blue-400",
    "completed":    "bg-green-500/15 text-green-400",
    "cancelled":    "bg-red-500/15 text-red-400",
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors border ${
          open
            ? "border-orange-500 text-orange-500 bg-orange-500/8"
            : "border-transparent text-[var(--text-muted)] hover:text-orange-500 hover:bg-[var(--surface-raised)]"
        }`}
        title="Szukaj (Ctrl+K)"
      >
        <Search size={15} />
        <span className="hidden sm:inline text-[12px]">Szukaj</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] w-[420px] rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-2xl z-50 overflow-hidden"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}
        >
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)]">
            <Search size={15} className="shrink-0 text-[var(--text-muted)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Numer zlecenia, tytuł, klient…"
              className="flex-1 bg-transparent text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Results */}
          {query.trim() && (
            <div className="py-1.5 max-h-[340px] overflow-y-auto">
              {results.length === 0 ? (
                <p className="px-4 py-6 text-center text-[13px] text-[var(--text-muted)]">
                  Brak wyników dla <span className="font-medium text-[var(--text-primary)]">&ldquo;{query}&rdquo;</span>
                </p>
              ) : (
                results.map((r, i) => (
                  <button
                    key={r.kind + r.id}
                    onClick={() => navigate(r)}
                    onMouseEnter={() => setFocused(i)}
                    className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === focused ? "bg-[var(--surface-raised)]" : "hover:bg-[var(--surface-raised)]"
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 rounded-md p-1.5 ${
                      r.kind === "order"
                        ? "bg-orange-500/15 text-orange-400"
                        : "bg-purple-500/15 text-purple-400"
                    }`}>
                      {r.kind === "order" ? <FileText size={13} /> : <User size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {r.kind === "order" ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-[var(--text-muted)]">{r.number}</span>
                            {r.status && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColor[r.status] ?? "bg-gray-500/15 text-gray-400"}`}>
                                {r.status}
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{r.title || "(bez tytułu)"}</p>
                          {r.clientName && (
                            <p className="text-[11px] text-[var(--text-muted)] truncate">{r.clientName}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{r.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">{r.type}</p>
                        </>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Footer hint */}
          {!query.trim() && (
            <div className="px-4 py-4 flex items-center justify-center gap-4 text-[11px] text-[var(--text-muted)]">
              <span><kbd className="font-mono">↑↓</kbd> nawigacja</span>
              <span><kbd className="font-mono">Enter</kbd> otwórz</span>
              <span><kbd className="font-mono">Esc</kbd> zamknij</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
