import { useEffect, useEffectEvent, useRef } from "react";

import { buildMonitorTrackMutationPlan } from "./monitorAudioMutation";
import type { MonitorDeckControls } from "./monitorDeckControls";
import {
  buildAdjustedMonitorTrackMutationPlan,
  createDriveCurve,
} from "./monitorTrackMutationRuntime";
import {
  buildSimpleMonitorCueBatchPlan,
  buildSimpleMonitorTestTonePlan,
  hasRunningSimpleMonitorAudioContext,
  shouldReuseSimpleMonitorBackgroundGraph,
} from "./simpleMonitorReactiveAudioOrchestrationRuntime";
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
    if (!hasRunningSimpleMonitorAudioContext(currentAudioContext)) {
      return;
    }

    buildSimpleMonitorTestTonePlan({
      masterVolume: deckControlsRef.current.masterVolume,
      now: currentAudioContext.currentTime,
    }).forEach((voice) => {
      const osc = currentAudioContext.createOscillator();
      const gain = currentAudioContext.createGain();
      osc.type = voice.type;
      osc.frequency.setValueAtTime(voice.frequency, voice.startAt);
      gain.gain.setValueAtTime(0.0001, voice.startAt);
      gain.gain.linearRampToValueAtTime(voice.peakGain, voice.startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, voice.releaseAt);
      osc.connect(gain);
      gain.connect(currentAudioContext.destination);
      osc.start(voice.startAt);
      osc.stop(voice.stopAt);
    });
  });

  const playCueBatch = useEffectEvent(
    (
      cues: Array<{
        noteHz?: number;
        gain?: number;
        durationMs?: number;
        waveform?: OscillatorType;
        accent?: string;
      }>,
    ) => {
      const currentAudioContext = audioContextRef.current;
      if (!hasRunningSimpleMonitorAudioContext(currentAudioContext)) {
        return;
      }

      buildSimpleMonitorCueBatchPlan({
        cues,
        masterVolume: deckControlsRef.current.masterVolume,
        hasBackgroundGraph: Boolean(backgroundGraphRef.current),
        now: currentAudioContext.currentTime,
      }).forEach((voice) => {
        const osc = currentAudioContext.createOscillator();
        const gain = currentAudioContext.createGain();
        osc.type = voice.type;
        osc.frequency.setValueAtTime(voice.frequency, voice.startAt);
        gain.gain.setValueAtTime(0.0001, voice.startAt);
        gain.gain.linearRampToValueAtTime(voice.peakGain, voice.startAt + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, voice.releaseAt);
        osc.connect(gain);
        gain.connect(currentAudioContext.destination);
        osc.start(voice.startAt);
        osc.stop(voice.stopAt);
      });
    },
  );

  const ensureBackgroundGraph = useEffectEvent(
    (audio: HTMLAudioElement, context: AudioContext): BackgroundTrackGraph | null => {
      const existing = backgroundGraphRef.current;
      if (
        shouldReuseSimpleMonitorBackgroundGraph({
          existing,
          context,
          audio,
        })
      ) {
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
    },
  );

  const applyTrackMutation = useEffectEvent(
    (
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
    },
  );

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
