import { useEffect, useRef, useState } from "react";

import type { LibraryTrack } from "../../types/library";
import { resolvePreviewAudioUrl } from "../../utils/audioPreview";
import { resolvePlayableTrackPath } from "../../utils/track";
import {
  applyMonitorPreviewEndedState,
  applyMonitorPreviewPlayFailureState,
  buildMonitorPreviewAudio,
  disposeMonitorPreviewState,
} from "./monitorTrackPreviewAudioControllerRuntime";
import { resolveMonitorPreviewAction } from "./monitorTrackAudioOrchestrationRuntime";

interface UseMonitorTrackPreviewAudioInput {
  safeRuntime: boolean;
  revokePreviewUrl: (url: string | null | undefined) => void;
}

export function useMonitorTrackPreviewAudio({
  safeRuntime,
  revokePreviewUrl,
}: UseMonitorTrackPreviewAudioInput) {
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

    if (previewAction === "skip" || !playablePath) {
      return;
    }

    if (previewAction === "stop-current-preview") {
      const disposedState = disposeMonitorPreviewState({
        previewAudio: previewAudioRef.current,
        previewUrl: previewUrlRef.current,
        revokePreviewUrl,
      });
      previewAudioRef.current = disposedState.previewAudio;
      previewUrlRef.current = disposedState.previewUrl;
      setPreviewTrackId(disposedState.previewTrackId);
      return;
    }

    if (previewAction === "replace-preview") {
      const disposedState = disposeMonitorPreviewState({
        previewAudio: previewAudioRef.current,
        previewUrl: previewUrlRef.current,
        revokePreviewUrl,
      });
      previewAudioRef.current = disposedState.previewAudio;
      previewUrlRef.current = disposedState.previewUrl;
    }

    const previewUrl = await resolvePreviewAudioUrl(playablePath);
    previewUrlRef.current = previewUrl;
    const nextAudio = buildMonitorPreviewAudio({
      previewUrl,
      createAudio: (src) => new Audio(src),
    });
    previewAudioRef.current = nextAudio;
    setPreviewTrackId(track.id);
    nextAudio.addEventListener(
      "ended",
      () => {
        const endedState = applyMonitorPreviewEndedState({
          currentPreviewAudio: previewAudioRef.current,
          endedAudio: nextAudio,
          currentPreviewUrl: previewUrlRef.current,
          revokePreviewUrl,
        });
        if (endedState.shouldApply) {
          previewAudioRef.current = endedState.previewAudio;
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
      const failureState = applyMonitorPreviewPlayFailureState({
        currentPreviewAudio: previewAudioRef.current,
        failedAudio: nextAudio,
        currentPreviewUrl: previewUrlRef.current,
        revokePreviewUrl,
      });
      previewAudioRef.current = failureState.previewAudio;
      previewUrlRef.current = failureState.previewUrl;
      setPreviewTrackId(failureState.previewTrackId);
    }
  };

  useEffect(() => {
    if (safeRuntime) {
      return;
    }

    return () => {
      if (previewAudioRef.current) {
        const disposedState = disposeMonitorPreviewState({
          previewAudio: previewAudioRef.current,
          previewUrl: previewUrlRef.current,
          revokePreviewUrl,
        });
        previewAudioRef.current = disposedState.previewAudio;
      }
      previewUrlRef.current = null;
    };
  }, [revokePreviewUrl, safeRuntime]);

  return {
    previewTrackId,
    toggleTrackPreview,
  };
}
