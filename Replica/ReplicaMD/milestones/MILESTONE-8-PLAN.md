# Milestone 8 Plan - Canvas Planning And Safe Local Canvas Foundation

Milestone 8 plans a safe local-first Canvas foundation for visually arranging
notes, text cards, and links. The feature must fit Replica's existing
architecture and must use Replica's own versioned schema rather than copying
Obsidian's Canvas format, protocols, assets, or private behavior.

The goal is a small, shippable foundation:

- create and open local canvas files;
- add note cards and text cards;
- move cards on a spatial board;
- connect cards with links;
- delete cards and links;
- keep all persistence behind validated preload IPC;
- keep the renderer filesystem-free.

Milestone 8 should not become a plugin system, a collaboration surface, a
publish/sync feature, or a database/spreadsheet layer.

## Constraints

- Do not rewrite the architecture.
- Do not widen renderer filesystem access.
- Do not expose raw IPC.
- Do not copy Obsidian Canvas file format or private behavior.
- Use Replica's own versioned canvas schema.
- Keep renderer filesystem-free.
- All canvas persistence must go through validated preload IPC.
- Do not add plugin loading.
- Do not add marketplace behavior.
- Do not add sync, publish, URI scheme, or deep-link system.
- Do not add scripting, macros, or arbitrary code execution.
- Do not add formulas, relations, rollups, grouping, bulk editing, or schema
  manager.
- Keep app shippable after each step.

## Current Architecture Relevant To Canvas

Replica is already split into strict layers:

- `src/shared` holds plain data contracts used across processes.
- `src/core` holds pure logic with no Electron, DOM, Node, or filesystem
  dependency.
- `src/main` owns the filesystem, vault, index, watcher, settings, workspace,
  properties, and Bases persistence.
- `src/preload` exposes the audited `ReplicaApi` bridge through
  `contextBridge`.
- `src/renderer` renders React UI and calls only the typed preload API.

Canvas should follow the same shape used by settings, workspace, properties,
and Bases:

- shared schema and validators define the persisted/runtime canvas contract;
- pure helpers normalize and manipulate canvas data;
- main-process store reads/writes canvas files under the vault root;
- IPC handlers validate sender and payload before reaching the store;
- preload exposes typed methods only;
- renderer components never import Node, Electron, `fs`, or raw IPC.

Relevant existing patterns:

- `settings.json`, `workspace.json`, and `bases.json` are versioned and
  defensively normalized.
- `Bases` evaluation stays in main/core and renderer never reads
  `.obsidian-replica/bases.json`.
- note writes use existing validated paths such as `writeNote` and
  `updateNoteProperties`.
- the file explorer already owns create/open flows for vault-relative files and
  should remain the natural place to surface canvas files if possible.
- workspace panes already support tabs and right-pane tools, so Canvas should
  integrate as an opened document/view without changing the whole workspace
  architecture.

## Canvas Goals

### Product Goals

- Let users create a local canvas board inside the vault.
- Let users open canvas files from the app.
- Let users arrange note cards and text cards spatially.
- Let users connect cards with simple directed or undirected links.
- Keep a canvas useful even when note files are renamed or missing by displaying
  stored labels/path references defensively.
- Make the first implementation predictable, keyboard/mouse accessible, and
  easy to test.

### Technical Goals

- Define a Replica-owned `.replica-canvas` JSON schema.
- Keep schema versioning explicit from the first release.
- Normalize malformed or hand-edited canvas files without crashing.
- Keep all path handling vault-relative and validated.
- Keep renderer state plain and serializable.
- Keep renderer filesystem-free.
- Add only narrow, validated canvas IPC.
- Keep Canvas logic isolated enough that it can grow later without disturbing
  editor, properties, Bases, search, or graph features.

## Canvas Non-goals

- Do not copy Obsidian's `.canvas` format.
- Do not import/export Obsidian Canvas in Milestone 8.
- Do not implement plugin or marketplace commands.
- Do not implement scripting, macros, executable cards, or arbitrary code.
- Do not implement sync, publish, collaboration, or URI/deep-link flows.
- Do not implement media cards, embeds, web previews, PDFs, or attachments.
- Do not implement formulas, relations, rollups, grouping, bulk editing, schema
  manager, database-style queries, or spreadsheet behavior.
