# Milestone 4.5 Plan — File Explorer Upgrades

Milestone 4.5 finishes the file-explorer work that was intentionally deferred
from M2's "safe slice": drag-and-drop, real sort modes, richer reveal,
context menus, duplicate, and move-to-folder, with safe index updates and
conflict handling. It must not rewrite the architecture, not widen renderer
filesystem access, and not pull in any Milestone 5+ feature.

## 1. Current state

### What the File Explorer already does (M1 → M4)

- `src/renderer/components/FileExplorer.tsx` renders the folders-first,
  name-sorted tree returned by `VaultService.listEntries()`.
- Create / rename / delete of notes and folders via `window.prompt`,
  `window.confirm`, and the existing `createPath`, `renamePath`, `deletePath`
  IPC methods.
- Expansion state is controlled by `App.tsx` and persisted in
  `settings.expandedFolders` (schema v2+).
- "Reveal current file" exists: a toolbar button (⊙) and the
  `file.reveal` command in the M3 command palette. App expands every ancestor,
  bumps a `revealPath` ref, and FileExplorer scrolls the row into view.
- M4 added settings flags but no explorer-facing change yet; `featureBreadcrumbs`
  hides the breadcrumb row above the editor.
- `settings.fileSort: 'name' | 'modified' | 'created'` is already persisted and
  validated — only `'name'` is wired today.

### Existing IPC / preload methods available

| Channel | Used today | Reusable for M4.5 |
|---|---|---|
| `vault:list` (`listEntries`) | Returns the full tree | Yes — extend to honour `fileSort` |
| `path:create` (`createPath`) | Create file or folder | Yes — used by duplicate flow's "new note here" |
| `path:rename` (`renamePath`) | Rename (single segment) | Yes — also covers cross-folder moves; full index rebuild already wired |
| `path:delete` (`deletePath`) | Recursive delete | Yes — used by context-menu delete |
| `note:read` / `note:write` | Read/write file content | Yes — used by file-duplicate fallback path |
| `settings:get` / `settings:update` | Read/write settings | Yes — sort mode, expandedFolders |

### What needs to be extended or added

- `VaultService.renamePath` already exists; it must reject **target exists** and
  **target inside source** explicitly (today it would happily clobber on some
  platforms because `fs.rename` semantics vary, and it does no
  "move into itself" check).
- `VaultService` gains **two new operations**:
  - `duplicatePath(path)` — recursively copies a file or folder, choosing a
    unique destination name on the server.
  - `suggestUniquePath(path)` — pure helper returning the next collision-free
    name (e.g. `Foo.md` → `Foo (1).md`) so the conflict dialog can preview it
    before the user commits.
- Tree carries `mtime` and `ctime` so the renderer can sort by them.
- `core/path/vault-path.ts` gains small pure helpers: `isAncestorOrSelf` and a
  `joinUniqueName` that yields collision-free names.
- Watcher gains an optional "burst" mode (`ignoreUntil(path, ms)` or a brief
  `pause()`) so a multi-file copy or folder rename does not flood the indexer
  with descendant events.
- `FileExplorer.tsx` is split into a few smaller files to stay maintainable.

## 2. Proposed UX

### Drag behavior

- Any file or folder row is draggable (HTML5 drag-and-drop, not a custom
  pointer library — the existing CSP allows it, and accessibility falls back
  to the context-menu "Move to folder…" path).
- The dragged item's path is set as `text/x-replica-path` on the dataTransfer.
  We never use `text/plain` so a stray drop on an external app does nothing
  useful.
- `effectAllowed: 'move'`. Cursor shows a "move" icon over valid targets and
  "no-drop" over invalid ones.
- Multi-select is **deferred**: M4.5 only supports single-item drag.

### Drop targets

- **Folders**: dropping highlights the folder row; on drop, moves the source
  inside that folder.
- **Vault root**: an explicit "(vault root)" drop zone above the tree, so a
  user can move an item to the root without finding a folder.
- **Files**: not a drop target. (Reordering siblings — a manual sort — is
  deferred. We will lean on the sort selector for ordering.)
- **Invalid targets**: a folder cannot accept a drop from itself or any of its
  descendants; we mark the row as invalid and refuse the drop.
