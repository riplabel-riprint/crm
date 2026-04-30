"use client";

import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { PrintConfiguration, usePrintCreator } from "@/store/printCreator";
import {
  PAPER_DIMS,
  getPrintAreaRect,
  isTextOutOfBounds,
  isImageOutOfBounds,
} from "@/lib/printAreaUtils";

interface PrintPreviewProps {
  config: PrintConfiguration;
}

const formatDimensions: Record<string, { mm: [number, number]; ratio: number }> = {
  a4:     { mm: [210, 297], ratio: 210 / 297 },
  a3:     { mm: [297, 420], ratio: 297 / 420 },
  a2:     { mm: [420, 594], ratio: 420 / 594 },
  custom: { mm: [100, 100], ratio: 1 },
};

const paperBg: Record<string, string> = {
  standard: "bg-white border-gray-300",
  glossy:   "bg-gray-50 border-gray-400",
  matte:    "bg-gray-100 border-gray-400",
  coated:   "bg-gray-50 border-gray-300",
};

const printTypeColor: Record<string, string> = {
  color: "text-blue-600",
  bw:    "text-gray-700",
  cmyk:  "text-purple-600",
};

export function PrintPreview({ config }: PrintPreviewProps) {
  const selected = usePrintCreator((s) => s.selected);
  const select   = usePrintCreator((s) => s.select);

  const dims        = formatDimensions[config.format];
  const previewWidth  = 300;
  const previewHeight = previewWidth / dims.ratio;
  const scale         = previewWidth / dims.mm[0]; // px per mm

  const isEmpty =
    config.textElements.length === 0 && config.imageElements.length === 0;

  // Print area overlay geometry (px)
  const { printArea } = config;
  const paperDims  = PAPER_DIMS[config.format];
  const areaRect   = getPrintAreaRect(printArea, paperDims.w, paperDims.h);
  const areaStyle  = printArea.enabled
    ? {
        left:   areaRect.x * scale,
        top:    areaRect.y * scale,
        width:  areaRect.w * scale,
        height: areaRect.h * scale,
      }
    : null;

  // Compute out-of-bounds per element (only when warn mode — lock prevents it)
  function textOob(t: typeof config.textElements[0]) {
    return printArea.enabled && printArea.mode === "warn" && isTextOutOfBounds(t, areaRect);
  }
  function imgOob(i: typeof config.imageElements[0]) {
    return printArea.enabled && printArea.mode === "warn" && isImageOutOfBounds(i, areaRect);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-100 to-gray-50">
          <div
            className={`border-8 ${paperBg[config.paperType]} shadow-lg rounded-sm relative overflow-hidden`}
            style={{ width: previewWidth, height: previewHeight }}
          >
            {/* ── Print area overlay ── */}
            {areaStyle && (
              <div
                className="absolute pointer-events-none z-10"
                style={{
                  ...areaStyle,
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.06)",
                  border: "1.5px dashed #3b82f6",
                }}
              />
            )}

            {/* ── Bleed zone label ── */}
            {areaStyle && (
              <div
                className="absolute top-0.5 left-0.5 text-[8px] font-medium text-blue-400 pointer-events-none z-20 select-none"
              >
                spady ({printArea.marginLeft}/{printArea.marginTop} mm)
              </div>
            )}

            {/* ── Placeholder ── */}
            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center text-center px-6 pointer-events-none z-0">
                <div>
                  <div className={`text-4xl font-bold mb-4 ${printTypeColor[config.printType]}`}>
                    {config.format.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>{dims.mm[0]}×{dims.mm[1]} mm</div>
                    <div className="text-xs text-gray-500">
                      {config.printType === "color" && "RGB"}
                      {config.printType === "bw"    && "Czarno-białe"}
                      {config.printType === "cmyk"  && "CMYK"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Image elements ── */}
            {config.imageElements.map((img) => {
              const isSelected = selected?.kind === "image" && selected.id === img.id;
              const oob        = imgOob(img);
              return (
                <button
                  key={img.id}
                  onClick={() => select({ kind: "image", id: img.id })}
                  title={oob ? "Element poza obszarem bezpiecznym!" : undefined}
                  className={`absolute p-0 border-2 transition-colors ${
                    oob
                      ? "border-orange-400"
                      : isSelected
                        ? "border-violet-500"
                        : "border-transparent hover:border-gray-400"
                  }`}
                  style={{
                    left:            img.x * scale,
                    top:             img.y * scale,
                    width:           img.width  * scale,
                    height:          img.height * scale,
                    transform:       `rotate(${img.rotation}deg)`,
                    transformOrigin: "left top",
                    opacity:         img.opacity,
                    zIndex:          5,
                  }}
                >
                  <Image
                    src={img.src}
                    alt={img.name}
                    fill
                    className="object-contain pointer-events-none"
                    unoptimized
                  />
                  {oob && (
                    <span className="absolute -top-3 -right-1 text-[10px] bg-orange-400 text-white rounded px-1 leading-4 pointer-events-none">
                      ⚠
                    </span>
                  )}
                </button>
              );
            })}

            {/* ── Text elements ── */}
            {config.textElements.map((text) => {
              const isSelected = selected?.kind === "text" && selected.id === text.id;
              const oob        = textOob(text);
              return (
                <button
                  key={text.id}
                  onClick={() => select({ kind: "text", id: text.id })}
                  title={oob ? "Element poza obszarem bezpiecznym!" : undefined}
                  className={`absolute transition-colors ${
                    oob
                      ? "ring-2 ring-orange-400"
                      : isSelected
                        ? "ring-2 ring-blue-500"
                        : "hover:ring-2 hover:ring-gray-400"
                  }`}
                  style={{
                    left:            text.x * scale,
                    top:             text.y * scale,
                    transform:       `rotate(${text.rotation}deg) scaleX(${text.scaleX}) scaleY(${text.scaleY})`,
                    transformOrigin: "left top",
                    padding:         "2px",
                    zIndex:          5,
                  }}
                >
                  <span
                    style={{
                      fontSize:       Math.max(8, text.fontSize * scale * 0.15),
                      color:          text.color,
                      fontFamily:     text.fontFamily,
                      whiteSpace:     "nowrap",
                      pointerEvents:  "none",
                    }}
                  >
                    {text.content}
                  </span>
                  {oob && (
                    <span className="absolute -top-3 -right-1 text-[10px] bg-orange-400 text-white rounded px-1 leading-4 pointer-events-none">
                      ⚠
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ── OOB global warning bar ── */}
      {(() => {
        const oobTexts  = config.textElements.filter(textOob);
        const oobImages = config.imageElements.filter(imgOob);
        const total     = oobTexts.length + oobImages.length;
        if (total === 0) return null;
        return (
          <div className="flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
            <span className="mt-0.5 shrink-0">⚠</span>
            <span>
              {total} element{total > 1 ? "y" : ""} poza obszarem bezpiecznym.
              Mogą zostać obcięte podczas druku.
            </span>
          </div>
        );
      })()}

      {/* ── Summary strip ── */}
      <Card>
        <div className="px-5 py-4 space-y-3">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ilość egzemplarzy</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {config.quantity.toLocaleString("pl-PL")}
            </div>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Konfiguracja</div>
            <div className="text-sm text-gray-700 space-y-1">
              <div><span className="text-gray-600">Format:</span> <span className="font-medium">{config.format.toUpperCase()}</span></div>
              <div>
                <span className="text-gray-600">Papier:</span>{" "}
                <span className="font-medium">
                  {config.paperType === "standard" && "Standardowy"}
                  {config.paperType === "glossy"   && "Glossy"}
                  {config.paperType === "matte"    && "Matte"}
                  {config.paperType === "coated"   && "Powlekany"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Druk:</span>{" "}
                <span className="font-medium">
                  {config.printType === "color" && "Kolorowy"}
                  {config.printType === "bw"    && "Czarno-białe"}
                  {config.printType === "cmyk"  && "CMYK"}
                </span>
              </div>
              {config.bindingType && config.bindingType !== "none" && (
                <div>
                  <span className="text-gray-600">Oprawa:</span>{" "}
                  <span className="font-medium">
                    {config.bindingType === "saddle" && "Zszywka"}
                    {config.bindingType === "perfect" && "Klejona"}
                    {config.bindingType === "comb"   && "Spirala"}
                  </span>
                </div>
              )}
            </div>
          </div>
          {Object.values(config.finishings).some(Boolean) && (
            <div className="border-t border-gray-200 pt-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Obróbka końcowa</div>
              <div className="flex flex-wrap gap-2">
                {config.finishings.lamination && <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">✦ Laminowanie</span>}
                {config.finishings.cutting    && <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">✂ Cięcie</span>}
                {config.finishings.folding    && <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">📑 Składanie</span>}
                {config.finishings.numbering  && <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">🔢 Numeracja</span>}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