- Do not implement advanced styling, themes, custom CSS per card, or arbitrary
  HTML cards.
- Do not add a renderer filesystem escape hatch for convenience.

## Replica-owned Canvas Schema

Canvas data should live in a new shared schema module, likely
`src/shared/canvas.ts`.

Recommended top-level shape:

```ts
export interface CanvasFile {
  schemaVersion: 1;
  id: string;
  title: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport?: CanvasViewport;
  createdAt: number;
  updatedAt: number;
}
```

Recommended common node fields:

```ts
interface CanvasNodeBase {
  id: string;
  type: CanvasNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: CanvasColor;
  createdAt: number;
  updatedAt: number;
}
```

Recommended node union:

```ts
type CanvasNode = CanvasNoteNode | CanvasTextNode | CanvasGroupNode;

interface CanvasNoteNode extends CanvasNodeBase {
  type: 'note';
  path: string;
  title?: string;
}

interface CanvasTextNode extends CanvasNodeBase {
  type: 'text';
  text: string;
}

interface CanvasGroupNode extends CanvasNodeBase {
  type: 'group';
  label: string;
}
```

Recommended edge shape:

```ts
interface CanvasEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string;
  color?: CanvasColor;
  createdAt: number;
  updatedAt: number;
}
```

Recommended viewport shape:

```ts
interface CanvasViewport {
  x: number;
  y: number;
  zoom: number;
}
```

### Schema Rules

- `schemaVersion` is required and currently only `1`.
- Unknown versions normalize safely or fail with a user-facing error rather
  than crashing.
- Node and edge ids are app-generated opaque strings.
- Node positions and sizes are finite bounded numbers.
- Text card content is plain Markdown text, not HTML.
- Note card paths are vault-relative note paths and must pass existing path
  validation.
- Edge endpoints must reference existing node ids after normalization.
- Labels, text, ids, colors, node counts, edge counts, and dimensions must be
  bounded.
- Prototype-pollution keys must be rejected or stripped consistently with
  existing schema validators.
- Unknown fields should not become executable behavior.

### Initial Limits

Set conservative constants in the shared schema:

- maximum nodes per canvas;
- maximum edges per canvas;
- maximum text card length;
- maximum label length;
- maximum title length;
- maximum absolute coordinate / size bounds;
- minimum and maximum card sizes;
- minimum and maximum zoom.

These limits protect renderer layout, IPC payload size, and malformed file
recovery without adding database-like complexity.

## Persistence Location And File Extension

### Extension Decision

Use Replica's own extension:

```text
.replica-canvas
```

Rationale:

- clearly belongs to Replica;
- avoids copying Obsidian's `.canvas` format;
- makes compatibility expectations explicit;
- keeps the file inspectable as JSON;
- leaves room for documented import/export later.

### Location Decision

Canvas files should be normal vault documents, not hidden config.

Recommended:

- users can create `Board.replica-canvas` anywhere in the vault;
- the file explorer can display and open `.replica-canvas` files;
- canvas content is user data, not app configuration;
- `.obsidian-replica/` remains for Replica settings/workspace/internal files.

Do not store all canvases in `.obsidian-replica/` unless a later design finds a
strong reason. Users should be able to move, back up, and version canvas files
alongside notes.

### File Contents

The file should be UTF-8 JSON matching `CanvasFile`.

Rules:

- writes replace the complete normalized canvas file;
- no binary data in Milestone 8;
- no embedded note contents;
- no external media fetches;
- no hidden sidecar persistence file.

## Main-process Store And Validation

Add a main-process store/service surface only as narrow as needed.

Possible files:

- `src/main/vault/canvas-store.ts`;
- canvas methods in `src/main/vault/vault-service.ts`;
- validators in `src/main/ipc/validate.ts`;
- IPC registrations in `src/main/ipc/register-ipc.ts`.

Recommended store responsibilities:

- read a canvas file by vault-relative path;
- normalize it through `normalizeCanvasFile`;
- write a complete normalized canvas file;
- create a new starter canvas file;
- optionally list/open through existing tree mechanisms if `.replica-canvas`
  files are included in the vault tree.

Recommended IPC methods:

