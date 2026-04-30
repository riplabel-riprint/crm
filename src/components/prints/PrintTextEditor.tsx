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
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Edycja tekstu</h3>
          {oob && (
            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">
              ⚠ poza obszarem
            </span>
          )}
        </div>
        <button onClick={() => select(null)} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Treść</CardTitle>
        </CardHeader>
        <CardBody>
          <textarea
            value={textElement.content}
            onChange={(e) =>
              updateTextElement(textElement.id, { content: e.target.value })
            }
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            rows={3}
            placeholder="Wprowadź tekst..."
          />
        </CardBody>
      </Card>

      {/* Formatting */}
      <Card>
        <CardHeader>
          <CardTitle>Formatowanie</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Czcionka
            </label>
            <select
              value={textElement.fontFamily}
              onChange={(e) =>
                updateTextElement(textElement.id, { fontFamily: e.target.value })
              }
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Courier New">Courier New</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rozmiar: {textElement.fontSize}pt
            </label>
            <input
              type="range"
              min="8"
              max="120"
              value={textElement.fontSize}
              onChange={(e) =>
                updateTextElement(textElement.id, {
                  fontSize: parseInt(e.target.value),
                })
              }
              className="w-full"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kolor
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={textElement.color}
                onChange={(e) =>
                  updateTextElement(textElement.id, { color: e.target.value })
                }
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={textElement.color}
                onChange={(e) =>
                  updateTextElement(textElement.id, { color: e.target.value })
                }
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
                placeholder="#000000"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Position & Transform */}
      <Card>
        <CardHeader>
          <CardTitle>Pozycja i transformacja</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* X Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pozycja X: {textElement.x.toFixed(1)}mm
            </label>
            <input
              type="range"
              min="0"
              max="210"
              step="0.5"
              value={textElement.x}
              onChange={(e) => moveX(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Y Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pozycja Y: {textElement.y.toFixed(1)}mm
            </label>
            <input
              type="range"
              min="0"
              max="297"
              step="0.5"
              value={textElement.y}
              onChange={(e) => moveY(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Rotation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Obrót: {textElement.rotation}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={textElement.rotation}
              onChange={(e) =>
                updateTextElement(textElement.id, {
                  rotation: parseInt(e.target.value),
                })
              }
              className="w-full"
            />
          </div>

          {/* Scale X */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skalowanie poziome: {textElement.scaleX.toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={textElement.scaleX}
              onChange={(e) =>
                updateTextElement(textElement.id, {
                  scaleX: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
          </div>

          {/* Scale Y */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skalowanie pionowe: {textElement.scaleY.toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={textElement.scaleY}
              onChange={(e) =>
                updateTextElement(textElement.id, {
                  scaleY: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
        </CardBody>
      </Card>

      {/* Delete Button */}
      <button
        onClick={() => {
          deleteTextElement(textElement.id);
          select(null);
        }}
        className="w-full rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
      >
        🗑 Usuń tekst
      </button>
    </div>
  );
}
