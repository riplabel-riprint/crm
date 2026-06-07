import type {
  Client,
  Service,
  Product,
  ServiceVariant,
  ServiceField,
  OrderServiceConfiguration,
  Order,
  OrderJobSpec,
  OrderRevision,
  OrderStage,
  OrderStageTask,
  OrderEvent,
} from "@/types";

// ─── Client ──────────────────────────────────────────────────────────────────

export const mockClients: Client[] = [
  {
    id: "client-001",
    type: "company",
    status: "active",
    displayName: "Agencja Kreatywna BOLD",
    companyName: "Agencja Kreatywna BOLD Sp. z o.o.",
    taxId: "7272819234",
    email: "zlecenia@agencjabold.pl",
    phone: "+48 512 300 100",
    address: {
      street: "ul. Piotrkowska 148/5",
      city: "Łódź",
      postalCode: "90-062",
      country: "PL",
    },
    notes: "Stały klient — zamawia regularnie co miesiąc. Preferuje kontakt mailowy.",
    tags: ["stały", "agencja", "priorytety"],
    createdAt: "2024-03-15T10:00:00Z",
    updatedAt: "2026-04-10T09:15:00Z",
  },
];

// ─── Services ────────────────────────────────────────────────────────────────

export const mockServices: Service[] = [
  {
    id: "service-001",
    name: "Druk wielkoformatowy — baner PVC",
    category: "print_large_format",
    pricingModel: "per_sqm",
    basePrice: { amount: 4900, currency: "PLN" }, // 49 PLN/m²
    unit: "m²",
    description: "Druk solwentowy na banerze PVC 510g. Rozdzielczość 720 dpi.",
    isActive: true,
    productIds: [],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2025-11-01T00:00:00Z",
  },
  {
    id: "service-002",
    name: "Laminat matowy",
    category: "finishing",
    pricingModel: "per_sqm",
    basePrice: { amount: 1200, currency: "PLN" }, // 12 PLN/m²
    unit: "m²",
    isActive: true,
    productIds: [],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2025-11-01T00:00:00Z",
  },
  {
    id: "service-003",
    name: "Oczka (ringi) co 50 cm",
    category: "finishing",
    pricingModel: "unit",
    basePrice: { amount: 150, currency: "PLN" }, // 1,50 PLN/szt.
    unit: "szt.",
    isActive: true,
    productIds: [],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2025-11-01T00:00:00Z",
  },
];

// ─── Products ────────────────────────────────────────────────────────────────

export const mockProducts: Product[] = [
  { id: "prod-001-banner", serviceId: "service-001", name: "Baner zewnętrzny",  description: "Trwały baner do ekspozycji na zewnątrz",              price: { amount: 3500, currency: "PLN" }, isActive: true },
  { id: "prod-001-rollup", serviceId: "service-001", name: "Roll-up",           description: "Baner na systemie roll-up (baza w cenie)",             price: { amount: 18000, currency: "PLN" }, isActive: true },
  { id: "prod-001-mesh",   serviceId: "service-001", name: "Siatka mesh",       description: "Baner siatkowy — przepuszcza wiatr, do rusztowań",     price: { amount: 2800, currency: "PLN" }, isActive: true },
  { id: "prod-002-lam",    serviceId: "service-002", name: "Laminat arkuszowy", description: "Laminacja na gotowym wydruku arkuszowym",              price: { amount: 1200, currency: "PLN" }, isActive: true },
  { id: "prod-002-roll",   serviceId: "service-002", name: "Laminat rolowy",    description: "Laminacja rolowa do dużych formatów",                  price: { amount: 900, currency: "PLN" }, isActive: true },
  { id: "prod-003-eyelets",serviceId: "service-003", name: "Oczka standardowe", description: "Oczka aluminiowe ø10 mm",                             price: { amount: 50, currency: "PLN" }, isActive: true },
];

// ─── Service Variants ─────────────────────────────────────────────────────────

