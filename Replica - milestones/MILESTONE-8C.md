# Milestone 8C - Canvas Basic Editing Interactions

Milestone 8C extends Replica's `.replica-canvas` workspace view from
read-only display (8B) to the first safe set of editing interactions:
selection, add text card, add active note card, edit text card text,
move cards by drag, and delete the selected node or edge. All
persistence still flows through 8A's existing `canvasWrite` preload
method. No new IPC channel was added, the renderer remains
filesystem-free, and the schema is unchanged.

## Delivered Scope

### Pure editing helpers

New file `src/renderer/components/canvas/canvas-edit.ts` exports:

- `addTextNode(canvas, { x, y, text?, width?, height?, id?, now?, random? })`
- `addNoteNode(canvas, { x, y, path, title?, ... })` — returns
  `{ canvas, nodeId: null }` when the path fails
  `normalizeCanvasNotePath` so callers can ignore the bad case.
- `updateTextNodeText(canvas, nodeId, nextText, now?)` — caps text at
  `CANVAS_MAX_TEXT_LENGTH`, no-ops on missing/note id, no-ops on
  unchanged text.
- `moveNode(canvas, nodeId, dx, dy, now?)` — clamps coordinates,
  integer-floors them, no-ops on zero-delta or missing id.
- `deleteNode(canvas, nodeId, now?)` — removes the node and **all**
  incident edges so `CanvasFile` keeps its invariant.
- `deleteEdge(canvas, edgeId, now?)`.
- `selectionAfterDelete(selection, deletedId)`.
- `isDirty(loaded, current)` — structural compare that ignores
  `updatedAt` so two files differing only by timestamp are clean.
- `clampCanvasCoordinate(value)`.
- `generateCanvasNodeId(prefix, canvas, random?, now?)` and
  `generateCanvasEdgeId(canvas, random?, now?)` — collision-safe ids
  matching the shared `SAFE_ID` regex.

Every helper is immutable, side-effect free, and never throws on
missing inputs.

### CanvasPane

`src/renderer/components/canvas/CanvasPane.tsx` was extended to own
the editor state:

- `loaded` snapshot of the canvas as last read/written, used for
  `isDirty` comparisons.
- `selection` — `'none' | 'node' | 'edge'` single selection.
- `editingNodeId` — id of the text node currently in inline edit
  mode, or `null`.
- `saving`, `saveError`, `externalChange` — toolbar state.
- An 800 ms debounced auto-save via `setTimeout`. The explicit `Save`
  button calls the same `runSave('explicit')` path immediately. Both
  paths call `api().canvasWrite(path, normalizeCanvasFile(canvas))`.
- Manual Refresh confirms via `window.confirm` when dirty before
  re-reading.
- External vault `refreshKey` bumps reload silently when not dirty;
  while dirty the toolbar shows "External change — refresh to reload"
  and the user keeps control.
- Keyboard `Backspace` / `Delete` deletes the current selection when
  the canvas surface (not an input/textarea) has focus.
- The pane reads the workspace-wide active path via `useStore` to
  decide whether the "Add active note" button is enabled. No new
  props were threaded through `PaneView` / `SplitView` /
  `WorkspaceShell`.

### CanvasToolbar

`src/renderer/components/canvas/CanvasToolbar.tsx` now renders:

- "Add text card" — always enabled while saving is idle.
- "Add active note" — enabled when a workspace-active Markdown note
  exists and is not this same canvas.
- "Delete" — enabled when something is selected; `aria-label` is
  "Delete selected card / link / nothing selected".
- "Save" — enabled when dirty and not saving.
- "Refresh" — disabled while saving or refreshing.
- Status chip showing "Saving…" / "External change — refresh to
  reload" / "Unsaved changes".
- An inline error row with Retry + Dismiss when `saveError` is set.

### CanvasNodeView

`src/renderer/components/canvas/CanvasNodeView.tsx` was extended for
selection, inline edit, and pointer-drag:

- Click-to-select via `onSelect(nodeId)`.
- Double-click on a text card to enter inline edit mode.
- Inline editor is a `<textarea>` with `maxLength=CANVAS_MAX_TEXT_LENGTH`,
  commits on blur or `Cmd/Ctrl+Enter`, cancels on `Escape`. Plain text
  only, no Markdown parsing, no `dangerouslySetInnerHTML`.
- Pointer-down forwards to the viewport drag handler unless the
  target is a button / input / textarea / `[data-canvas-pointer="off"]`.
- Note-card "Open" button uses `event.stopPropagation()` so opening
  the note doesn't also fire a drag.

### CanvasEdgeView

