"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GridLayout, useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Check, RotateCcw } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderPriorityBadge } from "@/components/orders/OrderPriorityBadge";
import { OrderMetaCard } from "@/components/orders/OrderMetaCard";
import { OrderSpecCard } from "@/components/orders/OrderSpecCard";
import { OrderSpecSnapshotCard } from "@/components/orders/OrderSpecSnapshotCard";
import { StagesPanel } from "@/components/orders/StagesPanel";
import { EventLog } from "@/components/orders/EventLog";
import type { OrderDetail } from "@/lib/data/orders";
import type { OrderView } from "@/types/order-view";

type Props = {
  order: OrderDetail | null;
  isOverdue: boolean;
  view: OrderView;
};

type GridItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
};

const LAYOUT_KEY = "order-detail-rgl-v2";
const ROW_H = 52;
const COLS = 3;
const MARGIN: [number, number] = [14, 14];

const DEFAULT_LAYOUT: GridItem[] = [
  { i: "meta",      x: 0, y: 7,  w: 1, h: 6,  minW: 1, minH: 4 },
  { i: "spec-snap", x: 0, y: 13, w: 1, h: 8,  minW: 1, minH: 3 },
  { i: "spec",      x: 0, y: 30, w: 1, h: 10, minW: 1, minH: 4 },
  { i: "stages",    x: 1, y: 0,  w: 2, h: 18, minW: 1, minH: 6 },
  { i: "events",    x: 1, y: 18, w: 2, h: 12, minW: 1, minH: 4 },
];

function loadLayout(): GridItem[] {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (raw) {
      const saved: GridItem[] = JSON.parse(raw);
      if (DEFAULT_LAYOUT.every((d) => saved.find((s) => s.i === d.i))) return saved;
    }
  } catch { /* ignore */ }
  return DEFAULT_LAYOUT;
}

function saveLayout(layout: GridItem[]) {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch { /* ignore */ }
}

function EditShell({ children, editing }: { children: React.ReactNode; editing: boolean }) {
  return (
    <div className={cn(
      "h-full overflow-auto rounded-xl transition-all duration-150 relative",
      editing && "ring-1 ring-[#fe4e00]/25",
    )}>
      {editing && (
        <div className="absolute inset-0 rounded-xl pointer-events-none z-10 ring-1 ring-[#fe4e00]/20" />
      )}
      {children}
    </div>
  );
}

