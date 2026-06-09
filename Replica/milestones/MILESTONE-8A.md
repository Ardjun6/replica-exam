# Milestone 8A - Canvas Schema, Store, IPC, And File Creation

Milestone 8A adds Replica's safe local-first Canvas foundation without building
the full renderer Canvas UI yet.

Canvas files are normal vault documents with Replica's own `.replica-canvas`
extension and versioned JSON schema. This milestone does not copy Obsidian's
Canvas file format or private behavior, and it does not add plugins, scripting,
media cards, embeds, sync, publish, URI handling, or database/spreadsheet
features.

## Delivered Scope

### Shared Canvas Schema

- Added `src/shared/canvas.ts`.
- Defines:
  - `CanvasFile`;
  - `CanvasNode`;
  - `CanvasNoteNode`;
  - `CanvasTextNode`;
  - `CanvasEdge`;
  - `CanvasViewport`;
  - bounded schema constants;
  - `createStarterCanvas`;
  - `normalizeCanvasFile`;
  - safe id/title/text/label/note-path/number normalization helpers.
- Uses schema version `1`.
- Uses Replica-owned extension `.replica-canvas`.
- Does not include group nodes yet.
- Does not include executable, media, embed, or arbitrary HTML card types.

### Normalization And Validation

- Disk normalization is defensive for hand-edited files:
  - invalid top-level input falls back to a starter canvas shape;
  - invalid node ids are dropped;
  - duplicate node ids are dropped;
  - invalid note paths are dropped;
  - invalid edge endpoints are removed;
  - self-links are removed;
  - duplicate edge endpoint pairs are collapsed;
  - text, title, labels, nodes, edges, sizes, coordinates, and viewport zoom are
    bounded;
  - prototype-pollution keys are treated as unsafe.
- IPC write validation is stricter:
  - path must be vault-relative;
  - path must use `.replica-canvas`;
  - schema version must be `1`;
  - ids must be valid;
  - note paths must be safe;
  - node geometry and viewport numbers must be finite;
  - edge endpoints must reference existing nodes;
  - payload size is capped;
  - prototype-pollution keys are rejected before the service runs.

### Main-process Store

- Added `src/main/vault/canvas-store.ts`.
- Store operations:
  - create a starter canvas file at a vault-relative path;
  - read a canvas file and normalize it;
  - write a normalized canvas file;
  - reject traversal/root/config-folder paths;
  - reject non-`.replica-canvas` extensions;
  - report malformed JSON with a clean error.
- Store uses `VaultFs`, so vault-root containment remains enforced by the
  existing filesystem boundary.

### IPC And Preload

- Added typed IPC channels:
  - `canvas:create`;
  - `canvas:read`;
  - `canvas:write`.
- Added `ReplicaApi` methods:
  - `canvasCreate(path, title?)`;
  - `canvasRead(path)`;
  - `canvasWrite(path, canvas)`.
- Added preload wrappers for those methods.
- Added main IPC handlers with existing sender validation and `Result` wrapping.
- Added `VaultService` methods for create/read/write.

No raw IPC is exposed. The renderer remains filesystem-free.

## Changed Files

```text
src/shared/canvas.ts                         (new)
src/shared/ipc-contract.ts                   (Canvas API contract)
src/preload/preload.ts                       (typed preload wrappers)
src/main/ipc/validate.ts                     (Canvas validators)
src/main/ipc/register-ipc.ts                 (Canvas handlers)
src/main/vault/canvas-store.ts               (new)
src/main/vault/vault-service.ts              (Canvas service methods)

tests/canvas-schema.test.ts                  (new)
tests/canvas-store.test.ts                   (new)
tests/validate.test.ts                       (Canvas IPC validator cases)

MILESTONE-8A.md                              (new)
README.md                                    (status / feature summary)
ROADMAP.md                                   (8A status)
ARCHITECTURE.md                              (Canvas foundation section)
```

## Tests Added Or Updated

- `tests/canvas-schema.test.ts` covers:
  - Replica-owned extension and schema version;
  - valid starter canvas creation;
  - normalization defaults;
  - invalid schema version normalization;
  - invalid/missing ids;
  - bounded titles, text, labels, nodes, and edges;
  - non-finite and out-of-range coordinates/sizes/viewport;
  - invalid edge endpoints, self-links, and duplicates;
  - unsafe note paths;
  - prototype-pollution payloads.
- `tests/canvas-store.test.ts` covers:
  - extension enforcement;
  - traversal/root/config-folder rejection;
  - create behavior;
  - no overwrite on create;
  - read normalization;
  - malformed JSON errors;
  - write/read round trip.
- `tests/validate.test.ts` adds Canvas IPC validation coverage for:
  - `.replica-canvas` path validation;
  - optional title validation;
  - valid payload normalization;
  - schema version rejection;
  - invalid ids/types/geometry;
  - overlarge node/text payloads;
  - unsafe note paths;
  - invalid/self/duplicate edges;
  - prototype-pollution keys.

Suite total after 8A: 557 unit tests across 40 test files.

## Quality Gates

- `npm run check` - pass.
- `npm run build` - pass.
- `npm run test:e2e` - pass.
- `npm run dev` - pass, launches and stays alive past startup.

## Deferred To 8B / 8C

- Full Canvas renderer UI.
- `CanvasPane`.
- File explorer create/open integration.
- Workspace tab integration for canvas documents.
- Add note card UI.
- Add text card UI.
- Move/drag cards.
- Connect cards.
- Delete cards and links in the UI.
- Zoom and pan UI.
- Group/background nodes.
- Canvas command-palette commands.
- Canvas-specific undo/redo.
- Canvas import/export.
- Obsidian Canvas compatibility.
- Media cards, embeds, PDFs, images, audio, video, and web previews.
- Collaboration, sync, publish, URI/deep-link behavior.
- Plugins, marketplace, scripting, macros, arbitrary code execution.
- Formulas, relations, rollups, grouping, bulk editing, schema manager,
  database-style actions, or spreadsheet behavior.

## Manual Checks

8A does not add visible Canvas UI yet. Manual verification should focus on:

1. Existing app startup still works.
2. Existing note/editor/file explorer behavior is unchanged.
3. The preload bridge still exposes only typed methods.
4. No renderer component imports Node, Electron, `fs`, or raw `ipcRenderer`.
5. When a later temporary caller invokes `canvasCreate`, a `.replica-canvas`
   file is created as JSON inside the vault.
6. `canvasRead` returns a normalized `CanvasFile`.
7. `canvasWrite` persists normalized JSON and rejects unsafe payloads through
   IPC validation.

## Known Limitations

- `.replica-canvas` files are not yet shown/opened through a dedicated Canvas UI.
- The file explorer still lists Markdown files and folders only.
- Canvas writes replace the whole canvas file; patch-style edits are deferred.
- Note-card paths are not automatically migrated on note rename yet.
- Malformed JSON returns a clean read error rather than attempting repair.

## Milestone links

- Previous: [[MILESTONE-8-PLAN]]
- Next: [[MILESTONE-8B-PLAN]]