- `canvas:create(path, title?)`;
- `canvas:read(path)`;
- `canvas:write(path, canvas)`;

Keep the surface small. Avoid one IPC method per interaction unless full-file
writes become measurably problematic. A full-file write path is easier to audit
and keeps the first milestone shippable.

Validation expectations:

- sender check remains required;
- path is vault-relative and safe;
- extension must be `.replica-canvas`;
- payload must match bounded `CanvasFile`;
- write path must normalize before persisting;
- all errors cross IPC as `Result`, not thrown exceptions;
- renderer receives clean `Error` instances through preload unwrapping.

Do not:

- expose raw filesystem paths;
- expose raw `ipcRenderer`;
- let renderer pick arbitrary absolute files;
- add direct renderer reads/writes;
- add executable card behavior.

## Renderer Components And Interactions

Suggested renderer structure:

```text
src/renderer/components/canvas/
  CanvasPane.tsx
  CanvasToolbar.tsx
  CanvasViewport.tsx
  CanvasNodeView.tsx
  CanvasEdgeView.tsx
  canvas-model.ts
  canvas-interactions.ts
```

Suggested pure helpers:

- create starter canvas state;
- create note/text node drafts;
- move node by delta;
- resize node if resizing is included;
- create/delete edge;
- delete node and incident edges;
- clamp viewport zoom;
- hit-test or selection helpers if needed.

### Rendering Approach

For Milestone 8, prefer a simple dependency-light implementation:

- HTML/CSS absolutely positioned nodes inside a pannable canvas surface;
- SVG overlay for edges;
- pointer events for drag/move/connect;
- state updates kept in React and saved through validated API;
- no heavy graph/canvas dependency unless measurement or complexity justifies it.

Do not use arbitrary HTML injection. Text cards may render as editable textarea
or plain Markdown text in the first slice; full Markdown preview inside cards
can be deferred.

### Workspace Integration

Options to evaluate:

- open `.replica-canvas` files in the existing workspace pane system as a new
  document kind;
- reuse active tab/pane infrastructure where possible;
- let file explorer click route canvas files to a Canvas view instead of the
  Markdown editor;
- keep notes and canvases distinct in state so Markdown editor assumptions do
  not leak into canvas files.

Do not force a workspace rewrite. If the existing tab model assumes Markdown
paths too deeply, implement a minimal canvas-opening path that is isolated and
document the remaining integration work.

## Card And Link Types

### Note Card

In scope for Milestone 8.

Fields:

- node id;
- vault-relative note path;
- optional cached title/label;
- position and size.

Behavior:

- created by selecting an existing note or inserting the active note;
- displays title/path defensively;
- double click or Open action opens the note through existing workspace note
  open behavior;
- if the note is missing, card remains visible with a missing state.

Do not embed note file contents in the canvas file.

### Text Card

In scope for Milestone 8.

Fields:

- node id;
- plain text or Markdown string;
- position and size.

Behavior:

- editable inside the canvas;
- saved as part of the canvas file;
- bounded length;
- no arbitrary HTML or script execution.

### Link / Edge

In scope for Milestone 8.

Fields:

- edge id;
- source node id;
- target node id;
- optional label;
- optional color from a constrained palette.

Behavior:

- connect two existing nodes;
- render as SVG line/path;
- delete selected link;
- optional label display if simple.

Directionality should be explicit in the schema even if the first UI renders
simple lines. Pick one behavior and document it.

### Group / Background

Optional and safe only if small.

Possible group node:

- non-executable visual rectangle;
- label;
- position and size;
- no membership model in the first slice.

Default recommendation:

- defer groups/backgrounds unless they are needed for basic UX;
- if included, make them simple bounded nodes with no nesting semantics.

## Basic Interactions

### Create Canvas

In scope.

Possible flow:

- file explorer New Canvas action;
- command palette command later if command wiring is clean;
- create `Untitled.replica-canvas` in current folder or vault root;
- write starter `CanvasFile` through `canvas:create`;
- open the new canvas in the workspace.

### Open Canvas

In scope.

Possible flow:

- clicking a `.replica-canvas` file opens Canvas view;
- workspace can track active canvas path separately from note paths if needed;
- malformed canvas shows recoverable error state, not a crash.

