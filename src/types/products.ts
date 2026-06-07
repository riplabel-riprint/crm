import type { ID, Timestamp, Money } from "./index";

// ─── Product Category ─────────────────────────────────────────────────────────

export type ProductCategory = {
  id: ID;
  name: string;
  slug: string;
  description?: string;
  colorClass: string; // Tailwind bg+text, np. "bg-blue-500/15 text-blue-400"
  parentId?: ID;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// ─── Product Attribute ────────────────────────────────────────────────────────

export type ProductAttributeType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "boolean"
  | "color";

export type ProductAttributeOption = {
  id: ID;
  label: string;
  value: string;
};

export type ProductAttribute = {
  id: ID;
  name: string;   // slug, np. "material"
  label: string;  // etykieta, np. "Materiał"
  type: ProductAttributeType;
  unit?: string;  // np. "mm", "g/m²"
  options?: ProductAttributeOption[];
  required: boolean;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// ─── Product Item ─────────────────────────────────────────────────────────────

export type ProductItem = {
  id: ID;
  categoryId: ID;
  name: string;
  slug: string;
  description?: string;
  sku?: string;
  price?: Money;
  imageUrl?: string;
  attributeValues: Record<string, string | number | boolean | string[]>;
  attributeIds: ID[];   // which attributes are assigned to this product
  tags: string[];
  /** Per-product inventory tracking (optional, enabled per product) */
  stock?: {
    enabled: boolean;
    qty: number;
    minQty: number;   // low-stock warning threshold
    unit: string;     // "szt.", "arkuszy", "rolki", etc.
  };
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// ─── Stock Management ─────────────────────────────────────────────────────────

export type StockMovementType = "initial" | "in" | "out" | "adjustment";

export type StockMovement = {
  id: ID;
  productId: ID;
  type: StockMovementType;
  /** Signed delta: positive = added to stock, negative = removed.
   *  For "initial" type this equals the starting quantity. */
  qty: number;
  /** Absolute stock level after this movement */
  balanceAfter: number;
  reason?: string;
  createdAt: Timestamp;
};
