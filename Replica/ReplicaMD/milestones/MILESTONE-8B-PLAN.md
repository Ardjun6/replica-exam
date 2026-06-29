# Milestone 8B Plan - Canvas Workspace View And Basic Rendering

Milestone 8B adds the first visible Canvas UI in Replica. It opens
`.replica-canvas` files in the workspace, renders the existing text/note
nodes and edges read-only by default, and supports a tiny safe write
surface (whole-canvas save with minimal create/edit-text affordances)
only when those affordances stay small.

This milestone builds on the schema and main-process foundation shipped
in 8A. It does **not** add Obsidian Canvas compatibility, full drag /
connect / delete UI, zoom / pan, media cards, embeds, plugins, sync,
scripts, or any new persistence file beyond the already-validated
`.replica-canvas` documents.

## Constraints

- Do not copy Obsidian's Canvas format, UI, protocols, assets, branding,
  or private behavior.
- Use only Replica's own `.replica-canvas` schema from 8A.
- Keep the renderer filesystem-free.
- Do not expose raw `ipcRenderer` or any new IPC channel beyond the
  already-shipped `canvas:create` / `canvas:read` / `canvas:write`.
- All canvas persistence flows through `canvasRead` / `canvasWrite` /
  `canvasCreate` on the preload bridge.
- Do not introduce plugins, marketplace behavior, scripting, macros,
  arbitrary code execution, sync, publish, URI scheme, formulas,
  relations, rollups, grouping, bulk editing, or schema-manager
  features.
- Do not add media cards, image embeds, PDF embeds, audio, video, or
  web previews.
- Do not add advanced Canvas interactions (drag-move, connect, delete,
  zoom/pan, multi-select) in 8B unless an interaction is trivially safe
  and unit-tested; otherwise defer to 8C.
- Keep the app shippable after each step.

## Current State (8A recap)

### Shared Canvas Schema

- `src/shared/canvas.ts` defines `CanvasFile`, `CanvasNode`
  (`CanvasNoteNode` and `CanvasTextNode`), `CanvasEdge`,
  `CanvasViewport`, plus bounded schema constants and
  `createStarterCanvas` / `normalizeCanvasFile` helpers.
- Schema version is `1`.
- Replica-owned extension is `.replica-canvas`.
- No group nodes, no executable cards, no media cards.

### Normalization And Validation

- Disk normalization is defensive: invalid top-level input becomes a
  starter canvas; invalid/duplicate node ids drop; invalid note paths
  drop; invalid edge endpoints and self-links drop; duplicate edge
  pairs collapse; text/title/label/size/coordinate/zoom are bounded;
  prototype-pollution keys are treated as unsafe.
- IPC write validation is stricter: vault-relative `.replica-canvas`
  paths only, schema version pinned to `1`, ids and note paths checked
  for safety, geometry/viewport must be finite, edge endpoints must
  reference existing nodes, payload size capped, prototype-pollution
  rejected.

### Main-Process Store

- `src/main/vault/canvas-store.ts` reads, writes, and creates
  `.replica-canvas` files through `VaultFs`, the same audited write
  path Markdown notes use. Reads normalize before returning data.

### IPC and Preload

- New channels `canvas:create`, `canvas:read`, `canvas:write`.
- `ReplicaApi` exposes typed `canvasCreate(path, title?)`,
  `canvasRead(path)`, `canvasWrite(path, canvas)` — no other canvas
  surface, no raw IPC.

### Tests

- Shared schema normalization tests (id/path safety, edge integrity,
  bounds, prototype-pollution rejection).
- Store round-trip tests through a temporary vault.
- IPC validator tests for path/payload shape.

### Known Limitations As Of 8A

- `.replica-canvas` files are not displayed in the file explorer.
- `.replica-canvas` files cannot be opened through the workspace.
- The workspace currently assumes every active document is a Markdown
  note (`activePath` is a Markdown path; the editor mounts when
  `activePath` is set).
