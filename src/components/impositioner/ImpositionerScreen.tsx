"use client";

import React, {
  useState,
  useReducer,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  Download,
  Upload,
  Layers,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  Image as ImageIcon,
  Package,
  Calculator,
  FileDown,
  History,
  Settings,
} from "lucide-react";
import { useImpositionerConfig } from "@/store/impositioner-store";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProjectItem {
  id: number;
  nazwa: string;
  szerokość: number;
  wysokość: number;
  ilość: number;
  x: number;
  y: number;
  obraz: string | null;
  kolor: string;
}

interface SheetConfig {
  szerokość: number;
  wysokość: number;
  rozstawa: number;
  cena: number;
}

interface ImpositionerState {
  projekty: ProjectItem[];
  arkusz: SheetConfig;
}

interface SavedProject {
  id: string;
  nazwa: string;
  data: string;
  arkusz: SheetConfig;
  projekty: ProjectItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = [
  "#fe4e00", "#3b82f6", "#22c55e", "#a855f7", "#f59e0b",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

const PRESETS = [
  { label: "A3", w: 297, h: 420 },
  { label: "A4", w: 210, h: 297 },
  { label: "DTF Roll", w: 600, h: 1000 },
];

const SHEET_MARGIN = 3;

const LS_KEY = "dtf-impositioner-v1";
const LS_HISTORY_KEY = "dtf-impositioner-history";
const LS_PRICE_KEY = "dtf-impositioner-price";
const MAX_HISTORY = 50;

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_STATE"; payload: ImpositionerState }
  | { type: "ADD_PROJEKT"; payload: ProjectItem }
  | { type: "UPDATE_PROJEKT"; payload: ProjectItem }
  | { type: "DELETE_PROJEKT"; payload: number }
  | { type: "DUPLICATE_PROJEKT"; payload: number }
  | { type: "SET_ARKUSZ"; payload: Partial<SheetConfig> }
  | { type: "SET_PROJEKTY"; payload: ProjectItem[] }
  | { type: "MOVE_PROJEKT"; payload: { id: number; x: number; y: number } };

interface HistoryState {
  past: ImpositionerState[];
  present: ImpositionerState;
  future: ImpositionerState[];
}

function impositionerReducer(state: ImpositionerState, action: Action): ImpositionerState {
  switch (action.type) {
    case "SET_STATE":
      return action.payload;
    case "ADD_PROJEKT":
      return { ...state, projekty: [...state.projekty, action.payload] };
    case "UPDATE_PROJEKT":
      return {
        ...state,
        projekty: state.projekty.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case "DELETE_PROJEKT":
      return {
        ...state,
        projekty: state.projekty.filter((p) => p.id !== action.payload),
      };
    case "DUPLICATE_PROJEKT": {
      const src = state.projekty.find((p) => p.id === action.payload);
      if (!src) return state;
      const newItem: ProjectItem = {
        ...src,
        id: Date.now(),
        nazwa: src.nazwa + " (kopia)",
        x: src.x + 10,
        y: src.y + 10,
      };
      return { ...state, projekty: [...state.projekty, newItem] };
    }
    case "SET_ARKUSZ":
      return { ...state, arkusz: { ...state.arkusz, ...action.payload } };
    case "SET_PROJEKTY":
      return { ...state, projekty: action.payload };
    case "MOVE_PROJEKT":
      return {
        ...state,
        projekty: state.projekty.map((p) =>
          p.id === action.payload.id
            ? { ...p, x: action.payload.x, y: action.payload.y }
            : p
        ),
      };
    default:
      return state;
  }
}

const initialState: ImpositionerState = {
  arkusz: { szerokość: 320, wysokość: 450, rozstawa: 3, cena: 25 },
  projekty: [],
};

function useHistory() {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialState,
    future: [],
  });

  const dispatch = useCallback((action: Action) => {
    setHistory((h) => {
      const next = impositionerReducer(h.present, action);
      if (action.type === "MOVE_PROJEKT") {
        // Don't push to history during drag - update silently
        return { ...h, present: next };
      }
      return {
        past: [...h.past.slice(-MAX_HISTORY + 1), h.present],
        present: next,
        future: [],
      };
    });
  }, []);

  const pushToHistory = useCallback(() => {
    setHistory((h) => ({
      past: [...h.past.slice(-MAX_HISTORY + 1), h.present],
      present: h.present,
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: previous,
        future: [h.present, ...h.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      return {
        past: [...h.past, h.present],
        present: next,
        future: h.future.slice(1),
      };
    });
  }, []);

  return {
    state: history.present,
    dispatch,
    pushToHistory,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────


function pxToMm(px: number, dpi = 300): number {
  return Math.round((px / dpi) * 25.4 * 10) / 10;
}

function calcOccupancy(projekty: ProjectItem[], arkusz: SheetConfig): number {
  const sheetArea = arkusz.szerokość * arkusz.wysokość;
  if (sheetArea === 0) return 0;
  const used = projekty.reduce((sum, p) => sum + p.szerokość * p.wysokość, 0);
  return Math.min(100, Math.round((used / sheetArea) * 100 * 10) / 10);
}

function autoPack(projekty: ProjectItem[], arkusz: SheetConfig): ProjectItem[] {
  const gap = arkusz.rozstawa;
  // Expand by quantity
  const expanded: Array<{ item: ProjectItem; origIndex: number }> = [];
  projekty.forEach((p) => {
    for (let q = 0; q < p.ilość; q++) {
      expanded.push({ item: p, origIndex: p.id });
    }
  });

  // Sort by height desc
  expanded.sort((a, b) => b.item.wysokość - a.item.wysokość);

  // Shelf packing
  let x = gap;
  let y = gap;
  let rowHeight = 0;
  const placements: Array<{ id: number; x: number; y: number }> = [];

  for (const { item } of expanded) {
    if (x + item.szerokość + gap > arkusz.szerokość) {
      x = gap;
      y += rowHeight + gap;
      rowHeight = 0;
    }
    if (y + item.wysokość + gap > arkusz.wysokość) break; // no more space

    placements.push({ id: item.id, x, y });
    x += item.szerokość + gap;
    rowHeight = Math.max(rowHeight, item.wysokość);
  }

  // Map back - assign position of first placement per id
  const posMap = new Map<number, { x: number; y: number }>();
  for (const pl of placements) {
    if (!posMap.has(pl.id)) posMap.set(pl.id, { x: pl.x, y: pl.y });
  }

  return projekty.map((p) => {
    const pos = posMap.get(p.id);
    return pos ? { ...p, x: pos.x, y: pos.y } : p;
  });
}

async function resizeImageToThumbnail(dataUrl: string, maxSize = 200): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = dataUrl;
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <button onClick={onClose} className="text-[#888] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Canvas Component ─────────────────────────────────────────────────────────

interface CanvasProps {
  state: ImpositionerState;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onDrop: (id: number, x: number, y: number) => void;
  onDragStart: () => void;
}

function ImpositionCanvas({ state, selectedId, onSelect, onDrop, onDragStart }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const dragRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Preload thumbnails
  useEffect(() => {
    state.projekty.forEach((p) => {
      if (p.obraz && !imagesRef.current.has(p.obraz)) {
        const img = new window.Image();
        img.src = p.obraz;
        img.onload = () => {
          imagesRef.current.set(p.obraz!, img);
          draw();
        };
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.projekty]);

  const getScale = useCallback(() => {
    if (!containerRef.current) return 1;
    const cw = containerRef.current.clientWidth - 32;
    const ch = containerRef.current.clientHeight - 32;
    const scaleX = cw / state.arkusz.szerokość;
    const scaleY = ch / state.arkusz.wysokość;
    return Math.min(scaleX, scaleY, 3);
  }, [state.arkusz]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = getScale();
    setScale(s);

    const W = state.arkusz.szerokość * s;
    const H = state.arkusz.wysokość * s;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, W, H);

    // Sheet
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // Grid dots
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    for (let gx = 0; gx < state.arkusz.szerokość; gx += 10) {
      for (let gy = 0; gy < state.arkusz.wysokość; gy += 10) {
        ctx.beginPath();
        ctx.arc(gx * s, gy * s, 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Projects
    state.projekty.forEach((p) => {
      const px = p.x * s;
      const py = p.y * s;
      const pw = p.szerokość * s;
      const ph = p.wysokość * s;

      const isSelected = p.id === selectedId;

      // Shadow
      ctx.shadowColor = isSelected ? p.kolor : "rgba(0,0,0,0.15)";
      ctx.shadowBlur = isSelected ? 8 : 4;

      // Fill
      ctx.fillStyle = p.kolor + "22";
      ctx.fillRect(px, py, pw, ph);
      ctx.shadowBlur = 0;

      // Border
      ctx.strokeStyle = isSelected ? p.kolor : p.kolor + "88";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);

      // Thumbnail
      if (p.obraz && imagesRef.current.has(p.obraz)) {
        const img = imagesRef.current.get(p.obraz)!;
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.drawImage(img, px + 2, py + 2, pw - 4, ph - 4);
        ctx.restore();
      }

      // Label
      if (pw > 30 && ph > 16) {
        ctx.fillStyle = isSelected ? "#fff" : "#333";
        ctx.font = `bold ${Math.max(8, Math.min(11, pw / 8))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const label = p.nazwa.length > 12 ? p.nazwa.slice(0, 12) + "…" : p.nazwa;
        ctx.fillText(label, px + pw / 2, py + ph / 2 - 5);
        ctx.font = `${Math.max(7, Math.min(9, pw / 10))}px sans-serif`;
        ctx.fillStyle = isSelected ? "#ddd" : "#555";
        ctx.fillText(`${p.szerokość}×${p.wysokość}mm`, px + pw / 2, py + ph / 2 + 7);
      }

      // Selection handles
      if (isSelected) {
        const hs = 5;
        ctx.fillStyle = p.kolor;
        [[px, py], [px + pw, py], [px, py + ph], [px + pw, py + ph]].forEach(([hx, hy]) => {
          ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
        });
      }
    });

    // Sheet border
    ctx.strokeStyle = "#fe4e00";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.75, 0.75, W - 1.5, H - 1.5);

    // Margin boundary (dashed)
    const m = SHEET_MARGIN * s;
    ctx.strokeStyle = "rgba(254,78,0,0.35)";
    ctx.lineWidth = 0.75;
    ctx.setLineDash([3 * s, 2 * s]);
    ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
    ctx.setLineDash([]);

    // Occupancy
    const occ = calcOccupancy(state.projekty, state.arkusz);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(4, H - 22, 120, 18);
    ctx.fillStyle = "#ffffff";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`Zajętość: ${occ}%`, 8, H - 13);
  }, [state, selectedId, getScale]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const ro = new ResizeObserver(() => draw());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [draw]);

  // Mouse events
  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const s = getScale();
    return {
      x: (e.clientX - rect.left) / s,
      y: (e.clientY - rect.top) / s,
    };
  };

  const hitTest = (x: number, y: number): ProjectItem | null => {
    // Reverse order so top-most renders on top
    const reversed = [...state.projekty].reverse();
    return reversed.find(
      (p) =>
        x >= p.x && x <= p.x + p.szerokość &&
        y >= p.y && y <= p.y + p.wysokość
    ) ?? null;
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);
    const hit = hitTest(pos.x, pos.y);
    if (hit) {
      onSelect(hit.id);
      dragRef.current = {
        id: hit.id,
        startX: hit.x,
        startY: hit.y,
        offsetX: pos.x - hit.x,
        offsetY: pos.y - hit.y,
        currentX: hit.x,
        currentY: hit.y,
      };
    } else {
      onSelect(null);
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const pos = getCanvasPos(e);
    const dragItem = state.projekty.find(p => p.id === dragRef.current!.id);
    const newX = Math.max(SHEET_MARGIN, Math.min(
      state.arkusz.szerokość - SHEET_MARGIN - (dragItem?.szerokość ?? 0),
      pos.x - dragRef.current.offsetX
    ));
    const newY = Math.max(SHEET_MARGIN, Math.min(
      state.arkusz.wysokość - SHEET_MARGIN - (dragItem?.wysokość ?? 0),
      pos.y - dragRef.current.offsetY
    ));
    dragRef.current.currentX = Math.round(newX * 10) / 10;
    dragRef.current.currentY = Math.round(newY * 10) / 10;
    onDrop(dragRef.current.id, dragRef.current.currentX, dragRef.current.currentY);
  };

  const onMouseUp = () => {
    if (dragRef.current) {
      onDrop(dragRef.current.id, dragRef.current.currentX, dragRef.current.currentY);
      dragRef.current = null;
      onDragStart(); // push history on drop
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center bg-[#0d0d0d] rounded-xl overflow-hidden relative"
      style={{ minHeight: 400 }}
    >
      <canvas
        ref={canvasRef}
        className="rounded shadow-lg cursor-crosshair"
        style={{ imageRendering: "crisp-edges" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
      <div className="absolute bottom-3 right-3 text-[10px] text-[#555] bg-[#0d0d0d]/80 px-2 py-1 rounded">
        {state.arkusz.szerokość}×{state.arkusz.wysokość}mm · {Math.round(scale * 100) / 100}x zoom
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function ImpositionerScreen() {
  const { sheetConfig, setSheetConfig } = useImpositionerConfig();
  const { state, dispatch: rawDispatch, pushToHistory, undo, redo, canUndo, canRedo } = useHistory();

  const dispatch: typeof rawDispatch = useCallback((action) => {
    if (action.type === "SET_ARKUSZ") {
      setSheetConfig(action.payload);
    }
    rawDispatch(action);
  }, [rawDispatch, setSheetConfig]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [imageData, setImageData] = useState<{ dataUrl: string; w: number; h: number; name: string } | null>(null);
  const [imageOverride, setImageOverride] = useState({ w: 0, h: 0, qty: 1, name: "" });
  const [recentProjects, setRecentProjects] = useState<SavedProject[]>([]);
  const [newForm, setNewForm] = useState({ nazwa: "", szerokość: "100", wysokość: "80", ilość: "1" });
  const [editForm, setEditForm] = useState<ProjectItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cost calc state
  const [cost, setCost] = useState({ materialPerM2: 45, labor: 8, sheets: 1 });
  const [tileGap, setTileGap] = useState(3);

  // Load from localStorage on mount — arkusz from persisted store, projekty from autosave
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const parsed: SavedProject = JSON.parse(saved);
        rawDispatch({ type: "SET_STATE", payload: { arkusz: sheetConfig, projekty: parsed.projekty } });
      } else {
        rawDispatch({ type: "SET_ARKUSZ", payload: sheetConfig });
      }
    } catch {
      rawDispatch({ type: "SET_ARKUSZ", payload: sheetConfig });
    }
    try {
      const hist = localStorage.getItem(LS_HISTORY_KEY);
      if (hist) setRecentProjects(JSON.parse(hist));
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Auto-save every 10s
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      const project: SavedProject = {
        id: "autosave",
        nazwa: "Autosave",
        data: new Date().toISOString(),
        arkusz: state.arkusz,
        projekty: state.projekty,
      };
      localStorage.setItem(LS_KEY, JSON.stringify(project));
    }, 10000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [state]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.ctrlKey && e.shiftKey && e.key === "Z") { e.preventDefault(); redo(); }
      else if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
      else if (e.key === "Delete" && selectedId !== null) {
        dispatch({ type: "DELETE_PROJEKT", payload: selectedId });
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, selectedId, dispatch]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddProject = () => {
    const w = parseFloat(newForm.szerokość);
    const h = parseFloat(newForm.wysokość);
    const q = parseInt(newForm.ilość);
    if (!newForm.nazwa || isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;
    const colorIdx = state.projekty.length % COLORS.length;
    const item: ProjectItem = {
      id: Date.now(),
      nazwa: newForm.nazwa,
      szerokość: w,
      wysokość: h,
      ilość: Math.max(1, q || 1),
      x: state.arkusz.rozstawa,
      y: state.arkusz.rozstawa,
      obraz: null,
      kolor: COLORS[colorIdx],
    };
    dispatch({ type: "ADD_PROJEKT", payload: item });
    setNewForm({ nazwa: "", szerokość: "100", wysokość: "80", ilość: "1" });
    setShowAddForm(false);
  };

  const handleDeleteProject = (id: number) => {
    dispatch({ type: "DELETE_PROJEKT", payload: id });
    if (selectedId === id) setSelectedId(null);
  };

  const handleSaveProject = () => {
    const project: SavedProject = {
      id: `proj-${Date.now()}`,
      nazwa: `Projekt ${new Date().toLocaleDateString("pl-PL")}`,
      data: new Date().toISOString(),
      arkusz: state.arkusz,
      projekty: state.projekty,
    };
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dtf-projekt-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    // Save to history
    const newHistory = [project, ...recentProjects.filter(p => p.id !== project.id)].slice(0, 5);
    setRecentProjects(newHistory);
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(newHistory));
  };

  const handleLoadProject = (proj: SavedProject) => {
    dispatch({ type: "SET_STATE", payload: { arkusz: proj.arkusz, projekty: proj.projekty } });
    setShowHistoryMenu(false);
  };

  const handleJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const proj: SavedProject = JSON.parse(reader.result as string);
        handleLoadProject(proj);
      } catch {}
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleAutoPack = () => {
    const packed = autoPack(state.projekty, state.arkusz);
    dispatch({ type: "SET_PROJEKTY", payload: packed });
  };

  const handleFillSheet = () => {
    if (selectedId === null) return;
    const item = state.projekty.find((p) => p.id === selectedId);
    if (!item) return;
    const { szerokość: sw, wysokość: sh } = state.arkusz;
    const g = tileGap;
    const usableW = sw - 2 * SHEET_MARGIN;
    const usableH = sh - 2 * SHEET_MARGIN;
    const cols = Math.floor((usableW + g) / (item.szerokość + g));
    const rows = Math.floor((usableH + g) / (item.wysokość + g));
    if (cols <= 0 || rows <= 0) return;
    const tiles: ProjectItem[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        tiles.push({
          ...item,
          id: Date.now() + row * 1000 + col,
          ilość: 1,
          x: SHEET_MARGIN + col * (item.szerokość + g),
          y: SHEET_MARGIN + row * (item.wysokość + g),
        });
      }
    }
    const others = state.projekty.filter((p) => p.id !== selectedId);
    dispatch({ type: "SET_PROJEKTY", payload: [...others, ...tiles] });
    setSelectedId(null);
  };


  const processImageFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const wMm = pxToMm(img.width);
        const hMm = pxToMm(img.height);
        setImageData({ dataUrl, w: img.width, h: img.height, name: file.name.replace(/\.[^.]+$/, "") });
        setImageOverride({ w: wMm, h: hMm, qty: 1, name: file.name.replace(/\.[^.]+$/, "") });
        setShowImageModal(true);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    e.target.value = "";
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) processImageFile(file);
  };

  const handleImageConfirm = async () => {
    if (!imageData) return;
    const thumb = await resizeImageToThumbnail(imageData.dataUrl);
    const colorIdx = state.projekty.length % COLORS.length;
    const item: ProjectItem = {
      id: Date.now(),
      nazwa: imageOverride.name || imageData.name,
      szerokość: imageOverride.w,
      wysokość: imageOverride.h,
      ilość: imageOverride.qty,
      x: state.arkusz.rozstawa,
      y: state.arkusz.rozstawa,
      obraz: thumb,
      kolor: COLORS[colorIdx],
    };
    dispatch({ type: "ADD_PROJEKT", payload: item });
    setShowImageModal(false);
    setImageData(null);
  };

  const handleExportPDF = () => {
    const { szerokość: sw, wysokość: sh } = state.arkusz;
    const dpi = 300;
    const pxPerMm = dpi / 25.4;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = Math.round(sw * pxPerMm);
    exportCanvas.height = Math.round(sh * pxPerMm);
    const ctx = exportCanvas.getContext("2d")!;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.src = src;
      });

    const itemsWithImages = state.projekty.filter((p) => p.obraz);

    Promise.all(itemsWithImages.map((p) => loadImage(p.obraz!))).then((imgs) => {
      itemsWithImages.forEach((p, i) => {
        ctx.drawImage(
          imgs[i],
          Math.round(p.x * pxPerMm),
          Math.round(p.y * pxPerMm),
          Math.round(p.szerokość * pxPerMm),
          Math.round(p.wysokość * pxPerMm),
        );
      });

      const imgData = exportCanvas.toDataURL("image/png");
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Wydruk</title>
<style>
  * { margin: 0; padding: 0; }
  body { background: #fff; }
  img { display: block; width: 100%; height: auto; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<img src="${imgData}" />
<script>window.onload = () => window.print();</script>
</body>
</html>`);
      win.document.close();
    });
  };

  const occ = calcOccupancy(state.projekty, state.arkusz);

  return (
    <div
      className="flex flex-col h-full bg-[#0d0d0d] text-white"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleImageDrop}
    >
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] border-b border-[#2a2a2a] flex-wrap">
        <div className="flex items-center gap-1.5 mr-2">
          <Layers size={18} className="text-[#fe4e00]" />
          <span className="font-semibold text-sm text-white">Impozycjoner DTF</span>
        </div>

        <div className="w-px h-5 bg-[#2a2a2a]" />

        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Cofnij (Ctrl+Z)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-[#2a2a2a] hover:bg-[#333] text-[#ccc]"
        >
          <Undo2 size={14} /> Cofnij
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Ponów (Ctrl+Shift+Z)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-[#2a2a2a] hover:bg-[#333] text-[#ccc]"
        >
          <Redo2 size={14} /> Ponów
        </button>

        <div className="w-px h-5 bg-[#2a2a2a]" />

        {/* Fill sheet — visible only when a project is selected */}
        {selectedId !== null && (
          <>
            <button
              onClick={handleFillSheet}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#fe4e00]/20 hover:bg-[#fe4e00]/30 text-[#fe4e00] transition-colors"
            >
              <Layers size={14} /> Wypełnij arkusz
            </button>
            <div className="w-px h-5 bg-[#2a2a2a]" />
          </>
        )}

        {/* Import */}
        <button
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] hover:bg-[#333] text-[#ccc] transition-colors"
        >
          <ImageIcon size={14} /> Import obrazu
        </button>

        <div className="w-px h-5 bg-[#2a2a2a]" />

        {/* Save/Load */}
        <button
          onClick={handleSaveProject}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] hover:bg-[#333] text-[#ccc] transition-colors"
        >
          <Save size={14} /> Zapisz projekt
        </button>
        <button
          onClick={() => jsonInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] hover:bg-[#333] text-[#ccc] transition-colors"
        >
          <FolderOpen size={14} /> Wczytaj projekt
        </button>

        {/* History dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowHistoryMenu((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] hover:bg-[#333] text-[#ccc] transition-colors"
          >
            <History size={14} /> Ostatnie <ChevronDown size={12} />
          </button>
          {showHistoryMenu && (
            <div className="absolute top-full mt-1 left-0 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl z-20 w-64">
              {recentProjects.length === 0 ? (
                <div className="px-4 py-3 text-xs text-[#666]">Brak zapisanych projektów</div>
              ) : (
                recentProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleLoadProject(p)}
                    className="w-full flex flex-col px-4 py-2.5 hover:bg-[#2a2a2a] transition-colors text-left"
                  >
                    <span className="text-sm text-white">{p.nazwa}</span>
                    <span className="text-xs text-[#666]">{new Date(p.data).toLocaleDateString("pl-PL")}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-[#2a2a2a]" />

        <button
          onClick={handleExportPDF}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#2a2a2a] hover:bg-[#333] text-[#ccc] transition-colors"
        >
          <FileDown size={14} /> Eksport PDF
        </button>

        {/* Konfiguracja arkusza — toolbar */}
        <div className="ml-auto flex items-center gap-2">
          <div className="w-px h-5 bg-[#2a2a2a]" />
          <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider whitespace-nowrap">Konfiguracja arkusza</span>
          <div className="flex items-center gap-1">
            <label className="text-[10px] text-[#666] whitespace-nowrap">Szer.</label>
            <input
              type="number"
              className="w-16 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#fe4e00]"
              value={state.arkusz.szerokość}
              onChange={(e) => dispatch({ type: "SET_ARKUSZ", payload: { szerokość: parseFloat(e.target.value) || 0 } })}
            />
            <span className="text-[10px] text-[#555]">mm</span>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-[10px] text-[#666] whitespace-nowrap">Wys.</label>
            <input
              type="number"
              className="w-16 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#fe4e00]"
              value={state.arkusz.wysokość}
              onChange={(e) => dispatch({ type: "SET_ARKUSZ", payload: { wysokość: parseFloat(e.target.value) || 0 } })}
            />
            <span className="text-[10px] text-[#555]">mm</span>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-[10px] text-[#666] whitespace-nowrap">Cena</label>
            <input
              type="number"
              className="w-16 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#fe4e00]"
              value={state.arkusz.cena}
              onChange={(e) => dispatch({ type: "SET_ARKUSZ", payload: { cena: parseFloat(e.target.value) || 0 } })}
            />
            <span className="text-[10px] text-[#555]">PLN</span>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleJSONFile} />
        <input ref={jsonInputRef} type="file" accept=".json" className="hidden" onChange={handleJSONFile} />
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Panel: Project List */}
        <div className="w-64 shrink-0 flex flex-col bg-[#111] border-r border-[#2a2a2a] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
            <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">
              Projekty ({state.projekty.length})
            </span>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#fe4e00] hover:bg-[#e04400] text-white text-xs font-medium transition-colors"
            >
              <Plus size={12} /> Dodaj
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className="px-3 py-3 border-b border-[#2a2a2a] bg-[#1a1a1a]">
              <input
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white mb-1.5 focus:outline-none focus:border-[#fe4e00]"
                placeholder="Nazwa projektu"
                value={newForm.nazwa}
                onChange={(e) => setNewForm((f) => ({ ...f, nazwa: e.target.value }))}
              />
              <div className="flex gap-1.5 mb-1.5">
                <input
                  className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#fe4e00]"
                  placeholder="Szer. mm"
                  type="number"
                  value={newForm.szerokość}
                  onChange={(e) => setNewForm((f) => ({ ...f, szerokość: e.target.value }))}
                />
                <input
                  className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#fe4e00]"
                  placeholder="Wys. mm"
                  type="number"
                  value={newForm.wysokość}
                  onChange={(e) => setNewForm((f) => ({ ...f, wysokość: e.target.value }))}
                />
                <input
                  className="w-14 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#fe4e00]"
                  placeholder="Szt"
                  type="number"
                  min="1"
                  value={newForm.ilość}
                  onChange={(e) => setNewForm((f) => ({ ...f, ilość: e.target.value }))}
                />
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={handleAddProject}
                  className="flex-1 bg-[#fe4e00] hover:bg-[#e04400] text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
                >
                  Dodaj
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-[#888] text-xs font-medium py-1.5 rounded-lg transition-colors"
                >
                  Anuluj
                </button>
              </div>
            </div>
          )}

          {/* Drop hint */}
          <div className="px-3 py-2 border-b border-[#2a2a2a] bg-[#0d0d0d]/50">
            <div className="flex items-center justify-center gap-2 border border-dashed border-[#2a2a2a] rounded-lg py-2 text-[#555] text-[10px]">
              <Upload size={11} />
              Upuść obraz lub CSV tutaj
            </div>
          </div>

          {/* Project list */}
          <div className="flex-1 overflow-y-auto">
            {state.projekty.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-[#555] text-xs gap-2">
                <Package size={24} />
                <span>Brak projektów</span>
              </div>
            ) : (
              state.projekty.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                  className={`flex items-start gap-2 px-3 py-2.5 border-b border-[#1f1f1f] cursor-pointer transition-colors ${
                    p.id === selectedId ? "bg-[#1a1a1a]" : "hover:bg-[#161616]"
                  }`}
                >
                  <div
                    className="w-1.5 h-full min-h-[36px] rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: p.kolor }}
                  />
                  {p.obraz && (
                    <img src={p.obraz} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    {editingId === p.id && editForm ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2 py-0.5 text-xs text-white mb-1 focus:outline-none focus:border-[#fe4e00]"
                          value={editForm.nazwa}
                          onChange={(e) => setEditForm({ ...editForm, nazwa: e.target.value })}
                        />
                        <div className="flex gap-1 mb-1">
                          <input
                            className="w-16 bg-[#0d0d0d] border border-[#2a2a2a] rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-[#fe4e00]"
                            type="number"
                            value={editForm.szerokość}
                            onChange={(e) => setEditForm({ ...editForm, szerokość: parseFloat(e.target.value) })}
                          />
                          <span className="text-[#555] text-xs self-center">×</span>
                          <input
                            className="w-16 bg-[#0d0d0d] border border-[#2a2a2a] rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-[#fe4e00]"
                            type="number"
                            value={editForm.wysokość}
                            onChange={(e) => setEditForm({ ...editForm, wysokość: parseFloat(e.target.value) })}
                          />
                          <input
                            className="w-12 bg-[#0d0d0d] border border-[#2a2a2a] rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:border-[#fe4e00]"
                            type="number"
                            min="1"
                            value={editForm.ilość}
                            onChange={(e) => setEditForm({ ...editForm, ilość: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              dispatch({ type: "UPDATE_PROJEKT", payload: editForm });
                              setEditingId(null);
                            }}
                            className="flex-1 bg-[#fe4e00] text-white text-[10px] py-0.5 rounded"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex-1 bg-[#2a2a2a] text-[#888] text-[10px] py-0.5 rounded"
                          >
                            Anuluj
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs font-medium text-white truncate">{p.nazwa}</div>
                        <div className="text-[10px] text-[#666]">
                          {p.szerokość}×{p.wysokość}mm · ×{p.ilość}
                        </div>
                        <div className="text-[10px] text-[#555]">
                          x:{Math.round(p.x)} y:{Math.round(p.y)}
                        </div>
                      </>
                    )}
                  </div>
                  {editingId !== p.id && (
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(p.id); setEditForm({ ...p }); }}
                        className="text-[#555] hover:text-[#fe4e00] transition-colors"
                        title="Edytuj"
                      >
                        <ChevronDown size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); dispatch({ type: "DUPLICATE_PROJEKT", payload: p.id }); }}
                        className="text-[#555] hover:text-[#ccc] transition-colors"
                        title="Duplikuj"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }}
                        className="text-[#555] hover:text-red-500 transition-colors"
                        title="Usuń"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Clear all */}
          {state.projekty.length > 0 && (
            <div className="px-3 py-2 border-t border-[#2a2a2a]">
              <button
                onClick={() => { dispatch({ type: "SET_PROJEKTY", payload: [] }); setSelectedId(null); }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs text-red-400 font-medium transition-colors"
                title="Usuń wszystkie projekty z arkusza"
              >
                <Trash2 size={11} /> Wyczyść arkusz
              </button>
            </div>
          )}

          {/* Occupancy + margin info */}
          <div className="px-3 py-2 border-t border-[#2a2a2a] bg-[#111] space-y-2">
            <div className="flex justify-between text-[10px] text-[#666] mb-1">
              <span>Zajętość arkusza</span>
              <span className={occ > 80 ? "text-green-400" : occ > 50 ? "text-yellow-400" : "text-[#666]"}>
                {occ}%
              </span>
            </div>
            <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden mb-1">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${occ}%`,
                  backgroundColor: occ > 80 ? "#22c55e" : occ > 50 ? "#f59e0b" : "#fe4e00",
                }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-[#666]">
              <span>Margines arkusza</span>
              <span className="text-[#888]">{SHEET_MARGIN} mm.</span>
            </div>
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
          <ImpositionCanvas
            state={state}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDrop={(id, x, y) => dispatch({ type: "MOVE_PROJEKT", payload: { id, x, y } })}
            onDragStart={pushToHistory}
          />
        </div>

        {/* Right Panel */}
        <div className="w-64 shrink-0 flex flex-col bg-[#111] border-l border-[#2a2a2a] overflow-y-auto">

          {/* Sheet Config */}
          <div className="px-3 py-2 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#888] uppercase tracking-wider mb-2">
              <Settings size={12} />
              Konfiguracja arkusza
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-1 mb-2">
              {PRESETS.map((p) => {
                const isActive = state.arkusz.szerokość === p.w && state.arkusz.wysokość === p.h;
                return (
                  <button
                    key={p.label}
                    onClick={() => dispatch({ type: "SET_ARKUSZ", payload: { szerokość: p.w, wysokość: p.h } })}
                    className={`px-1 py-1 rounded text-[10px] font-medium transition-colors border ${
                      isActive
                        ? "bg-[#fe4e00]/20 border-[#fe4e00] text-[#fe4e00]"
                        : "bg-[#0d0d0d] border-[#2a2a2a] text-[#888] hover:border-[#444]"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1">
              <div className="flex gap-1.5 items-center">
                <label className="text-[10px] text-[#666] w-14 shrink-0">Szerokość</label>
                <div className="flex items-center flex-1 gap-1">
                  <input
                    type="number"
                    className="w-20 bg-[#0d0d0d] border border-[#2a2a2a] rounded px-1.5 py-0.5 text-[11px] text-white focus:outline-none focus:border-[#fe4e00]"
                    value={state.arkusz.szerokość}
                    onChange={(e) => dispatch({ type: "SET_ARKUSZ", payload: { szerokość: parseFloat(e.target.value) || 0 } })}
                  />
                  <span className="text-[10px] text-[#555]">mm</span>
                </div>
              </div>
              <div className="flex gap-1.5 items-center">
                <label className="text-[10px] text-[#666] w-14 shrink-0">Wysokość</label>
                <div className="flex items-center flex-1 gap-1">
                  <input
                    type="number"
                    className="w-20 bg-[#0d0d0d] border border-[#2a2a2a] rounded px-1.5 py-0.5 text-[11px] text-white focus:outline-none focus:border-[#fe4e00]"
                    value={state.arkusz.wysokość}
                    onChange={(e) => dispatch({ type: "SET_ARKUSZ", payload: { wysokość: parseFloat(e.target.value) || 0 } })}
                  />
                  <span className="text-[10px] text-[#555]">mm</span>
                </div>
              </div>
              <div className="flex gap-1.5 items-center">
                <label className="text-[10px] text-[#666] w-14 shrink-0">Cena ark.</label>
                <div className="flex items-center flex-1 gap-1">
                  <input
                    type="number"
                    className="w-20 bg-[#0d0d0d] border border-[#2a2a2a] rounded px-1.5 py-0.5 text-[11px] text-white focus:outline-none focus:border-[#fe4e00]"
                    value={cost.materialPerM2}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setCost((c) => ({ ...c, materialPerM2: val }));
                      dispatch({ type: "SET_ARKUSZ", payload: { cena: val } });
                    }}
                  />
                  <span className="text-[10px] text-[#555]">PLN</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected item info */}
          {selectedId !== null && (() => {
            const sel = state.projekty.find((p) => p.id === selectedId);
            if (!sel) return null;
            return (
              <div className="px-4 py-3 border-b border-[#2a2a2a]">
                <div className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Zaznaczony</div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sel.kolor }} />
                  <span className="text-sm font-medium text-white truncate">{sel.nazwa}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-[#666]">
                  <div>Wym: <span className="text-white">{sel.szerokość}×{sel.wysokość}mm</span></div>
                  <div>Szt: <span className="text-white">{sel.ilość}</span></div>
                  <div>X: <span className="text-white">{Math.round(sel.x)}mm</span></div>
                  <div>Y: <span className="text-white">{Math.round(sel.y)}mm</span></div>
                </div>
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => dispatch({ type: "DUPLICATE_PROJEKT", payload: sel.id })}
                    className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-xs text-[#888]"
                  >
                    <Copy size={11} /> Duplikuj
                  </button>
                  <button
                    onClick={() => handleDeleteProject(sel.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs text-red-400"
                  >
                    <Trash2 size={11} /> Usuń
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <label className="text-[10px] text-[#666] whitespace-nowrap">Odstęp</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    className="w-14 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#fe4e00]"
                    value={tileGap}
                    onChange={(e) => setTileGap(parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-[10px] text-[#555]">mm</span>
                  <span className="text-[10px] text-[#555] ml-auto">
                    {Math.floor((state.arkusz.szerokość - 2 * SHEET_MARGIN + tileGap) / (sel.szerokość + tileGap))}×{Math.floor((state.arkusz.wysokość - 2 * SHEET_MARGIN + tileGap) / (sel.wysokość + tileGap))} szt.
                  </span>
                </div>
                <button
                  onClick={handleFillSheet}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#fe4e00]/20 hover:bg-[#fe4e00]/30 text-xs text-[#fe4e00] font-medium transition-colors"
                >
                  <Layers size={11} /> Wypełnij arkusz
                </button>
              </div>
            );
          })()}

          {/* Cost Calculator */}
          <div className="px-3 py-2 border-t border-[#2a2a2a]">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#888] uppercase tracking-wider mb-2">
              <Calculator size={12} />
              Kalkulator kosztów
            </div>

            <div className="space-y-1">
              <div className="flex gap-1.5 items-center">
                <label className="text-[10px] text-[#666] w-14 shrink-0">Ilość ark.</label>
                <div className="flex items-center flex-1 gap-1">
                  <input
                    type="number"
                    min="1"
                    className="w-20 bg-[#0d0d0d] border border-[#2a2a2a] rounded px-1.5 py-0.5 text-[11px] text-white focus:outline-none focus:border-[#fe4e00]"
                    value={cost.sheets}
                    onChange={(e) => setCost((c) => ({ ...c, sheets: parseInt(e.target.value) || 1 }))}
                  />
                  <span className="text-[10px] text-[#555]">szt.</span>
                </div>
              </div>

              <div className="mt-2 bg-[#0d0d0d] rounded-lg p-2 space-y-1 border border-[#2a2a2a]">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#666]">Cena/arkusz</span>
                  <span className="text-white">{cost.materialPerM2.toFixed(2)} zł</span>
                </div>
                <div className="h-px bg-[#2a2a2a]" />
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#666]">Łącznie ({cost.sheets} ark.)</span>
                  <span className="text-white font-medium">{(cost.materialPerM2 * cost.sheets).toFixed(2)} zł</span>
                </div>
                <div className="h-px bg-[#2a2a2a]" />
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#fe4e00]">Cena sprzedaży +40%</span>
                  <span className="text-[#fe4e00] font-bold">{(cost.materialPerM2 * cost.sheets * 1.4).toFixed(2)} zł</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ── Image Import Modal ── */}
      {showImageModal && imageData && (
        <Modal title="Import obrazu" onClose={() => { setShowImageModal(false); setImageData(null); }}>
          <div className="space-y-4">
            <div className="flex items-center justify-center bg-[#0d0d0d] rounded-xl p-4 border border-[#2a2a2a]">
              <img
                src={imageData.dataUrl}
                alt="preview"
                className="max-h-48 max-w-full object-contain rounded"
              />
            </div>
            <div className="text-xs text-[#888] bg-[#0d0d0d] rounded-lg p-3 border border-[#2a2a2a]">
              Rozdzielczość: <span className="text-white">{imageData.w}×{imageData.h}px</span> &nbsp;→&nbsp;
              <span className="text-[#fe4e00]">{pxToMm(imageData.w)}×{pxToMm(imageData.h)}mm</span>
              <span className="ml-2 text-[#666]">(przy 300 DPI)</span>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-[#666] mb-1 block">Nazwa</label>
                <input
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#fe4e00]"
                  value={imageOverride.name}
                  onChange={(e) => setImageOverride((v) => ({ ...v, name: e.target.value }))}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-[#666] mb-1 block">Szerokość (mm)</label>
                  <input
                    type="number"
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#fe4e00]"
                    value={imageOverride.w}
                    onChange={(e) => setImageOverride((v) => ({ ...v, w: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-[#666] mb-1 block">Wysokość (mm)</label>
                  <input
                    type="number"
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#fe4e00]"
                    value={imageOverride.h}
                    onChange={(e) => setImageOverride((v) => ({ ...v, h: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="w-20">
                  <label className="text-[10px] text-[#666] mb-1 block">Ilość</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#fe4e00]"
                    value={imageOverride.qty}
                    onChange={(e) => setImageOverride((v) => ({ ...v, qty: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleImageConfirm}
                className="flex-1 bg-[#fe4e00] hover:bg-[#e04400] text-white text-sm font-medium py-2 rounded-xl transition-colors"
              >
                Dodaj do projektu
              </button>
              <button
                onClick={() => { setShowImageModal(false); setImageData(null); }}
                className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-[#888] text-sm py-2 rounded-xl transition-colors"
              >
                Anuluj
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Click outside to close history */}
      {showHistoryMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowHistoryMenu(false)} />
      )}
    </div>
  );
}
