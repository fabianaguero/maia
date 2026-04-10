Read AGENTS.md and all docs under /docs first.

Then bootstrap the repository with this architecture:

- desktop -> Tauri + React + TypeScript
- analyzer/src/maia_analyzer -> Python
- contracts -> JSON schemas
- database -> SQLite

The product premise must stay explicit:
- this app is for auditory monitoring in background, not just visual analysis with music attached
- this app creates music and audible cues from patterns in code, logs, streams, and scanned files
- a team should be able to listen to a system and hear stability, pressure, drift, and anomalies as distinct sonic changes
- the first concrete streaming step is an internal `tail -f` style monitor for local log files inside Maia
- reusable base assets and composition plans should later color that live monitor as runtime sonification scenes before a heavier audio engine exists
- when a selected base asset already contains playable managed audio, prefer triggering that sample in the live monitor before inventing a heavier render engine
- when a folder pack contains multiple playable entries, allow the live monitor to spread route types across those samples before adding a full sampler or DAW-style engine
- imported tracks can be the main audible base, either as a single favorite track or as a playlist, while source signals drive the variations
- the desktop app is the control surface; the long-term runtime should behave like a team music server running in background
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