- There is no Canvas view component in the renderer.
- There is no Canvas command-palette entry.

## Workspace Integration

### Document Kind

- The workspace currently models every tab as a Markdown note. We must
  introduce a small document-kind notion so the workspace shell can
  decide whether to render the existing editor/preview or the new
  CanvasPane.
- Suggested approach: derive the kind from the path extension. A
  helper such as `getDocumentKind(path): 'markdown' | 'canvas' |
  'unknown'` keeps the decision in one place and avoids hard-coding
  extension checks in components.
- Persisted workspace state (`.obsidian-replica/workspace.json`) does
  **not** need a schema migration: the tab still stores a path; the
  kind is derived at render time. Document this clearly so a future
  migration is unnecessary.

### Active Canvas Path / State

- `activePath` continues to hold the relative path of the active tab,
  regardless of kind.
- The CanvasPane treats its own `CanvasFile` state as authoritative for
  in-pane editing and writes the whole file back through `canvasWrite`
  on save.
- Switching tabs unmounts the pane; switching back loads the file
  again. There is no global canvas cache in 8B.

### Avoiding Markdown Regressions

- The existing Markdown editor/preview path must not be entered when
  the active path is a `.replica-canvas` file.
- The file watcher already triggers a vault `refreshKey` bump on
  canvas writes since canvas files live in the same vault. The
  CanvasPane will re-read on `refreshKey` change just like other
  panes do.
- Backlinks, search, tags, outline, Properties, Bases, and Graph
  panes must continue to ignore canvas files; they were built around
  Markdown notes and the `NoteIndex`.

### Fallback / Error State

- If `canvasRead` rejects (path not found, malformed JSON), show a
  clear inline error inside the CanvasPane: "Could not open canvas:
  <reason>" with a small Retry button. No filesystem path is exposed
  in the error.
- If the file exists but normalizes to an effectively empty canvas
  (no nodes / no edges), show an "Empty canvas" state with a button
  to add a starter text card (if the safe write affordance is
  included).

## File Explorer Integration

### Showing `.replica-canvas` Files

- The file explorer currently lists Markdown files and folders. 8B
  extends the listing to include `.replica-canvas` files.
- The explorer should display canvas files with a small visual hint
  (e.g. a different icon character) so users can distinguish them
  from Markdown notes.
- Clicking a `.replica-canvas` file follows the existing open-flow
  used for notes; the workspace shell branches on the derived
  document kind.

### Optional "Create new canvas" Action

- Only ship a "Create new canvas" command/action if it can be a
  one-line wrapper over `api().canvasCreate(path, title?)` with a
  conflict-safe path coming from `suggestUniquePath`.
- Surface it as either a command-palette entry (`canvas.new` →
  category `notes`) or a small explorer toolbar button.
- Destructive behavior is **out of scope**: no rename UI, no delete
  UI, no inline title edit from the explorer. Existing safe
  rename/delete preload methods may be used unchanged.

### Filesystem Safety

- The explorer does not add a new write path. The new "Create
  canvas" affordance, if shipped, uses only `canvasCreate` and
  `suggestUniquePath`, both already validated in 8A and earlier
  milestones.
- The renderer remains filesystem-free.

## Renderer Components

Suggested files:

- `src/renderer/components/canvas/CanvasPane.tsx` — top-level pane,
  owns load/save lifecycle and dirty state.
- `src/renderer/components/canvas/CanvasToolbar.tsx` — minimal
  toolbar: title, Save, Refresh, and optional "Add text card" /
  "Add note card" buttons.
- `src/renderer/components/canvas/CanvasViewport.tsx` — the SVG
  surface that paints nodes and edges; no real pan/zoom logic in
  8B beyond a static viewBox derived from the persisted
  `CanvasViewport`.
- `src/renderer/components/canvas/CanvasNodeView.tsx` — one component
  per node kind (`note` and `text`) with safe text rendering.
