import sys
import os
from pathlib import Path

# Add the analyzer source to path
sys.path.append(str(Path(__file__).parent / "analyzer" / "src"))

from maia_analyzer.repository import _summarize_log_signal
from maia_analyzer.composition import analyze_composition

def main():
    log_path = Path("/home/faguero/dev/travelcbooster-2026-04-04/deploy.log")
    print(f"--- Running MAIA AI on Normal/Steady Log: {log_path.name} ---")
    
    if not log_path.exists():
        print(f"Error: Log file {log_path} not found.")
        return

    raw_lines = log_path.read_text().splitlines()
    print(f"Read {len(raw_lines)} lines from log.")

    # 1. AI Analysis
    print("Executing AI Anomaly Detection (IsolationForest) - Steady State Mode...")
    summary, warnings = _summarize_log_signal(
        log_path, 
        raw_lines, 
        live_mode=False
    )
    
    anomaly_count = summary['metrics']['anomalyCount']
    print(f"Total Lines Analyzed: {summary['metrics']['nonEmptyLineCount']}")
    print(f"AI Detected Anomalies: {anomaly_count} (Expect 0 or very few)")
    
    # 2. Composition Generation
    output_path = str(Path(__file__).parent / "normal_deploy_sonification.mp3")
    options = {
        "waveformBins": summary['artifacts']['logCadenceBins'] if 'logCadenceBins' in summary['artifacts'] else summary['metrics']['logCadenceBins'],
        "anomalyMarkers": summary['metrics']['anomalyMarkers'],
        "presetId": "ambient" # Using ambient preset for a chill 'steady state' vibe
    }
    
    print(f"\nGenerating track 'normal_deploy_sonification.mp3'...")
    asset, warnings = analyze_composition(
        source_kind="file",
        source_path=str(log_path),
        base_asset_category="log-signal",
        reference_type="manual",
        reference_bpm=94.0, # Low energy for normal state
        preview_output_path=output_path,
        options=options
    )
    
    print(f"Art Asset Generated: {asset['title']}")
    print(f"File size: {os.path.getsize(output_path) // 1024} KB")
    print("\n--- Done ---")

if __name__ == "__main__":
    main()