- **Same parent**: drop on the source's own parent is a no-op (no rename).

### Folder expand on hover

- After ~600 ms of hover over a closed folder during a drag, it auto-expands.
  Cancels when the cursor leaves before the timer fires. This is the standard
  "spring-loaded folder" pattern and is genuinely useful for nested moves.

### Context menu actions

Right-click on a file:
- Open
- Reveal in explorer (scrolls into view; useful when the row is off-screen)
- Rename…
- Duplicate
- Move to folder…
- Delete

Right-click on a folder:
- New note here
- New folder here
- Reveal in explorer
- Rename…
- Duplicate (recursive copy)
- Move to folder…
- Delete

Right-click in empty space (or the "(vault root)" header):
- New note (at root)
- New folder (at root)
- Paste (deferred — see §8)

Keyboard:
- `Menu` key (Windows) and `Shift+F10` open the context menu on the focused row.
- Arrow keys move the selection in the tree; Enter opens; Space toggles a
  folder. (Today the tree is mouse-driven only; M4.5 lands minimal keyboard
  nav so the context menu is reachable without a mouse.)

### Duplicate flow

1. User picks **Duplicate** from the context menu (or palette command
   `file.duplicate`).
2. Server reads the source, recursively copies into the same parent under a
   collision-free name (`Foo.md` → `Foo (1).md`; `Notes` → `Notes (1)`),
   chosen by `suggestUniquePath`.
3. Server returns the new path. UI selects + opens it (for a file) or reveals
   it (for a folder).

### Move-to-folder flow

1. User picks **Move to folder…** (context menu or palette command
   `file.moveToFolder`).
2. A small modal picker — built on the same Palette primitive as the M3
   quick switcher — lists every folder (and `(vault root)`).
3. Typing fuzzy-filters folders (reuse `core/fuzzy/score.ts`).
4. Enter or click commits. If the destination has a conflicting name, the
   conflict dialog appears (next section).

### Conflict dialog / rename suggestion

When a move/rename/duplicate would land on an existing path:

- A small dialog appears with: the existing path, the suggested alternate name
  from `suggestUniquePath`, and three actions:
  - **Use suggested name** — commits to the suggested path. Primary action.
  - **Cancel** — abort.
  - **Choose another name…** — switches to an inline text input pre-filled
    with the suggestion; commit on Enter.
- **Overwrite is intentionally not offered in M4.5**: destructive enough to
  warrant its own design pass, and a user who wants to overwrite can delete
  first. We document the deferral.

### Sort selector

- A small dropdown in the explorer toolbar with: Name, Last modified, Created.
- Choice persists immediately via `updateSettings({ fileSort })`.
- Sort is applied **within each folder**; folders-first is preserved. (Spec
  said "by name / modified / created" — directionality is not in scope.)
- Default sort direction:
  - Name → ascending (locale-aware, case-insensitive).
  - Last modified → newest first.
  - Created → newest first.
- Direction toggle is **deferred** — see §8.

### Reveal current file

- Palette command `file.reveal` (M3) stays.
- Context menu on the breadcrumb's file segment now also reveals.
- "Reveal in explorer" entries added to context menus for any non-root entry
  (useful when the same file appears in search results that scroll the tree
  out of view).
- New palette command `file.revealFolder` reveals the active note's folder
  (expands ancestors, scrolls the folder row into view, but does not change
  the active note).

## 3. Technical design

### Renderer components affected

```
src/renderer/components/
  FileExplorer.tsx                  (split — orchestrator only)
  explorer/
    ExplorerToolbar.tsx             (new — sort selector + new note/folder)
    TreeNode.tsx                    (new — extracted, handles dnd + ctx menu)
    DropZone.tsx                    (new — root drop zone + folder hover-expand)
    ContextMenu.tsx                 (new — small portal-based menu)
    MoveToFolderPicker.tsx          (new — Palette-based picker)
    ConflictDialog.tsx              (new — "use suggested name" prompt)
    drag-types.ts                   (new — DRAG_MIME constant + helpers)
    sort.ts                         (new — pure entry-sort fn)
```

The current `FileExplorer.tsx` becomes the orchestrator (props, refs, drag
state) and delegates rendering to `TreeNode`. Helpers are pure and unit-testable.

