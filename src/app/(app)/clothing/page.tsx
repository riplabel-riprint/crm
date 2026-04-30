"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CLIENTS = [
  { id: "1", name: "Agencja Kreatywna Forma", email: "kontakt@forma.pl" },
  { id: "2", name: "Sport&More Sp. z o.o.", email: "zamowienia@sportmore.pl" },
  { id: "3", name: "Kowalski Jan", email: "jan.kowalski@gmail.com" },
  { id: "4", name: "Fundacja Aktywni Razem", email: "biuro@aktywnirazem.org" },
  { id: "5", name: "TechTeam Polska", email: "merch@techteam.pl" },
];

const PRODUCTS = [
  { id: "tshirt",   label: "T-shirt",         icon: "👕", basePrice: 28 },
  { id: "hoodie",   label: "Bluza z kapturem", icon: "🧥", basePrice: 75 },
  { id: "polo",     label: "Polo",             icon: "👔", basePrice: 45 },
  { id: "longsleeve", label: "Longsleeve",     icon: "👕", basePrice: 38 },
  { id: "jacket",   label: "Kurtka softshell", icon: "🧥", basePrice: 140 },
  { id: "tank",     label: "Bezrękawnik",      icon: "👕", basePrice: 22 },
];

const COLORS = [
  { id: "white",   label: "Biały",          hex: "#FFFFFF", border: true },
  { id: "black",   label: "Czarny",         hex: "#1C1C1C" },
  { id: "navy",    label: "Granatowy",      hex: "#1E3A5F" },
  { id: "red",     label: "Czerwony",       hex: "#DC2626" },
  { id: "royal",   label: "Królewski błękit", hex: "#2563EB" },
  { id: "green",   label: "Zielony",        hex: "#16A34A" },
  { id: "grey",    label: "Szary",          hex: "#6B7280" },
  { id: "yellow",  label: "Żółty",          hex: "#EAB308" },
  { id: "orange",  label: "Pomarańczowy",   hex: "#EA580C" },
  { id: "pink",    label: "Różowy",         hex: "#EC4899" },
  { id: "purple",  label: "Fioletowy",      hex: "#7C3AED" },
  { id: "brown",   label: "Brązowy",        hex: "#92400E" },
];

const TECHNIQUES = [
  { id: "dtg",      label: "DTG (Direct-to-Garment)", desc: "Pełna gama kolorów, b. detale", priceAdd: 0 },
  { id: "screen",   label: "Sitodruk",                desc: "Duże nakłady, trwały kolor",   priceAdd: -4 },
  { id: "embroidery", label: "Haft",                  desc: "Premium, efekt 3D",             priceAdd: 15 },
  { id: "transfer", label: "Transfer termiczny",       desc: "Zdjęcia, gradient",            priceAdd: 3 },
  { id: "uv",       label: "Nadruk UV",                desc: "Odporny na UV, błysk",        priceAdd: 8 },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

const WORKFLOW_STEPS = [
  { id: 1, label: "Klient i produkt" },
  { id: 2, label: "Grafika i pozycja" },
  { id: 3, label: "Szczegóły" },
  { id: 4, label: "Wycena i zlecenie" },
];

// ─── Garment SVG mockups ──────────────────────────────────────────────────────

function TShirtFrontSVG({ color, printAreaVisible, graphicX, graphicY, graphicW, graphicH, hasGraphic }: {
  color: string; printAreaVisible: boolean;
  graphicX: number; graphicY: number; graphicW: number; graphicH: number;
  hasGraphic: boolean;
}) {
  // T-shirt silhouette in a 280×320 canvas
  const isDark = ["#1C1C1C","#1E3A5F","#2563EB","#16A34A","#7C3AED","#92400E"].includes(color);
  const strokeC = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";
  const shadowC = isDark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.12)";

  return (
    <svg viewBox="0 0 280 320" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
      <defs>
        <filter id="garmentShadow">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={shadowC} />
        </filter>
        <linearGradient id="shirtShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.06)" />
        </linearGradient>
      </defs>
      {/* Main body */}
      <path
        d="M 100,18 A 40,40 0 0 0 180,18 L 240,42 L 268,108 L 220,120 L 220,305 L 60,305 L 60,120 L 12,108 L 40,42 Z"
        fill={color} stroke={strokeC} strokeWidth="1.5" filter="url(#garmentShadow)"
      />
      {/* Shade overlay */}
      <path
        d="M 100,18 A 40,40 0 0 0 180,18 L 240,42 L 268,108 L 220,120 L 220,305 L 60,305 L 60,120 L 12,108 L 40,42 Z"
        fill="url(#shirtShade)"
      />
      {/* Collar stitching */}
      <path
        d="M 106,22 A 34,34 0 0 0 174,22"
        fill="none" stroke={strokeC} strokeWidth="1" strokeDasharray="3,2"
      />
      {/* Side seams */}
      <line x1="60" y1="120" x2="60" y2="305" stroke={strokeC} strokeWidth="0.8" />
      <line x1="220" y1="120" x2="220" y2="305" stroke={strokeC} strokeWidth="0.8" />
      {/* Print area */}
      {printAreaVisible && (
        <rect
          x={graphicX - graphicW / 2} y={graphicY - graphicH / 2}
          width={graphicW} height={graphicH}
          fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="5,3"
          rx="2"
        />
      )}
      {/* Graphic placeholder */}
      {hasGraphic && (
        <rect
          x={graphicX - graphicW / 2 + 2} y={graphicY - graphicH / 2 + 2}
          width={graphicW - 4} height={graphicH - 4}
          fill="rgba(99,102,241,0.25)" stroke="rgba(99,102,241,0.6)" strokeWidth="1" rx="2"
        />
      )}
      {hasGraphic && (
        <text
          x={graphicX} y={graphicY + 5}
          textAnchor="middle" fontSize="10" fill="rgba(99,102,241,0.9)" fontWeight="600"
        >
          GRAFIKA
        </text>
      )}
    </svg>
  );
}

