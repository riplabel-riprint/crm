import type { Workflow } from "@/types";

const WORKFLOW_LARGE_FORMAT: Workflow = {
  id: "workflow-large-format",
  name: "Druk wielkoformatowy",
  description: "Przyjęcie → Plik → Druk → Wykończenie → Wydanie",
  isDefault: false,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  stages: [
    {
      id: "wlf-stage-1",
      workflowId: "workflow-large-format",
      name: "Przyjęcie zlecenia",
      position: 1,
      estimatedDurationHours: 1,
      taskTemplates: [
        { id: "wlf-t-1-1", stageId: "wlf-stage-1", name: "Potwierdzenie wpłynięcia zlecenia", position: 1, isRequired: true },
        { id: "wlf-t-1-2", stageId: "wlf-stage-1", name: "Weryfikacja wymiarów i specyfikacji", position: 2, isRequired: true },
        { id: "wlf-t-1-3", stageId: "wlf-stage-1", name: "Potwierdzenie terminu realizacji", position: 3, isRequired: true },
      ],
    },
    {
      id: "wlf-stage-2",
      workflowId: "workflow-large-format",
      name: "Przygotowanie pliku",
      position: 2,
      estimatedDurationHours: 2,
      taskTemplates: [
        { id: "wlf-t-2-1", stageId: "wlf-stage-2", name: "Weryfikacja pliku (format, rozdzielczość, spady)", position: 1, isRequired: true },
        { id: "wlf-t-2-2", stageId: "wlf-stage-2", name: "Korekta / przygotowanie pliku produkcyjnego", position: 2, isRequired: false },
        { id: "wlf-t-2-3", stageId: "wlf-stage-2", name: "Soft-proof do akceptacji klienta", position: 3, isRequired: false },
      ],
    },
    {
      id: "wlf-stage-3",
      workflowId: "workflow-large-format",
      name: "Druk",
      position: 3,
      estimatedDurationHours: 3,
      taskTemplates: [
        { id: "wlf-t-3-1", stageId: "wlf-stage-3", name: "Ustawienie parametrów wydruku", position: 1, isRequired: true },
        { id: "wlf-t-3-2", stageId: "wlf-stage-3", name: "Druk testowy / kalibracja koloru", position: 2, isRequired: false },
        { id: "wlf-t-3-3", stageId: "wlf-stage-3", name: "Druk właściwy", position: 3, isRequired: true },
      ],
    },
    {
      id: "wlf-stage-4",
      workflowId: "workflow-large-format",
      name: "Wykończenie",
      position: 4,
      estimatedDurationHours: 2,
      taskTemplates: [
        { id: "wlf-t-4-1", stageId: "wlf-stage-4", name: "Cięcie / obcinanie", position: 1, isRequired: true },
        { id: "wlf-t-4-2", stageId: "wlf-stage-4", name: "Laminowanie", position: 2, isRequired: false },
        { id: "wlf-t-4-3", stageId: "wlf-stage-4", name: "Zgrzewanie / oczka / tunele", position: 3, isRequired: false },
        { id: "wlf-t-4-4", stageId: "wlf-stage-4", name: "Kontrola jakości", position: 4, isRequired: true },
      ],
    },
    {
      id: "wlf-stage-5",
      workflowId: "workflow-large-format",
      name: "Wydanie / dostawa",
      position: 5,
      estimatedDurationHours: 1,
      taskTemplates: [
        { id: "wlf-t-5-1", stageId: "wlf-stage-5", name: "Pakowanie zamówienia", position: 1, isRequired: true },
        { id: "wlf-t-5-2", stageId: "wlf-stage-5", name: "Powiadomienie klienta o gotowości", position: 2, isRequired: true },
        { id: "wlf-t-5-3", stageId: "wlf-stage-5", name: "Potwierdzenie odbioru / nadania", position: 3, isRequired: true },
      ],
    },
  ],
};

