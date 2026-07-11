# CodeProjects UI Design Spec
**Date:** 2026-07-11  
**Status:** Design Phase  
**Component:** Maia Library / Biblioteca — CodeProjects Tab

---

## Overview

CodeProjects is a new tab in Maia's Library that lets users manage repositories with SonarQube integration for code quality analysis. Unlike Connections (which stream real-time logs), CodeProjects poll a SonarQube instance for static code analysis issues, which then feed into the same anomaly-detection and sonification pipeline.

**Key Design Principle:** Hybrid Setup
- Step 1: Create project (name + repository URL)
- Step 2: Configure SonarQube (API URL, project key, auth token) with live validation
- Step 3: Use in Monitor (select CodeProject as data source alongside Connections)

---

## Architecture

### Component Hierarchy

```
LibraryScreen
└── LibraryTabContent
    └── CodeProjectsTab
        ├── LibraryCodeProjectsList
        │   ├── CodeProjectRow (each item)
        │   │   ├── Project name + repo URL
        │   │   ├── SonarQube status badge
        │   │   └── Action buttons (edit, start monitoring, delete)
        │   └── Empty state + "New Project" button
        │
        └── LibraryCodeProjectDrawer (side panel)
            ├── Step 1: LibraryCodeProjectForm (create mode)
            │   ├── Project name input
            │   └── Repository URL input
            │
            └── Step 2: CodeProjectSonarQubeConfigForm (edit/configure mode)
                ├── SonarQube API URL input
                ├── SonarQube Project Key input
                ├── Auth Token input (password field)
                ├── "Test Connection" button
                └── Status display (loading/success/error)
```

### New Files to Create

1. **`desktop/src/features/library/components/LibraryCodeProjectsList.tsx`**
   - Main list view with action-focused rows
   - Empty state handling
   - Delete confirmation UI

2. **`desktop/src/features/library/components/LibraryCodeProjectDrawer.tsx`**
   - Drawer panel (side panel from right)
   - Orchestrates form steps (create vs configure)
   - Handles transitions between steps

3. **`desktop/src/features/library/components/LibraryCodeProjectForm.tsx`**
   - Basic project creation form
   - Name + Repository URL inputs
   - Validation (required fields, URL format)

4. **`desktop/src/features/library/components/CodeProjectSonarQubeConfigForm.tsx`**
   - SonarQube configuration form
   - Three input fields + Test Connection button
   - Live validation feedback
   - Success/error states

5. **`desktop/src/features/library/components/CodeProjectStatusIndicator.tsx`**
   - Reusable status badge/chip
   - Shows: "Not Configured" | "Testing..." | "Ready" | "Error"
   - Color coded (gray, blue, green, red)

6. **`desktop/src/features/library/codeProjectsViewModel.ts`**
   - ViewModel builders for form state
   - Status resolution logic
   - Error message formatting

7. **`desktop/src/features/library/useCodeProjectsState.ts`**
   - Hook for managing CodeProjects list state
   - CRUD operations (create, read, update, delete)
   - Refresh logic

8. **`desktop/src/types/codeProject.ts`** (extends existing types)
   - CodeProject interface (already defined)
   - CodeProjectFormDraft interface
   - CodeProjectState interface

---

## Data Flow

### Create New Project
```
1. User clicks "New Project"
   → LibraryCodeProjectDrawer opens
   → LibraryCodeProjectForm renders

2. User enters name + repo URL
   → Real-time validation (name required, URL format)

3. User clicks "Create"
   → Save to DB (basic CodeProject record)
   → Drawer switches to CodeProjectSonarQubeConfigForm
   → projectId is now available

4. User enters SonarQube credentials
   → All fields populated

5. User clicks "Test Connection"
   → Backend: HTTP request to SonarQube API
   → Validate credentials + project exists
   → If valid: return issue count + metadata
   → Show success state + issue count
   → Auto-save credentials on success

6. User closes drawer
   → List refreshes
   → New project shows "Ready" status badge
```

### Edit Existing Project
```
1. User clicks "Edit" on a project row
   → LibraryCodeProjectDrawer opens
   → CodeProjectSonarQubeConfigForm renders (pre-filled)

2. User modifies credentials
   → Changes reflected in form state

3. User clicks "Test Connection"
   → Same flow as above

4. On close/save
   → Backend persists updated config
   → Status badge updates
```

