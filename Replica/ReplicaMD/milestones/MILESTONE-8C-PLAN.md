# Milestone 8C Plan - Canvas Basic Editing Interactions

Milestone 8C adds the first safe editing interactions on top of the
Canvas foundation shipped in 8A and the read-only Canvas workspace view
shipped in 8B. The goal is to let users make small, predictable changes
to `.replica-canvas` files through the UI — add a card, edit a card,
move it, delete it — without enlarging the trust surface, persistence
model, or product scope.

This milestone keeps Replica's Canvas local-first. All persistence
still flows through the already-shipped `canvasWrite` preload API; the
renderer remains filesystem-free; no plugin, scripting, marketplace,
sync, publish, or URI hooks are added; and no media / embed / arbitrary
HTML card types are introduced. The schema is **not** modified.

## Constraints

- Do not copy Obsidian's Canvas format, UI, protocols, assets,
  branding, or private behavior.
- Use only Replica's own `.replica-canvas` schema from 8A.
- Keep the renderer filesystem-free.
- Do not expose raw `ipcRenderer` or any new IPC channel beyond the
  already-shipped `canvas:create` / `canvas:read` / `canvas:write`.
- Do not add new preload APIs unless absolutely necessary; the existing
  `canvasRead` / `canvasWrite` / `canvasCreate` triple is expected to be
  enough.
- Do not introduce plugins, marketplace behavior, scripting, macros,
  arbitrary code execution, sync, publish, URI scheme, formulas,
  relations, rollups, grouping, bulk editing, schema-manager features,
  or database/spreadsheet behavior.
- Do not add media cards, image embeds, PDF embeds, audio, video, or
  web previews.
- Do not add Obsidian Canvas import / export compatibility.
- Do not modify the `CanvasFile` schema or introduce a v2 schema.
- Keep the app shippable after each step.

## Current State (8A + 8B recap)

### Schema, store, IPC (from 8A)

- `src/shared/canvas.ts` defines `CanvasFile`, `CanvasNoteNode`,
  `CanvasTextNode`, `CanvasEdge`, `CanvasViewport`, plus bounded
  schema constants and `createStarterCanvas` / `normalizeCanvasFile`.
- Schema version `1`. Replica-owned extension `.replica-canvas`.
- `src/main/vault/canvas-store.ts` reads, writes, and creates
  `.replica-canvas` files through `VaultFs`.
- IPC channels `canvas:create` / `canvas:read` / `canvas:write` with
  validated payloads (path safety, schema version pin, id/note-path
  safety, finite geometry, edge endpoints reference existing nodes,
  payload size cap, prototype-pollution rejection).
- Preload exposes only `canvasCreate(path, title?)`,
  `canvasRead(path)`, `canvasWrite(path, canvas)`.

### Workspace integration (from 8B)

- `getDocumentKind(path)` helper routes `.md` / `.markdown` to the
  Markdown editor/preview and `.replica-canvas` to the new
  `CanvasPane`. Workspace tabs still store a path; the kind is derived
  at render time. No `workspace.json` migration.
- File explorer lists `.replica-canvas` files with a small visual
  hint; clicking one re-uses the existing open-flow callback.

### Renderer components (from 8B)

- `src/renderer/components/canvas/CanvasPane.tsx` — top-level pane,
  owns the load lifecycle (`loading` / `ready` / `error` states),
  re-reads on `refreshKey` change and on manual refresh.
- `src/renderer/components/canvas/CanvasToolbar.tsx` — minimal toolbar
  for the canvas title and (in 8B) the read-only refresh button.
- `src/renderer/components/canvas/CanvasViewport.tsx` — the SVG
  surface that paints nodes and edges using a static viewBox derived
  from the persisted `CanvasViewport`.
- `src/renderer/components/canvas/CanvasNodeView.tsx` — renders text
  nodes (plain text, no HTML) and note nodes (title / path / open
  action); shows a dimmed "missing" state when a note path cannot be
  resolved.
