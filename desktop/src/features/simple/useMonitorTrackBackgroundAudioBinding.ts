import { useEffect } from "react";

import type { LibraryTrack } from "../../types/library";
import { resolvePreviewAudioUrl } from "../../utils/audioPreview";
import { resolvePlayableTrackPath } from "../../utils/track";
import { shouldBindMonitorBackgroundTrack } from "./monitorTrackAudioOrchestrationRuntime";
import { applyMonitorTrackBackgroundBindingState } from "./monitorTrackBackgroundAudioControllerRuntime";

interface UseMonitorTrackBackgroundAudioBindingInput {
  audioContext: AudioContext | null;
  isListening: boolean;
  safeRuntime: boolean;
  activeTrack: LibraryTrack | null;
  backgroundAudioRef: { current: HTMLAudioElement | null };
  backgroundAudioUrlRef: { current: string | null };
  ensureBackgroundGraph: (audio: HTMLAudioElement, context: AudioContext) => unknown;
  revokePreviewUrl: (url: string | null | undefined) => void;
}

export function useMonitorTrackBackgroundAudioBinding({
  audioContext,
  isListening,
  safeRuntime,
  activeTrack,
  backgroundAudioRef,
  backgroundAudioUrlRef,
  ensureBackgroundGraph,
  revokePreviewUrl,
}: UseMonitorTrackBackgroundAudioBindingInput) {
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
        revokePreviewUrl(playbackUrl);
        return;
      }

      const bindingState = applyMonitorTrackBackgroundBindingState({
        currentBackgroundAudio: backgroundAudioRef.current,
        currentBackgroundAudioUrl: backgroundAudioUrlRef.current,
        playbackUrl,
        createAudio: () => new Audio(),
        revokePreviewUrl,
        audioContext,
        ensureBackgroundGraph,
        warn: (message, error) => {
          console.warn(message, error);
        },
      });
      backgroundAudioRef.current = bindingState.backgroundAudio;
      backgroundAudioUrlRef.current = bindingState.backgroundAudioUrl;
    };

    void bindBackgroundTrack();

    return () => {
      cancelled = true;
    };
  }, [
    activeTrack,
    audioContext,
    backgroundAudioRef,
    backgroundAudioUrlRef,
    ensureBackgroundGraph,
    isListening,
    revokePreviewUrl,
    safeRuntime,
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
  }, [audioContext, backgroundAudioRef, ensureBackgroundGraph]);
}