### Preload API additions

`ReplicaApi` gains two methods, both reading vault state already covered by
the existing handlers (no new filesystem capability for the renderer):

```ts
// src/shared/ipc-contract.ts
duplicatePath(path: string): Promise<string>;          // returns the new path
suggestUniquePath(desired: string): Promise<string>;   // returns a non-conflicting path
```

Channels:

```ts
pathDuplicate:       'path:duplicate'
pathSuggestUnique:   'path:suggestUnique'
```

`renamePath` stays — we use it for moves too. The renderer can compute the
move target (`<targetFolder>/<sourceBase>`) and call `renamePath(from, to)`.

### Main process changes

- `VaultService.duplicatePath(path): Promise<string>` — recursively copies a
  file or folder into the same parent. Calls `suggestUniquePath` first, then
  `VaultFs.copy` (new method). Re-indexes the copied tree before resolving.
- `VaultService.suggestUniquePath(desired): Promise<string>` — async because
  it needs `fs.exists`. Pure logic in core, file-existence check in service.
- `VaultService.renamePath` adds three pre-checks before calling `VaultFs.rename`:
  1. `isAncestorOrSelf(from, to)` → reject `"Cannot move a folder into itself."`
  2. `await fs.exists(to)` → reject `"Target already exists."` (the renderer
     handles this by opening the conflict dialog).
  3. `from === to` (after normalisation) → no-op return.
- `VaultService.listEntries(sort)` — sorting is applied server-side using the
  current settings. We attach `mtime` and `ctime` to each `VaultEntry` so the
  tree can be re-sorted in memory after a refresh without restatting.
- `VaultFs` gains:
  - `copy(fromRel, toRel)` — recursive copy of file or folder with
    defence-in-depth (`toAbsolute` both ends).
  - `listTree({ withStats: true })` overload that includes `mtime`/`ctime`.
- `VaultWatcher.suspend()` / `.resume()` — bracket multi-file ops (folder copy,
  folder move) so we don't flood the indexer with descendant events that race
  the planned rebuild.

### Core / path-helper additions

```ts
// src/core/path/vault-path.ts (additions)
isAncestorOrSelf(ancestor: string, descendant: string): boolean
suggestUniqueName(desired: string, exists: (rel: string) => boolean): string
```

`isAncestorOrSelf` is the pure check used by `VaultService.renamePath` and the
drop-target validator. `suggestUniqueName` produces the next available name
given a synchronous `exists` predicate; the service wraps it with an async
`fs.exists` lookup so the pure core stays free of fs imports.

### Indexer / watcher updates

- After **renamePath**: keep the existing full `Indexer.rebuild()`. It's
  correct, idempotent, and a folder rename is rare enough that the cost is
  fine. We document an incremental upgrade as a later possibility.
- After **duplicatePath**:
  - For a single-file duplicate: `indexer.reindexFile(newPath)`.
  - For a folder duplicate: `indexer.rebuild()`. (Same trade-off as rename.)
- After **deletePath**: existing `rebuild()` stays.
- Watcher: wrap the multi-file ops in `watcher.suspend()` / `watcher.resume()`
  so external events generated by our own copy/rename don't trigger a
  second rebuild. The `ignore(path)` mechanism stays for single-file writes.

### Settings schema changes

None required for the in-scope features:

- `expandedFolders` already exists (M2).
- `fileSort` already exists and is validated (M2 + M4 validator).

**Possible non-blocking refinement** (still v3, additive defaults — *not in
the core scope*): document but do not add unless the renderer needs it.

### Preventing invalid states

| Threat | Defence |
|---|---|
| Path traversal in move target | `normalizeVaultPath` in the IPC validator; `VaultFs.toAbsolute` re-anchors at the fs layer. |
| Moving a folder into itself or a descendant | `isAncestorOrSelf` in `VaultService.renamePath`. Drop-target validator in the renderer also blocks the UI so the user never gets that far. |
| Overwriting an existing file or folder | `VaultService.renamePath` and `duplicatePath` check `fs.exists(to)` first and throw a typed error; the renderer offers the conflict dialog. Overwrite is **not** offered. |
| Race against a concurrent external write | The watcher is `suspend()`-ed for the duration of the op; on resume any external events are processed normally. |
| Cross-platform path quirks (case-only renames on Windows / macOS HFS) | A case-only rename is treated as a real rename via a two-step `from → tmp → to` if `to.toLowerCase() === from.toLowerCase()` but `to !== from`. Implemented in `VaultFs.rename`. |
| Absurd payload sizes (very long target paths) | New validator `asRelativePath` caps length and uses `normalizeVaultPath`. |
| Hidden config-folder targets | `vault-fs.HIDDEN` already filters the tree; we add a guard in `renamePath`/`duplicatePath` to reject any target that lands inside `.obsidian-replica/`. |