- `src/renderer/components/canvas/CanvasEdgeView.tsx` — straight SVG
  lines between node centres with optional safe labels.
- `src/renderer/components/canvas/canvas-render.ts` — pure helpers for
  layout math (node centres, edge geometry, viewport bounding box,
  display-name extraction).

### Tests (from 8B)

- `tests/canvas-schema.test.ts` — 8A normalization, bounds,
  prototype-pollution rejection.
- `tests/canvas-store.test.ts` — 8A store round trip.
- `tests/canvas-render.test.tsx` — pure renderer helpers for nodes,
  edges, viewport bounds.
- `tests/canvas-renderer-boundary.test.ts` — grep-style assertion that
  renderer canvas files do not import Node / fs / Electron / raw
  `ipcRenderer`.

### Known limitations carried into 8C

- The CanvasPane is read-only: there is no selection, no add/edit/
  move/delete UI, no save button, no dirty state, no keyboard editing.
- The viewport is static. There is no pan/zoom UI.
- There are no Canvas commands in the command palette.
- There is no undo/redo or copy/paste.
- There are no group nodes, frames, or backgrounds.

## Editing Scope For 8C

The 8C in-scope list is deliberately small. Each item maps cleanly to
the existing schema and the existing `canvasWrite` API:

- **Selection model** — one selected node id *or* one selected edge id
  at a time. Click to select; click background to clear.
- **Add Text Card** — append a `CanvasTextNode` at a deterministic
  position near the viewport centre with a default size and an empty
  starter `text`.
- **Add Active Note Card** — append a `CanvasNoteNode` referencing the
  active workspace note's path. Disabled when no note is active or
  when the active path is itself a `.replica-canvas` file.
- **Edit Text Card text** — open a small inline editor (textarea) on
  the selected text node. Saves on commit through `canvasWrite`. No
  Markdown parsing, no HTML.
- **Move card by drag** — pointer drag on a node clamps to bounded
  coordinates and persists on drop. No drag-to-connect.
- **Delete selected node** — removes the node and all incident
  edges. Triggered by `Backspace` / `Delete` (when the canvas surface
  has focus) or a small toolbar button while a node is selected.
- **Delete selected edge** — removes the edge only. Triggered by the
  same key/button while an edge is selected.
- **Save** — explicit `Save` button in the toolbar plus a debounced
  auto-save after edits settle (see persistence section). Either
  mechanism calls `canvasWrite(path, canvas)` exactly once per save.

**Defer to a later milestone:** connect-via-handles (drawing a new
edge by dragging from a node), resize, zoom/pan controls, multi-select,
copy/paste, undo/redo, groups/backgrounds, palette commands. These are
either too large to ship safely in 8C or depend on UX research.

## State And Persistence Model

### In-pane state

- `CanvasPane` continues to own the canonical loaded `CanvasFile`
  state. 8C extends this with:
  - `selection: { kind: 'none' | 'node' | 'edge'; id?: string }`
  - `dirty: boolean` — true while in-memory state diverges from the
    last persisted snapshot.
  - `savePending: boolean` — true while a `canvasWrite` is in flight.
  - `saveError: string | null` — last save error, cleared on next
    successful save or on Refresh.

### Save model

- Use **explicit `Save` button** as the primary affordance, plus a
  **debounced background save** (e.g. 800 ms after the last edit) so
  small interactions don't require constant button clicks.
- Reasons for this choice:
  - explicit save matches the editor save UX users already know from
    Markdown notes;
  - debounced background save avoids data loss while keeping the
    explicit affordance for keyboard users;
  - we never accidentally over-write disk between fast successive
    edits because the debounce coalesces them.
- The pane records the *last persisted snapshot* (a deep copy of the
  `CanvasFile` returned from `canvasRead` or echoed by `canvasWrite`)
  and compares structurally to compute `dirty`. Comparison stays
  cheap because `CanvasFile` is bounded by the 8A schema constants
  (`CANVAS_MAX_NODES = 500`, `CANVAS_MAX_EDGES = 1_000`).

