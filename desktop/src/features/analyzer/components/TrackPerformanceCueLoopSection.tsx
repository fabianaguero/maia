import type { AppTranslations } from "../../../i18n/en";
import type { LibraryTrack } from "../../../types/library";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import { TrackPerformancePhraseActions } from "./TrackPerformancePhraseActions";
import { TrackPerformancePrimaryActions } from "./TrackPerformancePrimaryActions";
import { TrackPerformanceStatusStack } from "./TrackPerformanceStatusStack";
import { TrackCueList } from "./TrackCueList";
import { TrackSavedLoopList } from "./TrackSavedLoopList";
import {
  renderCueLabel,
  renderLoopLabel,
  type TrackColorOption,
} from "./trackPerformancePanelRuntime";
import {
  buildTrackPerformanceCueLoopBeatLoopHint,
  buildTrackPerformanceCueLoopPhraseViewModel,
  buildTrackPerformanceCueLoopPlayheadHint,
  buildTrackPerformanceCueLoopPresetActions,
  buildTrackPerformanceCueLoopPrimaryActions,
  buildTrackPerformanceCueLoopStatusRows,
} from "./trackPerformanceCueLoopSectionRuntime";

interface TrackPerformanceCueLoopSectionProps {
  performance: LibraryTrack["performance"];
  currentTime: number;
  bpm: number | null;
  durationSeconds: number | null;
  placementSecond: number;
  quantizeEnabled: boolean;
  quantizeAvailable: boolean;
  canEditPerformance: boolean;
  canAddHot: boolean;
  canAddLoop: boolean;
  selectedPhraseRange: BeatGridPhraseRange | null;
  colorOptions: TrackColorOption[];
  quantizedPlacementHint: string;
  onSetQuantizeEnabled: (updater: (value: boolean) => boolean) => void;
  onUpdatePerformance: (input: { mainCueSecond?: number | null }) => void | Promise<void>;
  onAddCue: (kind: "hot" | "memory") => void | Promise<void>;
  onRemoveCue: (kind: "hot" | "memory", cueId: string) => void | Promise<void>;
  onAddSavedLoop: (beatCount: number) => void | Promise<void>;
  onAddSelectedPhraseLoop: () => void | Promise<void>;
  onRemoveSavedLoop: (loopId: string) => void | Promise<void>;
  onPatchCue: (
    kind: "hot" | "memory",
    cueId: string,
    patch: Partial<LibraryTrack["performance"]["hotCues"][number]>,
  ) => void | Promise<void>;
  onPatchSavedLoop: (
    loopId: string,
    patch: Partial<LibraryTrack["performance"]["savedLoops"][number]>,
  ) => void | Promise<void>;
  onSetSavedLoopBoundary: (loopId: string, boundary: "start" | "end") => void | Promise<void>;
  onAddPhraseMemoryCue: () => void | Promise<void>;
  canCreateBeatLoopAtPlacement: (beatCount: number) => boolean;
  t: AppTranslations;
}