## 4. Acceptance criteria

| Feature | How I know it works |
|---|---|
| Sort by name | Files within each folder appear alphabetically (locale-aware). Setting persists across restart. |
| Sort by modified | Files within each folder appear newest-first by `mtime`. Editing a file moves it to the top after the next refresh. |
| Sort by created | Files appear newest-first by `ctime`. New files appear at the top. |
| Reveal from palette | "Reveal current file" expands ancestors and scrolls the row into view. "Reveal current folder" does the same for the folder. |
| Reveal from context menu | Right-clicking a file row, picking "Reveal in explorer," scrolls and highlights it. |
| Right-click context menu (file) | Open, Reveal, Rename, Duplicate, Move to folder, Delete all execute and update the tree. |
| Right-click context menu (folder) | New note here, New folder here, Reveal, Rename, Duplicate, Move to folder, Delete. |
| Right-click in empty space | New note (root) and New folder (root). |
| Keyboard context menu | Pressing `Shift+F10` (or the Menu key) on a focused row opens the same menu. |
| Duplicate (file) | Creates `<name> (1).md`; if that exists, `(2)`, etc. Original file is unchanged. Index reflects the new note. New note becomes active. |
| Duplicate (folder) | Recursively copies into `<name> (1)` with all descendants. Index rebuild reflects the copies. |
| Move to folder | Picker lists all folders + vault root; Enter commits; the source moves; the index rebuilds; the source's previous expansion state is cleared and the new ancestors are expanded. |
| Drag a file onto a folder | The file moves into the folder. The dropped row becomes the selected item. |
| Drag a folder onto another folder | The folder (with descendants) moves. Existing expansion state for the moved folder's children is preserved if practical, else cleared. |
| Drag onto vault root drop zone | Source moves to the vault root. |
| Drag onto a descendant | Drop is refused; UI shows a "no-drop" indicator. |
| Drag onto the source's own parent | No-op (no rename issued). |
| Hover-expand during drag | After ~600 ms over a closed folder, it expands. Moving away cancels. |
| Conflict on rename/move/duplicate | Conflict dialog offers the suggested name and Cancel. No silent overwrite. |
| Move into itself or descendant | IPC rejects with a clear error; UI never permitted it. |
| Invalid relative paths | IPC rejects (traversal, absolute, drive letter). Tested. |
| Settings persistence | `fileSort` and `expandedFolders` survive a restart. Existing v2/v3 settings still load. |
| Watcher does not double-trigger | Toggling sort, moving a file, duplicating a folder do not cause a flood of reindex events (verified by a watcher test). |
| Renderer filesystem boundary | No new direct fs calls in the renderer; everything goes through `window.replica.*` and the validated handlers. |

## 5. Tests needed

All in `tests/`, using the existing Vitest + temp-folder fixtures (see
`tests/indexer.test.ts`, `tests/watcher.test.ts`).

### Pure-core

- `tests/vault-path.test.ts` — add cases for:
  - `isAncestorOrSelf` over identical paths, parent vs child, sibling, root,
    Windows-style backslash inputs.
  - `suggestUniqueName` over no-collision, single-collision, multi-collision,
    folder-style names without extension, names with multiple dots
    (`Notes/Foo.bar.md` → `Notes/Foo.bar (1).md`).

### Service / IPC

