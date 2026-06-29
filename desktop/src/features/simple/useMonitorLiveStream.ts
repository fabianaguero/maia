import { useEffect, useRef, useState } from "react";

import type { LibraryTrack } from "../../types/library";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { MonitorDeckControls } from "./monitorDeckControls";
import type { MonitorLogLine } from "./monitorLogParsing";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import {
  buildMonitorLiveStreamIdleState,
  buildMonitorLiveStreamUpdateState,
  buildSimulatedMonitorState,
} from "./monitorLiveStreamOrchestrationRuntime";
import {
  buildMonitorBootstrapLine,
  buildMonitorLiveStreamHookState,
  buildMonitorLiveStreamResetState,
  createMonitorSignalBuffer,
  shouldEmitMonitorCueAccent,
  type MonitorLogSignalPoint,
} from "./monitorLiveStreamRuntime";

interface UseMonitorLiveStreamOptions {
  isListening: boolean;
  sessionSourcePath?: string;
  streamAdapterLabel: string;
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  audioContextRef: { current: AudioContext | null };
  backgroundAudioRef: { current: HTMLAudioElement | null };
  backgroundGraphRef: { current: unknown };
  activeTrackRef: { current: LibraryTrack | null };
  deckDurationSecondsRef: { current: number | null };
  trackWaveProgressRef: { current: number };
  deckControlsRef: { current: MonitorDeckControls };
  trackBpm: number | null;
  ensureBackgroundGraph: (audio: HTMLAudioElement, context: AudioContext) => unknown;
  applyTrackMutation: (update: LiveLogStreamUpdate) => void;
  playTestTone: () => void;
  playCueBatch: (
    cues: Array<{
      noteHz?: number;
      gain?: number;
      durationMs?: number;
      waveform?: OscillatorType;
      accent?: string;
    }>,
  ) => void;
  idleHoldMs: number;
  maxLiveLines: number;
}

