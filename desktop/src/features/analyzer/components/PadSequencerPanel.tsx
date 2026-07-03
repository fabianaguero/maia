import { useT } from "../../../i18n/I18nContext";
import type { ArrangementTrack, ArrangementVoice } from "./liveSonificationScene";
import {
  buildPadSequencerRulerCells,
  buildPadSequencerTrackRows,
} from "./padSequencerPanelRuntime";
import { PadSequencerGrid } from "./PadSequencerGrid";
import { PadSequencerHeader } from "./PadSequencerHeader";
import { usePadSequencerController } from "./usePadSequencerController";

interface PadSequencerPanelProps {
  bpm: number;
  recentVoices: ArrangementVoice[];
  onStepFire?: (
    firings: Array<{ track: ArrangementTrack; step: number; humanizeOffsetMs: number }>,
  ) => void;
}

export function PadSequencerPanel({ bpm, recentVoices, onStepFire }: PadSequencerPanelProps) {
  const t = useT();
  const {
    grid,
    probGrid,
    humanizeMs,
    setHumanizeMs,
    activeStep,
    playing,
    setPlaying,
    toggleStep,
    cycleProbability,
    handleFillFromScene,
    handleClear,
    effectiveBpm,
  } = usePadSequencerController({
    bpm,
    recentVoices,
    onStepFire,
  });
  const rulerCells = buildPadSequencerRulerCells(activeStep);
  const trackRows = buildPadSequencerTrackRows({
    grid,
    probGrid,
    activeStep,
  });

  return (
    <div className="pad-sequencer-panel">
      <PadSequencerHeader
        effectiveBpm={effectiveBpm}
        playing={playing}
        humanizeMs={humanizeMs}
        onTogglePlaying={() => setPlaying((current) => !current)}
        onFillFromScene={handleFillFromScene}
        onClear={handleClear}
        onChangeHumanizeMs={setHumanizeMs}
      />

      <p className="pad-seq-hint">{t.inspect.sequencerHint}</p>

      <PadSequencerGrid
        rulerCells={rulerCells}
        trackRows={trackRows}
        onToggleStep={toggleStep}
        onCycleProbability={cycleProbability}
      />
    </div>
  );
}
