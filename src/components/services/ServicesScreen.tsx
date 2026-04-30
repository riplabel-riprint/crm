"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/utils";
import { useServicesStore } from "@/store/services-store";
import type {
  Service,
  ServiceField,
  ServiceFieldType,
  ServiceFieldOption,
  ServiceCategory,
  ServiceCategoryDef,
  PricingModel,
  ServiceStage,
} from "@/types";

const PRICING_LABELS: Record<PricingModel, string> = {
  unit: "za szt.",
  per_sqm: "za m²",
  per_run: "za nakład",
  fixed: "cena stała",
  custom: "wycena indyw.",
};

const FIELD_TYPE_LABELS: Record<ServiceFieldType, string> = {
  text: "Tekst",
  textarea: "Tekst wieloliniowy",
  number: "Liczba",
  select: "Lista (jedna)",
  multiselect: "Lista (wiele)",
  checkbox: "Checkbox",
  radio: "Radio",
  date: "Data",
};

const ALL_PRICING: PricingModel[] = ["unit", "per_sqm", "per_run", "fixed", "custom"];
const ALL_FIELD_TYPES: ServiceFieldType[] = [
  "text", "textarea", "number", "select", "multiselect", "checkbox", "radio", "date",
];
const HAS_OPTIONS: ServiceFieldType[] = ["select", "multiselect", "radio"];
const HAS_PLACEHOLDER: ServiceFieldType[] = ["text", "textarea", "number"];

const FALLBACK_CAT: ServiceCategoryDef = {
  id: "",
  label: "Nieznana",
  colorClasses: "bg-slate-100 text-slate-500",
};

function getCat(categories: ServiceCategoryDef[], id: string): ServiceCategoryDef {
  return categories.find((c) => c.id === id) ?? { ...FALLBACK_CAT, id, label: id };
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[ąà]/g, "a").replace(/[ęè]/g, "e").replace(/[óò]/g, "o")
    .replace(/[śš]/g, "s").replace(/ł/g, "l").replace(/[żźž]/g, "z")
    .replace(/[ćč]/g, "c").replace(/[ńñ]/g, "n")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ServicesScreen() {
  const router = useRouter();
  const { services, fields, addService, updateService, deleteService, categories } = useServicesStore();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | "all">("all");
  const [activeId, setActiveId] = useState<string | null>(services[0]?.id ?? null);
  const [serviceModal, setServiceModal] = useState<{ open: boolean; editId: string | null }>({
    open: false,
    editId: null,
  });
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return services.filter((s) => {
      const matchCat = categoryFilter === "all" || s.category === categoryFilter;
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [services, search, categoryFilter]);

  const activeService = services.find((s) => s.id === activeId) ?? null;

  const handleServiceSave = useCallback(
    (data: Omit<Service, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      if (serviceModal.editId) {
        updateService(serviceModal.editId, { ...data, updatedAt: now });
      } else {
        const newId = `service-${uid()}`;
        addService({ id: newId, ...data, createdAt: now, updatedAt: now });
        setActiveId(newId);
      }
      setServiceModal({ open: false, editId: null });
    },
    [serviceModal.editId, addService, updateService]
  );

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a] text-white overflow-hidden">
      {/* ── Topbar ── */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div>
          <h1 className="text-[15px] font-semibold tracking-tight text-white">Usługi</h1>
          <p className="mt-0.5 text-[12px] text-white">Konfiguracja workflow dla usług</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCategoriesOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-[#8d8d93] transition-colors hover:bg-white/[0.07] hover:text-white"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
              <circle cx="4" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="10" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="4" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="10" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            Kategorie
          </button>
          <button
            type="button"
            onClick={() => setServiceModal({ open: true, editId: null })}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-[#8d8d93] transition-colors hover:bg-white/[0.07] hover:text-white"
          >
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
              <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Szybkie
          </button>
          <button
            type="button"
            onClick={() => router.push("/services/new")}
            className="flex items-center gap-1.5 rounded-xl bg-[#ff6a00] px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#ff6a00]/90"
          >
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
              <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Nowa usługa
          </button>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left panel ── */}
        <aside className="flex w-[320px] shrink-0 flex-col border-r border-white/[0.06]">
          {/* Panel header */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-[13px] font-semibold text-white">Usługi</span>
              <span className="text-[11px] font-medium text-[#8d8d93]">{services.length}</span>
            </div>
            {/* Search */}
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8d8d93]"
                viewBox="0 0 16 16" fill="none"
              >
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                placeholder="Szukaj usługi…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 pl-9 pr-3 text-[12px] text-white placeholder-[#8d8d93] outline-none transition focus:border-[#ff6a00]/40 focus:ring-1 focus:ring-[#ff6a00]/20"
              />
            </div>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-1 px-5 pb-3">
            <Chip label="Wszystkie" active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")} />
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.label}
                active={categoryFilter === cat.id}
                onClick={() => setCategoryFilter(cat.id)}
              />
            ))}
          </div>

          <div className="mx-5 mb-2 border-t border-white/[0.06]" />

          {/* List */}
          <div className="flex-1 overflow-y-auto py-2 px-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.05] text-[#8d8d93]">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-[12px] font-medium text-[#8d8d93]">Brak usług</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {filtered.map((svc) => (
                  <ServiceListItem
                    key={svc.id}
                    service={svc}
                    fieldCount={fields.filter((f) => f.serviceId === svc.id).length}
                    isActive={svc.id === activeId}
                    categories={categories}
                    onClick={() => setActiveId(svc.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* ── Right panel ── */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          {activeService ? (
            <ServiceDetailPanel
              service={activeService}
              onEdit={() => setServiceModal({ open: true, editId: activeService.id })}
              onDelete={() => {
                deleteService(activeService.id);
                const next = filtered.find((s) => s.id !== activeService.id);
                setActiveId(next?.id ?? null);
              }}
            />
          ) : (
            <EmptyState onAdd={() => setServiceModal({ open: true, editId: null })} />
          )}
        </main>
      </div>

      {serviceModal.open && (
        <ServiceModal
          editService={serviceModal.editId ? services.find((s) => s.id === serviceModal.editId) : undefined}
          onSave={handleServiceSave}
          onClose={() => setServiceModal({ open: false, editId: null })}
        />
      )}

      {categoriesOpen && (
        <CategoriesModal onClose={() => setCategoriesOpen(false)} />
      )}
    </div>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
        active
          ? "bg-[#ff6a00] text-white"
          : "bg-white/[0.05] text-[#8d8d93] hover:bg-white/[0.09] hover:text-white"
      )}
    >
      {label}
    </button>
  );
}

