import type { OrderPriority, Money } from "@/types";

// ─── Basic input options (wymiary, ilość) ────────────────────────────────────

export type InputOptions = {
  widthCm?: number;
  heightCm?: number;
  quantity?: number;
};

// ─── Draft item (one pricing line in the form) ───────────────────────────────

export type DraftItem = {
  id: string; // local UUID for React key
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: Money;
  discount?: number;
};

// ─── Full form state (across all 4 steps) ────────────────────────────────────

export type SelectedProduct = { productId: string; qty: number };

export type OrderFormState = {
  // Step 1 — client + service + product
  clientId: string;
  serviceId: string;
  productId: string;
  selectedProducts: SelectedProduct[];

  // Step 2 — variant + input options + spec options
  variantId: string;
  inputOptions: InputOptions;
  specOptions: Record<string, string>;

  // Step 3 — pricing + deadline
  title: string;
  description: string;
  priority: OrderPriority;
  requestedDeadline: string;
  vatRate: number;
  items: DraftItem[];

  // Step 4 — notes (confirm before submit)
  notes: string;

  // Product attribute values — keyed by productId → { attrName: value }
  productAttributeValues: Record<string, Record<string, string | number | boolean | string[]>>;
};

export const INITIAL_FORM_STATE: OrderFormState = {
  clientId: "",
  serviceId: "",
  productId: "",
  selectedProducts: [],
  variantId: "",
  inputOptions: {},
  specOptions: {},
  title: "",
  description: "",
  priority: "normal",
  requestedDeadline: "",
  vatRate: 23,
  items: [],
  notes: "",
  productAttributeValues: {},
};

// ─── Service spec options registry ──────────────────────────────────────────
// Defines what configurable options appear in Step 2 per service category.

export type SpecOptionDef = {
  key: string;
  label: string;
  choices: { value: string; label: string }[];
  defaultValue: string;
};

export const SERVICE_SPEC_OPTIONS: Record<string, SpecOptionDef[]> = {
  "service-001": [ // druk wielkoformatowy - baner PVC
    {
      key: "material",
      label: "Materiał",
      choices: [
        { value: "pvc_510", label: "Baner PVC 510g" },
        { value: "pvc_440", label: "Baner PVC 440g (lekki)" },
        { value: "mesh", label: "Siatka mesh (30% prześwit)" },
        { value: "textile", label: "Tkanina tekstylna" },
        { value: "vinyl_self", label: "Folia samoprzylepna" },
      ],
      defaultValue: "pvc_510",
    },
    {
      key: "resolution",
      label: "Rozdzielczość druku",
      choices: [
        { value: "720", label: "720 dpi (standard)" },
        { value: "1440", label: "1440 dpi (wysoka jakość)" },
      ],
      defaultValue: "720",
    },
    {
      key: "lamination",
      label: "Laminat",
      choices: [
        { value: "none", label: "Bez laminatu" },
        { value: "matte", label: "Laminat matowy" },
        { value: "gloss", label: "Laminat błyszczący" },
      ],
      defaultValue: "none",
    },
    {
      key: "finishing",
      label: "Wykończenie",
      choices: [
        { value: "none", label: "Bez wykończenia" },
        { value: "eyelets_50", label: "Oczka co 50 cm" },
        { value: "eyelets_30", label: "Oczka co 30 cm" },
        { value: "tunnels", label: "Tunele (góra + dół)" },
        { value: "glue", label: "Klejenie na sztywne podłoże" },
      ],
      defaultValue: "none",
    },
  ],
  "service-002": [ // laminat
    {
      key: "lamination_type",
      label: "Rodzaj laminatu",
      choices: [
        { value: "matte", label: "Matowy" },
        { value: "gloss", label: "Błyszczący" },
        { value: "soft_touch", label: "Soft-touch" },
      ],
      defaultValue: "matte",
    },
  ],
  "service-003": [ // oczka
    {
      key: "spacing",
      label: "Rozstaw oczek",
      choices: [
        { value: "50", label: "Co 50 cm" },
        { value: "30", label: "Co 30 cm" },
        { value: "custom", label: "Niestandardowy" },
      ],
      defaultValue: "50",
    },
  ],
};