### Delete Project
```
1. User clicks "Delete" on a project row
2. Confirmation dialog: "Delete <project name>?"
3. On confirm: Backend deletes record
4. List refreshes
```

---

## Component Specifications

### LibraryCodeProjectsList

**Purpose:** Display all CodeProjects in action-focused format

**Props:**
```typescript
interface LibraryCodeProjectsListProps {
  projects: CodeProject[];
  loading: boolean;
  error: string | null;
  onNew: () => void;
  onEdit: (projectId: string) => void;
  onDelete: (projectId: string) => Promise<void>;
  onStartMonitor: (projectId: string) => void;
}
```

**UI Layout:**
- Header: "Code Projects" + count badge
- Empty state (if no projects):
  - Illustration/icon
  - "No Code Projects yet"
  - "Create your first SonarQube project to analyze code quality"
  - [New Project] button
- List (if projects exist):
  - Each row: `[Name] [Repo URL] [Status Badge] [Edit] [Monitor] [Delete]`
  - Hover state: slight background highlight
  - Status badge: colored chip (gray/blue/green/red)
  - Delete with confirmation dialog

**Behavior:**
- Loading state: skeleton loaders for each row
- Error state: error banner with retry button
- Delete: confirm dialog, disable button during deletion

---

### LibraryCodeProjectDrawer

**Purpose:** Side panel for creating/editing CodeProjects

**Props:**
```typescript
interface LibraryCodeProjectDrawerProps {
  visible: boolean;
  projectId?: string; // undefined = create mode
  onClose: () => void;
  onSave: (project: CodeProject) => Promise<void>;
}
```

**Behavior:**
- Opens from right side (drawer animation)
- Create mode: shows LibraryCodeProjectForm
- After create: auto-switches to CodeProjectSonarQubeConfigForm
- Edit mode: shows CodeProjectSonarQubeConfigForm (pre-filled)
- Close button + backdrop close
- Loading state during save

---

### LibraryCodeProjectForm

**Purpose:** Form to create/edit basic project info

**Fields:**
1. **Project Name** (required)
   - Text input, max 100 chars
   - Placeholder: "My Service"
   - Help text: "Give your project a memorable name"

2. **Repository URL** (required)
   - Text input
   - Placeholder: "https://github.com/org/repo"
   - Help text: "Link to your repository for reference"
   - Basic URL validation

**Validation:**
- Both fields required
- URL should be valid format (basic check)
- Show error inline below field

**Actions:**
- [Create] button (disabled until valid)
- [Cancel] link

---

### CodeProjectSonarQubeConfigForm

**Purpose:** Configure SonarQube connection with live validation

**Fields:**
1. **SonarQube Server URL** (required)
   - Text input
   - Placeholder: "https://sonarqube.example.com"
   - Help text: "Base URL of your SonarQube instance"

2. **Project Key** (required)
   - Text input
   - Placeholder: "org.example:my-service"
   - Help text: "The SonarQube project key (e.g., org.name:service-name)"

3. **Authentication Token** (required)
   - Password input
   - Placeholder: "squ_xxxxxxxxxxxx"
   - Help text: "User token from SonarQube (Settings → Security → Tokens)"

**Actions:**
- [Test Connection] button
  - Disabled until all fields filled
  - Shows loading spinner during test
  - Shows result: ✓ "Connection valid. 5 issues found." or ✗ "Error message"
  - Auto-saves credentials on success

- [Save] button (only if test passed)
- [Cancel] link

**Behavior:**
- All fields pre-filled in edit mode
- Real-time validation feedback
- Loading state during test
- Error messages are specific and actionable:
  - "Invalid URL format"
  - "Connection failed. Check your internet."
  - "Invalid credentials or project not found"
  - "SonarQube API unavailable"

---

### CodeProjectStatusIndicator

**Purpose:** Reusable status badge showing SonarQube connection health

**Props:**
```typescript
interface CodeProjectStatusIndicatorProps {
  status: 'not-configured' | 'testing' | 'ready' | 'error';
  errorMessage?: string;
  issueCount?: number;
  lastCheckedAt?: string;
}
```

**Display:**
- **not-configured** (gray): "Not Configured"
- **testing** (blue): "Testing..." + spinner
- **ready** (green): "Ready" or "Ready • 5 issues"
- **error** (red): "Error" + tooltip with message on hover

