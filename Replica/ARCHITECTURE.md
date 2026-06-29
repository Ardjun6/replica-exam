# Architecture

Replica is an Electron app split into four cooperating parts with deliberately
strict boundaries. The guiding rule: **pure logic is testable and portable, the
main process owns the disk and the index, the preload bridge is the single
audited choke point, and the renderer only renders.**
```
src/
  shared/    Typed contracts shared by every process (no behaviour)
  core/      Pure logic — zero Electron, zero DOM, fully unit-tested
  main/      Electron main process — lifecycle, windows, IPC, filesystem, index
  preload/   contextBridge — the only code touching both Node and the renderer
  renderer/  React UI — explorer, editor, preview, backlinks, search, graph
tests/       Vitest unit tests + a Playwright e2e smoke test
```

## Why these boundaries

Mixing filesystem access, parsing, and UI in one place is how knowledge apps rot.
Replica keeps them apart so each can be reasoned about and tested on its own, and
so the security-sensitive surface stays small enough to audit.

### `shared/` — the contract

Plain data types and constants imported from anywhere without dragging in
platform dependencies:

- `domain.ts` — vault entries, parsed/resolved links, note index, search result,
  graph data.
- `ipc-contract.ts` — the channel-name constants and the `ReplicaApi` interface.
  This is the single source of truth for the main↔renderer boundary: change a
  payload here and it’s a compile error everywhere it’s used.
- `settings.ts` — the persisted settings schema, its version, and a
  `normalizeSettings` that makes a hand-edited or older file impossible to crash
  on. The current schema is v6, including note-mode migration and built-in
  local appearance-module settings.
- `workspace.ts` - the persisted workspace schema (tabs, panes, split tree,
  history), its version, and a defensive `normalizeWorkspace`.
- `properties.ts` - normalized property value shapes and frontmatter error
  records carried by `NoteIndex`.
- `bases.ts` - versioned Bases-view schema (`BasesFile`, `BaseDefinition`,
  `BaseFilter`, `BaseColumn`, `BaseSort`, plus the `BaseResult` data shapes
  produced by the pure query engine). Includes a defensive
  `normalizeBasesFile` so a hand-edited or older bases.json cannot crash
  the app.
- `result.ts` — a tiny `Result<T>` so errors cross IPC as data, never as thrown
  exceptions.

### `core/` — pure logic

No imports from Electron or the DOM. Given the same input it always produces the
same output, which is why it carries the unit tests.

- `path/vault-path.ts` — normalizes vault-relative paths and **rejects traversal
  and absolute paths**. This is the first line of the security boundary.
- `markdown/` — focused parsers: `wikilinks` (the full `[[…]]` grammar, masking
  code spans/blocks), `frontmatter` (a real YAML parser behind a narrow wrapper
  that reports errors as data), and `tags` (inline tags, headings, block ids,
  frontmatter tag/alias normalization), and `live-preview` (a block parser and
  range patcher for the 9.1 block-focused Live Preview surface).
- `index/` — `note-parser` composes the parsers into a `NoteIndex`; `vault-index`
  holds all notes and resolves a link target to a path (by path, then unique base
  name, then alias); `backlinks` computes who-links-here with context.
- `search/` — AND-matching, title-weighted scoring, snippet extraction.
- `graph/` — turns the index into nodes and edges (including dim nodes for
  unresolved targets), sharing the same resolution logic as backlinks.
- `workspace/` - pure tab, split-pane, resize, and per-pane history helpers.
  React calls these helpers instead of mutating workspace layout directly.
- `properties/` - pure normalization from arbitrary YAML values to the typed
  property model used by the index and renderer.
- `bases/` - pure query engine for Bases views: `base-query.ts` (filter
  evaluation), `base-rows.ts` (display/cell formatting), and
  `base-sort.ts` (stable one-column sort with empty-last behavior). All
  three run against `NoteIndex[]` snapshots passed in by the main process;
  they have no filesystem or Electron dependency.

### `main/` — the privileged process

The only place allowed to touch the filesystem.

