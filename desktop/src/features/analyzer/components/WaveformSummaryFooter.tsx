import { formatDuration, type WaveformSummaryPillViewModel } from "./waveformPlaceholderRuntime";

interface WaveformSummaryFooterProps {
  summaryPills: WaveformSummaryPillViewModel[];
  durationSeconds: number | null;
}

export function WaveformSummaryFooter({
  summaryPills,
  durationSeconds,
}: WaveformSummaryFooterProps) {
  return (
    <>
      <div className="waveform-summary">
        {summaryPills.map((pill) => (
          <div key={pill.key} className="waveform-meta-pill">
            <span>{pill.label}</span>
            <strong>{pill.value}</strong>
          </div>
        ))}
      </div>

      <div className="waveform-footer">
        <span>00:00</span>
        <span>{formatDuration(durationSeconds)}</span>
      </div>
    </>
  );
}
