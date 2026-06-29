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
    if (!playablePath) {
      return;
    }

    if (previewTrackId === track.id && previewAudioRef.current) {
      previewAudioRef.current = disposeMonitorAudio(
        previewAudioRef.current,
        previewUrlRef.current,
        safeRevokePreviewAudioUrl,
      );
      previewUrlRef.current = null;
      setPreviewTrackId(null);
      return;
    }

    if (previewAudioRef.current) {
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
          previewAudioRef.current = null;
          safeRevokePreviewAudioUrl(previewUrlRef.current);
          previewUrlRef.current = null;
          setPreviewTrackId(null);
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
      const audio = backgroundAudioRef.current;
      if (audio) {
        stopMonitorAudio(audio);
      }
      backgroundAudioRef.current = null;
      safeRevokePreviewAudioUrl(backgroundAudioUrlRef.current);
      backgroundAudioUrlRef.current = null;
      setTrackWaveProgress(0);
      setTrackElapsedSeconds(0);
      setTrackDurationSeconds(null);
    }
  }, [isListening, setTrackDurationSeconds, setTrackElapsedSeconds, setTrackWaveProgress]);

  useEffect(() => {
    if (safeRuntime) {
      return;
    }
    if (!isListening) {
      setTrackWaveProgress(0);
      return;
    }

    let frameId = 0;
    const updateProgress = () => {
      const snapshot = readMonitorTrackAudioSnapshot(backgroundAudioRef.current);
      if (snapshot) {
        setTrackWaveProgress(snapshot.progress);
        setTrackElapsedSeconds(snapshot.elapsedSeconds);
        setTrackDurationSeconds(snapshot.durationSeconds);
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
    if (safeRuntime) {
      return;
    }
    if (!isListening || !activeTrack) {
      return;
    }

    let cancelled = false;

    const bindBackgroundTrack = async () => {
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
