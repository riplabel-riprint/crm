// Simplified view-layer types for the order detail screen.
// The data layer maps complex domain types to these before passing them to UI components.

export type ViewClient = {
  id: string;
  name: string;
  companyName?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  tags?: string[];
  notes?: string;
  status?: "Aktywny" | "Nieaktywny" | "Lead";
};

export type ViewOrderStage = {
  id: string;
  name: string;
  status: "Aktywny" | "Oczekuje" | "Zakończony";
  completedTasks: number;
  totalTasks: number;
};

export type ViewOrderTask = {
  id: string;
  stageId: string;
  title: string;
  required?: boolean;
  done: boolean;
};

export type OrderView = {
  id: string;
  number: string;
  title: string;
  description?: string;
  productId?: string;
  status?: string;
  priority?: string;
  client: ViewClient;
  clientDeadline?: string | null;
  plannedDeadline?: string | null;
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  grossAmount: number;
  stages: ViewOrderStage[];
  tasks: ViewOrderTask[];
};
