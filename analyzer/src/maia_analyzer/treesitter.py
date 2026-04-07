from __future__ import annotations

import math
from collections import Counter
from pathlib import Path
from typing import Any

try:
    import tree_sitter_java as _ts_java
    import tree_sitter_kotlin as _ts_kotlin
    import tree_sitter_python as _ts_python
    import tree_sitter_rust as _ts_rust
    import tree_sitter_go as _ts_go
    from tree_sitter import Language as _Language
    from tree_sitter import Parser as _Parser

    _JAVA_LANGUAGE: Any = _Language(_ts_java.language())
    _KOTLIN_LANGUAGE: Any = _Language(_ts_kotlin.language())
    _PYTHON_LANGUAGE: Any = _Language(_ts_python.language())
    _RUST_LANGUAGE: Any = _Language(_ts_rust.language())
    _GO_LANGUAGE: Any = _Language(_ts_go.language())
    _TS_AVAILABLE = True
except (ImportError, ModuleNotFoundError):  # pragma: no cover - optional dependency
    _JAVA_LANGUAGE = None
    _KOTLIN_LANGUAGE = None
    _PYTHON_LANGUAGE = None
    _RUST_LANGUAGE = None
    _GO_LANGUAGE = None
    _Parser = None  # type: ignore[assignment,misc]
    _TS_AVAILABLE = False

try:
    import tree_sitter_typescript as _ts_typescript

    _TYPESCRIPT_LANGUAGE: Any = _Language(_ts_typescript.language_typescript())
    _TSX_LANGUAGE: Any = _Language(_ts_typescript.language_tsx())
    _TS_TYPESCRIPT_AVAILABLE = _TS_AVAILABLE
except (ImportError, ModuleNotFoundError, AttributeError):  # pragma: no cover
    try:
        import tree_sitter_typescript as _ts_typescript  # type: ignore[import]

        _TYPESCRIPT_LANGUAGE = _Language(_ts_typescript.language())
        _TSX_LANGUAGE = _TYPESCRIPT_LANGUAGE
        _TS_TYPESCRIPT_AVAILABLE = _TS_AVAILABLE
    except Exception:  # pragma: no cover
        _TYPESCRIPT_LANGUAGE = None
        _TSX_LANGUAGE = None
        _TS_TYPESCRIPT_AVAILABLE = False


def _java_parser():
    if not _TS_AVAILABLE:
        return None
    return _Parser(_JAVA_LANGUAGE)


def _kotlin_parser():
    if not _TS_AVAILABLE:
        return None
    return _Parser(_KOTLIN_LANGUAGE)


def _python_parser():
    if not _TS_AVAILABLE:
        return None
    return _Parser(_PYTHON_LANGUAGE)


def _typescript_parser():
    if not _TS_TYPESCRIPT_AVAILABLE or _TYPESCRIPT_LANGUAGE is None:
        return None
    return _Parser(_TYPESCRIPT_LANGUAGE)


def _tsx_parser():
    if not _TS_TYPESCRIPT_AVAILABLE or _TSX_LANGUAGE is None:
        return None
    return _Parser(_TSX_LANGUAGE)


def _rust_parser():
    if not _TS_AVAILABLE:
        return None
    return _Parser(_RUST_LANGUAGE)


def _go_parser():
    if not _TS_AVAILABLE:
        return None
    return _Parser(_GO_LANGUAGE)

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
    javax_imports = 0
    max_nesting = 0
    complexity_score = 0

    for file_path in java_files[:max_files]:
        try:
            source_bytes = file_path.read_bytes()
        except OSError:
            continue

        file_count += 1
        tree = parser.parse(source_bytes)
        if tree.root_node.has_error:
            parse_errors += 1

        file_nesting = _calculate_max_nesting(tree.root_node)
        max_nesting = max(max_nesting, file_nesting)
        complexity_score += _calculate_node_complexity(tree.root_node)

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
        "maxNesting": max_nesting,
        "complexityScore": round(complexity_score / max(1, file_count), 2),
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
    max_nesting = 0
    complexity_score = 0

    for file_path in kotlin_files[:max_files]:
        try:
            source_bytes = file_path.read_bytes()
        except OSError:
            continue

        file_count += 1
        tree = parser.parse(source_bytes)
        if tree.root_node.has_error:
            parse_errors += 1

        max_nesting = max(max_nesting, _calculate_max_nesting(tree.root_node))
        complexity_score += _calculate_node_complexity(tree.root_node)

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
        "maxNesting": max_nesting,
        "complexityScore": round(complexity_score / max(1, file_count), 2),
        "annotationBreakdown": dict(annotation_breakdown.most_common(8)),
    }


