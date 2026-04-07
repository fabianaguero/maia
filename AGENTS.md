# AGENTS.md

## Product
Desktop app tipo Rekordbox para Linux, Windows y macOS.
Analiza repositorios, logs y genera arte sonoro en vivo (Live System Performance). 
Grafica waveform/beat grid/BPM curve para inferir BPM sugerido desde código fuente y streams de logs.
Evoluciona código estático y logs en vivo hacia música generativa (Techno, Ambient, Glitch, Heartbeat).
Mezclador Híbrido: Combina stems reales (AI-separated) con síntesis reactiva a datos.
Ideal para 'Team Soundscape Monitoring' en equipos de DevOps/SRE: 'Chill but Alerting'.

## Fixed architecture
- Desktop shell: Tauri + React + TypeScript
- Analyzer: Python
- Local DB: SQLite
- Optional optimization later: Rust
- Repo parsing: tree-sitter
- Audio analysis: librosa + Essentia

Domain model
Core entity: musical_asset
Types:
- track_analysis
- repo_analysis
- base_asset
- composition_result
- live_sonification_preset (Techno, Ambient, Glitch)

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