const WORKFLOW_DIGITAL_PRINT: Workflow = {
  id: "workflow-digital-print",
  name: "Druk cyfrowy",
  description: "Przyjęcie → Projekt → Druk cyfrowy → Krojenie → Wydanie",
  isDefault: false,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  stages: [
    {
      id: "wdp-stage-1",
      workflowId: "workflow-digital-print",
      name: "Przyjęcie zlecenia",
      position: 1,
      estimatedDurationHours: 1,
      taskTemplates: [
        { id: "wdp-t-1-1", stageId: "wdp-stage-1", name: "Potwierdzenie wpłynięcia zlecenia", position: 1, isRequired: true },
        { id: "wdp-t-1-2", stageId: "wdp-stage-1", name: "Weryfikacja formatu i nakładu", position: 2, isRequired: true },
      ],
    },
    {
      id: "wdp-stage-2",
      workflowId: "workflow-digital-print",
      name: "Przygotowanie projektu",
      position: 2,
      estimatedDurationHours: 2,
      taskTemplates: [
        { id: "wdp-t-2-1", stageId: "wdp-stage-2", name: "Weryfikacja pliku (bleed, font, RGB/CMYK)", position: 1, isRequired: true },
        { id: "wdp-t-2-2", stageId: "wdp-stage-2", name: "Export do PDF/X-4", position: 2, isRequired: true },
        { id: "wdp-t-2-3", stageId: "wdp-stage-2", name: "Akceptacja proof przez klienta", position: 3, isRequired: false },
      ],
    },
    {
      id: "wdp-stage-3",
      workflowId: "workflow-digital-print",
      name: "Druk cyfrowy",
      position: 3,
      estimatedDurationHours: 2,
      taskTemplates: [
        { id: "wdp-t-3-1", stageId: "wdp-stage-3", name: "Ustawienie maszyny i profilu koloru", position: 1, isRequired: true },
        { id: "wdp-t-3-2", stageId: "wdp-stage-3", name: "Druk nakładu", position: 2, isRequired: true },
        { id: "wdp-t-3-3", stageId: "wdp-stage-3", name: "Kontrola jakości wydruku", position: 3, isRequired: true },
      ],
    },
    {
      id: "wdp-stage-4",
      workflowId: "workflow-digital-print",
      name: "Cięcie / wykończenie",
      position: 4,
      estimatedDurationHours: 1,
      taskTemplates: [
        { id: "wdp-t-4-1", stageId: "wdp-stage-4", name: "Krojenie na formatce", position: 1, isRequired: true },
        { id: "wdp-t-4-2", stageId: "wdp-stage-4", name: "Bigowanie / perforacja (jeśli dotyczy)", position: 2, isRequired: false },
      ],
    },
    {
      id: "wdp-stage-5",
      workflowId: "workflow-digital-print",
      name: "Wydanie",
      position: 5,
      estimatedDurationHours: 1,
      taskTemplates: [
        { id: "wdp-t-5-1", stageId: "wdp-stage-5", name: "Pakowanie i etykietowanie", position: 1, isRequired: true },
        { id: "wdp-t-5-2", stageId: "wdp-stage-5", name: "Potwierdzenie odbioru", position: 2, isRequired: true },
      ],
    },
  ],
};

