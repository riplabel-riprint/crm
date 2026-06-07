"use client";

import { TextElement, usePrintCreator } from "@/store/printCreator";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { PAPER_DIMS, getPrintAreaRect, clampPosition, isTextOutOfBounds } from "@/lib/printAreaUtils";

interface PrintTextEditorProps {
  textElement: TextElement;
}

export function PrintTextEditor({ textElement }: PrintTextEditorProps) {
  const updateTextElement = usePrintCreator((state) => state.updateTextElement);
  const deleteTextElement = usePrintCreator((state) => state.deleteTextElement);
  const select    = usePrintCreator((state) => state.select);
  const printArea = usePrintCreator((s) => s.config.printArea);
  const format    = usePrintCreator((s) => s.config.format);

  const paperDims = PAPER_DIMS[format];
  const areaRect  = getPrintAreaRect(printArea, paperDims.w, paperDims.h);
  const oob       = printArea.enabled && printArea.mode === "warn" && isTextOutOfBounds(textElement, areaRect);

  function moveX(raw: number) {
    const x = printArea.enabled && printArea.mode === "lock"
      ? clampPosition(raw, textElement.y, areaRect).x
      : raw;
    updateTextElement(textElement.id, { x });
  }
  function moveY(raw: number) {
    const y = printArea.enabled && printArea.mode === "lock"
      ? clampPosition(textElement.x, raw, areaRect).y
      : raw;
    updateTextElement(textElement.id, { y });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">Edycja tekstu</h3>
          {oob && (
            <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400">
              ⚠ poza obszarem
            </span>
          )}
        </div>
        <button onClick={() => select(null)} className="text-white/40 hover:text-white transition-colors">✕</button>
      </div>

      <Card>
        <CardHeader><CardTitle>Treść</CardTitle></CardHeader>
        <CardBody>
          <textarea
            value={textElement.content}
            onChange={(e) => updateTextElement(textElement.id, { content: e.target.value })}
            className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#fe4e00]/60 focus:ring-1 focus:ring-[#fe4e00]/40 placeholder:text-white/20"
            rows={3}
            placeholder="Wprowadź tekst..."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Formatowanie</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Czcionka</label>
            <select
              value={textElement.fontFamily}
              onChange={(e) => updateTextElement(textElement.id, { fontFamily: e.target.value })}
              className="w-full rounded-lg border border-white/[0.1] bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#fe4e00]/60"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Courier New">Courier New</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Rozmiar: {textElement.fontSize}pt
            </label>
            <input
              type="range" min="8" max="120"
              value={textElement.fontSize}
              onChange={(e) => updateTextElement(textElement.id, { fontSize: parseInt(e.target.value) })}
              className="w-full accent-[#fe4e00]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Kolor</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={textElement.color}
                onChange={(e) => updateTextElement(textElement.id, { color: e.target.value })}
                className="w-12 h-10 rounded-lg border border-white/[0.1] cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={textElement.color}
                onChange={(e) => updateTextElement(textElement.id, { color: e.target.value })}
                className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#fe4e00]/60"
                placeholder="#000000"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pozycja i transformacja</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          {[
            { label: `Pozycja X: ${textElement.x.toFixed(1)}mm`, min: 0, max: 210, step: 0.5, value: textElement.x, onChange: (v: number) => moveX(v) },
            { label: `Pozycja Y: ${textElement.y.toFixed(1)}mm`, min: 0, max: 297, step: 0.5, value: textElement.y, onChange: (v: number) => moveY(v) },
            { label: `Obrót: ${textElement.rotation}°`, min: 0, max: 360, step: 1, value: textElement.rotation, onChange: (v: number) => updateTextElement(textElement.id, { rotation: v }) },
            { label: `Skalowanie poziome: ${textElement.scaleX.toFixed(2)}x`, min: 0.5, max: 2, step: 0.1, value: textElement.scaleX, onChange: (v: number) => updateTextElement(textElement.id, { scaleX: v }) },
            { label: `Skalowanie pionowe: ${textElement.scaleY.toFixed(2)}x`, min: 0.5, max: 2, step: 0.1, value: textElement.scaleY, onChange: (v: number) => updateTextElement(textElement.id, { scaleY: v }) },
          ].map(({ label, min, max, step, value, onChange }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-white/70 mb-1">{label}</label>
              <input
                type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full accent-[#fe4e00]"
              />
            </div>
          ))}
        </CardBody>
      </Card>

      <button
        onClick={() => { deleteTextElement(textElement.id); select(null); }}
        className="w-full rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
      >
        🗑 Usuń tekst
      </button>
    </div>
  );
}
