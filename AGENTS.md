# AGENTS.md

## Product
Desktop app tipo Rekordbox para Linux, Windows y macOS.
Analiza canciones, grafica waveform/beat grid/BPM curve y parsea repos/logs
para inferir BPM sugerido, patrones musicales y bases reutilizables.

## Fixed architecture
- Desktop shell: Tauri + React + TypeScript
- Analyzer: Python
- Local DB: SQLite
- Optional optimization later: Rust
- Repo parsing: tree-sitter
- Audio analysis: librosa + Essentia

## Domain model
Core entity: musical_asset
Types:
- track_analysis
- repo_analysis
- base_asset
- composition_result

## Non-goals for MVP
- No cloud backend
- No auth
- No sync multi-user
- No AI-heavy generation in v1
- No VST/plugin architecture in v1

## UX
Must feel like a desktop DJ analyzer, not a web dashboard.

## Engineering rules
- Keep analyzer and desktop app decoupled via JSON contracts
- Prefer deterministic heuristics over black-box ML in MVP
- Store all analysis locally
- Make Linux the primary dev environment