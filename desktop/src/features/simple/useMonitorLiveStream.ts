import { useEffect, useRef, useState } from "react";

import type {
  LibraryTrack,
  LiveLogCue,
  LiveLogMarker,
  LiveLogStreamUpdate,
} from "../../types/library";
import { getBasename } from "./monitorDisplay";
import type { MonitorDeckControls } from "./monitorDeckControls";
import { parseMonitorLogLine, type MonitorLogLine } from "./monitorLogParsing";
import { quantizeProgressToBeatGrid, type WaveformAnomalyMarker } from "./monitorDeckViewModel";
import { resolveBurstFactor } from "./monitorAudioMutation";

const MONITOR_LIVE_LINES_LIMIT = 1_200;

export interface MonitorLogSignalPoint {
  val: number;
  heat: number;
}

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
}: UseMonitorLiveStreamOptions) {
  const [liveLines, setLiveLines] = useState<MonitorLogLine[]>([]);
  const [logSignalBuffer, setLogSignalBuffer] = useState<MonitorLogSignalPoint[]>(
    new Array(120).fill({ val: 10, heat: 0 }),
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
          {
            id: "maia-monitor-init",
            timestamp: new Date().toLocaleTimeString().split(" ")[0],
            level: "info",
            message: `MAIA_MONITOR_INITIALIZED: ${streamAdapterLabel} armed. Listening to ${getBasename(sessionSourcePath)}...`,
            isAnomaly: false,
            anomalyId: null,
          },
        ]);
      } else {
        setLiveLines([]);
        setLogSignalBuffer(new Array(120).fill({ val: 10, heat: 0 }));
        setLiveSuggestedBpm(null);
        setWaveformAnomalies([]);
        setSelectedAnomalyId(null);
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
      const parsedLines: string[] = Array.isArray(update.parsedLines) ? update.parsedLines : [];
      const cueBatch: LiveLogCue[] = Array.isArray(update.sonificationCues)
        ? update.sonificationCues
        : [];
      const anomalyMarkers: LiveLogMarker[] = Array.isArray(update.anomalyMarkers)
        ? update.anomalyMarkers
        : [];
      const hasRealLines = parsedLines.length > 0;
      const hasRealSignals =
        (update.lineCount ?? 0) > 0 || anomalyMarkers.length > 0 || cueBatch.length > 0;
      const hasMeaningfulUpdate = Boolean(update.hasData && (hasRealLines || hasRealSignals));

      if (hasMeaningfulUpdate) {
        lastStreamEventAtRef.current = Date.now();
      }
      const controls = deckControlsRef.current;
      const reactivityMix = controls.reactivity / 100;
      const anomalyMix = controls.anomalyEmphasis / 100;

      setLiveSuggestedBpm(
        typeof update.suggestedBpm === "number" && Number.isFinite(update.suggestedBpm)
          ? update.suggestedBpm
          : null,
      );

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
        const lineCount = Math.max(1, update.lineCount ?? 0);
        const anomalyPressure = Math.max(
          (update.anomalyCount ?? 0) / lineCount,
          ((update.levelCounts?.ERROR ?? update.levelCounts?.error ?? 0) +
            (update.levelCounts?.WARN ?? update.levelCounts?.warn ?? 0) * 0.4) /
            lineCount,
        );
        const burstFactor = resolveBurstFactor(update.anomalyMarkers);
        const anomalyDrivenCue =
          cueBatch.find((cue) => cue.accent === "anomaly") ??
          cueBatch.find((cue) => (cue.gain ?? 0) >= 0.12) ??
          null;
        const cueCooldownMs = controls.cueCooldownMs;
        const anomalyPressureThreshold = 0.38 - anomalyMix * 0.2;
        const burstSuppressionThreshold = 0.8 - reactivityMix * 0.12;
        if (
          hasMeaningfulUpdate &&
          anomalyPressure >= anomalyPressureThreshold &&
          burstFactor < burstSuppressionThreshold &&
          anomalyDrivenCue &&
          (!hasBackgroundTrack || nowMs - lastCueAccentAtRef.current >= cueCooldownMs)
        ) {
          lastCueAccentAtRef.current = nowMs;
          playCueBatch(cueBatch);
        }
      }

      if (!hasRealLines) {
        return;
      }

      const parsed = parsedLines.map((raw, lineIndex) => parseMonitorLogLine(raw, lineIndex));

      setLiveLines((prev) => [...prev, ...parsed].slice(-MONITOR_LIVE_LINES_LIMIT));
      setWaveformAnomalies((prev) => {
        const retained = prev.filter((marker) => marker.progress >= 0 && marker.progress <= 1);
        const anomalyLines = parsed.filter((line) => line.isAnomaly && line.anomalyId);
        const currentTrack = activeTrackRef.current;
        const durationSeconds =
          backgroundAudioRef.current?.duration ?? deckDurationSecondsRef.current;
        const beatGrid = currentTrack?.analysis?.beatGrid ?? currentTrack?.beatGrid ?? [];
        const bpm = liveSuggestedBpmRef.current ?? currentTrack?.analysis?.bpm ?? null;
        const currentProgress = backgroundAudioRef.current?.duration
          ? Math.max(
              0,
              Math.min(
                1,
                backgroundAudioRef.current.currentTime / backgroundAudioRef.current.duration,
              ),
            )
          : trackWaveProgressRef.current;
        const nextMarkers = anomalyLines.slice(0, 3).map((line, index) => ({
          id: line.anomalyId ?? `${line.id}-marker`,
          lineId: line.id,
          timestamp: line.timestamp,
          message: line.message,
          severity: line.level === "error" ? 1 : 0.72,
          progress: quantizeProgressToBeatGrid(
            Math.max(0, Math.min(1, currentProgress + index * 0.0025)),
            durationSeconds,
            bpm,
            beatGrid,
            controls.beatSnapSubdivision,
          ),
        }));

        return [...retained, ...nextMarkers].slice(-24);
      });

      if (parsed.some((line) => line.isAnomaly && line.anomalyId)) {
        const firstAnomaly = parsed.find((line) => line.isAnomaly && line.anomalyId);
        if (firstAnomaly?.anomalyId) {
          setSelectedAnomalyId((current) => current ?? firstAnomaly.anomalyId);
        }
      }

      setLogSignalBuffer((prev) => {
        let val = 20;
        let heat = 0;

        if (cueBatch.length > 0 || anomalyMarkers.length > 0) {
          const avgGain =
            cueBatch.length > 0
              ? cueBatch.reduce((sum, cue) => sum + (cue.gain ?? 0), 0) / cueBatch.length
              : 0;
          val = 20 + Math.min(120, avgGain * 150 * (0.45 + reactivityMix * 0.85));
          heat =
            anomalyMarkers.length > 0
              ? Math.min(
                  1,
                  (0.28 + Math.min(0.72, anomalyMarkers.length * 0.1)) * (0.35 + anomalyMix * 0.65),
                )
              : 0;
        } else {
          val = 24 + Math.random() * (6 + reactivityMix * 10);
        }

        const nextBuffer = [...prev];
        for (let index = 0; index < 60; index += 1) {
          nextBuffer[index] = prev[index + 1] || { val: 20, heat: 0 };
        }
        const previousCenter = prev[60] || { val: 20, heat: 0 };
        nextBuffer[60] = {
          val: previousCenter.val * 0.52 + val * 0.48,
          heat: previousCenter.heat * 0.35 + heat * 0.65,
        };
        for (let index = 61; index < 120; index += 1) {
          const decay = 1 - (index - 60) / 60;
          const eased = Math.max(0, decay * decay);
          const prevFuture = prev[index] || { val: 20, heat: 0 };
          nextBuffer[index] = {
            val: 20 + (nextBuffer[60].val - 20) * eased * 0.52 + (prevFuture.val - 20) * 0.26,
            heat: nextBuffer[60].heat * eased * 0.62 + prevFuture.heat * 0.18,
          };
        }
        return nextBuffer;
      });
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
      if (idleForMs < 900) {
        return;
      }
      const controls = deckControlsRef.current;
      const idleMix = controls.idleMotion / 100;
      const effectiveBpm = liveSuggestedBpmRef.current ?? trackBpm;

      setLogSignalBuffer((prev) => {
        const idlePulse =
          18 +
          Math.sin(now / 420) * (1 + idleMix * 5) +
          Math.sin(now / 880) * (0.6 + idleMix * 2.8) +
          (typeof effectiveBpm === "number"
            ? Math.sin((now / 60000) * effectiveBpm * Math.PI * 2) * (0.5 + idleMix * 2.2)
            : 0);
        const nextBuffer = [...prev];
        for (let index = 0; index < 60; index += 1) {
          nextBuffer[index] = prev[index + 1] || { val: 20, heat: 0 };
        }
        const previousCenter = prev[60] || { val: 20, heat: 0 };
        nextBuffer[60] = {
          val: previousCenter.val * (0.9 - idleMix * 0.22) + idlePulse * (0.1 + idleMix * 0.22),
          heat: previousCenter.heat * (0.82 - idleMix * 0.22),
        };
        for (let index = 61; index < 120; index += 1) {
          const decay = 1 - (index - 60) / 60;
          const eased = Math.max(0, decay * decay);
          const future = prev[index] || { val: 20, heat: 0 };
          nextBuffer[index] = {
            val:
              20 +
              (nextBuffer[60].val - 20) * eased * (0.16 + idleMix * 0.38) +
              (future.val - 20) * (0.48 - idleMix * 0.2),
            heat: future.heat * (0.82 - idleMix * 0.18),
          };
        }
        return nextBuffer;
      });
    }, 450);

    return () => {
      window.clearInterval(timer);
    };
  }, [deckControlsRef, isListening, trackBpm]);

  const simulateLog = () => {
    const levels: MonitorLogLine["level"][] = ["info", "warn", "error", "debug"];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const messages = [
      "SYNTH_PULSE_DETECTED: Signal strength at 89%",
      "NODE_HANDSHAKE: Peer connection established",
      "ANOMALY_TRIGGER: Out-of-bounds telemetry detected",
      "BUFFER_FLUSH: Real-time stream synchronized",
      "MAIA_CORE: Sonification engine optimized",
    ];
    const now = Date.now();
    const mock: MonitorLogLine = {
      id: `sim-${now}`,
      timestamp: new Date().toLocaleTimeString().split(" ")[0],
      level,
      message: messages[Math.floor(Math.random() * messages.length)]!,
      isAnomaly: level === "error" || level === "warn",
      anomalyId: level === "error" || level === "warn" ? `sim-anomaly-${now}` : null,
    };
    setLiveLines((prev) => [mock, ...prev].slice(0, 50));
    setLogSignalBuffer((prev) => {
      const heat = level === "error" ? 1 : level === "warn" ? 0.5 : 0;
      const val = 40 + heat * 100;
      const nextBuffer = [...prev];
      for (let index = 0; index < 60; index += 1) {
        nextBuffer[index] = prev[index + 1] || { val: 20, heat: 0 };
      }
      nextBuffer[60] = { val, heat };
      for (let index = 61; index < 120; index += 1) {
        nextBuffer[index] = { val: 20, heat: 0 };
      }
      return nextBuffer;
    });
  };

  return {
    liveLines,
    logSignalBuffer,
    liveSuggestedBpm,
    waveformAnomalies,
    selectedAnomalyId,
    setSelectedAnomalyId,
    simulateLog,
  };
}