### Refresh / reload

- Manual Refresh asks for confirmation when `dirty`. Confirming
  discards local edits and re-reads from disk.
- Vault `refreshKey` bumps (e.g. file watcher activity) trigger a
  silent reload **only when not dirty**; while dirty they show a
  small "External change detected — Refresh to reload" notice that
  keeps the user in control.
- This is a pragmatic mitigation rather than a transactional model.
  We deliberately do **not** add a new IPC to fetch the disk hash
  before write.

### Save errors

- On a `canvasWrite` rejection the in-memory `CanvasFile` is
  preserved; the error message (no absolute filesystem paths) is
  shown in the toolbar with a small Retry button.
- The debounced save retries on the next user edit. Repeated failures
  do not loop more than once per edit.
- Renderer never reads the underlying error stack; everything passes
  through the existing `Result`-wrapped IPC contract.

## Selection Model

- The pane stores at most one selection: a node id, an edge id, or
  nothing. (No multi-select in 8C.)
- Visual state:
  - selected node renders with a thicker stroke and a small selected
    outline;
  - selected edge renders with a thicker stroke;
  - unselected items keep their existing 8B styling.
- Keyboard:
  - `Backspace` / `Delete` removes the current selection (and incident
    edges when a node is selected). Bound only when the canvas surface
    or a non-editable canvas child has focus.
  - `Escape` clears the selection and exits any inline text edit.
- Accessibility:
  - selected items expose `aria-selected="true"`;
  - the canvas surface has `role="application"` and an `aria-label`
    so screen readers announce "Canvas <title>";
  - keyboard-only users can tab into the canvas surface; a future
    milestone may add ArrowKey nav.

## Add Text Card

- Toolbar button "Add text card" (and an optional `canvas.addTextCard`
  command entry if the command palette wiring stays small).
- Position: pick the centre of the loaded viewport (the persisted
  `CanvasViewport.x` / `.y` plus a constant offset) and **clamp** to
  `[-CANVAS_MAX_COORDINATE, CANVAS_MAX_COORDINATE]`.
- Size: `CANVAS_DEFAULT_NODE_WIDTH` × `CANVAS_DEFAULT_NODE_HEIGHT`
  (already declared in `src/shared/canvas.ts`).
- Id: prefix `text-` + a short random base-36 segment, validated by
  the existing `SAFE_ID` regex. If the random suffix collides with an
  existing node id, retry.
- Starter `text`: empty string. The user is dropped straight into the
  inline editor for the new node so they can start typing.
- Save: debounced + explicit. The auto-focus into the inline editor is
  treated as a single user-initiated edit, so the debounced save fires
  ~800 ms after the user stops typing.
- Tests: pure helper produces the expected node shape; canvas state
  after add matches the snapshot; selection becomes the new node id.

## Add Active Note Card

- Toolbar button "Add active note".
- Enabled when **all** of these are true:
  - a note is active in the workspace;
  - the active path ends in `.md` / `.markdown` (not
    `.replica-canvas`);
  - the active note path passes the existing
    `normalizeEditablePropertyName`-style safety rules already used by
    `canvasWrite`.
- The created `CanvasNoteNode` carries:
  - `type: 'note'`,
  - `path` set to the active note's relative path,
  - optional `title` left undefined; the renderer already looks up
    titles from `listNotes()`,
  - default coordinates and size like the text card.
- **No note contents are embedded.** The card stores only the path
  reference; the existing rendering reads the title from the index.
- Save: same explicit + debounced model.
- Tests: helper produces the expected node shape; disabled state when
  no active note; disabled state when active path is a canvas file.

## Edit Text Card Text

- Inline editor: a `<textarea>` rendered above the selected node's
  rectangle, sized to the node, with the same padding as the read-only
  text. No CodeMirror, no Markdown parser, no HTML — bytes go in and
  out as plain `string`.
