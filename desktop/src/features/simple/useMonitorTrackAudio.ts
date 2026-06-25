import { useEffect, useRef, useState } from "react";

import type { LibraryTrack } from "../../types/library";
import { resolvePreviewAudioUrl, revokePreviewAudioUrl } from "../../utils/audioPreview";
import { resolvePlayableTrackPath } from "../../utils/track";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

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
  safeTracks: LibraryTrack[];
  sessionTrackName?: string;
  getTrackTitle: (track: LibraryTrack) => string;
  ensureBackgroundGraph: (audio: HTMLAudioElement, context: AudioContext) => unknown;
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  setTrackDurationSeconds: (value: number | null) => void;
}

export function useMonitorTrackAudio({
  audioContext,
  isListening,
  safeRuntime,
  safeTracks,
  sessionTrackName,
  getTrackTitle,
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
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
      safeRevokePreviewAudioUrl(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewTrackId(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
      safeRevokePreviewAudioUrl(previewUrlRef.current);
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
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      safeRevokePreviewAudioUrl(previewUrlRef.current);
      previewUrlRef.current = null;
    };
  }, [safeRuntime]);

  useEffect(() => {
    if (!isListening) {
      const audio = backgroundAudioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
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
      const audio = backgroundAudioRef.current;
      if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
        setTrackWaveProgress(clamp01(audio.currentTime / audio.duration));
        setTrackElapsedSeconds(audio.currentTime);
        setTrackDurationSeconds(audio.duration);
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
    if (!isListening || !sessionTrackName) {
      return;
    }

    let cancelled = false;

    const bindBackgroundTrack = async () => {
      const selectedTrack = safeTracks.find((track) => getTrackTitle(track) === sessionTrackName);
      const playablePath = selectedTrack ? resolvePlayableTrackPath(selectedTrack) : null;
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
      audio.loop = true;
      audio.volume = 1;
      audio.preload = "auto";
      audio.crossOrigin = "anonymous";
      if (audio.src !== playbackUrl) {
        audio.pause();
        safeRevokePreviewAudioUrl(backgroundAudioUrlRef.current);
        backgroundAudioUrlRef.current = playbackUrl;
        audio.src = playbackUrl;
        audio.currentTime = 0;
      } else if (!backgroundAudioUrlRef.current) {
        backgroundAudioUrlRef.current = playbackUrl;
      }

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
      const audio = backgroundAudioRef.current;
      if (audio) {
        audio.pause();
      }
    };
  }, [
    audioContext,
    ensureBackgroundGraph,
    getTrackTitle,
    isListening,
    safeRuntime,
    safeTracks,
    sessionTrackName,
  ]);

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
