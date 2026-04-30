"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/utils";
import { useServicesStore } from "@/store/services-store";
import type { ServiceCategoryDef } from "@/types";
import type {
  Service,
  ServiceCategory,
  PricingModel,
  ServiceProductAssignment,
  ServiceStage,
  ServiceTask,
  ServiceTaskDefaultStatus,
  CatalogProduct,
  Money,
} from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRICING_LABELS: Record<PricingModel, string> = {
  unit: "za szt.",
  per_sqm: "za m²",
  per_run: "za nakład",
  fixed: "cena stała",
  custom: "wycena indyw.",
};

const ALL_PRICING: PricingModel[] = ["unit", "per_sqm", "per_run", "fixed", "custom"];

const DEFAULT_STAGES: Omit<ServiceStage, "id" | "serviceId">[] = [
  { name: "Przyjęcie zlecenia", position: 1, tasks: [] },
  { name: "Przygotowanie pliku", position: 2, tasks: [] },
  { name: "Druk", position: 3, tasks: [] },
  { name: "Uszlachetnianie", position: 4, tasks: [] },
  { name: "Wydanie", position: 5, tasks: [] },
];

const CATALOG_PRODUCTS: CatalogProduct[] = [
  { id: "cp-1", name: "Papier kredowy 130g", description: "Arkusze A3/SRA3, powłoka błyszcząca", price: { amount: 15000, currency: "PLN" }, category: "Papier", isActive: true },
  { id: "cp-2", name: "Papier offsetowy 80g", description: "Do druku czarno-białego i kolorowego", price: { amount: 8000, currency: "PLN" }, category: "Papier", isActive: true },
  { id: "cp-3", name: "Folia do laminacji mat", description: "Laminat matowy 80mic, role 330mm", price: { amount: 22000, currency: "PLN" }, category: "Folia", isActive: true },
  { id: "cp-4", name: "Folia do laminacji błyszcząca", description: "Laminat błyszczący 80mic", price: { amount: 22000, currency: "PLN" }, category: "Folia", isActive: true },
  { id: "cp-5", name: "Toner CMYK (komplet)", description: "Zestaw tonerów do plotera cyfrowego", price: { amount: 45000, currency: "PLN" }, category: "Materiał eksploatacyjny", isActive: true },
  { id: "cp-6", name: "Bannerówka 510g", description: "Tkanina PVC do druku wielkoformatowego", price: { amount: 35000, currency: "PLN" }, category: "Podłoże", isActive: true },
  { id: "cp-7", name: "Solwent UV 1L", description: "Tusz UV do ploterów flatbed", price: { amount: 28000, currency: "PLN" }, category: "Materiał eksploatacyjny", isActive: true },
  { id: "cp-8", name: "Karton Bristol 300g", description: "Do wizytówek i okładek", price: { amount: 18000, currency: "PLN" }, category: "Papier", isActive: true },
  { id: "cp-9", name: "Klej do introligatorni", description: "Klej termiczny do opraw klejonych", price: { amount: 12000, currency: "PLN" }, category: "Materiał eksploatacyjny", isActive: true },
  { id: "cp-10", name: "Spirale do bindowania", description: "Plastikowe, śr. 14mm, op. 100szt.", price: { amount: 9500, currency: "PLN" }, category: "Akcesoria", isActive: true },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Local form types ─────────────────────────────────────────────────────────

type ServiceInfoForm = {
  name: string;
  description: string;
  category: ServiceCategory;
  basePricePLN: string;
  pricingModel: PricingModel;
  unit: string;
  estimatedDays: string;
  isActive: boolean;
};

type LocalStage = {
  id: string;
  name: string;
  position: number;
  tasks: LocalTask[];
};

type LocalTask = {
  id: string;
  name: string;
  required: boolean;
  defaultStatus: ServiceTaskDefaultStatus;
};

type LocalProduct = {
  id: string;
  catalogProductId: string;
  name: string;
  description?: string;
  price?: Money;
  variant: string;
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ServiceCreatorScreen() {
  const router = useRouter();
  const { addService, setProductAssignments, setStages, categories } = useServicesStore();

  const [info, setInfo] = useState<ServiceInfoForm>({
    name: "",
    description: "",
    category: categories[0]?.id ?? "other",
    basePricePLN: "",
    pricingModel: "unit",
    unit: "",
    estimatedDays: "",
    isActive: true,
  });
  const [infoErrors, setInfoErrors] = useState<Partial<Record<keyof ServiceInfoForm, string>>>({});

  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [stages, setStagesState] = useState<LocalStage[]>(() =>
    DEFAULT_STAGES.map((s) => ({ ...s, id: uid(), tasks: [] }))
  );
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState("");
  const [addingTaskForStageId, setAddingTaskForStageId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskRequired, setNewTaskRequired] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<ServiceTaskDefaultStatus>("pending");

  const [activeSection, setActiveSection] = useState<"info" | "products" | "stages" | "preview">("info");
  const [saving, setSaving] = useState(false);

  function setInfoField<K extends keyof ServiceInfoForm>(key: K, value: ServiceInfoForm[K]) {
    setInfo((f) => ({ ...f, [key]: value }));
    setInfoErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function validateInfo(): boolean {
    const errs: typeof infoErrors = {};
    if (!info.name.trim()) errs.name = "Nazwa jest wymagana";
    const price = parseFloat(info.basePricePLN);
    if (isNaN(price) || price < 0) errs.basePricePLN = "Podaj prawidłową cenę";
    setInfoErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const addProduct = useCallback((cp: CatalogProduct) => {
    const already = products.some((p) => p.catalogProductId === cp.id);
    if (already) return;
    setProducts((prev) => [...prev, { id: uid(), catalogProductId: cp.id, name: cp.name, description: cp.description, price: cp.price, variant: "" }]);
  }, [products]);

  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (editingProductId === id) setEditingProductId(null);
  }, [editingProductId]);

  const updateProductVariant = useCallback((id: string, variant: string) => {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, variant } : p));
  }, []);

  const addStage = useCallback(() => {
    const pos = stages.length + 1;
    setStagesState((prev) => [...prev, { id: uid(), name: `Etap ${pos}`, position: pos, tasks: [] }]);
  }, [stages.length]);

  const removeStage = useCallback((id: string) => {
    setStagesState((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, position: i + 1 })));
  }, []);

  const moveStage = useCallback((id: string, direction: "up" | "down") => {
    setStagesState((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr.map((s, i) => ({ ...s, position: i + 1 }));
    });
  }, []);

  const saveStageRename = useCallback((id: string) => {
    if (!editingStageName.trim()) return;
    setStagesState((prev) => prev.map((s) => s.id === id ? { ...s, name: editingStageName.trim() } : s));
    setEditingStageId(null);
    setEditingStageName("");
  }, [editingStageName]);

  const addTask = useCallback((stageId: string) => {
    if (!newTaskName.trim()) return;
    const task: LocalTask = { id: uid(), name: newTaskName.trim(), required: newTaskRequired, defaultStatus: newTaskStatus };
    setStagesState((prev) => prev.map((s) => s.id === stageId ? { ...s, tasks: [...s.tasks, task] } : s));
    setNewTaskName("");
    setNewTaskRequired(false);
    setNewTaskStatus("pending");
    setAddingTaskForStageId(null);
  }, [newTaskName, newTaskRequired, newTaskStatus]);

  const removeTask = useCallback((stageId: string, taskId: string) => {
    setStagesState((prev) => prev.map((s) => s.id === stageId ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) } : s));
  }, []);

  const moveTask = useCallback((stageId: string, taskId: string, direction: "up" | "down") => {
    setStagesState((prev) => prev.map((s) => {
      if (s.id !== stageId) return s;
      const idx = s.tasks.findIndex((t) => t.id === taskId);
      if (idx === -1) return s;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= s.tasks.length) return s;
      const arr = [...s.tasks];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...s, tasks: arr };
    }));
  }, []);

  const toggleTaskRequired = useCallback((stageId: string, taskId: string) => {
    setStagesState((prev) => prev.map((s) =>
      s.id === stageId ? { ...s, tasks: s.tasks.map((t) => t.id === taskId ? { ...t, required: !t.required } : t) } : s
    ));
  }, []);

  const handleSave = useCallback(async () => {
    if (!validateInfo()) { setActiveSection("info"); return; }
    setSaving(true);
    const now = new Date().toISOString();
    const serviceId = `service-${uid()}`;
    const price = parseFloat(info.basePricePLN);

    const service: Service = {
      id: serviceId,
      name: info.name.trim(),
      description: info.description.trim() || undefined,
      category: info.category,
      pricingModel: info.pricingModel,
      basePrice: { amount: Math.round(price * 100), currency: "PLN" },
      unit: info.unit.trim() || undefined,
      isActive: info.isActive,
      createdAt: now,
      updatedAt: now,
    };

    const productAssignments: ServiceProductAssignment[] = products.map((p) => ({
      id: p.id, serviceId, catalogProductId: p.catalogProductId, name: p.name,
      description: p.description, price: p.price, variant: p.variant || undefined,
    }));

    const serviceStages: ServiceStage[] = stages.map((s) => ({
      id: s.id, serviceId, name: s.name, position: s.position,
      tasks: s.tasks.map((t): ServiceTask => ({ id: t.id, name: t.name, required: t.required, defaultStatus: t.defaultStatus })),
    }));

    addService(service);
    if (productAssignments.length > 0) setProductAssignments(serviceId, productAssignments);
    if (serviceStages.length > 0) setStages(serviceId, serviceStages);

    setSaving(false);
    router.push("/services");
  }, [info, products, stages, addService, setProductAssignments, setStages, router]);

  const filteredCatalog = CATALOG_PRODUCTS.filter((cp) => {
    const q = productSearch.toLowerCase();
    return !q || cp.name.toLowerCase().includes(q) || cp.category.toLowerCase().includes(q) || (cp.description ?? "").toLowerCase().includes(q);
  });

  const assignedIds = new Set(products.map((p) => p.catalogProductId));
  const totalTasks = stages.reduce((sum, s) => sum + s.tasks.length, 0);

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a] text-white">
      {/* ── Topbar ── */}
      <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0a] px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/services")}
            className="flex items-center justify-center rounded-lg p-1.5 text-[#8d8d93] hover:bg-white/[0.06] hover:text-white transition-colors"
            title="Wróć do listy usług"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="text-[15px] font-semibold text-white">Nowa usługa</h1>
            <p className="text-[11px] text-[#8d8d93]">Wypełnij formularz i zapisz usługę</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.push("/services")} className={secondaryBtn}>
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={cn(primaryBtn, saving && "opacity-60 cursor-not-allowed")}
          >
            {saving ? "Zapisywanie…" : "Zapisz usługę"}
          </button>
        </div>
      </header>

      {/* ── Section nav ── */}
      <div className="shrink-0 border-b border-white/[0.06] bg-[#0a0a0a] px-6">
        <div className="flex items-stretch gap-0">
          {(
            [
              { id: "info", label: "Dane usługi", count: null },
              { id: "products", label: "Produkty", count: products.length },
              { id: "stages", label: "Etapy i zadania", count: totalTasks > 0 ? totalTasks : stages.length },
              { id: "preview", label: "Podgląd", count: null },
            ] as const
          ).map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3.5 text-[13px] font-medium border-b-2 transition-colors",
                activeSection === sec.id
                  ? "border-[#ff6a00] text-[#ff6a00]"
                  : "border-transparent text-[#8d8d93] hover:text-white"
              )}
            >
              {sec.label}
              {sec.count !== null && sec.count > 0 && (
                <span className={cn(
                  "inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  activeSection === sec.id ? "bg-[#ff6a00]/15 text-[#ff6a00]" : "bg-white/[0.07] text-[#8d8d93]"
                )}>
                  {sec.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          {activeSection === "info" && (
            <InfoSection
              info={info}
              errors={infoErrors}
              categories={categories}
              onChange={setInfoField}
              onNext={() => setActiveSection("products")}
            />
          )}
          {activeSection === "products" && (
            <ProductsSection
              products={products}
              catalog={filteredCatalog}
              search={productSearch}
              assignedIds={assignedIds}
              editingProductId={editingProductId}
              onSearchChange={setProductSearch}
              onAdd={addProduct}
              onRemove={removeProduct}
              onEditVariant={(id) => setEditingProductId(editingProductId === id ? null : id)}
              onVariantChange={updateProductVariant}
              onNext={() => setActiveSection("stages")}
              onBack={() => setActiveSection("info")}
            />
          )}
          {activeSection === "stages" && (
            <StagesSection
              stages={stages}
              editingStageId={editingStageId}
              editingStageName={editingStageName}
              addingTaskForStageId={addingTaskForStageId}
              newTaskName={newTaskName}
              newTaskRequired={newTaskRequired}
              newTaskStatus={newTaskStatus}
              onAddStage={addStage}
              onRemoveStage={removeStage}
              onMoveStage={moveStage}
              onStartRenameStage={(id, name) => { setEditingStageId(id); setEditingStageName(name); }}
              onEditingStageName={setEditingStageName}
              onSaveStageRename={saveStageRename}
              onCancelRename={() => { setEditingStageId(null); setEditingStageName(""); }}
              onStartAddTask={(id) => { setAddingTaskForStageId(id); setNewTaskName(""); setNewTaskRequired(false); setNewTaskStatus("pending"); }}
              onCancelAddTask={() => setAddingTaskForStageId(null)}
              onNewTaskNameChange={setNewTaskName}
              onNewTaskRequiredChange={setNewTaskRequired}
              onNewTaskStatusChange={setNewTaskStatus}
              onAddTask={addTask}
              onRemoveTask={removeTask}
              onMoveTask={moveTask}
              onToggleTaskRequired={toggleTaskRequired}
              onNext={() => setActiveSection("preview")}
              onBack={() => setActiveSection("products")}
            />
          )}
          {activeSection === "preview" && (
            <PreviewSection
              info={info}
              products={products}
              stages={stages}
              categories={categories}
              onBack={() => setActiveSection("stages")}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Info Section ─────────────────────────────────────────────────────────────

type InfoSectionProps = {
  info: ServiceInfoForm;
  errors: Partial<Record<keyof ServiceInfoForm, string>>;
  categories: ServiceCategoryDef[];
  onChange: <K extends keyof ServiceInfoForm>(key: K, value: ServiceInfoForm[K]) => void;
  onNext: () => void;
};

function InfoSection({ info, errors, categories, onChange, onNext }: InfoSectionProps) {
  return (
    <div className="space-y-6">
      <SectionCard title="Podstawowe informacje" icon={<InfoIcon />}>
        <div className="space-y-4 p-6">
          <FormField label="Nazwa usługi" error={errors.name} required>
            <input
              autoFocus
              type="text"
              value={info.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="np. Druk ulotek A5 dwustronny"
              className={inputCls(!!errors.name)}
            />
          </FormField>

          <FormField label="Opis">
            <textarea
              rows={3}
              value={info.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="Krótki opis usługi widoczny dla klienta…"
              className={cn(inputCls(), "resize-none")}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Kategoria" required>
              <select
                value={info.category}
                onChange={(e) => onChange("category", e.target.value as ServiceCategory)}
                className={inputCls()}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Status">
              <div className="flex items-center gap-3 h-[42px]">
                <button
                  type="button"
                  onClick={() => onChange("isActive", !info.isActive)}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    info.isActive ? "bg-emerald-500" : "bg-white/[0.10]"
                  )}
                >
                  <span className={cn(
                    "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                    info.isActive ? "translate-x-4" : "translate-x-1"
                  )} />
                </button>
                <span className="text-[13px] text-white">
                  {info.isActive ? "Aktywna" : "Nieaktywna"}
                </span>
              </div>
            </FormField>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Cennik" icon={<PriceIcon />}>
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Cena bazowa (zł)" error={errors.basePricePLN} required>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={info.basePricePLN}
                  onChange={(e) => onChange("basePricePLN", e.target.value)}
                  placeholder="0.00"
                  className={cn(inputCls(!!errors.basePricePLN), "pr-10")}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-[#8d8d93]">zł</span>
              </div>
            </FormField>
            <FormField label="Model cenowy">
              <select
                value={info.pricingModel}
                onChange={(e) => onChange("pricingModel", e.target.value as PricingModel)}
                className={inputCls()}
              >
                {ALL_PRICING.map((p) => (
                  <option key={p} value={p}>{PRICING_LABELS[p]}</option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Jednostka rozliczenia">
              <input
                type="text"
                value={info.unit}
                onChange={(e) => onChange("unit", e.target.value)}
                placeholder="szt., m², mb, str."
                className={inputCls()}
              />
            </FormField>
            <FormField label="Czas realizacji (dni)">
              <input
                type="number"
                min="0"
                value={info.estimatedDays}
                onChange={(e) => onChange("estimatedDays", e.target.value)}
                placeholder="np. 3"
                className={inputCls()}
              />
            </FormField>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button type="button" onClick={onNext} className={primaryBtn}>
          Dalej — Produkty →
        </button>
      </div>
    </div>
  );
}

// ─── Products Section ─────────────────────────────────────────────────────────

type ProductsSectionProps = {
  products: LocalProduct[];
  catalog: CatalogProduct[];
  search: string;
  assignedIds: Set<string>;
  editingProductId: string | null;
  onSearchChange: (v: string) => void;
  onAdd: (cp: CatalogProduct) => void;
  onRemove: (id: string) => void;
  onEditVariant: (id: string) => void;
  onVariantChange: (id: string, variant: string) => void;
  onNext: () => void;
  onBack: () => void;
};

function ProductsSection({
  products, catalog, search, assignedIds, editingProductId,
  onSearchChange, onAdd, onRemove, onEditVariant, onVariantChange, onNext, onBack,
}: ProductsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Assigned products */}
        <SectionCard
          title={`Przypisane produkty (${products.length})`}
          icon={<BoxIcon />}
          action={products.length === 0 ? undefined : (
            <span className="text-[11px] text-[#8d8d93]">Wybierz z katalogu →</span>
          )}
        >
          <div className="p-4">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-[#8d8d93]">
                  <BoxIcon />
                </div>
                <p className="text-[13px] font-medium text-white">Brak przypisanych produktów</p>
                <p className="text-[12px] text-[#8d8d93]">Wybierz produkty z katalogu po prawej stronie</p>
              </div>
            ) : (
              <div className="space-y-2">
                {products.map((p) => (
                  <div key={p.id} className="rounded-[14px] border border-white/[0.07] bg-white/[0.03]">
                    <div className="flex items-start gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{p.name}</p>
                        {p.description && (
                          <p className="text-[11px] text-[#8d8d93] mt-0.5 truncate">{p.description}</p>
                        )}
                        {p.price && (
                          <p className="text-[11px] text-white/60 mt-0.5 tabular-nums">{formatMoney(p.price)}</p>
                        )}
                        {p.variant && (
                          <span className="mt-1 inline-block rounded-full bg-[#ff6a00]/10 border border-[#ff6a00]/20 px-2 py-0.5 text-[10px] font-medium text-[#ff6a00]">
                            {p.variant}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <IconBtn onClick={() => onEditVariant(p.id)} title="Edytuj wariant" hoverColor="hover:text-[#ff6a00] hover:bg-[#ff6a00]/10">
                          <EditIcon />
                        </IconBtn>
                        <IconBtn onClick={() => onRemove(p.id)} title="Usuń produkt" hoverColor="hover:text-red-400 hover:bg-red-500/10">
                          <TrashIcon />
                        </IconBtn>
                      </div>
                    </div>
                    {editingProductId === p.id && (
                      <div className="border-t border-white/[0.06] px-4 py-3">
                        <label className="mb-1.5 block text-[11px] font-medium text-[#8d8d93]">Wariant / uwagi</label>
                        <input
                          autoFocus
                          type="text"
                          value={p.variant}
                          onChange={(e) => onVariantChange(p.id, e.target.value)}
                          placeholder="np. format A3, gramatura 250g"
                          className={cn(inputCls(), "text-[12px]")}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Catalog */}
        <div className="rounded-[20px] border border-white/[0.08] bg-[#0f0f10] overflow-hidden">
          <div className="border-b border-white/[0.06] px-4 py-3.5">
            <p className="text-[13px] font-semibold text-white mb-2">Katalog produktów</p>
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8d8d93]" viewBox="0 0 16 16" fill="none">
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                placeholder="Szukaj produktu…"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className={cn(inputCls(), "pl-9 text-[12px] py-2")}
              />
            </div>
          </div>
          <div className="max-h-[480px] overflow-y-auto divide-y divide-white/[0.04]">
            {catalog.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-[#8d8d93]">Brak wyników</p>
            ) : (
              catalog.map((cp) => {
                const added = assignedIds.has(cp.id);
                return (
                  <div key={cp.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-white truncate">{cp.name}</p>
                      <p className="text-[10px] text-[#8d8d93] mt-0.5 truncate">{cp.category}</p>
                      {cp.price && (
                        <p className="text-[11px] text-white/60 tabular-nums">{formatMoney(cp.price)}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onAdd(cp)}
                      disabled={added}
                      className={cn(
                        "shrink-0 flex h-7 w-7 items-center justify-center rounded-lg transition-colors text-sm font-bold",
                        added
                          ? "bg-emerald-500/10 text-emerald-400 cursor-not-allowed"
                          : "bg-[#ff6a00]/10 text-[#ff6a00] hover:bg-[#ff6a00]/20"
                      )}
                      title={added ? "Już dodano" : "Dodaj do usługi"}
                    >
                      {added ? "✓" : "+"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className={secondaryBtn}>← Wróć</button>
        <button type="button" onClick={onNext} className={primaryBtn}>Dalej — Etapy →</button>
      </div>
    </div>
  );
}

// ─── Stages Section ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ServiceTaskDefaultStatus, string> = {
  pending: "Oczekuje",
  done: "Gotowe",
  skipped: "Pominięte",
};

type StagesSectionProps = {
  stages: LocalStage[];
  editingStageId: string | null;
  editingStageName: string;
  addingTaskForStageId: string | null;
  newTaskName: string;
  newTaskRequired: boolean;
  newTaskStatus: ServiceTaskDefaultStatus;
  onAddStage: () => void;
  onRemoveStage: (id: string) => void;
  onMoveStage: (id: string, dir: "up" | "down") => void;
  onStartRenameStage: (id: string, name: string) => void;
  onEditingStageName: (v: string) => void;
  onSaveStageRename: (id: string) => void;
  onCancelRename: () => void;
  onStartAddTask: (stageId: string) => void;
  onCancelAddTask: () => void;
  onNewTaskNameChange: (v: string) => void;
  onNewTaskRequiredChange: (v: boolean) => void;
  onNewTaskStatusChange: (v: ServiceTaskDefaultStatus) => void;
  onAddTask: (stageId: string) => void;
  onRemoveTask: (stageId: string, taskId: string) => void;
  onMoveTask: (stageId: string, taskId: string, dir: "up" | "down") => void;
  onToggleTaskRequired: (stageId: string, taskId: string) => void;
  onNext: () => void;
  onBack: () => void;
};

function StagesSection({
  stages, editingStageId, editingStageName, addingTaskForStageId,
  newTaskName, newTaskRequired, newTaskStatus,
  onAddStage, onRemoveStage, onMoveStage, onStartRenameStage, onEditingStageName,
  onSaveStageRename, onCancelRename, onStartAddTask, onCancelAddTask,
  onNewTaskNameChange, onNewTaskRequiredChange, onNewTaskStatusChange,
  onAddTask, onRemoveTask, onMoveTask, onToggleTaskRequired, onNext, onBack,
}: StagesSectionProps) {
  return (
    <div className="space-y-6">
      <SectionCard
        title={`Etapy realizacji (${stages.length})`}
        icon={<StagesIcon />}
        action={
          <button
            type="button"
            onClick={onAddStage}
            className="flex items-center gap-1.5 rounded-xl bg-[#ff6a00] px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-[#ff6a00]/90 transition-colors"
          >
            <PlusIcon /> Dodaj etap
          </button>
        }
      >
        <div className="divide-y divide-white/[0.05]">
          {stages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-[#8d8d93]">
                <StagesIcon />
              </div>
              <p className="text-[13px] font-medium text-white">Brak etapów</p>
              <p className="text-[12px] text-[#8d8d93]">Kliknij „Dodaj etap" aby zdefiniować przebieg usługi</p>
            </div>
          ) : (
            stages.map((stage, idx) => (
              <div key={stage.id} className="p-4">
                {/* Stage header */}
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#ff6a00]/15 text-[11px] font-bold text-[#ff6a00]">
                    {stage.position}
                  </span>

                  {editingStageId === stage.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={editingStageName}
                        onChange={(e) => onEditingStageName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onSaveStageRename(stage.id);
                          if (e.key === "Escape") onCancelRename();
                        }}
                        className={cn(inputCls(), "py-1.5 text-[13px]")}
                      />
                      <button type="button" onClick={() => onSaveStageRename(stage.id)} className={cn(primaryBtn, "py-1.5 text-[12px] px-3")}>
                        Zapisz
                      </button>
                      <button type="button" onClick={onCancelRename} className={cn(secondaryBtn, "py-1.5 text-[12px] px-3")}>
                        Anuluj
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onStartRenameStage(stage.id, stage.name)}
                      className="flex-1 text-left text-[13px] font-semibold text-white hover:text-[#ff6a00] transition-colors"
                    >
                      {stage.name}
                    </button>
                  )}

                  <div className="flex items-center gap-0.5 shrink-0">
                    <span className="mr-1 text-[11px] text-[#8d8d93]">
                      {stage.tasks.length} {stage.tasks.length === 1 ? "zadanie" : stage.tasks.length < 5 ? "zadania" : "zadań"}
                    </span>
                    <IconBtn onClick={() => onMoveStage(stage.id, "up")} disabled={idx === 0} title="Przesuń wyżej">
                      <ArrowUpIcon />
                    </IconBtn>
                    <IconBtn onClick={() => onMoveStage(stage.id, "down")} disabled={idx === stages.length - 1} title="Przesuń niżej">
                      <ArrowDownIcon />
                    </IconBtn>
                    <IconBtn onClick={() => onStartAddTask(stage.id)} title="Dodaj zadanie" hoverColor="hover:text-[#ff6a00] hover:bg-[#ff6a00]/10">
                      <PlusIcon />
                    </IconBtn>
                    <IconBtn onClick={() => onRemoveStage(stage.id)} title="Usuń etap" hoverColor="hover:text-red-400 hover:bg-red-500/10">
                      <TrashIcon />
                    </IconBtn>
                  </div>
                </div>

                {/* Tasks */}
                {stage.tasks.length > 0 && (
                  <div className="mt-3 ml-9 space-y-1.5">
                    {stage.tasks.map((task, tIdx) => (
                      <div key={task.id} className="flex items-center gap-2.5 rounded-[12px] border border-white/[0.07] bg-white/[0.03] px-3 py-2">
                        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                          <span className="text-[12px] font-medium text-white">{task.name}</span>
                          {task.required && (
                            <span className="rounded-full bg-amber-500/10 text-amber-400 px-2 py-0.5 text-[10px] font-medium">
                              wymagane
                            </span>
                          )}
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            task.defaultStatus === "done" ? "bg-emerald-500/10 text-emerald-400" :
                            task.defaultStatus === "skipped" ? "bg-white/[0.06] text-[#8d8d93]" :
                            "bg-blue-500/10 text-blue-400"
                          )}>
                            {STATUS_LABELS[task.defaultStatus]}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onToggleTaskRequired(stage.id, task.id)}
                            title={task.required ? "Oznacz jako opcjonalne" : "Oznacz jako wymagane"}
                            className={cn(
                              "rounded p-1 text-[10px] transition-colors",
                              task.required
                                ? "text-amber-400 hover:bg-amber-500/10"
                                : "text-[#8d8d93] hover:bg-white/[0.06] hover:text-white"
                            )}
                          >
                            ★
                          </button>
                          <IconBtn onClick={() => onMoveTask(stage.id, task.id, "up")} disabled={tIdx === 0} title="Przesuń wyżej">
                            <ArrowUpIcon />
                          </IconBtn>
                          <IconBtn onClick={() => onMoveTask(stage.id, task.id, "down")} disabled={tIdx === stage.tasks.length - 1} title="Przesuń niżej">
                            <ArrowDownIcon />
                          </IconBtn>
                          <IconBtn onClick={() => onRemoveTask(stage.id, task.id)} title="Usuń zadanie" hoverColor="hover:text-red-400 hover:bg-red-500/10">
                            <TrashIcon />
                          </IconBtn>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add task form */}
                {addingTaskForStageId === stage.id && (
                  <div className="mt-3 ml-9 rounded-[14px] border border-[#ff6a00]/20 bg-[#ff6a00]/[0.05] p-3 space-y-2.5">
                    <p className="text-[12px] font-medium text-[#ff6a00]">Nowe zadanie</p>
                    <input
                      autoFocus
                      type="text"
                      value={newTaskName}
                      onChange={(e) => onNewTaskNameChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onAddTask(stage.id);
                        if (e.key === "Escape") onCancelAddTask();
                      }}
                      placeholder="Nazwa zadania…"
                      className={inputCls()}
                    />
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newTaskRequired}
                          onChange={(e) => onNewTaskRequiredChange(e.target.checked)}
                          className="h-4 w-4 rounded accent-[#ff6a00]"
                        />
                        <span className="text-[12px] text-white">Wymagane</span>
                      </label>
                      <select
                        value={newTaskStatus}
                        onChange={(e) => onNewTaskStatusChange(e.target.value as ServiceTaskDefaultStatus)}
                        className={cn(inputCls(), "py-1.5 text-[12px] w-auto")}
                      >
                        {(Object.keys(STATUS_LABELS) as ServiceTaskDefaultStatus[]).map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => onAddTask(stage.id)} className={cn(primaryBtn, "text-[12px] py-1.5 px-3")}>
                        Dodaj zadanie
                      </button>
                      <button type="button" onClick={onCancelAddTask} className={cn(secondaryBtn, "text-[12px] py-1.5 px-3")}>
                        Anuluj
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className={secondaryBtn}>← Wróć</button>
        <button type="button" onClick={onNext} className={primaryBtn}>Dalej — Podgląd →</button>
      </div>
    </div>
  );
}

// ─── Preview Section ──────────────────────────────────────────────────────────

type PreviewSectionProps = {
  info: ServiceInfoForm;
  products: LocalProduct[];
  stages: LocalStage[];
  categories: ServiceCategoryDef[];
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
};

function PreviewSection({ info, products, stages, categories, onBack, onSave, saving }: PreviewSectionProps) {
  const catDef = categories.find((c) => c.id === info.category);
  const price = parseFloat(info.basePricePLN);
  const priceValid = !isNaN(price) && price >= 0;

  return (
    <div className="space-y-6">
      <div className="rounded-[20px] border border-[#ff6a00]/20 bg-[#ff6a00]/[0.06] p-5">
        <p className="text-[13px] font-medium text-[#ff6a00] mb-1">Podgląd konfiguracji</p>
        <p className="text-[12px] text-white/70">Sprawdź dane przed zapisaniem. Możesz wrócić i edytować dowolną sekcję.</p>
      </div>

      <SectionCard title="Dane usługi" icon={<InfoIcon />}>
        <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-4">
          <PreviewRow label="Nazwa" value={info.name || <EmptyVal />} />
          <PreviewRow
            label="Status"
            value={
              <span className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                info.isActive
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border-white/[0.08] bg-white/[0.05] text-[#8d8d93]"
              )}>
                {info.isActive ? "Aktywna" : "Nieaktywna"}
              </span>
            }
          />
          <PreviewRow label="Kategoria" value={catDef?.label ?? info.category} />
          <PreviewRow label="Model cenowy" value={PRICING_LABELS[info.pricingModel]} />
          <PreviewRow
            label="Cena bazowa"
            value={priceValid ? (
              <span className="font-semibold text-white tabular-nums">
                {price.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł
                {info.unit && <span className="ml-1 font-normal text-[#8d8d93]">/ {info.unit}</span>}
              </span>
            ) : <EmptyVal />}
          />
          {info.estimatedDays && (
            <PreviewRow label="Czas realizacji" value={`${info.estimatedDays} dni`} />
          )}
          {info.description && (
            <div className="col-span-2">
              <p className="text-[11px] text-[#8d8d93] mb-1">Opis</p>
              <p className="text-[13px] text-white leading-relaxed">{info.description}</p>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title={`Przypisane produkty (${products.length})`} icon={<BoxIcon />}>
        <div className="p-4">
          {products.length === 0 ? (
            <p className="text-[13px] text-[#8d8d93] py-4 text-center">Brak przypisanych produktów</p>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white">{p.name}</p>
                    {p.description && <p className="text-[11px] text-[#8d8d93] mt-0.5">{p.description}</p>}
                    {p.variant && (
                      <span className="mt-1 inline-block rounded-full bg-[#ff6a00]/10 border border-[#ff6a00]/20 px-2 py-0.5 text-[10px] font-medium text-[#ff6a00]">
                        {p.variant}
                      </span>
                    )}
                  </div>
                  {p.price && (
                    <span className="text-[12px] font-medium text-white/70 tabular-nums">{formatMoney(p.price)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title={`Etapy realizacji (${stages.length})`} icon={<StagesIcon />}>
        <div className="divide-y divide-white/[0.05]">
          {stages.length === 0 ? (
            <p className="text-[13px] text-[#8d8d93] py-4 text-center px-6">Brak etapów</p>
          ) : (
            stages.map((stage) => (
              <div key={stage.id} className="px-6 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#ff6a00]/15 text-[10px] font-bold text-[#ff6a00]">
                    {stage.position}
                  </span>
                  <p className="text-[13px] font-semibold text-white">{stage.name}</p>
                  <span className="text-[11px] text-[#8d8d93] ml-auto">
                    {stage.tasks.length} {stage.tasks.length === 1 ? "zadanie" : stage.tasks.length < 5 ? "zadania" : "zadań"}
                  </span>
                </div>
                {stage.tasks.length > 0 && (
                  <div className="ml-7 space-y-1">
                    {stage.tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 text-[12px] text-white/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/[0.20] shrink-0" />
                        <span>{task.name}</span>
                        {task.required && (
                          <span className="rounded-full bg-amber-500/10 text-amber-400 px-1.5 py-0.5 text-[10px] font-medium">★</span>
                        )}
                        <span className={cn(
                          "ml-auto rounded-full px-2 py-0.5 text-[10px]",
                          task.defaultStatus === "done" ? "bg-emerald-500/10 text-emerald-400" :
                          task.defaultStatus === "skipped" ? "bg-white/[0.05] text-[#8d8d93]" :
                          "bg-blue-500/10 text-blue-400"
                        )}>
                          {STATUS_LABELS[task.defaultStatus]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className={secondaryBtn}>← Wróć</button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !info.name.trim()}
          className={cn(
            "rounded-xl bg-emerald-500 px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-emerald-400 transition-colors",
            (saving || !info.name.trim()) && "opacity-60 cursor-not-allowed"
          )}
        >
          {saving ? "Zapisywanie…" : "✓ Zapisz usługę"}
        </button>
      </div>
    </div>
  );
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function SectionCard({ title, icon, action, children }: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-white/[0.08] bg-[#0f0f10] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-[#8d8d93]">{icon}</span>}
          <h3 className="text-[14px] font-semibold text-white">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function FormField({ label, children, error, required }: {
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

function PreviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-[#8d8d93] mb-0.5">{label}</p>
      <div className="text-[13px] text-white">{value}</div>
    </div>
  );
}

function EmptyVal() {
  return <span className="italic text-[#8d8d93]">— nie podano —</span>;
}

function IconBtn({ children, onClick, disabled, title, hoverColor = "hover:text-white hover:bg-white/[0.08]" }: {
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
      className={cn("rounded p-1.5 text-[#8d8d93] transition-colors disabled:opacity-25", !disabled && hoverColor)}
    >
      {children}
    </button>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function InfoIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PriceIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v12M5 5h4.5a2 2 0 1 1 0 4H5m0-4H4m1 4H4m0 3h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path d="M13 5.5L8 8 3 5.5M8 8v6M2 5.5l6-3 6 3v5l-6 3-6-3v-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StagesIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <circle cx="4" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 4h6M7 8h6M7 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
      <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
      <path d="M2 3.5h10M5.5 3.5V2h3v1.5M4 3.5l.7 8h4.6l.7-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
      <path d="M7 10V4M4 7l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
      <path d="M7 4v6M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Shared style constants ───────────────────────────────────────────────────

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
