"use client";

import { usePrintCreator, PrintFormat, PrintType, PaperType } from "@/store/printCreator";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { PrintAreaPanel } from "./PrintAreaPanel";
import { ClientSelector } from "@/components/shared/ClientSelector";

const formatOptions: { value: PrintFormat; label: string; dimensions: string }[] = [
  { value: "a4", label: "A4", dimensions: "210×297 mm" },
  { value: "a3", label: "A3", dimensions: "297×420 mm" },
  { value: "a2", label: "A2", dimensions: "420×594 mm" },
  { value: "custom", label: "Własny rozmiar", dimensions: "Definiuj" },
];

const printTypeOptions: { value: PrintType; label: string }[] = [
  { value: "color", label: "Kolor (RGB)" },
  { value: "bw", label: "Czarno-białe" },
  { value: "cmyk", label: "CMYK" },
];

const paperTypeOptions: { value: PaperType; label: string }[] = [
  { value: "standard", label: "Standardowy" },
  { value: "glossy", label: "Błyszczący (Glossy)" },
  { value: "matte", label: "Matowy (Matte)" },
  { value: "coated", label: "Powlekany" },
];

const bindingOptions = [
  { value: "none", label: "Bez oprawy" },
  { value: "saddle", label: "Zszywka sellotape" },
  { value: "perfect", label: "Oprawa klejona (Perfect)" },
  { value: "comb", label: "Spirala plastikowa" },
];

export function PrintOptionsPanel() {
  const config = usePrintCreator((state) => state.config);
  const updateConfig = usePrintCreator((state) => state.updateConfig);

  return (
    <div className="space-y-4">
      {/* Client */}
      <Card>
        <CardHeader>
          <CardTitle>Klient</CardTitle>
        </CardHeader>
        <CardBody>
          <ClientSelector storeKey="print-creator-client" />
        </CardBody>
      </Card>

      {/* Format */}
      <Card>
        <CardHeader>
          <CardTitle>Format papieru</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2">
          {formatOptions.map((option) => (
            <label key={option.value} className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 -mx-5 px-5 py-2">
              <input
                type="radio"
                name="format"
                value={option.value}
                checked={config.format === option.value}
                onChange={(e) => updateConfig({ format: e.target.value as PrintFormat })}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">{option.label}</div>
                <div className="text-xs text-gray-500">{option.dimensions}</div>
              </div>
            </label>
          ))}
        </CardBody>
      </Card>

      {/* Quantity */}
      <Card>
        <CardHeader>
          <CardTitle>Ilość egzemplarzy</CardTitle>
        </CardHeader>
        <CardBody>
          <input
            type="number"
            min="1"
            max="100000"
            value={config.quantity}
            onChange={(e) => updateConfig({ quantity: parseInt(e.target.value) || 1 })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-2 text-xs text-gray-500">
            {config.quantity.toLocaleString("pl-PL")} egzemplarzy
          </p>
        </CardBody>
      </Card>

      {/* Print Type */}
      <Card>
        <CardHeader>
          <CardTitle>Rodzaj druku</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2">
          {printTypeOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 -mx-5 px-5 py-2">
              <input
                type="radio"
                name="printType"
                value={option.value}
                checked={config.printType === option.value}
                onChange={(e) => updateConfig({ printType: e.target.value as PrintType })}
              />
              <span className="text-sm text-gray-900">{option.label}</span>
            </label>
          ))}
        </CardBody>
      </Card>

      {/* Paper Type */}
      <Card>
        <CardHeader>
          <CardTitle>Rodzaj papieru</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2">
          {paperTypeOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 -mx-5 px-5 py-2">
              <input
                type="radio"
                name="paperType"
                value={option.value}
                checked={config.paperType === option.value}
                onChange={(e) => updateConfig({ paperType: e.target.value as PaperType })}
              />
              <span className="text-sm text-gray-900">{option.label}</span>
            </label>
          ))}
        </CardBody>
      </Card>

      {/* Binding */}
      <Card>
        <CardHeader>
          <CardTitle>Oprawa (dla wielostronicowych)</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2">
          {bindingOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 -mx-5 px-5 py-2">
              <input
                type="radio"
                name="bindingType"
                value={option.value}
                checked={config.bindingType === option.value}
                onChange={(e) => updateConfig({ bindingType: e.target.value as "none" | "saddle" | "perfect" | "comb" })}
              />
              <span className="text-sm text-gray-900">{option.label}</span>
            </label>
          ))}
        </CardBody>
      </Card>

      {/* Finishings */}
      <Card>
        <CardHeader>
          <CardTitle>Obróbka końcowa</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {[
            { key: "lamination", label: "Laminowanie", icon: "✦" },
            { key: "cutting", label: "Cięcie", icon: "✂" },
            { key: "folding", label: "Składanie", icon: "📑" },
            { key: "numbering", label: "Numeracja", icon: "🔢" },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 -mx-5 px-5 py-2">
              <input
                type="checkbox"
                checked={config.finishings[item.key as keyof typeof config.finishings]}
                onChange={(e) =>
                  updateConfig({
                    finishings: {
                      ...config.finishings,
                      [item.key]: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm text-gray-700">{item.label}</span>
            </label>
          ))}
        </CardBody>
      </Card>

      <PrintAreaPanel />
    </div>
  );
}
