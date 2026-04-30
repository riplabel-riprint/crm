export type ClientStatus = "Aktywny" | "Nieaktywny" | "Lead";
export type ClientType = "Firma" | "Osoba prywatna";

export type Client = {
  id: string;
  name: string;
  type: ClientType;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  status: ClientStatus;
  tags?: string[];
};

export type OrderStageStatus = "Aktywny" | "Oczekuje" | "Zakończony";

export type OrderStage = {
  id: string;
  orderId: string;
  name: string;
  status: OrderStageStatus;
  completedTasks: number;
  totalTasks: number;
};

export type OrderTask = {
  id: string;
  orderId: string;
  stageId: string;
  title: string;
  done: boolean;
  required?: boolean;
};

export type OrderStatus = "Nowe" | "W realizacji" | "Zakończone" | "Anulowane";

export type OrderPriority = "low" | "normal" | "high" | "urgent";

export type Order = {
  id: string;
  number: string;
  title: string;
  description?: string;
  clientId: string;
  status: OrderStatus;
  priority?: OrderPriority;
  clientDeadline?: string | null;
  plannedDeadline?: string | null;
  netAmount: number;
  vatRate: number;
};

export type DashboardStat = {
  label: string;
  value: number | string;
  sub?: string;
  color: "emerald" | "indigo" | "violet" | "red";
  trend?: { delta: number; label?: string };
};
