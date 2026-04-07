import sys
import os
from pathlib import Path

# Add the analyzer source to path
sys.path.append(str(Path(__file__).parent / "analyzer" / "src"))

from maia_analyzer.repository import _summarize_log_signal
from maia_analyzer.composition import analyze_composition

def main():
    print("--- Verifying AI Anomaly Detection (IsolationForest) ---")
    
    # 1. Test AI Detection on level-less logs
    raw_lines = [
        "heartbeat: system ok",
        "heartbeat: system ok",
        "heartbeat: system ok",
        "heartbeat: system ok",
        "heartbeat: system ok",
        "heartbeat: system ok",
        "heartbeat: system ok",
        "heartbeat: system ok",
        "ERROR_CRASH_DUMP: x0234af - invalid memory access at 0x0001", # Should be anomaly
        "heartbeat: system ok",
    ]
    
    print("Analyzing level-less logs with AI...")
    log_file = Path("test.log")
    log_file.write_text("\n".join(raw_lines))
    
    summary, warnings = _summarize_log_signal(
        log_file, 
        raw_lines, 
        live_mode=False
    )
    
    print(f"Total Lines: {summary['metrics']['nonEmptyLineCount']}")
    print(f"Anomaly Count: {summary['metrics']['anomalyCount']}")
    
    for marker in summary['metrics']['anomalyMarkers']:
        print(f"  Anomaly Found at line {marker.get('lineNumber')}: {marker['excerpt']}")

    # 2. Generate a track to hear the AI-driven glitch
    output_path = str(Path(__file__).parent / "ai_glitch_test.mp3")
    options = {
        "waveformBins": summary['metrics']['logCadenceBins'],
        "anomalyMarkers": [
            {"second": 4.0, "level": "error", "message": "AI-detected anomaly"}
        ]
    }
    
    print(f"\nGenerating track 'ai_glitch_test.mp3'...")
    asset, warnings = analyze_composition(
        source_kind="file",
        source_path="test.log",
        base_asset_category="log-cadence",
        reference_type="manual",
        reference_bpm=120.0,
        preview_output_path=output_path,
        options=options
    )
    
    print(f"Art Asset: {asset['title']}")
    print(f"File size: {os.path.getsize(output_path) // 1024} KB")
    print("\n--- Done ---")

if __name__ == "__main__":
    main()