- `vault/vault-fs.ts` — every read/write goes through here, and every path is
  re-validated and re-anchored to the vault root (`toAbsolute`) as
  defence-in-depth even though `core/path` already validated it. Hidden/config
  files are filtered from the tree.
- `vault/config-store.ts` — reads and writes `.obsidian-replica/settings.json`.
- `vault/workspace-store.ts` - reads and writes
  `.obsidian-replica/workspace.json`, normalizing malformed workspace state
  before it reaches the renderer.
- `vault/bases-store.ts` - reads and writes
  `.obsidian-replica/bases.json`. Missing or malformed files normalize to
  an empty `BasesFile` so the vault always opens; writes always persist
  the normalized current schema. Renderer never touches this file
  directly — `VaultService.runBase` evaluates the saved definition
  against the in-memory `Indexer` snapshot via the pure `core/bases`
  engine.
- `indexer/indexer.ts` — owns a `VaultIndex`, rebuilds it from disk, and updates
  it per file; also serves tag counts (`collectTags`) and wikilink suggestions
  (`suggestLinks`). `indexer/watcher.ts` watches `fs.watch` and, as of Milestone
  2, emits a **typed per-path, debounced event** (`VaultChangeEvent`) rather than
  a single global "rescan" signal, so the service updates only the changed note.
  It ignores the config folder and supports `ignore(path)` so the app's own
  writes are not mistaken for external edits (no save echo). Cross-platform
  `fs.watch` cannot classify events reliably, so the service stats the path to
  distinguish edit/create from delete; chokidar is the documented upgrade for
  very large vaults (ROADMAP M10).
- `vault/vault-service.ts` — orchestrates fs + config + indexer + watcher behind
  one API the IPC layer calls. Handles external changes incrementally and
  suppresses self-writes. Seeds a welcome note for new vaults.
- `ipc/validate.ts` + `ipc/register-ipc.ts` — every handler **checks the sender
  is our own window**, **validates the payload**, runs the operation, and returns
  a `Result`. Dialog-driven channels (open/create vault) live here because they
  need the window. The typed external-link channel accepts only `http`, `https`,
  and `mailto` before delegating to `shell.openExternal`.
- `window.ts` — the security baseline: `contextIsolation: true`, `sandbox: true`,
  `nodeIntegration: false`, a strict CSP, external links forced to the OS
  browser, and no arbitrary in-app navigation.
- `main.ts` — app lifecycle and a single-instance lock.

### `preload/` — the audited bridge

`preload.ts` exposes **exactly** the `ReplicaApi` methods via `contextBridge` and
nothing else — no `fs`, no `shell`, no raw `ipcRenderer`, no arbitrary channels.
Each method unwraps the `Result` and throws a clean `Error` so renderer code uses
ordinary `try/catch`.

### `renderer/` — the UI

React, with no knowledge of the filesystem. It calls `window.replica` (wrapped by
`app/api.ts`) and never anything lower.

- `app/store.ts` — a small `useSyncExternalStore` store for shared UI state
  (open vault, settings, workspace, derived active note, right-pane tab). Easy
  to replace if the app grows.
- `app/actions.ts` — wraps the bridge and updates the store; also applies the
  theme to the document root.
- `editor/createEditor.ts` — a CodeMirror 6 factory (history, search, fold,
  line-wrap, Markdown, theme via a compartment, `Mod-s` save).
- `editor/preview.ts` — Markdown → **sanitized** HTML (DOMPurify) with wikilink
  and callout preprocessing; wikilinks become `data-wikilink` anchors the React
  layer intercepts.
- `components/` — `FileExplorer`, `MarkdownNotePane` (Live Preview, Source, and
  Reading mode composition), `EditorPane` (debounced Source-mode autosave),
  `LivePreviewPane` (CodeMirror decoration-based rendered editing),
  `PreviewPane` (read-only sanitized preview that resolves and click-routes
  wikilinks), `workspace/` (tabs, split panes, resize handles), `PropertiesPane`
  (hidden from the visible right sidebar but retained for internals), `bases/`
  (Bases pane, list, table, editor, filter/column/sort sub-controls),
  `BacklinksPane`, `SearchPane`, `TagsPane`, `GraphView`, `HistoryPane`,
  `CalendarPane`, `FolderHomePane`, `RightPane`, `StatusBar`, `VaultChooser`.