# ---------------------------------------------------------------------------
# Python
# ---------------------------------------------------------------------------

PYTHON_FRAMEWORK_IMPORTS = {
    "fastapi",
    "flask",
    "django",
    "starlette",
    "aiohttp",
    "tornado",
    "sanic",
    "falcon",
    "bottle",
}


def analyze_python_sources(python_files: list[Path], max_files: int = 220) -> dict[str, Any]:
    parser = _python_parser()
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
    function_count = 0
    async_function_count = 0
    decorator_count = 0
    import_count = 0
    framework_imports: set[str] = set()
    max_nesting = 0
    complexity_score = 0

    for file_path in python_files[:max_files]:
        try:
            source_bytes = file_path.read_bytes()
        except OSError:
            continue

        file_count += 1
        tree = parser.parse(source_bytes)
        if tree.root_node.has_error:
            parse_errors += 1

        max_nesting = max(max_nesting, _calculate_max_nesting(tree.root_node))
        complexity_score += _calculate_node_complexity(tree.root_node)

        for node in _walk_nodes(tree.root_node):
            if node.type == "class_definition":
                class_count += 1
            elif node.type == "function_definition":
                function_count += 1
            elif node.type == "decorated_definition":
                # May wrap a function or class
                pass
            elif node.type == "decorator":
                decorator_count += 1
            elif node.type == "async_function_statement":
                async_function_count += 1
            elif node.type in {"import_statement", "import_from_statement"}:
                import_count += 1
                raw = source_bytes[node.start_byte:node.end_byte].decode("utf-8", "ignore")
                for fw in PYTHON_FRAMEWORK_IMPORTS:
                    if fw in raw.lower():
                        framework_imports.add(fw)

        # Detect async functions from source text (simpler than tree traversal)
        text = source_bytes.decode("utf-8", "ignore")
        async_function_count = text.count("async def ")

    return {
        "enabled": True,
        "fileCount": file_count,
        "fileLimit": max_files,
        "parseErrors": parse_errors,
        "classCount": class_count,
        "functionCount": function_count,
        "asyncFunctionCount": async_function_count,
        "decoratorCount": decorator_count,
        "importCount": import_count,
        "maxNesting": max_nesting,
        "complexityScore": round(complexity_score / max(1, file_count), 2),
        "detectedFrameworks": sorted(framework_imports),
    }


# ---------------------------------------------------------------------------
# TypeScript / TSX
# ---------------------------------------------------------------------------

TYPESCRIPT_FRAMEWORK_IMPORTS = {
    "react",
    "next",
    "vue",
    "angular",
    "svelte",
    "express",
    "fastify",
    "nestjs",
    "@nestjs",
    "koa",
}


def analyze_typescript_sources(ts_files: list[Path], max_files: int = 220) -> dict[str, Any]:
    if not _TS_TYPESCRIPT_AVAILABLE or _TYPESCRIPT_LANGUAGE is None:
        return {
            "enabled": False,
            "error": "tree-sitter-typescript is not installed",
            "fileCount": 0,
            "parseErrors": 0,
        }

    ts_parser = _typescript_parser()
    tsx_parser = _tsx_parser()

    file_count = 0
    parse_errors = 0
    class_count = 0
    function_count = 0
    interface_count = 0
    type_alias_count = 0
    decorator_count = 0
    framework_imports: set[str] = set()
    max_nesting = 0
    complexity_score = 0

    for file_path in ts_files[:max_files]:
        try:
            source_bytes = file_path.read_bytes()
        except OSError:
            continue

        file_count += 1
        is_tsx = file_path.suffix.lower() == ".tsx"
        parser = tsx_parser if is_tsx else ts_parser
        if parser is None:
            continue

        tree = parser.parse(source_bytes)
        if tree.root_node.has_error:
            parse_errors += 1

        max_nesting = max(max_nesting, _calculate_max_nesting(tree.root_node))
        complexity_score += _calculate_node_complexity(tree.root_node)

        for node in _walk_nodes(tree.root_node):
            if node.type == "class_declaration":
                class_count += 1
            elif node.type in {"function_declaration", "arrow_function", "method_definition"}:
                function_count += 1
            elif node.type == "interface_declaration":
                interface_count += 1
            elif node.type == "type_alias_declaration":
                type_alias_count += 1
            elif node.type == "decorator":
                decorator_count += 1
            elif node.type in {"import_statement", "import_declaration"}:
                raw = source_bytes[node.start_byte:node.end_byte].decode("utf-8", "ignore").lower()
                for fw in TYPESCRIPT_FRAMEWORK_IMPORTS:
                    if fw in raw:
                        framework_imports.add(fw.lstrip("@"))

    return {
        "enabled": True,
        "fileCount": file_count,
        "fileLimit": max_files,
        "parseErrors": parse_errors,
        "classCount": class_count,
        "functionCount": function_count,
        "interfaceCount": interface_count,
        "typeAliasCount": type_alias_count,
        "decoratorCount": decorator_count,
        "maxNesting": max_nesting,
        "complexityScore": round(complexity_score / max(1, file_count), 2),
        "detectedFrameworks": sorted(framework_imports),
    }


