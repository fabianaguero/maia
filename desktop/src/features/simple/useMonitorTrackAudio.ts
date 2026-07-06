import type { LibraryTrack } from "../../types/library";
import { revokePreviewAudioUrl } from "../../utils/audioPreview";
import { useMonitorTrackBackgroundAudio } from "./useMonitorTrackBackgroundAudio";
import { useMonitorTrackPreviewAudio } from "./useMonitorTrackPreviewAudio";

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
  const { previewTrackId, toggleTrackPreview } = useMonitorTrackPreviewAudio({
    safeRuntime,
    revokePreviewUrl: safeRevokePreviewAudioUrl,
  });
  const { backgroundAudioRef } = useMonitorTrackBackgroundAudio({
    audioContext,
    isListening,
    safeRuntime,
    activeTrack,
    ensureBackgroundGraph,
    setTrackWaveProgress,
    setTrackElapsedSeconds,
    setTrackDurationSeconds,
    revokePreviewUrl: safeRevokePreviewAudioUrl,
  });

  return {
    backgroundAudioRef,
    previewTrackId,
    toggleTrackPreview,
  };
}