export const mockServiceVariants: ServiceVariant[] = [
  { id: "var-001-std",     serviceId: "service-001", name: "Standard",      description: "Druk 720 dpi, realizacja 3–5 dni roboczych", priceModifier: 1.0,  isActive: true },
  { id: "var-001-premium", serviceId: "service-001", name: "Premium",       description: "Druk 1440 dpi, wyższa jakość kolorów",       priceModifier: 1.35, isActive: true },
  { id: "var-001-express", serviceId: "service-001", name: "Express (24h)", description: "Realizacja następnego dnia roboczego",        priceModifier: 1.6,  isActive: true },
  { id: "var-002-matte",   serviceId: "service-002", name: "Matowy",        description: "Eliminuje odblaski",                         priceModifier: 1.0,  isActive: true },
  { id: "var-002-gloss",   serviceId: "service-002", name: "Błyszczący",    description: "Nasycone kolory",                            priceModifier: 1.0,  isActive: true },
  { id: "var-002-soft",    serviceId: "service-002", name: "Soft-touch",    description: "Aksamitne wykończenie, premium",             priceModifier: 1.5,  isActive: true },
  { id: "var-003-50",      serviceId: "service-003", name: "Co 50 cm",      description: undefined,                                    priceModifier: 1.0,  isActive: true },
  { id: "var-003-30",      serviceId: "service-003", name: "Co 30 cm",      description: "Gęstsze — większa wytrzymałość",             priceModifier: 1.2,  isActive: true },
];

// ─── Tasks ────────────────────────────────────────────────────────────────────

const stageTasks: Record<string, OrderStageTask[]> = {
  "stage-001": [
    {
      id: "task-001",
      stageId: "stage-001",
      name: "Potwierdzenie wpłynięcia zlecenia",
      position: 1,
      status: "done",
      isRequired: true,
      completedAt: "2026-04-07T08:30:00Z",
      completedBy: "user-operator-1",
    },
    {
      id: "task-002",
      stageId: "stage-001",
      name: "Weryfikacja danych kontaktowych klienta",
      position: 2,
      status: "done",
      isRequired: true,
      completedAt: "2026-04-07T08:35:00Z",
      completedBy: "user-operator-1",
    },
  ],
  "stage-002": [
    {
      id: "task-003",
      stageId: "stage-002",
      name: "Przygotowanie wyceny",
      position: 1,
      status: "done",
      isRequired: true,
      completedAt: "2026-04-07T11:00:00Z",
      completedBy: "user-operator-1",
    },
    {
      id: "task-004",
      stageId: "stage-002",
      name: "Wysyłka wyceny do klienta",
      position: 2,
      status: "done",
      isRequired: true,
      completedAt: "2026-04-07T11:10:00Z",
      completedBy: "user-operator-1",
    },
    {
      id: "task-005",
      stageId: "stage-002",
      name: "Akceptacja wyceny przez klienta",
      position: 3,
      status: "done",
      isRequired: true,
      completedAt: "2026-04-08T09:00:00Z",
      completedBy: "user-client",
    },
  ],
  "stage-003": [
    {
      id: "task-006",
      stageId: "stage-003",
      name: "Weryfikacja pliku graficznego (format, rozdzielczość)",
      position: 1,
      status: "done",
      isRequired: true,
      completedAt: "2026-04-08T10:30:00Z",
      completedBy: "user-operator-2",
    },
    {
      id: "task-007",
      stageId: "stage-003",
      name: "Korekta rozdzielczości — upscale do 150 dpi",
      position: 2,
      status: "in_progress",
      isRequired: true,
      notes: "Klient dostarczył plik 72 dpi. Wymagana korekta przed drukiem.",
    },
    {
      id: "task-008",
      stageId: "stage-003",
      name: "Export do formatu produkcyjnego (PDF/X-4)",
      position: 3,
      status: "pending",
      isRequired: true,
    },
    {
      id: "task-009",
      stageId: "stage-003",
      name: "Akceptacja soft-proofa przez klienta",
      position: 4,
      status: "pending",
      isRequired: false,
    },
  ],
  "stage-004": [],
  "stage-005": [],
  "stage-006": [],
};

// ─── Stages ──────────────────────────────────────────────────────────────────