// ─── Service list item ────────────────────────────────────────────────────────

function ServiceListItem({
  service,
  fieldCount,
  isActive,
  categories,
  onClick,
}: {
  service: Service;
  fieldCount: number;
  isActive: boolean;
  categories: ServiceCategoryDef[];
  onClick: () => void;
}) {
  const cat = getCat(categories, service.category);
  const fieldWord = fieldCount === 1 ? "pole" : fieldCount < 5 ? "pola" : "pól";
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group w-full rounded-[16px] px-3.5 py-3 text-left transition-all duration-150",
          isActive
            ? "border border-[#ff6a00]/40 bg-[#ff6a00]/[0.10] shadow-[0_0_16px_rgba(255,106,0,0.12)] pl-4"
            : "border border-transparent hover:border-white/[0.07] hover:bg-white/[0.03]"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", cat.colorClasses)}>
                {cat.label}
              </span>
              {!service.isActive && (
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-[#8d8d93]">nieaktywna</span>
              )}
            </div>
            <p className="truncate text-[13px] font-semibold leading-tight text-white">
              {service.name}
            </p>
            <p className="mt-0.5 text-[11px] text-white">
              {fieldCount} {fieldWord} formularza
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[12px] font-semibold tabular-nums text-white">
              {formatMoney(service.basePrice)}
            </p>
            <p className="text-[10px] text-[#8d8d93]">{PRICING_LABELS[service.pricingModel]}</p>
          </div>
        </div>
      </button>
    </li>
  );
}

// ─── Service detail panel ─────────────────────────────────────────────────────

type Tab = "stages" | "form" | "preview" | "orders";

