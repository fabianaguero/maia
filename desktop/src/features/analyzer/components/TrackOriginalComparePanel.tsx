import type { LibraryTrack } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";
import {
  formatTrackTime,
  getTrackCompareAuditionPoints,
  getTrackOriginalWaveformCues,
  getTrackWaveformCues,
  getTrackWaveformRegions,
  type TrackCompareAuditionPoint,
} from "../../../utils/track";
import { WaveformPlaceholder } from "./WaveformPlaceholder";

interface TrackOriginalComparePanelProps {
  track: LibraryTrack;
  currentTime?: number;
  onSeek?: (second: number) => void;
  onAudition?: (point: TrackCompareAuditionPoint) => void;
  activeAuditionId?: TrackCompareAuditionPoint["id"] | null;
}

function countAlteredCueMarkers(track: LibraryTrack): number {
  const mainCueCount = track.performance.mainCueSecond !== null ? 1 : 0;
  return mainCueCount + track.performance.hotCues.length + track.performance.memoryCues.length;
}

export function TrackOriginalComparePanel({
  track,
  currentTime = 0,
  onSeek,
  onAudition,
  activeAuditionId = null,
}: TrackOriginalComparePanelProps) {
  const t = useT();
  const originalCues = getTrackOriginalWaveformCues(track);
  const alteredCues = getTrackWaveformCues(track);
  const alteredRegions = getTrackWaveformRegions(track);
  const auditionPoints = getTrackCompareAuditionPoints(track);
  const alteredCueCount = countAlteredCueMarkers(track);
  const cueDelta = alteredCueCount - originalCues.length;

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
        <div className="waveform-meta-pill">
          <span>{t.inspect.originalCues}</span>
          <strong>{originalCues.length}</strong>
        </div>
        <div className="waveform-meta-pill">
          <span>{t.inspect.alteredCues}</span>
          <strong>{alteredCueCount}</strong>
        </div>
        <div className="waveform-meta-pill">
          <span>{t.inspect.savedLoops}</span>
          <strong>{alteredRegions.length}</strong>
        </div>
        <div className="waveform-meta-pill">
          <span>{t.inspect.delta}</span>
          <strong>{cueDelta >= 0 ? `+${cueDelta}` : cueDelta}</strong>
        </div>
        <div className="waveform-meta-pill">
          <span>{t.inspect.mainCue}</span>
          <strong>{formatTrackTime(track.performance.mainCueSecond)}</strong>
        </div>
      </div>

      <div className="track-compare-auditions">
        {auditionPoints.map((point) => (
          <button
            key={point.id}
            type="button"
            className={
              activeAuditionId === point.id
                ? `track-compare-audition active track-compare-audition--${point.id}`
                : `track-compare-audition track-compare-audition--${point.id}`
            }
            onClick={() => handleAudition(point)}
            aria-label={t.inspect.audition.replace("{label}", point.label)}
          >
            <span>{point.label}</span>
            <strong>{formatTrackTime(point.second)}</strong>
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
            hotCues={originalCues}
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
            hotCues={alteredCues}
            regions={alteredRegions}
            currentTime={currentTime}
            onSeek={onSeek}
          />
        </div>
      </div>
    </section>
  );
}
