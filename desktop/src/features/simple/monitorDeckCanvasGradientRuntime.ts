import type { MonitorDeckGradientStop, MonitorDeckRect } from "./monitorDeckMainCanvasSceneRuntime";

export function fillRect(context: CanvasRenderingContext2D, rect: MonitorDeckRect): void {
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
}

export function createVerticalGradient(
  context: CanvasRenderingContext2D,
  rect: MonitorDeckRect,
  stops: MonitorDeckGradientStop[],
): CanvasGradient {
  const gradient = context.createLinearGradient(0, rect.y, 0, rect.y + rect.height);
  stops.forEach((stop) => {
    gradient.addColorStop(stop.offset, stop.color);
  });
  return gradient;
}

export function createHorizontalGradient(
  context: CanvasRenderingContext2D,
  rect: MonitorDeckRect,
  stops: MonitorDeckGradientStop[],
): CanvasGradient {
  const gradient = context.createLinearGradient(rect.x, 0, rect.x + rect.width, 0);
  stops.forEach((stop) => {
    gradient.addColorStop(stop.offset, stop.color);
  });
  return gradient;
}

export function fillVerticalGradientRect(
  context: CanvasRenderingContext2D,
  rect: MonitorDeckRect,
  stops: MonitorDeckGradientStop[],
): void {
  context.fillStyle = createVerticalGradient(context, rect, stops);
  fillRect(context, rect);
}

export function fillHorizontalGradientRect(
  context: CanvasRenderingContext2D,
  rect: MonitorDeckRect,
  stops: MonitorDeckGradientStop[],
): void {
  context.fillStyle = createHorizontalGradient(context, rect, stops);
  fillRect(context, rect);
}
