# Stream Input UI Refactor

**Branch:** `feat/sonarqube-adapter`  
**Status:** Design & implementation  
**Updated:** 2026-07-10

## Objective

Refactor the connection management UI from "Log-centric" to "Stream Input" - a generic, heterogeneous system supporting:
- **Files:** Local log files (`file` adapter)
- **Repositories:** Code analysis (`repo` adapter)
- **HTTP/Polling:** Web endpoints (`http-poll` adapter)
- **WebSockets:** Real-time streams (`websocket` adapter)
- **System Logs:** journald (`journald` adapter)
- **Cloud:** Cloud Run logs via GCP (`gcloud` adapter)
- **SonarQube:** Static code analysis (`sonarqube` adapter)
- **Future:** GraphQL, Kafka, S3, etc.

## Current State

| Component | Name | Scope |
|-----------|------|-------|
| Rust struct | `LogSourceConnection` | Assumes log input |
| React screen | `ConnectionsScreen` | "Connections" (good, generic) |
| UI panels | `ConnectionsFormPanel` | Log-specific form fields |
| DB table | `log_source_connections` | Implies log-only |
| i18n labels | `connections` | Could be better |

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

**Why:** "Stream Input" captures the abstraction: any input that becomes a stream of text.

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
- [x] Update Rust types (LogSourceConnection → StreamInputConnection)
- [ ] Update database schema
- [ ] Update query/insert functions

### Phase 2: Adapter Integration
- [x] SonarQube adapter implemented
- [ ] Integrate all adapters with SessionRegistry
- [ ] Verify existing adapters still work

### Phase 3: React UI
- [ ] Update ConnectionsFormPanel to be type-aware
- [ ] Add type-specific form fields by kind
- [ ] Update i18n strings
- [ ] Add connection type icons/badges

### Phase 4: Testing
- [ ] Unit tests for type-specific config
- [ ] Integration test with SonarQube adapter
- [ ] Manual test: create connections of different types

## Breaking Changes

**For users:**
- `log_source_connections` table renamed → requires migration script
- API response shape changes slightly (adds `kind`, restructures `config`)

**For integrators:**
- `LogSourceConnection` → `StreamInputConnection`
- "Log connections" terminology → "Stream inputs"

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
- [ ] SonarQube connection can be created + monitored like any other source
- [ ] i18n strings support all connection types
- [ ] Docs reflect "Stream Input" naming
