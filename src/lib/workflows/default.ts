import type { Workflow } from "@/types";

// Default workflow for all print orders.
// When connecting to a real backend, workflows will be stored in DB
// and selected per service category or client preference.
export const DEFAULT_WORKFLOW: Workflow = {
  id: "workflow-default",
  name: "Standardowy workflow drukarni",
  description: "Przyjęcie → Plik → Druk → Uszlachetnianie → Wydanie",
  isDefault: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  stages: [
    {
      id: "wt-stage-1",
      workflowId: "workflow-default",
      name: "Przyjęcie zlecenia",
      position: 1,
      estimatedDurationHours: 1,
      taskTemplates: [
        { id: "wt-task-1-1", stageId: "wt-stage-1", name: "Potwierdzenie wpłynięcia zlecenia", position: 1, isRequired: true },
        { id: "wt-task-1-2", stageId: "wt-stage-1", name: "Weryfikacja danych klienta", position: 2, isRequired: true },
        { id: "wt-task-1-3", stageId: "wt-stage-1", name: "Potwierdzenie terminu realizacji", position: 3, isRequired: true },
      ],
    },
    {
      id: "wt-stage-2",
      workflowId: "workflow-default",
      name: "Wycena i akceptacja",
      position: 2,
      estimatedDurationHours: 2,
      taskTemplates: [
        { id: "wt-task-2-1", stageId: "wt-stage-2", name: "Przygotowanie wyceny", position: 1, isRequired: true },
        { id: "wt-task-2-2", stageId: "wt-stage-2", name: "Wysyłka wyceny do klienta", position: 2, isRequired: true },
        { id: "wt-task-2-3", stageId: "wt-stage-2", name: "Akceptacja wyceny przez klienta", position: 3, isRequired: true },
      ],
    },
    {
      id: "wt-stage-3",
      workflowId: "workflow-default",
      name: "Przygotowanie pliku",
      position: 3,
      estimatedDurationHours: 3,
      taskTemplates: [
        { id: "wt-task-3-1", stageId: "wt-stage-3", name: "Weryfikacja pliku (format, rozdzielczość, spady)", position: 1, isRequired: true },
        { id: "wt-task-3-2", stageId: "wt-stage-3", name: "Korekta / przygotowanie pliku produkcyjnego", position: 2, isRequired: false },
        { id: "wt-task-3-3", stageId: "wt-stage-3", name: "Export do PDF/X-4", position: 3, isRequired: true },
        { id: "wt-task-3-4", stageId: "wt-stage-3", name: "Akceptacja soft-proofa przez klienta", position: 4, isRequired: false },
      ],
    },
    {
      id: "wt-stage-4",
      workflowId: "workflow-default",
      name: "Druk",
      position: 4,
      estimatedDurationHours: 4,
      taskTemplates: [
        { id: "wt-task-4-1", stageId: "wt-stage-4", name: "Ustawienie parametrów wydruku", position: 1, isRequired: true },
        { id: "wt-task-4-2", stageId: "wt-stage-4", name: "Druk testowy / kalibracja koloru", position: 2, isRequired: false },
        { id: "wt-task-4-3", stageId: "wt-stage-4", name: "Druk właściwy", position: 3, isRequired: true },
      ],
    },
    {
      id: "wt-stage-5",
      workflowId: "workflow-default",
      name: "Uszlachetnianie i wykończenie",
      position: 5,
      estimatedDurationHours: 2,
      taskTemplates: [
        { id: "wt-task-5-1", stageId: "wt-stage-5", name: "Cięcie / obcinanie", position: 1, isRequired: true },
        { id: "wt-task-5-2", stageId: "wt-stage-5", name: "Laminowanie / uszlachetnianie", position: 2, isRequired: false },
        { id: "wt-task-5-3", stageId: "wt-stage-5", name: "Zgrzewanie / oczka / tunele", position: 3, isRequired: false },
        { id: "wt-task-5-4", stageId: "wt-stage-5", name: "Kontrola jakości", position: 4, isRequired: true },
      ],
    },
    {
      id: "wt-stage-6",
      workflowId: "workflow-default",
      name: "Wydanie / dostawa",
      position: 6,
      estimatedDurationHours: 1,
      taskTemplates: [
        { id: "wt-task-6-1", stageId: "wt-stage-6", name: "Pakowanie zamówienia", position: 1, isRequired: true },
        { id: "wt-task-6-2", stageId: "wt-stage-6", name: "Powiadomienie klienta o gotowości", position: 2, isRequired: true },
        { id: "wt-task-6-3", stageId: "wt-stage-6", name: "Potwierdzenie odbioru / nadania", position: 3, isRequired: true },
      ],
    },
  ],
};
