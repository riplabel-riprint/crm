import type { Order, OrderStage, OrderTask } from "@/types/crm";

// ─── Orders ──────────────────────────────────────────────────────────────────

export const seedOrders: Order[] = [
  {
    id: "o-001",
    number: "RIP-2026-0042",
    title: "Banery na targi Drema 2026",
    description: "3 szt. banerów PVC 2×1 m, laminat matowy, oczka co 50 cm.",
    clientId: "c-001",
    status: "W realizacji",
    priority: "high",
    netAmount: 810,
    vatRate: 23,
    clientDeadline: "2026-04-20",
    plannedDeadline: "2026-04-19",
  },
  {
    id: "o-002",
    number: "RIP-2026-0041",
    title: "Wizytówki premium dwustronne",
    clientId: "c-003",
    status: "Zakończone",
    netAmount: 250,
    vatRate: 23,
    clientDeadline: "2026-04-15",
    plannedDeadline: "2026-04-14",
    createdAt: "2026-05-03T09:00:00Z",
  },
  {
    id: "o-003",
    number: "RIP-2026-0040",
    title: "Roll-up konferencyjny",
    clientId: "c-002",
    status: "W realizacji",
    netAmount: 480,
    vatRate: 23,
    clientDeadline: "2026-05-05",
    plannedDeadline: "2026-05-03",
  },
  {
    id: "o-004",
    number: "RIP-2026-0039",
    title: "Plakaty A1 (50 szt.)",
    clientId: "c-006",
    status: "Nowe",
    netAmount: 320,
    vatRate: 23,
    clientDeadline: "2026-05-10",
  },
  {
    id: "o-005",
    number: "RIP-2026-0038",
    title: "Katalog produktowy 24 str.",
    description: "Format A4, kreda 170g, miękka oprawa klejona.",
    clientId: "c-001",
    status: "W realizacji",
    priority: "high",
    netAmount: 1800,
    vatRate: 23,
    clientDeadline: "2026-04-18",
    plannedDeadline: "2026-04-17",
  },
  {
    id: "o-006",
    number: "RIP-2026-0037",
    title: "Naklejki reklamowe (rolki)",
    clientId: "c-004",
    status: "W realizacji",
    netAmount: 180,
    vatRate: 23,
    clientDeadline: "2026-04-30",
  },
  {
    id: "o-007",
    number: "RIP-2026-0036",
    title: "Torby papierowe z nadrukiem",
    clientId: "c-002",
    status: "Zakończone",
    netAmount: 750,
    vatRate: 23,
    clientDeadline: "2026-04-10",
    createdAt: "2026-05-07T11:30:00Z",
  },
  {
    id: "o-008",
    number: "RIP-2026-0035",
    title: "Ulotki DL (2000 szt.)",
    clientId: "c-003",
    status: "Zakończone",
    netAmount: 320,
    vatRate: 23,
    clientDeadline: "2026-04-08",
    createdAt: "2026-05-09T14:00:00Z",
  },
  {
    id: "o-009",
    number: "RIP-2026-0034",
    title: "Szyld zewnętrzny z blachy",
    clientId: "c-006",
    status: "Anulowane",
    netAmount: 2200,
    vatRate: 23,
  },
  {
    id: "o-010",
    number: "RIP-2026-0033",
    title: "Oklejenie samochodu dostawczego",
    clientId: "c-001",
    status: "Nowe",
    netAmount: 4500,
    vatRate: 23,
    clientDeadline: "2026-05-15",
  },
];

// ─── Stages ───────────────────────────────────────────────────────────────────