# ---------------------------------------------------------------------------
# Rust
# ---------------------------------------------------------------------------


def analyze_rust_sources(rust_files: list[Path], max_files: int = 220) -> dict[str, Any]:
    parser = _rust_parser()
    if parser is None:
        return {
            "enabled": False,
            "error": "tree-sitter is not installed",
            "fileCount": 0,
            "parseErrors": 0,
        }

    file_count = 0
    parse_errors = 0
    struct_count = 0
    enum_count = 0
    trait_count = 0
    impl_count = 0
    function_count = 0
    macro_count = 0
    unsafe_count = 0
    max_nesting = 0
    complexity_score = 0

    for file_path in rust_files[:max_files]:
        try:
            source_bytes = file_path.read_bytes()
        except OSError:
            continue

        file_count += 1
        tree = parser.parse(source_bytes)
        if tree.root_node.has_error:
            parse_errors += 1

        max_nesting = max(max_nesting, _calculate_max_nesting(tree.root_node))
        complexity_score += _calculate_node_complexity(tree.root_node)

        for node in _walk_nodes(tree.root_node):
            if node.type == "struct_item":
                struct_count += 1
            elif node.type == "enum_item":
                enum_count += 1
            elif node.type == "trait_item":
                trait_count += 1
            elif node.type == "impl_item":
                impl_count += 1
            elif node.type in {"function_item", "function_signature_item"}:
                function_count += 1
            elif node.type == "macro_invocation":
                macro_count += 1
            elif node.type == "unsafe_block":
                unsafe_count += 1

    return {
        "enabled": True,
        "fileCount": file_count,
        "fileLimit": max_files,
        "parseErrors": parse_errors,
        "structCount": struct_count,
        "enumCount": enum_count,
        "traitCount": trait_count,
        "implCount": impl_count,
        "functionCount": function_count,
        "macroCount": macro_count,
        "unsafeCount": unsafe_count,
        "maxNesting": max_nesting,
        "complexityScore": round(complexity_score / max(1, file_count), 2),
    }


# ---------------------------------------------------------------------------
# Go
# ---------------------------------------------------------------------------


def analyze_go_sources(go_files: list[Path], max_files: int = 220) -> dict[str, Any]:
    parser = _go_parser()
    if parser is None:
        return {
            "enabled": False,
            "error": "tree-sitter is not installed",
            "fileCount": 0,
            "parseErrors": 0,
        }

    file_count = 0
    parse_errors = 0
    function_count = 0
    method_count = 0
    struct_count = 0
    interface_count = 0
    goroutine_count = 0
    channel_count = 0
    import_count = 0
    max_nesting = 0
    complexity_score = 0

    for file_path in go_files[:max_files]:
        try:
            source_bytes = file_path.read_bytes()
        except OSError:
            continue

        file_count += 1
        tree = parser.parse(source_bytes)
        if tree.root_node.has_error:
            parse_errors += 1

        max_nesting = max(max_nesting, _calculate_max_nesting(tree.root_node))
        complexity_score += _calculate_node_complexity(tree.root_node)

        for node in _walk_nodes(tree.root_node):
            if node.type == "function_declaration":
                function_count += 1
            elif node.type == "method_declaration":
                method_count += 1
            elif node.type == "type_declaration":
                # Inspect inner type to distinguish struct vs interface
                for child in getattr(node, "children", []):
                    if child.type == "type_spec":
                        for grandchild in getattr(child, "children", []):
                            if grandchild.type == "struct_type":
                                struct_count += 1
                            elif grandchild.type == "interface_type":
                                interface_count += 1
            elif node.type == "go_statement":
                goroutine_count += 1
            elif node.type in {"channel_type", "receive_statement", "send_statement"}:
                channel_count += 1
            elif node.type == "import_declaration":
                import_count += 1

    return {
        "enabled": True,
        "fileCount": file_count,
        "fileLimit": max_files,
        "parseErrors": parse_errors,
        "functionCount": function_count,
        "methodCount": method_count,
        "structCount": struct_count,
        "interfaceCount": interface_count,
        "goroutineCount": goroutine_count,
        "channelCount": channel_count,
        "importCount": import_count,
        "maxNesting": max_nesting,
        "complexityScore": round(complexity_score / max(1, file_count), 2),
    }


