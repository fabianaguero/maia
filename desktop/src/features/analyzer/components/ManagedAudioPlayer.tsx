import { convertFileSrc, isTauri } from "@tauri-apps/api/core";
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

function resolvePlayableSource(audioPath: string | null): string | null {
  if (!audioPath || audioPath.startsWith("browser-fallback://") || !isTauri()) {
    return null;
  }

  try {
    return convertFileSrc(audioPath);
  } catch {
    return null;
  }
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
}: ManagedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playableSource = resolvePlayableSource(audioPath);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(
    audioPath ? (playableSource ? "loading" : "unavailable") : "idle",
  );
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [resolvedDurationSeconds, setResolvedDurationSeconds] = useState(durationSeconds ?? 0);

  useEffect(() => {
    const audio = audioRef.current;
    setPlaybackError(null);
    setCurrentTimeSeconds(0);
    setResolvedDurationSeconds(durationSeconds ?? 0);

    if (!audioPath) {
      setPlaybackState("idle");
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      return;
    }

    if (!audio || !playableSource) {
      setPlaybackState("unavailable");
      return;
    }

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setResolvedDurationSeconds(audio.duration);
      }
    };
    const handleCanPlay = () => {
      setPlaybackState(audio.paused ? "ready" : "playing");
    };
    const handleTimeUpdate = () => {
      setCurrentTimeSeconds(audio.currentTime);
    };
    const handlePlay = () => {
      setPlaybackState("playing");
    };
    const handlePause = () => {
      setPlaybackState("ready");
    };
    const handleEnded = () => {
      setCurrentTimeSeconds(Number.isFinite(audio.duration) ? audio.duration : 0);
      setPlaybackState("ready");
    };
    const handleError = () => {
      setPlaybackState("error");
      setPlaybackError(errorNote);
    };

    audio.pause();
    audio.currentTime = 0;
    audio.load();
    setPlaybackState("loading");

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
    };
  }, [audioPath, durationSeconds, errorNote, playableSource]);

  async function handleTogglePlayback() {
    const audio = audioRef.current;
    if (!audio || !playableSource) {
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

  const shownDurationSeconds =
    resolvedDurationSeconds > 0 ? resolvedDurationSeconds : durationSeconds ?? null;
  const canPlayAudio = Boolean(playableSource);
  const note = !audioPath
    ? missingNote
    : audioPath.startsWith("browser-fallback://")
      ? browserFallbackNote
      : !canPlayAudio
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

      <audio ref={audioRef} preload="metadata" src={playableSource ?? undefined} />

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
