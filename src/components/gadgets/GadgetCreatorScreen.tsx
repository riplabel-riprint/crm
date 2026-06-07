"use client";

import { useState, useRef, useCallback, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Info, Undo2, Redo2, Upload, Type,
  BookImage, X, Minus, Plus, Hand, Save, Check,
  ChevronLeft, Package, ChevronDown, Shirt, Coffee,
} from "lucide-react";
import { ClientSelector } from "@/components/shared/ClientSelector";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductType = "tshirt" | "mug";
type TshirtSurface = "front" | "back" | "sleeve_left" | "sleeve_right" | "neck_label";
type MugSurface = "wrap";
type Surface = TshirtSurface | MugSurface;
type Step = "editor" | "mockup";

interface BaseElement { id: string; x: number; y: number; w: number; h: number; }
interface TextElement extends BaseElement { type: "text"; text: string; fontSize: number; color: string; bold: boolean; }
interface ImageElement extends BaseElement { type: "image"; src: string; name: string; }
type DesignElement = TextElement | ImageElement;
type AllSurfaces = Partial<Record<Surface, DesignElement[]>>;
interface LibraryItem { id: string; src: string; name: string; }

interface ProductConfig {
  id: ProductType;
  label: string;
  surfaces: { id: Surface; label: string }[];
  zones: Partial<Record<Surface, { cx: number; cy: number; w: number; h: number }>>;
  sizes: string[];
  colors: { name: string; hex: string }[];
  mockupViews: { id: string; label: string; surface: Surface }[];
}

// ─── Product configs ──────────────────────────────────────────────────────────

const TSHIRT_COLORS = [
  { name: "Biały",     hex: "#f5f2ec" },
  { name: "Czarny",    hex: "#1a1a1a" },
  { name: "Granatowy", hex: "#1e2f5e" },
  { name: "Szary",     hex: "#9ca3af" },
  { name: "Czerwony",  hex: "#dc2626" },
  { name: "Zielony",   hex: "#16a34a" },
  { name: "Żółty",     hex: "#ca8a04" },
  { name: "Niebieski", hex: "#2563eb" },
  { name: "Różowy",    hex: "#db2777" },
  { name: "Fioletowy", hex: "#7c3aed" },
];

const MUG_COLORS = [
  { name: "Biały",   hex: "#ffffff" },
  { name: "Czarny",  hex: "#1a1a1a" },
  { name: "Czerwony",hex: "#dc2626" },
  { name: "Granatowy",hex: "#1e2f5e" },
  { name: "Zielony", hex: "#16a34a" },
];

const PRODUCTS: ProductConfig[] = [
  {
    id: "tshirt",
    label: "Koszulka",
    surfaces: [
      { id: "front",        label: "Przód" },
      { id: "back",         label: "Tył" },
      { id: "sleeve_left",  label: "Lewy rękaw" },
      { id: "sleeve_right", label: "Prawy rękaw" },
      { id: "neck_label",   label: "Wewnętrzna metka" },
    ],
    zones: {
      front:        { cx: 160, cy: 248, w: 150, h: 160 },
      back:         { cx: 160, cy: 248, w: 150, h: 160 },
      sleeve_left:  { cx: 65,  cy: 150, w: 52,  h: 72 },
      sleeve_right: { cx: 255, cy: 150, w: 52,  h: 72 },
      neck_label:   { cx: 160, cy: 168, w: 88,  h: 48 },
    },
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
    colors: TSHIRT_COLORS,
    mockupViews: [
      { id: "front",    label: "Przód",   surface: "front" },
      { id: "back",     label: "Tył",     surface: "back" },
      { id: "front2",   label: "Przód 2", surface: "front" },
      { id: "back2",    label: "Tył 2",   surface: "back" },
      { id: "sleeve_l", label: "Rękaw L", surface: "sleeve_left" },
      { id: "sleeve_r", label: "Rękaw P", surface: "sleeve_right" },
      { id: "neck",     label: "Metka",   surface: "neck_label" },
    ],
  },
  {
    id: "mug",
    label: "Kubek",
    surfaces: [
      { id: "wrap", label: "Nadruk" },
    ],
    zones: {
      wrap: { cx: 160, cy: 220, w: 210, h: 160 },
    },
    sizes: ["11oz", "15oz"],
    colors: MUG_COLORS,
    mockupViews: [
      { id: "front", label: "Przód", surface: "wrap" },
      { id: "side",  label: "Bok",   surface: "wrap" },
      { id: "back",  label: "Tył",   surface: "wrap" },
    ],
  },
];

function emptyAll(): AllSurfaces {
  return {};
}

const LS_KEY     = "riprint-gadget-v2";
const LS_LIB_KEY = "riprint-gadget-lib-v1";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function blendColor(hex: string, factor: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
  } catch { return hex; }
}

function isDark(hex: string) {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  } catch { return false; }
}

// ─── SVG Shapes ───────────────────────────────────────────────────────────────