def build_repo_waveform_bins(
    java_files: list[Path],
    kotlin_files: list[Path],
    python_files: list[Path] | None = None,
    ts_files: list[Path] | None = None,
    rust_files: list[Path] | None = None,
    go_files: list[Path] | None = None,
    waveform_bins: int = 56,
) -> list[float]:
    """Derive waveform bins from per-file structural density as if tailing the codebase."""
    all_files = (
        java_files
        + kotlin_files
        + (python_files or [])
        + (ts_files or [])
        + (rust_files or [])
        + (go_files or [])
    )
    if not all_files:
        return []

    if not _TS_AVAILABLE:
        return []

    java_parser = _java_parser()
    kotlin_parser = _kotlin_parser()
    python_parser_ = _python_parser()
    ts_parser_ = _typescript_parser()
    rust_parser_ = _rust_parser()
    go_parser_ = _go_parser()

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
    structure_nodes_python = {
        "class_definition",
        "function_definition",
        "decorator",
    }
    structure_nodes_ts = {
        "class_declaration",
        "function_declaration",
        "interface_declaration",
        "type_alias_declaration",
        "arrow_function",
        "decorator",
    }
    structure_nodes_rust = {
        "struct_item",
        "function_item",
        "trait_item",
        "impl_item",
        "enum_item",
    }
    structure_nodes_go = {
        "function_declaration",
        "method_declaration",
        "type_declaration",
    }

    ext_to_parser = {
        ".java": (java_parser, structure_nodes_java),
        ".kt": (kotlin_parser, structure_nodes_kotlin),
        ".py": (python_parser_, structure_nodes_python),
        ".ts": (ts_parser_, structure_nodes_ts),
        ".tsx": (ts_parser_, structure_nodes_ts),
        ".rs": (rust_parser_, structure_nodes_rust),
        ".go": (go_parser_, structure_nodes_go),
    }

    densities: list[float] = []

    for file_path in all_files[:400]:
        ext = file_path.suffix.lower()
        entry = ext_to_parser.get(ext)
        if entry is None:
            densities.append(0.0)
            continue
        parser, node_types = entry
        if parser is None:
            densities.append(0.0)
            continue

        try:
            source_bytes = file_path.read_bytes()
        except OSError:
            densities.append(0.0)
            continue

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


def _calculate_max_nesting(node: Any, current_depth: int = 0) -> int:
    """Calculate the maximum block nesting depth of the AST."""
    if not node.children:
        return current_depth

    # Nodes that increase nesting depth
    nesting_types = {
        "if_statement",
        "for_statement",
        "while_statement",
        "do_statement",
        "try_statement",
        "catch_clause",
        "switch_statement",
        "function_definition",
        "method_declaration",
        "class_declaration",
        "class_definition",
        "compound_statement",  # C-style blocks
        "block",               # Java/TS blocks
    }

    depth_increment = 1 if node.type in nesting_types else 0
    max_child_depth = current_depth + depth_increment

    for child in node.children:
        child_depth = _calculate_max_nesting(child, current_depth + depth_increment)
        max_child_depth = max(max_child_depth, child_depth)

    return max_child_depth


def _calculate_node_complexity(node: Any) -> float:
    """Calculate a heuristic complexity score (similar to cyclomatic complexity)."""
    score = 0.0
    stack = [node]

    # Types that represent decision points or independent units
    branch_types = {
        "if_statement",
        "for_statement",
        "while_statement",
        "do_statement",
        "case_statement",
        "catch_clause",
        "ternary_expression",
        "conditional_expression",
        "binary_expression",  # Logical '&&' and '||' handled below
    }

    while stack:
        n = stack.pop()
        if n.type in branch_types:
            score += 1.0
        elif n.type in {"function_definition", "method_declaration", "class_declaration"}:
            score += 0.5  # Base complexity for new units

        for child in n.children:
            stack.append(child)

    return score
