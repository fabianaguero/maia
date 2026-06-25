from common import REPO_ROOT, output_path
from maia_analyzer.composition import analyze_composition


def main():
    print("--- Generating Heartbeat Demo ---")
    repo_path = str(REPO_ROOT)
    preview_path = str(output_path("heartbeat_demo.mp3"))

    asset, warnings = analyze_composition(
        source_kind="directory",
        source_path=repo_path,
        base_asset_category="heartbeat",
        reference_type="manual",
        reference_bpm=92.0,
        preview_output_path=preview_path,
        options={
            "presetId": "heartbeat",
            "maxNesting": 12,
            "complexityScore": 45.5,
        },
    )

    if warnings:
        print("Warnings:", warnings)

    print(f"\nArt Asset Generated: {asset['title']}")
    print(f"Suggested BPM: {asset['suggestedBpm']}")
    print(f"File rendered at: {preview_path}")
    print("\n--- Done ---")


if __name__ == "__main__":
    main()
