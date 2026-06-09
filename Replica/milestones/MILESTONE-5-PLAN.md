# Milestone 5 Plan - Workspace and Panes

Milestone 5 adds a real workspace system: split panes, tabs, persisted pane
layout, per-pane history, session restore, and a small first slice of linked
panes if it stays clean. It must keep Replica local-first, keep the renderer away
from raw filesystem access, and preserve the existing editor, explorer, search,
graph, outline, backlinks, and settings behavior after every implementation
step.

## Constraints

- Do not rewrite the architecture.
- Do not widen renderer filesystem access.
- Keep filesystem and index operations behind the existing preload bridge.
- Keep IPC typed in `src/shared/ipc-contract.ts` and payloads validated in
  `src/main/ipc/validate.ts`.
- Keep persisted workspace state versioned and migrated.
- Keep the app shippable after each step.
- Do not implement Properties/Bases, Canvas, plugins, sync, publish, URI scheme,
  workspace templates, or multi-window support.
- Avoid complex drag/docking systems until a simpler workspace proves itself.

## Current State

### Active Note State

- The renderer store in `src/renderer/app/store.ts` has one global
  `activePath: string | null`.
- `openNote(path)` in `src/renderer/app/actions.ts` only sets that global
  `activePath`.
- `FileExplorer`, quick switcher, preview links, backlinks, search, tags, graph,
  and command actions all open notes by calling the single-note flow.
- `EditorPane` receives `activePath`, reads note content through
  `window.replica.readNote()`, and writes through `window.replica.writeNote()`.
- The editor is currently a single CodeMirror instance that swaps documents when
  `activePath` changes.

### Editor, Preview, And Right Panes

- The center area is one editor plus an optional preview controlled by
  `settings.showPreview`.
- `PreviewPane` is tied to the same global `activePath`.
- `RightPane` is one fixed right sidebar with tab state stored as
  `rightPane: 'backlinks' | 'search' | 'tags' | 'outline' | 'graph'`.
- Backlinks, outline, and local graph are all driven by the global active note.
- Search and tags are global vault tools.
- Breadcrumbs show the global active note path and can reveal folders in the
  explorer.

### Existing Settings And Storage

- Per-vault settings are stored in `.obsidian-replica/settings.json`.
- Settings schema is versioned in `src/shared/settings.ts` and currently v3.
- `ConfigStore` owns settings reads/writes in `src/main/vault/config-store.ts`.
- Settings IPC already exists as `getSettings()` and `updateSettings()`.
- Startup settings from Milestone 4 include `startupBehavior` and
  `reopenLastVault`.
- No workspace layout file exists yet.

### What Must Change

- Replace single global `activePath` as the source of editor identity with a
  workspace model containing panes, tabs, and an active pane/tab.
- Keep a derived "current note" for existing right panes, breadcrumbs, status
  bar, reveal-current-file, and commands while those surfaces are adapted.
- Allow multiple open tabs without making every tab a live CodeMirror instance.
- Add persisted workspace state inside `.obsidian-replica/`.
- Add versioned normalization/migration for workspace state, separate from
  settings.
- Add typed IPC/preload methods only for reading/writing workspace state; note
  content continues to use the existing note APIs.

## Proposed UX

### Tabs

- Each editor pane has a compact tab strip above its content.
- A tab shows note title or basename, with a short path tooltip.
- The active tab is visually highlighted.
- Close tab uses an icon button with an accessible label.
- Closing the last tab in a pane leaves an empty pane placeholder unless it is
  the only pane and the workspace can stay empty.
- Opening a note from explorer/search/backlinks/quick switcher opens it in the
  active pane:
  - If the note is already open in the active pane, select that tab.
  - If the note is open in another pane, either focus that existing tab or open a
    second tab in the active pane; prefer focusing the existing tab for the first
    shippable slice.

### Split Panes

- Provide commands and small pane controls for:
  - Split right.
  - Split down.
  - Close pane.
- Splitting creates a sibling pane in the requested direction and opens the
  active tab there when one exists; otherwise it creates an empty pane.
- Closing a pane closes its tabs after saving any dirty editor state.
- The active pane is shown with a subtle border/accent on its tab strip.
- Full drag-and-drop docking is deferred.

### Resizable Layout

- Split gutters can resize adjacent panes.
- Sizes persist as ratios, not pixels, so restore works across window sizes.
- Start with pointer-drag gutters or simple keyboard-free resizing; avoid nested
  drag complexity beyond the layout tree.
- If a pane is resized to an unusably small size, clamp it to a minimum ratio.

### Session Restore

- On vault open, load workspace state from `.obsidian-replica/workspace.json`.
- If `settings.startupBehavior === 'welcome'` or `settings.reopenLastVault` is
  false, startup should still show the welcome flow and not force a workspace
  restore.