function TshirtShape({ surface, bodyColor = "#f5f2ec" }: { surface: Surface; bodyColor?: string }) {
  const rib = blendColor(bodyColor, 0.85);
  const s   = "rgba(0,0,0,0.13)";

  if (surface === "front" || surface === "back") {
    return (
      <g>
        <path d="M 108,28 Q 160,6 212,28 L 294,66 L 308,152 L 258,163 L 258,398 L 62,398 L 62,163 L 12,152 L 26,66 Z"
          fill={bodyColor} stroke={s} strokeWidth="1.8" filter="url(#sw-shadow)" />
        <path d="M 108,28 Q 160,6 212,28 L 294,66 L 308,152 L 258,163 L 258,398 L 62,398 L 62,163 L 12,152 L 26,66 Z"
          fill="url(#sw-shade)" />
        <ellipse cx="160" cy="38" rx="44" ry="23" fill={rib} stroke={s} strokeWidth="1.2" />
        <ellipse cx="160" cy="36" rx="35" ry="16" fill={bodyColor} stroke={s} strokeWidth="0.8" />
        <line x1="62"  y1="163" x2="62"  y2="398" stroke={s} strokeWidth="0.8" />
        <line x1="258" y1="163" x2="258" y2="398" stroke={s} strokeWidth="0.8" />
        <rect x="12"  y="143" width="50" height="14" rx="4" fill={rib} stroke={s} strokeWidth="1" />
        <rect x="258" y="143" width="50" height="14" rx="4" fill={rib} stroke={s} strokeWidth="1" />
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
        <path d="M 100,82 L 28,105 L 18,208 L 80,220 L 118,220 L 122,82 Z"
          fill={bodyColor} stroke={s} strokeWidth="1.5" filter="url(#sw-shadow)" />
        <rect x="18" y="204" width="100" height="16" rx="4" fill={blendColor(bodyColor, 0.85)} stroke={s} strokeWidth="1" />
        <text x="160" y="320" textAnchor="middle" fontSize="12" fill="rgba(0,0,0,0.22)">Lewy rękaw</text>
      </g>
    );
  }

  if (surface === "sleeve_right") {
    return (
      <g>
        <path d="M 220,82 L 292,105 L 302,208 L 240,220 L 202,220 L 198,82 Z"
          fill={bodyColor} stroke={s} strokeWidth="1.5" filter="url(#sw-shadow)" />
        <rect x="202" y="204" width="100" height="16" rx="4" fill={blendColor(bodyColor, 0.85)} stroke={s} strokeWidth="1" />
        <text x="160" y="320" textAnchor="middle" fontSize="12" fill="rgba(0,0,0,0.22)">Prawy rękaw</text>
      </g>
    );
  }

  // neck_label
  return (
    <g>
      <rect x="88" y="132" width="144" height="90" rx="8"
        fill={blendColor(bodyColor, 0.85)} stroke={s} strokeWidth="1.5" filter="url(#sw-shadow)" />
      <rect x="126" y="127" width="68" height="13" rx="4" fill={bodyColor} stroke={s} strokeWidth="1" />
      <text x="160" y="174" textAnchor="middle" fontSize="12" fill="rgba(0,0,0,0.35)">Metka wewnętrzna</text>
      <text x="160" y="192" textAnchor="middle" fontSize="10" fill="rgba(0,0,0,0.25)">obszar nadruku</text>
    </g>
  );
}

function MugShape({ bodyColor = "#ffffff" }: { bodyColor?: string }) {
  const s    = "rgba(0,0,0,0.12)";
  const dark = isDark(bodyColor);
  const rim  = blendColor(bodyColor, dark ? 1.3 : 0.88);
  const shine= dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)";

  return (
    <g>
      {/* Body */}
      <rect x="55" y="88" width="210" height="244" rx="14"
        fill={bodyColor} stroke={s} strokeWidth="1.8" filter="url(#sw-shadow)" />
      {/* Shine */}
      <rect x="68" y="98" width="40" height="120" rx="8" fill={shine} />
      {/* Handle */}
      <path d="M 265,148 C 310,148 310,232 265,232"
        fill="none" stroke={bodyColor} strokeWidth="28" />
      <path d="M 265,148 C 310,148 310,232 265,232"
        fill="none" stroke={s} strokeWidth="28" opacity="0.18" />
      <path d="M 265,155 C 298,155 298,225 265,225"
        fill="none" stroke={bodyColor} strokeWidth="14" />
      {/* Rim */}
      <ellipse cx="160" cy="88" rx="105" ry="12" fill={rim} stroke={s} strokeWidth="1.2" />
      {/* Bottom */}
      <ellipse cx="160" cy="332" rx="105" ry="10" fill={rim} stroke={s} strokeWidth="1.2" />
    </g>
  );
}

function ProductShape({ productType, surface, bodyColor }: { productType: ProductType; surface: Surface; bodyColor?: string }) {
  if (productType === "mug") return <MugShape bodyColor={bodyColor} />;
  return <TshirtShape surface={surface} bodyColor={bodyColor} />;
}

// ─── SVG defs block ───────────────────────────────────────────────────────────

function SvgDefs() {
  return (
    <defs>
      <filter id="sw-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="5" stdDeviation="9" floodColor="rgba(0,0,0,0.11)" />
      </filter>
      <linearGradient id="sw-shade" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.09)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
      </linearGradient>
    </defs>
  );
}

// ─── Mini mockup thumbnail ────────────────────────────────────────────────────