const WORKFLOW_OFFSET_PRINT: Workflow = {
  id: "workflow-offset-print",
  name: "Druk offsetowy",
  description: "Przyjęcie → Prepress → Formy → Druk → Introligatornia → Wydanie",
  isDefault: false,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  stages: [
    {
      id: "wop-stage-1",
      workflowId: "workflow-offset-print",
      name: "Przyjęcie zlecenia",
      position: 1,
      estimatedDurationHours: 1,
      taskTemplates: [
        { id: "wop-t-1-1", stageId: "wop-stage-1", name: "Potwierdzenie wpłynięcia zlecenia", position: 1, isRequired: true },
        { id: "wop-t-1-2", stageId: "wop-stage-1", name: "Weryfikacja nakładu i formatu", position: 2, isRequired: true },
      ],
    },
    {
      id: "wop-stage-2",
      workflowId: "workflow-offset-print",
      name: "Prepress",
      position: 2,
      estimatedDurationHours: 4,
      taskTemplates: [
        { id: "wop-t-2-1", stageId: "wop-stage-2", name: "Weryfikacja pliku (font, bleed, ICC profile)", position: 1, isRequired: true },
        { id: "wop-t-2-2", stageId: "wop-stage-2", name: "Impozycja ark./B1", position: 2, isRequired: true },
        { id: "wop-t-2-3", stageId: "wop-stage-2", name: "Proof kolorystyczny do akceptacji", position: 3, isRequired: true },
      ],
    },
    {
      id: "wop-stage-3",
      workflowId: "workflow-offset-print",
      name: "Naświetlanie form CTP",
      position: 3,
      estimatedDurationHours: 2,
      taskTemplates: [
        { id: "wop-t-3-1", stageId: "wop-stage-3", name: "Naświetlanie płyt CTP", position: 1, isRequired: true },
        { id: "wop-t-3-2", stageId: "wop-stage-3", name: "Kontrola form drukowych", position: 2, isRequired: true },
      ],
    },
    {
      id: "wop-stage-4",
      workflowId: "workflow-offset-print",
      name: "Druk offsetowy",
      position: 4,
      estimatedDurationHours: 6,
      taskTemplates: [
        { id: "wop-t-4-1", stageId: "wop-stage-4", name: "Przygotowanie maszyny offsetowej", position: 1, isRequired: true },
        { id: "wop-t-4-2", stageId: "wop-stage-4", name: "Druk nakładu", position: 2, isRequired: true },
        { id: "wop-t-4-3", stageId: "wop-stage-4", name: "Kontrola pierwszego arkusza", position: 3, isRequired: true },
      ],
    },
    {
      id: "wop-stage-5",
      workflowId: "workflow-offset-print",
      name: "Introligatornia",
      position: 5,
      estimatedDurationHours: 4,
      taskTemplates: [
        { id: "wop-t-5-1", stageId: "wop-stage-5", name: "Falcowanie i zbieranie ark.", position: 1, isRequired: true },
        { id: "wop-t-5-2", stageId: "wop-stage-5", name: "Klejenie / szycie / zszywanie", position: 2, isRequired: true },
        { id: "wop-t-5-3", stageId: "wop-stage-5", name: "Oklejanie okładki", position: 3, isRequired: false },
        { id: "wop-t-5-4", stageId: "wop-stage-5", name: "Krojenie na gotowy format", position: 4, isRequired: true },
      ],
    },
    {
      id: "wop-stage-6",
      workflowId: "workflow-offset-print",
      name: "Wydanie",
      position: 6,
      estimatedDurationHours: 1,
      taskTemplates: [
        { id: "wop-t-6-1", stageId: "wop-stage-6", name: "Pakowanie", position: 1, isRequired: true },
        { id: "wop-t-6-2", stageId: "wop-stage-6", name: "Potwierdzenie odbioru / wysyłka", position: 2, isRequired: true },
      ],
    },
  ],
};

const WORKFLOW_FINISHING: Workflow = {
  id: "workflow-finishing",
  name: "Wykończenie / uszlachetnianie",
  description: "Przyjęcie → Wykonanie → Kontrola → Wydanie",
  isDefault: false,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  stages: [
    {
      id: "wfn-stage-1",
      workflowId: "workflow-finishing",
      name: "Przyjęcie materiału",
      position: 1,
      estimatedDurationHours: 1,
      taskTemplates: [
        { id: "wfn-t-1-1", stageId: "wfn-stage-1", name: "Przyjęcie materiału do wykończenia", position: 1, isRequired: true },
        { id: "wfn-t-1-2", stageId: "wfn-stage-1", name: "Weryfikacja stanu materiału", position: 2, isRequired: true },
      ],
    },
    {
      id: "wfn-stage-2",
      workflowId: "workflow-finishing",
      name: "Wykonanie usługi",
      position: 2,
      estimatedDurationHours: 2,
      taskTemplates: [
        { id: "wfn-t-2-1", stageId: "wfn-stage-2", name: "Przygotowanie maszyny / narzędzi", position: 1, isRequired: true },
        { id: "wfn-t-2-2", stageId: "wfn-stage-2", name: "Wykonanie usługi wykończeniowej", position: 2, isRequired: true },
      ],
    },
    {
      id: "wfn-stage-3",
      workflowId: "workflow-finishing",
      name: "Kontrola jakości",
      position: 3,
      estimatedDurationHours: 1,
      taskTemplates: [
        { id: "wfn-t-3-1", stageId: "wfn-stage-3", name: "Kontrola wizualna efektu", position: 1, isRequired: true },
        { id: "wfn-t-3-2", stageId: "wfn-stage-3", name: "Akceptacja do wydania", position: 2, isRequired: true },
      ],
    },
    {
      id: "wfn-stage-4",
      workflowId: "workflow-finishing",
      name: "Wydanie",
      position: 4,
      estimatedDurationHours: 1,
      taskTemplates: [
        { id: "wfn-t-4-1", stageId: "wfn-stage-4", name: "Pakowanie i wydanie", position: 1, isRequired: true },
      ],
    },
  ],
};

