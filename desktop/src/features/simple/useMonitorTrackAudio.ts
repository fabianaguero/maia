import { useEffect, useRef, useState } from "react";

import type { LibraryTrack } from "../../types/library";
import { resolvePreviewAudioUrl, revokePreviewAudioUrl } from "../../utils/audioPreview";
import { resolvePlayableTrackPath } from "../../utils/track";
import {
  disposeMonitorAudio,
  prepareBackgroundMonitorAudio,
  readMonitorTrackAudioSnapshot,
  stopMonitorAudio,
} from "./monitorTrackAudioRuntime";
import {
  buildMonitorPreviewEndedState,
  buildMonitorTrackAudioResetState,
  buildMonitorTrackProgressState,
  resolveMonitorPreviewAction,
  shouldBindMonitorBackgroundTrack,
  shouldStartMonitorProgressLoop,
} from "./monitorTrackAudioOrchestrationRuntime";

function safeRevokePreviewAudioUrl(url: string | null | undefined): void {
  if (!url) {
    return;
  }

  try {
    revokePreviewAudioUrl(url);
  } catch (error) {
    console.warn("Preview URL revoke skipped", error);
  }
}

interface UseMonitorTrackAudioOptions {
  audioContext: AudioContext | null;
  isListening: boolean;
  safeRuntime: boolean;
  activeTrack: LibraryTrack | null;
  ensureBackgroundGraph: (audio: HTMLAudioElement, context: AudioContext) => unknown;
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  setTrackDurationSeconds: (value: number | null) => void;
}