function MiniMockup({ productType, surface, elements, bodyColor, selected, onClick }: {
  productType: ProductType; surface: Surface; elements: DesignElement[];
  bodyColor: string; selected?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "aspect-square rounded-xl border-2 overflow-hidden bg-[#f0ede6] flex items-center justify-center transition",
        selected ? "border-[#5c5144] shadow-md" : "border-transparent hover:border-gray-300"
      )}
    >
      <svg viewBox="0 0 320 420" className="w-full h-full p-2">
        <SvgDefs />
        <ProductShape productType={productType} surface={surface} bodyColor={bodyColor} />
        {elements.map(el =>
          el.type === "text" ? (
            <text key={el.id} x={el.x + el.w / 2} y={el.y + (el as TextElement).fontSize}
              textAnchor="middle" fontSize={(el as TextElement).fontSize}
              fill={(el as TextElement).color} fontWeight={(el as TextElement).bold ? "bold" : "normal"}>
              {(el as TextElement).text}
            </text>
          ) : (
            <image key={el.id} href={(el as ImageElement).src}
              x={el.x} y={el.y} width={el.w} height={el.h} preserveAspectRatio="xMidYMid meet" />
          )
        )}
      </svg>
    </button>
  );
}

// ─── Photo Mockup Cards (Printify-style) ──────────────────────────────────────

type MockupSceneType = "studio_front" | "flatlay" | "studio_back";

interface PhotoMockupCardProps {
  scene: MockupSceneType;
  label: string;
  sublabel: string;
  elements: DesignElement[];
  bodyColor: string;
  surface: Surface;
  isBack?: boolean;
}

