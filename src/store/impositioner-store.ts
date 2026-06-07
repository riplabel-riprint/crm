"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SheetConfig = {
  szerokość: number;
  wysokość: number;
  rozstawa: number;
  cena: number;
};

type ImpositionerConfigState = {
  sheetConfig: SheetConfig;
  setSheetConfig: (config: Partial<SheetConfig>) => void;
};

export const useImpositionerConfig = create<ImpositionerConfigState>()(
  persist(
    (set) => ({
      sheetConfig: { szerokość: 320, wysokość: 450, rozstawa: 3, cena: 25 },
      setSheetConfig: (config) =>
        set((s) => ({ sheetConfig: { ...s.sheetConfig, ...config } })),
    }),
    { name: "riprint-impositioner-config" }
  )
);
