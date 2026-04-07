import sys
import os
from pathlib import Path

# Add the analyzer source to path
sys.path.append(str(Path(__file__).parent / "analyzer" / "src"))

from maia_analyzer.repository import _summarize_log_signal
from maia_analyzer.audio import analyze_track
from maia_analyzer.composition import analyze_composition

def main():
    log_path = Path("/home/faguero/java_error_in_idea_2449564.log")
    track_path = "/home/faguero/Música/Anyma, Ellie Goulding Vs SHM, Bittermind - Hypnotized (Minetti 'One' Edit) - Carlos Minetti - SoundLoadMate.com.mp3"
    
    print(f"--- Running Hybrid Remix: Anyma vs Java Crash ---")
    
    if not Path(track_path).exists():
        print(f"Error: Music file not found at {track_path}")
        return

    # 1. Analyze Reference Track (BPM)
    print(f"Analyzing Reference Track: {Path(track_path).name}...")
    track_asset, _ = analyze_track(track_path)
    target_bpm = track_asset.get("suggestedBpm", 126.0)
    print(f"Detected BPM: {target_bpm}")

    # 2. Analyze Log for Anomalies
    raw_lines = log_path.read_text().splitlines()
    summary, _ = _summarize_log_signal(log_path, raw_lines, live_mode=False)
    
    # 3. Generate Hybrid Composition
    output_path = str(Path(__file__).parent / "java_anyma_remix.mp3")
    
    # We create a manual stem for the full track so the hybrid mixer plays it
    options = {
        "waveformBins": summary['metrics']['logCadenceBins'],
        "anomalyMarkers": summary['metrics']['anomalyMarkers'],
        "presetId": "techno",
    }
    
    print(f"\nGenerating hybrid remix 'java_anyma_remix.mp3'...")
    # Passing the track_path as reference_path to the composition engine
    asset, warnings = analyze_composition(
        source_kind="file",
        source_path=str(log_path),
        base_asset_category="log-signal",
        reference_type="track",
        reference_label="Anyma Hybrid",
        reference_bpm=target_bpm,
        reference_path=track_path,
        preview_output_path=output_path,
        options=options
    )
    
    # IMPORTANT: The current analyze_composition implementation for "track" 
    # reference needs to know where the stems are. 
    # Since we didn't separate them, we rely on the Hybrid Mixer loading the full track 
    # if we add a 'path' to a stem manually or if the engine supports it.
    
    print(f"Art Asset Generated: {asset['title']}")
    print(f"File rendered at: {output_path}")
    print(f"File size: {os.path.getsize(output_path) // 1024} KB")
    print("\n--- Done ---")

if __name__ == "__main__":
    main()
