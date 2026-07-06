import type { LibraryTrack } from "../../types/library";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { MonitorCueBatchPlayer } from "./monitorCueBatchTypes";
import type { MonitorDeckControls } from "./monitorDeckControls";
import type { MonitorLogLine } from "./monitorLogParsing";
import type { MonitorLogSignalPoint } from "./monitorLiveStreamRuntime";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";

export interface UseMonitorLiveStreamSubscriptionInput {
  isListening: boolean;
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  audioContextRef: { current: AudioContext | null };
  backgroundAudioRef: { current: HTMLAudioElement | null };
  backgroundGraphRef: { current: unknown };
  activeTrackRef: { current: LibraryTrack | null };
  deckDurationSecondsRef: { current: number | null };
  trackWaveProgressRef: { current: number };
  deckControlsRef: { current: MonitorDeckControls };
  maxLiveLines: number;
  liveSuggestedBpmRef: { current: number | null };
  liveLinesRef: { current: MonitorLogLine[] };
  logSignalBufferRef: { current: MonitorLogSignalPoint[] };
  waveformAnomaliesRef: { current: WaveformAnomalyMarker[] };
  selectedAnomalyIdRef: { current: string | null };
  audioProbePlayedRef: { current: boolean };
  lastCueAccentAtRef: { current: number };
  lastStreamEventAtRef: { current: number };
  ensureBackgroundGraph: (audio: HTMLAudioElement, context: AudioContext) => unknown;
  applyTrackMutation: (update: LiveLogStreamUpdate) => void;
  playTestTone: () => void;
  playCueBatch: MonitorCueBatchPlayer;
  setLiveSuggestedBpm: (value: number | null) => void;
  setLiveLines: (value: MonitorLogLine[]) => void;
  setWaveformAnomalies: (value: WaveformAnomalyMarker[]) => void;
  setSelectedAnomalyId: (value: string | null) => void;
  setLogSignalBuffer: (value: MonitorLogSignalPoint[]) => void;
}
