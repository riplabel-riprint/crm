"use client";

import { useState, useMemo } from "react";
import type { Client } from "@/types/crm";
import type { Service, ServiceCategoryDef } from "@/types";
import type { OrderFormState, SelectedProduct } from "@/lib/business/order-form-types";
import type { ProductItem, ProductCategory } from "@/types/products";
import { useServicesStore } from "@/store/services-store";
import { useProductsStore } from "@/store/products-store";
import { cn } from "@/lib/utils";
import {
  Maximize2, Printer, Layers, Scissors, Pen, Truck, Tag,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  print_large_format: Maximize2,
  print_digital:      Printer,
  print_offset:       Layers,
  finishing:          Scissors,
  design:             Pen,
  delivery:           Truck,
  other:              Tag,
};

function ServiceIcon({ categoryId, size = 13 }: { categoryId: string; size?: number }) {
  const Icon = CATEGORY_ICONS[categoryId] ?? Tag;
  return <Icon size={size} style={{ flexShrink: 0, color: "#777" }} />;
}

type Props = {
  state: OrderFormState;
  clients: Client[];
  services: Service[];
  catalogProducts: ProductItem[];
  onChange: (patch: Partial<OrderFormState>) => void;
};

const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: "0.6px",
  marginBottom: 10,
  display: "block",
};

// ─── Client select ────────────────────────────────────────────────────────────

function ClientSelect({ clients, value, onChange }: {
  clients: Client[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        background: "#0f0f0f",
        border: `1px solid ${focused ? "#ff6b35" : "#2a2a2a"}`,
        borderRadius: 8,
        padding: "11px 16px",
        color: value ? "#e0e0e0" : "#555",
        fontSize: 14,
        outline: "none",
        boxShadow: focused ? "0 0 0 2px rgba(255,107,53,0.15)" : "none",
        transition: "all 0.15s",
        cursor: "pointer",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23555' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center",
        paddingRight: 36,
      }}
    >
      <option value="" style={{ background: "#111" }}>— wybierz klienta —</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id} style={{ background: "#111" }}>
          {c.name}{c.companyName && c.companyName !== c.name ? ` (${c.companyName})` : ""}
        </option>
      ))}
    </select>
  );
}

// ─── Service search ───────────────────────────────────────────────────────────

function ServiceSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", marginBottom: 8 }}>
      <svg
        style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        width="14" height="14" viewBox="0 0 16 16" fill="none"
      >
        <circle cx="6.5" cy="6.5" r="5" stroke="#555" strokeWidth="1.5" />
        <path d="M10.5 10.5l3.5 3.5" stroke="#555" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        placeholder="Szukaj usługi…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: "#0a0a0a",
          border: `1px solid ${focused ? "#ff6b35" : "#222"}`,
          borderRadius: 8,
          padding: "9px 12px 9px 34px",
          color: "#e0e0e0",
          fontSize: 13,
          outline: "none",
          boxShadow: focused ? "0 0 0 2px rgba(255,107,53,0.12)" : "none",
          transition: "all 0.15s",
          boxSizing: "border-box",
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: "#555", cursor: "pointer", padding: 2, lineHeight: 1,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Category tree node ───────────────────────────────────────────────────────

