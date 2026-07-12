# Stream Input UI Refactor

**Branch:** `feat/refactor-sonarqube-to-projects`
**Status:** Design & implementation, partially landed
**Updated:** 2026-07-11

## Objective

Refactor the connection management UI from "Log-centric" to "Stream Input" - a generic, heterogeneous system supporting source evidence that can expose pressure, drift, or anomalies:
- **Files:** Local log files (`file` adapter)
- **Repositories:** Code analysis (`repo` adapter)
- **HTTP/Polling:** Web endpoints (`http-poll` adapter)
- **WebSockets:** Real-time streams (`websocket` adapter)
- **System Logs:** journald (`journald` adapter)
- **Cloud:** Cloud Run logs via GCP (`gcloud` adapter)
- **SonarQube:** Static code analysis (`sonarqube` adapter)
- **CI/CD:** Pipeline events and failed checks (`github-actions`, `gitlab-ci`, `jenkins` adapters)
- **Metrics:** Numeric signal polling (`prometheus`, `datadog`, `cloud-monitoring` adapters)
- **Incidents:** Alert and incident events (`alertmanager`, `pagerduty` adapters)
- **Security:** Vulnerability and policy findings (`snyk`, `trivy`, `semgrep` adapters)
- **Future:** GraphQL, Kafka, S3, etc.

## Current State

| Component | Name | Scope |
|-----------|------|-------|
| Rust struct | `LogSourceConnection` | Still exists for saved file/cloud/process connections |
| Rust struct | `CodeProject` | Landed for SonarQube-backed repository quality sources |
| React screen | `ConnectionsScreen` | "Connections" (good, generic) |
| React Library tab | `CodeProjects` | Landed for SonarQube setup, CRUD, and connection testing |
| UI panels | `ConnectionsFormPanel` | Log-specific form fields |
| DB table | `log_source_connections` | Implies log-only |
| DB table | `code_projects` | Landed; stores SonarQube config and status |
| i18n labels | `connections` | Could be better |

## Current Landed Work

- `desktop/src/types/codeProject.ts` defines the CodeProject domain contract.
- `desktop/src/features/library/useCodeProjectsState.ts` provides list/create/update/delete/test state.
- `desktop/src/features/library/components/*CodeProject*` implements the Library UI.
- `desktop/src/features/library/codeProjectsViewModel.ts` owns CodeProject draft defaults and sanitizes connected credentials when a project is saved back to local mode.
- `desktop/src-tauri/src/main.rs` contains `create_code_project`, `list_code_projects`, `update_code_project`, `delete_code_project`, and `test_sonarqube_connection`.
- `desktop/src-tauri/src/code_project_scanner.rs` contains the local CodeProject scanner and local rule-profile behavior.
- `desktop/src-tauri/src/code_project_stream.rs` contains CodeProject stream config parsing, connected-mode validation, and idle/baseline status copy.
- `desktop/src-tauri/src/sonarqube_client.rs` contains SonarQube issue formatting and remote polling.
- `desktop/src-tauri/src/main.rs` coordinates CodeProject stream sessions through `poll_code_project_stream_session`.
- CodeProject sources now launch through the monitor setup path with the same deck/session surface used by file, process, and cloud streams.
- `database/schema.sql` includes `code_projects`.

Known gaps:

- SonarQube auth tokens are currently stored in plaintext SQLite.
- Local CodeProjects intentionally clear SonarQube URL/project/token values when switching from connected mode back to local mode.
- SonarQube findings are converted to log-shaped lines before analysis.
- CodeProjects and `log_source_connections` are two parallel source systems, not one unified `stream_input_connections` table.
- Real SonarQube server verification is still pending; local CodeProject monitoring is the stable offline path.

## Refactoring Plan

### 1. Rename Rust Types

**Before:**
```rust
pub struct LogSourceConnection { ... }
pub struct StartLogSourceConnectionInput { ... }
```

