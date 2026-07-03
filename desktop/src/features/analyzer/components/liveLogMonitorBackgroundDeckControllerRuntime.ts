import type { LibraryTrack } from "../../../types/library";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";
import type { BackgroundDeckState } from "./liveLogMonitorBackgroundDeckRuntime";
import {
  resolveBackgroundDeckStartPlan,
  resolveBackgroundTransitionSchedulePlan,
} from "./liveLogMonitorBackgroundRuntime";
import { startBackgroundDeckPlayback } from "./liveLogMonitorBackgroundDeckStartRuntime";
import {
  applyBackgroundTransitionSchedule,
  type BackgroundTransitionScheduleResult,
} from "./liveLogMonitorBackgroundTransitionTimerRuntime";

export type BackgroundDeckStartControllerResult =
  | { action: "noop" }
  | {
      action: "started";
      nextDeck: BackgroundDeckState;
      nowPlayingId: string;
      activeTransitionPlan: PlaylistTransitionPlan | null;
      playheadSecond: number;
    }
  | { action: "failed"; warningMessage: string };

export async function startBackgroundDeckController(input: {
  context: AudioContext;
  trackIndex: number;
  transitionPlan?: PlaylistTransitionPlan | null;
  playableBaseTracks: LibraryTrack[];
  styleProfile: {
    backgroundGain: number;
    playlistCrossfadeSeconds: number;
    transitionFeel: "smooth" | "steady" | "tight";
  };
  ensureBackgroundBus: (context: AudioContext) => void;
  getFilter: () => BiquadFilterNode | null;
  loadBackgroundBuffer: (context: AudioContext, track: LibraryTrack) => Promise<AudioBuffer | null>;
  previousDeck: BackgroundDeckState | null;
  toMessage: (error: unknown) => string;
}): Promise<BackgroundDeckStartControllerResult> {
  const track = input.playableBaseTracks[input.trackIndex] ?? null;
  if (!track) {
    return { action: "noop" };
  }

  try {
    input.ensureBackgroundBus(input.context);
    const filter = input.getFilter();
    if (!filter) {
      return { action: "noop" };
    }

    const buffer = await input.loadBackgroundBuffer(input.context, track);
    if (!buffer) {
      return { action: "noop" };
    }

    const startPlan = resolveBackgroundDeckStartPlan({
      track,
      hasPlaylistTransitions: input.playableBaseTracks.length > 1,
      styleProfile: {
        playlistCrossfadeSeconds: input.styleProfile.playlistCrossfadeSeconds,
        transitionFeel: input.styleProfile.transitionFeel,
      },
      transitionPlan: input.transitionPlan,
      fallbackFadeInSeconds: 0.9,
      bufferDuration: buffer.duration,
    });

    return {
      action: "started",
      ...startBackgroundDeckPlayback({
        context: input.context,
        filter,
        previousDeck: input.previousDeck,
        track,
        trackIndex: input.trackIndex,
        buffer,
        startPlan,
        targetGain: input.styleProfile.backgroundGain,
        transitionPlan: input.transitionPlan,
      }),
    };
  } catch (error) {
    return {
      action: "failed",
      warningMessage: `Failed to start guide track: ${input.toMessage(error)}`,
    };
  }
}

export function scheduleBackgroundDeckTransitionController(input: {
  playableBaseTracks: LibraryTrack[];
  currentDeck: BackgroundDeckState;
  styleProfile: {
    playlistCrossfadeSeconds: number;
    transitionFeel: "smooth" | "steady" | "tight";
  };
  mutationProfile: {
    transitionTightness: number;
  };
  setBackgroundTransitionPlan: (value: PlaylistTransitionPlan | null) => void;
  scheduleTimeout: (handler: () => void, delayMs: number) => number;
  onStartTransition: (trackIndex: number, transitionPlan: PlaylistTransitionPlan | null) => void;
}): number | null {
  const schedulePlan: BackgroundTransitionScheduleResult = resolveBackgroundTransitionSchedulePlan({
    playableBaseTracks: input.playableBaseTracks,
    currentDeck: input.currentDeck,
    styleProfile: input.styleProfile,
    mutationProfile: input.mutationProfile,
  });

  return applyBackgroundTransitionSchedule({
    schedulePlan,
    setBackgroundTransitionPlan: input.setBackgroundTransitionPlan,
    scheduleTimeout: input.scheduleTimeout,
    onStartTransition: input.onStartTransition,
  });
}
