"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductCategory, ProductItem, ProductAttribute, StockMovement, StockMovementType } from "@/types/products";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function now() {
  return new Date().toISOString();
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_CATEGORIES: ProductCategory[] = [
  {
    id: "cat-1",
    name: "Materiały reklamowe",
    slug: "materialy-reklamowe",
    description: "Ulotki, plakaty, banery i inne materiały drukowane",
    colorClass: "bg-blue-500/15 text-blue-400",
    isActive: true,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  },
  {
    id: "cat-2",
    name: "Gadżety firmowe",
    slug: "gadzety-firmowe",
    description: "Kubki, koszulki, długopisy z nadrukiem",
    colorClass: "bg-purple-500/15 text-purple-400",
    isActive: true,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  },
  {
    id: "cat-3",
    name: "Wielkoformatowe",
    slug: "wielkoformatowe",
    description: "Roll-upy, banery PVC, naklejki wielkoformatowe",
    colorClass: "bg-orange-500/15 text-orange-400",
    isActive: true,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  },
];

const SEED_ATTRIBUTES: ProductAttribute[] = [
  {
    id: "attr-1",
    name: "material",
    label: "Materiał",
    type: "select",
    options: [
      { id: "o1", label: "Kreda 130g", value: "kreda-130" },
      { id: "o2", label: "Kreda 170g", value: "kreda-170" },
      { id: "o3", label: "Baner PVC 510g", value: "baner-pvc-510" },
      { id: "o4", label: "Folia samoprzylepna", value: "folia-samoprzylepna" },
    ],
    required: false,
    isActive: true,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  },
  {
    id: "attr-2",
    name: "format",
    label: "Format",
    type: "select",
    options: [
      { id: "o5", label: "A6", value: "A6" },
      { id: "o6", label: "A5", value: "A5" },
      { id: "o7", label: "A4", value: "A4" },
      { id: "o8", label: "A3", value: "A3" },
      { id: "o9", label: "B1", value: "B1" },
      { id: "o10", label: "Własny", value: "custom" },
    ],
    required: false,
    isActive: true,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  },
  {
    id: "attr-3",
    name: "finishing",
    label: "Wykończenie",
    type: "multiselect",
    options: [
      { id: "o11", label: "Laminat matowy", value: "laminat-mat" },
      { id: "o12", label: "Laminat błysk", value: "laminat-blask" },
      { id: "o13", label: "Bigowanie", value: "bigowanie" },
      { id: "o14", label: "Perforacja", value: "perforacja" },
      { id: "o15", label: "Oczka", value: "oczka" },
    ],
    required: false,
    isActive: true,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  },
  {
    id: "attr-4",
    name: "min_quantity",
    label: "Min. nakład",
    type: "number",
    unit: "szt.",
    required: false,
    isActive: true,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  },
  {
    id: "attr-5",
    name: "double_sided",
    label: "Druk dwustronny",
    type: "boolean",
    required: false,
    isActive: true,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  },
];

const SEED_PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    categoryId: "cat-1",
    name: "Ulotka A5",
    slug: "ulotka-a5",
    description: "Ulotka reklamowa w formacie A5, druk cyfrowy",
    sku: "ULT-A5-001",
    price: { amount: 15000, currency: "PLN" },
    attributeIds: ["attr-1", "attr-2", "attr-3", "attr-4", "attr-5"],
    attributeValues: { material: "kreda-130", format: "A5", min_quantity: 100, double_sided: false },
    tags: ["ulotka", "a5", "druk"],
    stock: { enabled: true, qty: 245, minQty: 100, unit: "szt." },
    isActive: true,
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "prod-2",
    categoryId: "cat-1",
    name: "Plakat A3",
    slug: "plakat-a3",
    description: "Plakat promocyjny A3 na papierze kredowanym",
    sku: "PLK-A3-001",
    price: { amount: 800, currency: "PLN" },
    attributeIds: ["attr-1", "attr-2", "attr-3"],
    attributeValues: { material: "kreda-170", format: "A3" },
    tags: ["plakat", "a3"],
    stock: { enabled: true, qty: 12, minQty: 50, unit: "szt." },
    isActive: true,
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "prod-3",
    categoryId: "cat-3",
    name: "Roll-up 85x200",
    slug: "roll-up-85x200",
    description: "Standardowy roll-up 85×200 cm z nadrukiem",
    sku: "RUP-85-001",
    price: { amount: 29900, currency: "PLN" },
    attributeIds: ["attr-1", "attr-4"],
    attributeValues: { material: "baner-pvc-510", min_quantity: 1 },
    tags: ["roll-up", "wielkoformat"],
    stock: { enabled: true, qty: 3, minQty: 10, unit: "szt." },
    isActive: true,
    createdAt: "2026-02-01T10:00:00.000Z",
    updatedAt: "2026-02-01T10:00:00.000Z",
  },
];

