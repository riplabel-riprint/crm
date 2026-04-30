"use client";

import { usePrintCreator } from "@/store/printCreator";
import { PrintOptionsPanel } from "./PrintOptionsPanel";
import { PrintPreview } from "./PrintPreview";
import { PrintPropertiesPanel } from "./PrintPropertiesPanel";

export function PrintCreatorWizard() {
  const config = usePrintCreator((state) => state.config);

  return (
    <div className="flex h-screen gap-6 p-6 bg-gray-50">
      {/* Left Panel - Options */}
      <div className="w-80 shrink-0 overflow-y-auto">
        <PrintOptionsPanel />
      </div>

      {/* Center Panel - Preview */}
      <div className="flex-1 flex flex-col">
        <PrintPreview config={config} />
      </div>

      {/* Right Panel - Properties */}
      <div className="w-96 shrink-0 overflow-y-auto">
        <PrintPropertiesPanel config={config} />
      </div>
    </div>
  );
}