export function useMonitorLiveStream({
  isListening,
  sessionSourcePath,
  streamAdapterLabel,
  subscribe,
  audioContextRef,
  backgroundAudioRef,
  backgroundGraphRef,
  activeTrackRef,
  deckDurationSecondsRef,
  trackWaveProgressRef,
  deckControlsRef,
  trackBpm,
  ensureBackgroundGraph,
  applyTrackMutation,
  playTestTone,
  playCueBatch,
  idleHoldMs,
  maxLiveLines,
}: UseMonitorLiveStreamOptions) {
  const [liveLines, setLiveLines] = useState<MonitorLogLine[]>([]);
  const [logSignalBuffer, setLogSignalBuffer] = useState<MonitorLogSignalPoint[]>(
    createMonitorSignalBuffer(),
  );
  const [liveSuggestedBpm, setLiveSuggestedBpm] = useState<number | null>(null);
  const [waveformAnomalies, setWaveformAnomalies] = useState<WaveformAnomalyMarker[]>([]);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);

  const audioProbePlayedRef = useRef(false);
  const lastCueAccentAtRef = useRef(0);
  const lastStreamEventAtRef = useRef<number>(Date.now());
  const liveSuggestedBpmRef = useRef<number | null>(null);
  const liveLinesRef = useRef<MonitorLogLine[]>([]);
  const logSignalBufferRef = useRef<MonitorLogSignalPoint[]>(createMonitorSignalBuffer());
  const waveformAnomaliesRef = useRef<WaveformAnomalyMarker[]>([]);
  const selectedAnomalyIdRef = useRef<string | null>(null);

  useEffect(() => {
    liveSuggestedBpmRef.current = liveSuggestedBpm;
  }, [liveSuggestedBpm]);

  useEffect(() => {
    liveLinesRef.current = liveLines;
  }, [liveLines]);

  useEffect(() => {
    logSignalBufferRef.current = logSignalBuffer;
  }, [logSignalBuffer]);

  useEffect(() => {
    waveformAnomaliesRef.current = waveformAnomalies;
  }, [waveformAnomalies]);

  useEffect(() => {
    selectedAnomalyIdRef.current = selectedAnomalyId;
  }, [selectedAnomalyId]);

  useEffect(() => {
    try {
      if (isListening) {
        lastStreamEventAtRef.current = Date.now();
        const bootstrapLine = buildMonitorBootstrapLine({
          sessionSourcePath,
          streamAdapterLabel,
        });
        liveLinesRef.current = [bootstrapLine];
        setLiveLines(liveLinesRef.current);
      } else {
        const resetState = buildMonitorLiveStreamResetState();
        liveLinesRef.current = resetState.liveLines;
        logSignalBufferRef.current = resetState.logSignalBuffer;
        waveformAnomaliesRef.current = resetState.waveformAnomalies;
        selectedAnomalyIdRef.current = resetState.selectedAnomalyId;
        setLiveLines(resetState.liveLines);
        setLogSignalBuffer(resetState.logSignalBuffer);
        setLiveSuggestedBpm(resetState.liveSuggestedBpm);
        setWaveformAnomalies(resetState.waveformAnomalies);
        setSelectedAnomalyId(resetState.selectedAnomalyId);
        audioProbePlayedRef.current = false;
        lastStreamEventAtRef.current = Date.now();
      }
    } catch (error) {
      console.error("[MAIA:UI] live stream state reset failed", error);
    }
  }, [isListening, sessionSourcePath, streamAdapterLabel]);

  useEffect(() => {
    if (!isListening) {
      return;
    }

    const unsub = subscribe((update) => {
      const currentAudio = backgroundAudioRef.current;
      const updateState = buildMonitorLiveStreamUpdateState({
        update,
        currentTrack: activeTrackRef.current,
        activeAudio: currentAudio,
        fallbackDurationSeconds: deckDurationSecondsRef.current,
        fallbackProgress: trackWaveProgressRef.current,
        liveSuggestedBpm: liveSuggestedBpmRef.current,
        selectedAnomalyId: selectedAnomalyIdRef.current,
        controls: deckControlsRef.current,
        maxLiveLines,
        previousLiveLines: liveLinesRef.current,
        previousWaveformAnomalies: waveformAnomaliesRef.current,
        previousLogSignalBuffer: logSignalBufferRef.current,
      });
      const { cueBatch, hasRealLines, hasMeaningfulUpdate } = updateState.normalizedUpdate;

      if (hasMeaningfulUpdate) {
        lastStreamEventAtRef.current = Date.now();
      }
      const controls = deckControlsRef.current;

      setLiveSuggestedBpm(updateState.nextLiveSuggestedBpm);

      const currentAudioContext = audioContextRef.current;
      if (currentAudioContext?.state === "running") {
        if (!audioProbePlayedRef.current) {
          audioProbePlayedRef.current = true;
          playTestTone();
        }
        if (currentAudio && hasMeaningfulUpdate) {
          ensureBackgroundGraph(currentAudio, currentAudioContext);
          applyTrackMutation(update);
        }
        const hasBackgroundTrack = Boolean(
          backgroundGraphRef.current || backgroundAudioRef.current,
        );
        const nowMs = Date.now();
        if (
          shouldEmitMonitorCueAccent({
            update,
            cueBatch,
            controls,
            hasMeaningfulUpdate,
            hasBackgroundTrack,
            lastCueAccentAtMs: lastCueAccentAtRef.current,
            nowMs,
          })
        ) {
          lastCueAccentAtRef.current = nowMs;
          playCueBatch(cueBatch);
        }
      }

      if (!hasRealLines) {
        return;
      }

      liveLinesRef.current = updateState.nextLiveLines;
      waveformAnomaliesRef.current = updateState.nextWaveformAnomalies;
      selectedAnomalyIdRef.current = updateState.nextSelectedAnomalyId;
      logSignalBufferRef.current = updateState.nextLogSignalBuffer;
      setLiveLines(updateState.nextLiveLines);
      setWaveformAnomalies(updateState.nextWaveformAnomalies);
      setSelectedAnomalyId(updateState.nextSelectedAnomalyId);
      setLogSignalBuffer(updateState.nextLogSignalBuffer);
    });

    return unsub;
  }, [
    activeTrackRef,
    applyTrackMutation,
    audioContextRef,
    backgroundAudioRef,
    backgroundGraphRef,
    deckControlsRef,
    deckDurationSecondsRef,
    ensureBackgroundGraph,
    isListening,
    maxLiveLines,
    playCueBatch,
    playTestTone,
    subscribe,
    trackWaveProgressRef,
  ]);

  useEffect(() => {
    if (!isListening) {
      return;
    }

    const timer = window.setInterval(() => {
      const now = Date.now();
      const idleForMs = now - lastStreamEventAtRef.current;
      if (idleForMs < idleHoldMs) {
        return;
      }
      const controls = deckControlsRef.current;
      const idleMix = controls.idleMotion / 100;
      const effectiveBpm = liveSuggestedBpmRef.current ?? trackBpm;

      setLogSignalBuffer((prev) => {
        const nextBuffer = buildMonitorLiveStreamIdleState({
          previous: prev,
          nowMs: now,
          idleForMs,
          idleHoldMs,
          idleMix,
          effectiveBpm,
        });
        logSignalBufferRef.current = nextBuffer;
        return nextBuffer;
      });
    }, 450);

    return () => {
      window.clearInterval(timer);
    };
  }, [deckControlsRef, idleHoldMs, isListening, trackBpm]);

  const simulateLog = () => {
    const nextState = buildSimulatedMonitorState({
      nowMs: Date.now(),
      previousLiveLines: liveLinesRef.current,
      previousLogSignalBuffer: logSignalBufferRef.current,
      randomValue: Math.random(),
    });
    liveLinesRef.current = nextState.nextLiveLines;
    logSignalBufferRef.current = nextState.nextLogSignalBuffer;
    setLiveLines(nextState.nextLiveLines);
    setLogSignalBuffer(nextState.nextLogSignalBuffer);
  };

  return buildMonitorLiveStreamHookState({
    liveLines,
    logSignalBuffer,
    liveSuggestedBpm,
    waveformAnomalies,
    selectedAnomalyId,
    setSelectedAnomalyId,
    simulateLog,
  });
}