`src/renderer/components/canvas/CanvasEdgeView.tsx` gained a
`selected` flag, a thicker stroke for selected edges, and a wider
invisible hit line so thin edges remain clickable.

### CanvasViewport

`src/renderer/components/canvas/CanvasViewport.tsx` was extended:

- Renders nodes and edges with their selected state.
- Implements pointer-drag: `pointerdown` on a node captures the
  pointer id, `pointermove`/`pointerup`/`pointercancel` listeners on
  `window` resolve cleanly when the pointer leaves the surface. Drag
  deltas go through `moveNode` (which clamps and integerizes).
- Surface clicks that target the bare surface clear the selection.
- The viewport is still a static `viewBox` — pan/zoom controls remain
  deferred per the 8C plan.

### Renderer boundary

`tests/canvas-renderer-boundary.test.ts` was updated to cover the new
`canvas-edit.ts` helper. The full canvas renderer surface continues
to assert no `fs` / `path` / `electron` / `ipcRenderer` /
`dangerouslySetInnerHTML` imports.

## Constraints respected

- Schema is unchanged. `CanvasFile.schemaVersion` stays at `1`.
- No new IPC channel, no new preload method. Every save uses
  `api().canvasWrite(path, canvas)`.
- Renderer remains filesystem-free.
- No plugin loader, no scripting, no macros, no marketplace.
- No media / embed / arbitrary-HTML cards.
- No Obsidian Canvas import/export compatibility.
- No URI / sync / publish hooks.
- No new property write path.
- Pre-write `normalizeCanvasFile` keeps the IPC validator from ever
  rejecting our own output.

## Changed files

```text
src/renderer/components/canvas/canvas-edit.ts        (new)
src/renderer/components/canvas/CanvasPane.tsx        (extended)
src/renderer/components/canvas/CanvasToolbar.tsx     (extended)
src/renderer/components/canvas/CanvasViewport.tsx    (extended)
src/renderer/components/canvas/CanvasNodeView.tsx    (extended)
src/renderer/components/canvas/CanvasEdgeView.tsx    (extended)
src/renderer/styles/app.css                          (editing styles)

tests/canvas-edit.test.ts                            (new — 35 cases)
tests/canvas-renderer-boundary.test.ts               (covers canvas-edit.ts)

MILESTONE-8C.md                                      (new)
README.md                                            (Canvas editing paragraph)
ROADMAP.md                                           (M8C status + deferrals)
ARCHITECTURE.md                                      (Canvas editing note)
```

## Save model

1. The user makes an edit.
2. The pure helper produces a new `CanvasFile`.
3. `CanvasPane` swaps the in-memory canvas and resets the 800 ms
   debounce timer.
4. If the user keeps editing, the timer keeps resetting — there is no
   thrash.
5. When the timer fires (or the user clicks Save), `runSave` calls
   `api().canvasWrite(path, normalizeCanvasFile(canvas))`.
6. On success, the returned canvas becomes the new `loaded` snapshot
   and `isDirty` returns false until the next edit.
7. On failure, the in-memory canvas is preserved; the toolbar shows
   the error with Retry + Dismiss buttons. Debounced retry is not
   automatic — the next edit will schedule a fresh save.
8. Switching paths or unmounting cancels the timer so we never write
   the wrong file.

## Selection model

- One node id, one edge id, or `'none'`. Click background to clear.
- Selected nodes get an outline; selected edges get a thicker stroke.
- `Backspace` / `Delete` deletes the current selection when the
  canvas surface (not an input) has focus.
- `Escape` exits inline text edit (and the existing global Escape
  semantics elsewhere in the app are unchanged).

## Tests added or updated

### `tests/canvas-edit.test.ts` (new, 35 cases)

- `clampCanvasCoordinate` — positive/negative overflow, integer-floor,
  non-finite values.
- `generateCanvasNodeId` — `SAFE_ID` shape, collision avoidance.
- `addTextNode` — appends new text node with default size and clamped
  coordinates; caps starter text at `CANVAS_MAX_TEXT_LENGTH`.
- `addNoteNode` — safe path appended, `.md` extension added when
  missing, unsafe path returns input unchanged with `nodeId: null`.
- `updateTextNodeText` — replaces text, no-ops on missing id, no-ops
  on note id, truncates oversize text, preserves literal `<script>`
  as plain text, no-ops on unchanged text.
- `moveNode` — translates within bounds, clamps on each axis, no-ops
  on missing id, no-ops on zero-delta, does not mutate the original.
- `deleteNode` — removes node + every incident edge, no-ops on
  missing id.
- `deleteEdge` — removes only the edge, no-ops on missing id.
- `selectionAfterDelete` — clears matching selection, preserves
  non-matching, passes through `'none'`.
