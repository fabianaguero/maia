import { isTauri } from "@tauri-apps/api/core";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { invokeOrFallback } from "../../../api/tauri";
import {
  canManagedAudioAttemptPlayback,
  mimeTypeFromPath,
  resolveManagedAudioInitialState,
  resolveManagedAudioNote,
  resolveManagedAudioScrubberRange,
  resolveManagedAudioShownDuration,
  type ManagedAudioPlaybackState,
} from "./managedAudioPlayerRuntime";
import { ManagedAudioPlayerControls } from "./ManagedAudioPlayerControls";

export interface ManagedAudioCueRequest {
  id: number;
  second: number;
  autoplay?: boolean;
}

interface ManagedAudioPlayerProps {
  title: string;
  description: string;
  audioPath: string | null;
  durationSeconds: number | null;
  playLabel: string;
  pauseLabel: string;
  missingNote: string;
  browserFallbackNote: string;
  desktopOnlyNote: string;
  availableNote: string;
  errorNote: string;
  onTimeUpdate?: (seconds: number) => void;
  cueRequest?: ManagedAudioCueRequest | null;
}

export function ManagedAudioPlayer({
  title,
  description,
  audioPath,
  durationSeconds,
  playLabel,
  pauseLabel,
  missingNote,
  browserFallbackNote,
  desktopOnlyNote,
  availableNote,
  errorNote,
  onTimeUpdate,
  cueRequest,
}: ManagedAudioPlayerProps) {
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

  // Keep the audio element volume in sync with the slider state
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

    // Revoke any previous blob URL immediately.
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
        audio.volume = volume; // Ensure volume is set before loading
        audio.src = url;
        audio.load();
        setBlobReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setPlaybackState("error");
        setPlaybackError(`Cannot load audio: ${String(err)}`);
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

    const maxDuration =
      resolvedDurationSeconds > 0 ? resolvedDurationSeconds : (durationSeconds ?? 0);
    const targetSecond =
      maxDuration > 0
        ? Math.min(Math.max(0, cueRequest.second), maxDuration)
        : Math.max(0, cueRequest.second);

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
      setPlaybackError(
        error instanceof Error ? error.message : "Maia could not jump to the requested cue.",
      );
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
        if (resolvedDurationSeconds > 0 && currentTimeSeconds >= resolvedDurationSeconds - 0.1) {
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
      setPlaybackError(
        error instanceof Error ? error.message : "Maia could not start local audio playback.",
      );
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
    const next = Number(event.target.value);
    setVolume(next);
  }

  const shownDurationSeconds = resolveManagedAudioShownDuration(
    resolvedDurationSeconds,
    durationSeconds ?? null,
  );
  const scrubberRange = resolveManagedAudioScrubberRange({
    currentTimeSeconds,
    shownDurationSeconds,
  });
  const canPlayAudio = blobReady;
  const note = resolveManagedAudioNote({
    audioPath,
    blobReady,
    playbackState,
    missingNote,
    browserFallbackNote,
    desktopOnlyNote,
    availableNote,
  });

  return (
    <div className="render-audio-player top-spaced">
      <div className="panel-header compact">
        <div>
          <h2>{title}</h2>
          <p className="support-copy">{description}</p>
        </div>
      </div>

      <audio ref={audioRef} preload="metadata" />

      <ManagedAudioPlayerControls
        title={title}
        playbackState={playbackState}
        currentTimeSeconds={currentTimeSeconds}
        shownDurationSeconds={shownDurationSeconds}
        volume={volume}
        playLabel={playLabel}
        pauseLabel={pauseLabel}
        toggleDisabled={!canPlayAudio || playbackState === "loading"}
        onTogglePlayback={handleTogglePlayback}
        onVolumeChange={handleVolumeChange}
      />

      <input
        type="range"
        className="render-audio-scrubber"
        min={0}
        max={scrubberRange.max}
        step={0.01}
        value={scrubberRange.value}
        onChange={handleSeek}
        disabled={!canPlayAudio || !shownDurationSeconds}
        aria-label={`${title} scrubber`}
      />

      <p className="render-audio-note">{playbackError ?? note}</p>
    </div>
  );
}
