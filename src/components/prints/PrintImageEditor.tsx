"use client";

import Image from "next/image";
import { ImageElement, usePrintCreator } from "@/store/printCreator";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { PAPER_DIMS, getPrintAreaRect, clampPosition, isImageOutOfBounds } from "@/lib/printAreaUtils";

interface Props {
  image: ImageElement;
}

export function PrintImageEditor({ image }: Props) {
  const update    = usePrintCreator((s) => s.updateImageElement);
  const remove    = usePrintCreator((s) => s.deleteImageElement);
  const select    = usePrintCreator((s) => s.select);
  const printArea = usePrintCreator((s) => s.config.printArea);
  const format    = usePrintCreator((s) => s.config.format);

  const paperDims = PAPER_DIMS[format];
  const areaRect  = getPrintAreaRect(printArea, paperDims.w, paperDims.h);
  const oob       = printArea.enabled && printArea.mode === "warn" && isImageOutOfBounds(image, areaRect);

  function moveX(raw: number) {
    const x = printArea.enabled && printArea.mode === "lock"
      ? clampPosition(raw, image.y, areaRect, image.width, image.height).x
      : raw;
    update(image.id, { x });
  }
  function moveY(raw: number) {
    const y = printArea.enabled && printArea.mode === "lock"
      ? clampPosition(image.x, raw, areaRect, image.width, image.height).y
      : raw;
    update(image.id, { y });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">Edycja grafiki</h3>
          {oob && (
            <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400">
              ⚠ poza obszarem
            </span>
          )}
        </div>
        <button onClick={() => select(null)} className="text-white/40 hover:text-white transition-colors">✕</button>
      </div>

      <Card>
        <CardBody className="flex items-center gap-3">
          <div className="relative w-16 h-16 shrink-0 rounded-lg border border-white/[0.1] overflow-hidden bg-white/[0.04]">
            <Image src={image.src} alt={image.name} fill className="object-contain" unoptimized />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{image.name}</p>
            <p className="text-xs text-white/40">{image.width.toFixed(0)}×{image.height.toFixed(0)} mm</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pozycja</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">X: {image.x.toFixed(1)} mm</label>
            <input type="range" min="0" max="200" step="0.5" value={image.x}
              onChange={(e) => moveX(parseFloat(e.target.value))}
              className="w-full accent-[#fe4e00]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Y: {image.y.toFixed(1)} mm</label>
            <input type="range" min="0" max="287" step="0.5" value={image.y}
              onChange={(e) => moveY(parseFloat(e.target.value))}
              className="w-full accent-[#fe4e00]" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Rozmiar</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Szerokość: {image.width.toFixed(0)} mm</label>
            <input type="range" min="5" max="200" step="1" value={image.width}
              onChange={(e) => update(image.id, { width: parseFloat(e.target.value) })}
              className="w-full accent-[#fe4e00]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Wysokość: {image.height.toFixed(0)} mm</label>
            <input type="range" min="5" max="280" step="1" value={image.height}
              onChange={(e) => update(image.id, { height: parseFloat(e.target.value) })}
              className="w-full accent-[#fe4e00]" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Transformacja</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Obrót: {image.rotation}°</label>
            <input type="range" min="0" max="360" value={image.rotation}
              onChange={(e) => update(image.id, { rotation: parseInt(e.target.value) })}
              className="w-full accent-[#fe4e00]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Przezroczystość: {Math.round(image.opacity * 100)}%
            </label>
            <input type="range" min="0.05" max="1" step="0.05" value={image.opacity}
              onChange={(e) => update(image.id, { opacity: parseFloat(e.target.value) })}
              className="w-full accent-[#fe4e00]" />
          </div>
        </CardBody>
      </Card>

      <button
        onClick={() => { remove(image.id); select(null); }}
        className="w-full rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
      >
        🗑 Usuń grafikę
      </button>
    </div>
  );
}
