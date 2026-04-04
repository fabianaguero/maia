comaia

## Graphics

![MAIA banner](banner.png)

![MAIA brand board](Dise%C3%B1o%20de%20marca%20MAIA%20con%20logo%20y%20banner.png)

![MAIA logo](logo.png)

![MAIA icon](icon.png)

![MAIA reference](7044b97f-6d91-47b7-877a-3d202d164e94.png)

Local-first desktop app for music and code analysis. Maia combines a Tauri + React + TypeScript shell, a Python analyzer, SQLite storage, and JSON contracts over IPC.

## Repository layout

- `desktop/`: Tauri desktop app and React UI
- `desktop/src/config/`: local import configuration, including curated music styles and base asset categories
- `analyzer/`: Python analyzer CLI
- `contracts/`: JSON schema contracts shared across desktop and analyzer
- `database/`: SQLite schema
- `docs/`: bootstrap architecture notes

## Setup

### Desktop

```bash
cd desktop
npm install
```

### Analyzer

```bash
cd analyzer
python3 -m venv .venv
. .venv/bin/activate
pip install -e .
```

## Run

### Frontend only

```bash
cd desktop
npm run dev
```

### Full desktop app

```bash
cd analyzer
python3 -m venv .venv
. .venv/bin/activate
pip install -e .
cd ../desktop
npm run tauri dev
```

### Analyzer CLI

```bash
cd analyzer
. .venv/bin/activate
python -m maia_analyzer.cli health
printf '%s\n' '{"contractVersion":"1.0","requestId":"demo","action":"analyze","payload":{"assetType":"repo_analysis","source":{"kind":"directory","path":".."},"options":{"inferCodeSuggestedBpm":true}}}' | python -m maia_analyzer.cli analyze
printf '%s\n' '{"contractVersion":"1.0","requestId":"demo-url","action":"analyze","payload":{"assetType":"repo_analysis","source":{"kind":"url","path":"https://github.com/fabianaguero/maia"},"options":{"inferCodeSuggestedBpm":true}}}' | python -m maia_analyzer.cli analyze
```

## Notes

- Source of truth for IPC payloads: `contracts/*.schema.json`
- Initial SQLite schema: `database/schema.sql`
- The desktop bridge auto-detects `analyzer/.venv` when present; override with `MAIA_PYTHON` if you want a different interpreter
- The desktop library screen supports code-project intake from a local directory path or a GitHub URL
- Track import now requires choosing a music style from `desktop/src/config/music-styles.json` before persisting the track
- Base asset registration now requires choosing a curated category from `desktop/src/config/base-asset-categories.json`
- Native desktop pickers remain delegated to the OS when available; manual path entry remains as fallback
- File parsing and analysis stay inside the app stack: repository heuristics run in Python, and track intake uses embedded decoders plus in-analyzer heuristics instead of system media tools
- The embedded track decoder now supports `wav`, `mp3`, `flac`, and `ogg/vorbis` inside the analyzer; unsupported formats such as `m4a` still fall back to deterministic local stubs for MVP
- When the selected track file exists locally in a supported format, track import persists heuristic waveform bins, BPM, beat grid, and duration from the analyzer; non-existent demo paths still fall back to deterministic local stubs
- The analyzer screen now renders the persisted waveform, beat grid, and BPM curve directly from local storage instead of treating beat artifacts as hidden backend-only data
- Base assets can now be registered from a local file or folder path, stored in SQLite as reusable references, and inspected in a dedicated analyzer view with checksum, entry count, and category metadata
- MVP base assets are referenced in place through `base_assets.storage_path`; managed internal copying is intentionally deferred
- The analyzer is intentionally lightweight in v1: repository heuristics and embedded track heuristics work now, while higher-fidelity audio DSP is still deferred to `librosa` and `Essentia`
- Current product and architecture decisions live in `docs/decisions.md`
