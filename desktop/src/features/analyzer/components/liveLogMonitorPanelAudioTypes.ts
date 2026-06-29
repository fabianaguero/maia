import type { Logger } from "../../../utils/logger";
import type { buildLiveLogMonitorViewModel } from "./liveLogMonitorViewModel";
import type { useLiveLogMonitorSurfaceState } from "./useLiveLogMonitorSurfaceState";

export type LiveLogMonitorSurfaceState = ReturnType<typeof useLiveLogMonitorSurfaceState>;
export type LiveLogMonitorViewState = ReturnType<typeof buildLiveLogMonitorViewModel>;

export interface UseLiveLogMonitorPanelAudioRuntimeInput {
  repositoryId: string;
  liveEnabled: boolean;
  replayActive: boolean;
  monitorAudioContext: AudioContext | null;
  resumeSharedAudio: () => Promise<void>;
  surfaceState: LiveLogMonitorSurfaceState;
  viewState: Pick<
    LiveLogMonitorViewState,
    | "playableBaseTracks"
    | "playableBaseTrackIdsKey"
    | "scene"
    | "selectedStyleProfile"
    | "selectedMutationProfile"
    | "effectiveLiveMutationState"
  >;
  logger: Logger;
}
