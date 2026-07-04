import { useCallback, useEffect } from "react";

import type { SessionMonitorDraft } from "../appMonitorActionsRuntime";
import {
  performPlaylistArm,
  performSessionArm,
  performSessionGuidePrime,
  performTrackArm,
  syncLibraryMonitorGuide,
} from "./appMonitorGuideActionsRuntime";
import {
  buildAppMonitorLibraryGuideEffectInput,
  buildAppMonitorPlaylistArmInput,
  buildAppMonitorSessionArmInput,
  buildAppMonitorSessionGuideInput,
  buildAppMonitorTrackArmInput,
} from "./appMonitorGuideActionsHookRuntime";
import type { UseAppMonitorActionsInput } from "./appMonitorActionsTypes";

type GuideActionsInput = Pick<UseAppMonitorActionsInput, "library" | "monitor">;

export function useAppMonitorGuideActions({ library, monitor }: GuideActionsInput) {
  const armTrackBase = useCallback(
    (trackId: string | null | undefined) => {
      performTrackArm(buildAppMonitorTrackArmInput({ library, monitor }, trackId));
    },
    [library, monitor],
  );

  const armPlaylistBase = useCallback(
    (playlistId: string | null | undefined) => {
      performPlaylistArm(buildAppMonitorPlaylistArmInput({ library, monitor }, playlistId));
    },
    [library, monitor],
  );

  useEffect(() => {
    syncLibraryMonitorGuide(buildAppMonitorLibraryGuideEffectInput({ library, monitor }));
  }, [library, monitor]);

  const armSessionMusicalBase = useCallback(
    (draft?: SessionMonitorDraft) => {
      performSessionArm(
        buildAppMonitorSessionArmInput({ library, monitor }, draft, armPlaylistBase, armTrackBase),
      );
    },
    [armPlaylistBase, armTrackBase, library, monitor],
  );

  const primeMonitorGuideTrack = useCallback(
    (draft?: SessionMonitorDraft) => {
      performSessionGuidePrime(buildAppMonitorSessionGuideInput({ library, monitor }, draft));
    },
    [library, monitor],
  );

  return {
    armTrackBase,
    armPlaylistBase,
    armSessionMusicalBase,
    primeMonitorGuideTrack,
  };
}