function TShirtBackSVG({ color, printAreaVisible, graphicX, graphicY, graphicW, graphicH, hasGraphic }: {
  color: string; printAreaVisible: boolean;
  graphicX: number; graphicY: number; graphicW: number; graphicH: number;
  hasGraphic: boolean;
}) {
  const isDark = ["#1C1C1C","#1E3A5F","#2563EB","#16A34A","#7C3AED","#92400E"].includes(color);
  const strokeC = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";

  return (
    <svg viewBox="0 0 280 320" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="backShade" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
        </linearGradient>
      </defs>
      <path
        d="M 100,18 A 40,40 0 0 1 180,18 L 240,42 L 268,108 L 220,120 L 220,305 L 60,305 L 60,120 L 12,108 L 40,42 Z"
        fill={color} stroke={strokeC} strokeWidth="1.5"
        style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.12))" }}
      />
      <path
        d="M 100,18 A 40,40 0 0 1 180,18 L 240,42 L 268,108 L 220,120 L 220,305 L 60,305 L 60,120 L 12,108 L 40,42 Z"
        fill="url(#backShade)"
      />
      <line x1="60" y1="120" x2="60" y2="305" stroke={strokeC} strokeWidth="0.8" />
      <line x1="220" y1="120" x2="220" y2="305" stroke={strokeC} strokeWidth="0.8" />
      <line x1="140" y1="18" x2="140" y2="305" stroke={strokeC} strokeWidth="0.5" strokeDasharray="4,3" />
      {printAreaVisible && (
        <rect
          x={graphicX - graphicW / 2} y={graphicY - graphicH / 2}
          width={graphicW} height={graphicH}
          fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="5,3" rx="2"
        />
      )}
      {hasGraphic && (
        <rect
          x={graphicX - graphicW / 2 + 2} y={graphicY - graphicH / 2 + 2}
          width={graphicW - 4} height={graphicH - 4}
          fill="rgba(99,102,241,0.18)" stroke="rgba(99,102,241,0.5)" strokeWidth="1" rx="2"
        />
      )}
    </svg>
  );
}

