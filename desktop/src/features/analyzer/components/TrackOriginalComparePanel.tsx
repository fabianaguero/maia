import type { LibraryTrack } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";
import { type TrackCompareAuditionPoint } from "../../../utils/track";
import { WaveformPlaceholder } from "./WaveformPlaceholder";
import { buildTrackOriginalComparePanelViewModel } from "./trackOriginalComparePanelRuntime";

interface TrackOriginalComparePanelProps {
  track: LibraryTrack;
  currentTime?: number;
  onSeek?: (second: number) => void;
  onAudition?: (point: TrackCompareAuditionPoint) => void;
  activeAuditionId?: TrackCompareAuditionPoint["id"] | null;
}

export function TrackOriginalComparePanel({
  track,
  currentTime = 0,
  onSeek,
  onAudition,
  activeAuditionId = null,
}: TrackOriginalComparePanelProps) {
  const t = useT();
  const viewModel = buildTrackOriginalComparePanelViewModel({
    track,
    activeAuditionId,
    t,
  });

  const handleAudition = (point: TrackCompareAuditionPoint) => {
    if (onAudition) {
      onAudition(point);
      return;
    }

    onSeek?.(point.second);
  };

  return (
    <section className="panel track-compare-panel">
      <div className="panel-header compact">
        <div>
          <h2>{t.inspect.originalVsAltered}</h2>
          <p className="support-copy">{t.inspect.originalVsAlteredCopy}</p>
        </div>
      </div>

      <div className="track-compare-summary">
        {viewModel.metrics.map((metric) => (
          <div key={metric.key} className="waveform-meta-pill">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <div className="track-compare-auditions">
        {viewModel.auditions.map((point) => (
          <button
            key={point.id}
            type="button"
            className={
              point.active
                ? `track-compare-audition active track-compare-audition--${point.id}`
                : `track-compare-audition track-compare-audition--${point.id}`
            }
            onClick={() =>
              handleAudition({
                id: point.id,
                label: point.label,
                detail: point.detail,
                second: point.second,
              })
            }
            aria-label={point.ariaLabel}
          >
            <span>{point.label}</span>
            <strong>{point.formattedTime}</strong>
            <small>{point.detail}</small>
          </button>
        ))}
      </div>

      <div className="track-compare-grid">
        <div className="track-compare-column">
          <div className="track-compare-label">
            <span>{t.inspect.baseTrack}</span>
            <strong>{t.inspect.original}</strong>
          </div>
          <WaveformPlaceholder
            bins={track.analysis.waveformBins}
            beatGrid={track.analysis.beatGrid}
            durationSeconds={track.analysis.durationSeconds}
            hotCues={viewModel.originalCues}
            currentTime={currentTime}
            onSeek={onSeek}
          />
        </div>

        <div className="track-compare-column">
          <div className="track-compare-label altered">
            <span>{t.inspect.mutationMap}</span>
            <strong>{t.inspect.altered}</strong>
          </div>
          <WaveformPlaceholder
            bins={track.analysis.waveformBins}
            beatGrid={track.analysis.beatGrid}
            durationSeconds={track.analysis.durationSeconds}
            hotCues={viewModel.alteredCues}
            regions={viewModel.alteredRegions}
            currentTime={currentTime}
            onSeek={onSeek}
          />
        </div>
      </div>
    </section>
  );
}