- When a vault is explicitly opened, restore that vault's workspace after its
  settings and tree load.
- Restore open tabs, active tab, active pane, split tree, pane sizes, and
  per-pane history.
- Missing/deleted note paths should be skipped with a non-blocking empty state;
  if every restored tab is missing, open an empty workspace instead of crashing.

### Linked Panes

- Keep the first slice small:
  - Linked preview follows the active tab of its linked editor pane.
  - Right-pane contextual views can follow the active workspace note.
- Avoid a full arbitrary linked-pane graph in Milestone 5 unless the core system
  is already stable.
- Defer advanced link groups, color-coded groups, and independent linked graph
  panes if they threaten scope.

## Technical Design

### Workspace Persistence Location

- Store workspace state in `.obsidian-replica/workspace.json`.
- Keep it separate from `settings.json` so layout churn does not rewrite general
  settings.
- Main process owns the file read/write through a new workspace store.
- Renderer uses typed preload methods; it never reads or writes the file
  directly.

### Workspace Schema

Recommended schema version: `WORKSPACE_SCHEMA_VERSION = 1`.

```ts
export interface WorkspaceStateV1 {
  schemaVersion: 1;
  activePaneId: string | null;
  root: WorkspaceNode;
  panes: Record<string, WorkspacePane>;
}

export type WorkspaceNode =
  | { type: 'pane'; paneId: string }
  | {
      type: 'split';
      id: string;
      direction: 'horizontal' | 'vertical';
      ratio: number;
      first: WorkspaceNode;
      second: WorkspaceNode;
    };

export interface WorkspacePane {
  id: string;
  activeTabId: string | null;
  tabs: WorkspaceTab[];
  history: WorkspaceHistory;
  linkedGroupId?: string | null;
}

export interface WorkspaceTab {
  id: string;
  path: string;
  title?: string;
}

export interface WorkspaceHistory {
  back: string[];
  forward: string[];
}
```

Normalization rules:

- Unknown or malformed files normalize to a single empty pane.
- Pane IDs must be unique, non-empty strings generated by the app.
- Tab IDs must be unique within a pane.
- Paths must be vault-relative Markdown paths and pass the same containment
  assumptions used by note APIs.
- Split `ratio` must be finite and clamped, for example `0.2 <= ratio <= 0.8`.
- `activePaneId` must reference an existing pane or fall back to the first pane.
- `activeTabId` must reference a tab in its pane or fall back to the first tab.
- History arrays are bounded, for example 50 entries each.

### Renderer State Shape

Add a workspace slice to the store:

```ts
interface AppState {
  workspace: WorkspaceState;
  activePaneId: string | null;
  // Keep temporarily as a derived compatibility value.
  activePath: string | null;
}
```

Recommended approach:

- Introduce pure helpers in `src/core/workspace/` for open/close/split/history.
- Renderer actions call helpers and then update store state.
- Derive the current active note path from
  `workspace.panes[activePaneId].activeTab.path`.
- Keep `activePath` as derived compatibility state during migration, then remove
  it only if the code gets simpler.
- Right panes, breadcrumbs, reveal-current-file, and status bar use the derived
  active note so their behavior remains stable.

### Components To Add Or Change

Likely new files:

- `src/shared/workspace.ts`: schema, defaults, normalization, migration types.
- `src/main/vault/workspace-store.ts`: read/write workspace file.
- `src/core/workspace/workspace-model.ts`: pure tab/pane/layout operations.
- `src/core/workspace/workspace-history.ts`: pure back/forward helpers.
- `src/renderer/components/workspace/WorkspaceShell.tsx`
- `src/renderer/components/workspace/PaneView.tsx`
- `src/renderer/components/workspace/TabStrip.tsx`
- `src/renderer/components/workspace/SplitView.tsx`
- `src/renderer/components/workspace/ResizeHandle.tsx`

Likely changed files:

- `src/shared/ipc-contract.ts`
- `src/main/ipc/register-ipc.ts`
- `src/main/ipc/validate.ts`
- `src/main/vault/vault-service.ts`
- `src/preload/preload.ts`
- `src/renderer/app/store.ts`
- `src/renderer/app/actions.ts`
- `src/renderer/App.tsx`
- `src/renderer/components/EditorPane.tsx`
- `src/renderer/components/PreviewPane.tsx`
- `src/renderer/components/RightPane.tsx`
- `src/renderer/components/Breadcrumbs.tsx`
- `src/renderer/components/CommandPalette.tsx`
- `src/renderer/components/QuickSwitcher.tsx`
- `src/renderer/styles/app.css`

### IPC And Preload

Add only narrow workspace persistence methods if needed:

- `getWorkspace(): Promise<WorkspaceState>`
- `updateWorkspace(workspace: WorkspaceState): Promise<WorkspaceState>`

Possible alternative:

