import type { LibraryTrack } from "../../../types/library";
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
  return (
    mainCueCount +
    track.performance.hotCues.length +
    track.performance.memoryCues.length
  );
}

export function TrackOriginalComparePanel({
  track,
  currentTime = 0,
  onSeek,
  onAudition,
  activeAuditionId = null,
}: TrackOriginalComparePanelProps) {
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
          <h2>Original vs altered</h2>
          <p className="support-copy">
            Compare the imported base track against the current Maia mutation
            map using the same playhead.
          </p>
        </div>
      </div>

      <div className="track-compare-summary">
        <div className="waveform-meta-pill">
          <span>Original cues</span>
          <strong>{originalCues.length}</strong>
        </div>
        <div className="waveform-meta-pill">
          <span>Altered cues</span>
          <strong>{alteredCueCount}</strong>
        </div>
        <div className="waveform-meta-pill">
          <span>Saved loops</span>
          <strong>{alteredRegions.length}</strong>
        </div>
        <div className="waveform-meta-pill">
          <span>Delta</span>
          <strong>{cueDelta >= 0 ? `+${cueDelta}` : cueDelta}</strong>
        </div>
        <div className="waveform-meta-pill">
          <span>Main cue</span>
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
            aria-label={`Audition ${point.label}`}
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
            <span>Base track</span>
            <strong>Original</strong>
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
            <span>Mutation map</span>
            <strong>Altered</strong>
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
