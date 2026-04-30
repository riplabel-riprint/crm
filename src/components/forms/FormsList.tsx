"use client";

import { useState } from "react";
import { useFormsStore, FormDefinition } from "@/store/forms-store";

interface FormsListProps {
  onEdit: (form: FormDefinition) => void;
  onNew: () => void;
}

export function FormsList({ onEdit, onNew }: FormsListProps) {
  const { forms, deleteForm } = useFormsStore();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(`[riprint-form id="${id}"]`);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteForm(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  if (forms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 text-5xl opacity-30">📋</div>
        <p className="text-text-primary font-medium mb-1">Brak formularzy</p>
        <p className="text-text-secondary text-sm mb-6">
          Utwórz pierwszy formularz, aby zacząć zbierać dane.
        </p>
        <button onClick={onNew} className="btn-accent">
          + Nowy formularz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {forms.length} {forms.length === 1 ? "formularz" : forms.length < 5 ? "formularze" : "formularzy"}
        </p>
        <button onClick={onNew} className="btn-accent text-sm px-4 py-2">
          + Nowy formularz
        </button>
      </div>

      <div className="grid gap-3">
        {forms.map((form) => (
          <div
            key={form.id}
            className="glass-card rounded-lg border border-[var(--border-subtle)] p-5 flex items-start gap-4 group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-text-primary font-medium truncate">{form.name}</h3>
                <span className="shrink-0 text-xs text-text-muted bg-white/5 border border-[var(--border-subtle)] rounded px-1.5 py-0.5">
                  {form.fields.length} {form.fields.length === 1 ? "pole" : "pól"}
                </span>
              </div>
              {form.description && (
                <p className="text-sm text-text-secondary truncate mb-2">{form.description}</p>
              )}
              <div className="flex items-center gap-2">
                <code className="text-xs bg-white/5 border border-[var(--border-subtle)] rounded px-2 py-1 text-accent font-mono">
                  {`[riprint-form id="${form.id}"]`}
                </code>
                <button
                  onClick={() => handleCopy(form.id)}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors shrink-0"
                >
                  {copied === form.id ? "✓ skopiowano" : "kopiuj"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onEdit(form)}
                className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary border border-[var(--border-subtle)] hover:border-accent/40 rounded-md transition-all duration-150"
              >
                Edytuj
              </button>
              <button
                onClick={() => handleDelete(form.id)}
                className={[
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150",
                  confirmDelete === form.id
                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                    : "text-text-muted hover:text-red-400 border border-transparent hover:border-red-500/30",
                ].join(" ")}
              >
                {confirmDelete === form.id ? "Potwierdź" : "Usuń"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
