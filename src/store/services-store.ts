import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Service,
  ServiceField,
  OrderServiceConfiguration,
  ServiceProductAssignment,
  ServiceStage,
  ServiceTask,
  ServiceCategoryDef,
  Product,
} from "@/types";
import { SERVICE_SPEC_OPTIONS, type SpecOptionDef } from "@/lib/business/order-form-types";

export const DEFAULT_CATEGORIES: ServiceCategoryDef[] = [
  { id: "print_large_format", label: "Druk wielkoformatowy", colorClasses: "bg-blue-50 text-blue-700" },
  { id: "print_digital",      label: "Druk cyfrowy",         colorClasses: "bg-violet-50 text-violet-700" },
  { id: "print_offset",       label: "Druk offsetowy",       colorClasses: "bg-cyan-50 text-cyan-700" },
  { id: "finishing",          label: "Wykończenie",           colorClasses: "bg-amber-50 text-amber-700" },
  { id: "design",             label: "Projekt graficzny",     colorClasses: "bg-pink-50 text-pink-700" },
  { id: "delivery",           label: "Dostawa",               colorClasses: "bg-emerald-50 text-emerald-700" },
  { id: "other",              label: "Inne",                  colorClasses: "bg-slate-100 text-slate-600" },
];

export type { SpecOptionDef };

type ServicesState = {
  services: Service[];
  fields: ServiceField[];
  configurations: OrderServiceConfiguration[];
  productAssignments: ServiceProductAssignment[];
  products: Product[];
  stages: ServiceStage[];
  categories: ServiceCategoryDef[];
  serviceSpecDefs: Record<string, SpecOptionDef[]>;

  // Service actions
  addService: (service: Service) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;

  // Field actions
  addField: (field: ServiceField) => void;
  updateField: (id: string, updates: Partial<ServiceField>) => void;
  deleteField: (id: string) => void;
  moveFieldUp: (id: string) => void;
  moveFieldDown: (id: string) => void;

  // Configuration actions
  addConfiguration: (config: OrderServiceConfiguration) => void;
  updateConfiguration: (id: string, values: OrderServiceConfiguration["values"]) => void;
  deleteConfiguration: (id: string) => void;

  // Product actions
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Omit<Product, "id" | "serviceId">>) => void;
  deleteProduct: (id: string) => void;

  // Catalog product linking
  linkProduct: (serviceId: string, productId: string) => void;
  unlinkProduct: (serviceId: string, productId: string) => void;

  // Product assignment actions
  setProductAssignments: (serviceId: string, products: ServiceProductAssignment[]) => void;
  deleteProductAssignmentsForService: (serviceId: string) => void;

  // Stage actions
  setStages: (serviceId: string, stages: ServiceStage[]) => void;
  deleteStagesForService: (serviceId: string) => void;

  // Category actions
  addCategory: (cat: ServiceCategoryDef) => void;
  updateCategory: (id: string, updates: Partial<Omit<ServiceCategoryDef, "id">>) => void;
  deleteCategory: (id: string) => void;

  // Spec option group actions (per service)
  setSpecDefs: (serviceId: string, defs: SpecOptionDef[]) => void;
  addSpecDef: (serviceId: string, def: SpecOptionDef) => void;
  updateSpecDef: (serviceId: string, key: string, def: SpecOptionDef) => void;
  deleteSpecDef: (serviceId: string, key: string) => void;
};

