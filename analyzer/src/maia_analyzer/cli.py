from __future__ import annotations

import argparse
import json
import sys
from typing import Any

from .contracts import CONTRACT_VERSION
from .contracts import error_response
from .service import handle_request


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Maia analyzer JSON CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("health", help="Emit an analyzer health response")
    subparsers.add_parser("analyze", help="Read a request from stdin and emit a response")

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


if __name__ == "__main__":
    raise SystemExit(main())
