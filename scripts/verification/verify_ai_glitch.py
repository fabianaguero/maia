import os

from common import ensure_scratch_dir, output_path
from maia_analyzer.composition import analyze_composition
from maia_analyzer.repository import _summarize_log_signal


def main():
    print("--- Verifying AI Anomaly Detection (IsolationForest) ---")

    raw_lines = [
        "heartbeat: system ok",
        "heartbeat: system ok",
        "heartbeat: system ok",
        "heartbeat: system ok",
        "heartbeat: system ok",
        "heartbeat: system ok",
        "heartbeat: system ok",
        "heartbeat: system ok",
        "ERROR_CRASH_DUMP: x0234af - invalid memory access at 0x0001",
        "heartbeat: system ok",
    ]

    print("Analyzing level-less logs with AI...")
    log_file = ensure_scratch_dir() / "ai_glitch_test.log"
    log_file.write_text("\n".join(raw_lines))

    summary, _warnings = _summarize_log_signal(
        log_file,
        raw_lines,
        live_mode=False,
    )

    print(f"Total Lines: {summary['metrics']['nonEmptyLineCount']}")
    print(f"Anomaly Count: {summary['metrics']['anomalyCount']}")

    for marker in summary["metrics"]["anomalyMarkers"]:
        print(f"  Anomaly Found at line {marker.get('lineNumber')}: {marker['excerpt']}")

    preview_path = str(output_path("ai_glitch_test.mp3"))
    options = {
        "waveformBins": summary["metrics"]["logCadenceBins"],
        "anomalyMarkers": [{"second": 4.0, "level": "error", "message": "AI-detected anomaly"}],
    }

    print("\nGenerating track 'ai_glitch_test.mp3'...")
    asset, _warnings = analyze_composition(
        source_kind="file",
        source_path=str(log_file),
        base_asset_category="log-cadence",
        reference_type="manual",
        reference_bpm=120.0,
        preview_output_path=preview_path,
        options=options,
    )

    print(f"Art Asset: {asset['title']}")
    print(f"File size: {os.path.getsize(preview_path) // 1024} KB")
    print("\n--- Done ---")


if __name__ == "__main__":
    main()
