# Milestone 8D - Canvas Connect, Viewport, And Editing Polish

Milestone 8D adds edge creation and basic viewport zoom polish to Replica's
local `.replica-canvas` editor. The schema remains version `1`, no new
IPC/preload API was added, and all persistence still flows through the existing
typed `canvasWrite(path, canvas)` path.

## Delivered Scope

### Connect via handles

- Each canvas node now renders a small link handle that starts a connection
  draft without selecting or dragging the card.
- Dragging from a handle shows a preview line in canvas coordinates.
- Releasing on a different valid node creates a directed edge and selects the
  newly created edge.
- Releasing on empty space, the source node, a missing node, or an existing
  duplicate directed pair cancels cleanly.
- Reverse-direction edges are allowed because duplicates are scoped to the same
  `fromNodeId -> toNodeId` pair.
- Edge creation uses the existing schema v1 `CanvasEdge` fields and the same
  dirty, explicit-save, and debounced-save model added in 8C.

### Pure editing helpers

`src/renderer/components/canvas/canvas-edit.ts` now exports:

- `hasDuplicateEdge(canvas, fromNodeId, toNodeId)`
- `canConnectNodes(canvas, fromNodeId, toNodeId)`
- `createEdge(canvas, fromNodeId, toNodeId, options)`
- `clampCanvasZoom(value)`
- `setViewportZoom(canvas, zoom, now)`
- `zoomViewport(canvas, factor, now)`
- `resetViewportZoom(canvas, now)`
- `screenDeltaToCanvasDelta(dx, dy, zoom)`

The helpers are immutable, bounded by shared Canvas constants, and no-op on
missing or invalid inputs.

### Viewport zoom

- The Canvas toolbar now has Zoom out, Reset zoom, and Zoom in controls.
- Zoom is clamped with `CANVAS_MIN_ZOOM` and `CANVAS_MAX_ZOOM`.
- Zoom persists through existing schema v1 `canvas.viewport.zoom`.
- `viewport.x` and `viewport.y` are preserved; 8D does not add pan controls or
  drag panning.
- Node drag remains stable after zoom by converting screen deltas back into
  canvas-space deltas before calling `moveNode`.
- Edges and connection previews continue to use canvas-space geometry.

### Editing polish

- Selected nodes and valid connection targets have clearer visual states.
- Toolbar disabled states now cover Start link, Cancel link, and zoom controls
  in addition to existing add/delete/save/refresh states.
- Empty canvases still keep Add text card available whenever the canvas is
  ready.
- Save errors, Retry/Dismiss, dirty state, and external-change notices continue
  to use the 8C model.
- Missing-note cards stay defensive; opening remains disabled when the note is
  missing.

## Constraints Respected

- `CanvasFile.schemaVersion` remains `1`.
- No new IPC channel, preload method, persistence file, or write path.
- Renderer filesystem access remains unchanged.
- Canvas writes still call `api().canvasWrite(path, normalizeCanvasFile(canvas))`.
- No raw IPC is exposed.
- No plugin, scripting, macro, marketplace, sync, publish, URI, media/embed,
  formula, relation, rollup, grouping, bulk editing, schema-manager,
  database/spreadsheet, or Obsidian compatibility surface was added.
- Resize, pan, multi-select, copy/paste, undo/redo, groups, media cards, command
  palette Canvas commands, and Obsidian import/export remain deferred.

## Changed Files

```text
src/renderer/components/canvas/canvas-edit.ts
src/renderer/components/canvas/CanvasPane.tsx
src/renderer/components/canvas/CanvasToolbar.tsx
src/renderer/components/canvas/CanvasViewport.tsx
src/renderer/components/canvas/CanvasNodeView.tsx
src/renderer/styles/app.css

tests/canvas-edit.test.ts
tests/e2e/canvas.spec.ts

MILESTONE-8D-PLAN.md
MILESTONE-8D.md
README.md
ROADMAP.md
ARCHITECTURE.md
```

## Tests

Added or extended coverage for:

- creating a directed edge;
- rejecting self-links;
- rejecting duplicate directed edges;
- no-op behavior for missing node ids;
- immutable edge creation with updated timestamps;
- zoom clamping, zoom multiplication, reset zoom, and screen-to-canvas drag
  delta conversion;
- dirty detection for viewport zoom changes;
- Canvas E2E workflow covering zoom, handle-based edge creation, persistence
  after save/refresh, edge deletion, drag after zoom, save-error handling, and
  dirty-refresh confirmation.

## Deferred

- Pan controls and drag panning.
- Resize handles.
- Multi-select.
- Copy/paste.
- Full undo/redo.
- Groups/backgrounds/frames.
- Media/embed cards.
- Canvas command-palette commands.
- Cross-canvas backlinks/search.
- Collaboration, sync, publish, URI/deep-link support.
- Plugins, scripting, macros, marketplace.
- Formulas, relations, rollups, grouping, bulk editing, schema manager, and
  database/spreadsheet behavior.
- Obsidian Canvas import/export compatibility.
- Schema v2.

## Manual Checks

- Open a `.replica-canvas` file and create a link by dragging from one node's
  handle to another node.
- Try linking a node to itself and confirm no edge appears.
- Try linking the same directed pair twice and confirm no duplicate edge appears.
- Use Zoom in, Zoom out, and Reset zoom, then save and refresh to confirm zoom
  persists.
- Drag a node while zoomed in and confirm movement remains proportional.
- Select and delete an edge after creating it.

## Milestone links

- Previous: [[MILESTONE-8D-PLAN]]
- Next: [[MILESTONE-9-PLAN]]
- Plan: [[MILESTONE-8D-PLAN]]
