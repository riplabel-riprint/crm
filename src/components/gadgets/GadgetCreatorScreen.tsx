"use client";

import { useState, useRef, useCallback, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Info, Undo2, Redo2, Upload, Type,
  BookImage, X, Minus, Plus, Hand, Save,
} from "lucide-react";
import { ClientSelector } from "@/components/shared/ClientSelector";

// ─── Types ────────────────────────────────────────────────────────────────────

type Surface = "front" | "back" | "sleeve_left" | "sleeve_right" | "neck_label";

interface BaseElement {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
}

interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  name: string;
}

type DesignElement = TextElement | ImageElement;
type AllSurfaces = Record<Surface, DesignElement[]>;

interface LibraryItem {
  id: string;
  src: string;
  name: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SURFACES: { id: Surface; label: string }[] = [
  { id: "front",        label: "Przód" },
  { id: "back",         label: "Tył" },
  { id: "sleeve_left",  label: "Lewy rękaw" },
  { id: "sleeve_right", label: "Prawy rękaw" },
  { id: "neck_label",   label: "Wewnętrzna metka" },
];

// Print zone: center + half-dimensions in SVG viewBox units (320×420)
const ZONES: Record<Surface, { cx: number; cy: number; w: number; h: number }> = {
  front:        { cx: 160, cy: 248, w: 150, h: 160 },
  back:         { cx: 160, cy: 248, w: 150, h: 160 },
  sleeve_left:  { cx: 65,  cy: 150, w: 52,  h: 72 },
  sleeve_right: { cx: 255, cy: 150, w: 52,  h: 72 },
  neck_label:   { cx: 160, cy: 168, w: 88,  h: 48 },
};

function emptyAll(): AllSurfaces {
  return { front: [], back: [], sleeve_left: [], sleeve_right: [], neck_label: [] };
}

const LS_KEY = "riprint-gadget-v1";
const LS_LIB_KEY = "riprint-gadget-lib-v1";

// ─── Product SVG shapes ───────────────────────────────────────────────────────

function ProductShape({ surface }: { surface: Surface }) {
  const body = "#f5f2ec";
  const rib  = "#e6e1d5";
  const s    = "rgba(0,0,0,0.13)";

  if (surface === "front" || surface === "back") {
    return (
      <g>
        <path
          d="M 108,28 Q 160,6 212,28 L 294,66 L 308,152 L 258,163 L 258,398 L 62,398 L 62,163 L 12,152 L 26,66 Z"
          fill={body} stroke={s} strokeWidth="1.8"
          filter="url(#sw-shadow)"
        />
        <path
          d="M 108,28 Q 160,6 212,28 L 294,66 L 308,152 L 258,163 L 258,398 L 62,398 L 62,163 L 12,152 L 26,66 Z"
          fill="url(#sw-shade)"
        />
        {/* Collar */}
        <ellipse cx="160" cy="38" rx="44" ry="23" fill={rib} stroke={s} strokeWidth="1.2" />
        <ellipse cx="160" cy="36" rx="35" ry="16" fill={body} stroke={s} strokeWidth="0.8" />
        {/* Seams */}
        <line x1="62"  y1="163" x2="62"  y2="398" stroke={s} strokeWidth="0.8" />
        <line x1="258" y1="163" x2="258" y2="398" stroke={s} strokeWidth="0.8" />
        {/* Cuffs */}
        <rect x="12"  y="143" width="50" height="14" rx="4" fill={rib} stroke={s} strokeWidth="1" />
        <rect x="258" y="143" width="50" height="14" rx="4" fill={rib} stroke={s} strokeWidth="1" />
        {/* Bottom rib */}
        <rect x="62" y="383" width="196" height="18" rx="4" fill={rib} stroke={s} strokeWidth="1" />
        {surface === "back" && (
          <line x1="160" y1="28" x2="160" y2="398" stroke={s} strokeWidth="0.6" strokeDasharray="4,3" />
        )}
      </g>
    );
  }

  if (surface === "sleeve_left") {
    return (
      <g>
        <path
          d="M 100,82 L 28,105 L 18,208 L 80,220 L 118,220 L 122,82 Z"
          fill={body} stroke={s} strokeWidth="1.5" filter="url(#sw-shadow)"
        />
        <rect x="18" y="204" width="100" height="16" rx="4" fill={rib} stroke={s} strokeWidth="1" />
        <text x="160" y="320" textAnchor="middle" fontSize="12" fill="rgba(0,0,0,0.22)">Lewy rękaw</text>
      </g>
    );
  }

  if (surface === "sleeve_right") {
    return (
      <g>
        <path
          d="M 220,82 L 292,105 L 302,208 L 240,220 L 202,220 L 198,82 Z"
          fill={body} stroke={s} strokeWidth="1.5" filter="url(#sw-shadow)"
        />
        <rect x="202" y="204" width="100" height="16" rx="4" fill={rib} stroke={s} strokeWidth="1" />
        <text x="160" y="320" textAnchor="middle" fontSize="12" fill="rgba(0,0,0,0.22)">Prawy rękaw</text>
      </g>
    );
  }

  // neck_label
  return (
    <g>
      <rect x="88" y="132" width="144" height="90" rx="8"
        fill={rib} stroke={s} strokeWidth="1.5" filter="url(#sw-shadow)"
      />
      <rect x="126" y="127" width="68" height="13" rx="4"
        fill={body} stroke={s} strokeWidth="1"
      />
      <text x="160" y="174" textAnchor="middle" fontSize="12" fill="rgba(0,0,0,0.35)">Metka wewnętrzna</text>
      <text x="160" y="192" textAnchor="middle" fontSize="10" fill="rgba(0,0,0,0.25)">obszar nadruku</text>
    </g>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function GadgetCreatorScreen() {
  const router = useRouter();

  const [mode,       setMode]       = useState<"edit" | "preview">("edit");
  const [surface,    setSurface]    = useState<Surface>("front");
  const [surfaces,   setSurfaces]   = useState<AllSurfaces>(emptyAll);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom,       setZoom]       = useState(100);
  const [panel,      setPanel]      = useState<"none" | "library">("none");
  const [library,    setLibrary]    = useState<LibraryItem[]>([]);
  const [saved,      setSaved]      = useState(false);

  // History (undo/redo)
  const histStack = useRef<AllSurfaces[]>([emptyAll()]);
  const histIdx   = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Text dialog
  const [textDlg, setTextDlg] = useState<{
    draft: string; fontSize: number; color: string; bold: boolean; editingId: string | null;
  } | null>(null);

  // SVG drag/resize refs
  const svgRef     = useRef<SVGSVGElement>(null);
  const dragging   = useRef<{ id: string; ox: number; oy: number; mx: number; my: number } | null>(null);
  const resizing   = useRef<{ id: string; mx: number; my: number; sw: number; sh: number } | null>(null);

  // Hidden file input
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Persistence ──
  useEffect(() => {
    try {
      const s = localStorage.getItem(LS_KEY);
      if (s) {
        const parsed = { ...emptyAll(), ...JSON.parse(s) };
        setSurfaces(parsed);
        histStack.current = [parsed];
      }
      const l = localStorage.getItem(LS_LIB_KEY);
      if (l) setLibrary(JSON.parse(l));
    } catch { /* ignore */ }
  }, []);

  function persistSurfaces(s: AllSurfaces) {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  }

  // ── History ──
  function pushHistory(next: AllSurfaces) {
    histStack.current = histStack.current.slice(0, histIdx.current + 1);
    histStack.current.push(next);
    histIdx.current = histStack.current.length - 1;
    setCanUndo(histIdx.current > 0);
    setCanRedo(false);
    setSurfaces(next);
    persistSurfaces(next);
  }

  const undo = useCallback(() => {
    if (histIdx.current > 0) {
      histIdx.current--;
      const prev = histStack.current[histIdx.current];
      setSurfaces(prev);
      setCanUndo(histIdx.current > 0);
      setCanRedo(true);
    }
  }, []);

  const redo = useCallback(() => {
    if (histIdx.current < histStack.current.length - 1) {
      histIdx.current++;
      const next = histStack.current[histIdx.current];
      setSurfaces(next);
      setCanUndo(true);
      setCanRedo(histIdx.current < histStack.current.length - 1);
    }
  }, []);

  // ── Current elements ──
  const elements = surfaces[surface] ?? [];

  function updateElements(els: DesignElement[]) {
    pushHistory({ ...surfaces, [surface]: els });
  }

  // ── SVG coordinate helper ──
  function svgScale() {
    const svg = svgRef.current;
    if (!svg) return { sx: 1, sy: 1 };
    const r = svg.getBoundingClientRect();
    return { sx: 320 / r.width, sy: 420 / r.height };
  }

  // ── Drag/resize mouse handlers ──
  function onElMouseDown(e: React.MouseEvent, el: DesignElement) {
    if (mode !== "edit") return;
    e.stopPropagation();
    setSelectedId(el.id);
    dragging.current = { id: el.id, ox: el.x, oy: el.y, mx: e.clientX, my: e.clientY };
  }

  function onResizeMouseDown(e: React.MouseEvent, el: DesignElement) {
    if (mode !== "edit") return;
    e.stopPropagation();
    e.preventDefault();
    resizing.current = { id: el.id, mx: e.clientX, my: e.clientY, sw: el.w, sh: el.h };
  }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const { sx, sy } = svgScale();

      if (dragging.current) {
        const dx = (e.clientX - dragging.current.mx) * sx;
        const dy = (e.clientY - dragging.current.my) * sy;
        const z  = ZONES[surface];
        setSurfaces(prev => ({
          ...prev,
          [surface]: prev[surface].map(el => {
            if (el.id !== dragging.current!.id) return el;
            const nx = Math.max(z.cx - z.w / 2, Math.min(z.cx + z.w / 2 - el.w, dragging.current!.ox + dx));
            const ny = Math.max(z.cy - z.h / 2, Math.min(z.cy + z.h / 2 - el.h, dragging.current!.oy + dy));
            return { ...el, x: nx, y: ny };
          }),
        }));
      }

      if (resizing.current) {
        const dx = (e.clientX - resizing.current.mx) * sx;
        const dy = (e.clientY - resizing.current.my) * sy;
        setSurfaces(prev => ({
          ...prev,
          [surface]: prev[surface].map(el =>
            el.id !== resizing.current!.id ? el : {
              ...el,
              w: Math.max(18, resizing.current!.sw + dx),
              h: Math.max(12, resizing.current!.sh + dy),
            }
          ),
        }));
      }
    }

    function onUp() {
      if (dragging.current || resizing.current) {
        setSurfaces(cur => {
          persistSurfaces(cur);
          // commit to history
          histStack.current = histStack.current.slice(0, histIdx.current + 1);
          histStack.current.push(cur);
          histIdx.current = histStack.current.length - 1;
          setCanUndo(true);
          setCanRedo(false);
          return cur;
        });
      }
      dragging.current = null;
      resizing.current = null;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [surface]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (textDlg) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        updateElements(elements.filter(el => el.id !== selectedId));
        setSelectedId(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) undo();
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) redo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, elements, textDlg, undo, redo]);

  // ── Upload ──
  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target?.result as string;
      const libItem: LibraryItem = { id: `lib-${Date.now()}`, src, name: file.name };
      const newLib = [...library, libItem];
      setLibrary(newLib);
      localStorage.setItem(LS_LIB_KEY, JSON.stringify(newLib));
      addImageToCanvas(src, file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function addImageToCanvas(src: string, name: string) {
    const z = ZONES[surface];
    const el: ImageElement = {
      id: `el-${Date.now()}`, type: "image",
      x: z.cx - z.w / 4, y: z.cy - z.h / 4,
      w: z.w / 2,         h: z.h / 2,
      src, name,
    };
    updateElements([...elements, el]);
    setSelectedId(el.id);
  }

  // ── Add text confirm ──
  function confirmText() {
    if (!textDlg) return;
    const z = ZONES[surface];
    if (textDlg.editingId) {
      updateElements(elements.map(el =>
        el.id !== textDlg.editingId ? el : {
          ...el,
          text: textDlg.draft,
          fontSize: textDlg.fontSize,
          color: textDlg.color,
          bold: textDlg.bold,
          h: textDlg.fontSize * 1.5,
        } as TextElement
      ));
    } else {
      const el: TextElement = {
        id: `el-${Date.now()}`, type: "text",
        x: z.cx - z.w / 4,     y: z.cy - textDlg.fontSize,
        w: z.w / 2,             h: textDlg.fontSize * 1.5,
        text: textDlg.draft, fontSize: textDlg.fontSize,
        color: textDlg.color, bold: textDlg.bold,
      };
      updateElements([...elements, el]);
      setSelectedId(el.id);
    }
    setTextDlg(null);
  }

  // ── Save ──
  function handleSave() {
    persistSurfaces(surfaces);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  const zone     = ZONES[surface];
  const canvasW  = Math.round(320 * zoom / 100);
  const canvasH  = Math.round(420 * zoom / 100);

  return (
    <div className="flex h-screen flex-col bg-[#eae7e0] overflow-hidden" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      {/* ── Top bar ── */}
      <header className="flex items-center gap-2 bg-white border-b border-gray-200 px-4 h-12 shrink-0 z-20">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 transition text-gray-600"
          title="Wróć"
        >
          <ArrowLeft size={17} />
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 transition text-gray-500"
          title="Informacje"
        >
          <Info size={17} />
        </button>
        <div className="h-5 w-px bg-gray-200 mx-1" />
        <button
          onClick={undo}
          disabled={!canUndo}
          title="Cofnij (Ctrl+Z)"
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 transition text-gray-500 disabled:opacity-30"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="Ponów (Ctrl+Y)"
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 transition text-gray-500 disabled:opacity-30"
        >
          <Redo2 size={16} />
        </button>

        <div className="flex-1" />

        {/* Client assignment */}
        <div className="w-56 mr-3">
          <ClientSelector storeKey="gadget-creator-client" label="Klient" />
        </div>

        {/* Edit / Preview */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button
            onClick={() => setMode("edit")}
            className={cn(
              "px-4 py-1.5 font-medium transition",
              mode === "edit" ? "bg-[#5c5144] text-white" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            Edycja
          </button>
          <button
            onClick={() => { setMode("preview"); setSelectedId(null); }}
            className={cn(
              "px-4 py-1.5 font-medium transition",
              mode === "preview" ? "bg-[#5c5144] text-white" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            Podgląd
          </button>
        </div>

        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 transition text-gray-400 ml-1"
          title="Zamknij"
        >
          <X size={17} />
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left toolbar */}
        <aside className="flex flex-col items-center gap-0.5 bg-white border-r border-gray-200 w-[64px] py-3 shrink-0 z-10">
          <ToolBtn
            icon={<Upload size={19} />}
            label="Prześlij"
            active={false}
            onClick={() => fileRef.current?.click()}
          />
          <ToolBtn
            icon={<Type size={19} />}
            label="Dodaj tekst"
            active={false}
            onClick={() => setTextDlg({ draft: "Twój tekst", fontSize: 16, color: "#1a1a1a", bold: false, editingId: null })}
          />
          <ToolBtn
            icon={<BookImage size={19} />}
            label="Moja biblioteka"
            active={panel === "library"}
            onClick={() => setPanel(p => p === "library" ? "none" : "library")}
          />
        </aside>

        {/* Library panel */}
        {panel === "library" && (
          <div className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0 z-10">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800">Moja biblioteka</span>
              <button onClick={() => setPanel("none")} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {library.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                  <BookImage size={28} className="text-gray-300" />
                  <p className="text-xs text-gray-400 leading-relaxed">Brak obrazów.<br />Prześlij grafikę,<br />aby ją tu zobaczyć.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {library.map(item => (
                    <button
                      key={item.id}
                      title={item.name}
                      onClick={() => { addImageToCanvas(item.src, item.name); setPanel("none"); }}
                      className="aspect-square rounded-lg border border-gray-200 overflow-hidden hover:border-[#5c5144] hover:shadow-sm transition"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.src} alt={item.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 p-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500 hover:border-[#5c5144] hover:text-[#5c5144] transition"
              >
                <Upload size={13} />
                Prześlij nowy
              </button>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div
          className="flex-1 flex items-center justify-center overflow-auto"
          onClick={() => mode === "edit" && setSelectedId(null)}
        >
          <div style={{ width: canvasW, height: canvasH }} className="relative shrink-0">
            <svg
              ref={svgRef}
              viewBox="0 0 320 420"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
              style={{ userSelect: "none" }}
            >
              <defs>
                <filter id="sw-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="5" stdDeviation="9" floodColor="rgba(0,0,0,0.11)" />
                </filter>
                <linearGradient id="sw-shade" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"   stopColor="rgba(255,255,255,0.09)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
                </linearGradient>
              </defs>

              {/* Garment */}
              <ProductShape surface={surface} />

              {/* Print zone (edit mode only) */}
              {mode === "edit" && (
                <rect
                  x={zone.cx - zone.w / 2} y={zone.cy - zone.h / 2}
                  width={zone.w} height={zone.h}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1.3"
                  strokeDasharray="7,4"
                  rx="3"
                />
              )}

              {/* Design elements */}
              {elements.map(el => {
                const sel = el.id === selectedId && mode === "edit";
                return (
                  <g key={el.id}>
                    {/* Selection halo */}
                    {sel && (
                      <rect
                        x={el.x - 3} y={el.y - 3}
                        width={el.w + 6} height={el.h + 6}
                        fill="rgba(99,102,241,0.07)"
                        stroke="#6366f1"
                        strokeWidth="1.2"
                        strokeDasharray="4,3"
                        rx="3"
                        style={{ pointerEvents: "none" }}
                      />
                    )}

                    {/* Content */}
                    {el.type === "text" ? (
                      <text
                        x={el.x + el.w / 2}
                        y={el.y + (el as TextElement).fontSize}
                        textAnchor="middle"
                        fontSize={(el as TextElement).fontSize}
                        fill={(el as TextElement).color}
                        fontWeight={(el as TextElement).bold ? "bold" : "normal"}
                        style={{ cursor: mode === "edit" ? "move" : "default", userSelect: "none" }}
                        onMouseDown={e => onElMouseDown(e, el)}
                        onDoubleClick={() => {
                          if (mode !== "edit") return;
                          const t = el as TextElement;
                          setTextDlg({ draft: t.text, fontSize: t.fontSize, color: t.color, bold: t.bold, editingId: el.id });
                        }}
                      >
                        {(el as TextElement).text}
                      </text>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <image
                        href={(el as ImageElement).src}
                        x={el.x} y={el.y}
                        width={el.w} height={el.h}
                        preserveAspectRatio="xMidYMid meet"
                        style={{ cursor: mode === "edit" ? "move" : "default" }}
                        onMouseDown={e => onElMouseDown(e, el)}
                      />
                    )}

                    {/* Transparent drag overlay */}
                    {mode === "edit" && (
                      <rect
                        x={el.x} y={el.y} width={el.w} height={el.h}
                        fill="transparent"
                        style={{ cursor: "move" }}
                        onMouseDown={e => onElMouseDown(e, el)}
                      />
                    )}

                    {/* Resize handle */}
                    {sel && (
                      <rect
                        x={el.x + el.w - 6} y={el.y + el.h - 6}
                        width={12} height={12}
                        fill="#6366f1" rx="3"
                        style={{ cursor: "se-resize" }}
                        onMouseDown={e => onResizeMouseDown(e, el)}
                      />
                    )}

                    {/* Delete button */}
                    {sel && (
                      <g
                        transform={`translate(${el.x + el.w + 2}, ${el.y - 10})`}
                        style={{ cursor: "pointer" }}
                        onClick={e => {
                          e.stopPropagation();
                          updateElements(elements.filter(x => x.id !== el.id));
                          setSelectedId(null);
                        }}
                      >
                        <circle r="8" fill="#ef4444" />
                        <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="white" strokeWidth="1.6" />
                        <line x1="3.5"  y1="-3.5" x2="-3.5" y2="3.5" stroke="white" strokeWidth="1.6" />
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="flex items-center justify-between bg-white border-t border-gray-200 px-5 h-13 py-2 shrink-0 z-10">
        {/* Zoom */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom(z => Math.max(30, z - 10))}
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
          >
            <Minus size={13} />
          </button>
          <span className="text-xs font-medium text-gray-600 w-10 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom(z => Math.min(200, z + 10))}
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
          >
            <Plus size={13} />
          </button>
          <button
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 transition ml-1"
            title="Tryb przesuwania"
          >
            <Hand size={13} />
          </button>
        </div>

        {/* Surface tabs */}
        <div className="flex items-center gap-1">
          {SURFACES.map(s => (
            <button
              key={s.id}
              onClick={() => { setSurface(s.id); setSelectedId(null); }}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-sm font-medium transition",
                surface === s.id
                  ? "bg-[#5c5144] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition",
            saved
              ? "bg-green-600 text-white"
              : "bg-[#5c5144] hover:bg-[#4a4234] text-white"
          )}
        >
          <Save size={14} />
          {saved ? "Zapisano!" : "Zapisz produkt"}
        </button>
      </div>

      {/* ── Text dialog ── */}
      {textDlg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setTextDlg(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-96"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-900 mb-5">
              {textDlg.editingId ? "Edytuj tekst" : "Dodaj tekst"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Treść</label>
                <input
                  autoFocus
                  value={textDlg.draft}
                  onChange={e => setTextDlg({ ...textDlg, draft: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && confirmText()}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#5c5144] focus:ring-1 focus:ring-[#5c5144]"
                  placeholder="Wpisz tekst…"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Rozmiar (px)</label>
                  <input
                    type="number" min={6} max={80}
                    value={textDlg.fontSize}
                    onChange={e => setTextDlg({ ...textDlg, fontSize: Math.max(6, Math.min(80, parseInt(e.target.value) || 16)) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#5c5144]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Kolor</label>
                  <input
                    type="color"
                    value={textDlg.color}
                    onChange={e => setTextDlg({ ...textDlg, color: e.target.value })}
                    className="h-[42px] w-16 rounded-lg border border-gray-300 p-1 cursor-pointer"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={textDlg.bold}
                  onChange={e => setTextDlg({ ...textDlg, bold: e.target.checked })}
                  className="h-4 w-4 accent-[#5c5144]"
                />
                <span className="text-sm text-gray-700">Pogrubienie</span>
              </label>

              {/* Preview */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 py-4 flex items-center justify-center min-h-[56px]">
                <span
                  style={{
                    fontSize: Math.min(textDlg.fontSize, 36),
                    color: textDlg.color,
                    fontWeight: textDlg.bold ? "bold" : "normal",
                  }}
                >
                  {textDlg.draft || <span className="text-gray-300 text-sm">podgląd tekstu</span>}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setTextDlg(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Anuluj
              </button>
              <button
                onClick={confirmText}
                className="flex-1 rounded-lg bg-[#5c5144] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#4a4234] transition"
              >
                {textDlg.editingId ? "Zapisz" : "Dodaj"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tool button ──────────────────────────────────────────────────────────────

function ToolBtn({
  icon, label, onClick, active,
}: {
  icon: React.ReactNode; label: string; onClick: () => void; active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-center gap-1 py-3 px-1 transition-colors",
        active
          ? "text-[#5c5144] bg-[#5c5144]/10"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
    </button>
  );
}