- Activation:
  - double-click a text node; or
  - press `Enter` with a text node selected; or
  - immediately upon Add Text Card.
- Commit:
  - `Cmd/Ctrl+Enter` or blur → commit and dirty;
  - `Escape` → cancel and restore previous text.
- Length is capped by `CANVAS_MAX_TEXT_LENGTH` from the 8A schema. The
  textarea uses `maxLength` for a UI hint; the pure helper enforces
  the cap on commit so the IPC validator never sees an oversize
  payload.
- Save: debounced after commit.
- Tests: the helper substitutes the new text; literal `<script>` and
  Markdown markers round-trip as plain characters; oversize input is
  truncated rather than rejected silently; canceled edits leave state
  unchanged.

## Move Cards (Drag)

- Pointer-driven drag implemented at the SVG surface level. A single
  `pointerdown` on a node captures the pointer, `pointermove` updates
  a draft position, `pointerup` commits.
- Coordinates are **clamped** to
  `[-CANVAS_MAX_COORDINATE, CANVAS_MAX_COORDINATE]` and floored to an
  integer so the persisted geometry stays stable across refreshes.
- The drag does **not** depend on pan/zoom; the static viewport from
  8B is unchanged.
- Pointer events are ignored when the target lives inside a text
  input or the canvas-pane error/loading state.
- Save: drag commits, then the debounced save fires once.
- Tests: a pure `moveNode(canvas, id, dx, dy)` helper produces
  expected coordinates; clamps work on each axis; moving a node does
  not affect any other node; the helper is idempotent under
  zero-delta calls.

## Delete

- Trigger: `Backspace` / `Delete` while the canvas surface has focus,
  or a small toolbar button (with an `aria-label` derived from the
  selection — e.g. "Delete selected text card").
- Behavior:
  - selected node → remove that node and **all** incident edges (so
    the resulting `CanvasFile` continues to satisfy the 8A invariant
    that every edge endpoint references an existing node);
  - selected edge → remove that edge only.
- Confirmation: ship without an extra confirm dialog. `Backspace` is
  already deliberate, and the debounced save gives a small window
  before the change reaches disk; a future milestone can add undo.
- Save: debounced after delete.
- Tests: pure helpers produce expected output; deleting a node
  removes exactly the incident edges (none of the others); selection
  resets to `none` after delete.

## Pure Helpers

A new pure module groups every state transition so the pane stays a
thin wrapper over deterministic helpers. Suggested file:

`src/renderer/components/canvas/canvas-edit.ts`

(Place the module under `renderer/components/canvas/` because it
references renderer-specific bounds like default node coordinates; the
helpers themselves have no React or DOM dependencies and are unit-
testable in isolation.)

Suggested exports:

- `addTextNode(canvas, { x, y, text? }): CanvasFile`
- `addNoteNode(canvas, { x, y, path }): CanvasFile`
- `updateTextNodeText(canvas, nodeId, nextText): CanvasFile`
- `moveNode(canvas, nodeId, dx, dy): CanvasFile`
- `deleteNode(canvas, nodeId): CanvasFile` — also removes incident
  edges
- `deleteEdge(canvas, edgeId): CanvasFile`
- `selectionAfterDelete(selection, deletedId): Selection`
- `isDirty(loaded, current): boolean`
- `clampCanvasCoordinate(value): number`
- `generateCanvasNodeId(prefix: 'text' | 'note', existing): string`

Rules for the helpers:

- never mutate the input `CanvasFile`; always return a new value;
- never throw on benign edge cases (missing id, etc.) — return the
  input unchanged;
- enforce the bounds from `src/shared/canvas.ts` so the IPC validator
  never has to reject our own output;
- emit `updatedAt = Date.now()` on changed nodes/edges and on the
  enclosing `CanvasFile`;
- preserve the existing `viewport` field as-is.

## Renderer Boundaries

The boundary test from 8B
(`tests/canvas-renderer-boundary.test.ts`) is extended to cover the
new files and helpers:

