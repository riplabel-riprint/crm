"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useProductsStore } from "@/store/products-store";
import type {
  ProductCategory,
  ProductItem,
  ProductAttribute,
  ProductAttributeType,
  ProductAttributeOption,
  StockMovement,
  StockMovementType,
} from "@/types/products";

// ─── Constants ────────────────────────────────────────────────────────────────

const INPUT =
  "w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-[13px] text-white placeholder-[#555] outline-none transition focus:border-[#444] focus:bg-[#1f1f1f]";

const COLORS: { label: string; value: string }[] = [
  { label: "Niebieski",  value: "bg-blue-500/15 text-blue-400" },
  { label: "Fioletowy",  value: "bg-purple-500/15 text-purple-400" },
  { label: "Pomarańcz", value: "bg-orange-500/15 text-orange-400" },
  { label: "Zielony",   value: "bg-green-500/15 text-green-400" },
  { label: "Czerwony",  value: "bg-red-500/15 text-red-400" },
  { label: "Różowy",    value: "bg-pink-500/15 text-pink-400" },
  { label: "Żółty",     value: "bg-yellow-500/15 text-yellow-400" },
  { label: "Szary",     value: "bg-zinc-500/15 text-zinc-400" },
];

const ATTR_TYPES: { value: ProductAttributeType; label: string }[] = [
  { value: "text",        label: "Tekst" },
  { value: "textarea",    label: "Długi tekst" },
  { value: "number",      label: "Liczba" },
  { value: "select",      label: "Lista wyboru" },
  { value: "multiselect", label: "Wielokrotny wybór" },
  { value: "boolean",     label: "Tak / Nie" },
  { value: "color",       label: "Kolor" },
];

type Tab = "products" | "categories" | "attributes" | "stock";

function formatMoney(amount: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

function ImageUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [onChange]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="flex flex-col gap-2">
      <label className="mb-1.5 block text-[12px] font-medium text-[#888]">Zdjęcie produktu</label>
      {value ? (
        <div className="relative group w-full aspect-video rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#111]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Podgląd produktu" className="h-full w-full object-contain" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-[12px] text-white hover:bg-white/20 transition"
            >
              Zmień
            </button>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="rounded-lg bg-red-500/20 px-3 py-1.5 text-[12px] text-red-400 hover:bg-red-500/30 transition"
            >
              Usuń
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-colors",
            dragging
              ? "border-[#fe4e00]/60 bg-[#fe4e00]/5"
              : "border-[#2a2a2a] hover:border-[#444] hover:bg-[#1a1a1a]"
          )}
        >
          <ImageIcon />
          <p className="text-[12px] text-[#666]">Kliknij lub przeciągnij plik</p>
          <p className="text-[11px] text-[#444]">PNG, JPG, WEBP · maks. 5 MB</p>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }}
      />
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ children, colorClass }: { children: React.ReactNode; colorClass?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
        colorClass ?? "bg-zinc-500/15 text-zinc-400"
      )}
    >
      {children}
    </span>
  );
}

// ─── Section header (detail panel) ───────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#555]">
      {children}
    </p>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

function CategoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ProductCategory;
  onSave: (data: Omit<ProductCategory, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [colorClass, setColorClass] = useState(initial?.colorClass ?? COLORS[0].value);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Nazwa jest wymagana"); return; }
    onSave({ name: name.trim(), slug: slug || slugify(name), description: description.trim() || undefined, colorClass, isActive });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-[#888]">Nazwa</label>
        <input
          className={INPUT}
          value={name}
          onChange={(e) => { setName(e.target.value); if (!initial) setSlug(slugify(e.target.value)); }}
          placeholder="np. Materiały reklamowe"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-[#888]">Slug (URL)</label>
        <input className={INPUT} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="materialy-reklamowe" />
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-[#888]">Opis</label>
        <textarea className={cn(INPUT, "resize-none")} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcjonalny opis kategorii" />
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-[#888]">Kolor</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColorClass(c.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition",
                c.value,
                colorClass === c.value ? "ring-2 ring-white/30" : "opacity-60 hover:opacity-100"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="cat-active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-[#fe4e00]" />
        <label htmlFor="cat-active" className="text-[13px] text-[#aaa]">Aktywna</label>
      </div>
      {error && <p className="text-[12px] text-red-400">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 rounded-lg bg-white py-2 text-[13px] font-semibold text-black hover:bg-gray-100 transition">
          {initial ? "Zapisz zmiany" : "Dodaj kategorię"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-[#2a2a2a] px-4 py-2 text-[13px] text-[#aaa] hover:text-white transition">
          Anuluj
        </button>
      </div>
    </form>
  );
}

function CategoryDetail({
  cat,
  products,
  onEdit,
  onDelete,
}: {
  cat: ProductCategory;
  products: ProductItem[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const catProducts = products.filter((p) => p.categoryId === cat.id);
  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[16px] font-bold text-white">{cat.name}</h3>
          <p className="mt-0.5 text-[12px] text-[#555]">{cat.slug}</p>
        </div>
        <Badge colorClass={cat.colorClass}>{cat.isActive ? "Aktywna" : "Nieaktywna"}</Badge>
      </div>
      {cat.description && <p className="text-[13px] text-[#888]">{cat.description}</p>}
      <div>
        <SectionTitle>Produkty w kategorii</SectionTitle>
        {catProducts.length === 0 ? (
          <p className="text-[12px] text-[#555]">Brak produktów w tej kategorii</p>
        ) : (
          <div className="flex flex-col gap-1">
            {catProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-[#1a1a1a] px-3 py-2">
                <span className="text-[13px] text-white">{p.name}</span>
                {p.price && <span className="text-[12px] text-[#888]">{formatMoney(p.price.amount)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onEdit} className="flex-1 rounded-lg bg-white py-2 text-[13px] font-semibold text-black hover:bg-gray-100 transition">
          Edytuj
        </button>
        <button
          onClick={() => { if (confirm(`Usunąć kategorię "${cat.name}"?`)) onDelete(); }}
          className="rounded-lg border border-red-900/40 px-4 py-2 text-[13px] text-red-400 hover:border-red-500/50 transition"
        >
          Usuń
        </button>
      </div>
    </div>
  );
}

function CategoriesPanel() {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useProductsStore();
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return categories.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const active = categories.find((c) => c.id === activeId) ?? null;

  const openAdd = () => { setEditing(null); setShowForm(true); };
  const openEdit = (cat: ProductCategory) => { setEditing(cat); setShowForm(true); };

  const handleSave = (data: Omit<ProductCategory, "id" | "createdAt" | "updatedAt">) => {
    if (editing) { updateCategory(editing.id, data); setActiveId(editing.id); }
    else { const c = addCategory(data); setActiveId(c.id); }
    setShowForm(false); setEditing(null);
  };

  return (
    <div className="flex flex-1 min-h-0">
      {/* List */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1e1e1e]">
          <div className="relative flex-1 max-w-xs">
            <SearchIcon />
            <input className={cn(INPUT, "pl-9")} placeholder="Szukaj kategorii…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={openAdd} className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-[13px] font-semibold text-black hover:bg-gray-100 transition">
            <span className="text-[16px] leading-none">+</span> Dodaj kategorię
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#444]">
              <p className="text-[14px]">Brak kategorii</p>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-2">
              {filtered.map((cat) => {
                const catProducts = products.filter((p) => p.categoryId === cat.id);
                const isActive = activeId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveId(cat.id); setShowForm(false); }}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all",
                      isActive
                        ? "border-[#333] bg-[#1a1a1a]"
                        : "border-transparent hover:border-[#222] hover:bg-[#161616]"
                    )}
                  >
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[16px] font-bold", cat.colorClass)}>
                      {cat.name[0].toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[14px] font-semibold text-white">{cat.name}</p>
                      <p className="text-[12px] text-[#555]">{catProducts.length} produktów · {cat.slug}</p>
                    </div>
                    <Badge colorClass={cat.colorClass}>{cat.isActive ? "Aktywna" : "Nieaktywna"}</Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail / Form panel */}
      {(active || showForm) && (
        <aside className="w-[360px] shrink-0 border-l border-[#1e1e1e] overflow-y-auto">
          {showForm ? (
            <>
              <div className="px-5 py-4 border-b border-[#1e1e1e]">
                <h3 className="text-[14px] font-semibold text-white">{editing ? "Edytuj kategorię" : "Nowa kategoria"}</h3>
              </div>
              <CategoryForm initial={editing ?? undefined} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
            </>
          ) : active ? (
            <>
              <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-white">Szczegóły kategorii</h3>
                <button onClick={() => setActiveId(null)} className="text-[#555] hover:text-white transition">
                  <CloseIcon />
                </button>
              </div>
              <CategoryDetail
                cat={active}
                products={products}
                onEdit={() => openEdit(active)}
                onDelete={() => { deleteCategory(active.id); setActiveId(null); }}
              />
            </>
          ) : null}
        </aside>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATTRIBUTES
// ═══════════════════════════════════════════════════════════════════════════════

function OptionEditor({
  options,
  onChange,
}: {
  options: ProductAttributeOption[];
  onChange: (opts: ProductAttributeOption[]) => void;
}) {
  const addOption = () => {
    onChange([...options, { id: `o-${Date.now()}`, label: "", value: "" }]);
  };
  const updateOption = (idx: number, field: "label" | "value", val: string) => {
    const next = options.map((o, i) =>
      i === idx ? { ...o, [field]: val, ...(field === "label" && !o.value ? { value: slugify(val) } : {}) } : o
    );
    onChange(next);
  };
  const removeOption = (idx: number) => onChange(options.filter((_, i) => i !== idx));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#888]">Opcje</span>
        <button type="button" onClick={addOption} className="text-[11px] text-[#fe4e00] hover:text-orange-300 transition">+ Dodaj opcję</button>
      </div>
      {options.map((opt, idx) => (
        <div key={opt.id} className="flex items-center gap-2">
          <input
            className={cn(INPUT, "flex-1")}
            placeholder="Etykieta"
            value={opt.label}
            onChange={(e) => updateOption(idx, "label", e.target.value)}
          />
          <input
            className={cn(INPUT, "flex-1")}
            placeholder="Wartość"
            value={opt.value}
            onChange={(e) => updateOption(idx, "value", e.target.value)}
          />
          <button type="button" onClick={() => removeOption(idx)} className="text-[#555] hover:text-red-400 transition">
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  );
}

function ColorOptionEditor({
  options,
  onChange,
}: {
  options: ProductAttributeOption[];
  onChange: (opts: ProductAttributeOption[]) => void;
}) {
  const addColor = () => {
    onChange([...options, { id: `o-${Date.now()}`, label: "", value: "#000000" }]);
  };
  const updateColor = (idx: number, field: "label" | "value", val: string) => {
    onChange(options.map((o, i) => i === idx ? { ...o, [field]: val } : o));
  };
  const removeColor = (idx: number) => onChange(options.filter((_, i) => i !== idx));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#888]">Kolory</span>
        <button type="button" onClick={addColor} className="text-[11px] text-[#fe4e00] hover:text-orange-300 transition">
          + Dodaj kolor
        </button>
      </div>

      {options.length === 0 && (
        <p className="text-[12px] text-[#555] py-1">Brak kolorów — kliknij „+ Dodaj kolor".</p>
      )}

      {options.map((opt, idx) => (
        <div key={opt.id} className="flex items-center gap-2.5">
          {/* Color swatch + native picker */}
          <label
            className="relative shrink-0 cursor-pointer"
            title="Kliknij aby wybrać kolor"
          >
            <span
              className="block h-8 w-8 rounded-full border-2 border-white/10 shadow-inner transition hover:border-white/30"
              style={{ backgroundColor: opt.value || "#000000" }}
            />
            <input
              type="color"
              value={opt.value || "#000000"}
              onChange={(e) => updateColor(idx, "value", e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>

          {/* Label input */}
          <input
            className={cn(INPUT, "flex-1 text-[13px]")}
            placeholder="Nazwa koloru (np. Czerwony)"
            value={opt.label}
            onChange={(e) => updateColor(idx, "label", e.target.value)}
          />

          {/* Hex value — readonly display, editable via picker */}
          <span className="shrink-0 font-mono text-[11px] text-[#555] w-16 text-center">
            {opt.value || "#000000"}
          </span>

          <button type="button" onClick={() => removeColor(idx)} className="text-[#555] hover:text-red-400 transition shrink-0">
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  );
}

function AttributeForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ProductAttribute;
  onSave: (data: Omit<ProductAttribute, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<ProductAttributeType>(initial?.type ?? "text");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [required, setRequired] = useState(initial?.required ?? false);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [options, setOptions] = useState<ProductAttributeOption[]>(initial?.options ?? []);
  const [error, setError] = useState("");

  const needsOptions = type === "select" || type === "multiselect" || type === "color";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) { setError("Etykieta jest wymagana"); return; }
    onSave({
      label: label.trim(),
      name: name || slugify(label),
      type,
      unit: unit.trim() || undefined,
      required,
      isActive,
      options: needsOptions ? options : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-[#888]">Etykieta</label>
        <input className={INPUT} value={label} onChange={(e) => { setLabel(e.target.value); if (!initial) setName(slugify(e.target.value)); }} placeholder="np. Materiał" />
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-[#888]">Klucz (nazwa techniczna)</label>
        <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="material" />
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-[#888]">Typ</label>
        <select className={INPUT} value={type} onChange={(e) => setType(e.target.value as ProductAttributeType)}>
          {ATTR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      {(type === "number") && (
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">Jednostka (opcjonalnie)</label>
          <input className={INPUT} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="np. mm, g/m², szt." />
        </div>
      )}
      {type === "color" && <ColorOptionEditor options={options} onChange={setOptions} />}
      {(type === "select" || type === "multiselect") && <OptionEditor options={options} onChange={setOptions} />}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-[13px] text-[#aaa]">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} className="accent-[#fe4e00]" />
          Wymagany
        </label>
        <label className="flex items-center gap-2 text-[13px] text-[#aaa]">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-[#fe4e00]" />
          Aktywny
        </label>
      </div>
      {error && <p className="text-[12px] text-red-400">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 rounded-lg bg-white py-2 text-[13px] font-semibold text-black hover:bg-gray-100 transition">
          {initial ? "Zapisz zmiany" : "Dodaj atrybut"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-[#2a2a2a] px-4 py-2 text-[13px] text-[#aaa] hover:text-white transition">
          Anuluj
        </button>
      </div>
    </form>
  );
}

function AttributeDetail({
  attr,
  onEdit,
  onDelete,
}: {
  attr: ProductAttribute;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const typeLabel = ATTR_TYPES.find((t) => t.value === attr.type)?.label ?? attr.type;
  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-bold text-white">{attr.label}</h3>
          <p className="mt-0.5 text-[12px] text-[#555]">{attr.name}</p>
        </div>
        <Badge colorClass={attr.isActive ? "bg-green-500/15 text-green-400" : "bg-zinc-500/15 text-zinc-400"}>
          {attr.isActive ? "Aktywny" : "Nieaktywny"}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-[#1a1a1a] px-3 py-2.5">
          <p className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Typ</p>
          <p className="text-[13px] text-white">{typeLabel}</p>
        </div>
        {attr.unit && (
          <div className="rounded-lg bg-[#1a1a1a] px-3 py-2.5">
            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Jednostka</p>
            <p className="text-[13px] text-white">{attr.unit}</p>
          </div>
        )}
        <div className="rounded-lg bg-[#1a1a1a] px-3 py-2.5">
          <p className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Wymagany</p>
          <p className="text-[13px] text-white">{attr.required ? "Tak" : "Nie"}</p>
        </div>
      </div>
      {attr.options && attr.options.length > 0 && (
        <div>
          <SectionTitle>
            {attr.type === "color" ? `Paleta kolorów (${attr.options.length})` : `Opcje (${attr.options.length})`}
          </SectionTitle>
          {attr.type === "color" ? (
            <div className="flex flex-col gap-2">
              {attr.options.map((o) => (
                <div key={o.id} className="flex items-center gap-3 rounded-lg bg-[#1a1a1a] px-3 py-2">
                  <span
                    className="h-6 w-6 shrink-0 rounded-full border border-white/10 shadow-inner"
                    style={{ backgroundColor: o.value }}
                  />
                  <span className="flex-1 text-[13px] text-white">{o.label || "—"}</span>
                  <span className="font-mono text-[11px] text-[#555]">{o.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {attr.options.map((o) => (
                <span key={o.id} className="rounded-md bg-[#1a1a1a] px-2.5 py-1 text-[12px] text-[#aaa]">{o.label}</span>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <button onClick={onEdit} className="flex-1 rounded-lg bg-white py-2 text-[13px] font-semibold text-black hover:bg-gray-100 transition">Edytuj</button>
        <button
          onClick={() => { if (confirm(`Usunąć atrybut "${attr.label}"?`)) onDelete(); }}
          className="rounded-lg border border-red-900/40 px-4 py-2 text-[13px] text-red-400 hover:border-red-500/50 transition"
        >
          Usuń
        </button>
      </div>
    </div>
  );
}

function AttributesPanel() {
  const { attributes, addAttribute, updateAttribute, deleteAttribute } = useProductsStore();
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductAttribute | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return attributes.filter((a) => !q || a.label.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
  }, [attributes, search]);

  const active = attributes.find((a) => a.id === activeId) ?? null;

  const openAdd = () => { setEditing(null); setShowForm(true); };
  const openEdit = (attr: ProductAttribute) => { setEditing(attr); setShowForm(true); };

  const handleSave = (data: Omit<ProductAttribute, "id" | "createdAt" | "updatedAt">) => {
    if (editing) { updateAttribute(editing.id, data); setActiveId(editing.id); }
    else { const a = addAttribute(data); setActiveId(a.id); }
    setShowForm(false); setEditing(null);
  };

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1e1e1e]">
          <div className="relative flex-1 max-w-xs">
            <SearchIcon />
            <input className={cn(INPUT, "pl-9")} placeholder="Szukaj atrybutów…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={openAdd} className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-[13px] font-semibold text-black hover:bg-gray-100 transition">
            <span className="text-[16px] leading-none">+</span> Dodaj atrybut
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[#444] text-[14px]">Brak atrybutów</div>
          ) : (
            <div className="p-4">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_120px_90px_80px] gap-3 px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#444]">
                <span>Atrybut</span>
                <span>Typ</span>
                <span>Opcje</span>
                <span>Status</span>
              </div>
              <div className="flex flex-col gap-1">
                {filtered.map((attr) => {
                  const typeLabel = ATTR_TYPES.find((t) => t.value === attr.type)?.label ?? attr.type;
                  const isActive = activeId === attr.id;
                  return (
                    <button
                      key={attr.id}
                      onClick={() => { setActiveId(attr.id); setShowForm(false); }}
                      className={cn(
                        "grid grid-cols-[1fr_120px_90px_80px] items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                        isActive ? "border-[#333] bg-[#1a1a1a]" : "border-transparent hover:border-[#222] hover:bg-[#161616]"
                      )}
                    >
                      <div>
                        <p className="text-[13px] font-semibold text-white">{attr.label}</p>
                        <p className="text-[11px] text-[#555]">{attr.name}{attr.unit ? ` · ${attr.unit}` : ""}</p>
                      </div>
                      <span className="text-[12px] text-[#888]">{typeLabel}</span>
                      <span className="text-[12px] text-[#888]">
                        {attr.type === "color" && attr.options && attr.options.length > 0 ? (
                          <span className="flex items-center gap-0.5">
                            {attr.options.slice(0, 5).map((o) => (
                              <span
                                key={o.id}
                                title={o.label || o.value}
                                className="inline-block h-3.5 w-3.5 rounded-full border border-white/10"
                                style={{ backgroundColor: o.value }}
                              />
                            ))}
                            {attr.options.length > 5 && (
                              <span className="text-[10px] text-[#555] ml-0.5">+{attr.options.length - 5}</span>
                            )}
                          </span>
                        ) : (
                          attr.options?.length ?? "—"
                        )}
                      </span>
                      <Badge colorClass={attr.isActive ? "bg-green-500/15 text-green-400" : "bg-zinc-500/15 text-zinc-400"}>
                        {attr.isActive ? "Aktywny" : "Nieakt."}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {(active || showForm) && (
        <aside className="w-[380px] shrink-0 border-l border-[#1e1e1e] overflow-y-auto">
          {showForm ? (
            <>
              <div className="px-5 py-4 border-b border-[#1e1e1e]">
                <h3 className="text-[14px] font-semibold text-white">{editing ? "Edytuj atrybut" : "Nowy atrybut"}</h3>
              </div>
              <AttributeForm initial={editing ?? undefined} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} />
            </>
          ) : active ? (
            <>
              <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-white">Szczegóły atrybutu</h3>
                <button onClick={() => setActiveId(null)} className="text-[#555] hover:text-white transition"><CloseIcon /></button>
              </div>
              <AttributeDetail
                attr={active}
                onEdit={() => openEdit(active)}
                onDelete={() => { deleteAttribute(active.id); setActiveId(null); }}
              />
            </>
          ) : null}
        </aside>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════

function ProductForm({
  initial,
  categories,
  attributes,
  onSave,
  onCancel,
}: {
  initial?: ProductItem;
  categories: ProductCategory[];
  attributes: ProductAttribute[];
  onSave: (data: Omit<ProductItem, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [priceRaw, setPriceRaw] = useState(initial?.price ? (initial.price.amount / 100).toFixed(2) : "");
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial?.imageUrl);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [attributeIds, setAttributeIds] = useState<string[]>(initial?.attributeIds ?? []);
  const [attributeValues, setAttributeValues] = useState<Record<string, string | number | boolean | string[]>>(initial?.attributeValues ?? {});
  const [tagsRaw, setTagsRaw] = useState((initial?.tags ?? []).join(", "));
  const [error, setError] = useState("");

  const activeAttributes = attributes.filter((a) => a.isActive && attributeIds.includes(a.id));

  const toggleAttr = (id: string) => {
    setAttributeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const setAttrValue = (name: string, val: string | number | boolean | string[]) => {
    setAttributeValues((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Nazwa jest wymagana"); return; }
    if (!categoryId) { setError("Wybierz kategorię"); return; }
    const priceAmount = priceRaw ? Math.round(parseFloat(priceRaw) * 100) : undefined;
    onSave({
      name: name.trim(),
      slug: slug || slugify(name),
      categoryId,
      description: description.trim() || undefined,
      sku: sku.trim() || undefined,
      price: priceAmount ? { amount: priceAmount, currency: "PLN" } : undefined,
      imageUrl,
      isActive,
      attributeIds,
      attributeValues,
      tags: tagsRaw.split(",").map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5">
      {/* Basic info */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#555]">Podstawowe informacje</p>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">Nazwa produktu</label>
          <input className={INPUT} value={name} onChange={(e) => { setName(e.target.value); if (!initial) setSlug(slugify(e.target.value)); }} placeholder="np. Ulotka A5" />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">Slug</label>
          <input className={INPUT} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ulotka-a5" />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">Kategoria</label>
          <select className={INPUT} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">— Wybierz kategorię —</option>
            {categories.filter((c) => c.isActive).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">Opis</label>
          <textarea className={cn(INPUT, "resize-none")} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcjonalny opis produktu" />
        </div>
      </div>

      {/* Pricing & SKU */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#555]">Cena i identyfikacja</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#888]">Cena (PLN)</label>
            <input type="number" step="0.01" min="0" className={INPUT} value={priceRaw} onChange={(e) => setPriceRaw(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[#888]">SKU</label>
            <input className={INPUT} value={sku} onChange={(e) => setSku(e.target.value)} placeholder="ULT-A5-001" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">Tagi (oddzielone przecinkami)</label>
          <input className={INPUT} value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="ulotka, a5, druk" />
        </div>
      </div>

      {/* Image */}
      <ImageUpload value={imageUrl} onChange={setImageUrl} />

      {/* Attributes selection */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#555]">Atrybuty produktu</p>
        {attributes.filter((a) => a.isActive).length === 0 ? (
          <p className="text-[12px] text-[#555]">Brak dostępnych atrybutów</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {attributes.filter((a) => a.isActive).map((attr) => (
              <button
                key={attr.id}
                type="button"
                onClick={() => toggleAttr(attr.id)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-[12px] transition",
                  attributeIds.includes(attr.id)
                    ? "border-[#fe4e00]/50 bg-[#fe4e00]/10 text-[#fe4e00]"
                    : "border-[#2a2a2a] text-[#666] hover:text-[#aaa]"
                )}
              >
                {attr.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Attribute values */}
      {activeAttributes.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#555]">Wartości atrybutów</p>
          {activeAttributes.map((attr) => (
            <div key={attr.id}>
              <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
                {attr.label}{attr.unit ? ` (${attr.unit})` : ""}
              </label>
              {attr.type === "color" && attr.options && attr.options.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {attr.options.map((o) => {
                    const selected = attributeValues[attr.name] === o.value;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        title={o.label || o.value}
                        onClick={() => setAttrValue(attr.name, selected ? "" : o.value)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition",
                          selected
                            ? "border-white/40 bg-white/10 text-white"
                            : "border-[#2a2a2a] text-[#666] hover:border-[#444] hover:text-[#aaa]"
                        )}
                      >
                        <span
                          className="h-4 w-4 shrink-0 rounded-full border border-white/10"
                          style={{ backgroundColor: o.value }}
                        />
                        {o.label || o.value}
                      </button>
                    );
                  })}
                </div>
              ) : attr.type === "color" ? (
                /* color attr with no palette yet — free hex input */
                <div className="flex items-center gap-2">
                  <label className="relative shrink-0 cursor-pointer">
                    <span
                      className="block h-8 w-8 rounded-full border-2 border-white/10 shadow-inner"
                      style={{ backgroundColor: (attributeValues[attr.name] as string) || "#000000" }}
                    />
                    <input
                      type="color"
                      value={(attributeValues[attr.name] as string) || "#000000"}
                      onChange={(e) => setAttrValue(attr.name, e.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                  <span className="font-mono text-[12px] text-[#666]">
                    {(attributeValues[attr.name] as string) || "#000000"}
                  </span>
                </div>
              ) : attr.type === "text" ? (
                <input className={INPUT} value={(attributeValues[attr.name] as string) ?? ""} onChange={(e) => setAttrValue(attr.name, e.target.value)} />
              ) : attr.type === "textarea" ? (
                <textarea className={cn(INPUT, "resize-none")} rows={2} value={(attributeValues[attr.name] as string) ?? ""} onChange={(e) => setAttrValue(attr.name, e.target.value)} />
              ) : attr.type === "number" ? (
                <input type="number" className={INPUT} value={(attributeValues[attr.name] as number) ?? ""} onChange={(e) => setAttrValue(attr.name, parseFloat(e.target.value))} />
              ) : attr.type === "boolean" ? (
                <label className="flex items-center gap-2 text-[13px] text-[#aaa]">
                  <input type="checkbox" checked={!!(attributeValues[attr.name])} onChange={(e) => setAttrValue(attr.name, e.target.checked)} className="accent-[#fe4e00]" />
                  Tak
                </label>
              ) : attr.type === "select" ? (
                <select className={INPUT} value={(attributeValues[attr.name] as string) ?? ""} onChange={(e) => setAttrValue(attr.name, e.target.value)}>
                  <option value="">— Wybierz —</option>
                  {attr.options?.map((o) => <option key={o.id} value={o.value}>{o.label}</option>)}
                </select>
              ) : attr.type === "multiselect" ? (
                <div className="flex flex-wrap gap-2">
                  {attr.options?.map((o) => {
                    const vals = (attributeValues[attr.name] as string[]) ?? [];
                    const checked = vals.includes(o.value);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          const current = (attributeValues[attr.name] as string[]) ?? [];
                          setAttrValue(attr.name, checked ? current.filter((v) => v !== o.value) : [...current, o.value]);
                        }}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-[12px] transition",
                          checked ? "border-[#fe4e00]/50 bg-[#fe4e00]/10 text-[#fe4e00]" : "border-[#2a2a2a] text-[#666] hover:text-[#aaa]"
                        )}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <label className="flex items-center gap-2 text-[13px] text-[#aaa]">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-[#fe4e00]" />
        Produkt aktywny
      </label>

      {error && <p className="text-[12px] text-red-400">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="submit" className="flex-1 rounded-lg bg-white py-2 text-[13px] font-semibold text-black hover:bg-gray-100 transition">
          {initial ? "Zapisz zmiany" : "Dodaj produkt"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-[#2a2a2a] px-4 py-2 text-[13px] text-[#aaa] hover:text-white transition">
          Anuluj
        </button>
      </div>
    </form>
  );
}

// ─── Stock helpers ────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  });
}

function StockBadge({ stock }: { stock: NonNullable<ProductItem["stock"]> }) {
  if (stock.qty === 0)
    return <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-400">Brak</span>;
  if (stock.qty <= stock.minQty)
    return (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
        Niski · {stock.qty} {stock.unit}
      </span>
    );
  return (
    <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[11px] font-semibold text-green-400">
      {stock.qty} {stock.unit}
    </span>
  );
}

const MV_LABEL: Record<StockMovementType, string> = {
  initial:    "Inicjalny",
  in:         "Przyjęcie",
  out:        "Wydanie",
  adjustment: "Korekta",
};
const MV_CLS: Record<StockMovementType, string> = {
  initial:    "bg-blue-500/15 text-blue-400",
  in:         "bg-green-500/15 text-green-400",
  out:        "bg-red-500/15 text-red-400",
  adjustment: "bg-purple-500/15 text-purple-400",
};

function MovementTypeBadge({ type }: { type: StockMovementType }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", MV_CLS[type])}>
      {MV_LABEL[type]}
    </span>
  );
}

// ─── ProductDetail ────────────────────────────────────────────────────────────

function ProductDetail({
  product,
  categories,
  attributes,
  onEdit,
  onDelete,
}: {
  product: ProductItem;
  categories: ProductCategory[];
  attributes: ProductAttribute[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const stockMovements = useProductsStore((s) => s.stockMovements);
  const adjustStock = useProductsStore((s) => s.adjustStock);
  const category = categories.find((c) => c.id === product.categoryId);
  const productAttrs = attributes.filter((a) => product.attributeIds.includes(a.id));
  const productMovements = stockMovements
    .filter((m) => m.productId === product.id)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const [stockDelta, setStockDelta] = useState("");
  const [stockReason, setStockReason] = useState("");
  const [stockMvType, setStockMvType] = useState<StockMovementType>("in");
  const [showAdjust, setShowAdjust] = useState(false);

  const handleStockAdjust = () => {
    const d = parseFloat(stockDelta);
    if (isNaN(d) || d === 0) return;
    const signed = stockMvType === "out" ? -Math.abs(d) : Math.abs(d);
    adjustStock(product.id, signed, stockMvType, stockReason || undefined);
    setStockDelta("");
    setStockReason("");
    setShowAdjust(false);
  };

  const getAttrDisplay = (attr: ProductAttribute) => {
    const val = product.attributeValues[attr.name];
    if (val === undefined || val === null || val === "") return "—";
    if (attr.type === "boolean") return val ? "Tak" : "Nie";
    if (attr.type === "multiselect" && Array.isArray(val)) {
      const labels = (val as string[]).map((v) => attr.options?.find((o) => o.value === v)?.label ?? v);
      return labels.join(", ") || "—";
    }
    if (attr.type === "select") {
      return attr.options?.find((o) => o.value === val)?.label ?? String(val);
    }
    return String(val) + (attr.unit ? ` ${attr.unit}` : "");
  };

  return (
    <div className="flex flex-col gap-5 p-5">
      {product.imageUrl && (
        <div className="w-full overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#111] aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" />
        </div>
      )}
      <div>
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-[16px] font-bold text-white">{product.name}</h3>
          <Badge colorClass={product.isActive ? "bg-green-500/15 text-green-400" : "bg-zinc-500/15 text-zinc-400"}>
            {product.isActive ? "Aktywny" : "Nieaktywny"}
          </Badge>
        </div>
        <p className="text-[12px] text-[#555]">{product.slug}{product.sku ? ` · SKU: ${product.sku}` : ""}</p>
      </div>

      {category && (
        <div>
          <SectionTitle>Kategoria</SectionTitle>
          <Badge colorClass={category.colorClass}>{category.name}</Badge>
        </div>
      )}

      {product.description && (
        <div>
          <SectionTitle>Opis</SectionTitle>
          <p className="text-[13px] text-[#888]">{product.description}</p>
        </div>
      )}

      {product.price && (
        <div>
          <SectionTitle>Cena</SectionTitle>
          <p className="text-[20px] font-bold text-white">{formatMoney(product.price.amount)}</p>
        </div>
      )}

      {productAttrs.length > 0 && (
        <div>
          <SectionTitle>Atrybuty</SectionTitle>
          <div className="flex flex-col gap-2">
            {productAttrs.map((attr) => {
              const val = product.attributeValues[attr.name];
              const isColor = attr.type === "color" && val && typeof val === "string" && val !== "";
              const colorLabel = isColor
                ? attr.options?.find((o) => o.value === val)?.label ?? val
                : null;
              return (
                <div key={attr.id} className="flex items-center justify-between rounded-lg bg-[#1a1a1a] px-3 py-2">
                  <span className="text-[12px] text-[#666]">{attr.label}</span>
                  {isColor ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 shrink-0 rounded-full border border-white/10"
                        style={{ backgroundColor: val as string }}
                      />
                      <span className="text-[13px] text-white">{colorLabel}</span>
                      <span className="font-mono text-[11px] text-[#555]">{val as string}</span>
                    </div>
                  ) : (
                    <span className="text-[13px] text-white">{getAttrDisplay(attr)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {product.tags.length > 0 && (
        <div>
          <SectionTitle>Tagi</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {product.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-[#1a1a1a] px-2.5 py-1 text-[11px] text-[#888]">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Stock section ── */}
      {product.stock?.enabled ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionTitle>Magazyn</SectionTitle>
            <button
              onClick={() => setShowAdjust((v) => !v)}
              className="text-[11px] font-medium text-[#fe4e00] hover:text-orange-400 transition"
            >
              {showAdjust ? "Anuluj" : "+ Korekta"}
            </button>
          </div>

          {/* Status row */}
          <div className="flex items-center justify-between rounded-lg bg-[#1a1a1a] px-3 py-2 mb-2">
            <div>
              <StockBadge stock={product.stock} />
              <p className="mt-1 text-[11px] text-[#555]">
                Próg niskiego stanu: {product.stock.minQty} {product.stock.unit}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[22px] font-bold text-white leading-none">{product.stock.qty}</p>
              <p className="text-[11px] text-[#555]">{product.stock.unit}</p>
            </div>
          </div>

          {/* Quick adjust form */}
          {showAdjust && (
            <div className="mb-3 rounded-lg border border-[#2a2a2a] bg-[#141414] p-3 space-y-2">
              {/* Type picker */}
              <div className="flex gap-1.5">
                {(["in", "out", "adjustment"] as StockMovementType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setStockMvType(t)}
                    className={cn(
                      "flex-1 rounded-md py-1.5 text-[11px] font-semibold transition border",
                      stockMvType === t
                        ? cn(MV_CLS[t], "border-current/30")
                        : "border-[#2a2a2a] text-[#555] hover:text-[#888]"
                    )}
                  >
                    {MV_LABEL[t]}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                placeholder="Ilość"
                value={stockDelta}
                onChange={(e) => setStockDelta(e.target.value)}
                className={INPUT}
              />
              <input
                type="text"
                placeholder="Powód (opcjonalnie)"
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
                className={INPUT}
              />
              <button
                onClick={handleStockAdjust}
                disabled={!stockDelta || parseFloat(stockDelta) === 0}
                className="w-full rounded-lg bg-[#fe4e00] py-2 text-[13px] font-semibold text-white hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Zapisz ruch
              </button>
            </div>
          )}

          {/* Movements history */}
          {productMovements.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#444]">
                Historia ruchów
              </p>
              <div className="flex flex-col gap-1">
                {productMovements.slice(0, 8).map((m) => (
                  <div key={m.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 rounded-lg bg-[#1a1a1a] px-3 py-1.5">
                    <MovementTypeBadge type={m.type} />
                    <p className="truncate text-[11px] text-[#888]">{m.reason ?? "—"}</p>
                    <span className={cn("text-[12px] font-bold tabular-nums", m.qty > 0 ? "text-green-400" : "text-red-400")}>
                      {m.qty > 0 ? `+${m.qty}` : m.qty}
                    </span>
                    <span className="text-[11px] text-[#555]">{fmtDate(m.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#2a2a2a] px-4 py-3 text-[12px] text-[#555]">
          Śledzenie magazynu wyłączone dla tego produktu.
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button onClick={onEdit} className="flex-1 rounded-lg bg-white py-2 text-[13px] font-semibold text-black hover:bg-gray-100 transition">Edytuj</button>
        <button
          onClick={() => { if (confirm(`Usunąć produkt "${product.name}"?`)) onDelete(); }}
          className="rounded-lg border border-red-900/40 px-4 py-2 text-[13px] text-red-400 hover:border-red-500/50 transition"
        >
          Usuń
        </button>
      </div>
    </div>
  );
}

function ProductsPanel() {
  const { products, categories, attributes, addProduct, updateProduct, deleteProduct } = useProductsStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProductItem | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const matchCat = categoryFilter === "all" || p.categoryId === categoryFilter;
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.tags.some((t) => t.includes(q));
      return matchCat && matchSearch;
    });
  }, [products, categories, search, categoryFilter]);

  const active = products.find((p) => p.id === activeId) ?? null;

  const openAdd = () => { setEditing(null); setShowForm(true); };
  const openEdit = (p: ProductItem) => { setEditing(p); setShowForm(true); };

  const handleSave = (data: Omit<ProductItem, "id" | "createdAt" | "updatedAt">) => {
    if (editing) { updateProduct(editing.id, data); setActiveId(editing.id); }
    else { const p = addProduct(data); setActiveId(p.id); }
    setShowForm(false); setEditing(null);
  };

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex flex-1 flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1e1e1e]">
          <div className="relative flex-1 max-w-xs">
            <SearchIcon />
            <input className={cn(INPUT, "pl-9")} placeholder="Szukaj produktów…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCategoryFilter("all")}
              className={cn("rounded-lg px-3 py-1.5 text-[12px] font-medium transition", categoryFilter === "all" ? "bg-[#1e1e1e] text-white" : "text-[#666] hover:text-[#aaa]")}
            >
              Wszystkie
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={cn("rounded-lg px-3 py-1.5 text-[12px] font-medium transition", categoryFilter === cat.id ? "bg-[#1e1e1e] text-white" : "text-[#666] hover:text-[#aaa]")}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <button onClick={openAdd} className="ml-auto flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-[13px] font-semibold text-black hover:bg-gray-100 transition">
            <span className="text-[16px] leading-none">+</span> Dodaj produkt
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#444]">
              <p className="text-[14px]">Brak produktów</p>
              <button onClick={openAdd} className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] text-[#888] hover:text-white transition">
                + Dodaj pierwszy produkt
              </button>
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-[44px_1fr_140px_100px_80px_80px] gap-3 px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#444]">
                <span />
                <span>Produkt</span>
                <span>Kategoria</span>
                <span>Cena</span>
                <span>SKU</span>
                <span>Status</span>
              </div>
              <div className="flex flex-col gap-1">
                {filtered.map((prod) => {
                  const cat = categories.find((c) => c.id === prod.categoryId);
                  const isSelected = activeId === prod.id;
                  return (
                    <button
                      key={prod.id}
                      onClick={() => { setActiveId(prod.id); setShowForm(false); }}
                      className={cn(
                        "grid grid-cols-[44px_1fr_140px_100px_80px_80px] items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                        isSelected ? "border-[#333] bg-[#1a1a1a]" : "border-transparent hover:border-[#222] hover:bg-[#161616]"
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-[#2a2a2a] bg-[#1a1a1a]">
                        {prod.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={prod.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="text-[#444]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-white">{prod.name}</p>
                        <p className="truncate text-[11px] text-[#555]">{prod.slug}</p>
                      </div>
                      {cat ? (
                        <Badge colorClass={cat.colorClass}>{cat.name}</Badge>
                      ) : (
                        <span className="text-[12px] text-[#555]">—</span>
                      )}
                      <span className="text-[13px] text-white">
                        {prod.price ? formatMoney(prod.price.amount) : <span className="text-[#555]">—</span>}
                      </span>
                      <span className="text-[12px] text-[#666]">{prod.sku ?? "—"}</span>
                      <Badge colorClass={prod.isActive ? "bg-green-500/15 text-green-400" : "bg-zinc-500/15 text-zinc-400"}>
                        {prod.isActive ? "Aktywny" : "Nieakt."}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail / Form */}
      {(active || showForm) && (
        <aside className="w-[420px] shrink-0 border-l border-[#1e1e1e] overflow-y-auto">
          {showForm ? (
            <>
              <div className="px-5 py-4 border-b border-[#1e1e1e]">
                <h3 className="text-[14px] font-semibold text-white">{editing ? "Edytuj produkt" : "Nowy produkt"}</h3>
              </div>
              <ProductForm
                initial={editing ?? undefined}
                categories={categories}
                attributes={attributes}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditing(null); }}
              />
            </>
          ) : active ? (
            <>
              <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-white">Szczegóły produktu</h3>
                <button onClick={() => setActiveId(null)} className="text-[#555] hover:text-white transition"><CloseIcon /></button>
              </div>
              <ProductDetail
                product={active}
                categories={categories}
                attributes={attributes}
                onEdit={() => openEdit(active)}
                onDelete={() => { deleteProduct(active.id); setActiveId(null); }}
              />
            </>
          ) : null}
        </aside>
      )}
    </div>
  );
}

// ─── Stock Panel ─────────────────────────────────────────────────────────────

function StockStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-[#1e1e1e] bg-[#141414] px-5 py-3">
      <span className="text-[26px] font-bold leading-none" style={{ color }}>{value}</span>
      <span className="text-[11px] text-[#555]">{label}</span>
    </div>
  );
}

function StockPanel() {
  const { products, categories, stockMovements, adjustStock } = useProductsStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [mvType, setMvType] = useState<StockMovementType>("in");

  const stockProducts = products.filter((p) => p.stock?.enabled);
  const lowStock  = stockProducts.filter((p) => p.stock && p.stock.qty > 0 && p.stock.qty <= p.stock.minQty).length;
  const outOfStock = stockProducts.filter((p) => p.stock && p.stock.qty === 0).length;

  const selectedProduct = stockProducts.find((p) => p.id === selectedId) ?? null;
  const selectedMovements = selectedId
    ? stockMovements
        .filter((m) => m.productId === selectedId)
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [];

  const handleAdjust = () => {
    const d = parseFloat(delta);
    if (!adjustingId || isNaN(d) || d === 0) return;
    const signed = mvType === "out" ? -Math.abs(d) : Math.abs(d);
    adjustStock(adjustingId, signed, mvType, reason || undefined);
    setAdjustingId(null);
    setDelta("");
    setReason("");
    setMvType("in");
  };

  return (
    <div className="flex flex-1 min-h-0">
      {/* ── Left: product table ── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Stats */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1e1e1e]">
          <StockStat label="Śledzonych produktów" value={stockProducts.length} color="#e0e0e0" />
          <StockStat label="Niski stan"            value={lowStock}            color="#fbbf24" />
          <StockStat label="Brak towaru"           value={outOfStock}          color="#f87171" />
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {stockProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-[#444]">
              <p className="text-[14px]">Brak produktów ze śledzeniem magazynu.</p>
              <p className="text-[12px] text-[#555]">Włącz śledzenie w ustawieniach produktu.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_120px_100px_80px_100px] gap-3 px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#444]">
                <span>Produkt</span>
                <span>Kategoria</span>
                <span>Stan</span>
                <span>Próg</span>
                <span>Akcje</span>
              </div>
              <div className="flex flex-col gap-1">
                {stockProducts.map((prod) => {
                  const cat = categories.find((c) => c.id === prod.categoryId);
                  const isSelected = selectedId === prod.id;
                  const isAdjusting = adjustingId === prod.id;
                  return (
                    <div key={prod.id} className="flex flex-col">
                      <button
                        onClick={() => setSelectedId(isSelected ? null : prod.id)}
                        className={cn(
                          "grid grid-cols-[1fr_120px_100px_80px_100px] items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                          isSelected ? "border-[#333] bg-[#1a1a1a]" : "border-transparent hover:border-[#222] hover:bg-[#161616]"
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-white">{prod.name}</p>
                          <p className="truncate text-[11px] text-[#555]">{prod.sku ?? prod.slug}</p>
                        </div>
                        {cat ? (
                          <Badge colorClass={cat.colorClass}>{cat.name}</Badge>
                        ) : (
                          <span className="text-[12px] text-[#555]">—</span>
                        )}
                        <StockBadge stock={prod.stock!} />
                        <span className="text-[12px] text-[#666]">
                          {prod.stock!.minQty} {prod.stock!.unit}
                        </span>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setAdjustingId(isAdjusting ? null : prod.id); setDelta(""); setReason(""); setMvType("in"); }}
                            className="rounded-lg border border-[#2a2a2a] px-2.5 py-1.5 text-[11px] text-[#888] hover:border-[#fe4e00]/40 hover:text-[#fe4e00] transition"
                          >
                            Korekta
                          </button>
                        </div>
                      </button>

                      {/* Inline adjustment form */}
                      {isAdjusting && (
                        <div className="mx-4 mb-2 rounded-xl border border-[#2a2a2a] bg-[#141414] p-3 space-y-2">
                          <div className="flex gap-1.5">
                            {(["in", "out", "adjustment"] as StockMovementType[]).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setMvType(t)}
                                className={cn(
                                  "flex-1 rounded-md py-1.5 text-[11px] font-semibold transition border",
                                  mvType === t
                                    ? cn(MV_CLS[t], "border-current/20 bg-current/5")
                                    : "border-[#2a2a2a] text-[#555] hover:text-[#888]"
                                )}
                              >
                                {MV_LABEL[t]}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={1}
                              placeholder="Ilość"
                              value={delta}
                              onChange={(e) => setDelta(e.target.value)}
                              className={cn(INPUT, "flex-1")}
                            />
                            <input
                              type="text"
                              placeholder="Powód (opcjonalnie)"
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              className={cn(INPUT, "flex-[2]")}
                            />
                            <button
                              onClick={handleAdjust}
                              disabled={!delta || parseFloat(delta) === 0}
                              className="rounded-lg bg-[#fe4e00] px-4 text-[13px] font-semibold text-white hover:bg-orange-500 disabled:opacity-40 transition"
                            >
                              Zapisz
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Right: movement history ── */}
      {selectedProduct && (
        <aside className="w-[380px] shrink-0 border-l border-[#1e1e1e] overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
            <div>
              <h3 className="text-[14px] font-semibold text-white">{selectedProduct.name}</h3>
              <p className="text-[11px] text-[#555]">Historia ruchów magazynowych</p>
            </div>
            <button onClick={() => setSelectedId(null)} className="text-[#555] hover:text-white transition">
              <CloseIcon />
            </button>
          </div>

          {/* Current stock summary */}
          {selectedProduct.stock && (
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e1e1e] bg-[#141414]">
              <div>
                <p className="text-[11px] text-[#555] mb-0.5">Aktualny stan</p>
                <StockBadge stock={selectedProduct.stock} />
              </div>
              <div className="text-right">
                <p className="text-[28px] font-bold text-white leading-none">{selectedProduct.stock.qty}</p>
                <p className="text-[11px] text-[#555]">{selectedProduct.stock.unit}</p>
              </div>
            </div>
          )}

          {/* Movements list */}
          <div className="p-4 flex flex-col gap-2">
            {selectedMovements.length === 0 ? (
              <p className="text-center text-[13px] text-[#555] py-8">Brak ruchów magazynowych.</p>
            ) : (
              selectedMovements.map((m) => (
                <div key={m.id} className="rounded-xl border border-[#1e1e1e] bg-[#141414] px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <MovementTypeBadge type={m.type} />
                    <span className={cn("text-[15px] font-bold tabular-nums", m.qty > 0 ? "text-green-400" : "text-red-400")}>
                      {m.qty > 0 ? `+${m.qty}` : m.qty}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-[#777]">{m.reason ?? <span className="text-[#444]">—</span>}</p>
                    <div className="text-right">
                      <p className="text-[10px] text-[#555]">{fmtDate(m.createdAt)}</p>
                      <p className="text-[11px] text-[#888]">Saldo: <span className="text-white font-semibold">{m.balanceAfter}</span></p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555]" viewBox="0 0 16 16" fill="none">
      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

export function ProductsScreen() {
  const [tab, setTab] = useState<Tab>("products");
  const { products, categories, attributes, stockMovements } = useProductsStore();

  const stockTrackedCount = products.filter((p) => p.stock?.enabled).length;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "products",   label: "Produkty",   count: products.length },
    { id: "categories", label: "Kategorie",  count: categories.length },
    { id: "attributes", label: "Atrybuty",   count: attributes.length },
    { id: "stock",      label: "Magazyn",    count: stockTrackedCount },
  ];

  return (
    <div className="flex h-full flex-col bg-[#111111]">
      {/* Header */}
      <div className="px-8 pt-8 pb-0 flex items-start justify-between shrink-0">
        <div>
          <h1 className="text-[22px] font-bold text-white tracking-tight">Produkty</h1>
          <p className="mt-0.5 text-[13px] text-[#666]">
            Zarządzaj katalogiem produktów, kategoriami i atrybutami.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-8 pt-5 pb-0 shrink-0 border-b border-[#1e1e1e]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors",
              tab === t.id ? "text-white" : "text-[#555] hover:text-[#aaa]"
            )}
          >
            {t.label}
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              tab === t.id ? "bg-[#fe4e00]/20 text-[#fe4e00]" : "bg-[#1e1e1e] text-[#555]"
            )}>
              {t.count}
            </span>
            {tab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#fe4e00]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-0">
        {tab === "products"   && <ProductsPanel />}
        {tab === "categories" && <CategoriesPanel />}
        {tab === "attributes" && <AttributesPanel />}
        {tab === "stock"      && <StockPanel />}
      </div>
    </div>
  );
}
