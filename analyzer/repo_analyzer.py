"""
Repository analyzer that parses code/logs for musical references and patterns.

Uses tree-sitter for AST-level parsing and regex heuristics for musical
pattern detection. Outputs a RepoAnalysis JSON contract.
"""
from __future__ import annotations

import re
import os
import logging
from pathlib import Path
from collections import Counter
from typing import Optional

from .contracts import (
    RepoAnalysis,
    MusicalReference,
    CodePattern,
    ReuseableBase,
    to_dict,
)

logger = logging.getLogger(__name__)

# Regex patterns for musical references in code/logs
_BPM_RE = re.compile(
    r"\b(?:bpm|tempo|beats?[_\s-]?per[_\s-]?minute)\s*[=:]\s*(\d{2,3}(?:\.\d+)?)",
    re.IGNORECASE,
)
_KEY_RE = re.compile(
    r"\b(?:key|tone|scale|root)\s*[=:]\s*[\"']?([A-Ga-g][#b]?\s*(?:major|minor|maj|min)?)",
    re.IGNORECASE,
)
_NOTE_RE = re.compile(
    r"\b([A-Ga-g][#b]?[0-9])\b",
)
_RHYTHM_RE = re.compile(
    r"\b(4/4|3/4|6/8|7/8|5/4|2/4|waltz|shuffle|swing)\b",
    re.IGNORECASE,
)

_SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".rb", ".java",
    ".go", ".rs", ".cpp", ".c", ".h", ".lua", ".json", ".yaml",
    ".yml", ".md", ".txt", ".log",
}

_LANGUAGE_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".ts": "TypeScript",
    ".jsx": "JavaScript",
    ".tsx": "TypeScript",
    ".rb": "Ruby",
    ".java": "Java",
    ".go": "Go",
    ".rs": "Rust",
    ".cpp": "C++",
    ".c": "C",
    ".h": "C/C++ Header",
    ".lua": "Lua",
}


def analyze_repo(repo_path: str) -> dict:
    """
    Analyze a repository or directory for musical references and patterns.

    Args:
        repo_path: Path to the repository root.

    Returns:
        Dict conforming to the RepoAnalysis contract.
    """
    path = Path(repo_path)
    if not path.exists():
        raise FileNotFoundError(f"Repository path not found: {repo_path}")

    logger.info("Analyzing repository: %s", repo_path)

    language_stats: Counter[str] = Counter()
    all_references: list[MusicalReference] = []
    all_patterns: list[CodePattern] = []
    bpm_values: list[float] = []

    # Walk repo files
    for filepath in _iter_files(path):
        ext = filepath.suffix.lower()
        lang = _LANGUAGE_MAP.get(ext, ext.lstrip(".").upper() or "Unknown")

        try:
            with open(filepath, encoding="utf-8", errors="replace") as f:
                content = f.read()
        except OSError:
            continue

        lines = content.splitlines()
        language_stats[lang] += len(lines)

        # Extract musical references
        for lineno, line in enumerate(lines, start=1):
            rel_path = str(filepath.relative_to(path))
            refs = _extract_references(line, rel_path, lineno)
            all_references.extend(refs)
            for ref in refs:
                if ref.type == "bpm":
                    try:
                        bpm_values.append(float(ref.value))
                    except ValueError:
                        pass

    # Code patterns: most common identifiers hinting at musical structures
    all_patterns = _find_code_patterns(path)

    # Infer BPM from references
    inferred_bpm: Optional[float] = None
    if bpm_values:
        inferred_bpm = round(sum(bpm_values) / len(bpm_values), 1)

    # Reuseable bases: files with high musical reference density
    bases = _find_reuseable_bases(path, all_references)

    analysis = RepoAnalysis(
        name=path.name,
        repo_path=str(path),
        language_stats=dict(language_stats),
        musical_references=all_references[:200],  # cap for performance
        inferred_bpm=inferred_bpm,
        patterns=all_patterns,
        bases=bases,
    )
    return to_dict(analysis)


def _iter_files(root: Path):
    """Yield files with supported extensions, skipping hidden dirs and vendor."""
    skip_dirs = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build", "target"}
    for dirpath, dirnames, filenames in os.walk(root):
        # Prune unwanted directories
        dirnames[:] = [d for d in dirnames if d not in skip_dirs and not d.startswith(".")]
        for fname in filenames:
            p = Path(dirpath) / fname
            if p.suffix.lower() in _SUPPORTED_EXTENSIONS:
                yield p


def _extract_references(
    line: str, filepath: str, lineno: int
) -> list[MusicalReference]:
    """Extract musical references from a single line of text."""
    refs: list[MusicalReference] = []
    context = line.strip()[:100]

    for m in _BPM_RE.finditer(line):
        refs.append(
            MusicalReference(
                file=filepath, line=lineno,
                type="bpm", value=m.group(1), context=context,
            )
        )
    for m in _KEY_RE.finditer(line):
        refs.append(
            MusicalReference(
                file=filepath, line=lineno,
                type="key", value=m.group(1).strip(), context=context,
            )
        )
    for m in _RHYTHM_RE.finditer(line):
        refs.append(
            MusicalReference(
                file=filepath, line=lineno,
                type="rhythm", value=m.group(1), context=context,
            )
        )
    for m in _NOTE_RE.finditer(line):
        refs.append(
            MusicalReference(
                file=filepath, line=lineno,
                type="note", value=m.group(1), context=context,
            )
        )
    return refs


def _find_code_patterns(root: Path) -> list[CodePattern]:
    """Find recurring musical pattern identifiers across files."""
    pattern_keywords = [
        "loop", "beat", "rhythm", "melody", "chord", "bassline",
        "intro", "outro", "verse", "chorus", "bridge", "drop", "sample",
        "tempo", "bpm", "pitch", "scale", "key", "note",
    ]
    pattern_files: dict[str, list[str]] = {k: [] for k in pattern_keywords}

    for filepath in _iter_files(root):
        try:
            with open(filepath, encoding="utf-8", errors="replace") as f:
                content = f.read().lower()
        except OSError:
            continue

        rel = str(filepath.relative_to(root))
        for kw in pattern_keywords:
            if kw in content:
                pattern_files[kw].append(rel)

    results: list[CodePattern] = []
    for kw, files in pattern_files.items():
        if files:
            results.append(
                CodePattern(name=kw, occurrences=len(files), files=sorted(set(files)))
            )
    return sorted(results, key=lambda p: p.occurrences, reverse=True)


def _find_reuseable_bases(
    root: Path, references: list[MusicalReference]
) -> list[ReuseableBase]:
    """Identify files with high musical reference density as reuseable bases."""
    import uuid

    file_ref_count: Counter[str] = Counter()
    for ref in references:
        file_ref_count[ref.file] += 1

    bases: list[ReuseableBase] = []
    for filepath, count in file_ref_count.most_common(10):
        if count < 3:
            continue
        full_path = root / filepath
        try:
            lines = full_path.read_text(encoding="utf-8", errors="replace").splitlines()
            total_lines = len(lines)
        except OSError:
            total_lines = 0

        quality = min(1.0, count / 20.0)
        bases.append(
            ReuseableBase(
                id=str(uuid.uuid4()),
                source_file=filepath,
                start_line=1,
                end_line=total_lines,
                description=f"{count} musical references found",
                musical_quality=round(quality, 2),
            )
        )
    return bases
