from __future__ import annotations

from typing import Any


CONTRACT_VERSION = "1.0"
SUPPORTED_ACTIONS = {"health", "analyze", "session_start", "session_stop", "session_list", "session_poll"}
SUPPORTED_ASSET_TYPES = {
    "track_analysis",
    "repo_analysis",
    "base_asset",
    "composition_result",
}


class ContractError(ValueError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code


def parse_request(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise ContractError("invalid_request", "Request must be a JSON object.")

    contract_version = raw.get("contractVersion")
    if contract_version != CONTRACT_VERSION:
        raise ContractError(
            "invalid_contract_version",
            f"Expected contractVersion {CONTRACT_VERSION}.",
        )

    request_id = raw.get("requestId")
    if not isinstance(request_id, str) or not request_id:
        raise ContractError("invalid_request_id", "requestId must be a non-empty string.")

    action = raw.get("action")
    if action not in SUPPORTED_ACTIONS:
        raise ContractError("unsupported_action", f"Unsupported action: {action!r}.")

    payload = raw.get("payload")
    if not isinstance(payload, dict):
        raise ContractError("invalid_payload", "payload must be a JSON object.")

    if action == "analyze":
        asset_type = payload.get("assetType")
        if asset_type not in SUPPORTED_ASSET_TYPES:
            raise ContractError(
                "unsupported_asset_type",
                f"Unsupported assetType: {asset_type!r}.",
            )

        source = payload.get("source")
        if not isinstance(source, dict):
            raise ContractError("invalid_source", "payload.source must be a JSON object.")

        source_kind = source.get("kind")
        if source_kind not in {"file", "directory", "url"}:
            raise ContractError(
                "invalid_source_kind",
                "payload.source.kind must be 'file', 'directory', or 'url'.",
            )

        source_path = source.get("path")
        if not isinstance(source_path, str) or not source_path:
            raise ContractError(
                "invalid_source_path",
                "payload.source.path must be a non-empty string.",
            )

        options = payload.get("options", {})
        if not isinstance(options, dict):
            raise ContractError("invalid_options", "payload.options must be a JSON object.")

    return {
        "contractVersion": contract_version,
        "requestId": request_id,
        "action": action,
        "payload": payload,
    }


def ok_response(
    request_id: str,
    payload: dict[str, Any],
    warnings: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "contractVersion": CONTRACT_VERSION,
        "requestId": request_id,
        "status": "ok",
        "payload": payload,
        "warnings": warnings or [],
    }


def error_response(
    request_id: str,
    code: str,
    message: str,
    warnings: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "contractVersion": CONTRACT_VERSION,
        "requestId": request_id,
        "status": "error",
        "error": {
            "code": code,
            "message": message,
        },
        "warnings": warnings or [],
    }
