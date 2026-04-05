"""Contract layer tests — parse_request, ok_response, error_response, and
the full handle_request dispatch through the service layer.

These tests use the health + session actions deliberately to avoid needing
real files on disk for every case.
"""
from __future__ import annotations

import pytest

from maia_analyzer.contracts import (
    ContractError,
    error_response,
    ok_response,
    parse_request,
)
from maia_analyzer.service import handle_request

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

CONTRACT_VERSION = "1.0"

def _req(action: str, payload: dict | None = None, request_id: str = "req-1") -> dict:
    return {
        "contractVersion": CONTRACT_VERSION,
        "requestId": request_id,
        "action": action,
        "payload": payload if payload is not None else {},
    }


# ---------------------------------------------------------------------------
# parse_request
# ---------------------------------------------------------------------------


def test_parse_request_health_returns_parsed_dict():
    raw = _req("health")
    result = parse_request(raw)
    assert result["action"] == "health"
    assert result["requestId"] == "req-1"


def test_parse_request_wrong_version_raises():
    raw = _req("health")
    raw["contractVersion"] = "0.9"
    with pytest.raises(ContractError) as exc_info:
        parse_request(raw)
    assert exc_info.value.code == "invalid_contract_version"


def test_parse_request_missing_request_id_raises():
    raw = _req("health")
    raw["requestId"] = ""
    with pytest.raises(ContractError) as exc_info:
        parse_request(raw)
    assert exc_info.value.code == "invalid_request_id"


def test_parse_request_unsupported_action_raises():
    raw = _req("fly")
    with pytest.raises(ContractError) as exc_info:
        parse_request(raw)
    assert exc_info.value.code == "unsupported_action"


def test_parse_request_non_dict_payload_raises():
    raw = _req("analyze")
    raw["payload"] = "not-a-dict"
    with pytest.raises(ContractError) as exc_info:
        parse_request(raw)
    assert exc_info.value.code == "invalid_payload"


def test_parse_request_analyze_validates_asset_type():
    raw = _req("analyze", {"assetType": "unknown_type", "source": {"kind": "file", "path": "/x"}})
    with pytest.raises(ContractError) as exc_info:
        parse_request(raw)
    assert exc_info.value.code == "unsupported_asset_type"


def test_parse_request_analyze_validates_source_kind():
    raw = _req("analyze", {
        "assetType": "repo_analysis",
        "source": {"kind": "ftp", "path": "/x"},
    })
    with pytest.raises(ContractError) as exc_info:
        parse_request(raw)
    assert exc_info.value.code == "invalid_source_kind"


def test_parse_request_analyze_validates_source_path():
    raw = _req("analyze", {
        "assetType": "repo_analysis",
        "source": {"kind": "file", "path": ""},
    })
    with pytest.raises(ContractError) as exc_info:
        parse_request(raw)
    assert exc_info.value.code == "invalid_source_path"


# ---------------------------------------------------------------------------
# ok_response / error_response
# ---------------------------------------------------------------------------


def test_ok_response_shape():
    resp = ok_response("req-2", {"key": "value"})
    assert resp["status"] == "ok"
    assert resp["contractVersion"] == CONTRACT_VERSION
    assert resp["payload"]["key"] == "value"
    assert resp["warnings"] == []


def test_ok_response_passes_warnings():
    resp = ok_response("req-3", {}, ["w1", "w2"])
    assert resp["warnings"] == ["w1", "w2"]


def test_error_response_shape():
    resp = error_response("req-4", "some_code", "some message")
    assert resp["status"] == "error"
    assert resp["error"]["code"] == "some_code"
    assert resp["error"]["message"] == "some message"
    assert resp["warnings"] == []


# ---------------------------------------------------------------------------
# handle_request — health
# ---------------------------------------------------------------------------


def test_handle_request_health_ok():
    result = handle_request(_req("health"))
    assert result["status"] == "ok"
    payload = result["payload"]
    assert "analyzerVersion" in payload
    assert "health" in payload["supportedActions"]
    assert isinstance(payload["supportedTrackFormats"], list)


def test_handle_request_health_bad_version_returns_error():
    raw = _req("health")
    raw["contractVersion"] = "99.0"
    result = handle_request(raw)
    assert result["status"] == "error"
    assert result["error"]["code"] == "invalid_contract_version"


def test_handle_request_non_dict_returns_error():
    result = handle_request("not-a-dict")
    assert result["status"] == "error"


def test_handle_request_unknown_action_returns_error():
    raw = _req("health")
    raw["action"] = "nope"
    result = handle_request(raw)
    assert result["status"] == "error"
    assert result["error"]["code"] == "unsupported_action"


# ---------------------------------------------------------------------------
# handle_request — session_start / session_stop round-trip
# ---------------------------------------------------------------------------


def test_handle_request_session_lifecycle():
    session_id = "test-session-abc"

    # start
    start_result = handle_request({
        "contractVersion": CONTRACT_VERSION,
        "requestId": "req-s1",
        "action": "session_start",
        "payload": {
            "sessionId": session_id,
            "adapterKind": "file",
            "source": "/tmp/fake.log",
        },
    })
    assert start_result["status"] == "ok"
    session = start_result["payload"]["session"]
    assert session["sessionId"] == session_id
    assert session["adapterKind"] == "file"

    # stop
    stop_result = handle_request({
        "contractVersion": CONTRACT_VERSION,
        "requestId": "req-s2",
        "action": "session_stop",
        "payload": {"sessionId": session_id},
    })
    assert stop_result["status"] == "ok"
    assert stop_result["payload"]["stopped"] is True


def test_handle_request_session_start_missing_session_id():
    result = handle_request({
        "contractVersion": CONTRACT_VERSION,
        "requestId": "req-s3",
        "action": "session_start",
        "payload": {"adapterKind": "file", "source": "/tmp/fake.log"},
    })
    assert result["status"] == "error"
    assert result["error"]["code"] == "missing_session_id"


def test_handle_request_session_poll_not_found():
    result = handle_request({
        "contractVersion": CONTRACT_VERSION,
        "requestId": "req-s4",
        "action": "session_poll",
        "payload": {"sessionId": "nonexistent-xyz"},
    })
    assert result["status"] == "error"
    assert result["error"]["code"] == "session_not_found"