- `replaceWorkspace(workspace)` instead of `updateWorkspace()` to avoid partial
  merge complexity. Prefer full replacement for v1.

Validation:

- `asWorkspaceState(input)` validates the full object before writing.
- Unknown keys are ignored during normalization on read but rejected for renderer
  writes if strict validation is practical.
- Paths remain vault-relative strings; note existence checks can happen during
  restore using the index/listing rather than validating at IPC boundary.

### Migration Strategy

- Add `WORKSPACE_SCHEMA_VERSION = 1`.
- Missing workspace file creates a default single-pane empty workspace.
- Malformed workspace file normalizes to default and can be rewritten after the
  next successful workspace change.
- Future migrations should follow the settings pattern: tolerate old schema on
  read, write current schema on save.
- Do not merge workspace into settings v3; keep this as a separate schema.

### Adapting Existing Single-Active-Note Flows

- `openNote(path)` becomes `openNoteInActivePane(path)`.
- Explorer/search/backlinks/quick switcher continue calling one high-level
  action, so they do not need to know about workspace internals.
- `EditorPane` should receive a pane/tab identity and active path. In the first
  slice, only the active tab's editor is mounted per pane.
- Before changing tabs or panes, flush pending editor saves for the pane being
  left.
- `PreviewPane`, `RightPane`, `Breadcrumbs`, and `StatusBar` consume the derived
  active note path.
- Commands should be added for split/close pane and back/forward history, but
  existing commands must keep working.

## Feature Plans And Acceptance Criteria

### 1. Split Panes And Tabs

Purpose:

- Allow multiple notes to stay open and support multiple editor areas.

Acceptance criteria:

- Opening a note creates/selects a tab in the active pane.
- Multiple notes can be open as tabs in one pane.
- Clicking a tab makes it active and updates editor, preview, breadcrumbs, and
  right-pane contextual views.
- Closing a tab removes it without closing other tabs.
- Closing the active tab selects an adjacent tab or leaves the pane empty.
- Splitting right/down creates a second pane and tracks active pane separately.
- Closing a pane removes it from the layout and selects a remaining pane.
- Move tab between panes is implemented only if simple; otherwise explicitly
  deferred.

Tests needed:

- Pure tab open/select/dedupe behavior.
- Close active/inactive tab behavior.
- Active pane selection after split and close.
- No renderer filesystem access in tab actions.

Risks:

- Existing components assume one active path.
- Editor save timing can lose data if tab switches do not flush correctly.

### 2. Draggable Pane Layout

Purpose:

- Let users resize split panes and persist comfortable layouts.

Acceptance criteria:

- Split panes render with resize handles.
- Dragging a handle changes adjacent pane sizes.
- Ratios are clamped to usable minimums.
- Sizes survive app reload after persistence lands.
- Layout remains usable on narrow windows.

Tests needed:

- Pure split tree resize helper tests.
- Ratio clamp tests.
- Optional e2e smoke for a resize handle existing after split.

Risks:

- Pointer handling can interfere with editor selection.
- Deep nested splits can make CSS layout brittle.

### 3. Pane Persistence

Purpose:

- Save and restore workspace layout per vault.

Acceptance criteria:

- Workspace is written to `.obsidian-replica/workspace.json`.
- Restored state includes split tree, pane sizes, open tabs, active tab, active
  pane, and per-pane history.
- Missing/deleted files are skipped or shown as missing placeholders without
  crashing.
- Malformed workspace file falls back to a default single-pane workspace.
- Persisted workspace schema is versioned.

Tests needed:

- Workspace schema normalization/migration.
- Malformed input fallback.
- Missing file restore handling.
- Main-store read/write tests if filesystem helpers are extracted.
- IPC validation tests for workspace payloads.

Risks:

- Persisting too frequently can churn disk writes.
- Stale paths can leave users in an empty workspace if not handled gently.

### 4. Linked Panes

Purpose:

- Keep related views in sync without building a full pane-linking platform.

Acceptance criteria:

- First slice links preview/right contextual views to the active workspace note.
- If editor-preview pane linking is implemented, the preview follows only its
  linked editor pane, not every pane.
- Link state persists only if the implementation is small and clear.
- If full linked panes are deferred, the doc states the smaller behavior that
  shipped.

Tests needed:

- Pure helper tests for resolving linked pane targets if a link model is added.
- Manual checks that backlinks/outline/graph update from the selected pane.

Risks:

- Arbitrary link groups can expand into a large feature.
- Users may expect link groups to work like mature note apps; keep UI explicit.

### 5. Per-Pane History

Purpose:

- Let each pane navigate back/forward through notes independently.

Acceptance criteria:

- Opening a note pushes the prior active tab path onto that pane's back stack.
- Back selects/opens the prior note in the same pane.
- Forward restores the next note after a back.
- Navigating after back clears the forward stack.
- History does not change the active pane unexpectedly.
- Keyboard shortcuts are added only if they do not conflict with editor/browser
  shortcuts.