**Styling:**
- Chip/badge component, inline
- Follows DESIGN.md color variables (--color-calm, --color-accent, --color-critical)
- Hover tooltip shows last check time + details

---

## State Management

### CodeProject Persistence

**Database Table:** `code_projects` (new)
```sql
CREATE TABLE code_projects (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  repository_url TEXT NOT NULL,
  sonarqube_api_url TEXT,
  sonarqube_project_key TEXT,
  sonarqube_auth_token TEXT,
  status TEXT DEFAULT 'not-configured',
  last_checked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### State Hook: `useCodeProjectsState`

```typescript
interface CodeProjectsState {
  projects: CodeProject[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (name: string, repoUrl: string) => Promise<CodeProject>;
  update: (id: string, config: CodeProjectSonarQubeConfig) => Promise<void>;
  delete: (id: string) => Promise<void>;
  testConnection: (config: CodeProjectSonarQubeConfig) => Promise<boolean>;
}
```

---

## Integration Points

### With Monitor Session Flow

When user starts a monitoring session:
1. Monitor shows: "Select Stream Input or Code Analysis"
2. Tabs: "Streams" (Connections) vs "Code Analysis" (CodeProjects)
3. Sequential flow: Choose type → Pick specific project/connection
4. CodeProject selection → Backend polls SonarQube API
5. Issues feed into analyzer like log events

### With i18n

Add to `simpleMode.codeProjects.*`:
- `title`: "Code Projects"
- `description`: "Manage repositories with SonarQube integration"
- `newProject`: "New Project"
- `projectName`: "Project name"
- `repositoryUrl`: "Repository URL"
- `sonarqubeServerUrl`: "SonarQube server URL"
- `sonarqubeProjectKey`: "Project key"
- `sonarqubeAuthToken`: "Authentication token"
- `testConnection`: "Test Connection"
- `connectionValid`: "Connection valid. {count} issues found."
- `connectionFailed`: "Connection failed"
- `notConfigured`: "Not Configured"
- `ready`: "Ready"
- `edit`: "Edit"
- `monitor`: "Start Monitoring"
- `delete`: "Delete"

### With Design System

- Use DESIGN.md colors: `--color-calm`, `--color-accent`, `--color-critical`, `--color-attention`
- Typography: IBM Plex Sans (body text), Space Grotesk (titles)
- Spacing: Base unit 8px, use `--space-*` variables
- Responsive: Mobile-first, test at 320px / 768px / 1440px

---

## Error Handling

| Error | User Message | Action |
|-------|--------------|--------|
| Invalid SonarQube URL | "Invalid URL format" | Show in-field error, keep focus |
| Network timeout | "Connection failed. Check your internet." | Retry button, disable save |
| Invalid credentials | "Invalid credentials or project not found" | Suggest checking token + project key |
| SonarQube API error | "SonarQube API error: [error]" | Show raw error, suggest contacting admin |
| Project deleted from SonarQube | "Project no longer exists on SonarQube" | Show stale badge, offer to delete local |
| DB persistence error | "Failed to save project. Please try again." | Retry button |

---

## Testing Strategy

**Unit Tests:**
- CodeProjectSonarQubeConfigForm validation logic
- CodeProjectStatusIndicator state mapping
- codeProjectsViewModel builders

**Integration Tests:**
- Create → Configure → Save flow
- Edit existing project + test connection
- Delete with confirmation
- Error states and recovery

**Manual Testing:**
- Full create workflow (name → URL → SonarQube config → save)
- Edit existing project
- Delete with confirmation dialog
- Test connection with real SonarQube instance
- Responsive layout at 320px / 768px / 1440px

---

## Success Criteria

✓ Users can create a CodeProject with name + repo URL  
✓ Users can configure SonarQube with live validation  
✓ Status badge shows connection health clearly  
✓ Delete works with confirmation  
✓ All strings localized (en + es)  
✓ Follows DESIGN.md constraints  
✓ TypeScript compiles with no `any` types  
✓ Components are isolated and testable  
✓ Integrates with Monitor session flow  

---

## Out of Scope (Phase 2+)

- Importing projects directly from SonarQube (auto-list available projects)
- Webhook integration (auto-trigger on code quality changes)
- Issue detail view (drill-down into specific SonarQube issues)
- Batch operations (create multiple projects)
- SonarQube instance health dashboard

