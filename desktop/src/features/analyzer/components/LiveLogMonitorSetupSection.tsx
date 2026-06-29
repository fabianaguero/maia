import type { Dispatch, SetStateAction } from "react";

import { MUTATION_PROFILES, STYLE_PROFILES } from "../../../config/liveProfiles";
import type { AppTranslations } from "../../../i18n/en";
import type { BaseTrackPlaylist, LibraryTrack, StreamAdapterKind } from "../../../types/library";
import { getStreamAdapterLabel } from "../../../utils/streamAdapter";
import { LiveLogMonitorSetupDeck } from "./LiveLogMonitorSetupDeck";
import {
  addTrackToLiveMonitorBasePlaylist,
  loadSavedLiveMonitorBasePlaylist,
  moveTrackWithinLiveMonitorBasePlaylist,
  removeTrackFromLiveMonitorBasePlaylist,
  renameLiveMonitorBasePlaylist,
} from "./liveLogMonitorPlaylistEditorRuntime";
import type { ForcedLiveMutationState } from "./liveLogMonitorViewModel";

interface BasePlaylistTrackOption {
  id: string;
  label: string;
  disabled?: boolean;
}

interface SavedPlaylistOption {
  id: string;
  label: string;
}

interface BasePlaylistEditorItem {
  id: string;
  label: string;
  lostTitle: string | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

interface ProfileOption {
  id: string;
  label: string;
  description: string;
}

interface LiveLogMonitorSetupSectionProps {
  visible: boolean;
  t: AppTranslations;
  adapterKind: StreamAdapterKind;
  adapterDescription: string;
  adapterTarget: string;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
  selectedStyleProfile: ProfileOption;
  selectedMutationProfile: ProfileOption;
  forcedLiveMutationState: ForcedLiveMutationState;
  hasBaseListeningBed: boolean;
  baseTrackCount: number;
  adapterConfigured: boolean;
  cueEnginePreviewLabel: string;
  liveMutationStateLabel: string;
  error: string | null;
  isStarting: boolean;
  pendingAddTrackId: string;
  pendingLoadPlaylistId: string;
  basePlaylist: BaseTrackPlaylist | null;
  basePlaylistTrackOptions: BasePlaylistTrackOption[];
  savedPlaylistOptions: SavedPlaylistOption[];
  basePlaylistEditorItems: BasePlaylistEditorItem[];
  availablePlaylists: BaseTrackPlaylist[];
  availableTracks: LibraryTrack[];
  setBasePlaylist: Dispatch<SetStateAction<BaseTrackPlaylist | null>>;
  setPendingAddTrackId: (value: string) => void;
  setPendingLoadPlaylistId: (value: string) => void;
  setAdapterKind: (value: StreamAdapterKind) => void;
  setSelectedStyleProfileId: (value: string) => void;
  setSelectedMutationProfileId: (value: string) => void;
  setForcedLiveMutationState: (value: ForcedLiveMutationState) => void;
  onStart: () => void | Promise<void>;
}

export function LiveLogMonitorSetupSection({
  visible,
  t,
  adapterKind,
  adapterDescription,
  adapterTarget,
  selectedStyleProfileId,
  selectedMutationProfileId,
  selectedStyleProfile,
  selectedMutationProfile,
  forcedLiveMutationState,
  hasBaseListeningBed,
  baseTrackCount,
  adapterConfigured,
  cueEnginePreviewLabel,
  liveMutationStateLabel,
  error,
  isStarting,
  pendingAddTrackId,
  pendingLoadPlaylistId,
  basePlaylist,
  basePlaylistTrackOptions,
  savedPlaylistOptions,
  basePlaylistEditorItems,
  availablePlaylists,
  availableTracks,
  setBasePlaylist,
  setPendingAddTrackId,
  setPendingLoadPlaylistId,
  setAdapterKind,
  setSelectedStyleProfileId,
  setSelectedMutationProfileId,
  setForcedLiveMutationState,
  onStart,
}: LiveLogMonitorSetupSectionProps) {
  return (
    <LiveLogMonitorSetupDeck
      visible={visible}
      workflowStripProps={{
        steps: [
          { label: t.inspect.baseBedStep, active: hasBaseListeningBed },
          { label: t.inspect.sourceFeedStep, active: adapterConfigured },
          { label: t.inspect.sceneStep, active: true },
          { label: t.inspect.runStep },
        ],
      }}
      basePlaylistPanelProps={{
        playlistName: basePlaylist?.name ?? t.inspect.basePlaylist,
        labels: {
          title: t.inspect.baseListeningBedTitle,
          stableBedCopy: t.inspect.stableBedCopy,
          namePlaceholder: t.inspect.nameBasePlaylist,
          lost: t.library.lost.toUpperCase(),
          addBaseTrack: t.inspect.addBaseTrack,
          addAction: t.inspect.addAction,
          loadSavedPlaylist: t.inspect.loadSavedPlaylist,
          loadAction: t.inspect.loadAction,
          moveUp: (name) => t.inspect.moveUp.replace("{name}", name),
          moveDown: (name) => t.inspect.moveDown.replace("{name}", name),
          removeFromPlaylist: (name) => t.inspect.removeFromPlaylist.replace("{name}", name),
          intendedListeningBedHint: t.inspect.intendedListeningBedHint,
        },
        pendingAddTrackId,
        pendingLoadPlaylistId,
        addTrackOptions: basePlaylistTrackOptions,
        savedPlaylistOptions,
        playlistItems: basePlaylistEditorItems,
        onPlaylistNameChange: (value) =>
          setBasePlaylist((current) => renameLiveMonitorBasePlaylist(current, value)),
        onPendingAddTrackIdChange: setPendingAddTrackId,
        onPendingLoadPlaylistIdChange: setPendingLoadPlaylistId,
        onAddTrack: () => {
          if (!pendingAddTrackId) {
            return;
          }
          setBasePlaylist((current) =>
            addTrackToLiveMonitorBasePlaylist(current, pendingAddTrackId),
          );
          setPendingAddTrackId("");
        },
        onLoadPlaylist: () => {
          const nextPlaylist =
            availablePlaylists.find((playlist) => playlist.id === pendingLoadPlaylistId) ?? null;
          if (!nextPlaylist) {
            return;
          }
          setBasePlaylist(loadSavedLiveMonitorBasePlaylist(nextPlaylist, availableTracks));
        },
        onMoveTrackUp: (trackId) =>
          setBasePlaylist((current) =>
            moveTrackWithinLiveMonitorBasePlaylist(current, trackId, "up"),
          ),
        onMoveTrackDown: (trackId) =>
          setBasePlaylist((current) =>
            moveTrackWithinLiveMonitorBasePlaylist(current, trackId, "down"),
          ),
        onRemoveTrack: (trackId) =>
          setBasePlaylist((current) => removeTrackFromLiveMonitorBasePlaylist(current, trackId)),
      }}
      launchPanelProps={{
        adapterKind,
        adapterLabel: getStreamAdapterLabel(adapterKind),
        adapterDescription,
        adapterTarget,
        fileTailLabel: t.library.fileTail,
        selectedStyleProfileId,
        selectedMutationProfileId,
        selectedStyleLabel: selectedStyleProfile.label,
        selectedMutationLabel: selectedMutationProfile.label,
        selectedStyleDescription: selectedStyleProfile.description,
        selectedMutationDescription: selectedMutationProfile.description,
        styleOptions: STYLE_PROFILES.map((profile) => ({
          id: profile.id,
          label: profile.label,
        })),
        mutationOptions: MUTATION_PROFILES.map((profile) => ({
          id: profile.id,
          label: profile.label,
        })),
        forcedLiveMutationState,
        hasBaseListeningBed,
        baseBedStatusLabel: hasBaseListeningBed
          ? `${baseTrackCount} ${t.library.sounds.toLowerCase()}${baseTrackCount === 1 ? "" : "s"} ${t.session.armed.toLowerCase()}`
          : t.inspect.recommended,
        adapterConfigured,
        cueEnginePreviewLabel,
        liveMutationStateLabel,
        forcedStateDetail:
          forcedLiveMutationState === "normal"
            ? t.inspect.forcedStateNormal
            : forcedLiveMutationState === "warning"
              ? t.inspect.forcedStateWarning
              : forcedLiveMutationState === "critical"
                ? t.inspect.forcedStateCritical
                : t.inspect.liveLogDriven,
        isStarting,
        error,
        labels: {
          signalFeedTitle: t.inspect.signalFeedTitle,
          weekOnePipeline: t.inspect.weekOnePipeline,
          targetLabel: t.inspect.targetLabel,
          sceneLaunchTitle: t.inspect.sceneLaunchTitle,
          styleProfileTitle: t.inspect.styleProfileTitle,
          mutationProfileTitle: t.inspect.mutationProfileTitle,
          auditionOverrideTitle: t.inspect.auditionOverrideTitle,
          auditionAuto: t.inspect.auditionAuto,
          auditionNormal: t.inspect.auditionNormal,
          auditionWarning: t.inspect.auditionWarning,
          auditionCritical: t.inspect.auditionCritical,
          baseBedLabel: t.session.baseBed,
          sourceFeedLabel: t.session.sourceFeed,
          cueEngineLabel: t.inspect.cueEngineLabel,
          ready: t.inspect.ready,
          needsConfig: t.inspect.needsConfig,
          recommended: t.inspect.recommended,
          synthOnlyHint: t.inspect.synthOnlyHint,
          auditionOverridePrefix: t.inspect.auditionOverridePrefix,
          liveLogDriven: t.inspect.liveLogDriven,
          forcedStateNormal: t.inspect.forcedStateNormal,
          forcedStateWarning: t.inspect.forcedStateWarning,
          forcedStateCritical: t.inspect.forcedStateCritical,
          startMonitor: t.inspect.startMonitor,
          starting: t.inspect.starting,
          feedTarget: t.inspect.feedTarget,
          configureFeedBeforeStart: t.inspect.configureFeedBeforeStart,
        },
        onChangeAdapterKind: (value) => setAdapterKind(value as StreamAdapterKind),
        onChangeStyleProfileId: setSelectedStyleProfileId,
        onChangeMutationProfileId: setSelectedMutationProfileId,
        onChangeForcedState: setForcedLiveMutationState,
        onStart,
      }}
    />
  );
}
