# maia

Local-first desktop app for music and code analysis. Maia combines a Tauri + React + TypeScript shell, a Python analyzer, SQLite storage, and JSON contracts over IPC.

## Repository layout

- `desktop/`: Tauri desktop app and React UI
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
```

## Notes

- Source of truth for IPC payloads: `contracts/*.schema.json`
- Initial SQLite schema: `database/schema.sql`
- The desktop bridge auto-detects `analyzer/.venv` when present; override with `MAIA_PYTHON` if you want a different interpreter
- The analyzer is intentionally minimal in v1: repository heuristics work now, audio analysis is scaffolded for later `librosa` and `Essentia` integration