**After:**
```rust
pub struct StreamInputConnection {
    pub id: String,
    pub label: String,
    pub kind: String,              // "file" | "repo" | "http-poll" | "sonarqube" | etc.
    pub adapter_kind: String,      // Identical to kind (for clarity)
    pub source_uri: String,        // URI/path agnostic to type
    pub config: serde_json::Value, // Type-specific config (JSON for flexibility)
    pub enabled: bool,
    pub created_at: String,
    pub updated_at: String,
}
```

**Why:** "Stream Input" captures the abstraction: any input that becomes a time-ordered stream of source evidence. Text lines are one representation, but the target contract should also support structured events.

### 2. Update Database Schema

```sql
-- Rename table
ALTER TABLE log_source_connections RENAME TO stream_input_connections;

-- Update schema to be type-agnostic
CREATE TABLE stream_input_connections (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    kind TEXT NOT NULL,        -- New: "file" | "repo" | "sonarqube" | ...
    adapter_kind TEXT NOT NULL, -- Same as kind (Rust contract)
    source_uri TEXT NOT NULL,
    config TEXT NOT NULL,       -- JSON config by type
    enabled BOOLEAN DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

### 3. Update React Components

**ConnectionsFormPanel.tsx** → More generic form builder:

```tsx
interface StreamInputFormProps {
  kind: "file" | "repo" | "http-poll" | "sonarqube";
  draft: Partial<StreamInputConnection>;
  onDraftChange: (draft: Partial<StreamInputConnection>) => void;
}

// Render form fields based on kind
const fieldsByKind = {
  file: [
    { name: "source_uri", label: "File Path", type: "file-picker" },
  ],
  repo: [
    { name: "source_uri", label: "Repository Path", type: "dir-picker" },
  ],
  "http-poll": [
    { name: "source_uri", label: "URL", type: "text" },
    { name: "config.pollingInterval", label: "Poll Interval (ms)", type: "number" },
    { name: "config.method", label: "HTTP Method", type: "select", options: ["GET", "POST"] },
  ],
  sonarqube: [
    { name: "source_uri", label: "SonarQube Server URL", type: "text" },
    { name: "config.projectKey", label: "Project Key", type: "text" },
    { name: "config.authToken", label: "Auth Token", type: "password" },
    { name: "config.pollingInterval", label: "Poll Interval (s)", type: "select", options: ["30", "300", "900"] },
  ],
};
```

### 4. Update SessionRegistry

Replace log-specific session handling with generic stream input:

```rust
pub fn start_stream_session(
    connection: StreamInputConnection,
) -> Result<StreamSession, String> {
    match connection.adapter_kind.as_str() {
        "file" => FileAdapter::new(connection).and_then(|a| start_session(a)),
        "repo" => RepoAdapter::new(connection).and_then(|a| start_session(a)),
        "http-poll" => HttpPollAdapter::new(connection).and_then(|a| start_session(a)),
        "sonarqube" => SonarQubeAdapter::new(connection).and_then(|a| start_session(a)),
        _ => Err(format!("Unknown adapter: {}", connection.adapter_kind)),
    }
}
```

The first implementation can continue returning text rows for compatibility.
The next contract should add a structured `evidenceEvents` path so adapters like SonarQube, CI/CD, metrics, incident feeds, and security tools do not have to masquerade as log lines.

### 5. Internationalization

**Before:**
```json
{
  "simpleMode": {
    "connections": {
      "title": "Log Connections",
      "addLogSource": "Add Log Connection",
    }
  }
}
```

**After:**
```json
{
  "simpleMode": {
    "streamInput": {
      "title": "Stream Inputs",
      "addSource": "Add Stream Input",
      "types": {
        "file": "Local File",
        "repo": "Repository",
        "http-poll": "HTTP Endpoint",
        "sonarqube": "SonarQube Analysis",
        "websocket": "WebSocket Stream",
        "journald": "System Logs",
      }
    }
  }
}
```

### 6. Type Detection & Icons

Show visual indicators for connection type:

```tsx
const connectionTypeIcons = {
  file: <FileIcon />,
  repo: <GitBranchIcon />,
  "http-poll": <NetworkIcon />,
  sonarqube: <BugIcon />,
  websocket: <WifiIcon />,
  journald: <TerminalIcon />,
};

