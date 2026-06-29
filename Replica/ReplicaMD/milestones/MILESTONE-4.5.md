# Milestone 4.5 — File Explorer Upgrades

Finishes the file-explorer work deferred from M2's "safe slice": drag-and-drop,
sort modes, richer reveal, full context menus, duplicate, move-to-folder, with
safe index updates and conflict handling. No architecture changes, no new
filesystem capability for the renderer, no Milestone 5+ scope.

## Delivered scope

### Backend safety + ops

| Requirement | Status | Where |
|-------------|:------:|-------|
| `isAncestorOrSelf` pure helper | ✅ | `src/core/path/vault-path.ts` |
| `suggestUniqueName` pure helper (handles extensions, multi-dot, re-bumping `(N)`) | ✅ | `src/core/path/vault-path.ts` |
| Hardened `renamePath` (target-exists, into-self, hidden config, normalised no-op) | ✅ | `src/main/vault/vault-service.ts` |
| Case-aware `fs.rename` (two-step on case-only renames) | ✅ | `src/main/vault/vault-fs.ts` |
| Recursive `VaultFs.copy` with `errorOnExist` | ✅ | `src/main/vault/vault-fs.ts` |
| `VaultService.duplicatePath` (returns the new path) | ✅ | `src/main/vault/vault-service.ts` |
| `VaultService.suggestUniquePath` (async over the pure helper) | ✅ | `src/main/vault/vault-service.ts` |
| Hidden-config-folder rejection at validator + service | ✅ | `src/main/ipc/validate.ts`, `src/main/vault/vault-service.ts` |
| Watcher `suspend()` / `resume()` (reference-counted) | ✅ | `src/main/indexer/watcher.ts` |

### IPC + preload

| Item | Status | Notes |
|------|:------:|-------|
| `path:duplicate` channel + `ReplicaApi.duplicatePath` | ✅ | Returns the new vault-relative path. |
| `path:suggestUnique` channel + `ReplicaApi.suggestUniquePath` | ✅ | Used by the conflict dialog and "New note" path. |
| Strict `asRelativePath` validator | ✅ | Rejects empty, NUL bytes, absolute paths, drive letters, `..` traversal, overlong inputs, hidden-config targets. |
| Existing `createPath` / `renamePath` / `deletePath` switched to `asRelativePath` | ✅ | Single normalised path reaches the service. |
| Sender check on every handler | ✅ | Unchanged from M1 baseline. |

### Sorting

- `VaultEntry` carries `mtime` and `ctime` (folder values reflect newest child).
- Pure `core/explorer/sort.ts` applies the user's `settings.fileSort`, keeping
  folders before files in every mode.
- Defaults: name = ascending locale-aware; modified = newest first; created =
  newest first (falls back to `mtime` when `birthtime` is unreliable, e.g.
  Linux).
- Sort selector lives in `ExplorerToolbar`; choice persists via `updateSettings`.

### Context menu + keyboard nav

- Right-click any file or folder → typed context menu (Open / Reveal / Rename /
  Duplicate / Move to folder / Delete; folders also have New note / New folder
  here).
- Right-click the empty tree area → root menu (New note / New folder).
- `Shift+F10` and the `ContextMenu` key open the same menu on the focused row.
- Arrow keys move focus; `ArrowRight`/`ArrowLeft` expand / collapse folders;
  `Enter` opens files or toggles folders; `Space` toggles a folder; `F2`
  renames; `Delete` deletes.
- Esc closes the menu, the move picker, the conflict dialog, or cancels an
  in-flight drag.

### Move-to-folder + conflict handling

- `MoveToFolderPicker` is built on the same Palette primitive as the M3 quick
  switcher — fuzzy-filtered, keyboard-navigable, lists every folder plus a
  `(vault root)` row, hides the source's descendants.
- `ConflictDialog` appears whenever a rename/move would land on an existing
  path: shows the suggested unique name from the main process, lets the user
  commit it as-is, type a different one, or Cancel. **No overwrite option.**
- On a follow-up collision, the dialog re-opens with a fresh suggestion.

### Reveal improvements

- Existing `file.reveal` palette command stays.
- New `file.revealFolder` palette command reveals the active note's folder
  (expands ancestors and scrolls the folder row into view) without changing
  the active note.
