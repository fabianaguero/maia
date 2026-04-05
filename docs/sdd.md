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
- Sequencer presets (sparse / balanced / beat-locked / cascade) and component routes: `COMPONENT_ROUTES` maps log-event patterns to oscillator/sample routes; presets control cue density, gain spread, and scheduling mode. ✅
- Reference anchor: `deriveReferenceAnchor` extracts BPM, energy level, and music-style from one imported track to override genre, auto-suggest preset, and tilt gain in the live scene. ✅
- Reference playlist: `blendAnchors` blends multiple anchor tracks into one composite (BPM median, energy mean, musicStyleId mode); add/remove pill UI with ↑/↓ reorder buttons. ✅
- Beat-phase-aware scheduling: persistent `BeatClock` seeded from anchor BPM (or first live-detected BPM); `nextBeatTime` aligns cue start to the nearest subdivision boundary; gentle ±12% drift re-sync per poll window. ✅
- Reference playlist persistence: `MonitorPrefs` (referencePlaylistIds, selectedGenreId, selectedPresetId) saved to `localStorage` keyed by `repository.id`; restored on repo switch. ✅
- Blend details in scene panel: `LiveSonificationScenePanel` shows a "Blend style" row when the active anchor is a playlist composite. ✅

## Still missing / future work
The most realistic implementation order from this point: (1) always-on background monitoring so sonification keeps running when the user navigates away from the analyzer screen; (2) broader stream adapters beyond local files and spawned processes; (3) consolidation and test coverage for the shipped workflow; (4) a richer sonification engine with denser sequencing and component-level mapping; (5) a full export and bounce pipeline beyond `plan.json` and `preview.wav`; and (6) additional format support and broader curated palette coverage.

- **Always-on background monitoring** ✅ (shipped: `MonitorContext` lifts poll loop to root, sidebar live badge, session survives navigation) — resolved.
- **Broader stream adapters** — only local file tail and process adapters exist today. Long-term targets: WebSocket/HTTP push, Amazon CloudWatch Logs, Elastic/ELK, Grafana Loki, Splunk, Datadog, Google Cloud Logging, Azure Monitor Logs.
- **Test coverage** — zero test files exist in the project; no contract fixtures, no golden analysis tests, no native-vs-mock gate.
- **Dense multi-track arrangement** — current live scene still does one cue per event; no pad/kit sequencer, no per-component routing beyond generic log levels.
- **Export/bounce pipeline** — `plan.json` and `preview.wav` exist; export dialog, full offline render, stems, and format options are not built.
- **Additional audio formats** — `m4a` and other compressed containers still fall back to deterministic local stubs.
- **Tree-sitter beyond Java/Kotlin** — TypeScript, Python, Go, Rust, and other grammars not yet wired.

## Implementation plan (summary)
1) Always-on background monitoring ✅
- `MonitorContext` at app root holds the poll loop; `AppSidebar` shows live status badge; `LiveLogMonitorPanel` is now a pure subscriber.

2) Broader stream adapters
- WebSocket + HTTP push adapters; later connect to managed log platforms.

3) Consolidation and test coverage
- Contract fixtures, analysis golden tests, mock vs native gates. Pipeline hardening.

4) Repo parsing with tree-sitter ✅ (shipped: Java/Kotlin)
- Java/Jakarta first, structural metrics, deterministic mapping. Future: TS, Python, Go, Rust.

5) DSP integration ✅ (shipped: librosa tempo/onset; additional formats still pending)
- Replace heuristics with real tempo/onset/beat tracking.
- Extend supported formats (m4a etc.).

6) Stream adapters + session monitoring ✅ (shipped: file + process adapters, ring buffer, SessionRegistry)
- Always-on background monitoring ✅ shipped. Broader platform adapters still pending.

7) Sonification engine ✅ (shipped: genre palette ✅, sequencer presets ✅, reference anchor ✅, reference playlist ✅, beat-phase scheduling ✅, persistence ✅; dense multi-track arrangement pending)
- Next: denser cue sequencing, per-component event mapping, multi-track arrangement.

8) Reference anchor + playlist ✅ (fully shipped: single anchor, playlist blend, beat clock, persistence, reorder, blend details)

9) Composition export (pending: preview.wav exists; full offline render + stems + export UI not started)
- Offline render + stems + export UI.
- Heavy DSP dependencies -> keep deterministic fallback and gate by capability.
- Long-running monitoring -> isolate in background tasks with explicit stop.
- Cross-platform file access -> keep managed snapshots as source of truth.

## Open questions
- Priority between tree-sitter parsing vs DSP upgrades.
- Supported stream sources for the first non-file adapter.
- Export format targets (wav, stems, project files).
