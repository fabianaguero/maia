import type { CSSProperties } from "react";

import { useT } from "../../../i18n/I18nContext";
import type { CompositionResultRecord } from "../../../types/library";
import { resolveArrangementSections, resolveCuePoints } from "./compositionPreview";

interface CompositionTimelinePanelProps {
  composition: CompositionResultRecord;
}

function numberField(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function energyClass(energy: string): string {
  if (energy === "high") {
    return "high";
  }
  if (energy === "rising") {
    return "rising";
  }
  if (energy === "low") {
    return "low";
  }
  return "medium";
}

export function CompositionTimelinePanel({ composition }: CompositionTimelinePanelProps) {
  const t = useT();
  const resolvedSections = resolveArrangementSections(composition);
  const resolvedCuePoints = resolveCuePoints(composition);
  const previewDuration =
    numberField(composition.metrics.previewDurationSeconds) ??
    resolvedSections[resolvedSections.length - 1]?.endSecond ??
    null;

  return (
    <section className="panel waveform-panel">
      <div className="panel-header compact">
        <div>
          <h2>{t.compose.arrangementTimeline}</h2>
          <p className="support-copy">{t.compose.arrangementTimelineCopy}</p>
        </div>
      </div>

      <div className="composition-strip">
        {resolvedSections.map((section) => {
          const duration =
            previewDuration && previewDuration > 0
              ? ((section.endSecond - section.startSecond) / previewDuration) * 100
              : 25;

          return (
            <article
              key={section.id}
              className={`composition-section-card energy-${energyClass(section.energy)}`}
              style={{ "--section-width": `${duration}%` } as CSSProperties}
            >
              <span>{section.label}</span>
              <strong>
                {t.compose.barsRange
                  .replace("{start}", String(section.startBar))
                  .replace("{end}", String(section.endBar))}
              </strong>
              <small>
                {t.compose.secondsRange
                  .replace("{start}", section.startSecond.toFixed(1))
                  .replace("{end}", section.endSecond.toFixed(1))}
              </small>
              <p>{section.focus}</p>
            </article>
          );
        })}
      </div>

      <div className="panel-header compact top-spaced">
        <div>
          <h2>{t.compose.cuePoints}</h2>
          <p className="support-copy">{t.compose.cuePointsCopy}</p>
        </div>
      </div>

      <div className="cue-pill-strip">
        {resolvedCuePoints.map((cue) => (
          <div key={cue.id} className="cue-pill">
            <span>{cue.label}</span>
            <strong>{t.compose.bar.replace("{bar}", String(cue.bar))}</strong>
            <small>{cue.second.toFixed(1)}s</small>
          </div>
        ))}
      </div>
    </section>
  );
}
