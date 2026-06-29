import { useEffect, useRef, useState } from "react";

import type { LibraryTrack } from "../../types/library";
import { resolvePlayableTrackPath } from "../../utils/track";
import { resolvePreviewAudioUrl, revokePreviewAudioUrl } from "../../utils/audioPreview";

export function useSimpleModeLibraryPreview() {
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
      revokePreviewAudioUrl(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewTrackId(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
      revokePreviewAudioUrl(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    const previewUrl = await resolvePreviewAudioUrl(playablePath);
    previewUrlRef.current = previewUrl;
    const audio = new Audio(previewUrl);
    audio.volume = 0.92;
    audio.preload = "auto";
    previewAudioRef.current = audio;
    setPreviewTrackId(track.id);
    audio.addEventListener(
      "ended",
      () => {
        if (previewAudioRef.current === audio) {
          previewAudioRef.current = null;
          revokePreviewAudioUrl(previewUrlRef.current);
          previewUrlRef.current = null;
          setPreviewTrackId(null);
        }
      },
      { once: true },
    );

    try {
      await audio.play();
    } catch (error) {
      console.warn("Library track preview failed", error);
      if (previewAudioRef.current === audio) {
        previewAudioRef.current = null;
      }
      revokePreviewAudioUrl(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewTrackId(null);
    }
  };

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      revokePreviewAudioUrl(previewUrlRef.current);
      previewUrlRef.current = null;
    };
  }, []);

  return {
    previewTrackId,
    toggleTrackPreview,
  };
}
