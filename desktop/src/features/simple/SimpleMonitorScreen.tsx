import React, { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";

import type { ActiveMonitorSession, MonitorMetrics } from "../monitor/MonitorContext";
import { listLogSourceConnections } from "../../api/repositories";
import type { PersistedSession } from "../../api/sessions";
import { useT } from "../../i18n/I18nContext";
import { getStreamAdapterCode } from "../../utils/monitorLabels";
import type {
  LibraryTrack,
  LiveLogStreamUpdate,
  LiveLogMarker,
  LogSourceConnection,
  RepositoryAnalysis,
} from "../../types/library";
import { getTrackTitle as getLibraryTrackTitle } from "../../utils/track";
import { buildMonitorTrackMutationPlan } from "./monitorAudioMutation";
import { renderMonitorDeckCanvas, renderMonitorOverviewCanvas } from "./monitorDeckCanvas";
import type { MonitorDeckControls } from "./monitorDeckControls";
import { useMonitorDeckControls } from "./useMonitorDeckControls";
import { useMonitorDeckScrub } from "./useMonitorDeckScrub";
import { useMonitorLiveStream } from "./useMonitorLiveStream";
import { useMonitorTrackAudio } from "./useMonitorTrackAudio";
import { SimpleMonitorActiveView } from "./SimpleMonitorActiveView";
import { SimpleMonitorIdleView } from "./SimpleMonitorIdleView";
import {
  buildDeckBeatMarkers,
  buildDeckTimelineMarkers,
  buildMonitorDeckDerivedState,
  resolveVisibleWindowSeconds,
  sampleTrackWaveWindow,
} from "./monitorDeckViewModel";
import { sortMonitorSessions } from "./monitorSessions";
import {
  buildMonitorSourceCopy,
  buildMonitorSourceSelectionModel,
  shouldResetSelectedSource,
  type MonitorLaunchSource,
  type MonitorSourceFilter,
} from "./monitorSourceOptions";
import {
  buildSimpleMonitorScreenViewModel,
  resolveSimpleMonitorActiveTrack,
} from "./simpleMonitorViewModel";

interface SimpleMonitorScreenProps {
  session: ActiveMonitorSession | null;
  metrics: MonitorMetrics;
  pastSessions: PersistedSession[];
  repositories: RepositoryAnalysis[];
  tracks: LibraryTrack[];
  onStop: () => void;
  onResumeAudio: () => Promise<void> | void;
  audioStatus: AudioContextState;
  audioContext: AudioContext | null;
  onStartMonitoring: (source: MonitorLaunchSource, trackId?: string) => void | Promise<void>;
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => void;
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  trackName?: string;
  waveformBins?: number[]; // New prop
  isConsoleExpanded?: boolean;
  onToggleConsole?: () => void;
}

interface BackgroundTrackGraph {
  context: AudioContext;
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  filter: BiquadFilterNode;
  dryGain: GainNode;
  driveNode: WaveShaperNode;
  driveWetGain: GainNode;
  outputGain: GainNode;
  deckGain: GainNode;
}

function getTrackTitle(track: LibraryTrack): string {
  return getLibraryTrackTitle(track);
}

function createDriveCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 2048;
  const curve = new Float32Array(samples);
  const drive = Math.max(0.1, amount);
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / (samples - 1) - 1;
    curve[i] = Math.tanh(x * drive);
  }
  return curve as Float32Array<ArrayBuffer>;
}

function safeElementScrollTo(element: HTMLDivElement, top: number, behavior: ScrollBehavior): void {
  if (typeof element.scrollTo === "function") {
    element.scrollTo({ top, behavior });
    return;
  }

  element.scrollTop = top;
}

const SAFE_MONITOR_RUNTIME = false;

