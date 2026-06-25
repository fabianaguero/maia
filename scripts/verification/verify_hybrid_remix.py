import os
from pathlib import Path

from common import fixture_path, output_path
from maia_analyzer.audio import analyze_track
from maia_analyzer.composition import analyze_composition
from maia_analyzer.repository import _summarize_log_signal


def resolve_reference_track() -> Path | None:
    env_track = os.environ.get("MAIA_REFERENCE_TRACK")
    if env_track:
        return Path(env_track).expanduser()

    for candidate_name in ("heartbeat_demo.mp3", "normal_deploy_sonification.mp3"):
        candidate = output_path(candidate_name)
        if candidate.exists():
            return candidate

    return None


def main():
    log_path = fixture_path("logs", "04-error-spike-crash.log")
    track_path = resolve_reference_track()

    print("--- Running Hybrid Remix Verification ---")

    if track_path is None or not track_path.exists():
        print("Error: No reference track available.")
        print(
            "Set MAIA_REFERENCE_TRACK=/path/to/track.mp3 or generate " "heartbeat_demo.mp3 first."
        )
        return

    print(f"Analyzing Reference Track: {track_path.name}...")
    track_asset, _ = analyze_track(str(track_path))
    target_bpm = track_asset.get("suggestedBpm", 126.0)
    print(f"Detected BPM: {target_bpm}")

    raw_lines = log_path.read_text().splitlines()
    summary, _ = _summarize_log_signal(log_path, raw_lines, live_mode=False)

    preview_path = str(output_path("java_anyma_remix.mp3"))
    options = {
        "waveformBins": summary["metrics"]["logCadenceBins"],
        "anomalyMarkers": summary["metrics"]["anomalyMarkers"],
        "presetId": "techno",
    }

    print("\nGenerating hybrid remix 'java_anyma_remix.mp3'...")
    asset, warnings = analyze_composition(
        source_kind="file",
        source_path=str(log_path),
        base_asset_category="log-signal",
        reference_type="track",
        reference_label=f"Hybrid Reference: {track_path.stem}",
        reference_bpm=target_bpm,
        reference_path=str(track_path),
        preview_output_path=preview_path,
        options=options,
    )

    if warnings:
        print("Warnings:", warnings)

    print(f"Art Asset Generated: {asset['title']}")
    print(f"File rendered at: {preview_path}")
    print(f"File size: {os.path.getsize(preview_path) // 1024} KB")
    print("\n--- Done ---")


if __name__ == "__main__":
    main()