// ─── Product registry (produkty powiązane z usługą) ──────────────────────────

export type ProductDef = {
  id: string;
  serviceId: string;
  name: string;
  description?: string;
};

export const SERVICE_PRODUCTS: Record<string, ProductDef[]> = {
  "service-001": [
    { id: "prod-001-banner", serviceId: "service-001", name: "Baner zewnętrzny", description: "Trwały baner do ekspozycji na zewnątrz" },
    { id: "prod-001-rollup", serviceId: "service-001", name: "Roll-up", description: "Baner na systemie roll-up (baza w cenie)" },
    { id: "prod-001-mesh", serviceId: "service-001", name: "Siatka mesh", description: "Baner siatkowy — przepuszcza wiatr, do rusztowań" },
  ],
  "service-002": [
    { id: "prod-002-lam", serviceId: "service-002", name: "Laminat arkuszowy", description: "Laminacja na gotowym wydruku arkuszowym" },
    { id: "prod-002-roll", serviceId: "service-002", name: "Laminat rolowy", description: "Laminacja rolowa do dużych formatów" },
  ],
  "service-003": [
    { id: "prod-003-eyelets", serviceId: "service-003", name: "Oczka standardowe", description: "Oczka aluminiowe ø10 mm" },
  ],
};

// ─── Variant registry (warianty usługi) ──────────────────────────────────────

export type VariantDef = {
  id: string;
  serviceId: string;
  productId?: string;
  name: string;
  description?: string;
  priceModifier: number;
};

export const SERVICE_VARIANTS: Record<string, VariantDef[]> = {
  "service-001": [
    { id: "var-001-std",     serviceId: "service-001", name: "Standard",        description: "Druk 720 dpi, realizacja 3–5 dni roboczych", priceModifier: 1.0 },
    { id: "var-001-premium", serviceId: "service-001", name: "Premium",         description: "Druk 1440 dpi, wyższa jakość kolorów",        priceModifier: 1.35 },
    { id: "var-001-express", serviceId: "service-001", name: "Express (24h)",   description: "Realizacja następnego dnia roboczego",         priceModifier: 1.6 },
  ],
  "service-002": [
    { id: "var-002-matte",  serviceId: "service-002", name: "Matowy",        description: "Eliminuje odblaski", priceModifier: 1.0 },
    { id: "var-002-gloss",  serviceId: "service-002", name: "Błyszczący",    description: "Nasycone kolory",    priceModifier: 1.0 },
    { id: "var-002-soft",   serviceId: "service-002", name: "Soft-touch",    description: "Aksamitne wykończenie, premium", priceModifier: 1.5 },
  ],
  "service-003": [
    { id: "var-003-50", serviceId: "service-003", name: "Co 50 cm", priceModifier: 1.0 },
    { id: "var-003-30", serviceId: "service-003", name: "Co 30 cm", description: "Gęstsze rozmieszczenie — większa wytrzymałość", priceModifier: 1.2 },
  ],
};

// ─── Input options config per service ────────────────────────────────────────

export type InputOptionsDef = {
  showWidth: boolean;
  showHeight: boolean;
  showQuantity: boolean;
  quantityLabel?: string;
};

export const SERVICE_INPUT_OPTIONS: Record<string, InputOptionsDef> = {
  "service-001": { showWidth: true, showHeight: true, showQuantity: true, quantityLabel: "Liczba sztuk" },
  "service-002": { showWidth: true, showHeight: true, showQuantity: false },
  "service-003": { showWidth: false, showHeight: false, showQuantity: true, quantityLabel: "Liczba oczek" },
};

// ─── Spec snapshot → human-readable string ───────────────────────────────────

export function specOptionsToDescription(
  serviceId: string,
  options: Record<string, string>
): string {
  const defs = SERVICE_SPEC_OPTIONS[serviceId];
  if (!defs) return "";
  return defs
    .filter((d) => options[d.key] && options[d.key] !== "none")
    .map((d) => {
      const choice = d.choices.find((c) => c.value === options[d.key]);
      return `${d.label}: ${choice?.label ?? options[d.key]}`;
    })
    .join(" · ");
}