export const seedStages: OrderStage[] = [
  // o-001: Banery na targi
  { id: "sg-001", orderId: "o-001", name: "Przyjęcie zlecenia", status: "Zakończony", completedTasks: 2, totalTasks: 2 },
  { id: "sg-002", orderId: "o-001", name: "Przygotowanie pliku", status: "Aktywny", completedTasks: 1, totalTasks: 3 },
  { id: "sg-003", orderId: "o-001", name: "Druk", status: "Oczekuje", completedTasks: 0, totalTasks: 2 },
  { id: "sg-004", orderId: "o-001", name: "Uszlachetnianie", status: "Oczekuje", completedTasks: 0, totalTasks: 2 },
  { id: "sg-005", orderId: "o-001", name: "Wydanie", status: "Oczekuje", completedTasks: 0, totalTasks: 1 },

  // o-003: Roll-up
  { id: "sg-006", orderId: "o-003", name: "Przyjęcie zlecenia", status: "Zakończony", completedTasks: 2, totalTasks: 2 },
  { id: "sg-007", orderId: "o-003", name: "Projekt graficzny", status: "Zakończony", completedTasks: 3, totalTasks: 3 },
  { id: "sg-008", orderId: "o-003", name: "Druk i montaż", status: "Aktywny", completedTasks: 0, totalTasks: 3 },
  { id: "sg-009", orderId: "o-003", name: "Wydanie", status: "Oczekuje", completedTasks: 0, totalTasks: 1 },

  // o-005: Katalog
  { id: "sg-010", orderId: "o-005", name: "Przyjęcie zlecenia", status: "Zakończony", completedTasks: 2, totalTasks: 2 },
  { id: "sg-011", orderId: "o-005", name: "Skład i łamanie", status: "Aktywny", completedTasks: 2, totalTasks: 4 },
  { id: "sg-012", orderId: "o-005", name: "Druk offsetowy", status: "Oczekuje", completedTasks: 0, totalTasks: 2 },
  { id: "sg-013", orderId: "o-005", name: "Introligatornia", status: "Oczekuje", completedTasks: 0, totalTasks: 2 },
  { id: "sg-014", orderId: "o-005", name: "Wydanie", status: "Oczekuje", completedTasks: 0, totalTasks: 1 },

  // o-006: Naklejki
  { id: "sg-015", orderId: "o-006", name: "Przyjęcie zlecenia", status: "Zakończony", completedTasks: 2, totalTasks: 2 },
  { id: "sg-016", orderId: "o-006", name: "Druk cyfrowy", status: "Aktywny", completedTasks: 1, totalTasks: 2 },
  { id: "sg-017", orderId: "o-006", name: "Krojenie", status: "Oczekuje", completedTasks: 0, totalTasks: 1 },
  { id: "sg-018", orderId: "o-006", name: "Wydanie", status: "Oczekuje", completedTasks: 0, totalTasks: 1 },
];

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const seedTasks: OrderTask[] = [
  // sg-002 (o-001 aktywny etap)
  { id: "t-001", orderId: "o-001", stageId: "sg-002", title: "Weryfikacja pliku klienta", done: true, required: true },
  { id: "t-002", orderId: "o-001", stageId: "sg-002", title: "Korekta rozdzielczości (upscale)", done: false, required: true },
  { id: "t-003", orderId: "o-001", stageId: "sg-002", title: "Soft-proof do akceptacji klienta", done: false },

  // sg-008 (o-003 aktywny etap)
  { id: "t-004", orderId: "o-003", stageId: "sg-008", title: "Druk na podłożu roll-up", done: false, required: true },
  { id: "t-005", orderId: "o-003", stageId: "sg-008", title: "Montaż mechanizmu", done: false, required: true },
  { id: "t-006", orderId: "o-003", stageId: "sg-008", title: "Kontrola jakości", done: false },

  // sg-011 (o-005 aktywny etap)
  { id: "t-007", orderId: "o-005", stageId: "sg-011", title: "Import treści od klienta", done: true },
  { id: "t-008", orderId: "o-005", stageId: "sg-011", title: "Skład stron 1–12", done: true, required: true },
  { id: "t-009", orderId: "o-005", stageId: "sg-011", title: "Skład stron 13–24", done: false, required: true },
  { id: "t-010", orderId: "o-005", stageId: "sg-011", title: "PDF do akceptacji klienta", done: false },

  // sg-016 (o-006 aktywny etap)
  { id: "t-011", orderId: "o-006", stageId: "sg-016", title: "Wydruk próbny (kolor match)", done: true, required: true },
  { id: "t-012", orderId: "o-006", stageId: "sg-016", title: "Druk nakładu (rolki)", done: false, required: true },
];
