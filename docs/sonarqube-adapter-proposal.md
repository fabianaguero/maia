# SonarQube Static Analysis Adapter Proposal

**Branch:** `feat/sonarqube-adapter`  
**Status:** Design phase  
**Updated:** 2026-07-10

## Overview

Extend Maia's monitoring capabilities to include **static code analysis anomalies** from SonarQube. Instead of monitoring live logs or runtime behavior, this adapter continuously polls SonarQube API for code quality issues and maps them into the existing anomaly/sonification pipeline.

## Motivation

- **Shift left:** Catch architectural and code-quality drifts before they hit production logs
- **Continuous quality:** Monitor code health like current system monitoring operational health
- **Same interface:** Reuse existing deck, waveform, and playback logic - no UI changes needed
- **Natural mapping:** SonarQube severities (CRITICAL, MAJOR, MINOR, INFO) → anomaly types → musical deformation

## Architecture Compatibility

The current Maia architecture **is fully prepared** for SonarQube adapter. Key evidence:

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

It extracts severity + timestamp + message → anomaly marker. **No code changes needed.**

## Implementation Plan

### Phase 1: Adapter Skeleton (Rust)

**File:** `desktop/src-tauri/src/sonarqube_adapter.rs`

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

**Integration in SessionRegistry (main.rs):**
- Add `sonarqube` case to `adapter_kind` match
- Initialize `SonarQubeAdapter` with connection config
- Treat polling output identically to file/process/http-poll

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

**Python analyzer treats as:** Code anomaly with severity mapped to metrics + waveform mutations

### Phase 3: UI Connection (React)

**ConnectionsScreen.tsx additions:**
- Input for SonarQube server URL
- Input for project key (e.g., `org.example:my-service`)
- Auth token input (stored encrypted in SQLite)
- Polling interval dropdown (30s, 5m, 15m)
- Test connection button

**SessionSetupPanel.tsx updates:**
- Select SonarQube source → auto-populate project
- Same "Start monitoring" flow as logs
- Waveform shows code quality drift in real-time

### Phase 4: Database Schema

**log_source_connections table** (already exists):
```sql
-- Add sonarqube example to config JSON
INSERT INTO log_source_connections (
  kind, adapter_kind, label, source_uri, config
) VALUES (
  'sonarqube',
  'sonarqube', 
  'API Service Code Quality',
  'https://sonarqube.example.com',
  '{"projectKey": "org.example:api-service", "tokenEncrypted": "..."}'
);
```

### Phase 5: Analyzer Integration (Python)

**No changes required!** The analyzer already:
1. Receives text chunks from SessionRegistry
2. Parses lines by `[TIMESTAMP] [SEVERITY]` pattern
3. Extracts anomalies regardless of source

**Optional enhancements (future):**
- Track issue lifecycle (new → acknowledged → fixed)
- Weight repeated violations differently (decay over time)
- Correlate multiple violations in same file → severity boost

## Data Flow

```
SonarQube API (/api/issues/search)
    ↓
SonarQubeAdapter::poll() (Rust)
    ↓
format_issue_as_log_line() 
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

- [ ] `sonarqube` adapter kind is recognized and polled correctly
- [ ] SonarQube issues format into log lines matching analyzer's expected pattern
- [ ] UI allows saving SonarQube connection with auth token + project key
- [ ] Monitor deck renders SonarQube anomalies with same waveform/severity visual
- [ ] Test with real SonarQube instance (Cloud or self-hosted)
- [ ] Playback deforms based on code quality drift (same as log severity)
- [ ] Issue state tracking works (new/closed issues detected across polls)

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