const stages: OrderStage[] = [
  {
    id: "stage-001",
    orderId: "order-001",
    name: "Przyjęcie zlecenia",
    position: 1,
    status: "completed",
    startedAt: "2026-04-07T08:00:00Z",
    completedAt: "2026-04-07T08:40:00Z",
    tasks: stageTasks["stage-001"],
  },
  {
    id: "stage-002",
    orderId: "order-001",
    name: "Wycena i akceptacja",
    position: 2,
    status: "completed",
    startedAt: "2026-04-07T09:00:00Z",
    completedAt: "2026-04-08T09:15:00Z",
    tasks: stageTasks["stage-002"],
  },
  {
    id: "stage-003",
    orderId: "order-001",
    name: "Przygotowanie pliku",
    position: 3,
    status: "active",
    startedAt: "2026-04-08T10:00:00Z",
    estimatedDeadline: "2026-04-09T16:00:00Z",
    assignedTo: "user-operator-2",
    tasks: stageTasks["stage-003"],
  },
  {
    id: "stage-004",
    orderId: "order-001",
    name: "Druk",
    position: 4,
    status: "pending",
    tasks: stageTasks["stage-004"],
  },
  {
    id: "stage-005",
    orderId: "order-001",
    name: "Uszlachetnianie (laminat + oczka)",
    position: 5,
    status: "pending",
    tasks: stageTasks["stage-005"],
  },
  {
    id: "stage-006",
    orderId: "order-001",
    name: "Wydanie / dostawa",
    position: 6,
    status: "pending",
    tasks: stageTasks["stage-006"],
  },
];

// ─── Orders ──────────────────────────────────────────────────────────────────

