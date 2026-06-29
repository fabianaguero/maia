import { useEffect, useState } from "react";
import { useT } from "../../../i18n/I18nContext";
import type { LibraryTrack, UpdateTrackPerformanceInput } from "../../../types/library";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import { TrackPerformanceControlStrip } from "./TrackPerformanceControlStrip";
import { TrackPerformanceCueLoopSection } from "./TrackPerformanceCueLoopSection";
import { TrackPerformanceSummaryGrid } from "./TrackPerformanceSummaryGrid";
import {
  buildTrackPerformanceMetrics,
  buildQuantizedPlacementHint,
  buildTrackColorOptions,
  buildTrackPerformancePanelState,
  createTrackPerformanceActions,
} from "./trackPerformancePanelRuntime";

interface TrackPerformancePanelProps {
  track: LibraryTrack;
  busy?: boolean;
  currentTime?: number;
  selectedPhraseRange?: BeatGridPhraseRange | null;
  onUpdatePerformance?: (input: UpdateTrackPerformanceInput) => Promise<void>;
}

export function TrackPerformancePanel({
  track,
  busy = false,
  currentTime = 0,
  selectedPhraseRange = null,
  onUpdatePerformance,
}: TrackPerformancePanelProps) {
  const t = useT();
  const { performance } = track;
  const TRACK_COLOR_OPTIONS = buildTrackColorOptions(t);
  const summaryMetrics = buildTrackPerformanceMetrics({ track, t });
  const { durationSeconds, bpm, canEditPerformance, canAddHot, canAddLoop, quantizeAvailable } =
    buildTrackPerformancePanelState({
      track,
      busy,
      currentTime,
      onUpdatePerformance,
    });
  const [quantizeEnabled, setQuantizeEnabled] = useState(quantizeAvailable);

  useEffect(() => {
    setQuantizeEnabled(quantizeAvailable);
  }, [track.id, quantizeAvailable]);

  const {
    placementSecond,
    updatePerformance,
    addCue,
    removeCue,
    addSavedLoop,
    addSelectedPhraseLoop,
    removeSavedLoop,
    patchCue,
    patchSavedLoop,
    setSavedLoopBoundary,
    addPhraseMemoryCue,
    canCreateBeatLoopAtPlacement,
  } = createTrackPerformanceActions({
    track,
    currentTime,
    selectedPhraseRange,
    canEditPerformance,
    quantizeEnabled,
    onUpdatePerformance,
  });

  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>{t.inspect.performanceTitle}</h2>
          <p className="support-copy">{t.inspect.performanceCopy}</p>
        </div>
      </div>

      <TrackPerformanceSummaryGrid metrics={summaryMetrics} />

      <div className="top-spaced">
        <p className="support-copy">{t.inspect.performanceControls}</p>
        <TrackPerformanceControlStrip
          performance={performance}
          canEditPerformance={canEditPerformance}
          colorOptions={TRACK_COLOR_OPTIONS}
          ratingLabel={t.inspect.rating}
          performanceLabel={t.inspect.performanceTitle}
          colorLabel={t.inspect.color}
          unlockBpmLabel={t.inspect.unlockBpm}
          lockBpmLabel={t.inspect.lockBpm}
          unlockGridLabel={t.inspect.unlockGrid}
          lockGridLabel={t.inspect.lockGrid}
          markPlayedLabel={t.inspect.markPlayed}
          onUpdatePerformance={updatePerformance}
        />
      </div>

      <TrackPerformanceCueLoopSection
        performance={performance}
        currentTime={currentTime}
        bpm={bpm}
        durationSeconds={durationSeconds}
        placementSecond={placementSecond}
        quantizeEnabled={quantizeEnabled}
        quantizeAvailable={quantizeAvailable}
        canEditPerformance={canEditPerformance}
        canAddHot={canAddHot}
        canAddLoop={canAddLoop}
        selectedPhraseRange={selectedPhraseRange}
        colorOptions={TRACK_COLOR_OPTIONS}
        quantizedPlacementHint={buildQuantizedPlacementHint({
          currentTime,
          placementSecond,
          durationSeconds,
          quantizedToTemplate: t.inspect.quantizedTo,
        })}
        onSetQuantizeEnabled={setQuantizeEnabled}
        onUpdatePerformance={updatePerformance}
        onAddCue={addCue}
        onRemoveCue={removeCue}
        onAddSavedLoop={addSavedLoop}
        onAddSelectedPhraseLoop={addSelectedPhraseLoop}
        onRemoveSavedLoop={removeSavedLoop}
        onPatchCue={patchCue}
        onPatchSavedLoop={patchSavedLoop}
        onSetSavedLoopBoundary={setSavedLoopBoundary}
        onAddPhraseMemoryCue={addPhraseMemoryCue}
        canCreateBeatLoopAtPlacement={canCreateBeatLoopAtPlacement}
        t={t}
      />
    </section>
  );
}
