"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { useOrdersStore } from "@/store/orders-store";
import type { OrderJobSpec } from "@/types";

type Props = {
  orderId: string;
  spec?: OrderJobSpec;
};

const formatLabels: Record<OrderJobSpec["format"], string> = {
  A3: "A3 (297 × 420 mm)",
  A4: "A4 (210 × 297 mm)",
  A5: "A5 (148 × 210 mm)",
  B1: "B1 (707 × 1000 mm)",
  B2: "B2 (500 × 707 mm)",
  roll_up: "Roll-up",
  custom: "Niestandardowy",
};

const printTypeLabels: Record<OrderJobSpec["printType"], string> = {
  digital: "Druk cyfrowy",
  offset: "Offset",
  large_format: "Wielki format",
  screen: "Sitodruk",
  other: "Inny",
};

const deliveryLabels: Record<OrderJobSpec["deliveryMethod"], string> = {
  pickup: "Odbiór osobisty",
  courier: "Kurier",
  own_transport: "Transport własny",
};

const emptySpec: OrderJobSpec = {
  format: "A4",
  quantity: 1,
  unit: "szt.",
  material: "",
  printType: "digital",
  finishing: [],
  deliveryMethod: "pickup",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <span className="w-36 shrink-0 text-xs text-gray-400 pt-px">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

export function OrderJobSpecCard({ orderId, spec }: Props) {
  const [editMode, setEditMode] = useState(!spec);
  const updateJobSpec = useOrdersStore((s) => s.updateJobSpec);

  function handleSave(values: OrderJobSpec) {
    updateJobSpec(orderId, values);
    setEditMode(false);
  }

  const formatValue =
    spec?.format === "custom" && spec.customFormatWidth && spec.customFormatHeight
      ? `${formatLabels.custom} — ${spec.customFormatWidth} × ${spec.customFormatHeight} mm`
      : spec
      ? formatLabels[spec.format]
      : "";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Specyfikacja zlecenia</CardTitle>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            Edytuj
          </button>
        )}
      </CardHeader>

      {editMode ? (
        <EditForm
          spec={spec ?? emptySpec}
          onSave={handleSave}
          onClose={spec ? () => setEditMode(false) : undefined}
        />
      ) : spec ? (
        <CardBody className="py-1 px-5">
          <Row label="Format" value={formatValue} />
          <Row label="Nakład" value={`${spec.quantity} ${spec.unit}`} />
          <Row label="Materiał / papier" value={spec.material || <span className="text-gray-400">—</span>} />
          <Row label="Rodzaj druku" value={printTypeLabels[spec.printType]} />
          <Row
            label="Wykończenie"
            value={
              spec.finishing.length > 0 ? (
                <ul className="space-y-0.5">
                  {spec.finishing.map((f) => (
                    <li key={f} className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-gray-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-400">Brak</span>
              )
            }
          />
          <Row
            label="Dostawa / odbiór"
            value={
              <span>
                {deliveryLabels[spec.deliveryMethod]}
                {spec.deliveryAddress && (
                  <span className="block text-xs text-gray-400 mt-0.5">{spec.deliveryAddress}</span>
                )}
                {spec.deliveryNote && (
                  <span className="block text-xs text-gray-400 mt-0.5">{spec.deliveryNote}</span>
                )}
              </span>
            }
          />
          {spec.customNotes && (
            <Row
              label="Własne ustalenia"
              value={<span className="whitespace-pre-line text-gray-700">{spec.customNotes}</span>}
            />
          )}
        </CardBody>
      ) : null}
    </Card>
  );
}

function EditForm({
  spec,
  onSave,
  onClose,
}: {
  spec: OrderJobSpec;
  onSave: (values: OrderJobSpec) => void;
  onClose?: () => void;
}) {
  const [values, setValues] = useState<OrderJobSpec>({ ...spec });

  function set<K extends keyof OrderJobSpec>(key: K, value: OrderJobSpec[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleFinishingChange(index: number, value: string) {
    const next = [...values.finishing];
    next[index] = value;
    set("finishing", next);
  }

  function addFinishing() {
    set("finishing", [...values.finishing, ""]);
  }

  function removeFinishing(index: number) {
    set("finishing", values.finishing.filter((_, i) => i !== index));
  }

  const inputCls =
    "w-full rounded border border-gray-200 px-2.5 py-1.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200";
  const labelCls = "block text-xs text-gray-400 mb-1";

  return (
    <CardBody className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Format</label>
          <select
            className={inputCls}
            value={values.format}
            onChange={(e) => set("format", e.target.value as OrderJobSpec["format"])}
          >
            {(Object.keys(formatLabels) as OrderJobSpec["format"][]).map((f) => (
              <option key={f} value={f}>
                {formatLabels[f]}
              </option>
            ))}
          </select>
        </div>
        {values.format === "custom" && (
          <>
            <div>
              <label className={labelCls}>Szerokość (mm)</label>
              <input
                type="number"
                className={inputCls}
                value={values.customFormatWidth ?? ""}
                onChange={(e) => set("customFormatWidth", Number(e.target.value))}
              />
            </div>
            <div>
              <label className={labelCls}>Wysokość (mm)</label>
              <input
                type="number"
                className={inputCls}
                value={values.customFormatHeight ?? ""}
                onChange={(e) => set("customFormatHeight", Number(e.target.value))}
              />
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nakład</label>
          <input
            type="number"
            className={inputCls}
            value={values.quantity}
            onChange={(e) => set("quantity", Number(e.target.value))}
          />
        </div>
        <div>
          <label className={labelCls}>Jednostka</label>
          <input
            type="text"
            className={inputCls}
            value={values.unit}
            onChange={(e) => set("unit", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Materiał / papier</label>
        <input
          type="text"
          className={inputCls}
          value={values.material}
          onChange={(e) => set("material", e.target.value)}
        />
      </div>

      <div>
        <label className={labelCls}>Rodzaj druku</label>
        <select
          className={inputCls}
          value={values.printType}
          onChange={(e) => set("printType", e.target.value as OrderJobSpec["printType"])}
        >
          {(Object.keys(printTypeLabels) as OrderJobSpec["printType"][]).map((t) => (
            <option key={t} value={t}>
              {printTypeLabels[t]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>Wykończenie</label>
        <div className="space-y-1.5">
          {values.finishing.map((f, i) => (
            <div key={i} className="flex gap-1.5">
              <input
                type="text"
                className={inputCls}
                value={f}
                onChange={(e) => handleFinishingChange(i, e.target.value)}
              />
              <button
                onClick={() => removeFinishing(i)}
                className="shrink-0 text-gray-400 hover:text-red-500 px-1 text-lg leading-none"
                aria-label="Usuń"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={addFinishing}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            + Dodaj wykończenie
          </button>
        </div>
      </div>

      <div>
        <label className={labelCls}>Dostawa / odbiór</label>
        <select
          className={inputCls}
          value={values.deliveryMethod}
          onChange={(e) =>
            set("deliveryMethod", e.target.value as OrderJobSpec["deliveryMethod"])
          }
        >
          {(Object.keys(deliveryLabels) as OrderJobSpec["deliveryMethod"][]).map((d) => (
            <option key={d} value={d}>
              {deliveryLabels[d]}
            </option>
          ))}
        </select>
      </div>

      {values.deliveryMethod === "courier" && (
        <div>
          <label className={labelCls}>Adres dostawy</label>
          <input
            type="text"
            className={inputCls}
            value={values.deliveryAddress ?? ""}
            onChange={(e) => set("deliveryAddress", e.target.value)}
          />
        </div>
      )}

      <div>
        <label className={labelCls}>Uwagi do dostawy</label>
        <input
          type="text"
          className={inputCls}
          value={values.deliveryNote ?? ""}
          onChange={(e) => set("deliveryNote", e.target.value)}
        />
      </div>

      <div>
        <label className={labelCls}>Własne ustalenia</label>
        <textarea
          rows={3}
          className={inputCls}
          value={values.customNotes ?? ""}
          onChange={(e) => set("customNotes", e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {onClose && (
          <button
            onClick={onClose}
            className="rounded px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 transition-colors"
          >
            Anuluj
          </button>
        )}
        <button
          onClick={() => onSave(values)}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Zapisz
        </button>
      </div>
    </CardBody>
  );
}