function HoodieFrontSVG({ color }: { color: string }) {
  const strokeC = ["#1C1C1C","#1E3A5F","#2563EB","#16A34A"].includes(color)
    ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";
  return (
    <svg viewBox="0 0 280 340" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id="hoodieShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
        </linearGradient>
      </defs>
      {/* Hood */}
      <path d="M 80,15 Q 140,-15 200,15 L 210,60 Q 170,30 140,28 Q 110,30 70,60 Z"
        fill={color} stroke={strokeC} strokeWidth="1.2" />
      {/* Main body */}
      <path
        d="M 70,60 L 30,50 L 8,120 L 55,132 L 55,320 L 225,320 L 225,132 L 272,120 L 250,50 L 210,60 L 195,100 L 145,110 L 135,110 L 85,100 Z"
        fill={color} stroke={strokeC} strokeWidth="1.5"
        style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))" }}
      />
      <path
        d="M 70,60 L 30,50 L 8,120 L 55,132 L 55,320 L 225,320 L 225,132 L 272,120 L 250,50 L 210,60 L 195,100 L 145,110 L 135,110 L 85,100 Z"
        fill="url(#hoodieShade)"
      />
      {/* Kangaroo pocket */}
      <rect x="95" y="220" width="90" height="60" rx="4" fill="none" stroke={strokeC} strokeWidth="1.2" />
      {/* Zipper line */}
      <line x1="140" y1="60" x2="140" y2="320" stroke={strokeC} strokeWidth="1" strokeDasharray="3,2" />
      {/* Cuffs */}
      <rect x="8" y="120" width="47" height="12" rx="2" fill={color} stroke={strokeC} strokeWidth="1" />
      <rect x="225" y="120" width="47" height="12" rx="2" fill={color} stroke={strokeC} strokeWidth="1" />
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WorkflowBar({ activeStep, onStep }: { activeStep: number; onStep: (s: number) => void }) {
  return (
    <div className="flex items-center gap-0 bg-white border-b border-gray-200 px-6 py-0">
      {WORKFLOW_STEPS.map((step, i) => {
        const done   = step.id < activeStep;
        const active = step.id === activeStep;
        return (
          <button
            key={step.id}
            onClick={() => onStep(step.id)}
            className={cn(
              "flex items-center gap-2.5 px-5 py-3.5 text-sm transition-colors border-b-2 -mb-px",
              active
                ? "border-blue-600 text-blue-700 font-semibold"
                : done
                  ? "border-transparent text-green-600 font-medium hover:text-blue-600"
                  : "border-transparent text-gray-400 hover:text-gray-700"
            )}
          >
            <span className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
              active  ? "bg-blue-600 text-white"
              : done  ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
            )}>
              {done ? "✓" : step.id}
            </span>
            {step.label}
            {i < WORKFLOW_STEPS.length - 1 && (
              <span className="ml-2 text-gray-200">›</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ActionBar({ projectName, onNameChange }: { projectName: string; onNameChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">Projekt:</span>
        <input
          value={projectName}
          onChange={(e) => onNameChange(e.target.value)}
          className="rounded border border-transparent px-2 py-1 text-sm font-semibold text-gray-900 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
        />
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">Szkic</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Zapisz szkic
        </button>
        <button className="flex items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Podgląd
        </button>
        <button className="flex items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Eksportuj
        </button>
        <button className="flex items-center gap-1.5 rounded bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition">
          Dalej →
        </button>
      </div>
    </div>
  );
}

// ─── Left panel ───────────────────────────────────────────────────────────────

interface LeftPanelProps {
  clientId: string; onClient: (v: string) => void;
  productId: string; onProduct: (v: string) => void;
  colorId: string; onColor: (v: string) => void;
  sizes: Record<string, number>; onSize: (s: string, q: number) => void;
  techniqueId: string; onTechnique: (v: string) => void;
  hasGraphic: boolean; onUpload: () => void;
  printSide: "front" | "back"; onPrintSide: (v: "front" | "back") => void;
}

function LeftPanel(props: LeftPanelProps) {
  const { clientId, onClient, productId, onProduct, colorId, onColor,
          sizes, onSize, techniqueId, onTechnique, hasGraphic, onUpload,
          printSide, onPrintSide } = props;

  const totalQty = Object.values(sizes).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">

      {/* Klient */}
      <Card>
        <CardHeader><CardTitle>Klient</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          <select
            value={clientId}
            onChange={(e) => onClient(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">— wybierz klienta —</option>
            {MOCK_CLIENTS.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {clientId && (
            <div className="rounded bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700">
              {MOCK_CLIENTS.find((c) => c.id === clientId)?.email}
            </div>
          )}
          <button className="text-xs font-medium text-blue-600 hover:underline">+ Dodaj nowego klienta</button>
        </CardBody>
      </Card>

      {/* Produkt */}
      <Card>
        <CardHeader><CardTitle>Produkt</CardTitle></CardHeader>
        <CardBody className="space-y-1 -mx-0">
          {PRODUCTS.map((p) => (
            <label key={p.id} className={cn(
              "flex items-center gap-3 cursor-pointer -mx-5 px-5 py-2 transition-colors",
              productId === p.id ? "bg-blue-50" : "hover:bg-gray-50"
            )}>
              <input type="radio" name="product" value={p.id}
                checked={productId === p.id}
                onChange={() => onProduct(p.id)}
                className="accent-blue-600"
              />
              <span className="text-base">{p.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{p.label}</div>
                <div className="text-xs text-gray-500">od {p.basePrice} zł/szt.</div>
              </div>
            </label>
          ))}
        </CardBody>
      </Card>

      {/* Kolor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Kolor produktu</CardTitle>
            <span className="text-xs text-gray-500">{COLORS.find((c) => c.id === colorId)?.label}</span>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-6 gap-2">
            {COLORS.map((c) => (
              <button
                key={c.id}
                title={c.label}
                onClick={() => onColor(c.id)}
                style={{ backgroundColor: c.hex }}
                className={cn(
                  "h-8 w-8 rounded-full transition-transform hover:scale-110",
                  c.border && "border border-gray-300",
                  colorId === c.id && "ring-2 ring-offset-2 ring-blue-500 scale-110"
                )}
              />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Rozmiary i ilości */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Rozmiary i ilość</CardTitle>
            <span className="text-xs text-gray-500 font-medium">{totalQty} szt.</span>
          </div>
        </CardHeader>
        <CardBody className="space-y-0">
          {SIZES.map((size) => (
            <div key={size} className="flex items-center gap-3 py-1.5 border-b border-gray-100 last:border-0">
              <span className="w-8 text-xs font-semibold text-gray-700">{size}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onSize(size, Math.max(0, (sizes[size] || 0) - 1))}
                  className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs transition"
                >−</button>
                <input
                  type="number"
                  min="0"
                  max="9999"
                  value={sizes[size] || 0}
                  onChange={(e) => onSize(size, Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-12 rounded border border-gray-200 px-1 py-0.5 text-center text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => onSize(size, (sizes[size] || 0) + 1)}
                  className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs transition"
                >+</button>
              </div>
              {(sizes[size] || 0) > 0 && (
                <span className="ml-auto text-xs text-blue-600 font-medium">{sizes[size]} szt.</span>
              )}
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Strona nadruku */}
      <Card>
        <CardHeader><CardTitle>Strona nadruku</CardTitle></CardHeader>
        <CardBody>
          <div className="flex gap-2">
            {(["front", "back"] as const).map((side) => (
              <button
                key={side}
                onClick={() => onPrintSide(side)}
                className={cn(
                  "flex-1 rounded py-2 text-sm font-medium transition",
                  printSide === side
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                )}
              >
                {side === "front" ? "Przód" : "Tył"}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Technika */}
      <Card>
        <CardHeader><CardTitle>Technika nadruku</CardTitle></CardHeader>
        <CardBody className="space-y-0">
          {TECHNIQUES.map((t) => (
            <label key={t.id} className={cn(
              "flex items-start gap-3 cursor-pointer -mx-5 px-5 py-2.5 transition-colors",
              techniqueId === t.id ? "bg-blue-50" : "hover:bg-gray-50"
            )}>
              <input type="radio" name="technique" value={t.id}
                checked={techniqueId === t.id}
                onChange={() => onTechnique(t.id)}
                className="mt-0.5 accent-blue-600"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{t.label}</div>
                <div className="text-xs text-gray-500">{t.desc}</div>
              </div>
              <span className={cn(
                "text-xs font-medium shrink-0",
                t.priceAdd > 0 ? "text-orange-500" : t.priceAdd < 0 ? "text-green-600" : "text-gray-400"
              )}>
                {t.priceAdd > 0 ? `+${t.priceAdd} zł` : t.priceAdd < 0 ? `${t.priceAdd} zł` : "std"}
              </span>
            </label>
          ))}
        </CardBody>
      </Card>

      {/* Grafika */}
      <Card>
        <CardHeader><CardTitle>Grafika nadruku</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          {hasGraphic ? (
            <div className="rounded border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm">
              <div className="flex items-center gap-2 text-violet-700 font-medium">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                logo_firma.png
              </div>
              <div className="text-xs text-violet-500 mt-0.5">PNG · 2400×2400px · 1.2 MB</div>
              <button className="mt-1.5 text-xs font-medium text-red-500 hover:text-red-700">Usuń grafikę</button>
            </div>
          ) : (
            <div
              onClick={onUpload}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-5 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 mb-2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span className="text-sm font-medium text-gray-600">Przeciągnij lub kliknij</span>
              <span className="text-xs text-gray-400 mt-0.5">PNG, SVG, PDF · max 30 MB</span>
            </div>
          )}
          <div className="text-xs text-gray-500 space-y-0.5">
            <p>✓ Zalecana rozdzielczość: min. 150 DPI</p>
            <p>✓ Tryb kolorów: RGB lub CMYK</p>
          </div>
        </CardBody>
      </Card>

    </div>
  );
}

// ─── Center panel ─────────────────────────────────────────────────────────────

interface CenterPanelProps {
  view: "front" | "back";
  onView: (v: "front" | "back") => void;
  productId: string;
  color: string;
  snapGrid: boolean;
  onSnapGrid: (v: boolean) => void;
  showPrintArea: boolean;
  onShowPrintArea: (v: boolean) => void;
  gX: number; gY: number; gW: number; gH: number;
  onGX: (v: number) => void; onGY: (v: number) => void;
  onGW: (v: number) => void; onGH: (v: number) => void;
  hasGraphic: boolean;
  zoom: number; onZoom: (v: number) => void;
}

function CenterPanel(p: CenterPanelProps) {
  const { view, onView, productId, color, snapGrid, onSnapGrid,
          showPrintArea, onShowPrintArea, gX, gY, gW, gH,
          onGX, onGY, onGW, onGH, hasGraphic, zoom, onZoom } = p;

  const selectedColor = COLORS.find((c) => c.hex === color) || COLORS[0];
  const isHoodie = productId === "hoodie";

  // Mockup thumbnails
  const thumbnails = [
    { id: "front", label: "Przód" },
    { id: "back",  label: "Tył" },
    { id: "detail", label: "Detal" },
    { id: "flat",   label: "Flat lay" },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-sm border border-stroke px-4 py-2.5 shadow-default">
        <div className="flex items-center gap-1">
          {(["front", "back"] as const).map((v) => (
            <button
              key={v}
              onClick={() => onView(v)}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition",
                view === v
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              )}
            >
              {v === "front" ? "Przód" : "Tył"}
            </button>
          ))}
          <div className="mx-2 h-5 w-px bg-gray-200" />
          <button
            onClick={() => onSnapGrid(!snapGrid)}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition",
              snapGrid ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>
            Siatka
          </button>
          <button
            onClick={() => onShowPrintArea(!showPrintArea)}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition",
              showPrintArea ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4,2"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>
            Obszar druku
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onZoom(Math.max(50, zoom - 10))} className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs">−</button>
          <span className="text-xs font-medium text-gray-600 w-10 text-center">{zoom}%</span>
          <button onClick={() => onZoom(Math.min(200, zoom + 10))} className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs">+</button>
        </div>
      </div>

      {/* Main canvas */}
      <Card className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-100 to-gray-50 relative overflow-hidden rounded-sm" style={{ minHeight: 400 }}>
          {/* Grid overlay */}
          {snapGrid && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
          )}
          {/* Color label */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 px-2.5 py-1 shadow-sm">
            <span className="h-3 w-3 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: selectedColor.hex }} />
            <span className="text-[11px] font-medium text-gray-600">{selectedColor.label}</span>
          </div>
          {/* View label */}
          <div className="absolute top-3 right-3 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 px-2.5 py-1 shadow-sm">
            <span className="text-[11px] font-medium text-gray-600">{view === "front" ? "Widok: Przód" : "Widok: Tył"}</span>
          </div>

          {/* Garment SVG */}
          <div style={{ width: `${Math.round(280 * zoom / 100)}px`, height: `${Math.round(320 * zoom / 100)}px` }} className="transition-all duration-200">
            {isHoodie ? (
              <HoodieFrontSVG color={color} />
            ) : view === "front" ? (
              <TShirtFrontSVG
                color={color}
                printAreaVisible={showPrintArea}
                graphicX={gX} graphicY={gY} graphicW={gW} graphicH={gH}
                hasGraphic={hasGraphic}
              />
            ) : (
              <TShirtBackSVG
                color={color}
                printAreaVisible={showPrintArea}
                graphicX={gX} graphicY={gY} graphicW={gW} graphicH={gH}
                hasGraphic={hasGraphic}
              />
            )}
          </div>

          {/* Print area info badge */}
          {showPrintArea && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-blue-600/90 text-white text-[11px] px-3 py-1 shadow">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>
              Obszar nadruku: {gW}×{gH} mm
            </div>
          )}
        </div>

        {/* Position/Size controls */}
        <div className="border-t border-gray-200 px-5 py-3 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pozycja i rozmiar grafiki</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "X", value: gX, min: 60, max: 220, setter: onGX, unit: "mm" },
              { label: "Y", value: gY, min: 80, max: 280, setter: onGY, unit: "mm" },
              { label: "Szer.", value: gW, min: 20, max: 160, setter: onGW, unit: "mm" },
              { label: "Wys.", value: gH, min: 10, max: 120, setter: onGH, unit: "mm" },
            ].map((ctrl) => (
              <div key={ctrl.label}>
                <label className="block text-[11px] text-gray-500 mb-1">{ctrl.label}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={ctrl.value}
                    min={ctrl.min} max={ctrl.max}
                    onChange={(e) => ctrl.setter(Math.min(ctrl.max, Math.max(ctrl.min, parseInt(e.target.value) || ctrl.min)))}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-xs text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
                <input
                  type="range"
                  value={ctrl.value}
                  min={ctrl.min} max={ctrl.max}
                  onChange={(e) => ctrl.setter(parseInt(e.target.value))}
                  className="w-full mt-1 accent-blue-600"
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Mockup thumbnails */}
      <Card>
        <CardBody className="py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium shrink-0">Mockupy:</span>
            <div className="flex gap-2 overflow-x-auto">
              {thumbnails.map((t, i) => (
                <button
                  key={t.id}
                  className={cn(
                    "flex flex-col items-center gap-1 shrink-0 rounded border p-1.5 transition",
                    i === 0 ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div
                    className="h-14 w-12 rounded flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${color}22` }}
                  >
                    <span className="text-xl">{PRODUCTS.find((pr) => pr.id === productId)?.icon ?? "👕"}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{t.label}</span>
                </button>
              ))}
              <button className="flex flex-col items-center justify-center gap-1 shrink-0 rounded border border-dashed border-gray-300 p-1.5 w-[52px] hover:border-blue-400 transition text-gray-400 hover:text-blue-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                <span className="text-[10px]">Dodaj</span>
              </button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Final print frame */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Finalny kadr do druku</CardTitle>
            <span className="text-xs text-gray-500">300 DPI · {gW}×{gH} mm</span>
          </div>
        </CardHeader>
        <CardBody className="py-3">
          <div className="flex items-center gap-3">
            <div
              className="h-16 flex items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400 font-medium"
              style={{ width: `${Math.round(gW * 0.8)}px`, minWidth: 60 }}
            >
              {hasGraphic ? (
                <span className="text-violet-600">✓ Gotowe</span>
              ) : (
                "Brak grafiki"
              )}
            </div>
            <div className="text-xs text-gray-500 space-y-0.5">
              <p>Format: PNG 32-bit z kanałem alfa</p>
              <p>Rozdzielczość: 300 DPI ({Math.round(gW * 11.8)}×{Math.round(gH * 11.8)} px)</p>
              <p className={cn(hasGraphic ? "text-green-600" : "text-orange-500")}>
                {hasGraphic ? "✓ Grafika spełnia wymagania" : "⚠ Brak grafiki — wymagana"}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

    </div>
  );
}

// ─── Right panel ──────────────────────────────────────────────────────────────

interface RightPanelProps {
  productId: string; colorId: string; techniqueId: string;
  sizes: Record<string, number>; hasGraphic: boolean; clientId: string;
  layers: Layer[]; onLayerToggle: (id: string) => void;
  onLayerLock: (id: string) => void; onLayerSelect: (id: string) => void;
  selectedLayerId: string;
}

interface Layer {
  id: string; label: string; type: "graphic" | "text" | "logo";
  visible: boolean; locked: boolean; opacity: number;
}

function RightPanel(p: RightPanelProps) {
  const { productId, colorId, techniqueId, sizes, hasGraphic, clientId,
          layers, onLayerToggle, onLayerLock, onLayerSelect, selectedLayerId } = p;

  const product   = PRODUCTS.find((pr) => pr.id === productId);
  const color     = COLORS.find((c) => c.id === colorId);
  const technique = TECHNIQUES.find((t) => t.id === techniqueId);
  const client    = MOCK_CLIENTS.find((c) => c.id === clientId);
  const totalQty  = Object.values(sizes).reduce((a, b) => a + b, 0);
  const basePrice = (product?.basePrice || 28) + (technique?.priceAdd || 0);
  const totalNet  = basePrice * totalQty;
  const vat       = totalNet * 0.23;
  const totalGross = totalNet + vat;

  return (
    <div className="space-y-4">

      {/* Layers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Warstwy projektu</CardTitle>
            <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Dodaj
            </button>
          </div>
        </CardHeader>
        <CardBody className="space-y-1 py-2">
          {layers.map((layer) => (
            <div
              key={layer.id}
              onClick={() => onLayerSelect(layer.id)}
              className={cn(
                "flex items-center gap-2 rounded px-3 py-2 cursor-pointer transition-colors",
                selectedLayerId === layer.id
                  ? "bg-blue-50 border border-blue-200"
                  : "hover:bg-gray-50 border border-transparent"
              )}
            >
              {/* Type icon */}
              <span className="text-xs">
                {layer.type === "graphic" ? "🖼" : layer.type === "logo" ? "✦" : "T"}
              </span>
              <span className="flex-1 text-sm text-gray-800 truncate">{layer.label}</span>
              {/* Opacity */}
              <span className="text-[11px] text-gray-400">{layer.opacity}%</span>
              {/* Visibility */}
              <button
                onClick={(e) => { e.stopPropagation(); onLayerToggle(layer.id); }}
                className={cn("text-gray-400 hover:text-gray-700 transition", !layer.visible && "opacity-30")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              {/* Lock */}
              <button
                onClick={(e) => { e.stopPropagation(); onLayerLock(layer.id); }}
                className={cn("text-gray-400 hover:text-gray-700 transition", layer.locked && "text-amber-500")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {layer.locked
                    ? <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>
                    : <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></>
                  }
                </svg>
              </button>
            </div>
          ))}
          {layers.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-3">Brak warstw — dodaj grafikę</p>
          )}
        </CardBody>

        {/* Layer properties (shown when layer selected) */}
        {selectedLayerId && (() => {
          const layer = layers.find((l) => l.id === selectedLayerId);
          if (!layer) return null;
          return (
            <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Właściwości warstwy</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-16">Krycie</label>
                  <input type="range" min="0" max="100" defaultValue={layer.opacity}
                    className="flex-1 accent-blue-600" />
                  <span className="text-xs text-gray-600 w-8 text-right">{layer.opacity}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 w-16">Blending</label>
                  <select className="flex-1 rounded border border-gray-200 px-2 py-0.5 text-xs focus:outline-none">
                    <option>Normal</option>
                    <option>Multiply</option>
                    <option>Screen</option>
                    <option>Overlay</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })()}
      </Card>

      {/* Project summary */}
      <Card>
        <CardHeader><CardTitle>Podsumowanie projektu</CardTitle></CardHeader>
        <CardBody className="space-y-2.5 text-sm">
          <Row label="Klient"      value={client?.name ?? "—"} />
          <Row label="Produkt"     value={product?.label ?? "—"} />
          <Row label="Kolor"       value={color?.label ?? "—"} />
          <Row label="Technika"    value={technique?.label ?? "—"} />
          <Row label="Łączna ilość" value={totalQty > 0 ? `${totalQty} szt.` : "—"} bold />
          <div className="border-t border-gray-100 pt-2">
            <div className="text-xs text-gray-400 mb-1.5">Rozkład rozmiarów:</div>
            <div className="flex flex-wrap gap-1.5">
              {SIZES.filter((s) => (sizes[s] || 0) > 0).map((s) => (
                <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {s}: {sizes[s]}
                </span>
              ))}
              {totalQty === 0 && <span className="text-xs text-gray-400">Brak rozmiarów</span>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Grafika</span>
            <span className={cn("ml-auto font-medium", hasGraphic ? "text-green-600" : "text-red-500")}>
              {hasGraphic ? "✓ Wgrana" : "Brak"}
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Price breakdown */}
      <Card>
        <CardHeader><CardTitle>Wycena</CardTitle></CardHeader>
        <CardBody className="space-y-2 text-sm">
          <Row label="Cena produktu (szt.)"   value={`${product?.basePrice ?? 0} zł`} />
          {(technique?.priceAdd ?? 0) !== 0 && (
            <Row label={`Dopłata: ${technique?.label}`}
              value={`${technique!.priceAdd > 0 ? "+" : ""}${technique!.priceAdd} zł`}
            />
          )}
          <Row label="Cena jednostkowa"  value={`${basePrice} zł`} bold />
          <Row label={`Ilość (${totalQty} szt.)`} value={`× ${totalQty}`} />
          <div className="border-t border-gray-200 pt-2 space-y-1.5">
            <Row label="Netto"  value={`${totalNet.toFixed(2)} zł`} />
            <Row label="VAT 23%" value={`${vat.toFixed(2)} zł`} />
            <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100">
              <span className="text-gray-700">Razem brutto</span>
              <span className="text-blue-600">{totalGross.toFixed(2)} zł</span>
            </div>
          </div>
          {totalQty === 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded px-2 py-1.5 mt-1">
              ⚠ Wpisz ilości rozmiarów, aby zobaczyć wycenę.
            </p>
          )}
        </CardBody>
      </Card>

      {/* CTA buttons */}
      <div className="space-y-2">
        <button
          className={cn(
            "w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2",
            totalQty > 0 && hasGraphic
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-blue-200 text-blue-400 cursor-not-allowed"
          )}
          disabled={!(totalQty > 0 && hasGraphic)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Dodaj zamówienie
        </button>
        <button
          className={cn(
            "w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2",
            hasGraphic
              ? "bg-violet-600 text-white hover:bg-violet-700"
              : "bg-violet-200 text-violet-400 cursor-not-allowed"
          )}
          disabled={!hasGraphic}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          Dodaj do druku
        </button>
        <button className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          Pobierz wycenę PDF
        </button>
        <button className="w-full rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
          Resetuj projekt
        </button>
      </div>

      {/* Tip */}
      <Card className="bg-blue-50 border-blue-200">
        <CardBody className="text-xs text-blue-900 py-3">
          <p className="font-semibold mb-1">💡 Wskazówka</p>
          <p>Ceny są orientacyjne i nie uwzględniają rabatów. Kliknij warstwę, by edytować jej właściwości.</p>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between", bold && "font-semibold")}>
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEFAULT_SIZES: Record<string, number> = { XS: 0, S: 5, M: 10, L: 8, XL: 5, XXL: 2, "3XL": 0 };
const DEFAULT_LAYERS: Layer[] = [
  { id: "l1", label: "Logo przód",    type: "logo",    visible: true,  locked: false, opacity: 100 },
  { id: "l2", label: "Nadruk tekst",  type: "text",    visible: true,  locked: false, opacity: 100 },
  { id: "l3", label: "Grafika tył",   type: "graphic", visible: false, locked: true,  opacity: 85 },
];

export default function ClothingCreatorPage() {
  const [activeStep,      setActiveStep]     = useState(2);
  const [projectName,     setProjectName]    = useState("Nowy projekt odzieżowy");
  const [clientId,        setClientId]       = useState("1");
  const [productId,       setProductId]      = useState("tshirt");
  const [colorId,         setColorId]        = useState("navy");
  const [sizes,           setSizes]          = useState<Record<string, number>>(DEFAULT_SIZES);
  const [techniqueId,     setTechniqueId]    = useState("dtg");
  const [hasGraphic,      setHasGraphic]     = useState(true);
  const [view,            setView]           = useState<"front" | "back">("front");
  const [printSide,       setPrintSide]      = useState<"front" | "back">("front");
  const [snapGrid,        setSnapGrid]       = useState(false);
  const [showPrintArea,   setShowPrintArea]  = useState(true);
  const [zoom,            setZoom]           = useState(100);
  const [gX, setGX] = useState(140);
  const [gY, setGY] = useState(170);
  const [gW, setGW] = useState(80);
  const [gH, setGH] = useState(70);
  const [layers,          setLayers]         = useState<Layer[]>(DEFAULT_LAYERS);
  const [selectedLayerId, setSelectedLayerId] = useState("l1");

  const colorHex = COLORS.find((c) => c.id === colorId)?.hex ?? "#1E3A5F";

  function handleSizeChange(size: string, qty: number) {
    setSizes((prev) => ({ ...prev, [size]: qty }));
  }
  function handleLayerToggle(id: string) {
    setLayers((ls) => ls.map((l) => l.id === id ? { ...l, visible: !l.visible } : l));
  }
  function handleLayerLock(id: string) {
    setLayers((ls) => ls.map((l) => l.id === id ? { ...l, locked: !l.locked } : l));
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Workflow + action bars */}
      <WorkflowBar activeStep={activeStep} onStep={setActiveStep} />
      <ActionBar projectName={projectName} onNameChange={setProjectName} />

      {/* 3-column layout */}
      <div className="flex flex-1 gap-6 overflow-hidden p-6 bg-[#F1F5F9]">
        {/* Left */}
        <div className="w-72 shrink-0 overflow-y-auto">
          <LeftPanel
            clientId={clientId}         onClient={setClientId}
            productId={productId}       onProduct={setProductId}
            colorId={colorId}           onColor={setColorId}
            sizes={sizes}               onSize={handleSizeChange}
            techniqueId={techniqueId}   onTechnique={setTechniqueId}
            hasGraphic={hasGraphic}     onUpload={() => setHasGraphic(true)}
            printSide={printSide}       onPrintSide={setPrintSide}
          />
        </div>

        {/* Center */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-0 min-w-0">
          <CenterPanel
            view={view}                   onView={setView}
            productId={productId}
            color={colorHex}
            snapGrid={snapGrid}           onSnapGrid={setSnapGrid}
            showPrintArea={showPrintArea} onShowPrintArea={setShowPrintArea}
            gX={gX} gY={gY} gW={gW} gH={gH}
            onGX={setGX} onGY={setGY} onGW={setGW} onGH={setGH}
            hasGraphic={hasGraphic}
            zoom={zoom}                   onZoom={setZoom}
          />
        </div>

        {/* Right */}
        <div className="w-80 shrink-0 overflow-y-auto">
          <RightPanel
            productId={productId}     colorId={colorId}
            techniqueId={techniqueId} sizes={sizes}
            hasGraphic={hasGraphic}   clientId={clientId}
            layers={layers}
            onLayerToggle={handleLayerToggle}
            onLayerLock={handleLayerLock}
            onLayerSelect={setSelectedLayerId}
            selectedLayerId={selectedLayerId}
          />
        </div>
      </div>
    </div>
  );
}