- `tests/explorer-ops.test.ts` (new) over a real temp vault:
  - **Safe path moves** — moving a file across folders updates the tree;
    index reflects the new path.
  - **Move folder** — moving a folder rewrites the tree; descendant notes
    re-index at their new paths; their tags/links still resolve.
  - **Reject move-into-self** — moving `Notes` into `Notes/Sub` throws
    `"Cannot move a folder into itself."`
  - **Reject path traversal** — `..` segments and absolute paths in `to` are
    rejected by `asRelativePath`.
  - **Conflict on rename** — moving onto an existing path throws
    `"Target already exists."`; `suggestUniquePath` returns the next free
    name.
  - **Duplicate file** — produces `Foo (1).md`, returns its path, index has
    the new note.
  - **Duplicate file twice** — second duplicate yields `Foo (2).md`.
  - **Duplicate folder** — recursively copies into `Notes (1)`, descendants
    re-index.
  - **Hidden folder protection** — refusing to move/duplicate into
    `.obsidian-replica/`.

### Sorting

- `tests/sort.test.ts` (new) — pure `sortEntries(entries, mode)`:
  - Name: locale-aware, folders-first.
  - Modified: newest mtime first within a folder.
  - Created: newest ctime first within a folder.
  - Stable secondary order (path) on tie.

### Watcher

- `tests/watcher.test.ts` — extend with:
  - `suspend()` blocks events for the duration; `resume()` re-enables.
  - After a folder rename done while suspended, the rebuild is invoked **once**
    rather than once per descendant event.

### Renderer-side (pure)

- `tests/drag.test.ts` (new) — pure helpers from `drag-types.ts`:
  - `validDropTarget(source, target)` rejects descendants, same-parent, file
    targets.
  - `computeMoveTo(source, targetFolder)` produces the expected joined path.
- `tests/context-menu.test.ts` (new) — pure builder that, given an entry kind,
  returns the menu items in order.

E2E coverage is **not** added in this milestone — Playwright keyboard/drag
simulation against the built Electron app stays out of scope for the smoke
suite. Manual verification is enumerated in the acceptance criteria.

## 6. Risks

- **Drag-and-drop edge cases**
  - Cursor lost in cross-window drags. *Mitigation*: rely on
    `dragend` to always clear hover state; auto-cancel on `Escape`.
  - Bubbling between nested folders. *Mitigation*: each row stops propagation
    on `dragover`/`drop`; the root drop zone listens only when no folder
    accepts the event.
  - Sticky hover state after a drop. *Mitigation*: clear all `is-drag-over`
    classes in a single state reset on `dragleave`/`drop`/`dragend`.

