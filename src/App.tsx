import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import TrackList from "./components/TrackList";
import WaveformView from "./components/WaveformView";
import BeatGrid from "./components/BeatGrid";
import BPMCurve from "./components/BPMCurve";
import type { TrackAnalysis } from "./types/musical_asset";
import "./styles/app.css";

function App() {
  const [tracks, setTracks] = useState<TrackAnalysis[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<TrackAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"waveform" | "beatgrid" | "bpmcurve">("waveform");

  const handleAnalyzeTrack = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await invoke<{ success: boolean; data?: TrackAnalysis; error?: string }>(
        "analyze_track",
        {
          request: {
            file_path: "/path/to/track.mp3",
          },
        }
      );
      if (result.success && result.data) {
        setTracks((prev) => [...prev, result.data as TrackAnalysis]);
        setSelectedTrack(result.data as TrackAnalysis);
      } else {
        setError(result.error ?? "Analysis failed");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <span className="app-logo-icon">◈</span>
          <h1>MAIA</h1>
          <span className="app-logo-subtitle">Musical Analysis &amp; Arrangement</span>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={handleAnalyzeTrack}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? "Analyzing..." : "+ Analyze Track"}
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <TrackList
            tracks={tracks}
            selectedTrack={selectedTrack}
            onSelect={setSelectedTrack}
          />
        </aside>

        <main className="main-view">
          {selectedTrack ? (
            <>
              <div className="track-info">
                <h2 className="track-name">{selectedTrack.name}</h2>
                <div className="track-meta">
                  <span className="meta-pill bpm">{selectedTrack.bpm.toFixed(1)} BPM</span>
                  <span className="meta-pill key">{selectedTrack.key} {selectedTrack.scale}</span>
                  <span className="meta-pill duration">
                    {formatDuration(selectedTrack.duration)}
                  </span>
                  <span className="meta-pill energy">
                    Energy {(selectedTrack.energy * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="view-tabs">
                <button
                  className={`tab ${activeView === "waveform" ? "active" : ""}`}
                  onClick={() => setActiveView("waveform")}
                >
                  Waveform
                </button>
                <button
                  className={`tab ${activeView === "beatgrid" ? "active" : ""}`}
                  onClick={() => setActiveView("beatgrid")}
                >
                  Beat Grid
                </button>
                <button
                  className={`tab ${activeView === "bpmcurve" ? "active" : ""}`}
                  onClick={() => setActiveView("bpmcurve")}
                >
                  BPM Curve
                </button>
              </div>

              <div className="view-container">
                {activeView === "waveform" && (
                  <WaveformView waveform={selectedTrack.waveform} beats={selectedTrack.beats} />
                )}
                {activeView === "beatgrid" && (
                  <BeatGrid
                    beatGrid={selectedTrack.beat_grid}
                    duration={selectedTrack.duration}
                    bpm={selectedTrack.bpm}
                  />
                )}
                {activeView === "bpmcurve" && (
                  <BPMCurve bpmCurve={selectedTrack.bpm_curve} avgBpm={selectedTrack.bpm} />
                )}
              </div>

              {selectedTrack.patterns.length > 0 && (
                <div className="patterns-section">
                  <h3>Detected Patterns</h3>
                  <div className="patterns-list">
                    {selectedTrack.patterns.map((pattern, i) => (
                      <div key={i} className={`pattern-chip pattern-${pattern.type}`}>
                        <span className="pattern-type">{pattern.type.toUpperCase()}</span>
                        <span className="pattern-label">{pattern.label}</span>
                        <span className="pattern-time">
                          {formatDuration(pattern.start)}–{formatDuration(pattern.end)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">◈</div>
              <h2>No track selected</h2>
              <p>Analyze a track or select one from the list to view its analysis.</p>
              <button className="btn btn-primary" onClick={handleAnalyzeTrack}>
                Analyze Your First Track
              </button>
            </div>
          )}

          {error && (
            <div className="error-banner">
              <span>⚠ {error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default App;
