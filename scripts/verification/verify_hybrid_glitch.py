import os

from common import REPO_ROOT, output_path
from maia_analyzer.composition import analyze_composition


def main():
    print("--- Verifying Advanced Multi-Level Glitch ---")
    repo_path = str(REPO_ROOT)
    preview_path = str(output_path("advanced_glitch_test.mp3"))

    options = {
        "maxNesting": 12,
        "complexityScore": 95.0,
        "waveformBins": [0.5] * 20,
        "anomalyMarkers": [
            {"second": 2.0, "level": "info", "message": "Minor spike"},
            {"second": 5.0, "level": "warn", "message": "Potential bottleneck"},
            {"second": 8.0, "level": "error", "message": "Database Timeout"},
            {"second": 11.0, "level": "critical", "message": "SYSTEM DOWN"},
        ],
    }

    print("Generating track with 4 levels of anomalies (2s, 5s, 8s, 11s)...")
    asset, warnings = analyze_composition(
        source_kind="directory",
        source_path=repo_path,
        base_asset_category="code-pattern",
        reference_type="manual",
        reference_bpm=128.0,
        preview_output_path=preview_path,
        options=options,
    )

    if warnings:
        print("Warnings:", warnings)

    print(f"\nArt Asset Generated: {asset['title']}")
    print(f"File rendered at: {preview_path}")
    print(f"File size: {os.path.getsize(preview_path) // 1024} KB")
    print("\n--- Done ---")


if __name__ == "__main__":
    main()