export function useMonitorTrackAudio({
  audioContext,
  isListening,
  safeRuntime,
  activeTrack,
  ensureBackgroundGraph,
  setTrackWaveProgress,
  setTrackElapsedSeconds,
  setTrackDurationSeconds,
}: UseMonitorTrackAudioOptions) {
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const backgroundAudioUrlRef = useRef<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);

  const toggleTrackPreview = async (track: LibraryTrack) => {
    const playablePath = resolvePlayableTrackPath(track);
    const previewAction = resolveMonitorPreviewAction({
      playablePath,
      previewTrackId,
      nextTrackId: track.id,
      hasPreviewAudio: Boolean(previewAudioRef.current),
    });

    if (previewAction === "skip") {
      return;
    }

    if (!playablePath) {
      return;
    }

    if (previewAction === "stop-current-preview") {
      previewAudioRef.current = disposeMonitorAudio(
        previewAudioRef.current,
        previewUrlRef.current,
        safeRevokePreviewAudioUrl,
      );
      previewUrlRef.current = null;
      setPreviewTrackId(null);
      return;
    }

    if (previewAction === "replace-preview") {
      previewAudioRef.current = disposeMonitorAudio(
        previewAudioRef.current,
        previewUrlRef.current,
        safeRevokePreviewAudioUrl,
      );
      previewUrlRef.current = null;
    }

    const previewUrl = await resolvePreviewAudioUrl(playablePath);
    previewUrlRef.current = previewUrl;
    const nextAudio = new Audio(previewUrl);
    nextAudio.volume = 0.92;
    nextAudio.preload = "auto";
    previewAudioRef.current = nextAudio;
    setPreviewTrackId(track.id);
    nextAudio.addEventListener(
      "ended",
      () => {
        if (previewAudioRef.current === nextAudio) {
          const endedState = buildMonitorPreviewEndedState();
          previewAudioRef.current = endedState.clearPreviewAudio ? null : previewAudioRef.current;
          safeRevokePreviewAudioUrl(previewUrlRef.current);
          previewUrlRef.current = endedState.previewUrl;
          setPreviewTrackId(endedState.previewTrackId);
        }
      },
      { once: true },
    );

    try {
      await nextAudio.play();
    } catch (error) {
      console.warn("Track preview playback failed", error);
      if (previewAudioRef.current === nextAudio) {
        previewAudioRef.current = null;
      }
      safeRevokePreviewAudioUrl(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewTrackId(null);
    }
  };

  useEffect(() => {
    if (safeRuntime) {
      return;
    }

    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current = disposeMonitorAudio(
          previewAudioRef.current,
          previewUrlRef.current,
          safeRevokePreviewAudioUrl,
        );
      }
      previewUrlRef.current = null;
    };
  }, [safeRuntime]);

  useEffect(() => {
    if (!isListening) {
      const resetState = buildMonitorTrackAudioResetState();
      const audio = backgroundAudioRef.current;
      if (audio) {
        stopMonitorAudio(audio);
      }
      if (resetState.clearBackgroundAudio) {
        backgroundAudioRef.current = null;
      }
      if (resetState.clearBackgroundUrl) {
        safeRevokePreviewAudioUrl(backgroundAudioUrlRef.current);
        backgroundAudioUrlRef.current = null;
      }
      setTrackWaveProgress(resetState.trackWaveProgress);
      setTrackElapsedSeconds(resetState.trackElapsedSeconds);
      setTrackDurationSeconds(resetState.trackDurationSeconds);
    }
  }, [isListening, setTrackDurationSeconds, setTrackElapsedSeconds, setTrackWaveProgress]);

  useEffect(() => {
    if (!shouldStartMonitorProgressLoop({ safeRuntime, isListening })) {
      setTrackWaveProgress(0);
      return;
    }

    let frameId = 0;
    const updateProgress = () => {
      const snapshot = readMonitorTrackAudioSnapshot(backgroundAudioRef.current);
      const progressState = buildMonitorTrackProgressState(snapshot);
      if (progressState) {
        setTrackWaveProgress(progressState.trackWaveProgress);
        setTrackElapsedSeconds(progressState.trackElapsedSeconds);
        setTrackDurationSeconds(progressState.trackDurationSeconds);
      }
      frameId = window.requestAnimationFrame(updateProgress);
    };

    frameId = window.requestAnimationFrame(updateProgress);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [
    isListening,
    safeRuntime,
    setTrackDurationSeconds,
    setTrackElapsedSeconds,
    setTrackWaveProgress,
  ]);

  useEffect(() => {
    if (
      !shouldBindMonitorBackgroundTrack({
        safeRuntime,
        isListening,
        hasActiveTrack: Boolean(activeTrack),
      })
    ) {
      return;
    }

    let cancelled = false;

    const bindBackgroundTrack = async () => {
      if (!activeTrack) {
        return;
      }

      const playablePath = resolvePlayableTrackPath(activeTrack);
      if (!playablePath) {
        return;
      }

      const playbackUrl = await resolvePreviewAudioUrl(playablePath);
      if (cancelled) {
        safeRevokePreviewAudioUrl(playbackUrl);
        return;
      }

      const audio = backgroundAudioRef.current ?? new Audio();
      backgroundAudioRef.current = audio;
      backgroundAudioUrlRef.current = prepareBackgroundMonitorAudio(
        audio,
        playbackUrl,
        backgroundAudioUrlRef.current,
        safeRevokePreviewAudioUrl,
      );

      if (audioContext && audioContext.state === "running") {
        ensureBackgroundGraph(audio, audioContext);
      }

      void audio.play().catch((error) => {
        console.warn("Simple monitor background playback failed", error);
      });
    };

    void bindBackgroundTrack();

    return () => {
      cancelled = true;
    };
  }, [audioContext, activeTrack, ensureBackgroundGraph, isListening, safeRuntime]);

  useEffect(() => {
    if (!audioContext || audioContext.state !== "running") {
      return;
    }

    const audio = backgroundAudioRef.current;
    if (!audio) {
      return;
    }

    ensureBackgroundGraph(audio, audioContext);
  }, [audioContext, ensureBackgroundGraph]);

  return {
    backgroundAudioRef,
    previewTrackId,
    toggleTrackPreview,
  };
}