function PhotoMockupCard({ scene, label, sublabel, elements, bodyColor, surface, isBack }: PhotoMockupCardProps) {
  const dark = isDark(bodyColor);

  const bgGradient: Record<MockupSceneType, string> = {
    studio_front: "linear-gradient(145deg, #e8e2d9 0%, #d4cfc6 40%, #c8c2b8 100%)",
    flatlay:      "linear-gradient(160deg, #f0ece4 0%, #e2ddd6 50%, #d5d0c8 100%)",
    studio_back:  "linear-gradient(135deg, #ddd8d0 0%, #ccc7be 40%, #bfbab1 100%)",
  };

  return (
    <div className="flex flex-col gap-2 group">
      <div
        className="relative rounded-2xl overflow-hidden aspect-[3/4] w-full"
        style={{ background: bgGradient[scene] }}
      >
        {/* Noise texture overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none" style={{ mixBlendMode: "multiply" }}>
          <filter id={`noise-${scene}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#noise-${scene})`} />
        </svg>

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.18) 100%)" }} />

        {/* Scene-specific background elements */}
        {scene === "studio_front" && (
          <svg viewBox="0 0 300 400" className="absolute inset-0 w-full h-full">
            {/* Studio floor line */}
            <ellipse cx="150" cy="370" rx="130" ry="18" fill="rgba(0,0,0,0.06)" />
            {/* Subtle backdrop fold */}
            <line x1="0" y1="280" x2="300" y2="275" stroke="rgba(0,0,0,0.04)" strokeWidth="60" />
          </svg>
        )}

        {scene === "flatlay" && (
          <svg viewBox="0 0 300 400" className="absolute inset-0 w-full h-full">
            {/* Surface texture lines */}
            <line x1="0" y1="0" x2="300" y2="400" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <line x1="60" y1="0" x2="300" y2="320" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <line x1="0" y1="80" x2="240" y2="400" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            {/* Shadow beneath shirt */}
            <ellipse cx="150" cy="320" rx="100" ry="16" fill="rgba(0,0,0,0.08)" />
          </svg>
        )}

        {scene === "studio_back" && (
          <svg viewBox="0 0 300 400" className="absolute inset-0 w-full h-full">
            <ellipse cx="150" cy="370" rx="125" ry="16" fill="rgba(0,0,0,0.07)" />
            <rect x="0" y="290" width="300" height="120" fill="rgba(0,0,0,0.03)" />
          </svg>
        )}

        {/* Person silhouette for studio shots */}
        {(scene === "studio_front" || scene === "studio_back") && (
          <svg viewBox="0 0 300 400" className="absolute inset-0 w-full h-full opacity-[0.55]">
            <defs>
              <linearGradient id={`person-grad-${scene}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(160,150,140,0.0)" />
                <stop offset="40%" stopColor="rgba(140,130,120,0.08)" />
                <stop offset="100%" stopColor="rgba(100,90,80,0.18)" />
              </linearGradient>
            </defs>
            {/* Neck */}
            <rect x="133" y="48" width="34" height="36" rx="14" fill={`url(#person-grad-${scene})`} />
            {/* Shoulders */}
            <path d="M 60,80 Q 90,70 150,68 Q 210,70 240,80 L 258,120 L 42,120 Z"
              fill={`url(#person-grad-${scene})`} opacity="0.6" />
            {/* Arms */}
            <path d="M 42,120 L 18,230 Q 16,248 28,252 L 58,252 Q 70,250 68,236 L 58,152 Z"
              fill={`url(#person-grad-${scene})`} opacity="0.4" />
            <path d="M 258,120 L 282,230 Q 284,248 272,252 L 242,252 Q 230,250 232,236 L 242,152 Z"
              fill={`url(#person-grad-${scene})`} opacity="0.4" />
          </svg>
        )}

        {/* T-shirt SVG */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          scene === "flatlay" ? "rotate-[3deg]" : ""
        )}>
          <svg
            viewBox="0 0 320 420"
            className={cn(
              "drop-shadow-2xl",
              scene === "flatlay" ? "w-[88%]" : "w-[82%]"
            )}
            style={{ filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.22)) drop-shadow(0 4px 8px rgba(0,0,0,0.12))" }}
          >
            <SvgDefs />
            <TshirtShape surface={isBack ? "back" : "front"} bodyColor={bodyColor} />
            {elements.map(el =>
              el.type === "text" ? (
                <text key={el.id} x={el.x + el.w / 2} y={el.y + (el as TextElement).fontSize}
                  textAnchor="middle" fontSize={(el as TextElement).fontSize}
                  fill={(el as TextElement).color} fontWeight={(el as TextElement).bold ? "bold" : "normal"}>
                  {(el as TextElement).text}
                </text>
              ) : (
                <image key={el.id} href={(el as ImageElement).src}
                  x={el.x} y={el.y} width={el.w} height={el.h} preserveAspectRatio="xMidYMid meet" />
              )
            )}
          </svg>
        </div>

        {/* Print area badge */}
        {elements.length > 0 && (
          <div className="absolute top-3 left-3">
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[9px] font-semibold text-gray-700 uppercase tracking-wide">Nadruk</span>
            </div>
          </div>
        )}

        {/* Scene label badge */}
        <div className="absolute bottom-3 right-3">
          <div className="bg-black/30 backdrop-blur-md rounded-lg px-2.5 py-1">
            <span className="text-[10px] font-medium text-white/90 uppercase tracking-widest">{sublabel}</span>
          </div>
        </div>
      </div>

      {/* Card label */}
      <div className="px-0.5">
        <p className="text-xs font-semibold text-gray-800">{label}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}

// ─── Product picker modal ─────────────────────────────────────────────────────

function ProductPickerModal({ current, onSelect, onClose }: {
  current: ProductType; onSelect: (p: ProductType) => void; onClose: () => void;
}) {
  const items: { id: ProductType; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: "tshirt", label: "Koszulka", desc: "Nadruk na 5 powierzchniach — przód, tył, rękawy, metka", icon: <Shirt size={28} /> },
    { id: "mug",    label: "Kubek",    desc: "Nadruk dookoła kubka, dostępny w 11oz i 15oz",            icon: <Coffee size={28} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[480px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-gray-900">Wybierz produkt</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => { onSelect(item.id); onClose(); }}
              className={cn(
                "flex flex-col items-center gap-3 p-5 rounded-xl border-2 text-left transition",
                current === item.id
                  ? "border-[#5c5144] bg-[#5c5144]/5"
                  : "border-gray-200 hover:border-[#5c5144]/40 hover:bg-gray-50"
              )}
            >
              <div className={cn(
                "flex h-14 w-14 items-center justify-center rounded-xl",
                current === item.id ? "bg-[#5c5144] text-white" : "bg-gray-100 text-gray-600"
              )}>
                {item.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
              {current === item.id && (
                <div className="absolute top-3 right-3">
                  <Check size={14} className="text-[#5c5144]" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function GadgetCreatorScreen() {
  const router = useRouter();

  const [step,         setStep]         = useState<Step>("editor");
  const [productType,  setProductType]  = useState<ProductType>("tshirt");
  const [showPicker,   setShowPicker]   = useState(false);
  const [mode,         setMode]         = useState<"edit" | "preview">("edit");
  const [surface,      setSurface]      = useState<Surface>("front");
  const [surfaces,     setSurfaces]     = useState<AllSurfaces>({});
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [zoom,         setZoom]         = useState(100);
  const [panel,        setPanel]        = useState<"none" | "library">("none");
  const [library,      setLibrary]      = useState<LibraryItem[]>([]);
  const [clientError,  setClientError]  = useState(false);

  // Mockup state
  const [shirtColor,    setShirtColor]    = useState(TSHIRT_COLORS[0]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [mockupView,    setMockupView]    = useState(PRODUCTS[0].mockupViews[0]);
  const [orderSaved,    setOrderSaved]    = useState(false);

  const histStack = useRef<AllSurfaces[]>([{}]);
  const histIdx   = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [textDlg, setTextDlg] = useState<{
    draft: string; fontSize: number; color: string; bold: boolean; editingId: string | null;
  } | null>(null);

  const svgRef   = useRef<SVGSVGElement>(null);
  const dragging = useRef<{ id: string; ox: number; oy: number; mx: number; my: number } | null>(null);
  const resizing = useRef<{ id: string; mx: number; my: number; sw: number; sh: number } | null>(null);
  const fileRef  = useRef<HTMLInputElement>(null);

  const product = PRODUCTS.find(p => p.id === productType)!;

  // Sync surface when switching product
  function switchProduct(pt: ProductType) {
    const cfg = PRODUCTS.find(p => p.id === pt)!;
    setProductType(pt);
    setSurfaces({});
    histStack.current = [{}];
    histIdx.current = 0;
    setCanUndo(false);
    setCanRedo(false);
    setSelectedId(null);
    setSurface(cfg.surfaces[0].id);
    setMockupView(cfg.mockupViews[0]);
    setShirtColor(cfg.colors[0]);
    setSelectedSizes([]);
  }

  useEffect(() => {
    try {
      const l = localStorage.getItem(LS_LIB_KEY);
      if (l) setLibrary(JSON.parse(l));
    } catch { /* ignore */ }
  }, []);

  function persistSurfaces(s: AllSurfaces) {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  }

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
      setSurfaces(histStack.current[histIdx.current]);
      setCanUndo(histIdx.current > 0);
      setCanRedo(true);
    }
  }, []);

  const redo = useCallback(() => {
    if (histIdx.current < histStack.current.length - 1) {
      histIdx.current++;
      setSurfaces(histStack.current[histIdx.current]);
      setCanUndo(true);
      setCanRedo(histIdx.current < histStack.current.length - 1);
    }
  }, []);

  const elements = surfaces[surface] ?? [];

  function updateElements(els: DesignElement[]) {
    pushHistory({ ...surfaces, [surface]: els });
  }

  function svgScale() {
    const svg = svgRef.current;
    if (!svg) return { sx: 1, sy: 1 };
    const r = svg.getBoundingClientRect();
    return { sx: 320 / r.width, sy: 420 / r.height };
  }

  function onElMouseDown(e: React.MouseEvent, el: DesignElement) {
    if (mode !== "edit") return;
    e.stopPropagation();
    setSelectedId(el.id);
    dragging.current = { id: el.id, ox: el.x, oy: el.y, mx: e.clientX, my: e.clientY };
  }

  function onResizeMouseDown(e: React.MouseEvent, el: DesignElement) {
    if (mode !== "edit") return;
    e.stopPropagation(); e.preventDefault();
    resizing.current = { id: el.id, mx: e.clientX, my: e.clientY, sw: el.w, sh: el.h };
  }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const { sx, sy } = svgScale();
      const zone = product.zones[surface];
      if (!zone) return;

      if (dragging.current) {
        const dx = (e.clientX - dragging.current.mx) * sx;
        const dy = (e.clientY - dragging.current.my) * sy;
        setSurfaces(prev => ({
          ...prev,
          [surface]: (prev[surface] ?? []).map(el => {
            if (el.id !== dragging.current!.id) return el;
            const nx = Math.max(zone.cx - zone.w / 2, Math.min(zone.cx + zone.w / 2 - el.w, dragging.current!.ox + dx));
            const ny = Math.max(zone.cy - zone.h / 2, Math.min(zone.cy + zone.h / 2 - el.h, dragging.current!.oy + dy));
            return { ...el, x: nx, y: ny };
          }),
        }));
      }
      if (resizing.current) {
        const dx = (e.clientX - resizing.current.mx) * sx;
        const dy = (e.clientY - resizing.current.my) * sy;
        setSurfaces(prev => ({
          ...prev,
          [surface]: (prev[surface] ?? []).map(el =>
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
          histStack.current = histStack.current.slice(0, histIdx.current + 1);
          histStack.current.push(cur);
          histIdx.current = histStack.current.length - 1;
          setCanUndo(true); setCanRedo(false);
          return cur;
        });
      }
      dragging.current = null;
      resizing.current = null;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [surface, product]);

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
    const zone = product.zones[surface];
    if (!zone) return;
    const el: ImageElement = {
      id: `el-${Date.now()}`, type: "image",
      x: zone.cx - zone.w / 4, y: zone.cy - zone.h / 4,
      w: zone.w / 2,            h: zone.h / 2,
      src, name,
    };
    updateElements([...elements, el]);
    setSelectedId(el.id);
  }

  function confirmText() {
    if (!textDlg) return;
    const zone = product.zones[surface];
    if (!zone) return;
    if (textDlg.editingId) {
      updateElements(elements.map(el =>
        el.id !== textDlg.editingId ? el : {
          ...el, text: textDlg.draft, fontSize: textDlg.fontSize,
          color: textDlg.color, bold: textDlg.bold, h: textDlg.fontSize * 1.5,
        } as TextElement
      ));
    } else {
      const el: TextElement = {
        id: `el-${Date.now()}`, type: "text",
        x: zone.cx - zone.w / 4, y: zone.cy - textDlg.fontSize,
        w: zone.w / 2,            h: textDlg.fontSize * 1.5,
        text: textDlg.draft, fontSize: textDlg.fontSize,
        color: textDlg.color, bold: textDlg.bold,
      };
      updateElements([...elements, el]);
      setSelectedId(el.id);
    }
    setTextDlg(null);
  }

  function handleSave() {
    const client = localStorage.getItem("gadget-creator-client");
    if (!client) {
      setClientError(true);
      setTimeout(() => setClientError(false), 3000);
      return;
    }
    persistSurfaces(surfaces);
    setStep("mockup");
  }

  function toggleSize(s: string) {
    setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function handleFinalSave() {
    setOrderSaved(true);
    setTimeout(() => router.back(), 1800);
  }

  const zone    = product.zones[surface];
  const canvasW = Math.round(320 * zoom / 100);
  const canvasH = Math.round(420 * zoom / 100);

  // ── Mockup step ────────────────────────────────────────────────────────────
  if (step === "mockup") {
    const mockupElements = surfaces[mockupView.surface] ?? [];
    return (
      <div className="flex h-full flex-col bg-[#eae7e0] overflow-hidden" style={{ fontFamily: "var(--font-sans)" }}>
        <header className="flex items-center gap-2 bg-[var(--surface)] border-b border-[var(--border-subtle)] px-4 h-12 shrink-0 z-20">
          <button
            onClick={() => setStep("editor")}
            className="flex items-center gap-1.5 h-8 px-3 rounded hover:bg-[var(--surface-hover)] transition text-[var(--text-secondary)] text-sm font-medium"
          >
            <ChevronLeft size={16} />
            Wróć do edytora
          </button>
          <div className="h-5 w-px bg-[var(--border-subtle)] mx-1" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">Podgląd mockupów — {product.label}</span>
          <div className="flex-1" />
          <span className="text-xs text-[var(--text-muted)] mr-2">Wybierz kolory i rozmiary, następnie zapisz produkt</span>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-y-auto bg-[#eae7e0]">
            {/* Main large preview */}
            <div className="flex items-center justify-center p-8 pb-4">
              <div className="w-full max-w-[240px] aspect-[320/420]">
                <svg viewBox="0 0 320 420" className="w-full h-full drop-shadow-2xl">
                  <SvgDefs />
                  <ProductShape productType={productType} surface={mockupView.surface} bodyColor={shirtColor.hex} />
                  {mockupElements.map(el =>
                    el.type === "text" ? (
                      <text key={el.id} x={el.x + el.w / 2} y={el.y + (el as TextElement).fontSize}
                        textAnchor="middle" fontSize={(el as TextElement).fontSize}
                        fill={(el as TextElement).color} fontWeight={(el as TextElement).bold ? "bold" : "normal"}>
                        {(el as TextElement).text}
                      </text>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <image key={el.id} href={(el as ImageElement).src}
                        x={el.x} y={el.y} width={el.w} height={el.h} preserveAspectRatio="xMidYMid meet" />
                    )
                  )}
                </svg>
              </div>
            </div>

            {/* Photo mockup row */}
            <div className="px-6 pb-8">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Podgląd mockupów</p>
              <div className="grid grid-cols-3 gap-4">
                <PhotoMockupCard
                  scene="studio_front"
                  label="Zdjęcie studyjne"
                  sublabel="Przód"
                  elements={surfaces["front"] ?? []}
                  bodyColor={shirtColor.hex}
                  surface="front"
                  isBack={false}
                />
                <PhotoMockupCard
                  scene="flatlay"
                  label="Flat lay"
                  sublabel="Layout"
                  elements={surfaces["front"] ?? []}
                  bodyColor={shirtColor.hex}
                  surface="front"
                  isBack={false}
                />
                <PhotoMockupCard
                  scene="studio_back"
                  label="Zdjęcie studyjne"
                  sublabel="Tył"
                  elements={surfaces["back"] ?? []}
                  bodyColor={shirtColor.hex}
                  surface="back"
                  isBack={true}
                />
              </div>
            </div>
          </div>

          <aside className="w-72 bg-[var(--surface)] border-l border-[var(--border-subtle)] flex flex-col overflow-y-auto shrink-0">
            {/* Mockup thumbnails */}
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Widoki mockupu</p>
              <div className="grid grid-cols-3 gap-2">
                {product.mockupViews.map(v => (
                  <div key={v.id} className="flex flex-col items-center gap-1">
                    <MiniMockup
                      productType={productType}
                      surface={v.surface}
                      elements={surfaces[v.surface] ?? []}
                      bodyColor={shirtColor.hex}
                      selected={mockupView.id === v.id}
                      onClick={() => setMockupView(v)}
                    />
                    <span className="text-[10px] text-gray-500 text-center leading-tight">{v.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                {productType === "mug" ? "Kolor kubka" : "Kolor koszulki"}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(c => (
                  <button
                    key={c.hex}
                    title={c.name}
                    onClick={() => setShirtColor(c)}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition flex items-center justify-center",
                      shirtColor.hex === c.hex ? "border-[#5c5144] scale-110 shadow" : "border-transparent hover:scale-105 hover:border-gray-300"
                    )}
                    style={{
                      backgroundColor: c.hex,
                      boxShadow: (c.hex === "#f5f2ec" || c.hex === "#ffffff") ? "inset 0 0 0 1px #d1cdc5" : undefined,
                    }}
                  >
                    {shirtColor.hex === c.hex && (
                      <Check size={12} strokeWidth={3} className={isDark(c.hex) ? "text-white" : "text-gray-700"} />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">{shirtColor.name}</p>
            </div>

            {/* Sizes */}
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                {productType === "mug" ? "Pojemność" : "Rozmiary"}
                {selectedSizes.length > 0 && (
                  <span className="ml-2 text-[#5c5144] font-normal normal-case">{selectedSizes.join(", ")}</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSize(s)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-sm font-medium transition",
                      selectedSizes.includes(s)
                        ? "bg-[#5c5144] text-white border-[#5c5144]"
                        : "border-gray-300 text-gray-600 hover:border-[#5c5144] hover:text-[#5c5144]"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {selectedSizes.length === 0 && (
                <p className="text-xs text-amber-600 mt-2">
                  Wybierz przynajmniej {productType === "mug" ? "jedną pojemność" : "jeden rozmiar"}
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="p-4 flex-1">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Podsumowanie</p>
              <div className="space-y-1.5 text-sm text-[var(--text-secondary)]">
                <div className="flex justify-between">
                  <span>Produkt</span>
                  <span className="font-medium text-[var(--text-primary)]">{product.label}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kolor</span>
                  <span className="font-medium text-[var(--text-primary)]">{shirtColor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>{productType === "mug" ? "Pojemność" : "Rozmiary"}</span>
                  <span className="font-medium text-[var(--text-primary)]">{selectedSizes.length > 0 ? selectedSizes.join(", ") : "—"}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border-subtle)]">
              <button
                onClick={handleFinalSave}
                disabled={selectedSizes.length === 0 || orderSaved}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition",
                  orderSaved
                    ? "bg-green-600 text-white"
                    : selectedSizes.length === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-[#5c5144] hover:bg-[#4a4234] text-white"
                )}
              >
                {orderSaved ? <><Check size={16} /> Zapisano!</> : <><Package size={16} /> Zapisz produkt</>}
              </button>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // ── Editor step ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col bg-[#eae7e0] overflow-hidden" style={{ fontFamily: "var(--font-sans)" }}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      {/* Top bar */}
      <header className="flex items-center gap-2 bg-[var(--surface)] border-b border-[var(--border-subtle)] px-4 h-12 shrink-0 z-20">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-[var(--surface-hover)] transition text-[var(--text-secondary)]"
          title="Wróć"
        >
          <ArrowLeft size={17} />
        </button>

        {/* Product picker button */}
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 h-8 px-3 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] transition text-sm font-medium text-[var(--text-primary)]"
        >
          {productType === "tshirt" ? <Shirt size={15} /> : <Coffee size={15} />}
          {product.label}
          <ChevronDown size={13} className="text-gray-400" />
        </button>

        <div className="h-5 w-px bg-[var(--border-subtle)] mx-0.5" />
        <button onClick={undo} disabled={!canUndo} title="Cofnij (Ctrl+Z)"
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-[var(--surface-hover)] transition text-[var(--text-muted)] disabled:opacity-30">
          <Undo2 size={16} />
        </button>
        <button onClick={redo} disabled={!canRedo} title="Ponów (Ctrl+Y)"
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-[var(--surface-hover)] transition text-[var(--text-muted)] disabled:opacity-30">
          <Redo2 size={16} />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-[var(--surface-hover)] transition text-[var(--text-muted)]" title="Informacje">
          <Info size={17} />
        </button>

        <div className="flex-1" />

        {/* Client assignment */}
        <div className={cn("w-56 mr-3 rounded-lg transition", clientError && "ring-2 ring-red-400")}>
          <ClientSelector storeKey="gadget-creator-client" compact />
        </div>
        {clientError && <span className="text-xs text-red-500 font-medium mr-2">Wybierz klienta</span>}

        {/* Edit / Preview toggle */}
        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-sm">
          <button onClick={() => setMode("edit")}
            className={cn("px-4 py-1.5 font-medium transition", mode === "edit" ? "bg-[#5c5144] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]")}>
            Edycja
          </button>
          <button onClick={() => { setMode("preview"); setSelectedId(null); }}
            className={cn("px-4 py-1.5 font-medium transition", mode === "preview" ? "bg-[#5c5144] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]")}>
            Podgląd
          </button>
        </div>

        <button onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-[var(--surface-hover)] transition text-[var(--text-muted)] ml-1" title="Zamknij">
          <X size={17} />
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left toolbar */}
        <aside className="flex flex-col items-center gap-0.5 bg-[var(--surface)] border-r border-[var(--border-subtle)] w-[64px] py-3 shrink-0 z-10">
          <ToolBtn icon={<Upload size={19} />} label="Prześlij" active={false} onClick={() => fileRef.current?.click()} />
          <ToolBtn icon={<Type size={19} />} label="Dodaj tekst" active={false}
            onClick={() => setTextDlg({ draft: "Twój tekst", fontSize: 16, color: "#1a1a1a", bold: false, editingId: null })} />
          <ToolBtn icon={<BookImage size={19} />} label="Biblioteka" active={panel === "library"}
            onClick={() => setPanel(p => p === "library" ? "none" : "library")} />
        </aside>

        {/* Library panel */}
        {panel === "library" && (
          <div className="w-56 bg-[var(--surface)] border-r border-[var(--border-subtle)] flex flex-col shrink-0 z-10">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Moja biblioteka</span>
              <button onClick={() => setPanel("none")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={14} /></button>
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
                    <button key={item.id} title={item.name}
                      onClick={() => { addImageToCanvas(item.src, item.name); setPanel("none"); }}
                      className="aspect-square rounded-lg border border-gray-200 overflow-hidden hover:border-[#5c5144] hover:shadow-sm transition">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.src} alt={item.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-[var(--border-subtle)] p-3">
              <button onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] py-2 text-xs font-medium text-[var(--text-muted)] hover:border-[#5c5144] hover:text-[#5c5144] transition">
                <Upload size={13} />
                Prześlij nowy
              </button>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center overflow-auto"
          onClick={() => mode === "edit" && setSelectedId(null)}>
          <div style={{ width: canvasW, height: canvasH }} className="relative shrink-0">
            <svg ref={svgRef} viewBox="0 0 320 420" xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full" style={{ userSelect: "none" }}>
              <SvgDefs />
              <ProductShape productType={productType} surface={surface} />

              {/* Print zone (edit mode) */}
              {mode === "edit" && zone && (
                <rect
                  x={zone.cx - zone.w / 2} y={zone.cy - zone.h / 2}
                  width={zone.w} height={zone.h}
                  fill="none" stroke="#6366f1" strokeWidth="1.3" strokeDasharray="7,4" rx="3"
                />
              )}

              {/* Elements */}
              {elements.map(el => {
                const sel = el.id === selectedId && mode === "edit";
                return (
                  <g key={el.id}>
                    {sel && (
                      <rect x={el.x - 3} y={el.y - 3} width={el.w + 6} height={el.h + 6}
                        fill="rgba(99,102,241,0.07)" stroke="#6366f1" strokeWidth="1.2"
                        strokeDasharray="4,3" rx="3" style={{ pointerEvents: "none" }} />
                    )}
                    {el.type === "text" ? (
                      <text
                        x={el.x + el.w / 2} y={el.y + (el as TextElement).fontSize}
                        textAnchor="middle" fontSize={(el as TextElement).fontSize}
                        fill={(el as TextElement).color} fontWeight={(el as TextElement).bold ? "bold" : "normal"}
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
                      <image href={(el as ImageElement).src} x={el.x} y={el.y}
                        width={el.w} height={el.h} preserveAspectRatio="xMidYMid meet"
                        style={{ cursor: mode === "edit" ? "move" : "default" }}
                        onMouseDown={e => onElMouseDown(e, el)} />
                    )}
                    {mode === "edit" && (
                      <rect x={el.x} y={el.y} width={el.w} height={el.h}
                        fill="transparent" style={{ cursor: "move" }} onMouseDown={e => onElMouseDown(e, el)} />
                    )}
                    {sel && (
                      <rect x={el.x + el.w - 6} y={el.y + el.h - 6} width={12} height={12}
                        fill="#6366f1" rx="3" style={{ cursor: "se-resize" }}
                        onMouseDown={e => onResizeMouseDown(e, el)} />
                    )}
                    {sel && (
                      <g transform={`translate(${el.x + el.w + 2}, ${el.y - 10})`} style={{ cursor: "pointer" }}
                        onClick={e => { e.stopPropagation(); updateElements(elements.filter(x => x.id !== el.id)); setSelectedId(null); }}>
                        <circle r="8" fill="#ef4444" />
                        <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="white" strokeWidth="1.6" />
                        <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke="white" strokeWidth="1.6" />
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between bg-[var(--surface)] border-t border-[var(--border-subtle)] px-5 h-13 py-2 shrink-0 z-10">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoom(z => Math.max(30, z - 10))}
            className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition">
            <Minus size={13} />
          </button>
          <span className="text-xs font-medium text-[var(--text-secondary)] w-10 text-center">{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(200, z + 10))}
            className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition">
            <Plus size={13} />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition ml-1" title="Tryb przesuwania">
            <Hand size={13} />
          </button>
        </div>

        {/* Surface tabs */}
        <div className="flex items-center gap-1">
          {product.surfaces.map(s => (
            <button key={s.id}
              onClick={() => { setSurface(s.id); setSelectedId(null); }}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-sm font-medium transition",
                surface === s.id ? "bg-[#5c5144] text-white" : "text-gray-600 hover:bg-gray-100"
              )}>
              {s.label}
            </button>
          ))}
        </div>

        <button onClick={handleSave}
          className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition bg-[#5c5144] hover:bg-[#4a4234] text-white">
          <Save size={14} />
          Zapisz produkt
        </button>
      </div>

      {/* Product picker modal */}
      {showPicker && (
        <ProductPickerModal
          current={productType}
          onSelect={switchProduct}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Text dialog */}
      {textDlg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setTextDlg(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-5">
              {textDlg.editingId ? "Edytuj tekst" : "Dodaj tekst"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Treść</label>
                <input autoFocus value={textDlg.draft}
                  onChange={e => setTextDlg({ ...textDlg, draft: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && confirmText()}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-[#5c5144] focus:ring-1 focus:ring-[#5c5144]"
                  placeholder="Wpisz tekst…" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Rozmiar (px)</label>
                  <input type="number" min={6} max={80} value={textDlg.fontSize}
                    onChange={e => setTextDlg({ ...textDlg, fontSize: Math.max(6, Math.min(80, parseInt(e.target.value) || 16)) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#5c5144]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Kolor</label>
                  <input type="color" value={textDlg.color}
                    onChange={e => setTextDlg({ ...textDlg, color: e.target.value })}
                    className="h-[42px] w-16 rounded-lg border border-gray-300 p-1 cursor-pointer" />
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={textDlg.bold}
                  onChange={e => setTextDlg({ ...textDlg, bold: e.target.checked })}
                  className="h-4 w-4 accent-[#5c5144]" />
                <span className="text-sm text-gray-700">Pogrubienie</span>
              </label>
              <div className="rounded-lg bg-gray-50 border border-gray-200 py-4 flex items-center justify-center min-h-[56px]">
                <span style={{ fontSize: Math.min(textDlg.fontSize, 36), color: textDlg.color, fontWeight: textDlg.bold ? "bold" : "normal" }}>
                  {textDlg.draft || <span className="text-gray-300 text-sm">podgląd tekstu</span>}
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setTextDlg(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Anuluj
              </button>
              <button onClick={confirmText}
                className="flex-1 rounded-lg bg-[#5c5144] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#4a4234] transition">
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

function ToolBtn({ icon, label, onClick, active }: {
  icon: React.ReactNode; label: string; onClick: () => void; active: boolean;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        "flex w-full flex-col items-center gap-1 py-3 px-1 transition-colors",
        active ? "text-[#5c5144] bg-[#5c5144]/10" : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
      )}>
      {icon}
      <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
    </button>
  );
}
