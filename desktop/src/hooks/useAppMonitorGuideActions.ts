import { useEffect, useMemo } from "react";
import {
  buildAppMonitorGuideActionRunners,
  syncLibraryMonitorGuide,
} from "./appMonitorGuideActionsRuntime";
import {
  buildAppMonitorGuideActionInputs,
  buildAppMonitorPlaylistArmInput,
  buildAppMonitorSessionArmInput,
  buildAppMonitorSessionGuideInput,
  buildAppMonitorTrackArmInput,
} from "./appMonitorGuideActionsHookRuntime";
import type { UseAppMonitorActionsInput } from "./appMonitorActionsTypes";

type GuideActionsInput = Pick<UseAppMonitorActionsInput, "library" | "monitor">;

export function useAppMonitorGuideActions({ library, monitor }: GuideActionsInput) {
  const guideInputs = useMemo(
    () => buildAppMonitorGuideActionInputs({ library, monitor }),
    [library, monitor],
  );
  const guideActions = useMemo(
    () =>
      buildAppMonitorGuideActionRunners({
        buildTrackArmInput: (trackId) => buildAppMonitorTrackArmInput({ library, monitor }, trackId),
        buildPlaylistArmInput: (playlistId) =>
          buildAppMonitorPlaylistArmInput({ library, monitor }, playlistId),
        buildSessionArmInput: (draft, armPlaylistBase, armTrackBase) =>
          buildAppMonitorSessionArmInput(
            { library, monitor },
            draft,
            armPlaylistBase,
            armTrackBase,
          ),
        buildSessionGuideInput: (draft) =>
          buildAppMonitorSessionGuideInput({ library, monitor }, draft),
      }),
    [library, monitor],
  );

  useEffect(() => {
    syncLibraryMonitorGuide(guideInputs.libraryGuideEffectInput);
  }, [guideInputs]);

  return guideActions;
}