const WORKFLOW_DESIGN: Workflow = {
  id: "workflow-design",
  name: "Projekt graficzny",
  description: "Brief → Koncepcja → Akceptacja → Finalizacja",
  isDefault: false,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  stages: [
    {
      id: "wdg-stage-1",
      workflowId: "workflow-design",
      name: "Brief i wycena",
      position: 1,
      estimatedDurationHours: 1,
      taskTemplates: [
        { id: "wdg-t-1-1", stageId: "wdg-stage-1", name: "Przyjęcie briefu od klienta", position: 1, isRequired: true },
        { id: "wdg-t-1-2", stageId: "wdg-stage-1", name: "Akceptacja wyceny projektu", position: 2, isRequired: true },
      ],
    },
    {
      id: "wdg-stage-2",
      workflowId: "workflow-design",
      name: "Projekt koncepcyjny",
      position: 2,
      estimatedDurationHours: 8,
      taskTemplates: [
        { id: "wdg-t-2-1", stageId: "wdg-stage-2", name: "Przygotowanie koncepcji graficznej", position: 1, isRequired: true },
        { id: "wdg-t-2-2", stageId: "wdg-stage-2", name: "Prezentacja koncepcji klientowi", position: 2, isRequired: true },
      ],
    },
    {
      id: "wdg-stage-3",
      workflowId: "workflow-design",
      name: "Poprawki i akceptacja",
      position: 3,
      estimatedDurationHours: 4,
      taskTemplates: [
        { id: "wdg-t-3-1", stageId: "wdg-stage-3", name: "Naniesienie poprawek (runda 1)", position: 1, isRequired: true },
        { id: "wdg-t-3-2", stageId: "wdg-stage-3", name: "Finalna akceptacja projektu przez klienta", position: 2, isRequired: true },
      ],
    },
    {
      id: "wdg-stage-4",
      workflowId: "workflow-design",
      name: "Finalizacja plików",
      position: 4,
      estimatedDurationHours: 2,
      taskTemplates: [
        { id: "wdg-t-4-1", stageId: "wdg-stage-4", name: "Eksport plików produkcyjnych (PDF/X-4, AI, PNG)", position: 1, isRequired: true },
        { id: "wdg-t-4-2", stageId: "wdg-stage-4", name: "Przekazanie plików do klienta", position: 2, isRequired: true },
      ],
    },
  ],
};

const WORKFLOW_DELIVERY: Workflow = {
  id: "workflow-delivery",
  name: "Dostawa",
  description: "Pakowanie → Wysyłka → Potwierdzenie",
  isDefault: false,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  stages: [
    {
      id: "wdl-stage-1",
      workflowId: "workflow-delivery",
      name: "Pakowanie",
      position: 1,
      estimatedDurationHours: 1,
      taskTemplates: [
        { id: "wdl-t-1-1", stageId: "wdl-stage-1", name: "Kompletacja zamówienia", position: 1, isRequired: true },
        { id: "wdl-t-1-2", stageId: "wdl-stage-1", name: "Pakowanie i zabezpieczenie", position: 2, isRequired: true },
      ],
    },
    {
      id: "wdl-stage-2",
      workflowId: "workflow-delivery",
      name: "Nadanie / wysyłka",
      position: 2,
      estimatedDurationHours: 1,
      taskTemplates: [
        { id: "wdl-t-2-1", stageId: "wdl-stage-2", name: "Wystawienie listu przewozowego", position: 1, isRequired: true },
        { id: "wdl-t-2-2", stageId: "wdl-stage-2", name: "Nadanie paczki", position: 2, isRequired: true },
        { id: "wdl-t-2-3", stageId: "wdl-stage-2", name: "Wysyłka numeru śledzenia do klienta", position: 3, isRequired: true },
      ],
    },
    {
      id: "wdl-stage-3",
      workflowId: "workflow-delivery",
      name: "Potwierdzenie dostawy",
      position: 3,
      estimatedDurationHours: 1,
      taskTemplates: [
        { id: "wdl-t-3-1", stageId: "wdl-stage-3", name: "Potwierdzenie odbioru przez klienta", position: 1, isRequired: true },
      ],
    },
  ],
};

// ─── Category → Workflow map ──────────────────────────────────────────────────

import { DEFAULT_WORKFLOW } from "./default";

export const CATEGORY_WORKFLOWS: Record<string, Workflow> = {
  print_large_format: WORKFLOW_LARGE_FORMAT,
  print_digital:      WORKFLOW_DIGITAL_PRINT,
  print_offset:       WORKFLOW_OFFSET_PRINT,
  finishing:          WORKFLOW_FINISHING,
  design:             WORKFLOW_DESIGN,
  delivery:           WORKFLOW_DELIVERY,
};

export function getWorkflowForCategory(category: string): Workflow {
  return CATEGORY_WORKFLOWS[category] ?? DEFAULT_WORKFLOW;
}
