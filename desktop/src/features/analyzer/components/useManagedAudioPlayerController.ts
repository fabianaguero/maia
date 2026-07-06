import { isTauri } from "@tauri-apps/api/core";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import {
  resolveManagedAudioInitialState,
  type ManagedAudioPlaybackState,
} from "./managedAudioPlayerRuntime";
import type { ManagedAudioCueRequest } from "./ManagedAudioPlayer";
import {
  buildManagedAudioPlayerControllerViewState,
  seekManagedAudioPlayback,
  toggleManagedAudioPlayback,
} from "./managedAudioPlayerControllerRuntime";
import { useManagedAudioPlayerBlobSource } from "./useManagedAudioPlayerBlobSource";
import { useManagedAudioPlayerCueSync } from "./useManagedAudioPlayerCueSync";

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

  useManagedAudioPlayerBlobSource({
    audioRef,
    blobUrlRef,
    lastCueRequestIdRef,
    audioPath,
    durationSeconds,
    errorNote,
    onTimeUpdate,
    volume,
    setBlobReady,
    setPlaybackState,
    setPlaybackError,
    setCurrentTimeSeconds,
    setResolvedDurationSeconds,
  });

  useManagedAudioPlayerCueSync({
    audioRef,
    lastCueRequestIdRef,
    blobReady,
    cueRequest,
    durationSeconds,
    resolvedDurationSeconds,
    playbackState,
    onTimeUpdate,
    setPlaybackState,
    setPlaybackError,
    setCurrentTimeSeconds,
  });

  async function handleTogglePlayback() {
    await toggleManagedAudioPlayback({
      audio: audioRef.current,
      blobReady,
      resolvedDurationSeconds,
      currentTimeSeconds,
      setCurrentTimeSeconds,
      setPlaybackState,
      setPlaybackError,
    });
  }

  function handleSeek(event: ChangeEvent<HTMLInputElement>) {
    seekManagedAudioPlayback({
      audio: audioRef.current,
      nextTime: Number(event.target.value),
      setCurrentTimeSeconds,
    });
  }

  function handleVolumeChange(event: ChangeEvent<HTMLInputElement>) {
    setVolume(Number(event.target.value));
  }

  const { shownDurationSeconds, scrubberRange, note } = buildManagedAudioPlayerControllerViewState({
    resolvedDurationSeconds,
    durationSeconds: durationSeconds ?? null,
    currentTimeSeconds,
    audioPath,
    blobReady,
    playbackState,
    missingNote,
    browserFallbackNote,
    desktopOnlyNote,
    availableNote,
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
    note,
    handleTogglePlayback,
    handleSeek,
    handleVolumeChange,
  };
}
