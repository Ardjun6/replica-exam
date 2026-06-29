# Milestone 8D Plan - Canvas Connect, Viewport, And Editing Polish

Milestone 8D adds the next safe Canvas polish slice on top of 8A/8B/8C:

- connect two existing canvas nodes through visible handles;
- improve Canvas editing affordances and states;
- add basic zoom controls using the existing schema v1 `viewport.zoom`;
- keep all persistence on the existing `canvasWrite(path, canvas)` path;
- keep the renderer filesystem-free and avoid new IPC/preload APIs.

No schema change is planned. `CanvasFile.schemaVersion` stays `1`.

## Current 8C State

- `canvas-edit.ts` owns pure immutable add/edit/move/delete helpers and already
  includes `generateCanvasEdgeId`.
- `CanvasPane` owns loaded canvas state, single selection, inline text editing
  state, dirty/save/error state, external-change notices, and explicit plus
  debounced saves.
- `CanvasViewport` renders nodes/edges, handles node dragging, clears
  selection, and delegates node/edge selection.
- `CanvasEdgeView` renders selectable SVG edges.
- The latest 8C hardening gates `REPLICA_TEST_VAULT` away from packaged builds,
  improves edge/node pointer interaction, and makes Canvas E2E cleanup and
  save-error paths deterministic.
- Known limitations: users cannot create new edges from the UI; viewport is
  static despite persisted `viewport`; empty canvas and selected states can be
  clearer; resize, pan, multi-select, copy/paste, undo/redo, groups, media,
  command-palette Canvas commands, and Obsidian compatibility remain deferred.

## Connect Via Handles

Add connection handles to node cards without changing the schema:

- render a small output handle on each node, distinct from drag/select targets;
- pointer down starts a connection draft with source node and pointer position;
- pointer move updates a preview line in canvas coordinates;
- hovering a different node marks it as a valid target;
- pointer up on a valid target creates an edge;
- pointer up on empty space, source node, invalid target, or duplicate pair
  cancels cleanly;
- use existing `CanvasEdge` fields: `id`, `fromNodeId`, `toNodeId`,
  `createdAt`, `updatedAt`;
- generate ids with the existing edge id helper;
- save through the existing dirty/debounced/explicit save model;
- select the newly created edge after creation.

Pure helper work:

- `canConnectNodes(canvas, fromNodeId, toNodeId): boolean`
- `hasDuplicateEdge(canvas, fromNodeId, toNodeId): boolean`
- `createEdge(canvas, fromNodeId, toNodeId, options):
  { canvas: CanvasFile; edgeId: string | null }`

Rules:

- reject self-links;
- reject duplicate directed edges with the same `fromNodeId -> toNodeId`;
- allow the reverse direction unless later UX decides otherwise;
- no-op on missing node ids;
- do not mutate input canvas;
- bump `updatedAt` on the edge and file when an edge is created;
- rely on `normalizeCanvasFile` as the final validator before `canvasWrite`.

## Viewport Polish

Add zoom controls only for 8D.

- Toolbar buttons: Zoom out, Reset zoom, Zoom in.
- Use shared bounds `CANVAS_MIN_ZOOM` and `CANVAS_MAX_ZOOM`.
- Persist zoom through `canvas.viewport.zoom` using the same save model.
- Do not implement pan buttons or drag panning in 8D.
- Do not change `viewport.x/y` except preserving existing values.
- Convert drag deltas using zoom: `canvasDelta = screenDelta / viewport.zoom`.
- Render zoom with a contained CSS transform while keeping persisted node
  coordinates in canvas units.
- Keep edge preview and geometry in the same canvas coordinate space.
- Reset zoom sets `viewport.zoom` to `1`.

Pure helper work:

- `clampCanvasZoom(value): number`
- `setViewportZoom(canvas, zoom, now): CanvasFile`
- `zoomViewport(canvas, factor, now): CanvasFile`
- `resetViewportZoom(canvas, now): CanvasFile`
- `screenDeltaToCanvasDelta(dx, dy, zoom): { dx; dy }`

## Editing Polish

- Improve selected node/edge visuals during connect mode and after edge
  creation.
- Keep toolbar disabled states explicit for save, delete, add active note, start
  link, and zoom controls.
- Preserve existing dirty/save/error behavior.
- Keep Retry and Dismiss behavior for save errors.
- Preserve external-change notice behavior: dirty canvases do not silently
  reload.
- Keep Add text card visible and enabled whenever the canvas is ready.
- Improve missing-note card styling/copy and keep Open disabled when missing.
- Preserve pointer-event hardening: edge hit targets remain clickable and nodes
  remain draggable/selectable.

## Tests

Unit tests:

- `createEdge` creates a valid directed edge and returns the new edge id;
- `createEdge` rejects self-links, duplicates, and missing node ids;
- created edge bumps timestamps and does not mutate input;
- `canConnectNodes` matches the same rules;
- edge selection/delete helper behavior still works;
- zoom helpers clamp, multiply, reset, and convert drag deltas;
- `isDirty` detects viewport zoom changes.

Component/E2E tests:

- connection handle starts a draft without selecting/dragging the node;
- preview renders while connecting;
- releasing on a valid target creates and selects an edge;
- duplicate/source/empty releases cancel without saving;
- zoom buttons update dirty state and save path;
- drag still moves cards correctly after zoom;
- renderer boundary tests still reject filesystem/raw IPC/HTML injection.

## Documentation And Deferrals

Create `MILESTONE-8D.md` after implementation and update `README.md`,
`ROADMAP.md`, and `ARCHITECTURE.md` if the architecture notes need the connect
or zoom details.

Explicitly deferred:

- pan controls and drag panning;
- resize handles;
- multi-select;
- copy/paste;
- full undo/redo;
- groups/backgrounds/frames;
- media/embed cards;
- Canvas command-palette commands;
- cross-canvas backlinks/search;
- collaboration, sync, publish, URI/deep-link support;
- plugins, scripting, macros, marketplace;
- formulas, relations, rollups, grouping, bulk editing, schema manager,
  database/spreadsheet behavior;
- Obsidian import/export compatibility;
- schema v2 unless a later milestone proves it is unavoidable.

## Acceptance Criteria

Milestone 8D is complete when:

- users can create an edge between two different nodes through the Canvas UI;
- self-links and duplicate directed links are rejected;
- created edges persist through the existing `canvasWrite` path;
- zoom in/out/reset works, clamps to shared bounds, and persists safely;
- node drag still works correctly after zoom;
- existing 8C add/edit/move/delete/save/error/refresh behavior is not regressed;
- edge selection and deletion still work;
- Canvas E2E remains reliable and existing smoke E2E passes;
- renderer filesystem access is unchanged;
- no raw IPC, new write path, plugin/scripting/sync/publish/URI/media/embed or
  database behavior, or Obsidian compatibility is introduced;
- all final gates pass.

## Milestone links

- Previous: [[MILESTONE-8C]]
- Next: [[MILESTONE-8D]]
- Implementation: [[MILESTONE-8D]]
