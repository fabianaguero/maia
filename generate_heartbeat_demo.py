import sys
import os
from pathlib import Path

# Add the analyzer source to path
sys.path.append(str(Path(__file__).parent / "analyzer" / "src"))

from maia_analyzer.composition import analyze_composition

def main():
    print("--- Generating Heartbeat Demo ---")
    repo_path = str(Path(__file__).parent)
    output_path = str(Path(__file__).parent / "heartbeat_demo.mp3")
    
    # Analyze composition using the 'heartbeat' preset
    asset, warnings = analyze_composition(
        source_kind="directory",
        source_path=repo_path,
        base_asset_category="heartbeat",
        reference_type="manual",
        reference_bpm=92.0,
        preview_output_path=output_path,
        # Pass the presetId to use the Zen Heartbeat aesthetic
        options={
            "presetId": "heartbeat",
            "maxNesting": 12, # Simulate a complex system heartbeat
            "complexityScore": 45.5
        }
    )
    
    if warnings:
        print("Warnings:", warnings)
        
    print(f"\nArt Asset Generated: {asset['title']}")
    print(f"Suggested BPM: {asset['suggestedBpm']}")
    print(f"File rendered at: {output_path}")
    print("\n--- Done ---")

if __name__ == "__main__":
    main()
