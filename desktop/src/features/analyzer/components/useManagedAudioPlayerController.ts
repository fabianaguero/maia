import { isTauri } from "@tauri-apps/api/core";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { invokeOrFallback } from "../../../api/tauri";
import {
  canManagedAudioAttemptPlayback,
  mimeTypeFromPath,
  resolveManagedAudioCueError,
  resolveManagedAudioCueTargetSecond,
  resolveManagedAudioInitialState,
  resolveManagedAudioLoadError,
  resolveManagedAudioNote,
  resolveManagedAudioScrubberRange,
  resolveManagedAudioShownDuration,
  resolveManagedAudioToggleError,
  shouldManagedAudioResetBeforeReplay,
  type ManagedAudioPlaybackState,
} from "./managedAudioPlayerRuntime";
import type { ManagedAudioCueRequest } from "./ManagedAudioPlayer";

interface UseManagedAudioPlayerControllerInput {
  audioPath: string | null;
  durationSeconds: number | null;
  errorNote: string;
  missingNote: string;
  browserFallbackNote: string;
  desktopOnlyNote: string;
  availableNote: string;
  onTimeUpdate?: (seconds: number) => void;
  cueRequest?: ManagedAudioCueRequest | null;
}

export function useManagedAudioPlayerController({
  audioPath,
  durationSeconds,
  errorNote,
  missingNote,
  browserFallbackNote,
  desktopOnlyNote,
  availableNote,
  onTimeUpdate,
  cueRequest,
}: UseManagedAudioPlayerControllerInput) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const lastCueRequestIdRef = useRef<number | null>(null);
  const [blobReady, setBlobReady] = useState(false);
  const [playbackState, setPlaybackState] = useState<ManagedAudioPlaybackState>(
    resolveManagedAudioInitialState({
      audioPath,
      isDesktopShell: isTauri(),
    }),
  );
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [resolvedDurationSeconds, setResolvedDurationSeconds] = useState(durationSeconds ?? 0);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    setPlaybackError(null);
    setCurrentTimeSeconds(0);
    setBlobReady(false);
    setResolvedDurationSeconds(durationSeconds ?? 0);
    lastCueRequestIdRef.current = null;

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    if (!audioPath) {
      setPlaybackState("idle");
      if (audio) {
        audio.pause();
        audio.src = "";
      }
      return;
    }

    if (!canManagedAudioAttemptPlayback(audioPath, isTauri()) || !audio) {
      setPlaybackState("unavailable");
      return;
    }

    setPlaybackState("loading");
    let cancelled = false;
    let cleanupListeners: (() => void) | null = null;

    const loadPromise = invokeOrFallback<string>("read_audio_bytes", { path: audioPath }, () =>
      Promise.reject(new Error("Audio playback not available: desktop shell required")),
    );

    loadPromise
      .then((b64) => {
        if (cancelled) return;

        const binary = atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeTypeFromPath(audioPath) });
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;

        const handleLoadedMetadata = () => {
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            setResolvedDurationSeconds(audio.duration);
          }
        };
        const handleCanPlay = () => setPlaybackState(audio.paused ? "ready" : "playing");
        const handleTimeUpdate = () => {
          setCurrentTimeSeconds(audio.currentTime);
          onTimeUpdate?.(audio.currentTime);
        };
        const handlePlay = () => setPlaybackState("playing");
        const handlePause = () => setPlaybackState("ready");
        const handleEnded = () => {
          setCurrentTimeSeconds(Number.isFinite(audio.duration) ? audio.duration : 0);
          setPlaybackState("ready");
        };
        const handleError = () => {
          setPlaybackState("error");
          setPlaybackError(errorNote);
        };

        cleanupListeners = () => {
          audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
          audio.removeEventListener("canplay", handleCanPlay);
          audio.removeEventListener("timeupdate", handleTimeUpdate);
          audio.removeEventListener("play", handlePlay);
          audio.removeEventListener("pause", handlePause);
          audio.removeEventListener("ended", handleEnded);
          audio.removeEventListener("error", handleError);
        };

        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("canplay", handleCanPlay);
        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("play", handlePlay);
        audio.addEventListener("pause", handlePause);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);

        audio.pause();
        audio.currentTime = 0;
        audio.volume = volume;
        audio.src = url;
        audio.load();
        setBlobReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        setPlaybackState("error");
        setPlaybackError(resolveManagedAudioLoadError(error));
      });

    return () => {
      cancelled = true;
      cleanupListeners?.();
      if (audio) {
        audio.pause();
        audio.src = "";
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [audioPath, durationSeconds, errorNote, onTimeUpdate, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!cueRequest || !audio || !blobReady) {
      return;
    }

    if (lastCueRequestIdRef.current === cueRequest.id) {
      return;
    }

    lastCueRequestIdRef.current = cueRequest.id;

    const targetSecond = resolveManagedAudioCueTargetSecond({
      cueSecond: cueRequest.second,
      resolvedDurationSeconds,
      durationSeconds,
    });

    setPlaybackError(null);
    setCurrentTimeSeconds(targetSecond);
    onTimeUpdate?.(targetSecond);
    audio.currentTime = targetSecond;

    if (!cueRequest.autoplay) {
      if (audio.paused && playbackState !== "error") {
        setPlaybackState("ready");
      }
      return;
    }

    setPlaybackState("loading");
    void audio.play().catch((error) => {
      setPlaybackState("error");
      setPlaybackError(resolveManagedAudioCueError(error));
    });
  }, [
    blobReady,
    cueRequest,
    durationSeconds,
    onTimeUpdate,
    playbackState,
    resolvedDurationSeconds,
  ]);

  async function handleTogglePlayback() {
    const audio = audioRef.current;
    if (!audio || !blobReady) {
      return;
    }

    try {
      setPlaybackError(null);

      if (audio.paused) {
        if (
          shouldManagedAudioResetBeforeReplay({
            resolvedDurationSeconds,
            currentTimeSeconds,
          })
        ) {
          audio.currentTime = 0;
          setCurrentTimeSeconds(0);
        }
        setPlaybackState("loading");
        await audio.play();
        return;
      }

      audio.pause();
    } catch (error) {
      setPlaybackState("error");
      setPlaybackError(resolveManagedAudioToggleError(error));
    }
  }

  function handleSeek(event: ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    const nextTime = Number(event.target.value);

    setCurrentTimeSeconds(nextTime);

    if (audio && Number.isFinite(nextTime)) {
      audio.currentTime = nextTime;
    }
  }

  function handleVolumeChange(event: ChangeEvent<HTMLInputElement>) {
    setVolume(Number(event.target.value));
  }

  const shownDurationSeconds = resolveManagedAudioShownDuration(
    resolvedDurationSeconds,
    durationSeconds ?? null,
  );
  const scrubberRange = resolveManagedAudioScrubberRange({
    currentTimeSeconds,
    shownDurationSeconds,
  });

  return {
    audioRef,
    playbackState,
    playbackError,
    currentTimeSeconds,
    volume,
    shownDurationSeconds,
    scrubberRange,
    canPlayAudio: blobReady,
    note: resolveManagedAudioNote({
      audioPath,
      blobReady,
      playbackState,
      missingNote,
      browserFallbackNote,
      desktopOnlyNote,
      availableNote,
    }),
    handleTogglePlayback,
    handleSeek,
    handleVolumeChange,
  };
}
