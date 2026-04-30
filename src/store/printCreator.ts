import { create } from "zustand";

export type PrintFormat = "a4" | "a3" | "a2" | "custom";
export type PrintType = "color" | "bw" | "cmyk";
export type PaperType = "standard" | "glossy" | "matte" | "coated";

export interface TextElement {
  id: string;
  content: string;
  x: number; // mm
  y: number; // mm
  fontSize: number; // pt
  color: string; // hex
  rotation: number; // degrees
  scaleX: number; // 0.5 - 2
  scaleY: number; // 0.5 - 2
  fontFamily: string;
}

export interface PrintArea {
  enabled: boolean;
  mode: "warn" | "lock";        // lock = clamp on move, warn = orange highlight
  marginTop: number;            // mm
  marginRight: number;          // mm
  marginBottom: number;         // mm
  marginLeft: number;           // mm
}

export interface ImageElement {
  id: string;
  src: string;   // data URL (base64)
  name: string;
  x: number;    // mm
  y: number;    // mm
  width: number;  // mm
  height: number; // mm
  rotation: number; // degrees
  opacity: number;  // 0–1
}

export interface PrintConfiguration {
  format: PrintFormat;
  width?: number;
  height?: number;
  quantity: number;
  printType: PrintType;
  paperType: PaperType;
  bindingType?: "none" | "saddle" | "perfect" | "comb";
  finishings: {
    lamination: boolean;
    cutting: boolean;
    folding: boolean;
    numbering: boolean;
  };
  textElements: TextElement[];
  imageElements: ImageElement[];
  printArea: PrintArea;
}

export type SelectedElement =
  | { kind: "text"; id: string }
  | { kind: "image"; id: string }
  | null;

interface PrintCreatorStore {
  config: PrintConfiguration;
  selected: SelectedElement;
  updateConfig: (partial: Partial<PrintConfiguration>) => void;
  // text
  addTextElement: (content?: string) => void;
  updateTextElement: (id: string, updates: Partial<TextElement>) => void;
  deleteTextElement: (id: string) => void;
  // image
  addImageElement: (src: string, name: string, w: number, h: number) => void;
  updateImageElement: (id: string, updates: Partial<ImageElement>) => void;
  deleteImageElement: (id: string) => void;
  // print area
  updatePrintArea: (partial: Partial<PrintArea>) => void;
  // selection
  select: (el: SelectedElement) => void;
  reset: () => void;
}

const defaultConfig: PrintConfiguration = {
  format: "a4",
  quantity: 100,
  printType: "color",
  paperType: "standard",
  bindingType: "none",
  finishings: {
    lamination: false,
    cutting: false,
    folding: false,
    numbering: false,
  },
  textElements: [],
  imageElements: [],
  printArea: {
    enabled: true,
    mode: "warn",
    marginTop: 10,
    marginRight: 10,
    marginBottom: 10,
    marginLeft: 10,
  },
};

export const usePrintCreator = create<PrintCreatorStore>((set) => ({
  config: defaultConfig,
  selected: null,
  updateConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),

  // text
  addTextElement: (content = "Nowy tekst") =>
    set((state) => {
      const id = `text-${Date.now()}`;
      return {
        config: {
          ...state.config,
          textElements: [
            ...state.config.textElements,
            { id, content, x: 20, y: 20, fontSize: 24, color: "#000000",
              rotation: 0, scaleX: 1, scaleY: 1, fontFamily: "Arial" },
          ],
        },
        selected: { kind: "text", id },
      };
    }),
  updateTextElement: (id, updates) =>
    set((state) => ({
      config: {
        ...state.config,
        textElements: state.config.textElements.map((el) =>
          el.id === id ? { ...el, ...updates } : el
        ),
      },
    })),
  deleteTextElement: (id) =>
    set((state) => ({
      config: {
        ...state.config,
        textElements: state.config.textElements.filter((el) => el.id !== id),
      },
      selected:
        state.selected?.kind === "text" && state.selected.id === id
          ? null
          : state.selected,
    })),

  // image
  addImageElement: (src, name, w, h) =>
    set((state) => {
      const id = `img-${Date.now()}`;
      return {
        config: {
          ...state.config,
          imageElements: [
            ...state.config.imageElements,
            { id, src, name, x: 10, y: 10, width: w, height: h,
              rotation: 0, opacity: 1 },
          ],
        },
        selected: { kind: "image", id },
      };
    }),
  updateImageElement: (id, updates) =>
    set((state) => ({
      config: {
        ...state.config,
        imageElements: state.config.imageElements.map((el) =>
          el.id === id ? { ...el, ...updates } : el
        ),
      },
    })),
  deleteImageElement: (id) =>
    set((state) => ({
      config: {
        ...state.config,
        imageElements: state.config.imageElements.filter((el) => el.id !== id),
      },
      selected:
        state.selected?.kind === "image" && state.selected.id === id
          ? null
          : state.selected,
    })),

  updatePrintArea: (partial) =>
    set((state) => ({
      config: {
        ...state.config,
        printArea: { ...state.config.printArea, ...partial },
      },
    })),
  select: (el) => set({ selected: el }),
  reset: () => set({ config: defaultConfig, selected: null }),
}));