- `src/renderer/components/canvas/CanvasEdgeView.tsx` — straight
  SVG line between two node centres with optional label.
- Optional `src/renderer/components/canvas/canvas-render.ts` — pure
  helpers for layout (e.g. node centre, edge geometry, viewport
  bounding box), kept out of components so it is unit-testable.

### Composition

- `WorkspaceShell` (or the active-pane renderer) chooses between
  the existing `EditorPane`/`PreviewPane` pair and `CanvasPane`
  based on the derived document kind.
- The renderer never imports Node, never reaches into the canvas
  store, and never reads `.replica-canvas` files directly.

## Basic Rendering Scope

### What Renders In 8B

- **Text nodes:** rectangle with rounded corners, light background
  from the node's `color` if present, and the `text` field rendered
  as plain text (no HTML, no Markdown link execution). Long text
  wraps and clips at the node's bounded height.
- **Note nodes:** rectangle with rounded corners and the node's
  `title` (or the resolved note's title if available, otherwise the
  path basename). Clicking the title opens the linked note in the
  active workspace pane through the existing `openNote` action.
- **Missing-note state:** when a `CanvasNoteNode` references a
  `path` the index cannot resolve, the node renders with a
  dimmed style and a small "missing" badge — no implicit creation.
- **Edges:** straight `line` SVG element between the two referenced
  node centres. Optional label rendered as a small `text` element
  centred along the segment.
- **Empty canvas state:** a quiet centred message + an "Add text
  card" affordance if safe writes are included.
- **Loading state:** spinner / "Loading canvas…" placeholder while
  `canvasRead` is in flight.
- **Error state:** see the workspace-integration section.

### Safety Of Text Rendering

- All text content is rendered as plain DOM text. No `dangerouslySetInnerHTML`,
  no Markdown parser, no link auto-execution, no embedded media.
- Colors come exclusively from the bounded `CanvasColor` enum already
  defined in `src/shared/canvas.ts`; the renderer maps the enum to
  CSS variables / fills.
- No user-controlled string is interpolated into a CSS rule, a `style`
  attribute beyond a safe color set, or a URL.

## Basic Write Scope

### Definitely In Scope

- `canvasRead(path)` on mount and on `refreshKey` change.
- `canvasWrite(path, canvas)` on Save. The pane is "dirty" only when
  the in-memory `CanvasFile` differs from the last loaded value;
  Save is disabled otherwise.
- The pane preserves any unknown nested values in the loaded
  `CanvasFile` because 8A normalization already enforces the schema
  shape — we just round-trip what we got.
- "Refresh" calls `canvasRead` again and discards any unsaved
  changes after a confirm. (Implemented only if the dirty/diff
  story stays small.)

### Optional If The Surface Stays Small

- **Edit text card text** through a single-line / multi-line text
  input. Only the active card's `text` field changes; the file is
  saved by clicking Save.
- **Add text card** — appends a new `CanvasTextNode` at a default
  location near the viewport centre. Newly-created cards get a
  fresh id (`text-<random>`), the schema's default node width and
  height, and an empty `text`. Saving persists.
- **Add note card** — opens a small picker over `listNotes()` and
  appends a `CanvasNoteNode` referencing the chosen path.

### Deferred To 8C (Or Later)

- Drag/move nodes.
- Connect nodes by drawing a new edge from a node handle.
- Delete nodes / edges through the UI.
- Resize nodes.
- Zoom and pan controls beyond persisting the loaded viewport.
- Multi-select, copy, paste, undo/redo.
- Inline rich-text editing.
- Media / embed cards, images, PDFs, audio, video, web previews.
- Canvas command-palette entries (e.g. "Add text card", "Save canvas").
- Obsidian Canvas import / export.

## Tests Needed

### Workspace / Routing Tests

