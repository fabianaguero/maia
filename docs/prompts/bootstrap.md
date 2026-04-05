Read AGENTS.md and all docs under /docs first.

Then bootstrap the repository with this architecture:

- apps/desktop -> Tauri + React + TypeScript
- services/analyzer -> Python
- shared/contracts -> JSON schemas
- local storage -> SQLite

The product premise must stay explicit:
- this app creates music and audible cues from patterns in code and logs
- a team should eventually be able to listen to a stream of logs and hear anomalous events as distinct sonic changes
- the first concrete streaming step is an internal `tail -f` style monitor for local log files inside Maia
- reusable base assets and composition plans should later color that live monitor as runtime sonification scenes before a heavier audio engine exists
- when a selected base asset already contains playable managed audio, prefer triggering that sample in the live monitor before inventing a heavier render engine
- when a folder pack contains multiple playable entries, allow the live monitor to spread route types across those samples before adding a full sampler or DAW-style engine
- imported tracks are supporting reference material, not the core business output
- reusable base assets are the sonic vocabulary used for code/log sonification

Generate only the minimum working skeleton for MVP 1:
- desktop shell
- analyzer service skeleton
- JSON IPC contract
- sample SQLite schema
- README with run instructions

Do not add cloud services.
Do not add authentication.
Keep the analyzer decoupled from the desktop UI.
