import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FieldType = "input" | "textarea" | "select" | "checkbox" | "radio" | "date" | "number";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  helpText?: string;
}

export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

interface FormsState {
  forms: FormDefinition[];
  addForm: (form: Omit<FormDefinition, "id" | "createdAt" | "updatedAt">) => string;
  updateForm: (id: string, updates: Partial<Omit<FormDefinition, "id" | "createdAt">>) => void;
  deleteForm: (id: string) => void;
  getFormById: (id: string) => FormDefinition | undefined;
}

export const useFormsStore = create<FormsState>()(
  persist(
    (set, get) => ({
      forms: [],

      addForm: (form) => {
        const id = `form_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const now = new Date().toISOString();
        set((state) => ({
          forms: [{ ...form, id, createdAt: now, updatedAt: now }, ...state.forms],
        }));
        return id;
      },

      updateForm: (id, updates) => {
        set((state) => ({
          forms: state.forms.map((f) =>
            f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
          ),
        }));
      },

      deleteForm: (id) => {
        set((state) => ({ forms: state.forms.filter((f) => f.id !== id) }));
      },

      getFormById: (id) => get().forms.find((f) => f.id === id),
    }),
    { name: "riprint-forms-store" }
  )
);
