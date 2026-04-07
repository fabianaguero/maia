from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from .contracts import CONTRACT_VERSION
from .contracts import error_response
from .service import handle_request


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Maia analyzer JSON CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("health", help="Emit an analyzer health response")
    subparsers.add_parser("analyze", help="Read a request from stdin and emit a response")

    stems_p = subparsers.add_parser(
        "export-stems",
        help="Write per-stem WAV files for a composition render_preview (JSON on stdin)",
    )
    stems_p.add_argument("--dest-dir", required=True, help="Output directory for stem WAV files")

    return parser


def main() -> int:
    args = build_parser().parse_args()

    if args.command == "health":
        response = handle_request(
            {
                "contractVersion": CONTRACT_VERSION,
                "requestId": "health-check",
                "action": "health",
                "payload": {},
            }
        )
        print(json.dumps(response))
        return 0

    if args.command == "export-stems":
        return _cmd_export_stems(args)

    raw = sys.stdin.read().strip()
    if not raw:
        print(
            json.dumps(
                error_response(
                    "stdin-missing",
                    "missing_stdin",
                    "No JSON request was provided on stdin.",
                )
            )
        )
        return 1

    try:
        request: Any = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(
            json.dumps(
                error_response(
                    "stdin-invalid-json",
                    "invalid_json",
                    f"Invalid JSON on stdin: {exc.msg}.",
                )
            )
        )
        return 1

    response = handle_request(request)
    print(json.dumps(response))
    return 0 if response.get("status") == "ok" else 1


def _cmd_export_stems(args: Any) -> int:
    """Read a composition export-stems request from stdin and write per-stem WAVs."""
    from .composition import write_stem_wavs

    raw = sys.stdin.read().strip()
    if not raw:
        print(json.dumps({"status": "error", "error": "No JSON on stdin"}))
        return 1

    try:
        payload: Any = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(json.dumps({"status": "error", "error": f"Invalid JSON: {exc.msg}"}))
        return 1

    try:
        bpm = float(payload["bpm"])
        duration_seconds = float(payload["durationSeconds"])
        sections = list(payload["sections"])
        render_preview = dict(payload["renderPreview"])
    except (KeyError, TypeError, ValueError) as exc:
        print(json.dumps({"status": "error", "error": f"Missing field: {exc}"}))
        return 1

    dest_dir = Path(args.dest_dir)
    try:
        stems = write_stem_wavs(dest_dir, bpm, duration_seconds, sections, render_preview)
    except OSError as exc:
        print(json.dumps({"status": "error", "error": str(exc)}))
        return 1

    print(json.dumps({"status": "ok", "stems": stems}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
