import sys
import os
from pathlib import Path

# Add the analyzer source to path
sys.path.append(str(Path(__file__).parent / "analyzer" / "src"))

from maia_analyzer.repository import _summarize_log_signal
from maia_analyzer.composition import analyze_composition

def main():
    log_path = Path("/home/faguero/java_error_in_idea_2449564.log")
    print(f"--- Running MAIA AI on Real Java Crash Log: {log_path.name} ---")
    
    if not log_path.exists():
        print(f"Error: Log file {log_path} not found.")
        return

    raw_lines = log_path.read_text().splitlines()
    print(f"Read {len(raw_lines)} lines from log.")

    # 1. AI Analysis
    print("Executing AI Anomaly Detection (scikit-learn IsolationForest)...")
    summary, warnings = _summarize_log_signal(
        log_path, 
        raw_lines, 
        live_mode=False
    )
    
    anomaly_count = summary['metrics']['anomalyCount']
    print(f"Total Lines Analyzed: {summary['metrics']['nonEmptyLineCount']}")
    print(f"AI Detected Anomalies: {anomaly_count}")
    
    # Show first few anomalies
    for marker in summary['metrics']['anomalyMarkers'][:5]:
        print(f"  Line {marker.get('lineNumber')}: {marker['excerpt']}")

    # 2. Composition Generation
    output_path = str(Path(__file__).parent / "java_crash_sonification.mp3")
    options = {
        "waveformBins": summary['artifacts']['logCadenceBins'] if 'logCadenceBins' in summary['artifacts'] else summary['metrics']['logCadenceBins'],
        "anomalyMarkers": summary['metrics']['anomalyMarkers'],
        "presetId": "glitch" # Using glitch preset for an obvious alerting effect
    }
    
    print(f"\nGenerating track 'java_crash_sonification.mp3'...")
    asset, warnings = analyze_composition(
        source_kind="file",
        source_path=str(log_path),
        base_asset_category="log-signal",
        reference_type="manual",
        reference_bpm=132.0, # High energy for crash
        preview_output_path=output_path,
        options=options
    )
    
    print(f"Art Asset Generated: {asset['title']}")
    print(f"Suggested BPM: {asset['suggestedBpm']}")
    print(f"File size: {os.path.getsize(output_path) // 1024} KB")
    print("\n--- Done ---")

if __name__ == "__main__":
    main()
