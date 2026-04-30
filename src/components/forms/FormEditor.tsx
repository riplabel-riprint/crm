"use client";

import { useState, useCallback } from "react";
import { FormField, FieldType, FormDefinition } from "@/store/forms-store";

const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: "input", label: "Tekst", icon: "T" },
  { type: "textarea", label: "Obszar tekstu", icon: "¶" },
  { type: "number", label: "Liczba", icon: "#" },
  { type: "date", label: "Data", icon: "📅" },
  { type: "select", label: "Lista wyboru", icon: "▾" },
  { type: "checkbox", label: "Pola wyboru", icon: "☑" },
  { type: "radio", label: "Wybór jednokrotny", icon: "◉" },
];

function uid() {
  return `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

interface FormEditorProps {
  initialForm?: FormDefinition;
  onSave: (name: string, description: string, fields: FormField[]) => void;
  onCancel: () => void;
}

interface FieldEditorProps {
  field: FormField;
  onChange: (updated: FormField) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function FieldEditor({ field, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: FieldEditorProps) {
  const [expanded, setExpanded] = useState(true);
  const hasOptions = field.type === "select" || field.type === "checkbox" || field.type === "radio";
  const optionsText = (field.options ?? []).join("\n");

  return (
    <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden bg-white/3">
      {/* Field header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white/5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-text-muted hover:text-text-primary transition-colors text-xs"
        >
          {expanded ? "▾" : "▸"}
        </button>
        <span className="text-xs font-mono text-accent bg-accent/10 rounded px-1.5 py-0.5">
          {FIELD_TYPES.find((f) => f.type === field.type)?.icon}
        </span>
        <span className="flex-1 text-sm text-text-primary font-medium truncate">
          {field.label || <span className="text-text-muted italic">Bez nazwy</span>}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors text-xs"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors text-xs"
          >
            ↓
          </button>
          <button
            onClick={onRemove}
            className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-red-400 transition-colors text-xs ml-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Field body */}
      {expanded && (
        <div className="px-4 py-4 grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="field-label">Etykieta pola</label>
            <input
              className="input-dark w-full"
              value={field.label}
              onChange={(e) => onChange({ ...field, label: e.target.value })}
              placeholder="np. Imię i nazwisko"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="field-label">Typ pola</label>
            <select
              className="input-dark w-full"
              value={field.type}
              onChange={(e) => onChange({ ...field, type: e.target.value as FieldType, options: [] })}
            >
              {FIELD_TYPES.map((ft) => (
                <option key={ft.type} value={ft.type}>
                  {ft.label}
                </option>
              ))}
            </select>
          </div>

          {(field.type === "input" || field.type === "textarea" || field.type === "number") && (
            <div className="col-span-2 sm:col-span-1">
              <label className="field-label">Placeholder</label>
              <input
                className="input-dark w-full"
                value={field.placeholder ?? ""}
                onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
                placeholder="Tekst podpowiedzi…"
              />
            </div>
          )}

          <div className="col-span-2 sm:col-span-1">
            <label className="field-label">Tekst pomocy</label>
            <input
              className="input-dark w-full"
              value={field.helpText ?? ""}
              onChange={(e) => onChange({ ...field, helpText: e.target.value })}
              placeholder="Opcjonalny opis pod polem"
            />
          </div>

          {hasOptions && (
            <div className="col-span-2">
              <label className="field-label">Opcje (jedna na linię)</label>
              <textarea
                className="input-dark w-full resize-none"
                rows={4}
                value={optionsText}
                onChange={(e) =>
                  onChange({
                    ...field,
                    options: e.target.value.split("\n").filter((o) => o.trim() !== ""),
                  })
                }
                placeholder={"Opcja 1\nOpcja 2\nOpcja 3"}
              />
            </div>
          )}

          <div className="col-span-2 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="accent-accent"
                checked={field.required}
                onChange={(e) => onChange({ ...field, required: e.target.checked })}
              />
              <span className="text-sm text-text-secondary">Pole wymagane</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export function FormEditor({ initialForm, onSave, onCancel }: FormEditorProps) {
  const [name, setName] = useState(initialForm?.name ?? "");
  const [description, setDescription] = useState(initialForm?.description ?? "");
  const [fields, setFields] = useState<FormField[]>(initialForm?.fields ?? []);
  const [error, setError] = useState("");

  const addField = useCallback((type: FieldType) => {
    setFields((prev) => [
      ...prev,
      { id: uid(), type, label: "", required: false, options: [] },
    ]);
  }, []);

  const updateField = useCallback((index: number, updated: FormField) => {
    setFields((prev) => prev.map((f, i) => (i === index ? updated : f)));
  }, []);

  const removeField = useCallback((index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveField = useCallback((index: number, direction: -1 | 1) => {
    setFields((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const handleSave = () => {
    if (!name.trim()) {
      setError("Nazwa formularza jest wymagana.");
      return;
    }
    setError("");
    onSave(name.trim(), description.trim(), fields);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
      {/* Main editor */}
      <div className="space-y-5">
        {/* Form meta */}
        <div className="glass-card rounded-lg border border-[var(--border-subtle)] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
            Informacje o formularzu
          </h2>
          <div>
            <label className="field-label">Nazwa formularza *</label>
            <input
              className="input-dark w-full"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="np. Formularz kontaktowy"
            />
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          </div>
          <div>
            <label className="field-label">Opis (opcjonalny)</label>
            <input
              className="input-dark w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Krótki opis celu formularza"
            />
          </div>
        </div>

        {/* Fields */}
        <div className="glass-card rounded-lg border border-[var(--border-subtle)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Pola formularza
            </h2>
            <span className="text-xs text-text-muted">{fields.length} pól</span>
          </div>

          {fields.length === 0 && (
            <div className="py-10 text-center border border-dashed border-[var(--border-subtle)] rounded-lg">
              <p className="text-text-muted text-sm">
                Dodaj pierwsze pole z panelu po prawej stronie →
              </p>
            </div>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <FieldEditor
                key={field.id}
                field={field}
                onChange={(updated) => updateField(index, updated)}
                onRemove={() => removeField(index)}
                onMoveUp={() => moveField(index, -1)}
                onMoveDown={() => moveField(index, 1)}
                isFirst={index === 0}
                isLast={index === fields.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="btn-accent">
            Zapisz formularz
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary border border-[var(--border-subtle)] hover:border-white/20 rounded-lg transition-all duration-150"
          >
            Anuluj
          </button>
        </div>
      </div>

      {/* Sidebar: add fields */}
      <div className="space-y-4">
        <div className="glass-card rounded-lg border border-[var(--border-subtle)] p-4 sticky top-6">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
            Dodaj pole
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {FIELD_TYPES.map((ft) => (
              <button
                key={ft.type}
                onClick={() => addField(ft.type)}
                className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border border-[var(--border-subtle)] bg-white/3 hover:bg-white/8 hover:border-accent/30 transition-all duration-150 group"
              >
                <span className="text-lg text-accent/70 group-hover:text-accent transition-colors">
                  {ft.icon}
                </span>
                <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors text-center leading-tight">
                  {ft.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
            <p className="text-xs text-text-muted leading-relaxed">
              Kliknij typ pola, aby dodać go do formularza. Możesz zmieniać kolejność polami ↑↓.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