function CategoryNode({
  cat,
  services,
  selectedId,
  onSelect,
  forceOpen,
}: {
  cat: ServiceCategoryDef;
  services: Service[];
  selectedId: string;
  onSelect: (id: string) => void;
  forceOpen: boolean;
}) {
  const hasSelected = services.some((s) => s.id === selectedId);
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen !== null ? manualOpen : (forceOpen || hasSelected);

  return (
    <div>
      <button
        type="button"
        onClick={() => setManualOpen((v) => (v === null ? !forceOpen : !v))}
        style={{
          display: "flex", width: "100%", alignItems: "center", gap: 8,
          padding: "6px 10px", borderRadius: 8, background: "none", border: "none",
          cursor: "pointer", textAlign: "left", transition: "background 0.1s",
        }}
        className="hover:bg-white/[0.03]"
      >
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          <path d="M4 2l4 4-4 4" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{
          fontSize: 11, fontWeight: 600, color: "#aaa",
          textTransform: "uppercase", letterSpacing: "0.5px", flex: 1,
        }}>
          {cat.label}
        </span>
        <span style={{ fontSize: 11, color: "#444" }}>{services.length}</span>
      </button>

      {open && (
        <div style={{ marginLeft: 16, borderLeft: "1px solid #1e1e1e", paddingLeft: 10, marginBottom: 4 }}>
          {services.map((svc) => {
            const selected = svc.id === selectedId;
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => onSelect(svc.id)}
                style={{
                  display: "flex", width: "100%", alignItems: "flex-start", gap: 10,
                  padding: "8px 10px", borderRadius: 8, marginBottom: 2,
                  background: selected ? "rgba(255,107,53,0.08)" : "none",
                  border: `1px solid ${selected ? "rgba(255,107,53,0.3)" : "transparent"}`,
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}
                className={selected ? "" : "hover:bg-white/[0.025]"}
              >
                <span style={{ marginTop: 1 }}>
                  <ServiceIcon categoryId={cat.id} size={14} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: selected ? 600 : 400, color: selected ? "#fff" : "#ccc", margin: 0, lineHeight: 1.35 }}>
                    {svc.name}
                  </p>
                  {svc.description && (
                    <p style={{ fontSize: 11, color: "#555", margin: "2px 0 0", lineHeight: 1.4,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {svc.description}
                    </p>
                  )}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: selected ? "#ff6b35" : "#555", flexShrink: 0 }}>
                  {formatBasePrice(svc)}
                </span>
                {selected && (
                  <span style={{
                    flexShrink: 0, width: 16, height: 16, borderRadius: 4,
                    background: "#ff6b35", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1 4.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Product catalogue row ────────────────────────────────────────────────────

function ProductRow({
  product,
  qty,
  onQtyChange,
}: {
  product: ProductItem;
  qty: number;
  onQtyChange: (qty: number) => void;
}) {
  const selected = qty > 0;
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 14px", borderRadius: 10,
        border: `1px solid ${selected ? "rgba(255,107,53,0.35)" : "#222"}`,
        background: selected ? "rgba(255,107,53,0.05)" : "#0a0a0a",
        transition: "all 0.15s",
      }}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onQtyChange(selected ? 0 : 1)}
        style={{
          flexShrink: 0, width: 18, height: 18, borderRadius: 5,
          border: `1.5px solid ${selected ? "#ff6b35" : "#3a3a3a"}`,
          background: selected ? "#ff6b35" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.15s",
        }}
      >
        {selected && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1 4.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Name + desc */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: selected ? 500 : 400, color: selected ? "#fff" : "#ccc", margin: 0, lineHeight: 1.3 }}>
          {product.name}
        </p>
        {product.description && (
          <p style={{ fontSize: 11, color: "#555", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {product.description}
          </p>
        )}
      </div>

      {/* Unit price */}
      {product.price && (
        <span style={{ fontSize: 12, fontWeight: 600, color: selected ? "#ff6b35" : "#555", flexShrink: 0 }}>
          {(product.price.amount / 100).toFixed(2).replace(".", ",")} zł
        </span>
      )}

      {/* Qty stepper */}
      <div style={{
        display: "flex", alignItems: "center",
        border: `1px solid ${selected ? "rgba(255,107,53,0.25)" : "#222"}`,
        borderRadius: 8, overflow: "hidden",
        opacity: selected ? 1 : 0.35,
        pointerEvents: selected ? "auto" : "none",
        transition: "opacity 0.15s",
      }}>
        <button
          type="button"
          onClick={() => onQtyChange(Math.max(0, qty - 1))}
          style={{ width: 30, height: 30, background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}
          className="hover:bg-white/[0.06] hover:text-white transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1.5 5.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <span style={{ width: 28, textAlign: "center", fontSize: 13, fontWeight: 600, color: "#fff" }}>
          {qty}
        </span>
        <button
          type="button"
          onClick={() => onQtyChange(qty + 1)}
          style={{ width: 30, height: 30, background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex", alignItems: "center", justifyContent: "center" }}
          className="hover:bg-white/[0.06] hover:text-white transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1.5v8M1.5 5.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

function Cart({
  items,
  catalogProducts,
  onRemove,
  onQtyChange,
}: {
  items: SelectedProduct[];
  catalogProducts: ProductItem[];
  onRemove: (productId: string) => void;
  onQtyChange: (productId: string, qty: number) => void;
}) {
  const totalQty = items.reduce((s, p) => s + p.qty, 0);
  const totalValue = items.reduce((s, p) => {
    const prod = catalogProducts.find((c) => c.id === p.productId);
    return s + (prod?.price?.amount ?? 0) * p.qty;
  }, 0);

  return (
    <div style={{
      borderRadius: 10,
      border: "1px solid rgba(255,107,53,0.2)",
      background: "rgba(255,107,53,0.03)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderBottom: "1px solid rgba(255,107,53,0.12)",
        background: "rgba(255,107,53,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1h2l1.5 7h6l1.5-5H4" stroke="#ff6b35" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6.5" cy="11.5" r="1" fill="#ff6b35" />
            <circle cx="10.5" cy="11.5" r="1" fill="#ff6b35" />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#ff6b35" }}>
            Koszyk
          </span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ fontSize: 11, color: "#666" }}>{totalQty} szt.</span>
          {totalValue > 0 && (
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>
              {(totalValue / 100).toFixed(2).replace(".", ",")} zł
            </span>
          )}
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: "6px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((item) => {
          const prod = catalogProducts.find((c) => c.id === item.productId);
          if (!prod) return null;
          const lineVal = (prod.price?.amount ?? 0) * item.qty;
          return (
            <div
              key={item.productId}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "7px 8px", borderRadius: 7,
                background: "rgba(255,255,255,0.02)",
              }}
            >
              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#e0e0e0", margin: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {prod.name}
                </p>
                {lineVal > 0 && (
                  <p style={{ fontSize: 11, color: "#555", margin: "1px 0 0" }}>
                    {item.qty} × {(prod.price!.amount / 100).toFixed(2).replace(".", ",")} zł
                  </p>
                )}
              </div>

              {/* Line total */}
              {lineVal > 0 && (
                <span style={{ fontSize: 12, fontWeight: 600, color: "#ff6b35", flexShrink: 0 }}>
                  {(lineVal / 100).toFixed(2).replace(".", ",")} zł
                </span>
              )}

              {/* Inline stepper */}
              <div style={{
                display: "flex", alignItems: "center",
                border: "1px solid #2a2a2a", borderRadius: 6, overflow: "hidden", flexShrink: 0,
              }}>
                <button
                  type="button"
                  onClick={() => onQtyChange(item.productId, Math.max(0, item.qty - 1))}
                  style={{ width: 26, height: 26, background: "none", border: "none", cursor: "pointer", color: "#666", display: "flex", alignItems: "center", justifyContent: "center" }}
                  className="hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
                <span style={{ width: 24, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#fff" }}>
                  {item.qty}
                </span>
                <button
                  type="button"
                  onClick={() => onQtyChange(item.productId, item.qty + 1)}
                  style={{ width: 26, height: 26, background: "none", border: "none", cursor: "pointer", color: "#666", display: "flex", alignItems: "center", justifyContent: "center" }}
                  className="hover:bg-white/[0.06] hover:text-white transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1.5v7M1.5 5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => onRemove(item.productId)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#444", padding: 2, lineHeight: 1, flexShrink: 0 }}
                className="hover:text-red-400 transition-colors"
                title="Usuń z koszyka"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Catalog product category node ───────────────────────────────────────────

function ProductCategoryNode({
  category,
  products,
  getQty,
  onQtyChange,
  forceOpen,
}: {
  category: ProductCategory;
  products: ProductItem[];
  getQty: (id: string) => number;
  onQtyChange: (id: string, qty: number) => void;
  forceOpen: boolean;
}) {
  const hasSelected = products.some((p) => getQty(p.id) > 0);
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen !== null ? manualOpen : (forceOpen || hasSelected);
  const selectedCount = products.filter((p) => getQty(p.id) > 0).length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setManualOpen((v) => (v === null ? !forceOpen : !v))}
        style={{
          display: "flex", width: "100%", alignItems: "center", gap: 8,
          padding: "6px 10px", borderRadius: 8, background: "none", border: "none",
          cursor: "pointer", textAlign: "left", transition: "background 0.1s",
        }}
        className="hover:bg-white/[0.03]"
      >
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          <path d="M4 2l4 4-4 4" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", flex: 1 }}>
          {category.name}
        </span>
        {selectedCount > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 600, color: "#ff6b35",
            background: "rgba(255,107,53,0.15)", borderRadius: 4,
            padding: "1px 6px",
          }}>
            {selectedCount}
          </span>
        )}
        <span style={{ fontSize: 11, color: "#444" }}>{products.length}</span>
      </button>

      {open && (
        <div style={{ marginLeft: 16, borderLeft: "1px solid #1e1e1e", paddingLeft: 10, marginBottom: 4, display: "flex", flexDirection: "column", gap: 6, paddingTop: 4, paddingBottom: 4 }}>
          {products.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              qty={getQty(p.id)}
              onQtyChange={(qty) => onQtyChange(p.id, qty)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main step ────────────────────────────────────────────────────────────────

export function Step1ClientService({ state, clients, services, catalogProducts, onChange }: Props) {
  const { categories: serviceCategories } = useServicesStore();
  const { categories: productCategories } = useProductsStore();
  const [serviceSearch, setServiceSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"service" | "products">("service");

  const selectedClient = clients.find((c) => c.id === state.clientId);
  const activeServices = services.filter((s) => s.isActive);

  // Filter services by search query
  const filteredServices = useMemo(() => {
    const q = serviceSearch.toLowerCase().trim();
    if (!q) return activeServices;
    return activeServices.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q)
    );
  }, [activeServices, serviceSearch]);

  // Group filtered services by category
  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const svc of filteredServices) {
      const arr = map.get(svc.category) ?? [];
      arr.push(svc);
      map.set(svc.category, arr);
    }
    return map;
  }, [filteredServices]);

  const usedCategories = serviceCategories.filter((cat) => (grouped.get(cat.id)?.length ?? 0) > 0);
  const selectedCatId = activeServices.find((s) => s.id === state.serviceId)?.category;

  // All active catalog products grouped by product category
  const activeProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    return catalogProducts.filter(
      (p) => p.isActive && (!q || p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q))
    );
  }, [catalogProducts, productSearch]);

  const productsByCategory = useMemo(() => {
    const map = new Map<string, ProductItem[]>();
    for (const p of activeProducts) {
      const arr = map.get(p.categoryId) ?? [];
      arr.push(p);
      map.set(p.categoryId, arr);
    }
    return map;
  }, [activeProducts]);

  const usedProductCategories = productCategories.filter((c) => (productsByCategory.get(c.id)?.length ?? 0) > 0);

  const handleServiceChange = (serviceId: string) => {
    onChange({ serviceId, productId: "", variantId: "", specOptions: {} });
  };

  const handleQtyChange = (productId: string, qty: number) => {
    const next: SelectedProduct[] = qty === 0
      ? state.selectedProducts.filter((p) => p.productId !== productId)
      : state.selectedProducts.some((p) => p.productId === productId)
        ? state.selectedProducts.map((p) => p.productId === productId ? { ...p, qty } : p)
        : [...state.selectedProducts, { productId, qty }];
    onChange({ selectedProducts: next });
  };

  const getQty = (productId: string) =>
    state.selectedProducts.find((p) => p.productId === productId)?.qty ?? 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 28, alignItems: "start" }}>

      {/* ── Left column ── */}
      <div>
        {/* Client */}
        <div style={{ marginBottom: 28 }}>
          <span style={LABEL}>Klient</span>
          <ClientSelect clients={clients} value={state.clientId} onChange={(id) => onChange({ clientId: id })} />
          {selectedClient && (
            <div style={{
              marginTop: 8, borderRadius: 8, border: "1px solid #222",
              background: "rgba(255,255,255,0.02)", padding: "10px 14px",
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>{selectedClient.name}</p>
              {selectedClient.email && <p style={{ fontSize: 12, color: "#555", margin: "2px 0 0" }}>{selectedClient.email}</p>}
              {selectedClient.phone && <p style={{ fontSize: 12, color: "#555", margin: "1px 0 0" }}>{selectedClient.phone}</p>}
            </div>
          )}
        </div>

        {/* Tab switcher: Usługa / Produkty */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            display: "inline-flex", borderRadius: 8,
            border: "1px solid #222", background: "#0a0a0a", padding: 3, gap: 2,
          }}>
            {(["service", "products"] as const).map((tab) => {
              const active = activeTab === tab;
              const label = tab === "service" ? "Usługa" : "Produkty";
              const badge = tab === "products" && state.selectedProducts.length > 0 ? state.selectedProducts.length : null;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "7px 18px", borderRadius: 6, fontSize: 13, fontWeight: active ? 600 : 400,
                    cursor: "pointer", border: "none", transition: "all 0.15s",
                    background: active ? "#ff6b35" : "transparent",
                    color: active ? "#fff" : "#666",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {label}
                  {badge !== null && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      background: active ? "rgba(255,255,255,0.25)" : "rgba(255,107,53,0.25)",
                      color: active ? "#fff" : "#ff6b35",
                      borderRadius: 4, padding: "1px 5px",
                    }}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Service tab ── */}
        {activeTab === "service" && (
          <div>
            {activeServices.length === 0 ? (
              <div style={{ border: "1px dashed #222", borderRadius: 8, padding: "28px 20px", textAlign: "center", color: "#555", fontSize: 13 }}>
                Brak dostępnych usług.
              </div>
            ) : (
              <div style={{ border: "1px solid #1e1e1e", borderRadius: 10, background: "#0a0a0a", padding: 8 }}>
                <ServiceSearch value={serviceSearch} onChange={setServiceSearch} />

                {usedCategories.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#555", fontSize: 13, padding: "16px 0" }}>
                    Brak wyników dla „{serviceSearch}"
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {usedCategories.map((cat) => (
                      <CategoryNode
                        key={cat.id}
                        cat={cat}
                        services={grouped.get(cat.id) ?? []}
                        selectedId={state.serviceId}
                        onSelect={handleServiceChange}
                        forceOpen={!!serviceSearch || cat.id === selectedCatId || usedCategories.length === 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Products tab ── */}
        {activeTab === "products" && (
          <div>
            {catalogProducts.filter((p) => p.isActive).length === 0 ? (
              <div style={{ border: "1px dashed #222", borderRadius: 8, padding: "28px 20px", textAlign: "center", color: "#555", fontSize: 13 }}>
                Brak produktów w katalogu.
              </div>
            ) : (
              <div style={{ border: "1px solid #1e1e1e", borderRadius: 10, background: "#0a0a0a", padding: 8 }}>
                {/* Product search */}
                <div style={{ position: "relative", marginBottom: 8 }}>
                  <svg
                    style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                    width="14" height="14" viewBox="0 0 16 16" fill="none"
                  >
                    <circle cx="6.5" cy="6.5" r="5" stroke="#555" strokeWidth="1.5" />
                    <path d="M10.5 10.5l3.5 3.5" stroke="#555" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Szukaj produktu…"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    style={{
                      width: "100%", background: "#0a0a0a",
                      border: "1px solid #222", borderRadius: 8,
                      padding: "9px 12px 9px 34px", color: "#e0e0e0",
                      fontSize: 13, outline: "none", boxSizing: "border-box",
                    }}
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch("")}
                      style={{
                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", color: "#555", cursor: "pointer", padding: 2, lineHeight: 1,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>

                {usedProductCategories.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#555", fontSize: 13, padding: "16px 0" }}>
                    Brak wyników dla „{productSearch}"
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {usedProductCategories.map((cat) => (
                      <ProductCategoryNode
                        key={cat.id}
                        category={cat}
                        products={productsByCategory.get(cat.id) ?? []}
                        getQty={getQty}
                        onQtyChange={handleQtyChange}
                        forceOpen={!!productSearch || usedProductCategories.length === 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right column: Cart ── */}
      <div style={{ position: "sticky", top: 24 }}>
        <span style={LABEL}>Koszyk</span>

        {state.selectedProducts.length === 0 ? (
          <div style={{
            borderRadius: 10, border: "1px dashed #222",
            padding: "28px 16px", textAlign: "center",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: "#111",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 10px",
            }}>
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M1 1h2l1.5 7h6l1.5-5H4" stroke="#444" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6.5" cy="11.5" r="1" fill="#444" />
                <circle cx="10.5" cy="11.5" r="1" fill="#444" />
              </svg>
            </div>
            <p style={{ fontSize: 12, color: "#555", margin: 0 }}>
              Zaznacz produkty z listy
            </p>
          </div>
        ) : (
          <Cart
            items={state.selectedProducts}
            catalogProducts={catalogProducts}
            onRemove={(id) => handleQtyChange(id, 0)}
            onQtyChange={handleQtyChange}
          />
        )}
      </div>
    </div>
  );
}

function formatBasePrice(s: Service): string {
  const price = (s.basePrice.amount / 100).toFixed(2).replace(".", ",");
  const models: Record<string, string> = {
    unit: `${price} zł/${s.unit ?? "szt."}`,
    per_sqm: `${price} zł/m²`,
    per_run: `${price} zł/nakład`,
    fixed: `${price} zł`,
    custom: "wycena indyw.",
  };
  return models[s.pricingModel] ?? `${price} zł`;
}
