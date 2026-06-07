"use client";

import { useRef } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { PrintConfiguration } from "@/store/printCreator";
import { usePrintCreator } from "@/store/printCreator";
import { PrintTextEditor } from "./PrintTextEditor";
import { PrintImageEditor } from "./PrintImageEditor";

interface PrintPropertiesPanelProps {
  config: PrintConfiguration;
}

const mockPrices = {
  baseUnit: { a4: 0.50, a3: 1.20, a2: 3.00, custom: 2.50 },
  paperMultiplier: { standard: 1, glossy: 1.5, matte: 1.3, coated: 1.4 },
  printTypeMultiplier: { bw: 0.8, color: 1, cmyk: 1.1 },
  finishingAdd: { lamination: 0.3, cutting: 0.2, folding: 0.15, numbering: 0.25 },
};

function calculateEstimatedPrice(config: PrintConfiguration): number {
  const base = mockPrices.baseUnit[config.format as keyof typeof mockPrices.baseUnit] || 2.5;
  const paperMult = mockPrices.paperMultiplier[config.paperType as keyof typeof mockPrices.paperMultiplier];
  const printMult = mockPrices.printTypeMultiplier[config.printType as keyof typeof mockPrices.printTypeMultiplier];
  let unit = base * paperMult * printMult;
  if (config.finishings.lamination) unit += mockPrices.finishingAdd.lamination;
  if (config.finishings.cutting) unit += mockPrices.finishingAdd.cutting;
  if (config.finishings.folding) unit += mockPrices.finishingAdd.folding;
  if (config.finishings.numbering) unit += mockPrices.finishingAdd.numbering;
  return unit * config.quantity;
}

