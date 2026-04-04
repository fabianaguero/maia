# Architecture

## Main modules
- apps/desktop: Tauri + React + TypeScript
- services/analyzer: Python
- shared/contracts: JSON schemas
- storage: SQLite + local asset folders

## Communication
Desktop app launches analyzer locally and communicates through JSON IPC.

## Core entities
- track_analysis
- repo_analysis
- base_asset
- composition_result