- `isDirty` — false for same reference, false for two equal files
  differing only by `updatedAt`, true for text/move/added node/added
  edge/removed edge/title/viewport changes.

### `tests/canvas-renderer-boundary.test.ts` (extended)

Adds `canvas-edit.ts` to the static-grep list that asserts no
filesystem / Node / Electron / raw IPC imports and no
`dangerouslySetInnerHTML` usage.

Suite total: **600 unit tests across 44 files**.

## Quality gates

- `npm run check` — **pass** (typecheck + lint + prettier + 600
  tests).
- `npm run build` — **pass** (main + preload + renderer bundles).
- `npm run test:e2e` — **pass** (1/1 Electron smoke).
- `npm run dev` — **pass** (boots cleanly; only the well-known
  DevTools `Autofill.enable` noise).

## Deferred items (out of scope for 8C)

- Connect-via-handles (drawing new edges by dragging from a node).
- Resize nodes.
- Zoom and pan controls beyond persisting the loaded viewport.
- Multi-select, copy / paste.
- Undo / redo (no transaction log).
- Groups, backgrounds, frames.
- Media / embed cards — images, PDFs, audio, video, web previews.
- Obsidian Canvas import / export compatibility.
- Canvas-specific command-palette entries.
- Cross-canvas backlinks, canvas-aware search, "open this canvas
  from a note" affordances.
- Plugins, scripting, marketplace, sync, publish, URI scheme.
- Any schema migration.

## Manual checks you should perform

1. Open a `.replica-canvas` file. Click "Add text card" — a new text
   card appears near the viewport centre and enters inline edit.
   Type, press `Cmd/Ctrl+Enter` (or blur), wait ~1 s, confirm the
   "Unsaved changes" chip disappears and the file is saved.
2. Open a Markdown note in another pane. Switch back to the canvas
   and confirm "Add active note" is enabled; click it — a note card
   referencing that path appears.
3. With a note card selected, click "Add active note" — the disabled
   state is correct when the workspace-active path is the canvas
   itself.
4. Double-click a text card — the inline editor appears. Type
   `<script>alert(1)</script>`, commit. The literal characters
   render as plain text; nothing executes.
5. Drag a card. The position is clamped to the canvas range and
   persists after the 800 ms debounce.
6. Click an edge — it highlights. Press `Delete` — the edge
   disappears. Click a node — it highlights. Press `Backspace` — the
   node *and* its incident edges disappear.
7. Click the Save button while clean — it should be disabled. Make
   an edit and click Save before the debounce — it should fire
   immediately.
8. Edit the canvas, then trigger an external vault refresh (e.g.
   another save in the same vault). The toolbar should show
   "External change — refresh to reload" instead of silently
   overwriting your edits. Click Refresh — confirm dialog appears
   because you're dirty.
9. Force a save error (e.g. close the vault before the debounce
   fires) — the toolbar error row appears with Retry and Dismiss.
   The in-memory canvas is preserved.
10. Switch to a Markdown note — all existing Markdown behaviour
    (open / edit / save / preview / Backlinks / Search / Tags /
    Outline / Properties / Bases / Graph) is unchanged.

## Known risks or limitations

- **No undo/redo.** A miscued `Backspace` / `Delete` is irreversible
  within a single edit; the 800 ms debounce gives a small window
  before the change reaches disk, but after the save you would need
  to manually re-add the card. Undo/redo is deferred to a later
  milestone.
- **No multi-select / copy / paste.** Single-item selection only.
- **No zoom / pan controls.** The viewport is the persisted
  `CanvasViewport` value; you can scroll the surface but not pan/zoom
  through UI controls. Cards added via the toolbar land near the
  persisted viewport's origin.
- **External-change handling is advisory.** When dirty, an external
  refresh shows a notice but does not auto-merge. A future milestone
  could add a hash-based reconciliation; 8C keeps the user in
  control.
- **`activeNotePath` heuristic.** The "Add active note" button uses
  the workspace's global `activePath`; when that path equals this
  canvas (or any other `.replica-canvas`), the button is disabled.
  This avoids prop-drilling through three workspace layers but means
  you can only add the note that's "currently active" in the
  workspace.
- **No new IPC, no new main API, no renderer filesystem access.**
  The trust surface is unchanged from 8B; every edit flows through
  the existing `api().canvasWrite(path, canvas)` and the main-side
  IPC validator from 8A.

## Milestone links

- Previous: [[MILESTONE-8C-PLAN]]
- Next: [[MILESTONE-8D-PLAN]]
- Plan: [[MILESTONE-8C-PLAN]]