export function OrderDetailView({ order, isOverdue, view }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [layout, setLayout] = useState<GridItem[]>(DEFAULT_LAYOUT);
  const [layoutLoaded, setLayoutLoaded] = useState(false);
  const { width, containerRef } = useContainerWidth({ measureBeforeMount: false, initialWidth: 1200 });

  useEffect(() => {
    setLayout(loadLayout());
    setLayoutLoaded(true);
  }, []);

  if (!order) return notFound();

  function handleLayoutChange(newLayout: GridItem[]) {
    if (!layoutLoaded || !editMode) return;
    setLayout(newLayout);
    saveLayout(newLayout);
  }

  function reset() {
    setLayout(DEFAULT_LAYOUT);
    try { localStorage.removeItem(LAYOUT_KEY); } catch { /* ignore */ }
  }

  const panels = {
    meta:      <OrderMetaCard order={view} />,
    "spec-snap": order.specSnapshot
      ? <OrderSpecSnapshotCard orderId={order.id} snap={order.specSnapshot} />
      : null,
    spec:      <OrderSpecCard revision={order.activeRevision} description={view.description} />,
    stages:    <div className="space-y-3.5"><StagesPanel orderId={order.id} status={order.status} stages={view.stages} tasks={view.tasks} /></div>,
    events:    <EventLog events={order.events} />,
  } as Record<string, React.ReactNode>;

  return (
    <div className="min-h-full text-white">
      <style precedence="default">{`
        .order-rgl-resizing .react-resizable-handle {
          background-color: rgba(254,78,0,0.6) !important;
        }
        .react-resizable-handle {
          background-color: rgba(255,255,255,0.15);
          border-radius: 3px;
          transition: background-color 0.15s;
          width: 14px !important; height: 14px !important;
          bottom: 6px !important; right: 6px !important;
        }
        .react-resizable-handle:hover {
          background-color: rgba(254,78,0,0.7) !important;
        }
        .react-grid-item.react-grid-placeholder {
          background: rgba(254,78,0,0.10) !important;
          border: 1.5px dashed rgba(254,78,0,0.35) !important;
          border-radius: 12px !important;
          opacity: 1 !important;
        }
        .react-grid-item.resizing,
        .react-grid-item.react-draggable-dragging {
          z-index: 50;
          box-shadow: 0 0 0 2px rgba(254,78,0,0.4), 0 16px 48px rgba(0,0,0,0.5);
          border-radius: 12px;
        }
      `}</style>

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#0d0d0d] px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <nav className="mb-1 flex items-center gap-1.5 text-xs text-white/30">
              <Link href="/orders" className="hover:text-white/60 transition-colors">Zlecenia</Link>
              <span>/</span>
              <span className="font-mono text-white/50">{view.number}</span>
            </nav>
            <h1 className="truncate text-xl font-semibold text-white">{view.title}</h1>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <OrderPriorityBadge priority={order.priority} />
            {view.clientDeadline && (
              <span className={cn("text-xs", isOverdue ? "font-semibold text-red-400" : "text-white/40")}>
                Termin: {formatDate(view.clientDeadline)}
                {isOverdue && " — po terminie"}
              </span>
            )}
            {editMode && (
              <button
                onClick={reset}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/40 hover:text-white/60 transition-colors"
              >
                <RotateCcw size={12} /> Resetuj
              </button>
            )}
            <button
              onClick={() => setEditMode((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[12px] font-medium transition-colors",
                editMode
                  ? "border-[#fe4e00]/40 bg-[#fe4e00]/10 text-[#fe4e00] hover:bg-[#fe4e00]/15"
                  : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08]"
              )}
            >
              {editMode ? <Check size={12} /> : <LayoutDashboard size={12} />}
              {editMode ? "Zapisz układ" : "Edytuj układ"}
            </button>
          </div>
        </div>
        {view.description && (
          <p className="mt-2 max-w-3xl text-sm text-white/40">{view.description}</p>
        )}
        {editMode && (
          <p className="mt-1.5 text-[11px] text-white/25">
            Tryb edycji — przeciągaj panele, zmieniaj rozmiar za prawy-dolny uchwyt.
          </p>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-5">
        {!editMode ? (
          /* ── Normal mode: CSS grid, panels fit their content exactly ── */
          <div className="grid grid-cols-3 gap-3.5 items-start">
            <div className="col-span-1 flex flex-col gap-3.5">
              {panels.meta}
              {panels["spec-snap"]}
              {panels.spec}
            </div>
            <div className="col-span-2 flex flex-col gap-3.5">
              {panels.stages}
              {panels.events}
            </div>
          </div>
        ) : (
          /* ── Edit mode: react-grid-layout for drag/resize ── */
          <div
            ref={containerRef as React.RefObject<HTMLDivElement>}
            className={cn("w-full", resizing && "order-rgl-resizing")}
          >
            {width > 0 && (
              <GridLayout
                width={width}
                layout={layout}
                cols={COLS}
                rowHeight={ROW_H}
                margin={MARGIN}
                containerPadding={[0, 0]}
                onLayoutChange={handleLayoutChange}
                onResizeStart={() => setResizing(true)}
                onResizeStop={() => setResizing(false)}
                isDraggable
                isResizable
                compactType="vertical"
                useCSSTransforms
              >
                {Object.entries(panels).map(([key, panel]) => (
                  <div key={key} className="cursor-grab active:cursor-grabbing relative">
                    <EditShell editing>
                      {panel ?? <div className="h-full rounded-xl border border-white/[0.07] bg-[#1a1a1a] flex items-center justify-center text-xs text-white/20">Brak danych</div>}
                    </EditShell>
                  </div>
                ))}
              </GridLayout>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
