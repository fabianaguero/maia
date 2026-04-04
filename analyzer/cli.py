"""
Maia analyzer CLI.

Usage:
    python -m analyzer.cli analyze-track --file /path/to/track.mp3
    python -m analyzer.cli analyze-repo --path /path/to/repo
    python -m analyzer.cli list-assets [--db /path/to/db] [--type track_analysis]
    python -m analyzer.cli get-asset --id <uuid> [--db /path/to/db]
"""
from __future__ import annotations

import argparse
import json
import logging
import sys

logging.basicConfig(level=logging.WARNING, stream=sys.stderr)


def cmd_analyze_track(args: argparse.Namespace) -> None:
    from analyzer.audio_analyzer import analyze_track
    from analyzer.database import save_asset

    result = analyze_track(args.file)
    save_asset(result, db_path=args.db)
    print(json.dumps(result, indent=2))


def cmd_analyze_repo(args: argparse.Namespace) -> None:
    from analyzer.repo_analyzer import analyze_repo
    from analyzer.database import save_asset

    result = analyze_repo(args.path)
    save_asset(result, db_path=args.db)
    print(json.dumps(result, indent=2))


def cmd_list_assets(args: argparse.Namespace) -> None:
    from analyzer.database import list_assets

    results = list_assets(asset_type=args.type, db_path=args.db)
    print(json.dumps(results, indent=2))


def cmd_get_asset(args: argparse.Namespace) -> None:
    from analyzer.database import get_asset

    result = get_asset(args.id, db_path=args.db)
    if result is None:
        print(json.dumps({"error": f"Asset not found: {args.id}"}), file=sys.stderr)
        sys.exit(1)
    print(json.dumps(result, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Maia – Musical Analysis & Arrangement analyzer CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # analyze-track
    p_track = subparsers.add_parser("analyze-track", help="Analyze an audio track")
    p_track.add_argument("--file", required=True, help="Path to audio file")
    p_track.add_argument("--db", default=None, help="Path to SQLite database")
    p_track.set_defaults(func=cmd_analyze_track)

    # analyze-repo
    p_repo = subparsers.add_parser("analyze-repo", help="Analyze a code repository")
    p_repo.add_argument("--path", required=True, help="Path to repository")
    p_repo.add_argument("--db", default=None, help="Path to SQLite database")
    p_repo.set_defaults(func=cmd_analyze_repo)

    # list-assets
    p_list = subparsers.add_parser("list-assets", help="List stored musical assets")
    p_list.add_argument("--db", default=None, help="Path to SQLite database")
    p_list.add_argument(
        "--type",
        choices=["track_analysis", "repo_analysis", "base_asset", "composition_result"],
        help="Filter by asset type",
    )
    p_list.set_defaults(func=cmd_list_assets)

    # get-asset
    p_get = subparsers.add_parser("get-asset", help="Get a specific asset by ID")
    p_get.add_argument("--id", required=True, help="Asset UUID")
    p_get.add_argument("--db", default=None, help="Path to SQLite database")
    p_get.set_defaults(func=cmd_get_asset)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
