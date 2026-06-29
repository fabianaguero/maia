import type { AppTranslations } from "../i18n/en";
import {
  buildAlertChannelBars,
  buildLogChannelBars,
  type MiniBarStyle,
} from "./waveformBarViewModel";

export interface BuildWaveformBarViewModelInput {
  t: AppTranslations;
  isActive?: boolean;
  source?: string | null;
  anomalies?: number | null;
  uptime?: string | null;
  random?: () => number;
}

export interface WaveformBarViewModel {
  sourceLabel: string;
  anomaliesValue: number;
  uptimeLabel: string;
  logBars: MiniBarStyle[];
  alertBars: MiniBarStyle[];
}

export function buildWaveformBarViewModel(
  input: BuildWaveformBarViewModelInput,
): WaveformBarViewModel | null {
  const isActive = input.isActive ?? true;
  if (!isActive) {
    return null;
  }

  const random = input.random ?? Math.random;
  const anomaliesValue = Math.max(0, Math.floor(input.anomalies ?? 0));
  const sourceLabel = input.source?.trim() || input.t.simpleMode.common.unknown;
  const uptimeLabel = input.uptime?.trim() || "0s";

  return {
    sourceLabel,
    anomaliesValue,
    uptimeLabel,
    logBars: buildLogChannelBars(12, isActive, random),
    alertBars: buildAlertChannelBars(12, isActive, anomaliesValue, random),
  };
}