## Data flow

```
disk ──▶ VaultFs ──▶ Indexer/VaultIndex ──▶ VaultService
                                               │  (Result)
                                          register-ipc  ◀── sender + payload checks
                                               │
                                          preload bridge (contextBridge)
                                               │  (unwraps Result)
                                          window.replica ──▶ app/api ──▶ actions/store
                                               │
                                          React components
```

Edits flow back the same way: the editor calls `writeNote`, the main process
writes the file and re-indexes it, the watcher (or the explicit write) prompts a
refresh, and the panes re-fetch backlinks, search, and graph against the new
content. State stays one-way; each pane owns its own fetching keyed off a
`refreshKey`.

## The vault root is the security boundary

Two independent checks protect against escaping the vault: `core/path` rejects
traversal/absolute inputs before anything else sees them, and `vault-fs` re-anchors
every resolved path to the root before any real I/O. IPC adds a third layer by
verifying the sender and validating each payload. The renderer has no filesystem
capability at all — it can only ask the bridge, which can only call the validated
service.

## Build

`electron-vite` builds all three targets (main, preload, renderer) from one
config into `out/{main,preload,renderer}`. In development it serves the renderer
and sets `ELECTRON_RENDERER_URL`, which `window.ts` uses to load the dev server;
in production it loads the built `index.html`.

## Deliberate non-goals for Milestone 1

Embed transclusion, math/Mermaid rendering, a plugin API, Canvas, Bases, sync,
and publishing are out of scope here and live in [ROADMAP.md](ROADMAP.md). Each
underspecified external format is replaced with a small versioned schema of our
own rather than an imitation of a private one.

## Milestone 2 additions

Milestone 2 extended the system without changing its shape — the four-layer
boundary (shared → core → main/preload → renderer) is unchanged. The notable
additions:

- **Two new IPC channels**, each with the same sender check, payload validation,
  and `Result` wrapping as the existing ones: `tags:list` (returns `TagCount[]`
  for the Tags pane) and `index:suggestLinks` (returns `LinkSuggestion[]` for
  wikilink autocomplete). They are pure read queries against the in-memory index;
  no new filesystem capability is exposed to the renderer.
- **New pure-core modules** `core/index/link-suggest.ts` (suggestion ranking) and
  the `tag:` operator + `collectTags` in `core/search/search.ts` — logic stays in
  core, testable without Electron or the DOM.
- **Incremental indexing**: the watcher now drives per-file index updates instead
  of full rebuilds (see the `main/` section above), with self-write suppression
  so saves don't echo.
- **Settings schema v2**: adds `expandedFolders` and `fileSort`. `normalizeSettings`
  migrates v1 files transparently, keeping the "a hand-edited or older config can
  never crash the app" guarantee.

The renderer gained the Tags pane, wikilink autocomplete (via an injected source,
so the editor module has no IPC dependency), and a richer-but-still-sanitized
preview. None of these widen the security surface: DOMPurify still runs on all
rendered HTML, and the renderer still reaches the disk only through the audited
bridge.

## Milestone 6B additions

Milestone 6B added Bases-style table views over the 6A properties without
changing the four-layer boundary. The new persistence file and IPC channels
all follow the same shape:

- **New shared schema** `src/shared/bases.ts` — `BasesFile`,
  `BaseDefinition`, `BaseFilter`, `BaseColumn`, `BaseSort`, `BaseResult`,
  plus a defensive `normalizeBasesFile` that bounds list lengths and
  rejects prototype-pollution keys.
- **New pure engine** `src/core/bases/` — `base-query.ts` evaluates
  filters against a `NoteIndex[]` snapshot, `base-rows.ts` formats
  result cells and `PropertyValue`s safely, and `base-sort.ts` produces
  a stable single-column sort with empty-last behavior. The engine has
  no Electron or DOM dependency and is fully unit-tested.