- A new pure helper (e.g. `getDocumentKind(path)`) returns `'canvas'`
  for `.replica-canvas`, `'markdown'` for `.md`, and `'unknown'` for
  anything else. The workspace branch chooses the right pane.
- Opening a `.replica-canvas` path through the existing
  `openNoteInActivePane` flow stores it in the active tab without
  errors.
- Opening a Markdown note still mounts the editor; opening a canvas
  does **not** mount the editor.

### File Explorer Tests

- `.replica-canvas` files appear in the tree alongside `.md` files.
- Clicking a canvas file invokes the same `onOpen(path)` callback as
  notes (no new method on the open-flow API).
- The explorer rejects creating a canvas path that targets the
  hidden config folder, the same way it rejects Markdown paths
  there.

### CanvasPane / Renderer Tests

- Loading state appears while `canvasRead` is pending.
- Error state appears when `canvasRead` rejects; the message does not
  include absolute filesystem paths.
- Empty state appears for a canvas with no nodes / edges.
- Pure helpers (`canvas-render.ts`) cover node-centre, edge
  geometry, and viewport bounding-box math without React.
- Plain-text rendering: a text node containing `<script>` or `**md**`
  renders the literal characters, not HTML or Markdown.
- Missing-note state: a `CanvasNoteNode` whose path the index does
  not resolve renders with the dimmed/missing affordance and does
  **not** crash.

### Write-Flow Tests (if write affordances ship)

- "Add text card" → the local `CanvasFile` gains a node with the
  expected shape; `Save` calls `canvasWrite(path, expected)` exactly
  once.
- A failed `canvasWrite` keeps the in-memory state intact and
  surfaces the error in the toolbar — the on-disk file is
  unchanged.
- Editing a text card's text and clicking Save sends the updated
  `CanvasTextNode` through `canvasWrite` and clears the dirty flag.

### Safety Tests

- `tests/canvas-renderer.test.ts` (or similar) asserts that no
  renderer canvas file imports Node, `electron`, `fs`, or
  `ipcRenderer`. Static greps in tests are fine — these are
  regression guards.
- The pane does not call `api()` methods other than `canvasRead`,
  `canvasWrite`, optionally `canvasCreate`, `listNotes`, and
  `openNote`.

### Regression Tests

- Existing Markdown note opening still works (no broken tabs).
- Existing backlinks / search / tags / outline / Properties / Bases /
  Graph panes still ignore canvas files.
- Bases evaluation still runs only against Markdown notes (canvas
  files are not in the `NoteIndex`).
- Workspace persistence (`workspace.json`) still round-trips through
  the existing normalization.
- Command palette still opens and dispatches existing commands.

## Documentation

After implementation:

- Create `MILESTONE-8B.md` recording: delivered scope, schema notes
  (no change), workspace integration, file explorer integration,
  renderer components, basic rendering scope, basic write scope
  (or its deferral), tests, gates, deferred items, manual checks.
- Update `README.md` with a short "Canvas (Milestone 8B)" feature
  paragraph and add `.replica-canvas` to the description of file
  kinds the app handles.
- Update `ROADMAP.md` to mark M8B as shipped and re-list the
  Canvas items deferred to 8C and beyond.
- Update `ARCHITECTURE.md` only if the workspace document-kind
  routing meaningfully changes the layer story (likely a small
  note rather than a new section).

Documentation must mention:

- Replica's `.replica-canvas` is **not** Obsidian Canvas-compatible.
- Renderer still has no raw filesystem access.
- No new IPC was added in 8B.
- All canvas persistence flows through 8A's `canvasCreate` /
  `canvasRead` / `canvasWrite`.
- Lists of explicit deferrals.

## Explicit Deferrals For 8B

