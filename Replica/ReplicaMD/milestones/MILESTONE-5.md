# Milestone 5 - Workspace and Panes

Milestone 5 adds a versioned workspace system with tabs, split panes, pane
resize, per-pane history, and per-vault session persistence. The renderer still
does not read or write files directly: workspace state is stored by the main
process in `.obsidian-replica/workspace.json` through typed, validated IPC.

## Delivered scope

### Workspace schema

- `WORKSPACE_SCHEMA_VERSION = 1`.
- New persisted file: `.obsidian-replica/workspace.json`.
- Workspace state includes:
  - a split layout tree;
  - pane records;
  - tabs per pane;
  - active pane and active tab;
  - per-pane back/forward history;
  - split ratios.
- `normalizeWorkspace()` defensively handles missing, malformed, or hand-edited
  files and falls back to a safe single empty pane.
- Split ratios are clamped.
- Active pane/tab IDs fall back to valid existing IDs.
- History arrays are bounded.
- Missing/deleted restored notes are pruned when the workspace is read from an
  open vault.

### Tabs and panes

- Notes open as tabs in the active workspace pane.
- Opening an already-open note selects the existing tab.
- Tabs can be selected and closed.
- The active pane is visually indicated.
- Split right and split down create additional panes.
- Panes can be closed safely; closing the only pane is a no-op.
- Resize handles adjust split ratios with clamping.

### Persistence and restore

- Workspace state is debounced and saved through `replaceWorkspace()`.
- Explicitly opening or creating a vault restores that vault's workspace.
- Startup restore does not force a workspace open when settings say
  `startupBehavior: "welcome"` or `reopenLastVault: false`.
- Malformed workspace files and missing restored notes do not crash the app.

### Per-pane history

- Opening a new note records the prior active note in that pane's back stack.
- Back/forward navigation is per pane.
- Navigating after going back clears that pane's forward stack.
- Back/forward commands are available from the command palette.

### Linked pane behavior

- Full arbitrary linked-pane groups are deferred.
- Existing contextual views - preview, breadcrumbs, backlinks, outline, local
  graph - follow the active workspace note. This keeps the useful first slice
  without introducing a larger linking system.

## Changed files

```text
src/shared/workspace.ts                         (new schema, defaults, normalization)
src/shared/ipc-contract.ts                      (+workspace channels/API)
src/core/workspace/workspace-model.ts           (pure tab, pane, split helpers)
src/core/workspace/workspace-history.ts         (pure back/forward helpers)
src/main/vault/workspace-store.ts               (workspace.json persistence)
src/main/vault/vault-service.ts                 (+get/replace workspace)
src/main/ipc/validate.ts                        (+asWorkspaceState)
src/main/ipc/register-ipc.ts                    (+workspace handlers)
src/preload/preload.ts                          (+getWorkspace, +replaceWorkspace)
src/renderer/app/store.ts                       (+workspace state)
src/renderer/app/actions.ts                     (+workspace actions)
src/renderer/App.tsx                            (workspace persistence, commands, shell)
src/renderer/components/workspace/              (new workspace UI components)
src/renderer/styles/app.css                     (tabs, splits, resize handles)

tests/workspace-schema.test.ts                  (new)
tests/workspace-model.test.ts                   (new)
tests/workspace-store.test.ts                   (new)
tests/validate.test.ts                          (+workspace validator tests)
```

## Workspace schema

```ts
interface WorkspaceState {
  schemaVersion: number;
  activePaneId: string;
  root: WorkspaceNode;
  panes: Record<string, WorkspacePane>;
}

type WorkspaceNode =
  | { type: 'pane'; paneId: string }
  | {
      type: 'split';
      id: string;
      direction: 'horizontal' | 'vertical';
      ratio: number;
      first: WorkspaceNode;
      second: WorkspaceNode;
    };

interface WorkspacePane {
  id: string;
  activeTabId: string | null;
  tabs: WorkspaceTab[];
  history: WorkspaceHistory;
  linkedGroupId?: string | null;
}
```

## New IPC and preload methods

- `getWorkspace(): Promise<WorkspaceState>`
- `replaceWorkspace(workspace: WorkspaceState): Promise<WorkspaceState>`

Both are typed in `src/shared/ipc-contract.ts`, exposed by preload, handled in
main, and validated before writing. The renderer still receives no raw
filesystem, path, or directory access.

## Quality gates

| Gate | Status | Command |
| ---- | :----: | ------- |
| Typecheck, lint, format, unit tests | Passed | `npm run check` |
| Build | Passed | `npm run build` |
| E2E smoke | Passed | `npm run test:e2e` |
| Dev boot / renderer console | Passed | `npm run dev` |

## Deferred items

- Full drag-and-drop tab reordering.
- Complex docking and arbitrary drop zones.
- Full linked-pane groups.
- Workspace templates.
- Multi-window support.
- Properties/Bases, Canvas, plugins, sync, publish, and URI scheme.
- Keyboard shortcut rebinding for workspace commands.

## Manual checks

1. Open a vault and open several notes from explorer, search, backlinks, and
   quick switcher. Confirm they create or select tabs.
2. Select and close tabs. Confirm the editor, preview, breadcrumbs, and right
   panes follow the active tab.
3. Use the command palette to split right and split down.
4. Resize panes and confirm handles clamp to usable sizes.
5. Close a pane and confirm remaining panes/tabs stay usable.
6. Use command palette history commands: Go back in pane and Go forward in pane.
7. Restart or reopen the vault and confirm workspace tabs/splits restore.
8. Delete a note outside the app, reopen the vault, and confirm restore skips it
   without renderer errors.
9. Confirm `.obsidian-replica/workspace.json` exists after workspace changes.
10. Confirm DevTools shows no red app renderer runtime errors.

## Milestone links

- Previous: [[MILESTONE-5-PLAN]]
- Next: [[MILESTONE-6A-PLAN]]
- Plan: [[MILESTONE-5-PLAN]]