- "Reveal in explorer" entries on the file and folder context menus.
- New `file.duplicate` palette command duplicates the active note from the
  keyboard.

### Drag-and-drop

- Single-item HTML5 drag-and-drop, using custom MIME `text/x-replica-path`.
- Drop targets: any folder + an explicit "(vault root)" zone above the tree.
  Files are never drop targets.
- Validation lives in pure `validDropTarget` (refuses self, descendants, same
  parent, and file targets). Tested in isolation.
- Hover-expand: dragging onto a closed folder for ~600 ms expands it.
- Conflict on drop reuses the same `ConflictDialog`.
- Drop state is cleared on `dragend`, `drop`, or `Esc`.

## Changed files

```
src/core/path/vault-path.ts                          (+isAncestorOrSelf, +suggestUniqueName)
src/core/explorer/sort.ts                            (NEW — pure sort)
src/main/vault/vault-fs.ts                           (+copy, case-aware rename, mtime/ctime stat)
src/main/vault/vault-service.ts                      (hardened rename, +duplicate, +suggestUnique)
src/main/indexer/watcher.ts                          (+suspend/resume, reference-counted)
src/main/ipc/validate.ts                             (+asRelativePath)
src/main/ipc/register-ipc.ts                         (+path:duplicate, +path:suggestUnique handlers)
src/preload/preload.ts                               (+duplicatePath, +suggestUniquePath)
src/shared/domain.ts                                 (VaultEntry gains mtime/ctime)
src/shared/ipc-contract.ts                           (+channels, +ReplicaApi methods)

src/renderer/components/FileExplorer.tsx             (orchestrator only; mutation logic + DnD)
src/renderer/components/explorer/                    (NEW dir)
  ExplorerToolbar.tsx                                (NEW — sort selector + buttons)
  TreeNode.tsx                                       (NEW — row rendering + DnD plumbing)
  ContextMenu.tsx                                    (NEW — portal-style menu)
  MoveToFolderPicker.tsx                             (NEW — Palette-based picker)
  ConflictDialog.tsx                                 (NEW — rename-on-conflict UI)
  drag-types.ts                                      (NEW — MIME + pure validators)
  context-menu-model.ts                              (NEW — pure menu builder)
src/renderer/App.tsx                                 (+file.revealFolder, +file.duplicate, passes settings to FileExplorer)
src/renderer/styles/app.css                          (explorer + context menu + conflict dialog)

tests/vault-path.test.ts                             (+9 cases for isAncestorOrSelf, suggestUniqueName)
tests/explorer-ops.test.ts                           (NEW — 17 service cases)
tests/sort.test.ts                                   (NEW — 8 sort cases)
tests/drag.test.ts                                   (NEW — 11 drag helper cases)
tests/context-menu.test.ts                           (NEW — 4 menu builder cases)
tests/validate.test.ts                               (+10 cases for asRelativePath)
tests/watcher.test.ts                                (+2 cases for suspend/resume)
```

## New IPC methods

- `duplicatePath(path: string): Promise<string>` — recursive copy, server picks
  the collision-free destination, returns the new path. Reindexes one file or
  rebuilds for a folder.
- `suggestUniquePath(desired: string): Promise<string>` — returns the first
  variant of `desired` that does not collide on disk.

Existing channels — `path:create`, `path:rename`, `path:delete` — now validate
paths through `asRelativePath`, which rejects everything from absolute paths
to NUL bytes to hidden-config targets.

## Quality gates

| Gate | Status | Command |
|------|:------:|---------|
| Typecheck (node + web) | ✅ | `npm run typecheck` |
| Lint | ✅ | `npm run lint` |
| Format | ✅ | `npm run format:check` |
| Unit tests (259 pass) | ✅ | `npm test` |
| Build (electron-vite, three targets) | ✅ | `npm run build` |
| E2E smoke (Playwright on built app) | ✅ | `npm run test:e2e` |
| Dev boot probe (no renderer errors) | ✅ | `npm run dev` |

## Deferred items

- **Overwrite-on-conflict.** Refusing to clobber is the default. A later
  milestone can offer overwrite with a confirm step and a backup file.
