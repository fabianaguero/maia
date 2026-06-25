import os

from common import fixture_path, output_path
from maia_analyzer.composition import analyze_composition
from maia_analyzer.repository import _summarize_log_signal


def main():
    log_path = fixture_path("logs", "04-error-spike-crash.log")
    print(f"--- Running MAIA AI on Crash Fixture: {log_path.name} ---")

    if not log_path.exists():
        print(f"Error: Log file {log_path} not found.")
        return

    raw_lines = log_path.read_text().splitlines()
    print(f"Read {len(raw_lines)} lines from log.")

    print("Executing AI Anomaly Detection (scikit-learn IsolationForest)...")
    summary, _warnings = _summarize_log_signal(
        log_path,
        raw_lines,
        live_mode=False,
    )

    anomaly_count = summary["metrics"]["anomalyCount"]
    print(f"Total Lines Analyzed: {summary['metrics']['nonEmptyLineCount']}")
    print(f"AI Detected Anomalies: {anomaly_count}")

    for marker in summary["metrics"]["anomalyMarkers"][:5]:
        print(f"  Line {marker.get('lineNumber')}: {marker['excerpt']}")

    preview_path = str(output_path("java_crash_sonification.mp3"))
    options = {
        "waveformBins": summary["artifacts"].get(
            "logCadenceBins",
            summary["metrics"]["logCadenceBins"],
        ),
        "anomalyMarkers": summary["metrics"]["anomalyMarkers"],
        "presetId": "glitch",
    }

    print("\nGenerating track 'java_crash_sonification.mp3'...")
    asset, _warnings = analyze_composition(
        source_kind="file",
        source_path=str(log_path),
        base_asset_category="log-signal",
        reference_type="manual",
        reference_bpm=132.0,
        preview_output_path=preview_path,
        options=options,
    )

    print(f"Art Asset Generated: {asset['title']}")
    print(f"Suggested BPM: {asset['suggestedBpm']}")
    print(f"File size: {os.path.getsize(preview_path) // 1024} KB")
    print("\n--- Done ---")


if __name__ == "__main__":
    main()
