import { invoke, isTauri } from "@tauri-apps/api/core";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

type PlaybackState = "idle" | "loading" | "ready" | "playing" | "error" | "unavailable";

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
}

function formatDuration(durationSeconds: number | null): string {
  if (!durationSeconds || durationSeconds <= 0) {
    return "--:--";
  }

  const totalSeconds = Math.round(durationSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function canAttemptPlayback(audioPath: string | null): boolean {
  return Boolean(audioPath && isTauri() && !audioPath.startsWith("browser-fallback://"));
}

function mimeTypeFromPath(audioPath: string): string {
  const ext = audioPath.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    flac: "audio/flac",
    m4a: "audio/mp4",
    aac: "audio/mp4",
    opus: "audio/ogg",
    webm: "audio/webm",
  };
  return map[ext] ?? "audio/mpeg";
}

function describeState(state: PlaybackState): string {
  switch (state) {
    case "loading":
      return "Loading";
    case "ready":
      return "Ready";
    case "playing":
      return "Playing";
    case "error":
      return "Playback error";
    case "unavailable":
      return "Desktop playback only";
    default:
      return "Pending";
  }
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
}: ManagedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [blobReady, setBlobReady] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(
    canAttemptPlayback(audioPath) ? "loading" : audioPath ? "unavailable" : "idle",
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

    if (!canAttemptPlayback(audioPath) || !audio) {
      setPlaybackState("unavailable");
      return;
    }

    setPlaybackState("loading");
    let cancelled = false;
    let cleanupListeners: (() => void) | null = null;

    invoke<string>("read_audio_bytes", { path: audioPath })
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
  }, [audioPath, durationSeconds, errorNote]);

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

  const shownDurationSeconds =
    resolvedDurationSeconds > 0 ? resolvedDurationSeconds : durationSeconds ?? null;
  const canPlayAudio = blobReady;
  const note = !audioPath
    ? missingNote
    : audioPath.startsWith("browser-fallback://")
      ? browserFallbackNote
      : !blobReady && playbackState === "unavailable"
        ? desktopOnlyNote
        : availableNote;

  return (
    <div className="render-audio-player top-spaced">
      <div className="panel-header compact">
        <div>
          <h2>{title}</h2>
          <p className="support-copy">{description}</p>
        </div>
      </div>

      <audio ref={audioRef} preload="metadata" />

      <div className="render-audio-controls">
        <button
          type="button"
          className={playbackState === "playing" ? "secondary-action" : "action"}
          onClick={() => void handleTogglePlayback()}
          disabled={!canPlayAudio || playbackState === "loading"}
        >
          {playbackState === "playing" ? pauseLabel : playLabel}
        </button>
        <div className="render-audio-status">
          <span>Status</span>
          <strong>{describeState(playbackState)}</strong>
        </div>
        <div className="render-audio-status">
          <span>Position</span>
          <strong>
            {formatDuration(currentTimeSeconds)} / {formatDuration(shownDurationSeconds)}
          </strong>
        </div>
        <div className="render-audio-volume">
          <span>Vol</span>
          <input
            type="range"
            className="volume-slider"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolumeChange}
            aria-label={`${title} volume`}
          />
          <strong>{Math.round(volume * 100)}%</strong>
        </div>
      </div>

      <input
        type="range"
        className="render-audio-scrubber"
        min={0}
        max={shownDurationSeconds && shownDurationSeconds > 0 ? shownDurationSeconds : 1}
        step={0.01}
        value={Math.min(
          currentTimeSeconds,
          shownDurationSeconds && shownDurationSeconds > 0 ? shownDurationSeconds : 1,
        )}
        onChange={handleSeek}
        disabled={!canPlayAudio || !shownDurationSeconds}
        aria-label={`${title} scrubber`}
      />

      <p className="render-audio-note">{playbackError ?? note}</p>
    </div>
  );
}

