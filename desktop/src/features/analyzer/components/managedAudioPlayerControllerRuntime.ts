import {
  resolveManagedAudioNote,
  resolveManagedAudioScrubberRange,
  resolveManagedAudioShownDuration,
  resolveManagedAudioToggleError,
  shouldManagedAudioResetBeforeReplay,
  type ManagedAudioPlaybackState,
} from "./managedAudioPlayerRuntime";

export async function toggleManagedAudioPlayback(input: {
  audio: HTMLAudioElement | null;
  blobReady: boolean;
  resolvedDurationSeconds: number;
  currentTimeSeconds: number;
  setCurrentTimeSeconds: (value: number) => void;
  setPlaybackState: (value: ManagedAudioPlaybackState) => void;
  setPlaybackError: (value: string | null) => void;
}): Promise<void> {
  const audio = input.audio;
  if (!audio || !input.blobReady) {
    return;
  }

  try {
    input.setPlaybackError(null);

    if (audio.paused) {
      if (
        shouldManagedAudioResetBeforeReplay({
          resolvedDurationSeconds: input.resolvedDurationSeconds,
          currentTimeSeconds: input.currentTimeSeconds,
        })
      ) {
        audio.currentTime = 0;
        input.setCurrentTimeSeconds(0);
      }
      input.setPlaybackState("loading");
      await audio.play();
      return;
    }

    audio.pause();
  } catch (error) {
    input.setPlaybackState("error");
    input.setPlaybackError(resolveManagedAudioToggleError(error));
  }
}

export function seekManagedAudioPlayback(input: {
  audio: HTMLAudioElement | null;
  nextTime: number;
  setCurrentTimeSeconds: (value: number) => void;
}): void {
  input.setCurrentTimeSeconds(input.nextTime);

  if (input.audio && Number.isFinite(input.nextTime)) {
    input.audio.currentTime = input.nextTime;
  }
}

export function buildManagedAudioPlayerControllerViewState(input: {
  resolvedDurationSeconds: number;
  durationSeconds: number | null;
  currentTimeSeconds: number;
  audioPath: string | null;
  blobReady: boolean;
  playbackState: ManagedAudioPlaybackState;
  missingNote: string;
  browserFallbackNote: string;
  desktopOnlyNote: string;
  availableNote: string;
}) {
  const shownDurationSeconds = resolveManagedAudioShownDuration(
    input.resolvedDurationSeconds,
    input.durationSeconds,
  );

  return {
    shownDurationSeconds,
    scrubberRange: resolveManagedAudioScrubberRange({
      currentTimeSeconds: input.currentTimeSeconds,
      shownDurationSeconds,
    }),
    note: resolveManagedAudioNote({
      audioPath: input.audioPath,
      blobReady: input.blobReady,
      playbackState: input.playbackState,
      missingNote: input.missingNote,
      browserFallbackNote: input.browserFallbackNote,
      desktopOnlyNote: input.desktopOnlyNote,
      availableNote: input.availableNote,
    }),
  };
}