- Drag-to-move nodes.
- Connect nodes through UI (handles, drag-to-link).
- Delete nodes / edges through UI.
- Resize nodes.
- Zoom and pan UI beyond persisting the loaded viewport.
- Groups, backgrounds, frames.
- Media / embed cards: images, PDFs, audio, video, web previews.
- Obsidian Canvas import / export compatibility.
- Canvas-specific command-palette entries.
- Undo / redo.
- Multi-select, copy/paste, keyboard editing of edges.
- Cross-canvas backlinks or canvas-aware search.
- Plugins / scripting / sync / publish / URI scheme.
- Schema migration to a v2 canvas shape.

## Risks And Mitigations

- **Risk: Markdown editor regresses.** The workspace currently mounts
  the editor whenever `activePath` is set. Mitigation: route through a
  single `getDocumentKind(path)` helper at the workspace level and add
  a regression test that opening a `.md` file still mounts
  `EditorPane`.
- **Risk: A malformed canvas crashes the pane.** Mitigation:
  defensive `canvasRead` already normalizes; the pane treats every
  field as optional in render code and shows a clear error state on
  unexpected exceptions.
- **Risk: Renderer accidentally imports Node.** Mitigation:
  CanvasPane and its children import only from `src/shared/canvas`,
  `src/renderer/app/api`, and existing renderer modules. Add a
  static check to the test suite.
- **Risk: Dirty-state confusion.** Mitigation: the pane keeps the
  *last loaded* `CanvasFile` snapshot and compares structurally on
  every change; if comparison becomes expensive, drop the affordance
  and ship the read-only renderer.
- **Risk: Scope creep into a full canvas editor.** Mitigation: the
  acceptance criteria below enumerate exactly what must work; drag,
  connect, delete, zoom/pan, and multi-select stay deferred.
- **Risk: Obsidian-format confusion.** Mitigation: the milestone
  doc and the README both state explicitly that `.replica-canvas` is
  Replica-owned and not interoperable with Obsidian's `.canvas`.

## Recommended Implementation Order

1. **Document-kind helper + workspace routing**
   - `getDocumentKind(path)` pure helper + unit test.
   - Workspace shell renders the right pane based on kind.
   - Markdown regression test.
2. **File explorer recognition**
   - Include `.replica-canvas` in the listing.
   - Use the existing open-flow callback.
   - Optional `canvas.new` command/action only if trivial.
3. **CanvasPane read-only render**
   - Load on mount via `canvasRead`.
   - Render text nodes, note nodes, edges via SVG.
   - Loading / error / empty / missing-note states.
   - Unit tests for pure helpers and renderer-safety greps.
4. **Optional minimal writes**
   - Edit text card text inline.
   - Add text card / add note card buttons.
   - Save via `canvasWrite`.
   - Dirty-state tracking + Refresh confirm.
5. **Docs and final gates**
   - `MILESTONE-8B.md`, README, ROADMAP.
   - `npm run check`, `npm run build`, `npm run test:e2e`,
     `npm run dev`.

## Acceptance Criteria

8B is complete when:

- `.replica-canvas` files can be opened from the file explorer.
- The workspace shell renders the CanvasPane for those files and the
  existing editor/preview for Markdown notes.
- Existing text / note nodes render with safe plain-text content.
- Edges render between the correct node pairs.
- Missing-note nodes render defensively without crashing.
- The empty / loading / error states are clear and informative.
- The renderer has not gained filesystem access or raw IPC.
- All canvas persistence still flows through the 8A
  `canvasCreate` / `canvasRead` / `canvasWrite` API.
- No new write path, plugin loader, marketplace, scripting, macro
  system, or media-card capability was introduced.
- Markdown note behaviour (open, edit, save, autosave, preview,
  backlinks, search, tags, outline, properties, Bases, graph) is
  not regressed.
- `npm run check`, `npm run build`, `npm run test:e2e`, and
  `npm run dev` all pass.

## Milestone links

- Previous: [[MILESTONE-8A]]
- Next: [[MILESTONE-8B]]
- Implementation: [[MILESTONE-8B]]
