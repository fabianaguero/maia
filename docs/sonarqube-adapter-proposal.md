# SonarQube Static Analysis Adapter Proposal

**Branch:** `feat/refactor-sonarqube-to-projects`
**Status:** Partially implemented
**Updated:** 2026-07-11

## Overview

Extend Maia's monitoring capabilities to include **static code analysis anomalies** without making a SonarQube server mandatory. CodeProjects now support a local plugin-style mode that scans the working tree directly, plus a connected mode that can use SonarQube server access for issue polling now and rules/profile synchronization as the integration matures.

See also: `docs/signal-streams-roadmap.md`.

## Motivation

- **Shift left:** Catch architectural and code-quality drifts before they hit production logs
- **Continuous quality:** Monitor code health like current system monitoring operational health
- **Local-first:** Let Maia run on a repository without requiring network or a SonarQube server
- **Connected when useful:** Use SonarQube server access to sync rules/quality profiles or poll server-side findings
- **Same deck model:** Reuse existing deck, waveform, and playback logic without creating a SonarQube-specific monitor surface
- **Natural mapping:** SonarQube severities (CRITICAL, MAJOR, MINOR, INFO) → anomaly types → musical deformation

## Architecture Compatibility

The current Maia architecture **is fully prepared** for SonarQube adapter. Key evidence:

## Current Implementation Snapshot

Landed:

- `CodeProjects` Library UI for creating, editing, deleting, and configuring local or SonarQube-connected code quality projects.
- CodeProjects can be created from a local repository path or an HTTP(S) repository URL; local paths are the primary path for serverless local analysis.
- `desktop/src/types/codeProject.ts` with strict TypeScript contracts.
- `database/schema.sql` with `code_projects`.
- Native commands in `desktop/src-tauri/src/main.rs`:
  - `create_code_project`
  - `list_code_projects`
  - `update_code_project`
  - `delete_code_project`
  - `test_sonarqube_connection`
- `desktop/src-tauri/src/main.rs` keeps session orchestration in `poll_code_project_stream_session`.
- `desktop/src-tauri/src/code_project_scanner.rs` owns serverless local code-quality evidence.
- `desktop/src-tauri/src/code_project_stream.rs` owns CodeProject stream config parsing, connected-mode validation, and idle/baseline status messages.
- `desktop/src-tauri/src/sonarqube_client.rs` owns SonarQube issue polling and `format_sonarqube_issue_as_log_line`.

Local profiles:

- `maia-default`: local operational heuristics, including TODO/FIXME, fail-fast paths, dynamic execution, and low-severity debug output signals.
- `sonar-way-compatible`: lower-noise local profile aligned with SonarQube-style quality findings; it suppresses debug-output informational signals and keeps higher-value risk/quality signals.

The local scanner is intentionally deterministic and lightweight in the MVP. It is not a bundled SonarLint engine yet; real SonarQube quality profile/rule synchronization remains a follow-up.

Not landed / still needs validation:

- End-to-end CodeProject selection from Monitor setup.
- Active session launch from CodeProject with a real track or playlist bed.
- Deck/tail rendering of SonarQube evidence as source evidence, not just generic log rows.
- Structured `evidenceEvents` contract.
- Token encryption or OS keychain storage.

### Unified Adapter Contract (Rust)

```rust
pub struct StreamSessionRecord {
    pub adapter_kind: String,  // "file" | "process" | "http-poll" | "websocket" | "journald" | "gcloud" | "sonarqube" ← NEW
    pub source: String,        // "https://sonarqube.example.com/projects/my-service"
    pub label: Option<String>, // "API Service Code Quality"
    pub created_at: String,
    pub last_polled_at: Option<String>,
    pub total_polls: u64,
    pub file_cursor: Option<u64>,
}
```

### SessionRegistry Pattern

- Registry owns adapter lifecycle (start/stop/poll)
- All adapters return `Vec<String>` (text lines)
- Ring buffer stores output identically
- Analyzer processes text **without knowledge of source**