export function SimpleMonitorScreen({
  session,
  metrics,
  pastSessions,
  repositories,
  tracks,
  onStop,
  onResumeAudio,
  audioStatus,
  audioContext,
  onStartMonitoring,
  onReplaySession,
  subscribe,
  trackName,
  waveformBins,
  isConsoleExpanded = false,
  onToggleConsole,
}: SimpleMonitorScreenProps) {
  const t = useT();
  const isListening = !!session;
  const safePastSessions = Array.isArray(pastSessions) ? pastSessions : [];
  const safeRepositories = Array.isArray(repositories) ? repositories : [];
  const safeTracks = Array.isArray(tracks) ? tracks : [];
  const [persistentConnections, setPersistentConnections] = useState<LogSourceConnection[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [selectedSoundId, setSelectedSoundId] = useState("");
  const [sourceFilter, setSourceFilter] = useState<MonitorSourceFilter>("all");
  const [isLaunchingMonitor, setIsLaunchingMonitor] = useState(false);
  const [isAnomalyFilterActive, setIsAnomalyFilterActive] = useState(false);
  const [trackWaveProgress, setTrackWaveProgress] = useState(0);
  const [trackElapsedSeconds, setTrackElapsedSeconds] = useState(0);
  const [trackDurationSeconds, setTrackDurationSeconds] = useState<number | null>(null);
  const backgroundGraphRef = useRef<BackgroundTrackGraph | null>(null);
  const audioContextRef = useRef<AudioContext | null>(audioContext);
  const { deckControls } = useMonitorDeckControls();
  const deckControlsRef = useRef<MonitorDeckControls>(deckControls);
  const smoothedPressureRef = useRef(0);
  const terminalLinesRef = useRef<HTMLDivElement | null>(null);
  const isTailPinnedRef = useRef(true);
  const focusSelectedLogRef = useRef(false);
  const lineRefs = useRef(new Map<string, HTMLDivElement>());
  const activeTrack = resolveSimpleMonitorActiveTrack(safeTracks, trackName, session?.trackName);
  const deckDurationSeconds =
    trackDurationSeconds ?? activeTrack?.analysis?.durationSeconds ?? null;
  const activeBeatGrid = activeTrack?.analysis?.beatGrid ?? activeTrack?.beatGrid ?? [];
  const streamAdapterLabel = getStreamAdapterCode(session?.adapterKind);
  const isMonitorActive = isListening || isLaunchingMonitor;
  const activeTrackRef = useRef(activeTrack);
  const deckDurationSecondsRef = useRef(deckDurationSeconds);
  const trackWaveProgressRef = useRef(trackWaveProgress);

  useEffect(() => {
    if (isListening) {
      setIsLaunchingMonitor(false);
    }
  }, [isListening]);

  useEffect(() => {
    activeTrackRef.current = activeTrack;
  }, [activeTrack]);

  useEffect(() => {
    deckDurationSecondsRef.current = deckDurationSeconds;
  }, [deckDurationSeconds]);

  useEffect(() => {
    trackWaveProgressRef.current = trackWaveProgress;
  }, [trackWaveProgress]);

  useEffect(() => {
    audioContextRef.current = audioContext;
  }, [audioContext]);

  useEffect(() => {
    deckControlsRef.current = deckControls;
  }, [deckControls]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const nextConnections = await listLogSourceConnections();
        if (!cancelled) {
          setPersistentConnections(Array.isArray(nextConnections) ? nextConnections : []);
        }
      } catch {
        if (!cancelled) {
          setPersistentConnections([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const {
    filteredMonitorSourceOptions,
    selectedSourceOption,
    canStartSelectedSource,
    sourceEmptyMessage,
    startHint,
  } = buildMonitorSourceSelectionModel({
    repositories: safeRepositories,
    persistentConnections,
    selectedSourceId,
    selectedSoundId,
    sourceFilter,
    copy: buildMonitorSourceCopy(t),
  });
  const launchingSource = selectedSourceOption;
  const waveformScale = deckControls.waveformScale;

  useEffect(() => {
    if (shouldResetSelectedSource(selectedSourceId, selectedSourceOption, sourceFilter)) {
      setSelectedSourceId("");
    }
  }, [selectedSourceId, selectedSourceOption, sourceFilter]);

  const playTestTone = () => {
    const currentAudioContext = audioContextRef.current;
    if (!currentAudioContext || currentAudioContext.state !== "running") {
      return;
    }

    const now = currentAudioContext.currentTime + 0.02;
    [164.81, 220, 329.63].forEach((frequency, index) => {
      const osc = currentAudioContext.createOscillator();
      const gain = currentAudioContext.createGain();
      const startAt = now + index * 0.16;
      osc.type = index === 2 ? "triangle" : "sawtooth";
      osc.frequency.setValueAtTime(frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.linearRampToValueAtTime(0.14, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);
      osc.connect(gain);
      gain.connect(currentAudioContext.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.24);
    });
  };

  const playCueBatch = (
    cues: Array<{
      noteHz?: number;
      gain?: number;
      durationMs?: number;
      waveform?: OscillatorType;
      accent?: string;
    }>,
  ) => {
    const currentAudioContext = audioContextRef.current;
    if (!currentAudioContext || currentAudioContext.state !== "running") {
      return;
    }

    const now = currentAudioContext.currentTime + 0.03;
    cues.slice(0, 2).forEach((cue, index) => {
      const osc = currentAudioContext.createOscillator();
      const gain = currentAudioContext.createGain();
      const startAt = now + index * 0.05;
      const noteHz = typeof cue.noteHz === "number" ? cue.noteHz : 180 + index * 30;
      const duration = Math.max(0.12, (cue.durationMs ?? 140) / 1000);
      const level = backgroundGraphRef.current
        ? Math.max(0.0012, Math.min(0.0045, (cue.gain ?? 0.04) * 0.05))
        : Math.max(0.012, Math.min(0.06, (cue.gain ?? 0.08) * 0.72));
      osc.type = cue.waveform ?? (index === 0 ? "triangle" : "sine");
      osc.frequency.setValueAtTime(noteHz, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.linearRampToValueAtTime(level, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      osc.connect(gain);
      gain.connect(currentAudioContext.destination);
      osc.start(startAt);
      osc.stop(startAt + duration + 0.03);
    });
  };

  const ensureBackgroundGraph = (
    audio: HTMLAudioElement,
    context: AudioContext,
  ): BackgroundTrackGraph | null => {
    const existing = backgroundGraphRef.current;
    if (existing && existing.context === context && existing.audio === audio) {
      return existing;
    }

    try {
      const source = context.createMediaElementSource(audio);
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 18000;
      filter.Q.value = 1;

      const dryGain = context.createGain();
      dryGain.gain.value = 1;

      const driveNode = context.createWaveShaper();
      driveNode.curve = createDriveCurve(1.2);
      driveNode.oversample = "4x";

      const driveWetGain = context.createGain();
      driveWetGain.gain.value = 0.0001;

      const outputGain = context.createGain();
      outputGain.gain.value = 0.82;

      const deckGain = context.createGain();
      deckGain.gain.value = 1;

      source.connect(filter);
      filter.connect(dryGain);
      dryGain.connect(outputGain);
      filter.connect(driveNode);
      driveNode.connect(driveWetGain);
      driveWetGain.connect(outputGain);
      outputGain.connect(deckGain);
      deckGain.connect(context.destination);

      const graph = {
        context,
        audio,
        source,
        filter,
        dryGain,
        driveNode,
        driveWetGain,
        outputGain,
        deckGain,
      };
      backgroundGraphRef.current = graph;
      return graph;
    } catch (error) {
      console.warn("Simple monitor graph setup failed", error);
      return null;
    }
  };

  const applyTrackMutation = (update: {
    lineCount?: number;
    anomalyCount?: number;
    levelCounts?: Record<string, number>;
    anomalyMarkers?: LiveLogMarker[];
  }) => {
    const graph = backgroundGraphRef.current;
    const audio = backgroundAudioRef.current;
    if (!graph || !audio || graph.context.state !== "running") {
      return;
    }

    const plan = buildMonitorTrackMutationPlan(update, smoothedPressureRef.current);
    const controls = deckControlsRef.current;
    const reactivityMix = controls.reactivity / 100;
    const anomalyMix = controls.anomalyEmphasis / 100;
    const neutralFilterHz = 18000;
    const neutralFilterQ = 1;
    const neutralOutputGain = 0.82;
    const neutralDryGain = 1;
    const neutralDriveWet = 0.0001;
    const neutralDeckGain = 1;
    const neutralDriveCurve = 1.02;
    const neutralRecoverAt = 0.22;
    const neutralTransition = 0.18;
    const adjustedPlan = {
      ...plan,
      filterHz: neutralFilterHz - (neutralFilterHz - plan.filterHz) * reactivityMix,
      filterQ: neutralFilterQ + (plan.filterQ - neutralFilterQ) * reactivityMix,
      outputGain: neutralOutputGain + (plan.outputGain - neutralOutputGain) * reactivityMix,
      dryGain: neutralDryGain + (plan.dryGain - neutralDryGain) * reactivityMix,
      driveWet:
        neutralDriveWet +
        (plan.driveWet - neutralDriveWet) * reactivityMix * (0.35 + anomalyMix * 0.65),
      deckGain: neutralDeckGain + (plan.deckGain - neutralDeckGain) * reactivityMix,
      driveCurveAmount:
        neutralDriveCurve +
        (plan.driveCurveAmount - neutralDriveCurve) * reactivityMix * (0.4 + anomalyMix * 0.6),
      recoverAtOffsetSec:
        neutralRecoverAt + (plan.recoverAtOffsetSec - neutralRecoverAt) * reactivityMix,
      transitionSec: neutralTransition + (plan.transitionSec - neutralTransition) * reactivityMix,
      gateFloor:
        plan.gateFloor === null
          ? null
          : neutralDeckGain -
            (neutralDeckGain - plan.gateFloor) * reactivityMix * (0.5 + anomalyMix * 0.5),
    };
    smoothedPressureRef.current = adjustedPlan.nextPressure;
    if (adjustedPlan.mode === "neutral") {
      const now = graph.context.currentTime;
      graph.filter.frequency.cancelScheduledValues(now);
      graph.filter.frequency.setValueAtTime(graph.filter.frequency.value, now);
      graph.filter.frequency.exponentialRampToValueAtTime(
        adjustedPlan.filterHz,
        now + adjustedPlan.recoverAtOffsetSec,
      );

      graph.filter.Q.cancelScheduledValues(now);
      graph.filter.Q.setValueAtTime(graph.filter.Q.value, now);
      graph.filter.Q.linearRampToValueAtTime(
        adjustedPlan.filterQ,
        now + adjustedPlan.recoverAtOffsetSec,
      );

      graph.outputGain.gain.cancelScheduledValues(now);
      graph.outputGain.gain.setValueAtTime(graph.outputGain.gain.value, now);
      graph.outputGain.gain.linearRampToValueAtTime(
        adjustedPlan.outputGain,
        now + adjustedPlan.transitionSec,
      );

      graph.dryGain.gain.cancelScheduledValues(now);
      graph.dryGain.gain.setValueAtTime(graph.dryGain.gain.value, now);
      graph.dryGain.gain.linearRampToValueAtTime(
        adjustedPlan.dryGain,
        now + adjustedPlan.transitionSec,
      );

      graph.driveWetGain.gain.cancelScheduledValues(now);
      graph.driveWetGain.gain.setValueAtTime(graph.driveWetGain.gain.value, now);
      graph.driveWetGain.gain.linearRampToValueAtTime(
        adjustedPlan.driveWet,
        now + adjustedPlan.transitionSec,
      );

      graph.deckGain.gain.cancelScheduledValues(now);
      graph.deckGain.gain.setValueAtTime(graph.deckGain.gain.value, now);
      graph.deckGain.gain.linearRampToValueAtTime(
        adjustedPlan.deckGain,
        now + adjustedPlan.transitionSec,
      );

      graph.driveNode.curve = createDriveCurve(adjustedPlan.driveCurveAmount);
      audio.playbackRate = adjustedPlan.playbackRate;
      return;
    }
    const now = graph.context.currentTime;
    const recoverAt = now + adjustedPlan.recoverAtOffsetSec;

    graph.filter.frequency.cancelScheduledValues(now);
    graph.filter.frequency.setValueAtTime(graph.filter.frequency.value, now);
    graph.filter.frequency.exponentialRampToValueAtTime(
      adjustedPlan.filterHz,
      now + (adjustedPlan.sustainedBurst ? 0.5 : 0.32),
    );
    graph.filter.frequency.exponentialRampToValueAtTime(18000, recoverAt);

    graph.filter.Q.cancelScheduledValues(now);
    graph.filter.Q.setValueAtTime(graph.filter.Q.value, now);
    graph.filter.Q.linearRampToValueAtTime(
      adjustedPlan.filterQ,
      now + (adjustedPlan.sustainedBurst ? 0.42 : 0.28),
    );
    graph.filter.Q.linearRampToValueAtTime(1, recoverAt);

    graph.outputGain.gain.cancelScheduledValues(now);
    graph.outputGain.gain.setValueAtTime(graph.outputGain.gain.value, now);
    graph.outputGain.gain.linearRampToValueAtTime(
      adjustedPlan.outputGain,
      now + (adjustedPlan.sustainedBurst ? 0.38 : 0.26),
    );
    graph.outputGain.gain.linearRampToValueAtTime(0.82, recoverAt);

    graph.dryGain.gain.cancelScheduledValues(now);
    graph.dryGain.gain.setValueAtTime(graph.dryGain.gain.value, now);
    graph.dryGain.gain.linearRampToValueAtTime(
      adjustedPlan.dryGain,
      now + (adjustedPlan.sustainedBurst ? 0.38 : 0.26),
    );
    graph.dryGain.gain.linearRampToValueAtTime(1, recoverAt);

    graph.driveWetGain.gain.cancelScheduledValues(now);
    graph.driveWetGain.gain.setValueAtTime(graph.driveWetGain.gain.value, now);
    graph.driveWetGain.gain.linearRampToValueAtTime(
      adjustedPlan.driveWet,
      now + (adjustedPlan.sustainedBurst ? 0.34 : 0.24),
    );
    graph.driveWetGain.gain.linearRampToValueAtTime(0.0001, recoverAt);

    graph.driveNode.curve = createDriveCurve(adjustedPlan.driveCurveAmount);

    graph.deckGain.gain.cancelScheduledValues(now);
    graph.deckGain.gain.setValueAtTime(graph.deckGain.gain.value, now);
    graph.deckGain.gain.linearRampToValueAtTime(
      adjustedPlan.deckGain,
      now + (adjustedPlan.sustainedBurst ? 0.34 : 0.22),
    );
    graph.deckGain.gain.linearRampToValueAtTime(1, recoverAt);

    if (adjustedPlan.gateFloor !== null) {
      const pulseAt = now + 0.22;
      graph.deckGain.gain.linearRampToValueAtTime(adjustedPlan.gateFloor, pulseAt + 0.08);
      graph.deckGain.gain.linearRampToValueAtTime(adjustedPlan.deckGain, pulseAt + 0.34);
    }

    audio.playbackRate = adjustedPlan.playbackRate;
  };
  const { backgroundAudioRef, previewTrackId, toggleTrackPreview } = useMonitorTrackAudio({
    audioContext,
    isListening,
    safeRuntime: SAFE_MONITOR_RUNTIME,
    safeTracks,
    sessionTrackName: session?.trackName,
    getTrackTitle,
    ensureBackgroundGraph,
    setTrackWaveProgress,
    setTrackElapsedSeconds,
    setTrackDurationSeconds,
  });
  const {
    liveLines,
    logSignalBuffer,
    liveSuggestedBpm,
    waveformAnomalies,
    selectedAnomalyId,
    setSelectedAnomalyId,
    simulateLog,
  } = useMonitorLiveStream({
    isListening,
    sessionSourcePath: session?.sourcePath,
    streamAdapterLabel,
    subscribe,
    audioContextRef,
    backgroundAudioRef,
    backgroundGraphRef,
    activeTrackRef,
    deckDurationSecondsRef,
    trackWaveProgressRef,
    deckControlsRef,
    trackBpm: activeTrack?.analysis?.bpm ?? null,
    ensureBackgroundGraph,
    applyTrackMutation,
    playTestTone,
    playCueBatch,
  });
  const deckBpm = liveSuggestedBpm ?? activeTrack?.analysis?.bpm ?? null;
  const {
    overviewCanvasRef,
    waveformCanvasRef,
    waveformStageRef,
    handleOverviewPointerDown,
    handleOverviewClick,
    handleOverviewAnomalyClick,
    handleOverviewAnomalyPointerDown,
    handleStagePointerDown,
    handleStageClick,
  } = useMonitorDeckScrub({
    backgroundAudioRef,
    waveformAnomalies,
    trackWaveProgress,
    setTrackWaveProgress,
    setTrackElapsedSeconds,
    isConsoleExpanded,
    onToggleConsole,
    onSelectAnomalyForFocus: (anomalyId) => {
      focusSelectedLogRef.current = true;
      setSelectedAnomalyId(anomalyId);
    },
  });

  useEffect(() => {
    try {
      if (!isListening) {
        setTrackElapsedSeconds(0);
        setTrackDurationSeconds(null);
        setTrackWaveProgress(0);
        smoothedPressureRef.current = 0;
        backgroundGraphRef.current = null;
      }
    } catch (error) {
      console.error("[MAIA:UI] monitor reset effect failed", error);
      backgroundGraphRef.current = null;
    }
  }, [isListening]);

  useEffect(() => {
    const container = terminalLinesRef.current;
    if (!container) {
      return;
    }

    if (focusSelectedLogRef.current && selectedAnomalyId) {
      const line = liveLines.find((entry) => entry.anomalyId === selectedAnomalyId);
      if (line) {
        const node = lineRefs.current.get(line.id);
        if (node) {
          node.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
      focusSelectedLogRef.current = false;
      return;
    }

    if (isTailPinnedRef.current) {
      safeElementScrollTo(container, container.scrollHeight, "auto");
    }
  }, [liveLines, selectedAnomalyId]);

  const {
    monitorSourceTitle,
    monitorSourcePath,
    monitorTrackTitle,
    isConnectingMonitor,
    uptimeLabel,
    deckRemainingSeconds,
  } = buildSimpleMonitorScreenViewModel({
    session,
    launchingSource,
    isLaunchingMonitor,
    selectedSoundId,
    tracks: safeTracks,
    trackName,
    t,
    nowMs: Date.now(),
    totalAnomalies: metrics.totalAnomalies,
    trackElapsedSeconds,
    deckDurationSeconds,
  });
  const visibleWindowSeconds = resolveVisibleWindowSeconds(deckBpm, activeBeatGrid);
  const trackWaveSamples = sampleTrackWaveWindow(
    waveformBins ?? null,
    trackWaveProgress,
    deckDurationSeconds,
    deckBpm,
    activeBeatGrid,
  );
  const deckTimelineMarkers = buildDeckTimelineMarkers(
    trackWaveProgress,
    deckDurationSeconds,
    deckBpm,
    activeBeatGrid,
  );
  const deckBeatMarkers = buildDeckBeatMarkers(
    trackWaveProgress,
    deckDurationSeconds,
    deckBpm,
    activeBeatGrid,
  );
  const {
    overviewWaveSamples,
    overviewAnomalyDensity,
    anomalyBurstRegions,
    overviewWindowWidthPercent,
    overviewWindowLeftPercent,
    overviewPlayheadLeftPercent,
    logWaveOverlay,
    overviewAnomalyMarkers,
    selectedDeckMarker,
    selectedBurstRegion,
  } = buildMonitorDeckDerivedState({
    waveformBins,
    waveformAnomalies,
    trackWaveProgress,
    deckDurationSeconds,
    visibleWindowSeconds,
    logSignalBuffer,
    selectedAnomalyId,
  });
  const sortedPastSessions = sortMonitorSessions(safePastSessions);

  const handleStartMonitoringRequest = async () => {
    if (!selectedSourceOption || !selectedSoundId || !canStartSelectedSource) {
      return;
    }

    try {
      flushSync(() => {
        setIsLaunchingMonitor(true);
      });
      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });
      await onResumeAudio();
      await onStartMonitoring(selectedSourceOption, selectedSoundId);
    } catch (error) {
      console.error("Failed to start monitor from selector", error);
      setIsLaunchingMonitor(false);
    }
  };

  useEffect(() => {
    if (SAFE_MONITOR_RUNTIME) {
      return;
    }
    const canvas = overviewCanvasRef.current;
    if (!canvas) {
      return;
    }

    renderMonitorOverviewCanvas({
      canvas,
      overviewWaveSamples,
      overviewAnomalyDensity,
      anomalyBurstRegions,
      waveformAnomalies,
      selectedDeckMarker,
    });
  }, [
    anomalyBurstRegions,
    overviewAnomalyDensity,
    overviewWaveSamples,
    overviewCanvasRef,
    selectedDeckMarker,
    waveformAnomalies,
  ]);

  useEffect(() => {
    if (SAFE_MONITOR_RUNTIME) {
      return;
    }
    const canvas = waveformCanvasRef.current;
    const stage = waveformStageRef.current;
    if (!canvas || !stage) {
      return;
    }
    renderMonitorDeckCanvas({
      canvas,
      stage,
      trackWaveSamples,
      logWaveOverlay,
      anomalyBurstRegions,
      selectedDeckMarker,
      waveformAnomalies,
      trackWaveProgress,
    });
  }, [
    anomalyBurstRegions,
    logWaveOverlay,
    selectedDeckMarker,
    trackWaveSamples,
    trackWaveProgress,
    waveformCanvasRef,
    waveformAnomalies,
    waveformScale,
    waveformStageRef,
  ]);

  return (
    <div className="simple-monitor-screen">
      {isMonitorActive ? (
        <SimpleMonitorActiveView
          isConnectingMonitor={isConnectingMonitor}
          monitorSourceTitle={monitorSourceTitle}
          monitorSourcePath={monitorSourcePath}
          isAnomalyFilterActive={isAnomalyFilterActive}
          onToggleAnomalyFilter={() => {
            setIsAnomalyFilterActive((value) => !value);
            if (!isConsoleExpanded) {
              onToggleConsole?.();
            }
          }}
          onClearAnomalyFilter={() => setIsAnomalyFilterActive(false)}
          totalAnomalies={metrics.totalAnomalies}
          uptimeLabel={uptimeLabel}
          onStop={onStop}
          isConsoleExpanded={isConsoleExpanded}
          onToggleConsole={onToggleConsole}
          onRefresh={() => window.location.reload()}
          onSimulateLog={simulateLog}
          terminalLinesRef={terminalLinesRef}
          onTerminalScroll={(event) => {
            const target = event.currentTarget;
            const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
            isTailPinnedRef.current = distanceFromBottom <= 8;
          }}
          liveLines={liveLines}
          streamAdapterLabel={streamAdapterLabel}
          selectedAnomalyId={selectedAnomalyId}
          onSelectAnomalyLine={(anomalyId) => {
            focusSelectedLogRef.current = true;
            setSelectedAnomalyId(anomalyId);
          }}
          registerLineRef={(lineId, node) => {
            if (node) {
              lineRefs.current.set(lineId, node);
            } else {
              lineRefs.current.delete(lineId);
            }
          }}
          monitorTrackTitle={monitorTrackTitle}
          musicStyleLabel={activeTrack?.tags?.musicStyleLabel}
          deckBpm={deckBpm}
          trackElapsedSeconds={trackElapsedSeconds}
          deckRemainingSeconds={deckRemainingSeconds}
          selectedDeckMarker={selectedDeckMarker}
          selectedBurstCount={selectedBurstRegion?.count ?? null}
          overviewCanvasRef={overviewCanvasRef}
          waveformCanvasRef={waveformCanvasRef}
          waveformStageRef={waveformStageRef}
          anomalyBurstRegions={anomalyBurstRegions}
          selectedBurstRegionId={selectedBurstRegion?.id ?? null}
          overviewAnomalyMarkers={overviewAnomalyMarkers}
          overviewWindowLeftPercent={overviewWindowLeftPercent}
          overviewWindowWidthPercent={overviewWindowWidthPercent}
          overviewPlayheadLeftPercent={overviewPlayheadLeftPercent}
          onOverviewPointerDown={handleOverviewPointerDown}
          onOverviewClick={handleOverviewClick}
          onOverviewAnomalyClick={handleOverviewAnomalyClick}
          onOverviewAnomalyPointerDown={handleOverviewAnomalyPointerDown}
          deckTimelineMarkers={deckTimelineMarkers}
          deckBeatMarkers={deckBeatMarkers}
          onStagePointerDown={handleStagePointerDown}
          onStageClick={handleStageClick}
          stageHeightPx={190 * waveformScale}
          trackFooterText={trackName || t.simpleMode.monitor.noTrackSelected}
          audioStatus={audioStatus}
          onResumeAudio={onResumeAudio}
        />
      ) : (
        <SimpleMonitorIdleView
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          filteredMonitorSourceOptions={filteredMonitorSourceOptions}
          selectedSourceId={selectedSourceId}
          onSelectSourceId={setSelectedSourceId}
          sourceEmptyMessage={sourceEmptyMessage}
          tracks={safeTracks}
          selectedSoundId={selectedSoundId}
          onSelectSoundId={setSelectedSoundId}
          getTrackTitle={getTrackTitle}
          previewTrackId={previewTrackId}
          onToggleTrackPreview={toggleTrackPreview}
          canStartSelectedSource={canStartSelectedSource}
          startHint={startHint}
          isLaunchingMonitor={isLaunchingMonitor}
          onStartMonitoringRequest={handleStartMonitoringRequest}
          sessions={sortedPastSessions}
          onReplaySession={onReplaySession}
        />
      )}
    </div>
  );
}
