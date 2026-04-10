from __future__ import annotations

import io
import json
import sys

from maia_analyzer import cli


def test_cli_health_command_prints_ok_response(monkeypatch, capsys):
    monkeypatch.setattr(sys, "argv", ["maia_analyzer.cli", "health"])

    exit_code = cli.main()

    captured = capsys.readouterr()
    payload = json.loads(captured.out.strip())
    assert exit_code == 0
    assert payload["status"] == "ok"


def test_cli_analyze_missing_stdin_returns_error(monkeypatch, capsys):
    monkeypatch.setattr(sys, "argv", ["maia_analyzer.cli", "analyze"])
    monkeypatch.setattr(sys, "stdin", io.StringIO(""))

    exit_code = cli.main()

    captured = capsys.readouterr()
    payload = json.loads(captured.out.strip())
    assert exit_code == 1
    assert payload["error"]["code"] == "missing_stdin"


def test_cli_analyze_invalid_json_returns_error(monkeypatch, capsys):
    monkeypatch.setattr(sys, "argv", ["maia_analyzer.cli", "analyze"])
    monkeypatch.setattr(sys, "stdin", io.StringIO("{bad json"))

    exit_code = cli.main()

    captured = capsys.readouterr()
    payload = json.loads(captured.out.strip())
    assert exit_code == 1
    assert payload["error"]["code"] == "invalid_json"


def test_cli_analyze_ok_response_returns_zero(monkeypatch, capsys):
    monkeypatch.setattr(sys, "argv", ["maia_analyzer.cli", "analyze"])
    monkeypatch.setattr(
        sys,
        "stdin",
        io.StringIO(json.dumps({"contractVersion": "1.0", "requestId": "r1", "action": "health", "payload": {}})),
    )
    monkeypatch.setattr(
        cli,
        "handle_request",
        lambda request: {
            "contractVersion": "1.0",
            "requestId": request["requestId"],
            "status": "ok",
            "payload": {"hello": "world"},
            "warnings": [],
        },
    )

    exit_code = cli.main()

    captured = capsys.readouterr()
    payload = json.loads(captured.out.strip())
    assert exit_code == 0
    assert payload["payload"]["hello"] == "world"


def test_cli_export_stems_success(monkeypatch, tmp_path, capsys):
    monkeypatch.setattr(
        sys,
        "argv",
        ["maia_analyzer.cli", "export-stems", "--dest-dir", str(tmp_path)],
    )
    monkeypatch.setattr(
        sys,
        "stdin",
        io.StringIO(
            json.dumps(
                {
                    "bpm": 120,
                    "durationSeconds": 4,
                    "sections": [],
                    "renderPreview": {},
                }
            )
        ),
    )

    monkeypatch.setitem(sys.modules, "maia_analyzer.composition", __import__("maia_analyzer.composition", fromlist=["write_stem_wavs"]))
    monkeypatch.setattr(
        "maia_analyzer.composition.write_stem_wavs",
        lambda dest_dir, bpm, duration_seconds, sections, render_preview: [
            {"stemId": "foundation", "path": str(dest_dir / "foundation.wav")}
        ],
    )

    exit_code = cli.main()

    captured = capsys.readouterr()
    payload = json.loads(captured.out.strip())
    assert exit_code == 0
    assert payload["status"] == "ok"
    assert payload["stems"][0]["stemId"] == "foundation"