export const mockOrders: (Order & {
  stages: OrderStage[];
  activeRevision: OrderRevision;
  jobSpec?: OrderJobSpec;
  events: OrderEvent[];
})[] = [
  {
    id: "order-001",
    orderNumber: "RIP-2026-0042",
    clientId: "client-001",
    status: "in_production",
    priority: "high",
    title: "Banery na targi Drema 2026",
    description:
      "3 sztuki banerów PVC 2m × 1m z nadrukiem logo i claimem. Laminat matowy. Oczka co 50 cm obwodowo.",
    estimatedTotal: { amount: 99600, currency: "PLN" }, // 996 PLN
    requestedDeadline: "2026-04-20T12:00:00Z",
    estimatedDeadline: "2026-04-19T16:00:00Z",
    workflowId: "workflow-001",
    currentStageId: "stage-003",
    tags: ["targi", "pilne", "baner"],
    assignedTo: "user-operator-1",
    createdAt: "2026-04-07T07:55:00Z",
    updatedAt: "2026-04-08T10:30:00Z",

    stages,

    jobSpec: {
      format: "custom",
      customFormatWidth: 2000,
      customFormatHeight: 1000,
      quantity: 3,
      unit: "szt.",
      material: "Baner PVC 510g — druk solwentowy",
      printType: "large_format",
      finishing: ["Laminat matowy", "Oczka aluminiowe co 50 cm"],
      deliveryMethod: "pickup",
      deliveryNote: "Odbiór osobisty — poinformować klienta SMS-em",
      customNotes: "Klient prosi o miękkie zwijanie (bez łamania). Etykiety z numerami na odwrocie każdego banera.",
    },

    activeRevision: {
      id: "revision-001",
      orderId: "order-001",
      revisionNumber: 1,
      status: "accepted",
      items: [
        {
          id: "ritem-001",
          serviceId: "service-001",
          description: "Druk baner PVC 510g — 3 szt. × 2m²",
          quantity: 6,
          unitPrice: { amount: 4900, currency: "PLN" },
          total: { amount: 29400, currency: "PLN" },
        },
        {
          id: "ritem-002",
          serviceId: "service-002",
          description: "Laminat matowy — 3 szt. × 2m²",
          quantity: 6,
          unitPrice: { amount: 1200, currency: "PLN" },
          total: { amount: 7200, currency: "PLN" },
        },
        {
          id: "ritem-003",
          serviceId: "service-003",
          description: "Oczka co 50 cm — szacunkowo 54 szt.",
          quantity: 54,
          unitPrice: { amount: 150, currency: "PLN" },
          total: { amount: 8100, currency: "PLN" },
        },
      ],
      subtotal: { amount: 44700, currency: "PLN" },
      vatRate: 23,
      vatAmount: { amount: 10281, currency: "PLN" },
      total: { amount: 54981, currency: "PLN" },
      validUntil: "2026-04-21T00:00:00Z",
      createdAt: "2026-04-07T11:00:00Z",
      updatedAt: "2026-04-08T09:00:00Z",
    },

    events: [
      {
        id: "evt-001",
        orderId: "order-001",
        type: "order_created",
        actorId: "user-operator-1",
        actorName: "Marek Wiśniewski",
        payload: {},
        createdAt: "2026-04-07T07:55:00Z",
      },
      {
        id: "evt-002",
        orderId: "order-001",
        type: "revision_created",
        actorId: "user-operator-1",
        actorName: "Marek Wiśniewski",
        payload: { revisionNumber: 1, total: 54981 },
        createdAt: "2026-04-07T11:00:00Z",
      },
      {
        id: "evt-003",
        orderId: "order-001",
        type: "stage_started",
        actorId: "user-operator-1",
        actorName: "Marek Wiśniewski",
        payload: { stageName: "Przyjęcie zlecenia" },
        createdAt: "2026-04-07T08:00:00Z",
      },
      {
        id: "evt-004",
        orderId: "order-001",
        type: "stage_completed",
        actorId: "user-operator-1",
        actorName: "Marek Wiśniewski",
        payload: { stageName: "Przyjęcie zlecenia" },
        createdAt: "2026-04-07T08:40:00Z",
      },
      {
        id: "evt-005",
        orderId: "order-001",
        type: "revision_accepted",
        actorId: "user-client",
        actorName: "Anna Kowalczyk (klient)",
        payload: { revisionNumber: 1 },
        comment: "Akceptuję wycenę. Proszę o pilną realizację.",
        createdAt: "2026-04-08T09:00:00Z",
      },
      {
        id: "evt-006",
        orderId: "order-001",
        type: "order_status_changed",
        actorId: "user-operator-1",
        actorName: "Marek Wiśniewski",
        payload: { from: "quote_accepted", to: "in_production" },
        createdAt: "2026-04-08T09:15:00Z",
      },
      {
        id: "evt-007",
        orderId: "order-001",
        type: "stage_started",
        actorId: "user-operator-1",
        actorName: "Marek Wiśniewski",
        payload: { stageName: "Przygotowanie pliku" },
        createdAt: "2026-04-08T10:00:00Z",
      },
      {
        id: "evt-008",
        orderId: "order-001",
        type: "comment_added",
        actorId: "user-operator-2",
        actorName: "Joanna Nowak",
        payload: {},
        comment: "Plik dostarczony przez klienta ma rozdzielczość 72 dpi. Wykonuję upscale — wyślę soft-proof do akceptacji.",
        createdAt: "2026-04-08T10:35:00Z",
      },
    ],
  },
];

// ─── Service Fields ───────────────────────────────────────────────────────────

