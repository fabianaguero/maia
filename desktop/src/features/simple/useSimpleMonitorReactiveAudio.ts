import { useEffect, useEffectEvent, useRef } from "react";

import { buildMonitorTrackMutationPlan } from "./monitorAudioMutation";
import type { MonitorDeckControls } from "./monitorDeckControls";
import {
  buildAdjustedMonitorTrackMutationPlan,
  createDriveCurve,
} from "./monitorTrackMutationRuntime";
import type { LiveLogMarker } from "../../types/monitor";
import {
  applyMonitorReactiveAudioPlan,
  buildSimpleMonitorReactiveAudioHookState,
  type BackgroundTrackGraph,
} from "./simpleMonitorReactiveAudioRuntime";

interface UseSimpleMonitorReactiveAudioInput {
  audioContext: AudioContext | null;
  isListening: boolean;
  deckControls: MonitorDeckControls;
}

export function useSimpleMonitorReactiveAudio({
  audioContext,
  isListening,
  deckControls,
}: UseSimpleMonitorReactiveAudioInput) {
  const backgroundGraphRef = useRef<BackgroundTrackGraph | null>(null);
  const audioContextRef = useRef<AudioContext | null>(audioContext);
  const deckControlsRef = useRef<MonitorDeckControls>(deckControls);
  const smoothedPressureRef = useRef(0);

  useEffect(() => {
    audioContextRef.current = audioContext;
  }, [audioContext]);

  useEffect(() => {
    deckControlsRef.current = deckControls;
  }, [deckControls]);

  useEffect(() => {
    if (!isListening) {
      smoothedPressureRef.current = 0;
      backgroundGraphRef.current = null;
    }
  }, [isListening]);

  const playTestTone = useEffectEvent(() => {
    const currentAudioContext = audioContextRef.current;
    if (!currentAudioContext || currentAudioContext.state !== "running") {
      return;
    }

    const masterVolume = deckControlsRef.current.masterVolume;
    const accentLevel = Math.max(0.03, Math.min(0.22, masterVolume * 0.35));
    const now = currentAudioContext.currentTime + 0.02;
    [164.81, 220, 329.63].forEach((frequency, index) => {
      const osc = currentAudioContext.createOscillator();
      const gain = currentAudioContext.createGain();
      const startAt = now + index * 0.16;
      osc.type = index === 2 ? "triangle" : "sawtooth";
      osc.frequency.setValueAtTime(frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.linearRampToValueAtTime(accentLevel, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);
      osc.connect(gain);
      gain.connect(currentAudioContext.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.24);
    });
  });

  const playCueBatch = useEffectEvent((
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

    const masterVolume = deckControlsRef.current.masterVolume;
    const now = currentAudioContext.currentTime + 0.03;
    cues.slice(0, 2).forEach((cue, index) => {
      const osc = currentAudioContext.createOscillator();
      const gain = currentAudioContext.createGain();
      const startAt = now + index * 0.05;
      const noteHz = typeof cue.noteHz === "number" ? cue.noteHz : 180 + index * 30;
      const duration = Math.max(0.12, (cue.durationMs ?? 140) / 1000);
      const level = backgroundGraphRef.current
        ? Math.max(0.0012, Math.min(0.01, (cue.gain ?? 0.04) * 0.05 * (0.35 + masterVolume)))
        : Math.max(0.01, Math.min(0.08, (cue.gain ?? 0.08) * 0.72 * (0.45 + masterVolume)));
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
  });

  const ensureBackgroundGraph = useEffectEvent((
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
      outputGain.gain.value = Math.max(0.04, deckControlsRef.current.masterVolume);

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
  });

  const applyTrackMutation = useEffectEvent((
    update: {
      lineCount?: number;
      anomalyCount?: number;
      levelCounts?: Record<string, number>;
      anomalyMarkers?: LiveLogMarker[];
    },
    backgroundAudioRef: { current: HTMLAudioElement | null },
  ) => {
    const graph = backgroundGraphRef.current;
    const audio = backgroundAudioRef.current;
    if (!graph || !audio || graph.context.state !== "running") {
      return;
    }

    const plan = buildMonitorTrackMutationPlan(update, smoothedPressureRef.current);
    const controls = deckControlsRef.current;
    const masterVolume = Math.max(0.04, controls.masterVolume);
    const adjustedPlan = buildAdjustedMonitorTrackMutationPlan({
      plan,
      controls,
    });
    smoothedPressureRef.current = adjustedPlan.nextPressure;
    applyMonitorReactiveAudioPlan({
      graph,
      adjustedPlan,
      masterVolume,
      audio,
    });
  });

  return buildSimpleMonitorReactiveAudioHookState({
    backgroundGraphRef,
    audioContextRef,
    deckControlsRef,
    ensureBackgroundGraph,
    applyTrackMutation,
    playTestTone,
    playCueBatch,
  });
}
