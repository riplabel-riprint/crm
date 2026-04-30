"use client";

import { useState } from "react";
import { usePrintCreator } from "@/store/printCreator";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function PrintAreaPanel() {
  const area = usePrintCreator((s) => s.config.printArea);
  const update = usePrintCreator((s) => s.updatePrintArea);
  const [symmetric, setSymmetric] = useState(true);

  function setMargin(side: "marginTop" | "marginRight" | "marginBottom" | "marginLeft", val: number) {
    if (symmetric) {
      update({ marginTop: val, marginRight: val, marginBottom: val, marginLeft: val });
    } else {
      update({ [side]: val });
    }
  }

  const margins = [
    { key: "marginTop",    label: "Góra" },
    { key: "marginRight",  label: "Prawo" },
    { key: "marginBottom", label: "Dół" },
    { key: "marginLeft",   label: "Lewo" },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Obszar druku</CardTitle>
          {/* enable toggle */}
          <button
            onClick={() => update({ enabled: !area.enabled })}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
              area.enabled ? "bg-blue-600" : "bg-gray-300",
            )}
          >
            <span
              className={cn(
                "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                area.enabled ? "translate-x-4" : "translate-x-1",
              )}
            />
          </button>
        </div>
      </CardHeader>

      {area.enabled && (
        <CardBody className="space-y-5">
          {/* Warn / Lock mode */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Tryb naruszenia
            </p>
            <div className="flex gap-2">
              {(["warn", "lock"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => update({ mode })}
                  className={cn(
                    "flex-1 rounded border px-3 py-1.5 text-xs font-medium transition-colors",
                    area.mode === mode
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50",
                  )}
                >
                  {mode === "warn" ? "⚠ Ostrzeżenie" : "🔒 Blokada"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {area.mode === "warn"
                ? "Elementy poza obszarem są oznaczane ostrzeżeniem."
                : "Elementy nie mogą wychodzić poza obszar bezpieczny."}
            </p>
          </div>

          {/* Symmetric toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Jednakowe marginesy</span>
            <button
              onClick={() => setSymmetric((v) => !v)}
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                symmetric ? "bg-blue-600" : "bg-gray-300",
              )}
            >
              <span
                className={cn(
                  "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                  symmetric ? "translate-x-4" : "translate-x-1",
                )}
              />
            </button>
          </div>

          {/* Margin sliders */}
          <div className="space-y-3">
            {(symmetric ? [margins[0]] : margins).map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {symmetric ? "Margines" : label}: {area[key]} mm
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={area[key]}
                  onChange={(e) => setMargin(key, parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            ))}

            {!symmetric && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 border border-gray-200 rounded p-2">
                <span>↑ Góra: {area.marginTop} mm</span>
                <span>→ Prawo: {area.marginRight} mm</span>
                <span>↓ Dół: {area.marginBottom} mm</span>
                <span>← Lewo: {area.marginLeft} mm</span>
              </div>
            )}
          </div>
        </CardBody>
      )}
    </Card>
  );
}
