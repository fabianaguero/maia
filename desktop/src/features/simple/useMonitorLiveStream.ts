import { useEffect, useRef, useState } from "react";

import type { LibraryTrack } from "../../types/library";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { MonitorDeckControls } from "./monitorDeckControls";
import { parseMonitorLogLine, type MonitorLogLine } from "./monitorLogParsing";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import {
  advanceActiveLogSignalBuffer,
  advanceIdleLogSignalBuffer,
  advanceSimulatedLogSignalBuffer,
  buildMonitorBootstrapLine,
  buildMonitorLiveStreamHookState,
  buildMonitorLiveStreamResetState,
  buildSimulatedMonitorLogLine,
  buildWaveformAnomalyMarkers,
  createMonitorSignalBuffer,
  resolveInitialSelectedAnomalyId,
  resolveMonitorWaveContext,
  sanitizeLiveLogStreamUpdate,
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

  useEffect(() => {
    liveSuggestedBpmRef.current = liveSuggestedBpm;
  }, [liveSuggestedBpm]);

  useEffect(() => {
    try {
      if (isListening) {
        lastStreamEventAtRef.current = Date.now();
        setLiveLines([
          buildMonitorBootstrapLine({
            sessionSourcePath,
            streamAdapterLabel,
          }),
        ]);
      } else {
        const resetState = buildMonitorLiveStreamResetState();
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
      const normalizedUpdate = sanitizeLiveLogStreamUpdate(update);
      const { parsedLines, cueBatch, anomalyMarkers, hasRealLines, hasMeaningfulUpdate } =
        normalizedUpdate;

      if (hasMeaningfulUpdate) {
        lastStreamEventAtRef.current = Date.now();
      }
      const controls = deckControlsRef.current;
      const reactivityMix = controls.reactivity / 100;
      const anomalyMix = controls.anomalyEmphasis / 100;

      setLiveSuggestedBpm(normalizedUpdate.suggestedBpm);

      const currentAudioContext = audioContextRef.current;
      if (currentAudioContext?.state === "running") {
        if (!audioProbePlayedRef.current) {
          audioProbePlayedRef.current = true;
          playTestTone();
        }
        const activeAudio = backgroundAudioRef.current;
        if (activeAudio && hasMeaningfulUpdate) {
          ensureBackgroundGraph(activeAudio, currentAudioContext);
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

      const parsed = parsedLines.map((raw, lineIndex) => parseMonitorLogLine(raw, lineIndex));
      const waveContext = resolveMonitorWaveContext({
        activeAudio: backgroundAudioRef.current,
        fallbackDurationSeconds: deckDurationSecondsRef.current,
        fallbackProgress: trackWaveProgressRef.current,
        liveSuggestedBpm: liveSuggestedBpmRef.current,
        trackBpm: activeTrackRef.current?.analysis?.bpm ?? null,
      });

      setLiveLines((prev) => [...prev, ...parsed].slice(-maxLiveLines));
      setWaveformAnomalies((prev) =>
        buildWaveformAnomalyMarkers({
          previous: prev,
          parsedLines: parsed,
          currentTrack: activeTrackRef.current,
          durationSeconds: waveContext.durationSeconds,
          bpm: waveContext.bpm,
          currentProgress: waveContext.currentProgress,
          beatSnapSubdivision: controls.beatSnapSubdivision,
        }),
      );

      setSelectedAnomalyId((current) => resolveInitialSelectedAnomalyId(current, parsed));

      setLogSignalBuffer((prev) =>
        advanceActiveLogSignalBuffer({
          previous: prev,
          cueBatch,
          anomalyMarkers,
          reactivityMix,
          anomalyMix,
        }),
      );
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
        return advanceIdleLogSignalBuffer({
          previous: prev,
          nowMs: now,
          idleMix,
          effectiveBpm,
        });
      });
    }, 450);

    return () => {
      window.clearInterval(timer);
    };
  }, [deckControlsRef, idleHoldMs, isListening, trackBpm]);

  const simulateLog = () => {
    const now = Date.now();
    const randomValue = Math.random();
    const mock: MonitorLogLine = buildSimulatedMonitorLogLine({
      nowMs: now,
      randomValue,
    });
    setLiveLines((prev) => [mock, ...prev].slice(0, 50));
    setLogSignalBuffer((prev) => advanceSimulatedLogSignalBuffer(prev, mock.level));
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