- **New persistence** `src/main/vault/bases-store.ts` —
  `.obsidian-replica/bases.json`. Missing or malformed files normalize
  to an empty `BasesFile` so vault opening never blocks on bad input.
  Writes always persist the normalized current schema.
- **Four new IPC channels** with the same sender check, payload
  validation, and `Result` wrapping as the existing ones:
  - `bases:get` — returns the persisted `BasesFile`.
  - `bases:replace` — validates with `asBasesFile` (rejects non-objects,
    missing arrays, prototype-pollution keys at any depth, overlarge
    payloads, too many bases) before writing the normalized result.
  - `bases:run` — validates the id with `asBaseId` and evaluates the
    saved base against the in-memory index via the pure engine. No
    filesystem scan.
  - `bases:listPropertyKeys` — returns the unique sorted property keys
    discovered in the index (used by the editor's autocomplete).
- **Renderer Bases pane** under `src/renderer/components/bases/`. The
  pane is read-only by default: title and path cells open notes through
  the existing workspace action; property/tag/mtime cells are display
  only. The editor edits a local draft, runs the same `validateBaseDraft`
  the main process applies, and saves through `replaceBases`.
- **Renderer filesystem access remains unchanged**. Bases never read
  Markdown files directly; everything goes through the typed preload
  bridge and is computed by the main process against its live index.

## Milestone 6A.1 additions

Milestone 6A.1 added safe property editing without changing the layer
boundary. A single new pure helper, a single new write API, and a single
new IPC channel make the renderer able to add/edit/delete top-level
frontmatter values:

- **New shared types** in `src/shared/properties.ts` —
  `EditablePropertyValue`, `PropertyUpdateOperation`,
  `NotePropertiesUpdate`, plus the pure helpers
  `normalizeEditablePropertyName`, `isEditablePropertyValue`, and
  `validateEditablePropertyValue` that both the renderer hint layer and the
  main-side IPC validator share.
- **New pure helper** `src/core/properties/frontmatter-update.ts`. It
  parses the existing YAML through the same `parseFrontmatterDetailed`
  used by `readFrontmatter`, refuses to rewrite when there are YAML
  errors, mutates the `Document` AST in place to preserve key order and
  any unknown / nested existing values, and re-emits the frontmatter
  block while leaving the Markdown body byte-for-byte unchanged
  (including CRLF and trailing blanks).
- **One new IPC channel** `note:updateProperties`, validated by
  `asNotePropertiesUpdate` (rejects non-object payloads, missing or
  overlarge `operations` arrays, unknown keys, unknown operation kinds,
  unsupported values, and prototype-pollution payloads at any level).
- **One new main API** `VaultService.updateNoteProperties(path, update)`
  that reads the latest file, runs the pure helper, writes through the
  existing `VaultFs` + watcher-ignore path, and returns a fresh
  `NoteIndex`. No-op updates skip disk writes entirely.
- **Renderer Properties pane** gains row-level edit/delete buttons and an
  "Add property" row. Unknown / nested values keep the existing display
  with a "read only" badge; malformed YAML disables all controls. The
  renderer never reconstructs full Markdown content and never imports
  Electron or Node.

## Milestone 6B.1 additions

Milestone 6B.1 layers safe inline editing onto the 6B Bases table without
adding any new write path. There is no new IPC channel, no new main API,
and no new file format. All saves reuse the 6A.1
`updateNoteProperties(path, update)` flow:

- **Cell metadata on `BaseResult`** — `BaseResultRow.hasPropertyErrors`
  and `BaseResultCell.property` carry just enough plain data
  (`name`, `valueType`, `unsupported`) for the Bases UI to decide
  editability without re-reading notes from disk. The metadata travels
  through IPC unchanged.
- **New pure helper** `src/renderer/components/bases/base-cell-edit.ts`
  with `describeBaseCellEdit`, `draftFromBaseCell`, `parseBaseCellDraft`,
  and `updateFromBaseCellDraft`. The helper produces a single-operation
  `NotePropertiesUpdate` that flows back into the existing 6A.1 path.
- **Renderer `BaseTable`** renders the inline editor for the one active
  cell, with `Enter`/`Escape` keyboard handling, disabled controls while
  saving, and an inline error slot. Title/path/tags/mtime cells, reserved
  property cells, unknown/nested values, lists, and rows whose source
  note has YAML errors stay read-only with the existing display.
- **Renderer `BasesPane`** owns the active edit, the in-flight save, and
  re-runs the active Base after a successful save so filters and sort
  decide where the row lands. The save path is `updateNoteProperties` →
  `runBase`. Failed saves keep the existing table result visible.

## Milestone 6B.2 additions

Milestone 6B.2 keeps the same architecture as 6B.1 and only polishes the
renderer-side inline editor:

- **No new IPC or main API**. Missing-cell saves still produce a
  single-operation `NotePropertiesUpdate` and flow through the existing
  `updateNoteProperties(path, update)` channel.
- **Pure helper polish** in
  `src/renderer/components/bases/base-cell-edit.ts` adds explicit draft
  creation for missing-cell text/number/boolean/null selection and centralizes
  editable/read-only tooltip copy.
- **Renderer-only UX polish** in `BaseTable` adds a focusable edit affordance,
  property-specific accessible labels, alert semantics for save errors, and a
  compact type selector for missing cells.
- **Safety boundaries are unchanged**: title/path/tags/mtime, reserved fields,
  list values, unknown/nested values, and YAML-error rows stay read-only in
  Bases. Renderer filesystem access remains unchanged.

## Milestone 6C additions

Milestone 6C keeps the same persistence and IPC architecture as 6B and only
polishes saved Base view management in the renderer:

- **New pure helper** `src/renderer/components/bases/base-management.ts`
  contains deterministic duplicate, rename, remove-and-select-next, and move
  up/down helpers for `BaseDefinition[]` values.
- **Renderer `BasesPane` view-management actions** now duplicate, rename,
  delete, and reorder Bases by constructing a new Bases array and saving it
  through the existing `replaceBases` preload method.
- **No schema change was needed** for reordering: saved Base order is the
  existing array order in `.obsidian-replica/bases.json`.
- **No new main write API or IPC channel** was added. View management still
  uses `bases:replace`; inline property cell edits still use
  `note:updateProperties`.
- **Renderer filesystem access remains unchanged**. The renderer still never
  reads or writes `.obsidian-replica/bases.json` directly.

## Milestone 6D additions

Milestone 6D hardens Bases for larger vaults without changing the four-layer
boundary or adding database/spreadsheet scope:

- **Shared `BaseResult` runtime metadata** now reports `totalRows`,
  `returnedRows`, `limit`, and `limited`. This metadata is read-only result
  data and is never persisted to `.obsidian-replica/bases.json`.
- **Core Base evaluation still lives in `src/core/bases/base-query.ts`** and
  still runs against the `NoteIndex[]` snapshot supplied by the main process.
  The conservative row cap is applied after filtering and sorting, before row
  construction, so visible rows are the correct top rows for the saved Base.
- **Development-only timing logs** live beside evaluation and record only
  aggregate counts and phase durations. They do not log note content, titles,
  full paths, or property values, and production/test modes are silent.
- **Renderer `BasesPane` request sequencing** tracks active Base runs with a
  monotonic request id so older successes or errors cannot overwrite newer
  results. This is UI state only; the renderer still does not evaluate Bases.
- **Passive refresh debounce** is limited to vault-refresh-triggered reruns.
  Explicit Refresh and property-edit reruns remain immediate.
- **No new IPC channel, write API, or persistence file** was added. View
  management still uses `bases:replace`, property cell edits still use
  `note:updateProperties`, and the renderer remains filesystem-free.

## Milestone 7 additions

Milestone 7 promotes the existing first-slice command palette into a
deliberate renderer-side command system. There is no main-process command
bus, no IPC for commands, no plugin loader, and no new write path:

- **New renderer module** `src/renderer/commands/` with four pure
  files: `command-types.ts` (`CommandDefinition`, `CommandShortcut`,
  `CommandContext`), `command-registry.ts` (validation +
  enabled-shortcut listing), `command-search.ts` (deterministic ranked
  search across label/alias/category/description), and
  `command-shortcuts.ts` (event normalization, platform-aware display,
  editable-target detection, dispatch helper).
- **The rewritten `CommandPalette.tsx`** consumes the new types,
  renders categories and shortcut chips, and adds focus restoration,
  scroll-into-view, and accessible dialog/listbox semantics. Disabled
  commands remain visible but refuse to execute.
- **`App.tsx` is now the composition point** for both the command list
  and the global keydown dispatcher. Every command carries an
  `id`/`label`/`category`/optional `description`/`aliases`/`shortcuts`,
  and the keydown handler routes through `findShortcutMatch` against
  the same registry, bailing out for non-palette shortcuts when the
  event target is an editable surface (input, textarea,
  contenteditable, or CodeMirror).
- **Two shortcuts open the palette**: `Ctrl/Cmd+K` (primary) and
  `Ctrl/Cmd+Shift+P` (compatibility alias). `Ctrl/Cmd+O` continues to
  open the quick switcher, and `Ctrl/Cmd+S` remains owned by the
  CodeMirror editor keymap.
- **Renderer remains filesystem-free.** Commands run through existing
  app actions in `src/renderer/app/actions.ts` or through small
  callbacks closed over current store state; none of them imports
  Node, talks to `ipcRenderer`, or writes files.

## Milestone 8A additions

Milestone 8A adds the local Canvas storage foundation without adding the
full renderer Canvas UI. The four-layer boundary stays the same:

- **New shared schema** `src/shared/canvas.ts` defines Replica's own
  versioned `.replica-canvas` JSON format. It includes `CanvasFile`,
  note/text nodes, edges, viewport data, bounded constants,
  `createStarterCanvas`, and defensive `normalizeCanvasFile` helpers.
  This is not Obsidian's Canvas format.
- **New main store** `src/main/vault/canvas-store.ts` creates, reads, and
  writes normal vault `.replica-canvas` files through `VaultFs`, so
  vault-root containment and traversal protection remain in the same
  place as other vault document I/O.
- **Three new IPC channels** follow the existing audited pattern:
  `canvas:create`, `canvas:read`, and `canvas:write`. The handlers verify
  the sender, validate paths and payloads in `src/main/ipc/validate.ts`,
  delegate to `VaultService`, and return `Result` values.
- **Preload exposes typed methods only**: `canvasCreate`,
  `canvasRead`, and `canvasWrite`. It still does not expose raw
  `ipcRenderer`, `fs`, `shell`, or arbitrary channels.
- **Renderer filesystem access is unchanged.** Milestone 8A adds no
  Canvas renderer components yet; future UI work must call the typed
  preload methods through `app/api.ts`.
- **No plugin, scripting, media/embed, sync, publish, URI, or
  database/spreadsheet surface** is introduced by the Canvas foundation.

## Milestone 8B additions

Milestone 8B adds the first Canvas workspace view without changing the
main/preload/renderer boundary.

- **Document-kind routing** lives in `src/shared/document.ts`. Workspace tabs
  still persist paths, and the renderer derives whether the active document is
  Markdown or Replica Canvas at render time.
- **Workspace normalization** in `src/shared/workspace.ts` now accepts safe
  `.replica-canvas` paths as workspace documents while still rejecting traversal,
  absolute paths, unsupported extensions, and missing restored documents.
- **Main-owned Canvas discovery** extends `VaultFs`: `listTree()` includes
  `.replica-canvas` files for the explorer, `listMarkdownFiles()` remains
  Markdown-only for indexing, and `listCanvasFiles()` lets workspace restore
  prune deleted Canvas tabs.
- **Renderer Canvas view** lives under `src/renderer/components/canvas/`.
  `CanvasPane` reads through the typed `canvasRead` preload method, uses the
  existing `listNotes()` read API only for note-card labels/missing state, and
  renders text nodes, note nodes, and SVG edges.
- **Canvas content is rendered as React text and SVG primitives.** The renderer
  does not use `dangerouslySetInnerHTML`, parse arbitrary HTML, embed note file
  contents, import Node/Electron modules, or call raw IPC.
- **Canvas editing remains deferred.** 8B adds no drag/move/connect/delete UI,
  no media/embed cards, no plugin/scripting surface, and no new write API beyond
  the typed 8A Canvas persistence methods.

## Milestone 8C additions

Milestone 8C extends the read-only 8B Canvas pane with the first safe editing
interactions. The architecture layering is unchanged: every edit produces a
new immutable `CanvasFile`, the renderer normalizes it via the shared
`normalizeCanvasFile` helper, and the only write path remains 8A's typed
`canvasWrite` preload method.

- **Pure editing helpers** live in
  `src/renderer/components/canvas/canvas-edit.ts`. The file imports only
  `src/shared/canvas` and plain JS built-ins; the
  `tests/canvas-renderer-boundary.test.ts` greps assert no `fs` / `path` /
  `electron` / `ipcRenderer` / `dangerouslySetInnerHTML` references.
- **`CanvasPane` owns editor state**: a snapshot of the last loaded
  `CanvasFile` for `isDirty` comparisons, a single selection (one node id
  or one edge id), an optional `editingNodeId` for the inline text editor,
  `saving` / `saveError` / `externalChange` toolbar state, and a single
  shared 800 ms debounce timer. The pane reads the workspace's globally
  active path via the existing `useStore` hook so the "Add active note"
  affordance does not require new props through `PaneView` /
  `SplitView` / `WorkspaceShell`.
- **Inline editing is plain text.** The text-card editor is a `<textarea>`
  capped at `CANVAS_MAX_TEXT_LENGTH` with `Cmd/Ctrl+Enter` commit and
  `Escape` cancel. There is no Markdown parser, no HTML injection, and no
  note-content embedding.
- **Pointer-drag is window-anchored.** `CanvasViewport` captures the
  pointer id on `pointerdown` and attaches `pointermove`/`pointerup`
  listeners to `window` so a pointer released outside the surface still
  resolves cleanly. Drag deltas go through `moveNode`, which clamps and
  integer-floors them.
- **Save model: explicit + debounced.** The toolbar's `Save` button calls
  `runSave('explicit')` immediately; every edit also schedules an 800 ms
  debounce. Both paths call
  `api().canvasWrite(path, normalizeCanvasFile(canvas))` and store the
  returned canvas as the new `loaded` snapshot on success. Failed saves
  preserve the in-memory canvas and show a Retry/Dismiss row.
- **External-change handling is advisory.** Vault `refreshKey` bumps
  reload silently when not dirty; while dirty the toolbar shows
  "External change — refresh to reload" instead of silently overwriting
  local edits.
- **No new IPC channel, write API, or persistence file.** Editing still
  uses the typed `canvasRead` / `canvasWrite` / `canvasCreate` triple
  from 8A; the renderer remains filesystem-free.

## Milestone 8D additions

Milestone 8D adds Canvas edge creation and zoom polish without changing the
four-layer boundary or the schema.

- **Connect helpers remain renderer-local and pure.**
  `src/renderer/components/canvas/canvas-edit.ts` now includes
  `hasDuplicateEdge`, `canConnectNodes`, and `createEdge`. They operate on a
  `CanvasFile` value, reject self-links and duplicate directed pairs, and return
  a new normalized-ready `CanvasFile` without mutating input.
- **Connection UI stays inside the Canvas renderer.** `CanvasNodeView` renders a
  small handle, `CanvasViewport` owns the temporary connection preview, and
  `CanvasPane` applies the resulting edge through the same dirty/debounced save
  model as other edits.
- **Zoom uses schema-v1 viewport data.** Zoom helpers clamp to shared
  `CANVAS_MIN_ZOOM` / `CANVAS_MAX_ZOOM` bounds and persist only
  `canvas.viewport.zoom`. `viewport.x` / `viewport.y` are preserved; pan remains
  deferred.
- **Canvas coordinates stay authoritative.** The renderer scales the displayed
  canvas content with CSS, but node positions and edge geometry remain in
  canvas-space units. Drag deltas are converted from screen pixels back to
  canvas units before calling `moveNode`.
- **No boundary expansion.** 8D adds no schema version, IPC channel, preload
  method, persistence file, raw IPC access, renderer filesystem access, plugin,
  scripting, media/embed, database/spreadsheet, or Obsidian compatibility
  surface. Saves still call `api().canvasWrite(path, normalizeCanvasFile(canvas))`.

## Milestone 9 additions

Milestone 9 changes the Markdown note UI and appearance system without widening
the process boundary.

- **One-surface Markdown note pane.** `PaneView` still derives document kind at
  render time. Canvas paths continue to render `CanvasPane`; Markdown paths now
  render `MarkdownNotePane`, which switches between `LivePreviewPane`,
  `EditorPane`, and `PreviewPane` instead of rendering an editor/preview split.
- **Settings schema v4.** `src/shared/settings.ts` added the first
  one-surface `markdownViewMode` and expanded `theme` to Replica-owned
  built-in presets. `src/main/ipc/validate.ts` validates those patches before
  they reach the settings store.
- **Theme presets remain local CSS variables.** `applyTheme(settings)` sets a
  `data-theme` value and the accent/font variables. Presets are static local
  CSS in `theme.css`; there are no downloads, arbitrary snippets, marketplace
  hooks, or executable styling.
- **Right-pane cleanup is a visibility change.** `enabledRightPanes` no longer
  includes Outline or Properties, but `OutlinePane`, `PropertiesPane`,
  frontmatter parsing, `updateNoteProperties`, and Bases internals remain.
- **Add tag uses the existing write path.** `MarkdownNotePane` reads the active
  note through `readNote`, builds a frontmatter `tags` update with a pure helper,
  and writes through `updateNoteProperties`. The renderer never rewrites note
  files directly and never touches the filesystem.
- **Development DevTools is opt-in.** `loadRenderer` opens DevTools only when
  `REPLICA_OPEN_DEVTOOLS=1`, avoiding known Chromium Autofill protocol noise
  without suppressing renderer errors.

## Milestone 9.1 additions

Milestone 9.1 makes Live Preview the default Markdown experience while keeping
the existing process boundary intact.

- **Settings schema v5.** `markdownViewMode` now uses
  `'livePreview' | 'source' | 'reading'`. Legacy `'edit'` normalizes to
  `'source'`, legacy `'preview'` normalizes to `'reading'`, and old
  `showPreview: true` files normalize to Reading only when no explicit mode is
  present.
- **Settings schema v6.** Built-in local appearance modules add validated
  settings for heading colours, reading typography, and folder home layout.
  These are shipped app features, not a third-party plugin loader or arbitrary
  CSS/code execution surface.
- **Pure block model.** `src/core/markdown/live-preview.ts` parses Markdown into
  frontmatter, heading, paragraph, list, code, blockquote, blank, and other
  blocks. The patch helper replaces only the selected block range and refuses
  to edit frontmatter through normal Live Preview.
- **Renderer-only Live Preview.** `LivePreviewPane` reads and writes the active
  note through existing typed preload methods, renders unfocused blocks through
  the existing sanitized `renderMarkdown` path, and edits one focused block with
  a plain textarea. It adds no IPC channel, no preload API, and no renderer
  filesystem access.
- **Mode composition stays local to Markdown UI.** `MarkdownNotePane` composes
  Live Preview, Source, and Reading modes. Source continues to use
  `EditorPane`; Reading continues to use `PreviewPane`; Canvas routing in
  `PaneView` remains untouched.
- **Original layout polish.** The left ribbon and Live Preview styling are
  static React/CSS using existing theme variables. No Obsidian assets, icons,
  exact CSS, protocols, or compatibility behavior are copied.