Tests needed:

- Back/forward helper tests.
- Forward clearing tests.
- Active pane preservation tests.
- Session restore of history arrays.

Risks:

- History can fight tab selection semantics.
- Global active note consumers must follow pane history changes correctly.

### 6. Session Restore

Purpose:

- Reopen the user's previous workspace when startup settings allow it.

Acceptance criteria:

- If startup behavior reopens the last vault, the last vault opens and its
  workspace restores.
- If startup behavior is welcome or reopen-last-vault is false, app shows the
  welcome screen and does not force workspace restore.
- Explicitly opening a vault restores that vault's workspace.
- Missing notes are skipped or shown as missing without red renderer errors.
- Empty or absent workspace files create a clean empty pane.

Tests needed:

- Startup behavior helper tests.
- Restore respects `startupBehavior`.
- Missing-file restore normalization.
- E2E smoke still boots welcome UI when configured.

Risks:

- Current `loadCurrentVault()` reopens unconditionally; it may need a narrow main
  or renderer change to respect settings after vault metadata is available.
- Race conditions between vault open, settings load, workspace restore, and tree
  refresh.

## Cross-Cutting Tests Needed

- `tests/workspace-schema.test.ts`: defaults, migration, malformed input,
  missing fields, invalid IDs, invalid ratios.
- `tests/workspace-tabs.test.ts`: open, select, close, dedupe, active tab
  fallback.
- `tests/workspace-layout.test.ts`: split tree creation, close pane, resize
  clamp, active pane fallback.
- `tests/workspace-history.test.ts`: per-pane back/forward behavior.
- `tests/workspace-restore.test.ts`: missing/deleted note handling and session
  restore policy.
- `tests/validate.test.ts`: workspace IPC payload validation.
- E2E smoke update: open one navigation surface or split command without
  depending on native dialogs.
- Security test or lint-style assertion that renderer code still uses
  `window.replica` / `api()` and never imports Node filesystem modules.

## Risks

- **State complexity**: workspace state can sprawl if UI code mutates it directly.
  Keep operations in pure helpers and renderer actions.
- **Stale workspace references**: files may be deleted, renamed, or moved outside
  the app. Restore and tab selection must tolerate missing notes.
- **Layout persistence bugs**: malformed split trees can break the whole UI.
  Normalize aggressively and keep a default fallback.
- **Keyboard focus issues**: tab strips, split controls, palettes, and CodeMirror
  can compete for shortcuts. Add only simple shortcuts first.
- **Editor instance cleanup**: multiple panes mean multiple CodeMirror lifecycles.
  Destroy editors on tab/pane close and flush saves before unmount.
- **Performance with many tabs**: avoid mounting every tab's editor. Mount active
  tab content per pane and keep inactive tabs lightweight.
- **Interaction with backlinks/outline/graph**: contextual panes must know which
  workspace note they follow. Start with the active pane's active note.

## Recommended Implementation Order

1. **Workspace schema and tests first**
   - Add `src/shared/workspace.ts`, defaults, normalization, migration, and pure
     tests.
2. **Tab model**
   - Add pure helpers for opening/selecting/closing tabs and deriving the active
     note path.
3. **Tab UI**
   - Add tab strip around the current editor while still using one pane.
4. **Split layout**
   - Add layout tree, split commands, active pane tracking, and close-pane.
5. **Persistence**
   - Add workspace store, typed IPC/preload methods, validation, debounce writes,
     and restore on explicit vault open.
6. **Session restore**
   - Respect `startupBehavior` and `reopenLastVault`, then restore layout when a
     vault is reopened.
7. **Per-pane history**
   - Add back/forward stacks after tabs and persistence are stable.
8. **Linked panes last or deferred**
   - Ship a small link behavior only if it is clean; otherwise document it as
     deferred.

## Deferred Items

- Full drag-and-drop tab reordering.
- Complex layout docking and arbitrary drop zones.
- Full linked-pane system with named/color groups.
- Workspace templates.
- Multi-window support.
- Properties/Bases.
- Canvas.
- Plugins and marketplace.
- Sync, publish, and URI scheme.
- Advanced keyboard customization for workspace commands.

## Milestone 5 Completion Gate

- `npm run check` passes.
- `npm run build` passes.
- `npm run test:e2e` passes.
- `npm run dev` renders without red app runtime errors.
- Renderer still has no raw filesystem access.
- Workspace state is versioned and stored under `.obsidian-replica/`.
- Existing editor/search/graph/explorer/settings flows still work.
- Missing or malformed workspace state never prevents the vault from opening.

## Milestone links

- Previous: [[MILESTONE-4.5]]
- Next: [[MILESTONE-5]]
- Implementation: [[MILESTONE-5]]