- **Windows path behavior**
  - Case-only renames (`Foo` ↔ `foo`) fail on case-insensitive volumes.
    *Mitigation*: two-step rename via a temp name in `VaultFs.rename`.
  - Backslash inputs in dragged paths or external pastes. *Mitigation*:
    `normalizeVaultPath` already accepts and rewrites `\` to `/`.
  - Path-length limits on Windows MAX_PATH. *Mitigation*: cap the validator at
    a reasonable length (e.g. 1024); document the limit.

- **Watcher double events**
  - A folder move on macOS may fire one event per descendant. *Mitigation*:
    `watcher.suspend()` around the multi-file op; the service does a single
    rebuild and resumes.
  - Self-write echo after duplicate. *Mitigation*: the existing
    `watcher.ignore(path)` is called on every created path inside the op.

- **Index desync**
  - A partial rebuild after a failed copy could leave stale entries.
    *Mitigation*: copy operations are atomic *per file*; on any error, we
    still trigger a `rebuild()` to converge.
  - Cross-operation interleaving (two duplicates at once). *Mitigation*: the
    service runs each op behind a small async mutex (`mutex.runExclusive`)
    until completion.

- **Accidental overwrite**
  - The default is to refuse, not to ask. *Mitigation*: the conflict dialog
    never offers overwrite; "overwrite" is an explicit later feature.

- **Large folders**
  - Tens of thousands of files would slow tree generation. *Mitigation*:
    `VaultFs.listTree` is already O(n); we keep one `fs.stat` per entry in the
    sort variants. Document the practical limit (a few thousand files) and
    flag worker-thread indexing as the M10 fix already on the roadmap.

- **Keyboard accessibility**
  - Today the tree is mouse-driven. *Mitigation*: M4.5 lands minimal arrow-
    key nav + Enter/Space/Menu/F10 handling so the context menu is reachable
    without a mouse. Full WAI-ARIA "Tree" pattern compliance is documented as
    a later refinement.

- **Drag images and platforms**
  - Default browser drag image may be ugly. *Mitigation*: use a small custom
    drag image showing the entry name; tested in dev but left intentionally
    minimal to avoid platform-specific code.

## 7. Recommended implementation order

Each step is shippable on its own; we ship after each subsystem.

1. **Backend safety + ops, behind the existing channels**
   - Add `isAncestorOrSelf` and `suggestUniqueName` to `core/path`.
   - Add `VaultFs.copy` and case-aware `rename`.
   - Add `VaultService.suggestUniquePath` and `duplicatePath`.
   - Pre-checks in `VaultService.renamePath` (target exists, into-self,
     hidden-config target).
   - `VaultWatcher.suspend/resume`.

2. **Tests**
   - `tests/vault-path.test.ts` additions.
   - `tests/explorer-ops.test.ts`.
   - `tests/sort.test.ts`.
   - `tests/watcher.test.ts` additions.

3. **IPC + preload**
   - Add `path:duplicate` and `path:suggestUnique` channels.
   - Add `asRelativePath` validator.
   - `ReplicaApi.duplicatePath` / `suggestUniquePath`.

4. **Renderer: context menu** (read-only first, then mutating actions)
   - Split `FileExplorer.tsx` into the orchestrator + `TreeNode` +
     `ExplorerToolbar` + `ContextMenu`.
   - Wire Open / Reveal / Rename / Delete / Duplicate / Move to folder /
     New here.
   - Keyboard hooks: Menu / Shift+F10 / arrow keys / Enter / Space.

5. **Renderer: sort selector**
   - Toolbar dropdown writes `fileSort` via `updateSettings`.
   - Pure `sortEntries` runs over the tree from `listEntries`.

6. **Renderer: reveal improvements**
   - `file.revealFolder` palette command.
   - "Reveal in explorer" context menu items.
   - Make the breadcrumb's file segment clickable to reveal.

7. **Renderer: drag-and-drop** (last)
   - `drag-types.ts` helpers + tests.
   - Hover-expand timer.
   - Conflict dialog.
   - Move-to-folder picker (uses the existing Palette primitive).

8. **Docs + gates**
   - `MILESTONE-4.5.md` with the same shape as `MILESTONE-4.md`.
   - Update `README.md` and `ROADMAP.md`.
   - `npm run check`, `npm run build`, `npm run test:e2e`.
   - Manual verification of the acceptance criteria.

## 8. Deferred items (explicitly not in M4.5)

- **Overwrite on conflict.** Move/duplicate refuses to clobber. A future
  milestone can offer overwrite with a confirm step and a backup file.
- **Multi-select drag.** Single-item drag only.
- **Sort direction toggle.** Each mode has a single sensible default; a
  direction toggle is a later refinement.
- **Manual sibling reordering.** A "drag a file onto another file to reorder"
  affordance would require a new persisted ordering map. Deferred.
- **Link rewriting on move/rename.** When a folder moves, path-style wikilinks
  like `[[Notes/Foo]]` can break. Today name-based and alias resolution still
  works for unique names. A real "update links" pass needs a vault-wide scan
  and confirmation UX; it lives in a later milestone.
- **Trash / undo.** Delete is still permanent. A vault-local trash folder
  and an undo stack are valuable but bigger than this milestone.
- **Paste from clipboard.** Cut/copy/paste of explorer entries is not in
  scope. Drag and the context menu cover the same needs.
- **Full WAI-ARIA Tree compliance.** Minimal keyboard nav lands; a full
  screen-reader pass is M10 accessibility work.
- **Multi-root / workspaces, Canvas, Bases, plugins, sync, publish, URI
  scheme.** Out of scope per the milestone rules.

---

**Readiness.** This plan is structured for incremental landings, keeps the
boundary (renderer → preload → validated IPC → vault service → fs) intact,
adds only the IPC surface needed for duplicate + suggestion, leans on
existing rename for moves, and lists per-feature acceptance criteria, tests,
and risks. It is ready to drive the implementation when you are.

## Milestone links

- Previous: [[MILESTONE-4]]
- Next: [[MILESTONE-4.5]]
- Implementation: [[MILESTONE-4.5]]
