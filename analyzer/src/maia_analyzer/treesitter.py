from __future__ import annotations

import math
from collections import Counter
from pathlib import Path
from typing import Any

try:
    import tree_sitter_java as _ts_java
    import tree_sitter_kotlin as _ts_kotlin
    from tree_sitter import Language as _Language
    from tree_sitter import Parser as _Parser

    _JAVA_LANGUAGE: Any = _Language(_ts_java.language())
    _KOTLIN_LANGUAGE: Any = _Language(_ts_kotlin.language())
    _TS_AVAILABLE = True
except (ImportError, ModuleNotFoundError):  # pragma: no cover - optional dependency
    _JAVA_LANGUAGE = None
    _KOTLIN_LANGUAGE = None
    _Parser = None  # type: ignore[assignment,misc]
    _TS_AVAILABLE = False


def _java_parser():
    if not _TS_AVAILABLE:
        return None
    return _Parser(_JAVA_LANGUAGE)


def _kotlin_parser():
    if not _TS_AVAILABLE:
        return None
    return _Parser(_KOTLIN_LANGUAGE)

JAVA_ANNOTATIONS = {
    "Path",
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "HEAD",
    "OPTIONS",
    "Produces",
    "Consumes",
}

KOTLIN_ANNOTATIONS = {
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "Path",
    "RequestMapping",
    "RestController",
    "Controller",
    "Service",
    "Repository",
    "Component",
}


def analyze_java_sources(java_files: list[Path], max_files: int = 220) -> dict[str, Any]:
    parser = _java_parser()
    if parser is None:
        return {
            "enabled": False,
            "error": "tree-sitter is not installed",
            "fileCount": 0,
            "parseErrors": 0,
        }

    file_count = 0
    parse_errors = 0
    class_count = 0
    interface_count = 0
    enum_count = 0
    record_count = 0
    method_count = 0
    field_count = 0
    annotation_count = 0
    endpoint_count = 0
    annotation_breakdown: Counter[str] = Counter()
    jakarta_imports = 0
    javax_imports = 0

    for file_path in java_files[:max_files]:
        try:
            source_bytes = file_path.read_bytes()
        except OSError:
            continue

        file_count += 1
        tree = parser.parse(source_bytes)
        if tree.root_node.has_error:
            parse_errors += 1

        for node in _walk_nodes(tree.root_node):
            if node.type == "class_declaration":
                class_count += 1
            elif node.type == "interface_declaration":
                interface_count += 1
            elif node.type == "enum_declaration":
                enum_count += 1
            elif node.type == "record_declaration":
                record_count += 1
            elif node.type == "method_declaration":
                method_count += 1
            elif node.type == "field_declaration":
                field_count += 1
            elif node.type in {"annotation", "marker_annotation", "normal_annotation"}:
                annotation_count += 1
                name = _annotation_name(source_bytes, node)
                if name:
                    annotation_breakdown[name] += 1
                    if name in JAVA_ANNOTATIONS:
                        endpoint_count += 1

        jakarta_imports += _count_imports(source_bytes, "jakarta.")
        javax_imports += _count_imports(source_bytes, "javax.")

    return {
        "enabled": True,
        "fileCount": file_count,
        "fileLimit": max_files,
        "parseErrors": parse_errors,
        "classCount": class_count,
        "interfaceCount": interface_count,
        "enumCount": enum_count,
        "recordCount": record_count,
        "methodCount": method_count,
        "fieldCount": field_count,
        "annotationCount": annotation_count,
        "endpointAnnotationCount": endpoint_count,
        "jakartaImportCount": jakarta_imports,
        "javaxImportCount": javax_imports,
        "annotationBreakdown": dict(annotation_breakdown.most_common(8)),
    }