export const useServicesStore = create<ServicesState>()(
  persist(
    (set, get) => ({
      services: [],
      fields: [],
      configurations: [],
      productAssignments: [],
      products: [],
      stages: [],
      categories: DEFAULT_CATEGORIES,
      serviceSpecDefs: SERVICE_SPEC_OPTIONS,

      addService: (service) =>
        set((s) => ({ services: [...s.services, service] })),

      updateService: (id, updates) =>
        set((s) => ({
          services: s.services.map((svc) => (svc.id === id ? { ...svc, ...updates } : svc)),
        })),

      deleteService: (id) =>
        set((s) => ({
          services: s.services.filter((svc) => svc.id !== id),
          fields: s.fields.filter((f) => f.serviceId !== id),
          configurations: s.configurations.filter((c) => c.serviceId !== id),
          productAssignments: s.productAssignments.filter((p) => p.serviceId !== id),
          products: s.products.filter((p) => p.serviceId !== id),
          stages: s.stages.filter((st) => st.serviceId !== id),
        })),

      addField: (field) =>
        set((s) => ({ fields: [...s.fields, field] })),

      updateField: (id, updates) =>
        set((s) => ({
          fields: s.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        })),

      deleteField: (id) =>
        set((s) => ({ fields: s.fields.filter((f) => f.id !== id) })),

      moveFieldUp: (id) =>
        set((s) => {
          const field = s.fields.find((f) => f.id === id);
          if (!field) return s;
          const sorted = s.fields
            .filter((f) => f.serviceId === field.serviceId)
            .sort((a, b) => a.order - b.order);
          const idx = sorted.findIndex((f) => f.id === id);
          if (idx <= 0) return s;
          const prev = sorted[idx - 1];
          return {
            fields: s.fields.map((f) =>
              f.id === id ? { ...f, order: prev.order } :
              f.id === prev.id ? { ...f, order: field.order } : f
            ),
          };
        }),

      moveFieldDown: (id) =>
        set((s) => {
          const field = s.fields.find((f) => f.id === id);
          if (!field) return s;
          const sorted = s.fields
            .filter((f) => f.serviceId === field.serviceId)
            .sort((a, b) => a.order - b.order);
          const idx = sorted.findIndex((f) => f.id === id);
          if (idx >= sorted.length - 1) return s;
          const next = sorted[idx + 1];
          return {
            fields: s.fields.map((f) =>
              f.id === id ? { ...f, order: next.order } :
              f.id === next.id ? { ...f, order: field.order } : f
            ),
          };
        }),

      addConfiguration: (config) =>
        set((s) => ({ configurations: [...s.configurations, config] })),

      updateConfiguration: (id, values) =>
        set((s) => ({
          configurations: s.configurations.map((c) => (c.id === id ? { ...c, values } : c)),
        })),

      deleteConfiguration: (id) =>
        set((s) => ({
          configurations: s.configurations.filter((c) => c.id !== id),
        })),

      linkProduct: (serviceId, productId) =>
        set((s) => ({
          services: s.services.map((svc) =>
            svc.id === serviceId
              ? { ...svc, productIds: [...(svc.productIds ?? []).filter((id) => id !== productId), productId] }
              : svc
          ),
        })),

      unlinkProduct: (serviceId, productId) =>
        set((s) => ({
          services: s.services.map((svc) =>
            svc.id === serviceId
              ? { ...svc, productIds: (svc.productIds ?? []).filter((id) => id !== productId) }
              : svc
          ),
        })),

      addProduct: (product) =>
        set((s) => ({ products: [...s.products, product] })),

      updateProduct: (id, updates) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      setProductAssignments: (serviceId, products) =>
        set((s) => ({
          productAssignments: [
            ...s.productAssignments.filter((p) => p.serviceId !== serviceId),
            ...products,
          ],
        })),

      deleteProductAssignmentsForService: (serviceId) =>
        set((s) => ({
          productAssignments: s.productAssignments.filter((p) => p.serviceId !== serviceId),
        })),

      setStages: (serviceId, stages) =>
        set((s) => ({
          stages: [
            ...s.stages.filter((st) => st.serviceId !== serviceId),
            ...stages,
          ],
        })),

      deleteStagesForService: (serviceId) =>
        set((s) => ({
          stages: s.stages.filter((st) => st.serviceId !== serviceId),
        })),

      addCategory: (cat) =>
        set((s) => ({ categories: [...s.categories, cat] })),

      updateCategory: (id, updates) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      deleteCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      setSpecDefs: (serviceId, defs) =>
        set((s) => ({ serviceSpecDefs: { ...s.serviceSpecDefs, [serviceId]: defs } })),

      addSpecDef: (serviceId, def) =>
        set((s) => ({
          serviceSpecDefs: {
            ...s.serviceSpecDefs,
            [serviceId]: [...(s.serviceSpecDefs[serviceId] ?? []), def],
          },
        })),

      updateSpecDef: (serviceId, key, def) =>
        set((s) => ({
          serviceSpecDefs: {
            ...s.serviceSpecDefs,
            [serviceId]: (s.serviceSpecDefs[serviceId] ?? []).map((d) =>
              d.key === key ? def : d
            ),
          },
        })),

      deleteSpecDef: (serviceId, key) =>
        set((s) => ({
          serviceSpecDefs: {
            ...s.serviceSpecDefs,
            [serviceId]: (s.serviceSpecDefs[serviceId] ?? []).filter((d) => d.key !== key),
          },
        })),
    }),
    { name: "riprint-services-store" }
  )
);
