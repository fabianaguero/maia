from __future__ import annotations

import hashlib
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from uuid import uuid4

from .treesitter import (
    analyze_java_sources,
    analyze_kotlin_sources,
    analyze_python_sources,
    analyze_typescript_sources,
    analyze_rust_sources,
    analyze_go_sources,
    build_repo_waveform_bins,
)


def _analyze_local_repository(
    source_path: str,
    options: dict[str, Any] | None = None,
) -> tuple[dict[str, Any], list[str]]:
    root = Path(source_path).expanduser().resolve()
    if not root.is_dir():
        raise FileNotFoundError(f"Repository path does not exist or is not a directory: {root}")

    warnings: list[str] = []
    extension_counts: Counter[str] = Counter()
    sample_packages: set[str] = set()

    java_files = 0
    kotlin_files = 0
    python_files = 0
    typescript_files = 0
    rust_files = 0
    go_files = 0
    test_files = 0
    controller_count = 0
    service_count = 0
    repository_count = 0
    entity_count = 0
    resource_count = 0
    has_jakarta = False
    has_javax = False

    java_paths: list[Path] = []
    kotlin_paths: list[Path] = []
    python_paths: list[Path] = []
    ts_paths: list[Path] = []
    rust_paths: list[Path] = []
    go_paths: list[Path] = []
    allowed_extensions = _normalize_extension_filter(options)
    allowed_languages = _normalize_language_filter(options)
    extension_by_language: dict[str, str | list[str]] = {
        "java": ".java",
        "kotlin": ".kt",
        "python": ".py",
        "typescript": [".ts", ".tsx"],
        "rust": ".rs",
        "go": ".go",
    }

    for file_path in root.rglob("*"):
        if not file_path.is_file():
            continue

        extension = file_path.suffix.lower() or "<none>"
        if not _should_include_extension(
            extension,
            allowed_extensions,
            allowed_languages,
            extension_by_language,
        ):
            continue
        extension_counts[extension] += 1

        if extension == ".java":
            java_files += 1
            if len(java_paths) < 600:
                java_paths.append(file_path)
            lower_name = file_path.name.lower()
            lower_parts = [part.lower() for part in file_path.parts]

            if "test" in lower_parts or lower_name.endswith("test.java"):
                test_files += 1
            if lower_name.endswith("controller.java"):
                controller_count += 1
            if lower_name.endswith("service.java"):
                service_count += 1
            if lower_name.endswith("repository.java"):
                repository_count += 1
            if lower_name.endswith("entity.java"):
                entity_count += 1
            if lower_name.endswith("resource.java"):
                resource_count += 1

            if len(sample_packages) < 5:
                try:
                    relative_parent = file_path.parent.relative_to(root)
                    sample_packages.add(str(relative_parent))
                except ValueError:
                    pass

            if java_files <= 25:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                has_jakarta = has_jakarta or ("jakarta." in content)
                has_javax = has_javax or ("javax." in content)

        if extension == ".kt":
            kotlin_files += 1
            if len(kotlin_paths) < 400:
                kotlin_paths.append(file_path)

        if extension == ".py":
            python_files += 1
            if len(python_paths) < 400:
                python_paths.append(file_path)
            lower_parts = [part.lower() for part in file_path.parts]
            if "test" in lower_parts or file_path.name.lower().startswith("test_"):
                test_files += 1

        if extension in {".ts", ".tsx"}:
            typescript_files += 1
            if len(ts_paths) < 400:
                ts_paths.append(file_path)

        if extension == ".rs":
            rust_files += 1
            if len(rust_paths) < 400:
                rust_paths.append(file_path)
            lower_parts_rs = [part.lower() for part in file_path.parts]
            if "test" in lower_parts_rs or "tests" in lower_parts_rs:
                test_files += 1

        if extension == ".go":
            go_files += 1
            if len(go_paths) < 400:
                go_paths.append(file_path)

    build_system = "plain"
    if (root / "pom.xml").exists():
        build_system = "maven"
    elif any((root / name).exists() for name in ("build.gradle", "build.gradle.kts", "settings.gradle.kts")):
        build_system = "gradle"
    elif (root / "Cargo.toml").exists():
        build_system = "cargo"
    elif (root / "go.mod").exists():
        build_system = "go-modules"
    elif any((root / name).exists() for name in ("package.json",)):
        build_system = "npm"
    elif (root / "pyproject.toml").exists() or (root / "setup.py").exists():
        build_system = "python-build"

    all_source_files = java_files + kotlin_files + python_files + typescript_files + rust_files + go_files
    if all_source_files == 0:
        warnings.append("No recognized source files were detected.")

    ast_metrics = analyze_java_sources(java_paths)
    kt_metrics = analyze_kotlin_sources(kotlin_paths)
    py_metrics = analyze_python_sources(python_paths)
    ts_metrics = analyze_typescript_sources(ts_paths)
    rs_metrics = analyze_rust_sources(rust_paths)
    go_metrics = analyze_go_sources(go_paths)

    ast_enabled = bool(ast_metrics.get("enabled"))
    kt_enabled = bool(kt_metrics.get("enabled")) and kotlin_files > 0
    py_enabled = bool(py_metrics.get("enabled")) and python_files > 0
    ts_enabled = bool(ts_metrics.get("enabled")) and typescript_files > 0
    rs_enabled = bool(rs_metrics.get("enabled")) and rust_files > 0
    go_enabled = bool(go_metrics.get("enabled")) and go_files > 0

    ast_class_count = int(ast_metrics.get("classCount", 0) or 0)
    ast_method_count = int(ast_metrics.get("methodCount", 0) or 0)
    ast_annotation_count = int(ast_metrics.get("annotationCount", 0) or 0)
    ast_endpoint_count = int(ast_metrics.get("endpointAnnotationCount", 0) or 0)
    kt_class_count = int(kt_metrics.get("classCount", 0) or 0)
    kt_function_count = int(kt_metrics.get("functionCount", 0) or 0)
    py_function_count = int(py_metrics.get("functionCount", 0) or 0)
    py_class_count = int(py_metrics.get("classCount", 0) or 0)
    ts_function_count = int(ts_metrics.get("functionCount", 0) or 0)
    ts_class_count = int(ts_metrics.get("classCount", 0) or 0)
    rs_function_count = int(rs_metrics.get("functionCount", 0) or 0)
    rs_struct_count = int(rs_metrics.get("structCount", 0) or 0)
    go_function_count = int(go_metrics.get("functionCount", 0) or 0)
    go_goroutine_count = int(go_metrics.get("goroutineCount", 0) or 0)

    # Complexity Aggregation
    max_nesting = max(
        ast_metrics.get("maxNesting", 0),
        kt_metrics.get("maxNesting", 0),
        py_metrics.get("maxNesting", 0),
        ts_metrics.get("maxNesting", 0),
        rs_metrics.get("maxNesting", 0),
        go_metrics.get("maxNesting", 0),
    )
    avg_complexity = (
        ast_metrics.get("complexityScore", 0) +
        kt_metrics.get("complexityScore", 0) +
        py_metrics.get("complexityScore", 0) +
        ts_metrics.get("complexityScore", 0) +
        rs_metrics.get("complexityScore", 0) +
        go_metrics.get("complexityScore", 0)
    ) / 6.0

    suggested_bpm = max(
        85,
        min(
            160,
            96
            + min(32, java_files // 8)
            + min(12, kotlin_files // 10)
            + min(14, python_files // 12)
            + min(14, typescript_files // 10)
            + min(10, rust_files // 8)
            + min(10, go_files // 8)
            + (max_nesting * 2)
            + min(25, int(avg_complexity * 3))
            + controller_count * 2
            + service_count
            + repository_count
            + entity_count // 2
            + (6 if has_jakarta else 0)
            + (3 if has_javax else 0)
            + (min(12, ast_method_count // 40) if ast_enabled else 0)
            + (min(10, ast_class_count // 30) if ast_enabled else 0)
            + (min(6, ast_annotation_count // 80) if ast_enabled else 0)
            + (min(8, ast_endpoint_count * 2) if ast_enabled else 0)
            + (min(8, kt_function_count // 30) if kt_enabled else 0)
            + (min(6, kt_class_count // 20) if kt_enabled else 0)
            + (min(8, py_function_count // 30) if py_enabled else 0)
            + (min(6, py_class_count // 20) if py_enabled else 0)
            + (min(8, ts_function_count // 30) if ts_enabled else 0)
            + (min(6, ts_class_count // 20) if ts_enabled else 0)
            + (min(8, rs_function_count // 25) if rs_enabled else 0)
            + (min(4, rs_struct_count // 20) if rs_enabled else 0)
            + (min(8, go_function_count // 25) if go_enabled else 0)
            + (min(4, go_goroutine_count // 5) if go_enabled else 0)
            + (4 if build_system == "maven" else 2 if build_system == "gradle" else 0),
        ),
    )

    confidence = round(
        min(
            0.94,
            0.3
            + min(0.35, java_files / 400)
            + min(0.12, kotlin_files / 200)
            + min(0.12, python_files / 200)
            + min(0.12, typescript_files / 200)
            + min(0.10, rust_files / 150)
            + min(0.10, go_files / 150)
            + (0.1 if build_system not in {"plain", "npm"} else 0.04)
            + (0.07 if has_jakarta or has_javax else 0)
            + (0.06 if ast_enabled and ast_metrics.get("parseErrors", 0) == 0 else 0)
            + (0.04 if kt_enabled and kt_metrics.get("parseErrors", 0) == 0 else 0)
            + (0.04 if py_enabled and py_metrics.get("parseErrors", 0) == 0 else 0)
            + (0.04 if ts_enabled and ts_metrics.get("parseErrors", 0) == 0 else 0)
            + min(0.12, max_nesting / 20)
            + min(0.08, avg_complexity / 50),
        ),
        2,
    )

    # Determine primary language by file count
    lang_counts = {
        "java": java_files,
        "kotlin": kotlin_files,
        "python": python_files,
        "typescript": typescript_files,
        "rust": rust_files,
        "go": go_files,
    }
    primary_language = max(lang_counts, key=lambda k: lang_counts[k])
    if lang_counts[primary_language] == 0:
        primary_language = "unknown"

    tags = ["repo-analysis", build_system, primary_language]
    if has_jakarta:
        tags.append("jakarta-ee")
    elif has_javax:
        tags.append("java-ee")
    if ast_enabled:
        tags.append("tree-sitter-java")
    if kt_enabled:
        tags.append("tree-sitter-kotlin")
    if py_enabled:
        tags.append("tree-sitter-python")
    if ts_enabled:
        tags.append("tree-sitter-typescript")
    if rs_enabled:
        tags.append("tree-sitter-rust")
    if go_enabled:
        tags.append("tree-sitter-go")

    metrics = {
        "buildSystem": build_system,
        "primaryLanguage": primary_language,
        "javaFileCount": java_files,
        "kotlinFileCount": kotlin_files,
        "pythonFileCount": python_files,
        "typescriptFileCount": typescript_files,
        "rustFileCount": rust_files,
        "goFileCount": go_files,
        "testFileCount": test_files,
        "controllerCount": controller_count,
        "serviceCount": service_count,
        "repositoryCount": repository_count,
        "entityCount": entity_count,
        "resourceCount": resource_count,
        "samplePackages": sorted(sample_packages),
        "fileExtensionBreakdown": dict(extension_counts.most_common(8)),
        # Java AST
        "astEnabled": ast_enabled,
        "astFileCount": ast_metrics.get("fileCount", 0),
        "astFileLimit": ast_metrics.get("fileLimit", 0),
        "astParseErrors": ast_metrics.get("parseErrors", 0),
        "astClassCount": ast_metrics.get("classCount", 0),
        "astInterfaceCount": ast_metrics.get("interfaceCount", 0),
        "astEnumCount": ast_metrics.get("enumCount", 0),
        "astRecordCount": ast_metrics.get("recordCount", 0),
        "astMethodCount": ast_metrics.get("methodCount", 0),
        "astFieldCount": ast_metrics.get("fieldCount", 0),
        "astAnnotationCount": ast_metrics.get("annotationCount", 0),
        "astEndpointAnnotationCount": ast_metrics.get("endpointAnnotationCount", 0),
        "astJakartaImportCount": ast_metrics.get("jakartaImportCount", 0),
        "astJavaxImportCount": ast_metrics.get("javaxImportCount", 0),
        "astAnnotationBreakdown": ast_metrics.get("annotationBreakdown", {}),
        # Kotlin AST
        "ktAstEnabled": kt_enabled,
        "ktAstFileCount": kt_metrics.get("fileCount", 0),
        "ktAstClassCount": kt_metrics.get("classCount", 0),
        "ktAstFunctionCount": kt_metrics.get("functionCount", 0),
        "ktAstPropertyCount": kt_metrics.get("propertyCount", 0),
        "ktAstEndpointAnnotationCount": kt_metrics.get("endpointAnnotationCount", 0),
        "ktAstAnnotationBreakdown": kt_metrics.get("annotationBreakdown", {}),
        # Python AST
        "pyAstEnabled": py_enabled,
        "pyAstFileCount": py_metrics.get("fileCount", 0),
        "pyAstClassCount": py_metrics.get("classCount", 0),
        "pyAstFunctionCount": py_metrics.get("functionCount", 0),
        "pyAstAsyncFunctionCount": py_metrics.get("asyncFunctionCount", 0),
        "pyAstDecoratorCount": py_metrics.get("decoratorCount", 0),
        "pyAstDetectedFrameworks": py_metrics.get("detectedFrameworks", []),
        # TypeScript AST
        "tsAstEnabled": ts_enabled,
        "tsAstFileCount": ts_metrics.get("fileCount", 0),
        "tsAstClassCount": ts_metrics.get("classCount", 0),
        "tsAstFunctionCount": ts_metrics.get("functionCount", 0),
        "tsAstInterfaceCount": ts_metrics.get("interfaceCount", 0),
        "tsAstTypeAliasCount": ts_metrics.get("typeAliasCount", 0),
        "tsAstDecoratorCount": ts_metrics.get("decoratorCount", 0),
        "tsAstDetectedFrameworks": ts_metrics.get("detectedFrameworks", []),
        # Rust AST
        "rsAstEnabled": rs_enabled,
        "rsAstFileCount": rs_metrics.get("fileCount", 0),
        "rsAstStructCount": rs_metrics.get("structCount", 0),
        "rsAstEnumCount": rs_metrics.get("enumCount", 0),
        "rsAstTraitCount": rs_metrics.get("traitCount", 0),
        "rsAstImplCount": rs_metrics.get("implCount", 0),
        "rsAstFunctionCount": rs_metrics.get("functionCount", 0),
        "rsAstMacroCount": rs_metrics.get("macroCount", 0),
        "rsAstUnsafeCount": rs_metrics.get("unsafeCount", 0),
        # Go AST
        "goAstEnabled": go_enabled,
        "goAstFileCount": go_metrics.get("fileCount", 0),
        "goAstFunctionCount": go_metrics.get("functionCount", 0),
        "goAstMethodCount": go_metrics.get("methodCount", 0),
        "goAstStructCount": go_metrics.get("structCount", 0),
        "goAstInterfaceCount": go_metrics.get("interfaceCount", 0),
        "goAstGoroutineCount": go_metrics.get("goroutineCount", 0),
        "goAstChannelCount": go_metrics.get("channelCount", 0),
        "maxNesting": max_nesting,
        "avgComplexity": round(avg_complexity, 2),
    }

    if ast_enabled is False and ast_metrics.get("error"):
        warnings.append(str(ast_metrics["error"]))

    if allowed_extensions or allowed_languages:
        metrics["parseExtensionFilter"] = sorted(allowed_extensions)
        metrics["parseLanguageFilter"] = sorted(allowed_languages)

    repo_waveform = build_repo_waveform_bins(
        java_paths,
        kotlin_paths,
        python_files=python_paths,
        ts_files=ts_paths,
        rust_files=rust_paths,
        go_files=go_paths,
    )
    repo_beat_grid = _repo_beat_grid(float(suggested_bpm), len(repo_waveform))
    repo_bpm_curve = _repo_bpm_curve(float(suggested_bpm), len(repo_waveform))

    asset = {
        "id": str(uuid4()),
        "assetType": "repo_analysis",
        "title": root.name,
        "sourcePath": str(root),
        "suggestedBpm": float(suggested_bpm),
        "confidence": confidence,
        "tags": tags,
        "metrics": metrics,
        "artifacts": {
            "waveformBins": repo_waveform,
            "beatGrid": repo_beat_grid,
            "bpmCurve": repo_bpm_curve,
        },
        "createdAt": datetime.now(UTC).isoformat(),
    }

    return asset, warnings


def _normalize_extension_filter(options: dict[str, Any] | None) -> set[str]:
    if not options:
        return set()
    raw = options.get("parseExtensions")
    if not isinstance(raw, list):
        return set()
    normalized = {str(item).strip().lower() for item in raw if str(item).strip()}
    return {ext if ext.startswith(".") else f".{ext}" for ext in normalized}


def _normalize_language_filter(options: dict[str, Any] | None) -> set[str]:
    if not options:
        return set()
    raw = options.get("parseLanguages")
    if not isinstance(raw, list):
        return set()
    return {str(item).strip().lower() for item in raw if str(item).strip()}


def _should_include_extension(
    extension: str,
    allowed_extensions: set[str],
    allowed_languages: set[str],
    extension_by_language: dict[str, str | list[str]],
) -> bool:
    if not allowed_extensions and not allowed_languages:
        return True

    if allowed_extensions and extension in allowed_extensions:
        return True

    if allowed_languages:
        for language in allowed_languages:
            lang_exts = extension_by_language.get(language)
            if isinstance(lang_exts, list):
                if extension in lang_exts:
                    return True
            elif lang_exts == extension:
                return True

    return False


def _repo_beat_grid(bpm: float, bin_count: int) -> list[float]:
    """Return beat positions (0.0–1.0) normalized to the waveform bin count."""
    if bpm <= 0 or bin_count <= 0:
        return []
    seconds_per_beat = 60.0 / bpm
    total_seconds = bin_count * 0.5  # treat each bin as ~0.5s for display purposes
    beats: list[float] = []
    t = 0.0
    while t < total_seconds:
        beats.append(round(t / total_seconds, 5))
        t += seconds_per_beat
    return beats


def _repo_bpm_curve(bpm: float, bin_count: int) -> list[dict[str, float]]:
    """Return a flat BPM curve with 5 evenly-spaced checkpoints."""
    if bpm <= 0 or bin_count <= 0:
        return []
    return [
        {"position": round(i / 4, 2), "bpm": round(bpm, 2)}
        for i in range(5)
    ]


def _analyze_remote_repository(source_path: str) -> tuple[dict[str, Any], list[str]]:
    parsed = urlparse(source_path)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError(f"Repository URL is invalid: {source_path}")

    path_parts = [part for part in parsed.path.split("/") if part]
    repo_name = path_parts[-1].removesuffix(".git") if path_parts else parsed.netloc
    owner = path_parts[-2] if len(path_parts) >= 2 else "unknown"
    provider = "github" if parsed.netloc.lower() == "github.com" else parsed.netloc.lower()

    seed = int(hashlib.sha1(source_path.encode("utf-8")).hexdigest()[:8], 16)
    suggested_bpm = 88 + (seed % 48)
    confidence = 0.34 if provider == "github" else 0.22

    asset = {
        "id": str(uuid4()),
        "assetType": "repo_analysis",
        "title": repo_name or "remote-repository",
        "sourcePath": source_path,
        "suggestedBpm": float(suggested_bpm),
        "confidence": confidence,
        "tags": ["repo-analysis", "remote-url", provider],
        "metrics": {
            "buildSystem": "unknown",
            "primaryLanguage": "unknown",
            "javaFileCount": 0,
            "kotlinFileCount": 0,
            "testFileCount": 0,
            "controllerCount": 0,
            "serviceCount": 0,
            "repositoryCount": 0,
            "entityCount": 0,
            "resourceCount": 0,
            "samplePackages": [],
            "fileExtensionBreakdown": {},
            "importMode": "remote-url",
            "provider": provider,
            "owner": owner,
            "repoName": repo_name,
            "remoteCloneAvailable": False,
        },
        "artifacts": {
            "waveformBins": [],
            "beatGrid": [],
            "bpmCurve": [],
        },
        "createdAt": datetime.now(UTC).isoformat(),
    }

    warnings = [
        "Remote repository intake is metadata-only for MVP.",
        "Clone or import a local checkout to run code heuristics over filesystem contents.",
    ]
    return asset, warnings