### Analyzer is Source-Agnostic

Python analyzer (`maia_analyzer`) receives:
```
[2026-07-10T10:15:33.000Z] [SONARQUBE-MAJOR] java:S1135 Hardcoded password in Auth.java:42
```

It extracts severity + timestamp + message → anomaly marker. This compatibility mode is useful for the first implementation.
The long-term contract should preserve structured source evidence so SonarQube does not have to masquerade permanently as a log line.

## Implementation Plan

### Phase 1: Adapter Skeleton (Rust) ✅ Implemented in native modules

**Current files:**
- `desktop/src-tauri/src/main.rs` coordinates session registry polling.
- `desktop/src-tauri/src/code_project_stream.rs` parses stream configuration and validates local/connected mode.
- `desktop/src-tauri/src/code_project_scanner.rs` scans local repositories without a SonarQube server.
- `desktop/src-tauri/src/sonarqube_client.rs` polls remote SonarQube issues.

An earlier standalone `sonarqube_adapter.rs` was removed; the current implementation is split across native runtime modules while the session registry still owns lifecycle.

```rust
pub struct SonarQubeAdapter {
    api_url: String,
    project_key: String,
    auth_token: String,
    last_known_issues: HashSet<String>,
}

impl SonarQubeAdapter {
    pub async fn poll(&mut self) -> Result<Vec<String>, Error> {
        // 1. Fetch current issues from SonarQube API
        // 2. Compare with last_known_issues (detect new/closed issues)
        // 3. Format as log lines
        // 4. Update last_known_issues
        // 5. Return new/modified issues as Vec<String>
    }
}
```

**Integration in SessionRegistry:**
- [x] Add `sonarqube` case to `adapter_kind` match.
- [x] Poll API from the native runtime.
- [x] Track `last_known_issues` inside the active session.
- [x] Keep CodeProject config parsing and idle status formatting in a pure tested module.
- [ ] Rework blocking/async boundary if needed; current `Runtime::new().block_on(...)` path should be watched for UI-freeze regressions.
- [ ] Treat polling output as source evidence rather than only text lines.

### Phase 2: Issue → Log Line Format

**SonarQube Issue (JSON):**
```json
{
  "key": "issue-123",
  "rule": "java:S1135",
  "severity": "MAJOR",
  "type": "CODE_SMELL",
  "message": "Hardcoded password detected",
  "component": "my-service:src/Auth.java",
  "line": 42
}
```

**Converted to Maia log line:**
```
[2026-07-10T10:15:33.000Z] [SONARQUBE-MAJOR] java:S1135 Hardcoded password in Auth.java:42
```

**Python analyzer treats as:** Code-quality anomaly with severity mapped to metrics + waveform mutations.
In the future, the same issue should also be representable as a structured evidence event with `sourceKind=sonarqube`, `eventType`, `component`, `rule`, and `attributes`.

### Phase 3: UI Connection (React) ✅ Partially landed

**Current UI path:**
- CodeProjects lives in the Library, not `ConnectionsScreen`.
- Users can create a code project from a local repository path or HTTP(S) URL, configure SonarQube server URL/project key/auth token when connected mode is needed, and test the connection.
- Auth token is currently stored in plaintext SQLite, not encrypted.

**Still needed:**
- Select CodeProject/SonarQube source from Monitor setup.
- Same "Start monitoring" flow as file/cloud/process sources.
- Waveform shows code quality drift in real-time.
- Idle state remains musical and quiet when no new issues arrive.

### Phase 4: Database Schema ✅ Implemented as `code_projects`