export function TrackPerformanceCueLoopSection({
  performance,
  currentTime,
  bpm,
  placementSecond,
  quantizeEnabled,
  quantizeAvailable,
  canEditPerformance,
  canAddHot,
  canAddLoop,
  selectedPhraseRange,
  colorOptions,
  quantizedPlacementHint,
  onSetQuantizeEnabled,
  onUpdatePerformance,
  onAddCue,
  onRemoveCue,
  onAddSavedLoop,
  onAddSelectedPhraseLoop,
  onRemoveSavedLoop,
  onPatchCue,
  onPatchSavedLoop,
  onSetSavedLoopBoundary,
  onAddPhraseMemoryCue,
  canCreateBeatLoopAtPlacement,
  t,
}: TrackPerformanceCueLoopSectionProps) {
  const statusRows = buildTrackPerformanceCueLoopStatusRows({
    performanceColor: performance.color,
    quantizeEnabled,
    quantizeAvailable,
    t,
  });
  const playheadHint = buildTrackPerformanceCueLoopPlayheadHint({
    currentTime,
    quantizedPlacementHint,
    t,
  });
  const primaryActions = buildTrackPerformanceCueLoopPrimaryActions({
    canEditPerformance,
    canAddHot,
    hasMainCue: performance.mainCueSecond !== null,
    quantizeEnabled,
    quantizeAvailable,
    t,
  });
  const beatLoopHint = buildTrackPerformanceCueLoopBeatLoopHint({
    bpm,
    t,
  });
  const beatLoopActions = buildTrackPerformanceCueLoopPresetActions({
    canEditPerformance,
    canAddLoop,
    canCreateBeatLoopAtPlacement,
    t,
  });
  const phraseView = buildTrackPerformanceCueLoopPhraseViewModel({
    selectedPhraseRange,
    canEditPerformance,
    canAddLoop,
    t,
  });

  return (
    <details className="panel-collapsible top-spaced">
      <summary className="panel-collapsible-summary">{t.inspect.cuesLoops}</summary>
      <div className="panel-collapsible-body">
        <TrackPerformanceStatusStack rows={statusRows} />

        <TrackPerformancePrimaryActions
          playheadHint={playheadHint}
          quantizeEnabled={quantizeEnabled}
          quantizeAvailable={quantizeAvailable}
          quantizeToggleLabel={primaryActions.quantizeToggleLabel}
          actions={primaryActions.actions}
          placementSecond={placementSecond}
          beatLoopHint={beatLoopHint}
          beatLoopActions={beatLoopActions}
          onSetQuantizeEnabled={onSetQuantizeEnabled}
          onUpdatePerformance={onUpdatePerformance}
          onAddCue={onAddCue}
          onAddSavedLoop={onAddSavedLoop}
        />

        <TrackPerformancePhraseActions
          selectedPhraseRange={selectedPhraseRange}
          phraseView={phraseView}
          onUpdatePerformance={onUpdatePerformance}
          onAddPhraseMemoryCue={onAddPhraseMemoryCue}
          onAddSelectedPhraseLoop={onAddSelectedPhraseLoop}
          t={t}
        />

        <TrackCueList
          cues={performance.hotCues}
          cueKind="hot"
          canEditPerformance={canEditPerformance}
          sectionLabel={t.inspect.hotCues}
          emptyLabel={t.inspect.noHotCuesStored}
          labelText={t.inspect.label}
          colorText={t.inspect.color}
          removeText={(name) => t.inspect.removeNamed.replace("{name}", name)}
          slotTemplate={t.inspect.slot}
          pendingLabel={t.inspect.pending}
          onPatchCue={(kind, cueId, patch) => void onPatchCue(kind, cueId, patch)}
          onRemoveCue={(kind, cueId) => void onRemoveCue(kind, cueId)}
          renderCueLabel={renderCueLabel}
          colorOptions={colorOptions}
        />

        <TrackCueList
          cues={performance.memoryCues}
          cueKind="memory"
          canEditPerformance={canEditPerformance}
          sectionLabel={t.inspect.memoryCues}
          emptyLabel={t.inspect.noMemoryCuesStored}
          labelText={t.inspect.label}
          colorText={t.inspect.color}
          removeText={(name) => t.inspect.removeNamed.replace("{name}", name)}
          slotTemplate={t.inspect.slot}
          pendingLabel={t.inspect.pending}
          onPatchCue={(kind, cueId, patch) => void onPatchCue(kind, cueId, patch)}
          onRemoveCue={(kind, cueId) => void onRemoveCue(kind, cueId)}
          renderCueLabel={renderCueLabel}
          colorOptions={colorOptions}
        />

        <TrackSavedLoopList
          loops={performance.savedLoops}
          canEditPerformance={canEditPerformance}
          sectionLabel={t.inspect.savedLoops}
          emptyLabel={t.inspect.noSavedLoopsStored}
          labelText={t.inspect.label}
          colorText={t.inspect.color}
          slotTemplate={t.inspect.slot}
          loopWord={t.inspect.loopWord}
          lockedLabel={t.inspect.locked}
          editableLabel={t.inspect.editable}
          pendingLabel={t.inspect.pending}
          setStartText={t.inspect.setStart}
          setEndText={t.inspect.setEnd}
          unlockLoopText={t.inspect.unlockLoop}
          lockLoopText={t.inspect.lockLoop}
          removeText={(name) => t.inspect.removeNamed.replace("{name}", name)}
          onSetBoundary={(loopId, boundary) => void onSetSavedLoopBoundary(loopId, boundary)}
          onPatchLoop={(loopId, patch) => void onPatchSavedLoop(loopId, patch)}
          onRemoveLoop={(loopId) => void onRemoveSavedLoop(loopId)}
          renderLoopLabel={renderLoopLabel}
          colorOptions={colorOptions}
        />
      </div>
    </details>
  );
}
