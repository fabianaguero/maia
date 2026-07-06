import type { ApplyMonitorLiveStreamSubscriptionUpdateResult } from "./monitorLiveStreamSubscriptionRuntime";
import type { MonitorLogLine } from "./monitorLogParsing";
import type { MonitorLogSignalPoint } from "./monitorLiveStreamRuntime";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";

export function applyMonitorLiveStreamSubscriptionResult(input: {
  result: ApplyMonitorLiveStreamSubscriptionUpdateResult;
  nowMs: number;
  refs: {
    lastStreamEventAtRef: { current: number };
    audioProbePlayedRef: { current: boolean };
    lastCueAccentAtRef: { current: number };
    liveLinesRef: { current: MonitorLogLine[] };
    waveformAnomaliesRef: { current: WaveformAnomalyMarker[] };
    selectedAnomalyIdRef: { current: string | null };
    logSignalBufferRef: { current: MonitorLogSignalPoint[] };
  };
  setters: {
    setLiveSuggestedBpm: (value: number | null) => void;
    setLiveLines: (value: MonitorLogLine[]) => void;
    setWaveformAnomalies: (value: WaveformAnomalyMarker[]) => void;
    setSelectedAnomalyId: (value: string | null) => void;
    setLogSignalBuffer: (value: MonitorLogSignalPoint[]) => void;
  };
}) {
  if (input.result.shouldTrackStreamEventAt) {
    input.refs.lastStreamEventAtRef.current = input.nowMs;
  }

  input.setters.setLiveSuggestedBpm(input.result.nextLiveSuggestedBpm);
  input.refs.audioProbePlayedRef.current = input.result.nextAudioProbePlayed;
  input.refs.lastCueAccentAtRef.current = input.result.nextLastCueAccentAtMs;

  if (
    !input.result.nextLiveLines ||
    !input.result.nextWaveformAnomalies ||
    !input.result.nextLogSignalBuffer
  ) {
    return;
  }

  input.refs.liveLinesRef.current = input.result.nextLiveLines;
  input.refs.waveformAnomaliesRef.current = input.result.nextWaveformAnomalies;
  input.refs.selectedAnomalyIdRef.current = input.result.nextSelectedAnomalyId;
  input.refs.logSignalBufferRef.current = input.result.nextLogSignalBuffer;
  input.setters.setLiveLines(input.result.nextLiveLines);
  input.setters.setWaveformAnomalies(input.result.nextWaveformAnomalies);
  input.setters.setSelectedAnomalyId(input.result.nextSelectedAnomalyId);
  input.setters.setLogSignalBuffer(input.result.nextLogSignalBuffer);
}