const SEED_STOCK_MOVEMENTS: StockMovement[] = [
  // prod-1 (Ulotka A5)
  { id: "sm-1", productId: "prod-1", type: "initial",    qty: 215,  balanceAfter: 215, reason: "Stan początkowy",   createdAt: "2026-01-10T10:00:00.000Z" },
  { id: "sm-2", productId: "prod-1", type: "in",         qty: 50,   balanceAfter: 265, reason: "Dostawa Mar-2026",  createdAt: "2026-03-15T09:00:00.000Z" },
  { id: "sm-3", productId: "prod-1", type: "out",        qty: -20,  balanceAfter: 245, reason: "Zlecenie #00012",   createdAt: "2026-04-20T14:30:00.000Z" },
  // prod-2 (Plakat A3)
  { id: "sm-4", productId: "prod-2", type: "initial",    qty: 50,   balanceAfter: 50,  reason: "Stan początkowy",   createdAt: "2026-01-15T10:00:00.000Z" },
  { id: "sm-5", productId: "prod-2", type: "out",        qty: -38,  balanceAfter: 12,  reason: "Zamówienia klientów", createdAt: "2026-05-01T11:00:00.000Z" },
  // prod-3 (Roll-up 85x200)
  { id: "sm-6", productId: "prod-3", type: "initial",    qty: 5,    balanceAfter: 5,   reason: "Stan początkowy",   createdAt: "2026-02-01T10:00:00.000Z" },
  { id: "sm-7", productId: "prod-3", type: "in",         qty: 3,    balanceAfter: 8,   reason: "Dostawa Kwi-2026",  createdAt: "2026-04-10T10:00:00.000Z" },
  { id: "sm-8", productId: "prod-3", type: "out",        qty: -5,   balanceAfter: 3,   reason: "Zlecenie #00010",   createdAt: "2026-05-10T15:00:00.000Z" },
];

// ─── State ────────────────────────────────────────────────────────────────────

type ProductsState = {
  categories: ProductCategory[];
  attributes: ProductAttribute[];
  products: ProductItem[];
  stockMovements: StockMovement[];

  // Categories
  addCategory: (input: Omit<ProductCategory, "id" | "createdAt" | "updatedAt">) => ProductCategory;
  updateCategory: (id: string, input: Partial<Omit<ProductCategory, "id" | "createdAt">>) => void;
  deleteCategory: (id: string) => void;

  // Attributes
  addAttribute: (input: Omit<ProductAttribute, "id" | "createdAt" | "updatedAt">) => ProductAttribute;
  updateAttribute: (id: string, input: Partial<Omit<ProductAttribute, "id" | "createdAt">>) => void;
  deleteAttribute: (id: string) => void;

  // Products
  addProduct: (input: Omit<ProductItem, "id" | "createdAt" | "updatedAt">) => ProductItem;
  updateProduct: (id: string, input: Partial<Omit<ProductItem, "id" | "createdAt">>) => void;
  deleteProduct: (id: string) => void;

  // Stock
  /** Add a signed qty delta to a product's stock and record a movement. */
  adjustStock: (
    productId: string,
    delta: number,
    type: StockMovementType,
    reason?: string,
  ) => void;
  /** Enable/disable stock tracking, optionally setting initial values. */
  setStockEnabled: (
    productId: string,
    enabled: boolean,
    opts?: { qty?: number; minQty?: number; unit?: string },
  ) => void;
};

export const useProductsStore = create<ProductsState>()(
  persist(
    (set) => ({
      categories: SEED_CATEGORIES,
      attributes: SEED_ATTRIBUTES,
      products: SEED_PRODUCTS,
      stockMovements: SEED_STOCK_MOVEMENTS,

      // ── Categories ──────────────────────────────────────────────────────────
      addCategory: (input) => {
        const cat: ProductCategory = {
          ...input,
          id: `cat-${uid()}`,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ categories: [...s.categories, cat] }));
        return cat;
      },

      updateCategory: (id, input) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, ...input, updatedAt: now() } : c
          ),
        })),

      deleteCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      // ── Attributes ──────────────────────────────────────────────────────────
      addAttribute: (input) => {
        const attr: ProductAttribute = {
          ...input,
          id: `attr-${uid()}`,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ attributes: [...s.attributes, attr] }));
        return attr;
      },

      updateAttribute: (id, input) =>
        set((s) => ({
          attributes: s.attributes.map((a) =>
            a.id === id ? { ...a, ...input, updatedAt: now() } : a
          ),
        })),

      deleteAttribute: (id) =>
        set((s) => ({ attributes: s.attributes.filter((a) => a.id !== id) })),

      // ── Products ─────────────────────────────────────────────────────────────
      addProduct: (input) => {
        const prod: ProductItem = {
          ...input,
          id: `prod-${uid()}`,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ products: [...s.products, prod] }));
        return prod;
      },

      updateProduct: (id, input) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...input, updatedAt: now() } : p
          ),
        })),

      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      // ── Stock ─────────────────────────────────────────────────────────────
      adjustStock: (productId, delta, type, reason) =>
        set((s) => {
          const product = s.products.find((p) => p.id === productId);
          if (!product?.stock) return {};
          const newQty = product.stock.qty + delta;
          const movement: StockMovement = {
            id: `sm-${uid()}`,
            productId,
            type,
            qty: delta,
            balanceAfter: newQty,
            reason,
            createdAt: now(),
          };
          return {
            products: s.products.map((p) =>
              p.id === productId && p.stock
                ? { ...p, stock: { ...p.stock, qty: newQty }, updatedAt: now() }
                : p
            ),
            stockMovements: [...s.stockMovements, movement],
          };
        }),

      setStockEnabled: (productId, enabled, opts) =>
        set((s) => ({
          products: s.products.map((p) => {
            if (p.id !== productId) return p;
            const existing = p.stock;
            return {
              ...p,
              updatedAt: now(),
              stock: {
                enabled,
                qty:    opts?.qty    ?? existing?.qty    ?? 0,
                minQty: opts?.minQty ?? existing?.minQty ?? 0,
                unit:   opts?.unit   ?? existing?.unit   ?? "szt.",
              },
            };
          }),
        })),
    }),
    { name: "riprint-products-store" }
  )
);
