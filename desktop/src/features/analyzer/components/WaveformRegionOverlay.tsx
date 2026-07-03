import type { MutableRefObject } from "react";

import { useT } from "../../../i18n/I18nContext";
import type { BeatGridPoint } from "../../../types/library";
import type { BeatGridPhraseRange } from "../../../utils/beatGrid";
import type { RenderedRegion } from "./waveformPlaceholderRuntime";
import { WaveformPhraseRegion } from "./WaveformPhraseRegion";
import { WaveformRegionItem } from "./WaveformRegionItem";
import {
  buildWaveformRegionOverlayPhrase,
  buildWaveformRegionOverlayRegions,
} from "./waveformRegionOverlayRuntime";

interface WaveformRegionOverlayProps {
  renderedRegions: RenderedRegion[];
  selectedPhraseRange: BeatGridPhraseRange | null;
  durationSeconds: number | null;
  canEditPerformance: boolean;
  beatGrid: BeatGridPoint[];
  onSeek?: (second: number) => void;
  onMoveLoop?: (loopId: string, startSecond: number) => void;
  onMoveLoopBoundary?: (loopId: string, boundary: "start" | "end", second: number) => void;
  onBeginLoopDrag: (input: {
    eventClientX: number;
    loopId: string;
    startSecond: number;
    endSecond: number;
    pointerOffsetSecond: number;
  }) => void;
  onBeginLoopBoundaryDrag: (input: {
    eventClientX: number;
    loopId: string;
    boundary: "start" | "end";
    second: number;
  }) => void;
  resolveSecondFromClientX: (clientX: number) => number | null;
  dragMovedRef: MutableRefObject<boolean>;
}

export function WaveformRegionOverlay({
  renderedRegions,
  selectedPhraseRange,
  durationSeconds,
  canEditPerformance,
  beatGrid,
  onSeek,
  onMoveLoop,
  onMoveLoopBoundary,
  onBeginLoopDrag,
  onBeginLoopBoundaryDrag,
  resolveSecondFromClientX,
  dragMovedRef,
}: WaveformRegionOverlayProps) {
  const t = useT();
  const regionViewModels = buildWaveformRegionOverlayRegions({
    renderedRegions,
    durationSeconds,
    canEditPerformance,
    onSeek,
    t,
  });
  const phraseViewModel = buildWaveformRegionOverlayPhrase({
    selectedPhraseRange,
    durationSeconds,
    onSeek,
    t,
  });

  return (
    <div className="waveform-region-overlay" aria-label={t.inspect.loopPhraseRegions}>
      {regionViewModels.map((region) => (
        <WaveformRegionItem
          key={region.id}
          region={region}
          canEditPerformance={canEditPerformance}
          durationSeconds={durationSeconds}
          beatGrid={beatGrid}
          dragMovedRef={dragMovedRef}
          dragStartLabel={t.inspect.dragStartOf.replace("{label}", region.label)}
          dragEndLabel={t.inspect.dragEndOf.replace("{label}", region.label)}
          onSeek={onSeek}
          onMoveLoop={onMoveLoop}
          onMoveLoopBoundary={onMoveLoopBoundary}
          onBeginLoopDrag={onBeginLoopDrag}
          onBeginLoopBoundaryDrag={onBeginLoopBoundaryDrag}
          resolveSecondFromClientX={resolveSecondFromClientX}
        />
      ))}

      {phraseViewModel ? (
        <WaveformPhraseRegion phraseViewModel={phraseViewModel} onSeek={onSeek} />
      ) : null}
    </div>
  );
}