- no canvas renderer file imports `fs`, `node:fs`, `path`,
  `node:path`, `electron`, or `ipcRenderer`;
- no canvas renderer file uses `dangerouslySetInnerHTML`;
- canvas editing helpers depend only on `src/shared/canvas`, plain JS
  built-ins, and other canvas-renderer modules;
- all canvas persistence in the renderer goes through
  `api().canvasWrite(...)`. No call to `canvasCreate` is required for
  editing (creation is still a separate "New canvas" affordance from
  8B if it shipped).

## Tests

### Pure helper tests

- `addTextNode` appends a new text node, assigns a fresh id, clamps
  coordinates, leaves other nodes/edges untouched, bumps the file's
  `updatedAt`.
- `addNoteNode` appends a `CanvasNoteNode` with the given path,
  rejects unsafe paths by returning the input unchanged, leaves other
  state untouched.
- `updateTextNodeText` substitutes the new text, truncates at
  `CANVAS_MAX_TEXT_LENGTH`, no-ops on a missing id.
- `moveNode` clamps within `[-CANVAS_MAX_COORDINATE, CANVAS_MAX_COORDINATE]`,
  preserves other nodes, no-ops on missing id, integerizes the result.
- `deleteNode` removes the node and every incident edge; never throws
  on missing id.
- `deleteEdge` removes the edge only; never throws on missing id.
- `selectionAfterDelete` clears the selection when the deleted id was
  selected; preserves it otherwise.
- `isDirty` returns false for a deep-equal pair, true for any
  structural difference (node count, ids, geometry, text, edges).
- `clampCanvasCoordinate` clamps and integerizes.
- `generateCanvasNodeId` produces ids matching the existing
  `SAFE_ID` regex and never duplicates an existing id in the canvas.

### Component / flow tests (only where practical)

- CanvasPane disabled / enabled toolbar state given selection and
  active-note context.
- Add Text Card calls `canvasWrite` once with the expected normalized
  canvas after the debounce settles.
- Add Active Note Card disabled when no note is active.
- Edit Text Card escapes literal `<script>` to plain text.
- Delete with selection clears selection.
- Save error keeps the in-memory state intact and surfaces an
  inline error.

### Renderer boundary tests

- `tests/canvas-renderer-boundary.test.ts` updated to include
  `canvas-edit.ts` and any new component files.

### Regression tests

- Markdown note opening / editing / saving / preview / autosave still
  work.
- The Bases pane, Properties pane, Backlinks, Tags, Outline, Graph
  panes are untouched by canvas editing.
- The command palette continues to dispatch existing commands without
  shortcut collisions.

## Documentation

After implementation:

- Create `MILESTONE-8C.md` with delivered scope, files changed, save
  model, selection model, tests, gates, deferred items, manual
  checks, known risks.
- Update `README.md` with a short "Canvas editing (Milestone 8C)"
  paragraph and refresh the feature list.
- Update `ROADMAP.md` to mark M8C as shipped and re-list the canvas
  items still deferred (connect handles, zoom/pan, resize, multi-
  select, copy/paste, undo/redo, media cards, Obsidian compatibility,
  palette commands, plugin/sync/publish/URI).
- Update `ARCHITECTURE.md` only if the editing/save model adds
  meaningful structure beyond the renderer pane (likely a small note
  next to the existing 8A/8B sections).

Documentation must mention:

- Replica's `.replica-canvas` remains incompatible with Obsidian
  Canvas by design.
- Renderer remains filesystem-free.
- No new IPC channel was added in 8C.
- All canvas persistence still flows through
  `canvasCreate` / `canvasRead` / `canvasWrite`.
- Explicit deferrals.

## Explicit Deferrals For 8C

- **Connect-via-handles.** Creating a new edge by dragging from a
  node handle is deferred. Existing edges (loaded from disk) continue
  to render and can be deleted.