Current schema:
```sql
CREATE TABLE IF NOT EXISTS code_projects (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  repository_url TEXT NOT NULL,
  sonarqube_api_url TEXT,
  sonarqube_project_key TEXT,
  sonarqube_auth_token TEXT,
  sonarqube_polling_interval TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'not-configured',
  error_message TEXT,
  last_checked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

Security limitation: `sonarqube_auth_token` is plaintext. This must be moved to keychain/secure storage before recommending real production use.

### Phase 5: Analyzer Integration (Python)

**No immediate changes required for the compatibility path.** The analyzer already:
1. Receives text chunks from SessionRegistry
2. Parses lines by `[TIMESTAMP] [SEVERITY]` pattern
3. Extracts anomalies regardless of source

**Optional enhancements (future):**
- Add `sourceKind` / `eventType` metadata.
- Add structured `evidenceEvents`.
- Track issue lifecycle (new → acknowledged → fixed)
- Weight repeated violations differently (decay over time)
- Correlate multiple violations in same file → severity boost

## Data Flow

```
SonarQube API (/api/issues/search)
    ↓
SonarQubeAdapter::poll() (Rust)
    ↓
format_issue_as_log_line() or normalized evidence event
    ↓
Ring buffer (identical to file/log/http)
    ↓
Python analyzer (stateless, source-agnostic)
    ↓
Anomaly markers + metrics
    ↓
React deck waveform + Web Audio playback
```

## Success Criteria

- [x] `sonarqube` adapter kind is recognized in the native polling path
- [x] CodeProjects can run in local plugin mode without a SonarQube server
- [x] SonarQube issues format into log lines matching analyzer's expected pattern
- [x] UI allows saving SonarQube connection with auth token + project key through CodeProjects
- [x] Monitor setup can launch configured CodeProjects as SonarQube-backed sessions
- [x] Initial SonarQube poll seeds a passive baseline instead of sonifying every pre-existing issue
- [x] SonarQube issue lines preserve issue timestamps when the API provides them
- [ ] Monitor deck renders SonarQube anomalies with same waveform/severity visual
- [ ] Test with real SonarQube instance (Cloud or self-hosted)
- [ ] Sync real SonarQube quality profiles/rules for local analysis
- [ ] Playback deforms based on code quality drift (same as log severity)
- [ ] Issue state tracking works (new/closed issues detected across polls)
- [ ] Token storage is not plaintext SQLite

## Future Enhancements

1. **Multi-project monitoring:** Monitor multiple SonarQube projects → mixed anomaly stream
2. **Metric-based weighting:** Use SonarQube metrics (debt, duplication %) as continuous signals
3. **Timeline replay:** Fetch historical issue snapshots for retrospective analysis
4. **Issue classification:** Map SonarQube rule categories (Security, Performance, etc.) to musical dimensions
5. **Gateway integration:** Combine SonarQube + live logs + metrics in single monitoring session

## Testing Strategy

1. **Unit tests:** Mock SonarQube API responses, verify formatting
2. **Integration test:** Real SonarQube connection, verify polling + anomaly extraction
3. **Manual test:** Start monitor session with SonarQube source, verify waveform deformation
4. **Regression:** Ensure existing log/file adapters still work identically

## Questions & Design Decisions

**Q: How often to poll?**
- Default: Every 30s (matches log tail latency expectation)
- Configurable by user in connection settings
- Rationale: Code quality changes less frequently than logs, but consistent polling feels responsive

**Q: Auth mechanism?**
- HTTP Bearer token (SonarQube standard)
- Store encrypted in SQLite using existing secret management pattern
- Support both SonarQube self-hosted and SonarCloud

**Q: How to handle large projects?**
- Paginate API results if needed
- Cache issue set (HashSet) to detect changes efficiently
- Optional: Only track high-severity issues (configurable)

**Q: Backward compatibility?**
- Zero impact on existing log/file/process adapters
- No UI changes for users not using SonarQube
- New `sonarqube` adapter_kind is additive

## Related Architecture Docs

- `docs/architecture.md` - Stream adapters and SessionRegistry (Section: Stream Adapters)
- `docs/frontend-architecture.md` - Monitor startup flow and connections screen
- `desktop/src-tauri/src/main.rs` - SessionRegistry implementation
- `contracts/` - SessionRecord JSON schema