export function PrintPropertiesPanel({ config }: PrintPropertiesPanelProps) {
  const reset = usePrintCreator((s) => s.reset);
  const select = usePrintCreator((s) => s.select);
  const selected = usePrintCreator((s) => s.selected);
  const addTextElement = usePrintCreator((s) => s.addTextElement);
  const addImageElement = usePrintCreator((s) => s.addImageElement);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const estimatedPrice = calculateEstimatedPrice(config);
  const unitPrice = estimatedPrice / config.quantity;

  if (selected?.kind === "text") {
    const text = config.textElements.find((el) => el.id === selected.id);
    if (text) return <PrintTextEditor textElement={text} />;
  }
  if (selected?.kind === "image") {
    const img = config.imageElements.find((el) => el.id === selected.id);
    if (img) return <PrintImageEditor image={img} />;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const longest = Math.max(img.naturalWidth, img.naturalHeight);
        const ratio = 80 / longest;
        addImageElement(src, file.name, Math.round(img.naturalWidth * ratio), Math.round(img.naturalHeight * ratio));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader><CardTitle>Podsumowanie</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div className="space-y-1">
            <div className="text-xs text-white/40 uppercase font-medium tracking-wide">Cena jednostkowa</div>
            <div className="text-sm font-mono text-white">{unitPrice.toFixed(2)} PLN</div>
          </div>
          <div className="space-y-1 border-t border-white/[0.07] pt-4">
            <div className="text-xs text-white/40 uppercase font-medium tracking-wide">Szacunkowa cena</div>
            <div className="text-2xl font-bold text-[#fe4e00]">{estimatedPrice.toFixed(2)} PLN</div>
            <div className="text-xs text-white/30">
              ({config.quantity.toLocaleString("pl-PL")} × {unitPrice.toFixed(2)} PLN)
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader><CardTitle>Szczegóły</CardTitle></CardHeader>
        <CardBody className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-white/50">Format</span>
            <span className="font-medium text-white">{config.format.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Ilość</span>
            <span className="font-medium text-white">{config.quantity.toLocaleString("pl-PL")} szt.</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Papier</span>
            <span className="font-medium text-white">
              {config.paperType === "standard" && "Standardowy"}
              {config.paperType === "glossy" && "Glossy"}
              {config.paperType === "matte" && "Matte"}
              {config.paperType === "coated" && "Powlekany"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Druk</span>
            <span className="font-medium text-white">
              {config.printType === "color" && "Kolorowy (RGB)"}
              {config.printType === "bw" && "Czarno-białe"}
              {config.printType === "cmyk" && "CMYK"}
            </span>
          </div>
          {config.bindingType && config.bindingType !== "none" && (
            <div className="flex justify-between">
              <span className="text-white/50">Oprawa</span>
              <span className="font-medium text-white">
                {config.bindingType === "saddle" && "Zszywka"}
                {config.bindingType === "perfect" && "Klejona"}
                {config.bindingType === "comb" && "Spirala"}
              </span>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Finishings */}
      {Object.values(config.finishings).some(Boolean) && (
        <Card>
          <CardHeader><CardTitle>Obróbka końcowa</CardTitle></CardHeader>
          <CardBody>
            <ul className="space-y-2 text-sm">
              {config.finishings.lamination && <li className="flex items-center gap-2 text-white/70"><span className="text-[#fe4e00]">✦</span> Laminowanie</li>}
              {config.finishings.cutting    && <li className="flex items-center gap-2 text-white/70"><span className="text-[#fe4e00]">✂</span> Cięcie</li>}
              {config.finishings.folding    && <li className="flex items-center gap-2 text-white/70"><span className="text-[#fe4e00]">📑</span> Składanie</li>}
              {config.finishings.numbering  && <li className="flex items-center gap-2 text-white/70"><span className="text-[#fe4e00]">🔢</span> Numeracja</li>}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* Grafika */}
      <Card>
        <CardHeader><CardTitle>Grafika na nadruku</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          {config.imageElements.length === 0 ? (
            <p className="text-sm text-white/30">Brak grafik</p>
          ) : (
            <div className="space-y-2">
              {config.imageElements.map((img) => (
                <button
                  key={img.id}
                  onClick={() => select({ kind: "image", id: img.id })}
                  className="w-full text-left rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm hover:bg-white/[0.05] transition-colors"
                >
                  <div className="font-medium text-white truncate">{img.name}</div>
                  <div className="text-xs text-white/40">
                    {img.width.toFixed(0)}×{img.height.toFixed(0)} mm • {Math.round(img.opacity * 100)}% opacity
                  </div>
                </button>
              ))}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-lg bg-[#fe4e00]/10 px-4 py-2 text-sm font-medium text-[#fe4e00] hover:bg-[#fe4e00]/20 transition-colors"
          >
            + Dodaj grafikę
          </button>
        </CardBody>
      </Card>

      {/* Tekst */}
      <Card>
        <CardHeader><CardTitle>Tekst na nadruku</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          {config.textElements.length === 0 ? (
            <p className="text-sm text-white/30">Brak elementów tekstowych</p>
          ) : (
            <div className="space-y-2">
              {config.textElements.map((text) => (
                <button
                  key={text.id}
                  onClick={() => select({ kind: "text", id: text.id })}
                  className="w-full text-left rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm hover:bg-white/[0.05] transition-colors"
                >
                  <div className="font-medium text-white truncate">{text.content}</div>
                  <div className="text-xs text-white/40">{text.fontSize}pt • {text.color}</div>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => addTextElement()}
            className="w-full rounded-lg bg-[#fe4e00]/10 px-4 py-2 text-sm font-medium text-[#fe4e00] hover:bg-[#fe4e00]/20 transition-colors"
          >
            + Dodaj tekst
          </button>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="space-y-2">
        <button className="w-full rounded-lg bg-[#fe4e00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54400] transition-colors">
          Dodaj do zlecenia
        </button>
        <button className="w-full rounded-lg border border-white/[0.1] px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/[0.04] transition-colors">
          Pobierz wycenę PDF
        </button>
        <button
          onClick={() => reset()}
          className="w-full rounded-lg border border-white/[0.06] px-4 py-2 text-sm font-medium text-white/40 hover:bg-white/[0.04] hover:text-white/60 transition-colors"
        >
          Zresetuj opcje
        </button>
      </div>

      <Card className="border-[#fe4e00]/20 bg-[#fe4e00]/5">
        <CardBody className="text-xs text-white/60">
          <p className="font-medium mb-1">💡 Wskazówka</p>
          <p>Ceny są szacunkowe. Kliknij element na podglądzie, by go edytować.</p>
        </CardBody>
      </Card>
    </div>
  );
}
