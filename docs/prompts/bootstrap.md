Read AGENTS.md and all docs under /docs first.

Then bootstrap the repository with this architecture:

- apps/desktop -> Tauri + React + TypeScript
- services/analyzer -> Python
- shared/contracts -> JSON schemas
- local storage -> SQLite

Generate only the minimum working skeleton for MVP 1:
- desktop shell
- analyzer service skeleton
- JSON IPC contract
- sample SQLite schema
- README with run instructions

Do not add cloud services.
Do not add authentication.
Keep the analyzer decoupled from the desktop UI.