import type { PrintArea, PrintFormat, TextElement, ImageElement } from "@/store/printCreator";

export interface Rect {
  x: number; // mm
  y: number;
  w: number;
  h: number;
}

export const PAPER_DIMS: Record<PrintFormat, { w: number; h: number }> = {
  a4:     { w: 210, h: 297 },
  a3:     { w: 297, h: 420 },
  a2:     { w: 420, h: 594 },
  custom: { w: 100, h: 100 },
};

/** Returns the safe print area rect in mm. */
export function getPrintAreaRect(area: PrintArea, paperW: number, paperH: number): Rect {
  return {
    x: area.marginLeft,
    y: area.marginTop,
    w: paperW - area.marginLeft - area.marginRight,
    h: paperH - area.marginTop  - area.marginBottom,
  };
}

/** True when the element's anchor point falls outside the safe area. */
export function isTextOutOfBounds(text: TextElement, area: Rect): boolean {
  return (
    text.x < area.x ||
    text.y < area.y ||
    text.x > area.x + area.w ||
    text.y > area.y + area.h
  );
}

/** True when any corner of the image (ignoring rotation) is outside the safe area. */
export function isImageOutOfBounds(img: ImageElement, area: Rect): boolean {
  const right  = img.x + img.width;
  const bottom = img.y + img.height;
  return (
    img.x  < area.x ||
    img.y  < area.y ||
    right  > area.x + area.w ||
    bottom > area.y + area.h
  );
}

/** Clamps a position so the element's anchor stays inside the safe area. */
export function clampPosition(
  x: number,
  y: number,
  area: Rect,
  elW = 0,
  elH = 0,
): { x: number; y: number } {
  return {
    x: Math.min(Math.max(x, area.x), area.x + area.w - elW),
    y: Math.min(Math.max(y, area.y), area.y + area.h - elH),
  };
}
