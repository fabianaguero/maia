# SDD (lightweight) - Maia

## Summary
Maia is a local-first desktop app that turns repositories, logs, and reusable sonic assets into music and audible operational signals. It runs as a Tauri + React + TypeScript desktop shell with a Python analyzer, SQLite storage, and JSON contracts over IPC.

## Goals
- Make software behavior listenable (code + logs) with deterministic analysis.
- Provide DJ-like analysis views: waveform, beat grid, BPM curve.
- Keep analysis local, deterministic, and stored in SQLite.
- Use reusable base assets as the sonic vocabulary for sonification.

## Non-goals (MVP)
- Cloud backend, auth, multi-user sync.
- AI-heavy generation.
- VST/plugin architecture.

## Architecture (high level)
- Desktop shell: Tauri + React + TypeScript.
- Analyzer: Python CLI/service with JSON contracts.
- Storage: SQLite + managed local asset snapshots.
- Contracts: JSON schemas in contracts/.

## Core entities
- track_analysis
- repo_analysis
- base_asset
- composition_result

## Key flows
1) Track import
- UI forces music-style selection from local config.
- Tauri snapshots track to managed storage.
- Analyzer returns waveform, beat grid, BPM curve.

2) Repository import (local or URL)
- Local directories are snapshotted to managed storage.
- Analyzer derives deterministic repo metrics and suggested BPM.
- Repo analysis reads the full code snapshot ("tail" of the codebase) to build a musical signal baseline.
- Optional repo parsing filters can narrow analysis by language or file extension.

3) Log import and live monitoring
- Local log file is snapshotted; live tail reads from original path.
- Analyzer derives severity/anomaly metrics and a BPM suggestion.
- Live monitor uses Web Audio to trigger cues.
- Log tailing is the streaming version of the same signal idea: a "tail" of events that drives the musical cues.

4) Base asset import
- Requires category selection and reusable flag.
- Analyzer returns checksum, entry count, preview entries.
- Base assets can be file or directory packs.

5) Composition results
- Derived from a base asset and a BPM reference (track/repo/manual).
- Produces plan metadata, preview artifacts, and optional preview audio.

## Data model (SQLite)
- musical_assets (shared metadata)
- track_analyses (artifacts)
- repo_analyses (metrics)
- base_assets (catalog)
- composition_results (planner artifacts)
- analysis_jobs (pipeline status)

## Contracts
- Request/response schemas in contracts/.
- All analysis uses JSON IPC with deterministic responses.

## Shipped since initial draft
- Tree-sitter based repository parsing (Java/Kotlin, structural metrics, deterministic BPM mapping). ✅
- DSP integration via librosa (tempo/onset/beat tracking replacing pure heuristics). ✅
- Session-based stream polling: ring buffer + process adapter in `stream.py`; `SessionRegistry` + 4 Tauri commands in `main.rs`; adapter selector in `LiveLogMonitorPanel`. ✅
- Genre-configured instrumental palette: 8 curated genres in `music-styles.json`, per-severity waveform/pitch/gain profiles in `liveSonificationScene.ts`, genre selector in pre-start toolbar. ✅

## Still missing / future work
- Support for additional audio formats (e.g. m4a) beyond current decoders.
- Generalized stream adapters beyond local file tail and spawned process (sockets, HTTP, external services).
- Always-on background monitoring outside the active analyzer screen.
- Richer sonification engine (dense sequencing, component-level event mapping, multi-track arrangement).
- Export/bounce pipeline: `plan.json` and `preview.wav` exist; full offline render + stems + export UI do not.
- Stronger test coverage for contracts and analysis artifacts.

## Implementation plan (summary)
1) Consolidation and test coverage
- Contract fixtures, analysis golden tests, mock vs native gates.

2) Repo parsing with tree-sitter ✅ (shipped: Java/Kotlin)
- Java/Jakarta first, structural metrics, deterministic mapping.

3) DSP integration ✅ (shipped: librosa tempo/onset; Essentia and additional formats still pending)
- Replace heuristics with real tempo/onset/beat tracking.
- Extend supported formats.

4) Stream adapters + session monitoring ✅ (shipped: file + process adapters, ring buffer, SessionRegistry)
- Broader adapters (sockets, HTTP) and always-on background monitoring still pending.

5) Sonification engine upgrades (in progress: genre palette shipped; dense sequencing and component routing pending)
- Scene presets, routing by component/pattern, sequencing.

6) Composition export (pending: preview.wav exists; full offline render + stems + export UI not started)
- Offline render + stems + export UI.

## Risks and mitigations
- Heavy DSP dependencies -> keep deterministic fallback and gate by capability.
- Long-running monitoring -> isolate in background tasks with explicit stop.
- Cross-platform file access -> keep managed snapshots as source of truth.

## Open questions
- Priority between tree-sitter parsing vs DSP upgrades.
- Supported stream sources for the first non-file adapter.
- Export format targets (wav, stems, project files).
