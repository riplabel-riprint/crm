// Shape of a single "Do zrobienia dziś" item displayed on the dashboard.

export type ItemPriority = "low" | "medium" | "high";

export type ItemStatus =
  | "pending"
  | "in_progress"
  | "done"
  | "overdue"
  | "blocked";

/** Discriminates what kind of action this item represents. */
export type ItemKind =
  | "order_start"      // zlecenie czeka na start produkcji
  | "stage_close"      // etap workflow do zamknięcia
  | "checklist_task"   // pojedyncze zadanie z checklisty etapu
  | "client_approval"  // akceptacja klienta wymagana
  | "overdue"          // przekroczony termin
  | "blocker";         // blokada wymagająca wyjaśnienia

export type TodayItem = {
  id: string;
  kind: ItemKind;
  /** Główna etykieta (np. numer zlecenia + nazwa usługi). */
  label: string;
  /** Dodatkowy kontekst (klient, etap, ilość). */
  sub: string;
  status: ItemStatus;
  priority: ItemPriority;
  /** Godzina wykonania w formacie "HH:mm", opcjonalna. */
  dueTime?: string;
  /** Nazwa przypisanego pracownika (display name).
   *  TODO: zamienić na obiekt { id, name } gdy będzie API użytkowników. */
  assignee?: string;
};
