"use client";

import { Maximize2, Printer, Layers, Package, Tag, Scissors, type LucideIcon } from "lucide-react";
import { usePrintCreator, PrintFormat, PrintCategory, PaperType } from "@/store/printCreator";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { PrintAreaPanel } from "./PrintAreaPanel";
import { ClientSelector } from "@/components/shared/ClientSelector";

// ─── Print category definitions ───────────────────────────────────────────────

type CategoryDef = {
  id: PrintCategory;
  label: string;
  desc: string;
  Icon: LucideIcon;
};

const PRINT_CATEGORIES: CategoryDef[] = [
  { id: "large_format", label: "Wielkoformatowy", desc: "Banery, roll-upy",   Icon: Maximize2 },
  { id: "digital",      label: "Druk cyfrowy",    desc: "Ulotki, plakaty",    Icon: Printer   },
  { id: "offset",       label: "Offsetowy",        desc: "Duże nakłady",       Icon: Layers    },
  { id: "gadgets",      label: "Gadżety",           desc: "Kubki, koszulki",   Icon: Package   },
  { id: "labels",       label: "Etykiety",          desc: "Naklejki, termiczne", Icon: Tag     },
  { id: "finishing",    label: "Wykończenie",       desc: "Laminat, oczka",    Icon: Scissors  },
];

// ─── Format / paper options ───────────────────────────────────────────────────

const formatOptions: { value: PrintFormat; label: string; dimensions: string }[] = [
  { value: "a4",     label: "A4",           dimensions: "210×297 mm" },
  { value: "a3",     label: "A3",           dimensions: "297×420 mm" },
  { value: "a2",     label: "A2",           dimensions: "420×594 mm" },
  { value: "custom", label: "Własny rozmiar", dimensions: "Definiuj" },
];

const paperTypeOptions: { value: PaperType; label: string }[] = [
  { value: "standard", label: "Standardowy"         },
  { value: "glossy",   label: "Błyszczący (Glossy)" },
  { value: "matte",    label: "Matowy (Matte)"      },
  { value: "coated",   label: "Powlekany"           },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function PrintOptionsPanel() {
  const config = usePrintCreator((state) => state.config);
  const updateConfig = usePrintCreator((state) => state.updateConfig);

  return (
    <div className="space-y-2">

      {/* ── Rodzaj wydruku ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Rodzaj wydruku</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-1.5">
            {PRINT_CATEGORIES.map((cat) => {
              const active = config.printCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    updateConfig({ printCategory: active ? "" : cat.id })
                  }
                  className="flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-all hover:border-white/[0.12] hover:bg-white/[0.02]"
                  style={{
                    borderColor: active
                      ? "rgba(254,78,0,0.5)"
                      : "rgba(255,255,255,0.06)",
                    background: active ? "rgba(254,78,0,0.09)" : "transparent",
                  }}
                >
                  {/* Icon */}
                  <div
                    className="rounded-lg p-1.5 transition-all"
                    style={{
                      background: active
                        ? "rgba(254,78,0,0.18)"
                        : "rgba(255,255,255,0.05)",
                    }}
                  >
                    <cat.Icon
                      size={14}
                      style={{ color: active ? "#fe4e00" : "#666" }}
                    />
                  </div>

                  {/* Label + desc */}
                  <div>
                    <p
                      className="text-[11px] font-semibold leading-tight"
                      style={{ color: active ? "#fe4e00" : "#c0c0c0" }}
                    >
                      {cat.label}
                    </p>
                    <p
                      className="mt-0.5 text-[9px] leading-tight"
                      style={{
                        color: active ? "rgba(254,78,0,0.55)" : "#505050",
                      }}
                    >
                      {cat.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* ── Klient ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Klient</CardTitle>
        </CardHeader>
        <CardBody>
          <ClientSelector storeKey="print-creator-client" />
        </CardBody>
      </Card>

      {/* ── Format papieru ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Format papieru</CardTitle>
        </CardHeader>
        <CardBody className="space-y-0">
          {formatOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/[0.04] -mx-4 px-4 py-1 rounded-lg"
            >
              <input
                type="radio"
                name="format"
                value={option.value}
                checked={config.format === option.value}
                onChange={(e) =>
                  updateConfig({ format: e.target.value as PrintFormat })
                }
                className="accent-[#fe4e00] shrink-0"
              />
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-xs text-white">
                  {option.label}
                </span>
                <span className="text-xs text-white/40">{option.dimensions}</span>
              </div>
            </label>
          ))}
        </CardBody>
      </Card>

      {/* ── Ilość egzemplarzy ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Ilość egzemplarzy</CardTitle>
        </CardHeader>
        <CardBody className="space-y-1">
          <input
            type="number"
            min="1"
            max="100000"
            value={config.quantity}
            onChange={(e) =>
              updateConfig({ quantity: parseInt(e.target.value) || 1 })
            }
            className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 py-1 text-xs text-white focus:outline-none focus:border-[#fe4e00]/60 focus:ring-1 focus:ring-[#fe4e00]/40"
          />
          <p className="text-xs text-white/40">
            {config.quantity.toLocaleString("pl-PL")} egzemplarzy
          </p>
        </CardBody>
      </Card>

      {/* ── Rodzaj papieru ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Rodzaj papieru</CardTitle>
        </CardHeader>
        <CardBody className="space-y-0">
          {paperTypeOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/[0.04] -mx-4 px-4 py-1 rounded-lg"
            >
              <input
                type="radio"
                name="paperType"
                value={option.value}
                checked={config.paperType === option.value}
                onChange={(e) =>
                  updateConfig({ paperType: e.target.value as PaperType })
                }
                className="accent-[#fe4e00]"
              />
              <span className="text-xs text-white">{option.label}</span>
            </label>
          ))}
        </CardBody>
      </Card>

      {/* ── Obróbka końcowa ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Obróbka końcowa</CardTitle>
        </CardHeader>
        <CardBody className="space-y-0">
          {[
            { key: "lamination", label: "Laminowanie", icon: "✦" },
            { key: "cutting",    label: "Cięcie",      icon: "✂" },
            { key: "folding",    label: "Składanie",   icon: "📑" },
            { key: "numbering",  label: "Numeracja",   icon: "🔢" },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/[0.04] -mx-4 px-4 py-1 rounded-lg"
            >
              <input
                type="checkbox"
                checked={
                  config.finishings[item.key as keyof typeof config.finishings]
                }
                onChange={(e) =>
                  updateConfig({
                    finishings: {
                      ...config.finishings,
                      [item.key]: e.target.checked,
                    },
                  })
                }
                className="accent-[#fe4e00]"
              />
              <span className="text-xs text-white">{item.label}</span>
            </label>
          ))}
        </CardBody>
      </Card>

      <PrintAreaPanel />
    </div>
  );
}
