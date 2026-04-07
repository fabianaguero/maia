import sys
import os
from pathlib import Path

# Add the analyzer source to path
sys.path.append(str(Path(__file__).parent / "analyzer" / "src"))

from maia_analyzer.composition import analyze_composition

def main():
    print("--- Verifying Advanced Multi-Level Glitch ---")
    repo_path = str(Path(__file__).parent)
    output_path = str(Path(__file__).parent / "advanced_glitch_test.mp3")
    
    # Simulate a sequence of different anomaly levels
    options = {
        "maxNesting": 12,
        "complexityScore": 95.0,
        "waveformBins": [0.5] * 20, # Steady base
        "anomalyMarkers": [
            {"second": 2.0, "level": "info", "message": "Minor spike"},
            {"second": 5.0, "level": "warn", "message": "Potential bottleneck"},
            {"second": 8.0, "level": "error", "message": "Database Timeout"},
            {"second": 11.0, "level": "critical", "message": "SYSTEM DOWN"}
        ]
    }
    
    print(f"Generating track with 4 levels of anomalies (2s, 5s, 8s, 11s)...")
    asset, warnings = analyze_composition(
        source_kind="directory",
        source_path=repo_path,
        base_asset_category="code-pattern",
        reference_type="manual",
        reference_bpm=128.0,
        preview_output_path=output_path,
        options=options
    )
    
    if warnings:
        print("Warnings:", warnings)
        
    print(f"\nArt Asset Generated: {asset['title']}")
    print(f"File rendered at: {output_path}")
    print(f"File size: {os.path.getsize(output_path) // 1024} KB")
    print("\n--- Done ---")

if __name__ == "__main__":
    main()
