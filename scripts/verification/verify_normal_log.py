import os

from common import fixture_path, output_path
from maia_analyzer.composition import analyze_composition
from maia_analyzer.repository import _summarize_log_signal


def main():
    log_path = fixture_path("logs", "01-plain-quiet.log")
    print(f"--- Running MAIA AI on Normal/Steady Log: {log_path.name} ---")

    if not log_path.exists():
        print(f"Error: Log file {log_path} not found.")
        return

    raw_lines = log_path.read_text().splitlines()
    print(f"Read {len(raw_lines)} lines from log.")

    print("Executing AI Anomaly Detection (IsolationForest) - Steady State Mode...")
    summary, _warnings = _summarize_log_signal(
        log_path,
        raw_lines,
        live_mode=False,
    )

    anomaly_count = summary["metrics"]["anomalyCount"]
    print(f"Total Lines Analyzed: {summary['metrics']['nonEmptyLineCount']}")
    print(f"AI Detected Anomalies: {anomaly_count} (Expect 0 or very few)")

    preview_path = str(output_path("normal_deploy_sonification.mp3"))
    options = {
        "waveformBins": summary["artifacts"].get(
            "logCadenceBins",
            summary["metrics"]["logCadenceBins"],
        ),
        "anomalyMarkers": summary["metrics"]["anomalyMarkers"],
        "presetId": "ambient",
    }

    print("\nGenerating track 'normal_deploy_sonification.mp3'...")
    asset, _warnings = analyze_composition(
        source_kind="file",
        source_path=str(log_path),
        base_asset_category="log-signal",
        reference_type="manual",
        reference_bpm=94.0,
        preview_output_path=preview_path,
        options=options,
    )

    print(f"Art Asset Generated: {asset['title']}")
    print(f"File size: {os.path.getsize(preview_path) // 1024} KB")
    print("\n--- Done ---")


if __name__ == "__main__":
    main()
