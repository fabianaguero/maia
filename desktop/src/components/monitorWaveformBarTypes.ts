export interface WaveMetrics {
  low: number;
  mid: number;
  high: number;
}

export interface WaveColumn {
  source: WaveMetrics;
  processed: WaveMetrics;
  anomalyHeat: number;
  logLine: string | null;
}

export interface HUDLine {
  id: string;
  content: string;
  heat: number;
  timestamp: number;
}

export interface MonitorWaveformBandColors {
  low: string;
  mid: string;
  high: string;
}

export const MONITOR_WAVEFORM_HISTORY_SIZE = 400;
