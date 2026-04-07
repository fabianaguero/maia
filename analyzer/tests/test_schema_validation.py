"""JSON schema validation tests.

Validates that:
- handle_request outputs conform to contracts/analyzer-response.schema.json
- analyze request payloads conform to contracts/analyzer-request.schema.json
- The musicalAsset sub-schema is respected by analyze_repository outputs
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest
import jsonschema

from maia_analyzer.service import handle_request
from maia_analyzer.repository import analyze_repository

from .fixtures import SAMPLE_LOG

# ---------------------------------------------------------------------------
# Load schemas from contracts/
# ---------------------------------------------------------------------------

_CONTRACTS_DIR = Path(__file__).parent.parent.parent.parent / "contracts"

def _load_schema(name: str) -> dict:
    path = _CONTRACTS_DIR / name
    if not path.exists():
        # Fallback: repo root / contracts
        path = Path(__file__).parent.parent.parent / "contracts" / name
    return json.loads(path.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def request_schema() -> dict:
    return _load_schema("analyzer-request.schema.json")


@pytest.fixture(scope="module")
def response_schema() -> dict:
    return _load_schema("analyzer-response.schema.json")


def _validate(instance: dict, schema: dict) -> None:
    """Raise jsonschema.ValidationError on failure."""
    validator = jsonschema.Draft202012Validator(schema)
    validator.validate(instance)


CONTRACT_VERSION = "1.0"

def _req(action: str, payload: dict | None = None, request_id: str = "v-1") -> dict:
    return {
        "contractVersion": CONTRACT_VERSION,
        "requestId": request_id,
        "action": action,
        "payload": payload if payload is not None else {},
    }


# ---------------------------------------------------------------------------
# Request schema validation
# ---------------------------------------------------------------------------


def test_request_schema_health_valid(request_schema):
    """A health request must validate against the request schema."""
    _validate(_req("health"), request_schema)


def test_request_schema_analyze_valid(request_schema):
    """A well-formed analyze request must validate."""
    _validate(
        _req("analyze", {
            "assetType": "repo_analysis",
            "source": {"kind": "file", "path": "/tmp/app.log"},
            "options": {"logTailChunk": "INFO hello"},
        }),
        request_schema,
    )


def test_request_schema_analyze_all_option_fields(request_schema):
    """All documented options fields must be schema-valid."""
    _validate(
        _req("analyze", {
            "assetType": "repo_analysis",
            "source": {"kind": "file", "path": "/tmp/app.log"},
            "options": {
                "waveformBins": 128,
                "beatGridResolution": 4,
                "captureBpmCurve": True,
                "logTailChunk": "INFO x",
                "logTailLiveMode": True,
            },
        }),
        request_schema,
    )


def test_request_schema_rejects_unknown_action(request_schema):
    """Unknown action must fail schema validation."""
    with pytest.raises(jsonschema.ValidationError):
        _validate(_req("fly"), request_schema)


def test_request_schema_rejects_missing_source(request_schema):
    """analyze without source must fail schema validation."""
    with pytest.raises(jsonschema.ValidationError):
        _validate(
            _req("analyze", {"assetType": "repo_analysis"}),
            request_schema,
        )


# ---------------------------------------------------------------------------
# Response schema validation — health
# ---------------------------------------------------------------------------


def test_response_schema_health_ok(response_schema):
    """health ok response must conform to response schema."""
    resp = handle_request(_req("health", request_id="sch-h1"))
    assert resp["status"] == "ok"
    _validate(resp, response_schema)


def test_response_schema_error(response_schema):
    """An error response must conform to response schema."""
    bad_req = _req("health", request_id="sch-e1")
    bad_req["contractVersion"] = "99.0"
    resp = handle_request(bad_req)
    assert resp["status"] == "error"
    _validate(resp, response_schema)


# ---------------------------------------------------------------------------
# Response schema validation — musicalAsset from repo analyze
# ---------------------------------------------------------------------------


def test_response_schema_analyze_repo(tmp_path, response_schema):
    """Full analyze response for a repo log must conform to response schema."""
    log_file = tmp_path / "app.log"
    log_file.write_text(SAMPLE_LOG, encoding="utf-8")

    resp = handle_request(_req("analyze", {
        "assetType": "repo_analysis",
        "source": {"kind": "file", "path": str(log_file)},
        "options": {"logTailChunk": SAMPLE_LOG},
    }, request_id="sch-a1"))

    assert resp["status"] == "ok", resp.get("error")
    _validate(resp, response_schema)


def test_musical_asset_all_required_fields(tmp_path):
    """analyze_repository output must include all required musicalAsset fields."""
    log_file = tmp_path / "app.log"
    log_file.write_text(SAMPLE_LOG, encoding="utf-8")

    asset, _ = analyze_repository(
        "file",
        str(log_file),
        options={"logTailChunk": SAMPLE_LOG},
    )

    for field in ("id", "assetType", "title", "sourcePath", "confidence",
                  "tags", "metrics", "artifacts", "createdAt"):
        assert field in asset, f"Missing field: {field}"

    artifacts = asset["artifacts"]
    for key in ("waveformBins", "beatGrid", "bpmCurve"):
        assert key in artifacts, f"Missing artifact: {key}"

    assert isinstance(artifacts["waveformBins"], list)
    assert isinstance(artifacts["beatGrid"], list)
    assert isinstance(artifacts["bpmCurve"], list)


def test_musical_asset_beat_grid_entries(tmp_path):
    """Each beatGrid entry must have index (int>=0) and second (float>=0)."""
    log_file = tmp_path / "app.log"
    log_file.write_text(SAMPLE_LOG, encoding="utf-8")

    asset, _ = analyze_repository(
        "file",
        str(log_file),
        options={"logTailChunk": SAMPLE_LOG},
    )

    for entry in asset["artifacts"]["beatGrid"]:
        assert isinstance(entry["index"], int) and entry["index"] >= 0
        assert isinstance(entry["second"], float) and entry["second"] >= 0


def test_musical_asset_confidence_range(tmp_path):
    """confidence must be in [0, 1]."""
    log_file = tmp_path / "app.log"
    log_file.write_text(SAMPLE_LOG, encoding="utf-8")

    asset, _ = analyze_repository(
        "file",
        str(log_file),
        options={"logTailChunk": SAMPLE_LOG},
    )

    assert 0.0 <= asset["confidence"] <= 1.0