- Resize nodes.
- Zoom and pan controls beyond persisting the loaded viewport.
- Multi-select, copy / paste.
- Undo / redo (no transaction log in 8C).
- Groups, backgrounds, frames.
- Media / embed cards — images, PDFs, audio, video, web previews.
- Obsidian Canvas import / export compatibility.
- Canvas-specific command-palette entries (defer to a later
  milestone that decides whether they belong in the palette).
- Cross-canvas backlinks, canvas-aware search, "open this canvas
  from a note" affordances.
- Plugins, scripting, marketplace, sync, publish, URI scheme.
- Any schema migration; `CanvasFile.schemaVersion` stays at `1`.

## Risks And Mitigations

- **Risk: An edit overwrites an external change.**
  Mitigation: Refresh confirms when dirty; external `refreshKey`
  bumps surface a notice rather than silently overwriting. We do not
  add a new IPC for hash-based reconciliation in 8C; a future
  milestone may revisit if conflicts become common.
- **Risk: A drag handler steals events from the inline text editor.**
  Mitigation: the SVG surface checks the event target and bails out
  if it's inside the inline `<textarea>` or any control with
  `data-canvas-pointer="off"`.
- **Risk: Debounced save loses an edit on tab close.**
  Mitigation: an explicit `Save` button is always present; the
  toolbar shows a "dirty" indicator until the save lands.
- **Risk: A misbehaving helper produces invalid canvas state.**
  Mitigation: the main-side IPC validator from 8A is the final gate.
  The renderer additionally runs the helper through
  `normalizeCanvasFile` (shared, pure) before calling `canvasWrite`,
  so bounds violations get caught locally with a clear error.
- **Risk: Renderer accidentally reaches Node APIs.**
  Mitigation: the boundary test from 8B is extended to cover the new
  files; CI fails if a forbidden import sneaks in.
- **Risk: Scope creep into a full diagramming app.**
  Mitigation: the deferral list above explicitly excludes the obvious
  next steps. Implementing them is a separate milestone.

## Recommended Implementation Order

1. **Pure editing helpers + tests** (`canvas-edit.ts`).
2. **Selection model** in `CanvasPane`, plus visual selected states
   on nodes/edges; no edits yet.
3. **Add Text Card / Add Active Note Card** toolbar buttons +
   inline-editor activation. No drag yet. Save (explicit + debounced)
   wired up.
4. **Edit Text Card text** with safe textarea + commit/cancel.
5. **Move cards** (pointer drag) + save.
6. **Delete** node/edge with keyboard and toolbar; selection
   transitions.
7. **Save errors + dirty/refresh polish.** Notice on external
   change, Retry on save error, confirm on Refresh when dirty.
8. **Tests, regression sweep, renderer-boundary update.**
9. **Docs + final gates.**

## Acceptance Criteria

8C is complete when:

- The user can add a text card and edit its text inline.
- The user can add the active note as a note card.
- The user can move cards by dragging within the bounded coordinate
  range.
- The user can delete the selected node (and its incident edges) or
  the selected edge.
- Edits persist through the existing `canvasWrite` API, with an
  explicit `Save` button plus a debounced auto-save.
- A failed save preserves the in-memory state and surfaces a clear
  inline error.
- Refresh confirms when there are unsaved changes; an external
  vault refresh surfaces a notice instead of silently overwriting.
- Selection is single-item and visually clear.
- The renderer has not gained filesystem access or raw IPC.
- All canvas persistence still flows through 8A's
  `canvasCreate` / `canvasRead` / `canvasWrite` API.
- No new write path, plugin loader, marketplace, scripting, macro
  system, or media-card capability was introduced.
- Markdown note behaviour (open, edit, save, autosave, preview,
  backlinks, search, tags, outline, properties, Bases, graph) is
  not regressed.
- `npm run check`, `npm run build`, `npm run test:e2e`, and
  `npm run dev` all pass.

## Milestone links

- Previous: [[MILESTONE-8B]]
- Next: [[MILESTONE-8C]]
- Implementation: [[MILESTONE-8C]]