### Add Note Card

In scope.

Possible flow:

- toolbar button;
- choose from existing note list using existing suggestion/search helper if
  available;
- add active note as a card if a note is active;
- card path validated before save.

### Add Text Card

In scope.

Possible flow:

- toolbar button creates a text card near viewport center;
- text edit is inline and local to the canvas state;
- save writes the whole canvas through validated IPC.

### Move Cards

In scope.

Behavior:

- pointer drag updates selected card position;
- positions are clamped to schema bounds;
- save after drag can be immediate, debounced, or explicit depending on existing
  autosave patterns;
- keep app shippable with one predictable save model.

### Connect Cards

In scope if small.

Possible flow:

- select source card and drag from a handle to target card;
- or select two cards and click Connect;
- reject self-links unless explicitly allowed;
- reject duplicate edges if that keeps behavior clearer.

### Delete Card / Link

In scope.

Behavior:

- deleting a node also deletes incident edges;
- deleting a link removes only that edge;
- destructive actions should be undoable later, but Milestone 8 may rely on
  confirmation or simple selection/delete behavior if undo is deferred.

### Zoom And Pan

Optional if small.

Recommended:

- include basic pan and zoom only if it does not destabilize card drag/connect;
- clamp zoom;
- store viewport in the canvas file if useful;
- otherwise defer advanced viewport behavior and keep a large scrollable board.

## Tests Needed

### Schema Normalization

Add tests for:

- valid starter canvas normalizes unchanged;
- missing optional fields receive defaults;
- invalid schema version fails or normalizes safely;
- invalid ids are rejected or regenerated by normalization;
- oversized node/edge/text/label arrays are bounded;
- non-finite positions and sizes are clamped or rejected;
- edge endpoints pointing to missing nodes are removed;
- note paths must be vault-relative safe paths;
- prototype-pollution keys are rejected.

### Store Read / Write

Add tests for main store helpers:

- missing canvas file behavior;
- malformed JSON behavior;
- valid read normalizes;
- write persists normalized JSON;
- create writes starter schema;
- extension enforcement;
- vault traversal rejection.

### IPC Validation

Add tests for:

- `canvas:create` path validation;
- `canvas:read` path validation;
- `canvas:write` payload validation;
- extension must be `.replica-canvas`;
- oversized payload rejected;
- prototype-pollution payload rejected;
- sender validation follows existing IPC pattern.

### Renderer Pure Helpers

Add tests for:

- add text node;
- add note node;
- move node;
- delete node and incident edges;
- add/delete edge;
- reject duplicate/self edge if chosen;
- clamp viewport zoom;
- selection behavior if implemented as pure helpers.

### No Raw Filesystem Access

Regression checks:

- renderer canvas files do not import `fs`, `path`, Electron, or raw
  `ipcRenderer`;
- preload exposes only typed canvas methods;
- renderer calls `api().canvas...` wrappers instead of filesystem APIs.

## Risks And Mitigations

### Risk: Accidentally Copying Obsidian Canvas Format

Mitigation:

- use `.replica-canvas`;
- define independent field names and behavior;
- document non-compatibility;
- avoid importing/exporting Obsidian format in Milestone 8.

### Risk: Renderer Filesystem Boundary Expands

Mitigation:

- persistence only through validated preload IPC;
- no direct `fs` imports in renderer;
- add regression checks for forbidden imports.

### Risk: Workspace Assumptions Are Markdown-specific

Mitigation:

- inspect workspace tab/path model first;
- add a minimal document-kind distinction only if needed;
- avoid rewriting the workspace architecture;
- keep a shippable fallback if full tab integration is too large.

### Risk: Drag/Zoom Complexity Destabilizes The UI

Mitigation:

- implement movement before zoom/pan;
- keep simple pointer handlers;
- defer advanced viewport behavior if it threatens stability;
- test pure coordinate helpers.

### Risk: Full-file Writes Become Heavy

Mitigation:

- set conservative node/edge limits;
- debounce drag saves if needed;
- keep write path simple for Milestone 8;
- consider patch-style persistence only in a later performance milestone.

### Risk: Canvas Becomes A Hidden Plugin/Scripting Surface

Mitigation:

