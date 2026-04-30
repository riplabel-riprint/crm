"use client";

import { useState } from "react";
import { FormField, FormDefinition } from "@/store/forms-store";

interface FormPreviewProps {
  form: FormDefinition;
  onEdit: () => void;
}

function PreviewField({ field }: { field: FormField }) {
  const [checkboxValues, setCheckboxValues] = useState<Record<string, boolean>>({});

  const toggleCheckbox = (option: string) =>
    setCheckboxValues((prev) => ({ ...prev, [option]: !prev[option] }));

  const labelEl = (
    <label className="block text-sm font-medium text-text-primary mb-1.5">
      {field.label || <span className="text-text-muted italic">Bez nazwy</span>}
      {field.required && <span className="ml-1 text-red-400">*</span>}
    </label>
  );

  const helpEl = field.helpText ? (
    <p className="mt-1.5 text-xs text-text-muted">{field.helpText}</p>
  ) : null;

  switch (field.type) {
    case "input":
      return (
        <div>
          {labelEl}
          <input className="input-dark w-full" placeholder={field.placeholder} />
          {helpEl}
        </div>
      );

    case "textarea":
      return (
        <div>
          {labelEl}
          <textarea
            className="input-dark w-full resize-none"
            rows={4}
            placeholder={field.placeholder}
          />
          {helpEl}
        </div>
      );

    case "number":
      return (
        <div>
          {labelEl}
          <input type="number" className="input-dark w-full" placeholder={field.placeholder} />
          {helpEl}
        </div>
      );

    case "date":
      return (
        <div>
          {labelEl}
          <input type="date" className="input-dark w-full" />
          {helpEl}
        </div>
      );

    case "select":
      return (
        <div>
          {labelEl}
          <select className="input-dark w-full">
            <option value="">— wybierz opcję —</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {helpEl}
        </div>
      );

    case "checkbox":
      return (
        <div>
          {labelEl}
          <div className="space-y-2 mt-1">
            {(field.options ?? []).map((opt) => (
              <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-accent w-4 h-4"
                  checked={!!checkboxValues[opt]}
                  onChange={() => toggleCheckbox(opt)}
                />
                <span className="text-sm text-text-secondary">{opt}</span>
              </label>
            ))}
            {(field.options ?? []).length === 0 && (
              <p className="text-xs text-text-muted italic">Brak opcji</p>
            )}
          </div>
          {helpEl}
        </div>
      );

    case "radio":
      return (
        <div>
          {labelEl}
          <div className="space-y-2 mt-1">
            {(field.options ?? []).map((opt) => (
              <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name={`radio-${field.id}`}
                  className="accent-accent w-4 h-4"
                  value={opt}
                />
                <span className="text-sm text-text-secondary">{opt}</span>
              </label>
            ))}
            {(field.options ?? []).length === 0 && (
              <p className="text-xs text-text-muted italic">Brak opcji</p>
            )}
          </div>
          {helpEl}
        </div>
      );

    default:
      return null;
  }
}

export function FormPreview({ form, onEdit }: FormPreviewProps) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-text-primary font-semibold text-lg">{form.name}</h2>
          {form.description && (
            <p className="text-text-secondary text-sm mt-0.5">{form.description}</p>
          )}
        </div>
        <button
          onClick={onEdit}
          className="shrink-0 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary border border-[var(--border-subtle)] hover:border-accent/40 rounded-md transition-all duration-150"
        >
          Edytuj formularz
        </button>
      </div>

      <div className="glass-card rounded-lg border border-[var(--border-subtle)] p-6 space-y-5">
        {form.fields.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">
            Formularz nie ma żadnych pól. Dodaj je w edytorze.
          </p>
        ) : (
          form.fields.map((field) => <PreviewField key={field.id} field={field} />)
        )}

        {form.fields.length > 0 && (
          <div className="pt-2">
            <button className="btn-accent w-full">Wyślij formularz</button>
          </div>
        )}
      </div>

      <p className="text-xs text-text-muted text-center">
        To jest podgląd formularza — dane nie zostaną wysłane.
      </p>
    </div>
  );
}
