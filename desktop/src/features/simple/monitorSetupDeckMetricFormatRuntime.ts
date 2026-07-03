import type { AppTranslations } from "../../i18n/en";
import type { MonitorDeckControls } from "./monitorDeckControls";

export function formatMonitorDeckBeatSnap(value: number, t: AppTranslations): string {
  if (value === 0.5) {
    return t.simpleMode.deckSetup.beatHalf;
  }
  if (value === 0.125) {
    return t.simpleMode.deckSetup.beatEighth;
  }
  return t.simpleMode.deckSetup.beatQuarter;
}

export function formatMonitorDeckCooldown(value: number): string {
  return `${Math.round(value / 100) / 10}s`;
}

export function formatMonitorDeckWaveZoom(value: number): string {
  return `${value.toFixed(1)}x`;
}

export function formatMonitorDeckMasterVolume(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatMonitorDeckDuckingIntensity(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatMonitorDeckRecoveryRelease(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatMonitorDeckAlertShape(
  value: MonitorDeckControls["alertShape"],
  t: AppTranslations,
): string {
  switch (value) {
    case "soft":
      return t.simpleMode.deckSetup.alertShapeSoft;
    case "aggressive":
      return t.simpleMode.deckSetup.alertShapeAggressive;
    case "tight":
    default:
      return t.simpleMode.deckSetup.alertShapeTight;
  }
}