- text cards are text only;
- no executable cards;
- no arbitrary HTML;
- no custom JS/macros;
- no plugin command registration.

### Risk: Note Renames Break Cards

Mitigation:

- note cards store vault-relative paths and optional display labels;
- missing notes render a clear missing state;
- automatic path repair can be deferred unless existing rename flow can update
  references cleanly.

## Recommended Implementation Order

### Step 1 - Inspect Existing File And Workspace Assumptions

- Read file explorer open/create logic.
- Read workspace pane/tab path model.
- Read preload API contract and IPC registration patterns.
- Decide how `.replica-canvas` appears in the tree and opens in the UI.

### Step 2 - Define Shared Canvas Schema

- Add `src/shared/canvas.ts`.
- Define `CanvasFile`, node/edge unions, viewport, constants, and normalizers.
- Add schema normalization tests first.

### Step 3 - Add Pure Canvas Helpers

- Add pure helper module under `src/core/canvas` or renderer-local helpers if
  the logic is UI-only.
- Cover add/move/delete/connect behavior with unit tests.

### Step 4 - Add Main Store

- Add `canvas-store.ts`.
- Read/write/create `.replica-canvas` files through existing vault filesystem
  protections.
- Add store tests.

### Step 5 - Add Validated IPC And Preload API

- Add typed shared IPC contract entries.
- Add validators.
- Register handlers.
- Expose typed preload methods.
- Add IPC validation tests.

### Step 6 - Renderer Canvas View

- Add `CanvasPane` and supporting components.
- Render nodes and edges.
- Add basic selection and toolbar.
- Keep renderer state serializable and filesystem-free.

### Step 7 - File Explorer / Workspace Integration

- Show `.replica-canvas` files.
- Create/open canvas files through existing UI patterns.
- Route note cards back to existing note-open behavior.

### Step 8 - Basic Interactions

- Add text card.
- Add note card.
- Move cards.
- Connect cards.
- Delete cards/links.
- Add zoom/pan only if still small and stable.

### Step 9 - Documentation And Gates

- Create `MILESTONE-8.md` after implementation.
- Update README, ROADMAP, and ARCHITECTURE.
- Run `npm run check`, `npm run build`, `npm run test:e2e`, and
  `npm run dev`.

## Explicit Deferrals

- Obsidian Canvas compatibility.
- Obsidian `.canvas` import/export.
- Plugins.
- Marketplace.
- Sync.
- Publish.
- Collaboration.
- URI scheme or deep links.
- Scripting.
- Macros.
- Arbitrary code execution.
- Advanced styling.
- Theme packages for canvas.
- Embeds.
- Media cards.
- PDF/image/audio/video cards.
- Web previews.
- Formula, relation, rollup, grouping, bulk editing, and schema-manager
  features.
- Database or spreadsheet actions.
- Automated graph layout.
- Advanced routing/orthogonal edges.
- Full undo/redo history for canvas edits unless trivial through existing
  patterns.
- Cross-file backlinks generated from canvas edges.
- Rename-aware automatic note-card path migration unless it is cleanly available
  through existing rename flows.

## Acceptance Criteria

Milestone 8 is complete when:

- Canvas uses Replica's own versioned schema.
- Canvas files use the chosen Replica-owned extension, preferably
  `.replica-canvas`.
- Renderer filesystem access remains unchanged.
- No raw IPC is exposed.
- All canvas persistence goes through typed, validated preload IPC.
- Main process owns canvas file reads/writes.
- Canvas schema normalization is covered by tests.
- Store read/write behavior is covered by tests.
- IPC validation is covered by tests.
- Renderer pure interaction helpers are covered by tests.
- Users can create and open a local canvas.
- Users can add note cards and text cards.
- Users can move cards.
- Users can connect cards with links.
- Users can delete cards and links.
- Malformed canvas files fail safely or normalize without crashing the app.
- No plugin, marketplace, sync, publish, URI, scripting, macro, or arbitrary
  code execution surface is introduced.
- No formulas, relations, rollups, grouping, bulk editing, schema manager, or
  database/spreadsheet features are introduced.
- The app remains shippable after each implementation step.
- Final gates pass.

## Milestone links

- Previous: [[MILESTONE-7.1]]
- Next: [[MILESTONE-8A]]