export const mockServiceFields: ServiceField[] = [
  // service-001: Druk wielkoformatowy — baner PVC
  {
    id: "field-001-1", serviceId: "service-001", name: "width", label: "Szerokość (cm)",
    type: "number", required: true, placeholder: "np. 200",
    helpText: "Podaj szerokość w centymetrach", order: 1,
  },
  {
    id: "field-001-2", serviceId: "service-001", name: "height", label: "Wysokość (cm)",
    type: "number", required: true, placeholder: "np. 100", order: 2,
  },
  {
    id: "field-001-3", serviceId: "service-001", name: "quantity", label: "Nakład (szt.)",
    type: "number", required: true, defaultValue: 1, order: 3,
  },
  {
    id: "field-001-4", serviceId: "service-001", name: "material", label: "Materiał",
    type: "select", required: true,
    options: [
      { id: "opt-m1", label: "Baner PVC 510g", value: "pvc_510g" },
      { id: "opt-m2", label: "Baner PVC 440g", value: "pvc_440g", priceModifier: -5 },
      { id: "opt-m3", label: "Siatka mesh 270g", value: "mesh_270g", priceModifier: 10 },
    ],
    order: 4,
  },
  {
    id: "field-001-5", serviceId: "service-001", name: "resolution", label: "Rozdzielczość druku",
    type: "radio", required: true, defaultValue: "720dpi",
    options: [
      { id: "opt-r1", label: "720 dpi (Standard)", value: "720dpi" },
      { id: "opt-r2", label: "1440 dpi (Premium)", value: "1440dpi", priceModifier: 35 },
    ],
    order: 5,
  },
  {
    id: "field-001-6", serviceId: "service-001", name: "finishing", label: "Wykończenie",
    type: "multiselect",
    options: [
      { id: "opt-f1", label: "Laminat matowy", value: "lam_matte", priceModifier: 12 },
      { id: "opt-f2", label: "Laminat błyszczący", value: "lam_gloss", priceModifier: 12 },
      { id: "opt-f3", label: "Oczka co 50 cm", value: "eyelets_50", priceModifier: 8 },
      { id: "opt-f4", label: "Szew zgrzewany", value: "seam", priceModifier: 5 },
    ],
    order: 6,
  },
  {
    id: "field-001-7", serviceId: "service-001", name: "notes", label: "Uwagi do projektu",
    type: "textarea", placeholder: "Dodatkowe informacje dla drukarni…", order: 7,
  },

  // service-002: Laminat matowy
  {
    id: "field-002-1", serviceId: "service-002", name: "laminatType", label: "Rodzaj laminatu",
    type: "radio", required: true, defaultValue: "matte",
    options: [
      { id: "opt-l1", label: "Matowy", value: "matte" },
      { id: "opt-l2", label: "Błyszczący", value: "gloss" },
      { id: "opt-l3", label: "Soft-touch", value: "soft_touch", priceModifier: 50 },
    ],
    order: 1,
  },
  {
    id: "field-002-2", serviceId: "service-002", name: "area", label: "Powierzchnia (m²)",
    type: "number", required: true, placeholder: "np. 6", order: 2,
  },

  // service-003: Oczka
  {
    id: "field-003-1", serviceId: "service-003", name: "spacing", label: "Rozstaw oczek",
    type: "select", required: true,
    options: [
      { id: "opt-s1", label: "Co 50 cm", value: "50cm" },
      { id: "opt-s2", label: "Co 30 cm", value: "30cm", priceModifier: 20 },
      { id: "opt-s3", label: "Co 25 cm", value: "25cm", priceModifier: 40 },
    ],
    order: 1,
  },
  {
    id: "field-003-2", serviceId: "service-003", name: "eyeletMaterial", label: "Materiał oczek",
    type: "radio", required: true, defaultValue: "aluminum",
    options: [
      { id: "opt-e1", label: "Aluminium ø10mm", value: "aluminum" },
      { id: "opt-e2", label: "Stal nierdzewna", value: "steel", priceModifier: 30 },
    ],
    order: 2,
  },
  {
    id: "field-003-3", serviceId: "service-003", name: "count", label: "Liczba oczek (szt.)",
    type: "number", required: true, order: 3,
  },
];

// ─── Order Service Configurations ─────────────────────────────────────────────

export const mockOrderServiceConfigurations: OrderServiceConfiguration[] = [
  {
    id: "osc-001",
    orderId: "order-001",
    serviceId: "service-001",
    values: {
      width: 200,
      height: 100,
      quantity: 3,
      material: "pvc_510g",
      resolution: "720dpi",
      finishing: ["lam_matte", "eyelets_50"],
      notes: "Klient prosi o miękkie zwijanie. Etykiety z numerami na odwrocie.",
    },
  },
  {
    id: "osc-002",
    orderId: "order-001",
    serviceId: "service-003",
    values: { spacing: "50cm", eyeletMaterial: "aluminum", count: 54 },
  },
];

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getMockOrderById(id: string) {
  return mockOrders.find((o) => o.id === id) ?? null;
}

export function getMockClientById(id: string) {
  return mockClients.find((c) => c.id === id) ?? null;
}
