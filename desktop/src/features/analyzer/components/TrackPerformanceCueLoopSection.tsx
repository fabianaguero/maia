import type { LibraryTrack } from "../../../types/library";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import { formatTrackTime } from "../../../utils/track";
import { TrackCueList } from "./TrackCueList";
import { TrackSavedLoopList } from "./TrackSavedLoopList";
import {
  LOOP_BEAT_PRESETS,
  renderCueLabel,
  renderLoopLabel,
  type TrackColorOption,
} from "./trackPerformancePanelRuntime";

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
  t: {
    inspect: Record<string, string>;
  };
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
  return (
    <details className="panel-collapsible top-spaced">
      <summary className="panel-collapsible-summary">{t.inspect.cuesLoops}</summary>
      <div className="panel-collapsible-body">
        <div className="status-stack">
          <div className="status-row">
            <span>{t.inspect.colorTag}</span>
            <strong>{performance.color ?? t.inspect.none}</strong>
          </div>
          <div className="status-row">
            <span>{t.inspect.quantize}</span>
            <strong>{quantizeEnabled && quantizeAvailable ? t.inspect.on : t.inspect.off}</strong>
          </div>
        </div>

        <p className="support-copy top-spaced">
          {t.inspect.playheadCueToolsAt.replace("{time}", formatTrackTime(currentTime))}
          {quantizedPlacementHint}
        </p>
        <div className="pill-strip top-spaced">
          <span>
            <button
              type="button"
              className="compact-action"
              aria-pressed={quantizeEnabled && quantizeAvailable}
              disabled={!quantizeAvailable}
              onClick={() => onSetQuantizeEnabled((value) => !value)}
            >
              {quantizeEnabled && quantizeAvailable ? t.inspect.quantizeOn : t.inspect.quantizeOff}
            </button>
          </span>
          <span>
            <button
              type="button"
              className="compact-action"
              disabled={!canEditPerformance}
              onClick={() =>
                void onUpdatePerformance({
                  mainCueSecond: placementSecond,
                })
              }
            >
              {t.inspect.setMainCue}
            </button>
          </span>
          <span>
            <button
              type="button"
              className="compact-action"
              disabled={!canEditPerformance || performance.mainCueSecond === null}
              onClick={() =>
                void onUpdatePerformance({
                  mainCueSecond: null,
                })
              }
            >
              {t.inspect.clearMainCue}
            </button>
          </span>
          <span>
            <button
              type="button"
              className="compact-action"
              disabled={!canEditPerformance || !canAddHot}
              onClick={() => void onAddCue("hot")}
            >
              {t.inspect.addHotCue}
            </button>
          </span>
          <span>
            <button
              type="button"
              className="compact-action"
              disabled={!canEditPerformance}
              onClick={() => void onAddCue("memory")}
            >
              {t.inspect.addMemoryCue}
            </button>
          </span>
        </div>

        <p className="support-copy top-spaced">
          {t.inspect.beatLoopsFromDetectedBpm.replace(
            "{bpm}",
            typeof bpm === "number" ? bpm.toFixed(1) : t.inspect.pending,
          )}
        </p>
        <div className="pill-strip top-spaced">
          {LOOP_BEAT_PRESETS.map((beatCount) => (
            <span key={beatCount}>
              <button
                type="button"
                className="compact-action"
                disabled={
                  !canEditPerformance || !canAddLoop || !canCreateBeatLoopAtPlacement(beatCount)
                }
                onClick={() => void onAddSavedLoop(beatCount)}
              >
                {t.inspect.saveBeatLoop.replace("{count}", String(beatCount))}
              </button>
            </span>
          ))}
        </div>

        {selectedPhraseRange ? (
          <>
            <p className="support-copy top-spaced">
              {t.inspect.phraseSelected
                .replace("{label}", selectedPhraseRange.label)
                .replace("{start}", formatTrackTime(selectedPhraseRange.startSecond))
                .replace("{end}", formatTrackTime(selectedPhraseRange.endSecond))}
            </p>
            <div className="pill-strip top-spaced">
              <span>
                <button
                  type="button"
                  className="compact-action"
                  disabled={!canEditPerformance}
                  onClick={() =>
                    void onUpdatePerformance({
                      mainCueSecond: selectedPhraseRange.startSecond,
                    })
                  }
                >
                  {t.inspect.setCuePhraseStart}
                </button>
              </span>
              <span>
                <button
                  type="button"
                  className="compact-action"
                  disabled={!canEditPerformance}
                  onClick={() => void onAddPhraseMemoryCue()}
                >
                  {t.inspect.addPhraseMemoryCue}
                </button>
              </span>
              <span>
                <button
                  type="button"
                  className="compact-action"
                  disabled={!canEditPerformance || !canAddLoop}
                  onClick={() => void onAddSelectedPhraseLoop()}
                >
                  {t.inspect.savePhraseLoop}
                </button>
              </span>
            </div>
          </>
        ) : (
          <p className="support-copy top-spaced">{t.inspect.armPhraseSelect}</p>
        )}

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
