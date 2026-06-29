# Milestone 8B - Canvas Workspace View And Basic Rendering

Milestone 8B adds the first visible Canvas experience on top of the safe
Milestone 8A canvas foundation.

The milestone keeps Canvas local-first and read-focused:

- `.replica-canvas` files are visible in the vault file tree;
- workspace tabs can retain and route canvas document paths;
- opening a `.replica-canvas` file renders a Canvas workspace view;
- text nodes, note nodes, and edges render from Replica's own schema;
- note cards show title/path defensively and mark missing notes;
- Canvas renderer code remains filesystem-free and uses only typed preload APIs.

This milestone does not copy Obsidian Canvas formats, protocols, assets, or
private behavior.

## Implemented

### Document-kind routing

- Added shared document helpers in `src/shared/document.ts`.
- `.md` and `.markdown` are classified as Markdown documents.
- `.replica-canvas` is classified as a Canvas document.
- Workspace tabs still store paths; the renderer derives document kind at render
  time.
- Workspace normalization now accepts Canvas document paths and still rejects
  unsupported or unsafe paths.
- Saved workspace restoration prunes missing Canvas documents using main-owned
  vault file discovery.

### File explorer visibility

- `VaultFs.listTree()` includes `.replica-canvas` files.
- `VaultFs.listMarkdownFiles()` remains Markdown-only, so Canvas files do not
  enter the Markdown index.
- `VaultFs.listCanvasFiles()` supports workspace restore pruning.
- File explorer labels strip `.replica-canvas` for display.
- Canvas rows receive a small `C` badge.
- Duplicated Canvas files can open through the existing explorer open callback.

### Canvas workspace view

Added renderer components under `src/renderer/components/canvas/`:

- `CanvasPane.tsx`;
- `CanvasToolbar.tsx`;
- `CanvasViewport.tsx`;
- `CanvasNodeView.tsx`;
- `CanvasEdgeView.tsx`;
- `canvas-render.ts`.

The Canvas pane:

- loads data with `canvasRead(path)`;
- loads note listings with the existing `listNotes()` method for note-card
  labels and missing-note state;
- renders loading, empty, and error states;
- renders text nodes as literal text;
- renders note nodes with title/path and a disabled state for missing notes;
- renders edges as SVG lines between node centers;
- renders edge labels as text, not HTML;
- does not embed note contents;
- does not use `dangerouslySetInnerHTML`;
- does not import `fs`, `path`, Electron, or `ipcRenderer`.

### Basic write scope

No new Canvas write UI was added in 8B.

Canvas persistence remains limited to the 8A typed methods:

- `canvasCreate(path, title?)`;
- `canvasRead(path)`;
- `canvasWrite(path, canvas)`.

8B uses `canvasRead` for rendering. Add/edit/move/connect/delete interactions
are deferred.

## Tests

Added and updated tests for:

- document-kind classification and display names;
- workspace schema/model support for Canvas document paths;
- file-tree visibility for `.replica-canvas` without Markdown indexing;
- Canvas center-to-center edge geometry;
- Canvas bounds and absolute node styles;
- missing edge endpoint handling;
- text node rendering as escaped literal text;
- note node existing/missing rendering states;
- renderer boundary checks forbidding filesystem, Electron, raw IPC imports, and
  raw HTML injection in Canvas renderer files.

## Deferred To Later Canvas Slices

- New Canvas action in the file explorer.
- Full CanvasPane editing.
- Add Text Card UI.
- Add Note Card UI.
- Inline text-card editing.
- Drag/move.
- Connect handles.
- Delete card/link UI.
- Resize.
- Zoom/pan controls.
- Selection model.
- Command palette Canvas commands.
- Obsidian Canvas import/export or compatibility.
- Media cards, embeds, PDFs, images, audio, video, web previews.
- Plugins, marketplace, sync, publish, URI scheme, scripting, macros, or
  arbitrary code execution.

## Verification

Locally verified:

- `npm run check` passed: 565 tests across 43 files, plus typecheck, lint, and
  format check.
- `npm run build` passed.
- `npm run test:e2e` passed: 1 Playwright/Electron smoke test.
- `npm run dev` launched and stayed alive through startup until the local
  timeout; spawned dev processes were cleaned up afterward.

## Milestone links

- Previous: [[MILESTONE-8B-PLAN]]
- Next: [[MILESTONE-8C-PLAN]]
- Plan: [[MILESTONE-8B-PLAN]]