def analyze_kotlin_sources(kotlin_files: list[Path], max_files: int = 220) -> dict[str, Any]:
    parser = _kotlin_parser()
    if parser is None:
        return {
            "enabled": False,
            "error": "tree-sitter is not installed",
            "fileCount": 0,
            "parseErrors": 0,
        }
    file_count = 0
    parse_errors = 0
    class_count = 0
    interface_count = 0
    object_count = 0
    function_count = 0
    property_count = 0
    annotation_count = 0
    endpoint_count = 0
    annotation_breakdown: Counter[str] = Counter()

    for file_path in kotlin_files[:max_files]:
        try:
            source_bytes = file_path.read_bytes()
        except OSError:
            continue

        file_count += 1
        tree = parser.parse(source_bytes)
        if tree.root_node.has_error:
            parse_errors += 1

        for node in _walk_nodes(tree.root_node):
            if node.type == "class_declaration":
                class_count += 1
            elif node.type == "object_declaration":
                object_count += 1
            elif node.type in {"interface_declaration", "class_body"}:
                if node.type == "interface_declaration":
                    interface_count += 1
            elif node.type == "function_declaration":
                function_count += 1
            elif node.type == "property_declaration":
                property_count += 1
            elif node.type in {"annotation", "single_annotation", "multi_annotation"}:
                annotation_count += 1
                name = _annotation_name(source_bytes, node)
                if name:
                    annotation_breakdown[name] += 1
                    if name in KOTLIN_ANNOTATIONS:
                        endpoint_count += 1

    return {
        "enabled": True,
        "fileCount": file_count,
        "fileLimit": max_files,
        "parseErrors": parse_errors,
        "classCount": class_count,
        "interfaceCount": interface_count,
        "objectCount": object_count,
        "functionCount": function_count,
        "propertyCount": property_count,
        "annotationCount": annotation_count,
        "endpointAnnotationCount": endpoint_count,
        "annotationBreakdown": dict(annotation_breakdown.most_common(8)),
    }


def build_repo_waveform_bins(
    java_files: list[Path],
    kotlin_files: list[Path],
    waveform_bins: int = 56,
) -> list[float]:
    """Derive waveform bins from per-file structural density as if tailing the codebase."""
    all_files = java_files + kotlin_files
    if not all_files:
        return []

    if not _TS_AVAILABLE:
        return []

    densities: list[float] = []
    java_parser = _java_parser()
    kotlin_parser = _kotlin_parser()
    structure_nodes_java = {
        "class_declaration",
        "interface_declaration",
        "method_declaration",
        "annotation",
        "marker_annotation",
    }
    structure_nodes_kotlin = {
        "class_declaration",
        "function_declaration",
        "property_declaration",
        "annotation",
        "single_annotation",
    }

    for file_path in all_files[:400]:
        try:
            source_bytes = file_path.read_bytes()
        except OSError:
            densities.append(0.0)
            continue

        is_kotlin = file_path.suffix.lower() == ".kt"
        parser = kotlin_parser if is_kotlin else java_parser
        node_types = structure_nodes_kotlin if is_kotlin else structure_nodes_java

        tree = parser.parse(source_bytes)
        count = sum(
            1 for node in _walk_nodes(tree.root_node) if node.type in node_types
        )
        size_factor = max(1, len(source_bytes) / 1024)
        densities.append(count / size_factor)

    if not densities:
        return []

    target = max(8, min(waveform_bins, 256))
    chunk = max(1, len(densities) // target)
    raw_bins: list[float] = []

    for start in range(0, len(densities), chunk):
        window = densities[start : start + chunk]
        if not window:
            continue
        raw_bins.append(sum(window) / len(window))
        if len(raw_bins) >= target:
            break

    # smooth with sine envelope to give it a musical shape
    peak = max(raw_bins) or 1.0
    result: list[float] = []
    for index, value in enumerate(raw_bins):
        envelope = 0.35 + math.sin((index / max(1, len(raw_bins) - 1)) * math.pi) * 0.65
        result.append(round(min(1.0, (value / peak) * envelope), 3))

    return result


def _walk_nodes(root: Any) -> list[Any]:
    stack = [root]
    ordered: list[Any] = []

    while stack:
        node = stack.pop()
        ordered.append(node)
        children = getattr(node, "children", [])
        if children:
            stack.extend(reversed(children))

    return ordered


def _annotation_name(source_bytes: bytes, node: Any) -> str | None:
    try:
        snippet = source_bytes[node.start_byte : node.end_byte].decode("utf-8", "ignore")
    except Exception:
        return None

    if "@" not in snippet:
        return None

    start = snippet.find("@") + 1
    end = start
    while end < len(snippet) and (snippet[end].isalnum() or snippet[end] in {"_", "."}):
        end += 1

    name = snippet[start:end].split(".")[-1]
    return name or None


def _count_imports(source_bytes: bytes, namespace: str) -> int:
    needle = f"import {namespace}".encode("utf-8")
    return source_bytes.count(needle)