function ServiceDetailPanel({
  service,
  onEdit,
  onDelete,
}: {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { fields, stages, addField, updateField, deleteField, moveFieldUp, moveFieldDown, updateService, categories } =
    useServicesStore();
  const cat = getCat(categories, service.category);

  const [activeTab, setActiveTab] = useState<Tab>("stages");
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [fieldModal, setFieldModal] = useState<{ open: boolean; editId: string | null }>({
    open: false,
    editId: null,
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const serviceFields = fields
    .filter((f) => f.serviceId === service.id)
    .sort((a, b) => a.order - b.order);

  const serviceStages = stages
    .filter((s) => s.serviceId === service.id)
    .sort((a, b) => a.position - b.position);

  const selectedStage = serviceStages.find((s) => s.id === selectedStageId) ?? serviceStages[0] ?? null;

  const handleFieldSave = useCallback(
    (data: Omit<ServiceField, "id" | "serviceId">) => {
      if (fieldModal.editId) {
        updateField(fieldModal.editId, data);
      } else {
        const maxOrder = serviceFields.reduce((m, f) => Math.max(m, f.order), 0);
        addField({
          id: `field-${uid()}`,
          serviceId: service.id,
          ...data,
          order: maxOrder + 1,
        });
      }
      setFieldModal({ open: false, editId: null });
    },
    [fieldModal.editId, service.id, serviceFields, addField, updateField]
  );

  const TABS: { id: Tab; label: string }[] = [
    { id: "stages", label: "Etapy usługi" },
    { id: "form", label: `Formularz (${serviceFields.length})` },
    { id: "preview", label: "Podgląd formularza" },
    { id: "orders", label: "Zlecenia" },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* ── Service header card ── */}
      <div className="rounded-[20px] border border-white/[0.08] bg-[#0f0f10] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium", cat.colorClasses)}>
                {cat.label}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                  service.isActive
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border-white/[0.08] bg-white/[0.05] text-[#8d8d93]"
                )}
              >
                {service.isActive ? "Aktywna" : "Nieaktywna"}
              </span>
              {serviceStages.length > 0 && (
                <span className="inline-flex items-center rounded-full border border-[#ff6a00]/20 bg-[#ff6a00]/[0.08] px-2.5 py-0.5 text-[11px] font-medium text-[#ff6a00]">
                  {serviceStages.length} {serviceStages.length === 1 ? "etap" : serviceStages.length < 5 ? "etapy" : "etapów"}
                </span>
              )}
            </div>

            <h2 className="text-[18px] font-semibold text-white">{service.name}</h2>
            {service.description && (
              <p className="mt-1 text-[13px] leading-relaxed text-white/80">{service.description}</p>
            )}

            {/* Stats */}
            <div className="mt-4 flex items-center gap-6">
              <div>
                <p className="text-[11px] text-white">Cena bazowa</p>
                <p className="text-[15px] font-semibold tabular-nums text-white">
                  {formatMoney(service.basePrice)}
                  <span className="ml-1 text-[11px] font-normal text-[#8d8d93]">
                    {PRICING_LABELS[service.pricingModel]}
                  </span>
                </p>
              </div>
              {service.unit && (
                <div>
                  <p className="text-[11px] text-white">Jednostka</p>
                  <p className="text-[15px] font-semibold text-white">{service.unit}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] text-white">Workflow</p>
                <p className="text-[15px] font-semibold text-white">{serviceStages.length} etapów</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              title={service.isActive ? "Dezaktywuj usługę" : "Aktywuj usługę"}
              onClick={() =>
                updateService(service.id, { isActive: !service.isActive, updatedAt: new Date().toISOString() })
              }
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                service.isActive ? "bg-emerald-500" : "bg-white/[0.10]"
              )}
            >
              <span
                className={cn(
                  "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                  service.isActive ? "translate-x-4" : "translate-x-1"
                )}
              />
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-[#8d8d93] transition-colors hover:bg-white/[0.07] hover:text-white"
            >
              Edytuj
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-3 py-1.5 text-[12px] font-medium text-red-400 transition-colors hover:bg-red-500/[0.14]"
            >
              Usuń
            </button>
          </div>
        </div>
      </div>

      {/* ── Workflow section ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        {/* Left: tabs + content */}
        <div className="rounded-[20px] border border-white/[0.08] bg-[#0f0f10] overflow-hidden">
          {/* Tab nav */}
          <div className="flex items-stretch border-b border-white/[0.06]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-3.5 text-[12px] font-medium transition-colors border-b-2",
                  activeTab === tab.id
                    ? "border-[#ff6a00] text-[#ff6a00]"
                    : "border-transparent text-[#8d8d93] hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
            {activeTab === "form" && (
              <div className="ml-auto flex items-center pr-4">
                <button
                  type="button"
                  onClick={() => setFieldModal({ open: true, editId: null })}
                  className="flex items-center gap-1.5 rounded-xl bg-[#ff6a00] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#ff6a00]/90"
                >
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Dodaj pole
                </button>
              </div>
            )}
          </div>

          <div className="p-5">
            {activeTab === "stages" && (
              <StagesTab
                stages={serviceStages}
                selectedId={selectedStage?.id ?? null}
                onSelect={(id) => setSelectedStageId(id)}
              />
            )}
            {activeTab === "form" && (
              <FormularzTab
                fields={serviceFields}
                onEdit={(id) => setFieldModal({ open: true, editId: id })}
                onDelete={setDeleteConfirmId}
                onMoveUp={moveFieldUp}
                onMoveDown={moveFieldDown}
              />
            )}
            {activeTab === "preview" && <PodgladTab fields={serviceFields} />}
            {activeTab === "orders" && <ZleceniaTab serviceId={service.id} />}
          </div>
        </div>

        {/* Right: stage detail + fields summary */}
        <div className="space-y-4">
          {/* Stage detail card */}
          <div className="rounded-[20px] border border-white/[0.08] bg-[#0f0f10] p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white">
              Szczegóły etapu
            </p>
            {selectedStage ? (
              <StageDetailCard stage={selectedStage} />
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.05] text-[#8d8d93]">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-[12px] text-white">
                  {serviceStages.length === 0
                    ? "Brak etapów — utwórz je w Kreatorze"
                    : "Wybierz etap z listy"}
                </p>
              </div>
            )}
          </div>

          {/* Fields summary card */}
          <div className="rounded-[20px] border border-white/[0.08] bg-[#0f0f10] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white">
                Pola formularza
              </p>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-white">
                {serviceFields.length}
              </span>
            </div>
            {serviceFields.length === 0 ? (
              <p className="text-[12px] text-[#8d8d93]">Brak pól</p>
            ) : (
              <ul className="space-y-1.5">
                {serviceFields.slice(0, 4).map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] text-white">{f.label}</span>
                    <span className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-[#8d8d93]">
                      {FIELD_TYPE_LABELS[f.type]}
                    </span>
                  </li>
                ))}
                {serviceFields.length > 4 && (
                  <li className="text-[11px] text-[#8d8d93]">+{serviceFields.length - 4} więcej</li>
                )}
              </ul>
            )}
            {serviceFields.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("form")}
                className="mt-3 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 text-[12px] font-medium text-[#8d8d93] transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Zobacz wszystkie pola
              </button>
            )}
          </div>
        </div>
      </div>

      {fieldModal.open && (
        <FieldModal
          serviceId={service.id}
          editField={
            fieldModal.editId ? serviceFields.find((f) => f.id === fieldModal.editId) : undefined
          }
          onSave={handleFieldSave}
          onClose={() => setFieldModal({ open: false, editId: null })}
        />
      )}

      {deleteConfirmId && (
        <ConfirmDialog
          message="Czy na pewno chcesz usunąć to pole formularza?"
          confirmLabel="Usuń pole"
          onConfirm={() => {
            deleteField(deleteConfirmId);
            setDeleteConfirmId(null);
          }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
}

// ─── Stages tab ───────────────────────────────────────────────────────────────

function StagesTab({
  stages,
  selectedId,
  onSelect,
}: {
  stages: ServiceStage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-[#8d8d93]">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-[13px] font-medium text-white">Brak etapów workflow</p>
        <p className="text-[12px] text-white/80">
          Etapy definiuje się w Kreatorze nowej usługi
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {stages.map((stage, idx) => {
        const isSelected = stage.id === selectedId;
        return (
          <button
            key={stage.id}
            type="button"
            onClick={() => onSelect(stage.id)}
            className={cn(
              "group w-full rounded-[14px] border p-4 text-left transition-all duration-150",
              isSelected
                ? "border-[#ff6a00]/30 bg-[#ff6a00]/[0.06]"
                : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10] hover:bg-white/[0.04]"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold transition-colors",
                  isSelected
                    ? "bg-[#ff6a00] text-white"
                    : "bg-white/[0.07] text-[#8d8d93] group-hover:bg-white/[0.10]"
                )}
              >
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[13px] font-semibold", isSelected ? "text-[#ff6a00]" : "text-white")}>
                  {stage.name}
                </p>
                <p className="mt-0.5 text-[11px] text-[#8d8d93]">
                  {stage.tasks.length} {stage.tasks.length === 1 ? "zadanie" : stage.tasks.length < 5 ? "zadania" : "zadań"}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  isSelected
                    ? "border-[#ff6a00]/30 bg-[#ff6a00]/10 text-[#ff6a00]"
                    : "border-white/[0.08] bg-white/[0.04] text-[#8d8d93]"
                )}
              >
                Etap {idx + 1}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function StageDetailCard({ stage }: { stage: ServiceStage }) {
  const requiredTasks = stage.tasks.filter((t) => t.required).length;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="rounded-full border border-[#ff6a00]/30 bg-[#ff6a00]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#ff6a00]">
          Etap {stage.position + 1}
        </span>
      </div>
      <h3 className="text-[14px] font-semibold text-white">{stage.name}</h3>
      {stage.tasks.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-[11px] text-[#8d8d93]">
            Checklista · {requiredTasks} wymagane z {stage.tasks.length}
          </p>
          <ul className="space-y-1">
            {stage.tasks.map((task) => (
              <li key={task.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    task.required ? "bg-[#ff6a00]" : "bg-white/[0.20]"
                  )}
                />
                <span className="text-[12px] text-white/80">{task.name}</span>
                {task.required && (
                  <span className="ml-auto text-[10px] text-[#8d8d93]">wymagane</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Formularz tab ────────────────────────────────────────────────────────────

function FormularzTab({
  fields,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  fields: ServiceField[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}) {
  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-[#8d8d93]">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-[13px] font-medium text-[#8d8d93]">Brak pól formularza</p>
        <p className="text-[12px] text-[#8d8d93]/60">
          Dodaj pierwsze pole, aby zdefiniować formularz tej usługi
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {fields.map((field, idx) => (
        <FieldRow
          key={field.id}
          field={field}
          position={idx + 1}
          isFirst={idx === 0}
          isLast={idx === fields.length - 1}
          onEdit={() => onEdit(field.id)}
          onDelete={() => onDelete(field.id)}
          onMoveUp={() => onMoveUp(field.id)}
          onMoveDown={() => onMoveDown(field.id)}
        />
      ))}
    </div>
  );
}

function FieldRow({
  field,
  position,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  field: ServiceField;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const hasOptions = HAS_OPTIONS.includes(field.type);
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-white/[0.07] bg-white/[0.03] px-4 py-3 transition-colors hover:border-white/[0.10]">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-[11px] font-semibold text-[#8d8d93]">
        {position}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[13px] font-semibold text-white">{field.label}</span>
          {field.required && <span className="text-red-400 text-[12px] font-bold">*</span>}
          <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] font-medium text-[#8d8d93]">
            {FIELD_TYPE_LABELS[field.type]}
          </span>
          {field.required && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              wymagane
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <p className="text-[11px] text-[#8d8d93] font-mono">{field.name}</p>
          {hasOptions && field.options && (
            <p className="text-[11px] text-[#8d8d93]">
              {field.options.length}{" "}
              {field.options.length === 1 ? "opcja" : field.options.length < 5 ? "opcje" : "opcji"}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <IconBtn onClick={onMoveUp} disabled={isFirst} title="Przesuń wyżej">
          <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
            <path d="M7 10V4M4 7l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconBtn>
        <IconBtn onClick={onMoveDown} disabled={isLast} title="Przesuń niżej">
          <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
            <path d="M7 4v6M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconBtn>
        <IconBtn onClick={onEdit} title="Edytuj" hoverColor="hover:text-[#ff6a00] hover:bg-[#ff6a00]/10">
          <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
            <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconBtn>
        <IconBtn onClick={onDelete} title="Usuń" hoverColor="hover:text-red-400 hover:bg-red-500/10">
          <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
            <path d="M2 3.5h10M5.5 3.5V2h3v1.5M4 3.5l.7 8h4.6l.7-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  title,
  hoverColor = "hover:text-white hover:bg-white/[0.08]",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  hoverColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "rounded p-1.5 text-[#8d8d93] transition-colors disabled:opacity-25",
        !disabled && hoverColor
      )}
    >
      {children}
    </button>
  );
}

// ─── Podgląd tab ──────────────────────────────────────────────────────────────

function PodgladTab({ fields }: { fields: ServiceField[] }) {
  if (fields.length === 0) {
    return (
      <p className="py-12 text-center text-[13px] text-[#8d8d93]">
        Brak pól — dodaj pola w zakładce „Formularz"
      </p>
    );
  }

  return (
    <div className="max-w-lg space-y-5">
      <p className="text-[12px] italic text-white/70">
        Podgląd formularza usługi. Tak będzie wyglądał formularz przy tworzeniu zlecenia.
      </p>
      {fields.map((field) => (
        <FieldPreview key={field.id} field={field} />
      ))}
      <div className="pt-2 border-t border-white/[0.06]">
        <button
          type="button"
          disabled
          className="rounded-xl bg-[#ff6a00]/10 px-5 py-2.5 text-[13px] font-medium text-[#ff6a00]/50 cursor-not-allowed"
        >
          Zapisz konfigurację w zleceniu
        </button>
      </div>
    </div>
  );
}

function FieldPreview({ field }: { field: ServiceField }) {
  const inputCls =
    "w-full rounded-xl border border-white/[0.10] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-white placeholder-[#8d8d93] outline-none transition focus:border-[#ff6a00]/40 focus:ring-1 focus:ring-[#ff6a00]/20";

  const label = (
    <label className="block text-[13px] font-medium text-white mb-1.5">
      {field.label}
      {field.required && <span className="ml-1 text-red-400">*</span>}
    </label>
  );

  let input: React.ReactNode;

  switch (field.type) {
    case "text":
      input = <input type="text" placeholder={field.placeholder} defaultValue={field.defaultValue as string} className={inputCls} />;
      break;
    case "textarea":
      input = <textarea rows={3} placeholder={field.placeholder} defaultValue={field.defaultValue as string} className={cn(inputCls, "resize-none")} />;
      break;
    case "number":
      input = <input type="number" placeholder={field.placeholder} defaultValue={field.defaultValue as number} className={inputCls} />;
      break;
    case "date":
      input = <input type="date" className={inputCls} />;
      break;
    case "checkbox":
      input = (
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" defaultChecked={!!field.defaultValue} className="h-4 w-4 rounded border-white/20 bg-white/[0.05] accent-[#ff6a00]" />
          <span className="text-[13px] text-white">{field.label}</span>
        </label>
      );
      break;
    case "select":
      input = (
        <select defaultValue={field.defaultValue as string} className={cn(inputCls, "bg-[#0f0f10]")}>
          {!field.defaultValue && <option value="">— wybierz —</option>}
          {field.options?.map((o) => (
            <option key={o.id} value={o.value}>
              {o.label}{o.priceModifier ? ` (+${o.priceModifier} zł)` : ""}
            </option>
          ))}
        </select>
      );
      break;
    case "multiselect":
      input = (
        <div className="space-y-2">
          {field.options?.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 transition-colors hover:border-[#ff6a00]/30">
              <input type="checkbox" value={o.value} className="h-4 w-4 rounded accent-[#ff6a00]" />
              <span className="flex-1 text-[13px] text-white">{o.label}</span>
              {o.priceModifier != null && (
                <span className="text-[11px] text-[#8d8d93]">+{o.priceModifier} zł</span>
              )}
            </label>
          ))}
        </div>
      );
      break;
    case "radio":
      input = (
        <div className="space-y-2">
          {field.options?.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 transition-colors hover:border-[#ff6a00]/30 has-[:checked]:border-[#ff6a00]/40 has-[:checked]:bg-[#ff6a00]/[0.05]">
              <input type="radio" name={`prev-${field.id}`} value={o.value} defaultChecked={field.defaultValue === o.value} className="h-4 w-4 accent-[#ff6a00]" />
              <span className="flex-1 text-[13px] text-white">{o.label}</span>
              {o.priceModifier != null && (
                <span className="text-[11px] text-[#8d8d93]">+{o.priceModifier} zł</span>
              )}
            </label>
          ))}
        </div>
      );
      break;
    default:
      input = <input type="text" className={inputCls} />;
  }

  return (
    <div>
      {field.type !== "checkbox" && label}
      {input}
      {field.helpText && (
        <p className="mt-1.5 text-[11px] text-white/60">{field.helpText}</p>
      )}
    </div>
  );
}

// ─── Zlecenia tab ─────────────────────────────────────────────────────────────

function ZleceniaTab({ serviceId }: { serviceId: string }) {
  const { configurations } = useServicesStore();
  const cfgs = configurations.filter((c) => c.serviceId === serviceId);

  if (cfgs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-[#8d8d93]">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 8h10M7 12h7M7 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-[13px] font-medium text-[#8d8d93]">Brak konfiguracji</p>
        <p className="text-[12px] text-[#8d8d93]/60">
          Konfiguracje pojawią się tutaj po podpięciu usługi do zlecenia
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cfgs.map((cfg) => (
        <div key={cfg.id} className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] px-4 py-3">
          <p className="text-[11px] font-mono text-white mb-2">{cfg.orderId}</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {Object.entries(cfg.values).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="font-mono text-white/70">{key}</span>
                <span className="font-medium text-white text-right">
                  {Array.isArray(value) ? value.join(", ") : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Service modal ────────────────────────────────────────────────────────────

type ServiceFormData = {
  name: string;
  category: ServiceCategory;
  pricingModel: PricingModel;
  basePricePLN: string;
  unit: string;
  description: string;
  isActive: boolean;
};

function ServiceModal({
  editService,
  onSave,
  onClose,
}: {
  editService?: Service;
  onSave: (data: Omit<Service, "id" | "createdAt" | "updatedAt">) => void;
  onClose: () => void;
}) {
  const { categories } = useServicesStore();
  const [form, setForm] = useState<ServiceFormData>({
    name: editService?.name ?? "",
    category: editService?.category ?? (categories[0]?.id ?? "other"),
    pricingModel: editService?.pricingModel ?? "unit",
    basePricePLN: editService ? (editService.basePrice.amount / 100).toFixed(2) : "",
    unit: editService?.unit ?? "",
    description: editService?.description ?? "",
    isActive: editService?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceFormData, string>>>({});

  function set<K extends keyof ServiceFormData>(key: K, value: ServiceFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = "Nazwa jest wymagana";
    const price = parseFloat(form.basePricePLN);
    if (isNaN(price) || price < 0) errs.basePricePLN = "Podaj prawidłową cenę";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    onSave({
      name: form.name.trim(),
      category: form.category,
      pricingModel: form.pricingModel,
      basePrice: { amount: Math.round(price * 100), currency: "PLN" },
      unit: form.unit.trim() || undefined,
      description: form.description.trim() || undefined,
      isActive: form.isActive,
    });
  }

  return (
    <Modal title={editService ? "Edytuj usługę" : "Nowa usługa"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nazwa usługi" error={errors.name} required>
          <input
            autoFocus
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="np. Druk ulotek A5"
            className={inputCls(!!errors.name)}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Kategoria" required>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value as ServiceCategory)}
              className={inputCls()}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Model cenowy" required>
            <select
              value={form.pricingModel}
              onChange={(e) => set("pricingModel", e.target.value as PricingModel)}
              className={inputCls()}
            >
              {ALL_PRICING.map((p) => (
                <option key={p} value={p}>{PRICING_LABELS[p]}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Cena bazowa (zł)" error={errors.basePricePLN} required>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.basePricePLN}
              onChange={(e) => set("basePricePLN", e.target.value)}
              placeholder="0.00"
              className={inputCls(!!errors.basePricePLN)}
            />
          </FormField>
          <FormField label="Jednostka">
            <input
              type="text"
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              placeholder="szt., m², str."
              className={inputCls()}
            />
          </FormField>
        </div>

        <FormField label="Opis">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Krótki opis usługi…"
            className={cn(inputCls(), "resize-none")}
          />
        </FormField>

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="h-4 w-4 rounded accent-[#ff6a00]"
          />
          <span className="text-[13px] text-white">Usługa aktywna</span>
        </label>

        <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
          <button type="button" onClick={onClose} className={secondaryBtn}>Anuluj</button>
          <button type="submit" className={primaryBtn}>
            {editService ? "Zapisz zmiany" : "Dodaj usługę"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Field modal ──────────────────────────────────────────────────────────────

type OptRow = { id: string; label: string; value: string; priceModifier: string };

type FieldFormData = {
  label: string;
  name: string;
  type: ServiceFieldType;
  required: boolean;
  placeholder: string;
  helpText: string;
  defaultValue: string;
  options: OptRow[];
};

function FieldModal({
  serviceId: _serviceId,
  editField,
  onSave,
  onClose,
}: {
  serviceId: string;
  editField?: ServiceField;
  onSave: (data: Omit<ServiceField, "id" | "serviceId">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FieldFormData>({
    label: editField?.label ?? "",
    name: editField?.name ?? "",
    type: editField?.type ?? "text",
    required: editField?.required ?? false,
    placeholder: editField?.placeholder ?? "",
    helpText: editField?.helpText ?? "",
    defaultValue: editField?.defaultValue != null ? String(editField.defaultValue) : "",
    options:
      editField?.options?.map((o) => ({
        id: o.id,
        label: o.label,
        value: o.value,
        priceModifier: o.priceModifier != null ? String(o.priceModifier) : "",
      })) ?? [],
  });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [nameTouched, setNameTouched] = useState(!!editField);

  function setF<K extends keyof FieldFormData>(key: K, value: FieldFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function handleLabelChange(val: string) {
    setF("label", val);
    if (!nameTouched) setF("name", slugify(val));
  }

  function handleTypeChange(val: ServiceFieldType) {
    setF("type", val);
    if (!HAS_OPTIONS.includes(val)) setF("options", []);
  }

  function addOption() {
    setF("options", [...form.options, { id: uid(), label: "", value: "", priceModifier: "" }]);
  }

  function updateOpt(idx: number, key: keyof OptRow, value: string) {
    setF(
      "options",
      form.options.map((o, i) => {
        if (i !== idx) return o;
        const updated = { ...o, [key]: value };
        if (key === "label" && !o.value) updated.value = slugify(value);
        return updated;
      })
    );
  }

  function removeOpt(idx: number) {
    setF("options", form.options.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.label.trim()) errs.label = "Etykieta jest wymagana";
    if (!form.name.trim()) errs.name = "Nazwa (ID) jest wymagana";
    if (HAS_OPTIONS.includes(form.type) && form.options.length === 0)
      errs.options = "Dodaj co najmniej jedną opcję";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const options: ServiceFieldOption[] | undefined = HAS_OPTIONS.includes(form.type)
      ? form.options.map((o) => ({
          id: o.id,
          label: o.label,
          value: o.value || slugify(o.label),
          priceModifier: o.priceModifier ? parseFloat(o.priceModifier) : undefined,
        }))
      : undefined;

    onSave({
      name: form.name.trim(),
      label: form.label.trim(),
      type: form.type,
      required: form.required,
      placeholder: HAS_PLACEHOLDER.includes(form.type) ? form.placeholder || undefined : undefined,
      helpText: form.helpText || undefined,
      defaultValue: form.defaultValue || undefined,
      options,
      order: editField?.order ?? 999,
    });
  }

  const showOptions = HAS_OPTIONS.includes(form.type);
  const showPlaceholder = HAS_PLACEHOLDER.includes(form.type);

  return (
    <Modal title={editField ? "Edytuj pole formularza" : "Nowe pole formularza"} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Etykieta (widoczna w UI)" error={errors.label} required>
            <input
              autoFocus
              type="text"
              value={form.label}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="np. Szerokość (cm)"
              className={inputCls(!!errors.label)}
            />
          </FormField>
          <FormField label="Nazwa / klucz (ID)" error={errors.name} required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => { setNameTouched(true); setF("name", e.target.value); }}
              placeholder="np. width_cm"
              className={cn(inputCls(!!errors.name), "font-mono text-[12px]")}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Typ pola" required>
            <select
              value={form.type}
              onChange={(e) => handleTypeChange(e.target.value as ServiceFieldType)}
              className={inputCls()}
            >
              {ALL_FIELD_TYPES.map((t) => (
                <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </FormField>
          {showPlaceholder && (
            <FormField label="Placeholder">
              <input
                type="text"
                value={form.placeholder}
                onChange={(e) => setF("placeholder", e.target.value)}
                placeholder="Wpisz wartość…"
                className={inputCls()}
              />
            </FormField>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tekst pomocniczy (helpText)">
            <input
              type="text"
              value={form.helpText}
              onChange={(e) => setF("helpText", e.target.value)}
              placeholder="Krótka wskazówka"
              className={inputCls()}
            />
          </FormField>
          <FormField label="Wartość domyślna">
            <input
              type="text"
              value={form.defaultValue}
              onChange={(e) => setF("defaultValue", e.target.value)}
              placeholder="Opcjonalnie"
              className={inputCls()}
            />
          </FormField>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={form.required}
            onChange={(e) => setF("required", e.target.checked)}
            className="h-4 w-4 rounded accent-[#ff6a00]"
          />
          <span className="text-[13px] text-white">Pole wymagane</span>
        </label>

        {showOptions && (
          <div className="rounded-[14px] border border-white/[0.08] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-white">
                Opcje
                {errors.options && (
                  <span className="ml-2 text-[12px] font-normal text-red-400">{errors.options}</span>
                )}
              </p>
              <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-1 text-[12px] font-medium text-[#ff6a00] hover:text-[#ff6a00]/80"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Dodaj opcję
              </button>
            </div>

            {form.options.length === 0 ? (
              <p className="text-[12px] italic text-[#8d8d93]">Brak opcji — kliknij „Dodaj opcję"</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_80px_28px] gap-2 px-1">
                  <p className="text-[11px] text-[#8d8d93]">Etykieta</p>
                  <p className="text-[11px] text-[#8d8d93]">Wartość (slug)</p>
                  <p className="text-[11px] text-[#8d8d93] text-right">+cena (zł)</p>
                  <span />
                </div>
                {form.options.map((opt, idx) => (
                  <div key={opt.id} className="grid grid-cols-[1fr_1fr_80px_28px] gap-2 items-center">
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => updateOpt(idx, "label", e.target.value)}
                      placeholder="Etykieta"
                      className={inputCls()}
                    />
                    <input
                      type="text"
                      value={opt.value}
                      onChange={(e) => updateOpt(idx, "value", e.target.value)}
                      placeholder="wartosc"
                      className={cn(inputCls(), "font-mono text-[12px]")}
                    />
                    <input
                      type="number"
                      value={opt.priceModifier}
                      onChange={(e) => updateOpt(idx, "priceModifier", e.target.value)}
                      placeholder="0"
                      className={cn(inputCls(), "text-right")}
                    />
                    <button
                      type="button"
                      onClick={() => removeOpt(idx)}
                      className="flex items-center justify-center rounded p-1 text-[#8d8d93] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
          <button type="button" onClick={onClose} className={secondaryBtn}>Anuluj</button>
          <button type="submit" className={primaryBtn}>
            {editField ? "Zapisz zmiany" : "Dodaj pole"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative w-full rounded-[20px] bg-[#0f0f10] border border-white/[0.08] shadow-2xl max-h-[90vh] overflow-y-auto",
          wide ? "max-w-2xl" : "max-w-lg"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4 sticky top-0 bg-[#0f0f10] rounded-t-[20px] z-10">
          <h2 className="text-[15px] font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8d8d93] hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
  error,
  required,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-white">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

function ConfirmDialog({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-[20px] border border-white/[0.08] bg-[#0f0f10] shadow-2xl px-6 py-5">
        <p className="text-[14px] text-white mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={secondaryBtn}>Anuluj</button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-[#8d8d93]">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 9h10M7 13h6M7 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-[14px] font-semibold text-white">Wybierz usługę z listy</p>
        <p className="mt-1 text-[12px] text-[#8d8d93]">lub dodaj nową usługę</p>
        <button type="button" onClick={onAdd} className={cn(primaryBtn, "mt-4")}>
          Dodaj usługę
        </button>
      </div>
    </div>
  );
}

// ─── Categories Modal ─────────────────────────────────────────────────────────

const COLOR_OPTIONS: { label: string; classes: string }[] = [
  { label: "Niebieski",  classes: "bg-blue-50 text-blue-700" },
  { label: "Fioletowy",  classes: "bg-violet-50 text-violet-700" },
  { label: "Cyjan",      classes: "bg-cyan-50 text-cyan-700" },
  { label: "Bursztyn",   classes: "bg-amber-50 text-amber-700" },
  { label: "Różowy",     classes: "bg-pink-50 text-pink-700" },
  { label: "Zielony",    classes: "bg-emerald-50 text-emerald-700" },
  { label: "Pomarańcz",  classes: "bg-orange-50 text-orange-700" },
  { label: "Czerwony",   classes: "bg-red-50 text-red-700" },
  { label: "Limonkowy",  classes: "bg-lime-50 text-lime-700" },
  { label: "Szary",      classes: "bg-slate-100 text-slate-600" },
];

function CategoriesModal({ onClose }: { onClose: () => void }) {
  const { categories, addCategory, updateCategory, deleteCategory } = useServicesStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0].classes);
  const [addingNew, setAddingNew] = useState(false);
  const [error, setError] = useState("");

  function startEdit(cat: ServiceCategoryDef) {
    setEditingId(cat.id);
    setEditLabel(cat.label);
    setEditColor(cat.colorClasses);
    setAddingNew(false);
  }

  function saveEdit() {
    if (!editLabel.trim()) return;
    updateCategory(editingId!, { label: editLabel.trim(), colorClasses: editColor });
    setEditingId(null);
  }

  function handleAdd() {
    if (!newLabel.trim()) { setError("Nazwa jest wymagana"); return; }
    const id = newLabel.trim().toLowerCase()
      .replace(/[ąà]/g, "a").replace(/[ęè]/g, "e").replace(/[óò]/g, "o")
      .replace(/[śš]/g, "s").replace(/ł/g, "l").replace(/[żźž]/g, "z")
      .replace(/[ćč]/g, "c").replace(/[ńñ]/g, "n")
      .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
      + "_" + Math.random().toString(36).slice(2, 6);
    addCategory({ id, label: newLabel.trim(), colorClasses: newColor });
    setNewLabel("");
    setNewColor(COLOR_OPTIONS[0].classes);
    setAddingNew(false);
    setError("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-[20px] border border-white/[0.08] bg-[#0f0f10] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-[#0f0f10] px-6 py-4 rounded-t-[20px]">
          <h2 className="text-[15px] font-semibold text-white">Kategorie usług</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8d8d93] hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] overflow-hidden">
              {editingId === cat.id ? (
                <div className="p-3 space-y-3">
                  <input
                    autoFocus
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                    className={inputCls()}
                  />
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium text-[#8d8d93]">Kolor</p>
                    <div className="flex flex-wrap gap-1.5">
                      {COLOR_OPTIONS.map((co) => (
                        <button
                          key={co.classes}
                          type="button"
                          onClick={() => setEditColor(co.classes)}
                          title={co.label}
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all",
                            co.classes,
                            editColor === co.classes
                              ? "ring-2 ring-offset-1 ring-[#ff6a00] ring-offset-[#0f0f10]"
                              : "opacity-70 hover:opacity-100"
                          )}
                        >
                          {co.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={saveEdit} className={cn(primaryBtn, "py-1.5 text-[12px]")}>
                      Zapisz
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className={cn(secondaryBtn, "py-1.5 text-[12px]")}>
                      Anuluj
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium flex-1", cat.colorClasses)}>
                    {cat.label}
                  </span>
                  <span className="text-[10px] font-mono text-[#8d8d93] flex-1">{cat.id}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => startEdit(cat)}
                      className="rounded p-1.5 text-[#8d8d93] hover:text-[#ff6a00] hover:bg-[#ff6a00]/10 transition-colors"
                      title="Edytuj"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                        <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat.id)}
                      className="rounded p-1.5 text-[#8d8d93] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Usuń kategorię"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                        <path d="M2 3.5h10M5.5 3.5V2h3v1.5M4 3.5l.7 8h4.6l.7-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <p className="py-6 text-center text-[13px] text-[#8d8d93]">Brak kategorii — dodaj pierwszą poniżej</p>
          )}
        </div>

        <div className="border-t border-white/[0.06] px-6 pb-6 pt-4">
          {addingNew ? (
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-white">Nowa kategoria</p>
              <div>
                <input
                  autoFocus
                  type="text"
                  value={newLabel}
                  onChange={(e) => { setNewLabel(e.target.value); setError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAddingNew(false); }}
                  placeholder="Nazwa kategorii…"
                  className={inputCls(!!error)}
                />
                {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-medium text-[#8d8d93]">Kolor</p>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map((co) => (
                    <button
                      key={co.classes}
                      type="button"
                      onClick={() => setNewColor(co.classes)}
                      title={co.label}
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all",
                        co.classes,
                        newColor === co.classes
                          ? "ring-2 ring-offset-1 ring-[#ff6a00] ring-offset-[#0f0f10]"
                          : "opacity-70 hover:opacity-100"
                      )}
                    >
                      {co.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleAdd} className={cn(primaryBtn, "py-1.5 text-[12px]")}>
                  Dodaj kategorię
                </button>
                <button type="button" onClick={() => { setAddingNew(false); setError(""); }} className={cn(secondaryBtn, "py-1.5 text-[12px]")}>
                  Anuluj
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-[14px] border-2 border-dashed border-white/[0.10] py-3 text-[13px] font-medium text-[#8d8d93] transition-colors hover:border-[#ff6a00]/40 hover:text-[#ff6a00]"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Dodaj kategorię
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

function inputCls(error?: boolean) {
  return cn(
    "w-full rounded-xl border bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-white placeholder-[#8d8d93] outline-none transition",
    "focus:border-[#ff6a00]/40 focus:ring-1 focus:ring-[#ff6a00]/20",
    error ? "border-red-500/40 bg-red-500/[0.05]" : "border-white/[0.10]"
  );
}

const primaryBtn =
  "rounded-xl bg-[#ff6a00] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#ff6a00]/90";

const secondaryBtn =
  "rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-[#8d8d93] transition-colors hover:bg-white/[0.07] hover:text-white";
