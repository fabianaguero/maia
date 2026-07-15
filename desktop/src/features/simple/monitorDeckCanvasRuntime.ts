export const MONITOR_TRACK_STRIP_MULTIPLIER = 3;

export interface MonitorDeckCanvasSize {
  width: number;
  height: number;
  dpr: number;
}

export interface MonitorDeckOverviewLayout {
  trackFloorY: number;
  trackAmplitude: number;
  anomalyBandTop: number;
  anomalyBandHeight: number;
}

export interface MonitorDeckMainLayout {
  headerInset: number;
  footerInset: number;
  deckHeight: number;
  trackBaseY: number;
  trackAmplitude: number;
  logBaseY: number;
  logAmplitude: number;
  separatorY: number;
  centerBandHeight: number;
}

export function resolveMonitorDeckCanvasSize(input: {
  width: number;
  height: number;
  dpr?: number;
}): MonitorDeckCanvasSize {
  return {
    width: Math.max(1, Math.floor(input.width)),
    height: Math.max(1, Math.floor(input.height)),
    dpr: input.dpr && Number.isFinite(input.dpr) && input.dpr > 0 ? input.dpr : 1,
  };
}

export function buildMonitorOverviewLayout(
  width: number,
  height: number,
): MonitorDeckOverviewLayout {
  const safeHeight = Math.max(1, height);
  const trackFloorY = Math.max(14, safeHeight * 0.58);
  const anomalyBandTop = Math.max(trackFloorY + 3, safeHeight * 0.68);

  return {
    trackFloorY,
    trackAmplitude: Math.max(7, trackFloorY - 6),
    anomalyBandTop,
    anomalyBandHeight: Math.max(6, safeHeight - anomalyBandTop - 3),
  };
}

export function buildMonitorDeckLayout(width: number, height: number): MonitorDeckMainLayout {
  const safeHeight = Math.max(1, height);
  const headerInset = Math.max(46, safeHeight * 0.16);
  const footerInset = Math.max(10, safeHeight * 0.08);
  const deckHeight = Math.max(48, safeHeight - headerInset - footerInset);

  return {
    headerInset,
    footerInset,
    deckHeight,
    trackBaseY: headerInset + deckHeight * 0.22,
    trackAmplitude: Math.max(12, deckHeight * 0.16),
    logBaseY: headerInset + deckHeight * 0.94,
    logAmplitude: Math.max(24, deckHeight * 0.38),
    separatorY: headerInset + deckHeight * 0.52,
    centerBandHeight: Math.max(2, safeHeight * 0.012),
  };
}

export function resolveMonitorDeckRelativePosition(
  progress: number,
  currentProgress: number,
  multiplier = MONITOR_TRACK_STRIP_MULTIPLIER,
): number {
  return 0.5 + (progress - currentProgress) * multiplier;
}

export function isMonitorDeckRelativePositionVisible(relative: number, padding = 0.08): boolean {
  return relative >= -padding && relative <= 1 + padding;
}

export function resolveMonitorDeckVisibleRange(input: {
  startProgress: number;
  endProgress: number;
  currentProgress: number;
  width: number;
  multiplier?: number;
}): {
  leftX: number;
  rightX: number;
  visibleLeft: number;
  visibleWidth: number;
  isVisible: boolean;
} {
  const multiplier = input.multiplier ?? MONITOR_TRACK_STRIP_MULTIPLIER;
  const leftRelative = resolveMonitorDeckRelativePosition(
    input.startProgress,
    input.currentProgress,
    multiplier,
  );
  const rightRelative = resolveMonitorDeckRelativePosition(
    input.endProgress,
    input.currentProgress,
    multiplier,
  );
  const leftX = leftRelative * input.width;
  const rightX = rightRelative * input.width;
  const visibleLeft = Math.max(0, leftX);
  const visibleWidth = Math.min(input.width, rightX) - visibleLeft;

  return {
    leftX,
    rightX,
    visibleLeft,
    visibleWidth,
    isVisible: visibleWidth > 0 && rightX >= 0 && leftX <= input.width,
  };
}
