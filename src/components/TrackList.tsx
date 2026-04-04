import type { TrackAnalysis } from "../types/musical_asset";
import "../styles/tracklist.css";

interface TrackListProps {
  tracks: TrackAnalysis[];
  selectedTrack: TrackAnalysis | null;
  onSelect: (track: TrackAnalysis) => void;
}

export default function TrackList({ tracks, selectedTrack, onSelect }: TrackListProps) {
  return (
    <div className="tracklist">
      <div className="tracklist-header">
        <span>LIBRARY</span>
        <span className="tracklist-count">{tracks.length}</span>
      </div>
      {tracks.length === 0 ? (
        <div className="tracklist-empty">
          <p>No tracks analyzed yet.</p>
        </div>
      ) : (
        <ul className="tracklist-items">
          {tracks.map((track) => (
            <li
              key={track.id}
              className={`tracklist-item ${selectedTrack?.id === track.id ? "selected" : ""}`}
              onClick={() => onSelect(track)}
            >
              <div className="track-item-name">{track.name}</div>
              <div className="track-item-meta">
                <span>{track.bpm.toFixed(1)} BPM</span>
                <span>
                  {track.key} {track.scale}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
