from __future__ import annotations

from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4


def analyze_repository(source_path: str) -> tuple[dict[str, Any], list[str]]:
    root = Path(source_path).expanduser().resolve()
    if not root.is_dir():
        raise FileNotFoundError(f"Repository path does not exist or is not a directory: {root}")

    warnings: list[str] = []
    extension_counts: Counter[str] = Counter()
    sample_packages: set[str] = set()

    java_files = 0
    kotlin_files = 0
    test_files = 0
    controller_count = 0
    service_count = 0
    repository_count = 0
    entity_count = 0
    resource_count = 0
    has_jakarta = False
    has_javax = False

    for file_path in root.rglob("*"):
        if not file_path.is_file():
            continue

        extension = file_path.suffix.lower() or "<none>"
        extension_counts[extension] += 1

        if extension == ".java":
            java_files += 1
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

    build_system = "plain"
    if (root / "pom.xml").exists():
        build_system = "maven"
    elif any((root / name).exists() for name in ("build.gradle", "build.gradle.kts", "settings.gradle.kts")):
        build_system = "gradle"

    if java_files == 0 and kotlin_files == 0:
        warnings.append("No Java or Kotlin source files were detected.")

    suggested_bpm = max(
        85,
        min(
            160,
            96
            + min(32, java_files // 8)
            + min(12, kotlin_files // 10)
            + controller_count * 2
            + service_count
            + repository_count
            + entity_count // 2
            + (6 if has_jakarta else 0)
            + (3 if has_javax else 0)
            + (4 if build_system == "maven" else 2 if build_system == "gradle" else 0),
        ),
    )

    confidence = round(
        min(
            0.94,
            0.3
            + min(0.35, java_files / 400)
            + min(0.12, kotlin_files / 200)
            + (0.1 if build_system != "plain" else 0)
            + (0.07 if has_jakarta or has_javax else 0),
        ),
        2,
    )

    primary_language = "java"
    if kotlin_files > java_files:
        primary_language = "kotlin"
    elif java_files == 0 and kotlin_files == 0:
        primary_language = "unknown"

    tags = ["repo-analysis", build_system, primary_language]
    if has_jakarta:
        tags.append("jakarta-ee")
    elif has_javax:
        tags.append("java-ee")

    metrics = {
        "buildSystem": build_system,
        "primaryLanguage": primary_language,
        "javaFileCount": java_files,
        "kotlinFileCount": kotlin_files,
        "testFileCount": test_files,
        "controllerCount": controller_count,
        "serviceCount": service_count,
        "repositoryCount": repository_count,
        "entityCount": entity_count,
        "resourceCount": resource_count,
        "samplePackages": sorted(sample_packages),
        "fileExtensionBreakdown": dict(extension_counts.most_common(8)),
    }

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
            "waveformBins": [],
            "beatGrid": [],
            "bpmCurve": [],
        },
        "createdAt": datetime.now(UTC).isoformat(),
    }

    return asset, warnings