- **Multi-select drag.** Single-item drag only.
- **Sort direction toggle.** Each mode has a single sensible default.
- **Manual sibling reordering** with a persisted ordering map.
- **Link rewriting on move/rename.** Path-style wikilinks like
  `[[Notes/Foo]]` break when the folder moves; name-based and alias
  resolution still works for unique names. A vault-wide rewrite is a later
  milestone.
- **Trash / undo.** Delete is permanent.
- **Paste from clipboard.** Cut/copy/paste of explorer entries is out of scope.
- **Full WAI-ARIA Tree compliance.** Minimal keyboard nav lands here; a full
  screen-reader pass is M10 accessibility work.
- All M5+ scope (workspace panes, Canvas, Bases, plugins, sync, publish, URI
  scheme).

## Manual checks for you to perform

1. `npm run dev` and open a vault. Confirm the explorer shows the sort
   selector and the "(vault root)" drop zone above the tree.
2. **Sort:** flip the sort selector to Last modified, then Created, then back
   to Name. Confirm each setting persists across a restart.
3. **Context menu — file:** right-click a note row → Open / Reveal / Rename /
   Duplicate / Move to folder / Delete. Confirm each works; Duplicate produces
   `<name> (1).md`.
4. **Context menu — folder:** right-click a folder row → New note here / New
   folder here / Reveal / Rename / Duplicate / Move to folder / Delete.
5. **Empty space:** right-click in empty tree area → New note / New folder at
   root.
6. **Move to folder:** invoke from a file's context menu; type to filter; Enter
   commits. If the target has a collision, the conflict dialog appears.
7. **Conflict dialog:** Cancel, "Use this name", and "Choose another name…"
   should all do exactly what they say. There is intentionally no Overwrite.
8. **Drag-and-drop:**
   - Drag a file into a folder → file moves into the folder.
   - Drag a folder onto another folder → folder (with descendants) moves.
   - Drag onto the "(vault root)" zone → moves to the root.
   - Drag a folder onto itself or a descendant → cursor shows "no drop"; drop
     is refused.
   - Hover over a closed folder for ~600 ms during a drag → it expands.
   - Press Esc mid-drag → drag is cancelled, highlight clears.
9. **Reveal:**
   - "Reveal current file" palette command (or the ⊙ button) expands ancestors
     and scrolls the row into view.
   - "Reveal current note's folder" reveals the folder row without changing
     the active note.
   - "Reveal in explorer" context-menu entries do the same on demand.
10. **Validation:** in DevTools,
    ```js
    await window.replica.renamePath('A.md', '../escape.md');   // throws
    await window.replica.renamePath('A.md', '.obsidian-replica/A.md'); // throws
    await window.replica.duplicatePath('.obsidian-replica/settings.json'); // throws
    await window.replica.renamePath('Folder', 'Folder/Sub');   // throws (into itself)
    ```
11. **No silent overwrite:** with `B.md` already in the vault, calling
    `await window.replica.renamePath('A.md', 'B.md')` should throw
    "Target already exists."
12. **Renderer health:** keep DevTools open while exercising the explorer and
    confirm the app renderer console has no red runtime errors. The known
    `Autofill.enable` / `Autofill.setAddresses` messages are DevTools protocol
    noise, not app renderer errors.

## Acceptance criteria — confirmed

- ✅ `npm run check`, `npm run build`, `npm run test:e2e` all pass.
- ✅ `npm run dev` boots without renderer runtime errors.
- ✅ File/folder duplicate uses unique names; bumps `(N)` on repeats.
- ✅ Move to folder works (via picker + via drag).
- ✅ Drag file/folder to folder works; drag to vault root works.
- ✅ Dragging into self/descendant is refused at the UI and the service.
- ✅ Target conflicts never overwrite; conflict dialog handles them.
- ✅ Sort by name/modified/created works and persists.
- ✅ Reveal current file and reveal current folder commands work.
- ✅ Context menu actions all run.
- ✅ Renderer still has no direct fs access; everything goes through
  `window.replica.*`.
- ✅ IPC validation rejects every invalid path category in the spec.
- ✅ Hidden `.obsidian-replica/` folder cannot be targeted.
- ✅ No Milestone 5+ features added.

## Milestone links

- Previous: [[MILESTONE-4.5-PLAN]]
- Next: [[MILESTONE-5-PLAN]]
- Plan: [[MILESTONE-4.5-PLAN]]
