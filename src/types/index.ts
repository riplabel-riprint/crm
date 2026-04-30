// ─── Shared primitives ───────────────────────────────────────────────────────

export type ID = string; // UUID

export type Timestamp = string; // ISO-8601

export type Money = {
  amount: number; // in grosze (PLN × 100)
  currency: "PLN";
};

// ─── Client ──────────────────────────────────────────────────────────────────

export type ClientType = "individual" | "company";
export type ClientStatus = "active" | "inactive" | "vip" | "blocked";

export type Client = {
  id: ID;
  type: ClientType;
  status: ClientStatus;

  // identity
  displayName: string; // person name or company name
  companyName?: string;
  taxId?: string; // NIP

  // contact
  email: string;
  phone?: string;
  address?: Address;

  // meta
  notes?: string;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Address = {
  street: string;
  city: string;
  postalCode: string;
  country: string;
};

// ─── Service (cennik usług / produktów) ──────────────────────────────────────

export type ServiceCategory = string; // dynamic — managed in services store

export type ServiceCategoryDef = {
  id: string;
  label: string;
  colorClasses: string; // Tailwind bg+text classes, e.g. "bg-blue-50 text-blue-700"
};

export type PricingModel = "unit" | "per_sqm" | "per_run" | "fixed" | "custom";

export type Service = {
  id: ID;
  name: string;
  category: ServiceCategory;
  pricingModel: PricingModel;
  basePrice: Money;
  unit?: string; // "szt.", "m²", "str."
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// ─── Product (fizyczny produkt powiązany z usługą) ───────────────────────────

export type Product = {
  id: ID;
  serviceId: ID;
  name: string;
  description?: string;
  isActive: boolean;
};

// ─── Service Variant (wariant usługi / produktu) ─────────────────────────────

export type ServiceVariant = {
  id: ID;
  serviceId: ID;
  productId?: ID; // opcjonalne zawężenie do produktu
  name: string;
  description?: string;
  priceModifier: number; // mnożnik ceny, np. 1.0 = brak zmiany, 1.2 = +20%
  isActive: boolean;
};

// ─── Catalog Product (materiał/produkt w katalogu drukarni) ──────────────────

export type CatalogProduct = {
  id: ID;
  name: string;
  description?: string;
  price?: Money;
  category: string;
  isActive: boolean;
};

// ─── Service Product Assignment (produkt przypisany do usługi) ────────────────

export type ServiceProductAssignment = {
  id: ID;
  serviceId: ID;
  catalogProductId: ID;
  name: string;
  description?: string;
  price?: Money;
  variant?: string;
};

// ─── Service Stage & Task (etapy i zadania realizacji usługi) ─────────────────

export type ServiceTaskDefaultStatus = "pending" | "done" | "skipped";

export type ServiceTask = {
  id: ID;
  name: string;
  required: boolean;
  defaultStatus: ServiceTaskDefaultStatus;
};

export type ServiceStage = {
  id: ID;
  serviceId: ID;
  name: string;
  position: number;
  tasks: ServiceTask[];
};

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "draft"
  | "quote_sent"
  | "quote_accepted"
  | "in_production"
  | "ready_for_pickup"
  | "delivered"
  | "invoiced"
  | "completed"
  | "cancelled";

export type OrderPriority = "low" | "normal" | "high" | "urgent";

export type Order = {
  id: ID;
  orderNumber: string; // e.g. "RIP-2026-0042"
  clientId: ID;
  status: OrderStatus;
  priority: OrderPriority;

  title: string;
  description?: string;

  // financials (from active revision)
  estimatedTotal?: Money;
  finalTotal?: Money;

  // timeline
  requestedDeadline?: Timestamp;
  estimatedDeadline?: Timestamp;
  completedAt?: Timestamp;

  // workflow
  workflowId?: ID;
  currentStageId?: ID;

  // meta
  tags: string[];
  assignedTo?: ID; // user/operator ID
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// ─── Order Revision (wycena / rewizja) ───────────────────────────────────────

export type RevisionStatus = "draft" | "sent" | "accepted" | "rejected" | "superseded";

export type OrderRevisionItem = {
  id: ID;
  serviceId?: ID;
  description: string;
  quantity: number;
  unitPrice: Money;
  discount?: number; // percent 0–100
  total: Money;
};

export type OrderRevision = {
  id: ID;
  orderId: ID;
  revisionNumber: number; // 1, 2, 3…
  status: RevisionStatus;

  items: OrderRevisionItem[];
  subtotal: Money;
  vatRate: number; // percent, e.g. 23
  vatAmount: Money;
  total: Money;

  notes?: string;
  validUntil?: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// ─── Workflow (szablon procesu realizacji) ────────────────────────────────────

export type Workflow = {
  id: ID;
  name: string;
  description?: string;
  isDefault: boolean;
  stages: WorkflowStageTemplate[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type WorkflowStageTemplate = {
  id: ID;
  workflowId: ID;
  name: string;
  description?: string;
  position: number; // sort order
  estimatedDurationHours?: number;
  taskTemplates: WorkflowTaskTemplate[];
};

export type WorkflowTaskTemplate = {
  id: ID;
  stageId: ID;
  name: string;
  description?: string;
  position: number;
  isRequired: boolean;
};

// ─── Order Stage (instancja etapu dla konkretnego zlecenia) ──────────────────

export type StageStatus = "pending" | "active" | "completed" | "skipped" | "blocked";

export type OrderStage = {
  id: ID;
  orderId: ID;
  workflowStageTemplateId?: ID;
  name: string;
  position: number;
  status: StageStatus;

  startedAt?: Timestamp;
  completedAt?: Timestamp;
  estimatedDeadline?: Timestamp;

  notes?: string;
  assignedTo?: ID;

  tasks: OrderStageTask[];
};

// ─── Order Stage Task (checklist item) ───────────────────────────────────────

export type TaskStatus = "pending" | "in_progress" | "done" | "skipped";

export type OrderStageTask = {
  id: ID;
  stageId: ID;
  workflowTaskTemplateId?: ID;
  name: string;
  position: number;
  status: TaskStatus;
  isRequired: boolean;

  completedAt?: Timestamp;
  completedBy?: ID;
  notes?: string;
};

// ─── Order Job Spec (specyfikacja techniczna zlecenia) ────────────────────────

export type JobFormat =
  | "A3"
  | "A4"
  | "A5"
  | "B1"
  | "B2"
  | "roll_up"
  | "custom";

export type PrintType =
  | "digital"
  | "offset"
  | "large_format"
  | "screen"
  | "other";

export type DeliveryMethod = "pickup" | "courier" | "own_transport";

export type OrderJobSpec = {
  // format
  format: JobFormat;
  customFormatWidth?: number;  // mm
  customFormatHeight?: number; // mm

  // nakład
  quantity: number;
  unit: string; // "szt.", "m²", "kpl."

  // materiał / papier
  material: string; // wolny tekst, np. "Baner PVC 510g", "Kreda 170g matowa"

  // rodzaj druku
  printType: PrintType;
  printTypeNote?: string;

  // wykończenie
  finishing: string[]; // np. ["laminat matowy", "oczka co 50 cm", "bigowanie"]

  // dostawa / odbiór
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  deliveryNote?: string;

  // własne ustalenia
  customNotes?: string;
};

// ─── Service Field (pola formularza usługi) ───────────────────────────────────

export type ServiceFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "date";

export type ServiceFieldOption = {
  id: ID;
  label: string;
  value: string;
  priceModifier?: number;
};

export type ServiceField = {
  id: ID;
  serviceId: ID;
  name: string;         // klucz w values (slug)
  label: string;        // etykieta widoczna w UI
  type: ServiceFieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string | number | boolean | string[];
  options?: ServiceFieldOption[];
  order: number;
};

// ─── Order Service Configuration ─────────────────────────────────────────────

export type OrderServiceConfiguration = {
  id: ID;
  orderId: ID;
  serviceId: ID;
  values: Record<string, string | number | boolean | string[]>;
};

// ─── Order Event (log zdarzeń / audit trail) ──────────────────────────────────

export type OrderEventType =
  | "order_created"
  | "order_status_changed"
  | "revision_created"
  | "revision_accepted"
  | "revision_rejected"
  | "stage_started"
  | "stage_completed"
  | "task_completed"
  | "comment_added"
  | "file_uploaded"
  | "deadline_changed"
  | "assigned_changed";

export type OrderEvent = {
  id: ID;
  orderId: ID;
  type: OrderEventType;
  actorId?: ID; // user who triggered the event
  actorName?: string; // snapshot of name at event time

  // flexible payload per event type
  payload: Record<string, unknown>;

  comment?: string;
  createdAt: Timestamp;
};
