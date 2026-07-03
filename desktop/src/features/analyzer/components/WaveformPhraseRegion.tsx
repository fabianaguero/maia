import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";

import type { WaveformRegionOverlayPhraseViewModel } from "./waveformRegionOverlayRuntime";

export function WaveformPhraseRegion({
  phraseViewModel,
  onSeek,
}: {
  phraseViewModel: WaveformRegionOverlayPhraseViewModel;
  onSeek?: (second: number) => void;
}) {
  const handleSeek = (event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onSeek?.(phraseViewModel.startSecond);
  };

  return (
    <div
      className="waveform-region waveform-region--phrase waveform-region--selected"
      style={
        {
          "--region-start": `${phraseViewModel.startPosition}%`,
          "--region-width": `${phraseViewModel.widthPercent}%`,
          "--region-color": "rgba(244, 184, 94, 0.28)",
        } as CSSProperties
      }
      title={phraseViewModel.title}
      role="button"
      tabIndex={phraseViewModel.tabIndex}
      aria-label={phraseViewModel.ariaLabel}
      aria-disabled={phraseViewModel.ariaDisabled}
      onClick={handleSeek}
      onKeyDown={(event) => {
        if (!onSeek) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          handleSeek(event);
        }
      }}
    >
      <span className="waveform-region-label">{phraseViewModel.label}</span>
    </div>
  );
}