const connectionTypeColors = {
  file: "gray",
  repo: "blue",
  "http-poll": "green",
  sonarqube: "purple",
  websocket: "orange",
  journald: "red",
};
```

## Implementation Phases

### Phase 1: Data Layer ✓
- [x] Add CodeProject domain types for the first non-log source.
- [x] Add `code_projects` schema.
- [x] Add CodeProject query/insert/update/delete functions.
- [ ] Defer `log_source_connections` → `stream_input_connections` rename until after CodeProjects monitor flow is stable.

### Phase 2: Adapter Integration
- [x] SonarQube adapter implemented
- [x] Integrate SonarQube polling into `SessionRegistry`/`poll_stream_session` compatibility path.
- [x] Wire CodeProjects into the Monitor setup selector with a Code/SonarQube source kind.
- [x] Launch configured CodeProjects as monitor sessions with SonarQube connection config attached to the native session.
- [ ] Verify CodeProject monitor launch end-to-end against a real SonarQube instance.
- [ ] Verify existing file/process/gcloud adapters still work after CodeProject changes.
- [ ] Add one event-native adapter, such as GitHub Actions or Alertmanager, to prove the design is not log-only
- [ ] Add one numeric adapter, such as Prometheus polling, to prove continuous pressure mapping

### Phase 3: React UI
- [x] Add CodeProjects Library UI and i18n strings.
- [x] Add SonarQube-specific setup form and status indicator components.
- [x] Add monitor source-kind chips and labels for CodeProjects/SonarQube in setup.
- [ ] Decide whether CodeProjects remain a separate Library tab or become a source-kind inside unified Stream Inputs.
- [ ] Extend source-kind chips and labels across replay/tail/detail surfaces.
- [ ] Gradually rename user-facing "log source" labels to "signal source" where source-agnostic.

### Phase 4: Testing
- [x] Add/adjust tests for CodeProjects tab integration in library view-model/controller coverage.
- [x] Add tests for CodeProject source selection and monitor launch-plan contracts.
- [x] Unit tests for SonarQube issue formatting, local scanner baseline behavior, and CodeProject stream config parsing.
- [ ] Integration test: create CodeProject → test connection → start monitor session → poll → render evidence.
- [ ] Regression tests: file/local/cloud monitoring still tail and still keep track audio faithful while idle.

## Breaking Changes

**For users:**
- No immediate table rename. `log_source_connections` and `code_projects` coexist.
- Future `stream_input_connections` migration still requires a tested migration script.
- API response shape changes slightly (adds `kind`, restructures `config`)

**For integrators:**
- `LogSourceConnection` may eventually become `StreamInputConnection`.
- "Log connections" terminology should become "Stream inputs" or "Signal sources" in source-agnostic UI.

## Backward Compatibility

Provide migration path:
```sql
INSERT INTO stream_input_connections
SELECT id, label, 'gcloud', 'gcloud', source_uri, config, enabled, created_at, updated_at
FROM log_source_connections
WHERE kind = 'gcloud';
```

## Success Metrics

- [ ] All 7+ adapter types work identically through generic UI
- [ ] No log-specific terminology in UI or API
- [x] SonarQube-backed CodeProject can be created and connection-tested
- [x] CodeProject sources can be launched through the same monitor flow as other sources
- [ ] At least one non-log event source can be monitored without source-specific deck code
- [ ] At least one numeric source can affect pressure without creating fake anomalies
- [ ] i18n strings support all connection types
- [ ] Docs reflect "Stream Input" naming
