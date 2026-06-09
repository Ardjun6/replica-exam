# Roadmap (after Milestone 1)

Milestone 1 delivered a working editor with the core knowledge graph. The work
below is sequenced by dependency and value. Each milestone stays **shippable**:
the app keeps working at every step, and from Milestone 2 onward every milestone
must pass the quality gates below before it is considered done.

## Quality gates (apply from Milestone 2 onward)

Every milestone must pass these before it ships. They are the project's
CI-style checks and should eventually run in CI:

- **Typecheck** — `npm run typecheck` (node + web projects) is clean.
- **Unit tests** — `npm test` (Vitest over the pure core) passes.
- **E2E smoke** — `npm run test:e2e` (Playwright launches the built app) passes.
- **Build check** — `npm run build` (electron-vite builds main + preload +
  renderer) succeeds.
- **Lint / format** — `npm run lint` and `npm run format:check` pass once those
  are configured.

> Sandbox note: the build/dev/e2e checks require `npm install` (Electron, React,
> CodeMirror, Vite). In environments without registry access, the pure-core
> typecheck and unit tests are still run; the rest are run on a developer
> machine. Each milestone doc states exactly what was verified where.

## Milestone 2 — editor and indexing foundation

The foundation everything else leans on. **Incremental file watching and
indexing moved here from the old "polish" milestone** because backlinks, search,
graph, tags, properties, and external-edit handling all depend on the index
staying correct and cheap to update.

- **Incremental file watcher + index updates**: watch the vault, debounce
  events, re-index only changed Markdown files, drop deleted files, handle
  rename/move in both the tree and the index, ignore `.obsidian-replica/`, and
  suppress the app's own writes so a save never triggers a redundant reindex
  loop.
- **Wikilink autocomplete**: typing `[[` suggests existing notes (and, where
  practical, headings and aliases) from the index, via a dedicated completion
  module — not inline in a React component.
- **Fuller Markdown preview**: tables, strikethrough, task lists, callouts, with
  footnotes and embeds handled safely (embeds as clean placeholders until
  transclusion lands). Sanitization is never weakened.
- **Tags**: detect inline `#tags` and frontmatter tags (core already does), add a
  Tags pane with a clickable filter, and support a `tag:` search operator.
- **File Explorer — safe first slice**: persist collapsed/expanded folders,
  reveal-current-file, and explicit sort-by-name. (Drag-and-drop is **deferred**
  — see Milestone 4.5.)

## Milestone 3 — navigation and knowledge tools

- **Command palette** and a keyboard-first quick-switcher for notes.
- **Advanced search operators**: `path:`, `title:`, quoted phrases, negation,
  and `OR` (building on the `tag:` operator from M2).
- **Tag pane refinements**: filter and sort tags while preserving click-to-search.
- **Outline pane** from active-note headings.
- **Breadcrumbs** for the active note path with folder reveal.
- **Graph upgrades**: global/local graph mode, tag filter, and unresolved-node
  toggle.
- **Saved searches**: explicitly deferred unless the rest stays small.

Deferred from the older, broader Milestone 3 draft: live editor decorations,
real YAML, math/diagrams, embed transclusion, search-and-replace, and advanced
graph physics/pinning. These remain future milestones.

## Milestone 4 — Settings Window  ✅ shipped

A modular settings UI organised into eight sections, opened from the command
palette or a status-bar gear button. Reads and writes go through the existing
versioned settings schema and the audited preload bridge — no new IPC channels,
no filesystem surface exposed to the renderer. See [MILESTONE-4.md](MILESTONE-4.md).

- **Schema v3 + migration** — `SETTINGS_SCHEMA_VERSION` is now `3`. v1 and v2
  files migrate on read; hand-edited malformed values fall back to defaults.
- **Validation hardening** — `asSettingsPatch` rejects unknown keys, prototype
  pollution keys, `schemaVersion`, and per-field invalid values.
- **General** — startup behaviour, reopen-last-vault toggle, default new-note
  folder, language (System/English placeholder).
- **Editor** — font family and size, line wrapping, autosave interval are
  wired live; spell check, tab size, useTabs persist as placeholders.
- **Files & Links** — default new-note folder, attachment folder (persisted),
  auto-create missing notes (persisted), default link format (persisted), file
  sort.
- **Appearance** — theme, accent colour, UI font family, preview toggle. CSS
  theme/snippet hooks remain a future placeholder.
- **Hotkeys** — read-only list of shortcuts and palette commands. Rebinding
  arrives with the dedicated command system in a later milestone.
- **Core Features** — toggle backlinks/graph/tags/outline/breadcrumbs.
  Disabled features hide safely; the active right-pane falls through to the
  next enabled one.
- **Community Plugins** — explicit stub. No plugin loader, no scanning, no
  marketplace, no filesystem access.
- **About** — name, version, license, and the independence note, sourced from
  hardcoded import-safe constants so the renderer never reads `package.json`.

### Deferred from M4 to later milestones

- Hotkey rebinding UI and command/keybinding system.
- Plugin loading, plugin API, marketplace.
- Theme package and CSS snippet loading.
- Full spell check integration; full tab-size/useTabs CodeMirror wiring.
- Full attachment workflows (not just persisting the folder).
- Full i18n engine beyond the System/English enum.

## Milestone 4.5 — File Explorer upgrades  ✅ shipped

The richer explorer, kept separate from the safe slice shipped in M2 because
these carry more interaction risk and deserved focused testing. See
[MILESTONE-4.5.md](MILESTONE-4.5.md).

- **Drag-and-drop move** of notes and folders, with index + tree updates and
  conflict handling.
- **Sort** by name / modified / created.
- **Reveal current file/folder** from commands and context menus.
- **Context menus** for files, folders, and empty root space.
- **Duplicate file/folder** and **move to folder** commands.
- **Conflict-safe unique names** via `suggestUniquePath(path)`.
- **No silent overwrite**; collisions use a suggestion flow or cancel.
- **Renderer filesystem access remains unchanged**; explorer operations go
  through the typed preload bridge, including `duplicatePath(path)` and
  `suggestUniquePath(path)`.

### Deferred from M4.5 to later milestones

- Multi-select drag.
- Sort direction toggle.
- Manual sibling reordering.
- Link rewriting on move/rename.
- Trash / undo.
- Clipboard cut/copy/paste for explorer entries.
- Full WAI-ARIA tree compliance.
- All M5+ scope: workspace panes, Canvas, Bases, plugins, sync, publish, URI
  scheme.

## Milestone 5 — Workspace and panes  ✅ shipped

Versioned per-vault workspace state with tabs, split panes, resize persistence,
per-pane history, and session restore. See [MILESTONE-5.md](MILESTONE-5.md).

- **Workspace schema v1** stored in `.obsidian-replica/workspace.json`.
- **Tabs** for multiple open notes, with select and close behavior.
- **Split panes** right/down, close-pane, active-pane tracking, and clamped
  resize handles.
- **Pane persistence** for open tabs, active tab, active pane, split tree,
  ratios, and per-pane history.
- **Session restore** on explicit vault open, respecting startup settings for
  welcome/reopen behavior.
- **Missing-note restore safety**: deleted restored notes are pruned instead of
  crashing the renderer.
- **Per-pane history** with command-palette back/forward commands.
- **Renderer filesystem access remains unchanged**; workspace persistence goes
  through typed preload methods `getWorkspace()` and `replaceWorkspace()`.
- **Linked panes first slice**: existing preview and contextual right panes
  follow the active workspace note.

### Deferred from M5 to later milestones

- Full drag-and-drop tab reordering.
- Complex layout docking and arbitrary drop zones.
- Full linked-pane groups.
- Workspace templates.
- Multi-window support.
- Properties/Bases, Canvas, plugins, sync, publish, URI scheme.
- Workspace hotkey rebinding.

## Milestone 6A - Properties and real YAML frontmatter  ✅ shipped

- **Real YAML engine** for frontmatter, replacing the M1 hand-rolled subset
  behind the existing pure helper API.
- **Normalized properties** on `NoteIndex`, preserving custom keys, top-level
  order, value types, and non-fatal YAML errors.
- **Read-only Properties pane** following the active workspace note.
- **Malformed YAML safety**: bad frontmatter shows a warning and never crashes
  the parser, indexer, or renderer.
- **Compatibility preserved** for frontmatter aliases, frontmatter tags, inline
  tags, quick switcher alias matching, Tags pane counts, and `tag:` search.

### Deferred from M6A to later milestones

- Property editing and frontmatter rewrite API. **(Shipped in 6A.1.)**
- Property search operators (`prop:name`, `name:value`).
- Full Bases. **(Shipped in 6B.)**
- Table and board views.
- Formulas.
- Property type inference across the vault.
- Complex date picker.
- Multi-note bulk editing.
- Schema manager.

## Milestone 6A.1 - Safe property editing  ✅ shipped

Safe add/edit/delete for top-level YAML frontmatter properties on the active
note. See [MILESTONE-6A.1.md](MILESTONE-6A.1.md).

- **Pure rewrite helper** `core/properties/frontmatter-update.ts` mutates the
  parsed YAML Document AST so unrelated nested values are preserved and the
  Markdown body is byte-for-byte unchanged (LF + CRLF round-trip).
- **Main-owned write API** `VaultService.updateNoteProperties(path, update)`
  refuses to rewrite malformed YAML and reindexes through the existing safe
  write path.
- **Typed preload method** `updateNoteProperties` with strict
  `asNotePropertiesUpdate` validation (rejects unknown keys, unsupported
  values, prototype-pollution payloads, and overlarge updates).
- **Editable in the Properties pane**: text, date-like string, number,
  boolean, null, lists of simple scalars. Unknown / nested values stay
  read-only.
- **Renderer never touches the filesystem** and never reconstructs full
  Markdown content. Bases table cells remain read-only.

### Deferred from M6A.1 to later milestones

- Bases inline editing.
- Multi-note bulk property edits.
- Schema manager / vault-wide type inference.
- Nested object editing.
- Advanced date picker for `created`/`updated`.
- Property templates.

## Milestone 6B - Bases  ✅ shipped

Practical first slice of Bases-style table views over the 6A normalized
properties. See [MILESTONE-6B.md](MILESTONE-6B.md).

- **Bases schema v1** persisted per-vault in
  `.obsidian-replica/bases.json` (Replica's own versioned schema).
- **Pure query/sort/row engine** in `src/core/bases/` over the in-memory
  index — no filesystem scan per run.
- **Main-process Bases store + validators** with prototype-pollution and
  bounds protection.
- **Typed preload API**: `getBases`, `replaceBases`, `runBase`,
  `listPropertyKeys`. Renderer filesystem access remains unchanged.
- **Bases pane** with a saved-bases list, a read-only table view, an
  inline editor for name/columns/filters/sort, and "click the title to
  open the note in the active workspace pane".
- **Filters**: property exists/equals/contains, tag includes, path
  contains, title contains (AND only).
- **One-column sort** (asc/desc) with stable order and empty-last
  behavior.

### Deferred from M6B to later milestones

- Inline property editing in table cells. **(Shipped in 6B.1.)**
- Board, calendar, gallery, kanban, card views.
- Formulas, relations, rollups, grouping, OR / nested filter groups.
- Drag-and-drop column reordering and virtualized tables.
- Multi-note bulk editing.
- Base templates and import/export.
- Property schema manager and vault-wide type inference.
- Property search operators (`prop:name`, `name:value`).

## Milestone 6B.1 - Safe Bases inline property editing  ✅ shipped

Safe inline editing for simple property cells inside the read-only Bases
tables shipped in 6B. See [MILESTONE-6B.1.md](MILESTONE-6B.1.md).

- **No new write path**: every save reuses the 6A.1
  `updateNoteProperties(path, update)` API. No Bases-specific write IPC,
  no renderer filesystem access.
- **Pure cell-edit helpers** in `src/renderer/components/bases/base-cell-edit.ts`
  decide editability, seed drafts, parse them, and build the
  single-operation `NotePropertiesUpdate`.
- **Cell metadata** added to `BaseResultRow`/`BaseResultCell` lets the UI
  decide editability without re-reading notes.
- **Inline editor types**: text (incl. date-like strings), finite number,
  boolean, explicit null/empty. Missing property cells can be filled in.
- **Read-only inline**: title/path/tags/mtime, reserved fields, unknown
  or nested values, list values, and rows whose note has YAML errors —
  all still editable via the Properties pane where applicable.
- **Re-run after save**: `runBase(activeBaseId)` decides where the row
  lands; rows may move or disappear naturally; a quiet status message
  shows when the row no longer matches.

### Deferred from M6B.1 to later milestones

- Reserved-field inline editing inside Bases (still editable in the
  Properties pane).
- List editing inside Bases.
- Bulk editing, multi-cell paste, delete from a Bases cell.
- Formula/relation/rollup columns, grouping.
- Schema manager, board/calendar/gallery views.

## Milestone 6B.2 - Bases editing polish  ✅ shipped

Polish for the 6B.1 inline editor, plus explicit type selection for missing
property cells. See [MILESTONE-6B.2.md](MILESTONE-6B.2.md).

- **Missing-cell type selector**: missing property cells default to text but
  can explicitly save text, finite number, boolean, or null values.
- **Null stays explicit**: blank text is not inferred as null; users choose
  null from the selector.
- **Editor accessibility polish**: editable cells have a focusable edit
  affordance, property-specific labels, alert semantics for errors, and
  keyboard entry with `Enter`/`F2`.
- **No new write path**: saves still reuse `updateNoteProperties(path, update)`;
  there is no Bases-specific write IPC and no renderer filesystem access.
- **Read-only boundaries preserved**: title/path/tags/mtime, reserved fields,
  unknown/nested values, list values, and YAML-error rows stay read-only in
  Bases.

### Deferred from M6B.2 to later milestones

- List editing inside Bases.
- Reserved-field inline editing inside Bases.
- Bulk editing, multi-cell paste, delete from a Bases cell.
- Formula/relation/rollup columns, grouping.
- Schema manager, board/calendar/gallery views.

## Milestone 6C - Bases view management polish  ✅ shipped

Polish for managing saved Bases without adding database/spreadsheet scope. See
[MILESTONE-6C.md](MILESTONE-6C.md).

- **Pure view-management helpers** in
  `src/renderer/components/bases/base-management.ts` cover duplicate, rename,
  remove-and-select-next, and move up/down behavior.
- **Duplicate Base** creates a new id, distinct copy name, fresh timestamps, and
  preserves columns, filters, sort, source, and view.
- **Simple rename flow** lets the selected Base be renamed from the detail
  toolbar with Save/Cancel and `Enter`/`Escape` keyboard behavior.
- **Move up/down** persists saved Base order through the existing `bases` array
  order in `.obsidian-replica/bases.json`.
- **Safer delete confirmation** states that only the saved Base view is removed;
  notes and note properties are not deleted.
- **Clearer states** for selected Base, no saved Bases, no matching rows, run
  errors, and save/rename errors.
- **No new write paths**: view management still uses `replaceBases`, property
  cell edits still use `updateNoteProperties`, and renderer filesystem access
  remains unchanged.

### Deferred from M6C to later milestones

- Column width resize/persistence UI.
- Drag-and-drop Base reordering.
- List editing inside Bases.
- Reserved-field inline editing inside Bases.
- Formula/relation/rollup columns, grouping.
- Bulk editing, multi-cell paste, schema manager.
- Board/calendar/gallery views.

## Milestone 6D - Bases hardening for larger vaults  ✅ shipped

Hardening for larger vaults and heavier saved table views without adding
database/spreadsheet scope. See [MILESTONE-6D.md](MILESTONE-6D.md).

- **Large synthetic tests** generate thousands of notes and cover broad Bases,
  title/path/tag/property filters, combined filters, numeric sort, stable path
  tie-breaks, missing properties, and safe list/unknown value handling.
- **Result metadata and conservative row limit**: `BaseResult` now reports
  `totalRows`, `returnedRows`, `limit`, and `limited`; the cap is applied after
  filtering and sorting and runtime metadata is not persisted.
- **Limited-result UI** shows an explicit notice when a Base has more matching
  notes than are returned.
- **Stale-response protection** in `BasesPane` sequences active Base runs so
  older successes or errors cannot overwrite newer results.
- **Loading state improvements** distinguish first load from background refresh
  and preserve previous results during safe refreshes.
- **Passive refresh debounce** reduces vault-refresh churn while explicit
  Refresh and property-edit reruns remain immediate.
- **Dev-only timing logs** report aggregate counts and phase durations only,
  with no note contents, titles, full paths, or property values.
- **No new write paths**: view management still uses `replaceBases`, property
  cell edits still use `updateNoteProperties`, saved Bases still live only in
  `.obsidian-replica/bases.json`, and renderer filesystem access remains
  unchanged.

### Deferred from M6D to later milestones

- Full pagination.
- Row or column virtualization.
- Cross-run result caching or Bases-specific index-revision caching.
- Renderer-side query evaluation.
- New Bases persistence files or property write APIs.
- Formula/relation/rollup columns, grouping, bulk editing, schema manager.
- Board/calendar/gallery views, Canvas, plugins, sync, publish, URI scheme,
  marketplace.

## Milestone 7 - Command palette and keyboard command system  ✅ shipped

Renderer-side command system with categories, descriptions, aliases, and
platform-aware shortcut hints. See [MILESTONE-7.md](MILESTONE-7.md).

- **Command registry** in `src/renderer/commands/` with pure
  `command-types`, `command-registry`, `command-search`, and
  `command-shortcuts` modules.
- **`Ctrl/Cmd+K`** is the primary palette shortcut; `Ctrl/Cmd+Shift+P`
  remains as a compatibility alias.
- **Improved palette UX**: accessible modal dialog, search across
  label/alias/category/description, deterministic ranking, disabled
  commands visible with subdued styling, focus restoration on close,
  selected row scrolls into view.
- **Single global keydown dispatcher** routes shortcuts through the
  registry. Non-palette shortcuts respect editable contexts
  (inputs/textareas/contenteditable/CodeMirror) and don't steal typing.
- **No plugin loader, no scripting, no macros, no marketplace, no new
  IPC.** All commands run through existing app actions or validated
  preload APIs only.

## Milestone 7.1 - Command palette focus trap and command coverage polish  ✅ shipped

Milestone 7.1 tightens the palette's modal behavior without adding plugins,
scripting, command customization, raw IPC, or renderer filesystem access. See
[MILESTONE-7.1.md](MILESTONE-7.1.md).

- **Strict focus trap** in `CommandPalette.tsx`: `Tab` and `Shift+Tab`
  stay inside the palette and wrap through the search input and command rows.
- **Focus restoration preserved**: `Escape` closes the palette and returns
  focus to the element that opened it.
- **Keyboard behavior preserved**: Arrow navigation, `Enter`, disabled command
  no-ops, row scrolling, `Ctrl/Cmd+K`, `Ctrl/Cmd+Shift+P`, `Ctrl/Cmd+O`, and
  editor-owned `Ctrl/Cmd+S` remain intact.
- **Coverage stayed conservative**: editor, explorer, and Bases-specific
  command additions are deferred until there is a clean feature-local command
  provider or app-level focus/callback surface.

### Deferred from M7 to later milestones

- Plugin commands, plugin loader, theme packages, marketplace.
- User-defined commands, command scripting, macros.
- Persisted command customization / user hotkey rebinding.
- URI scheme commands, shell/file commands.
- Cross-cutting registry for feature components beyond a small command
  provider/callback pattern.

## Milestone 8 — Canvas

- **Canvas**: a spatial board of cards and links, persisted in our own versioned
  `.replica-canvas` schema, with import/export explicitly deferred. Kept as its
  own milestone because it is a large, self-contained surface.

### Milestone 8A - Canvas schema, store, IPC, and file creation  ✅ shipped

Milestone 8A adds the safe local-first Canvas foundation without the full
renderer Canvas UI. See [MILESTONE-8A.md](MILESTONE-8A.md).

- **Replica-owned schema** in `src/shared/canvas.ts` for `.replica-canvas`
  files. This does not copy Obsidian's Canvas format.
- **Main-process store** in `src/main/vault/canvas-store.ts` creates, reads,
  and writes normal vault `.replica-canvas` JSON documents through `VaultFs`.
- **Typed IPC/preload methods**: `canvasCreate`, `canvasRead`, and
  `canvasWrite`, all behind sender and payload validation.
- **Renderer filesystem boundary unchanged**: no raw IPC, no direct file access,
  and no Canvas renderer UI yet.
- **Deferred to later Canvas slices**: file explorer/workspace integration,
  `CanvasPane`, card rendering, dragging, connecting, deleting, zoom/pan, and
  import/export.

### Milestone 8B - Canvas workspace view and basic rendering  ✅ shipped

Milestone 8B adds the first visible Canvas UI while keeping the surface
read-focused and local. See [MILESTONE-8B.md](MILESTONE-8B.md).

- **Document-kind routing** derives Markdown vs Canvas from each workspace tab
  path. Workspace persistence still stores paths and does not add a new layout
  schema.
- **File explorer integration** shows `.replica-canvas` files as normal vault
  documents while keeping the Markdown index Markdown-only.
- **CanvasPane renderer** reads through the existing `canvasRead` preload
  method and renders loading, empty, and error states without leaking raw
  filesystem access.
- **Basic rendering** covers text nodes, note nodes, missing-note states, and
  SVG edges between node centers. Text is rendered literally; no arbitrary HTML
  or note-content embedding is introduced.
- **Deferred to later Canvas slices**: connect handles, resize, zoom/pan
  controls, multi-select / copy / paste, undo/redo, groups, media cards,
  command-palette Canvas entries, and import/export.

### Milestone 8C - Canvas basic editing interactions  ✅ shipped

Milestone 8C adds the first safe editing on top of 8B's read-only viewer.
See [MILESTONE-8C.md](MILESTONE-8C.md).

- **Pure editing helpers** in
  `src/renderer/components/canvas/canvas-edit.ts`:
  `addTextNode`, `addNoteNode`, `updateTextNodeText`, `moveNode`,
  `deleteNode`, `deleteEdge`, `selectionAfterDelete`, `isDirty`,
  `clampCanvasCoordinate`, `generateCanvasNodeId`. Every helper is
  immutable, bounded by the 8A schema constants, and never throws on
  missing inputs.
- **Single selection** model in `CanvasPane`: one node id or one edge id
  at a time. Click-to-select, click-background-to-clear, `Backspace`/
  `Delete` to remove, `Escape` to exit inline edit.
- **Toolbar editing**: "Add text card", "Add active note" (disabled when
  the workspace-active path is itself a canvas), "Delete", "Save", plus
  dirty / saving / external-change status chip and a Retry/Dismiss row
  on save failure.
- **Inline text-card editing** via a plain `<textarea>` (no Markdown
  parsing, no `dangerouslySetInnerHTML`), capped at
  `CANVAS_MAX_TEXT_LENGTH`, `Cmd/Ctrl+Enter` to commit, `Escape` to
  cancel. Literal `<script>` renders as plain text.
- **Drag-to-move** with pointer events; coordinates are clamped to
  `[-CANVAS_MAX_COORDINATE, CANVAS_MAX_COORDINATE]` and integer-floored.
- **Save model**: explicit `Save` button plus an 800 ms debounced
  auto-save. Every write goes through `api().canvasWrite(path,
  normalizeCanvasFile(canvas))` so the IPC validator never rejects our
  own output. Failed saves preserve the in-memory canvas.
- **External-change handling**: vault `refreshKey` bumps reload silently
  when not dirty; while dirty the toolbar shows a notice instead of
  silently overwriting.
- **Renderer boundary** test extended to cover `canvas-edit.ts`. No new
  IPC, no new preload method, renderer still has no filesystem access.

### Milestone 8D - Canvas connect, viewport, and editing polish  ✅ shipped

Milestone 8D adds edge creation through visible node handles and basic zoom
controls without changing the schema or adding IPC. See [MILESTONE-8D.md](MILESTONE-8D.md).

- **Connect via handles**: drag from a node's link handle to another node to
  create a directed edge. Self-links, missing node ids, and duplicate directed
  pairs are rejected.
- **Pure connect helpers** extend
  `src/renderer/components/canvas/canvas-edit.ts` with
  `hasDuplicateEdge`, `canConnectNodes`, and `createEdge`. Helpers remain
  immutable and schema-bounded.
- **Viewport zoom controls** add Zoom out, Reset zoom, and Zoom in. Zoom is
  clamped with shared schema constants, persisted in schema-v1
  `canvas.viewport.zoom`, and saved through the existing `canvasWrite` path.
- **Zoom-aware drag** converts screen deltas to canvas deltas so moving cards
  remains stable while zoomed.
- **Editing polish** improves selected/connect-target visuals and toolbar
  disabled states while preserving 8C save/error/external-change behavior.
- **No boundary expansion**: no schema change, no new IPC/preload method, no
  new write path, no renderer filesystem access, and no plugin/scripting/media
  or Obsidian compatibility surface.

### Deferred from M8D to later Canvas slices

- Resize nodes.
- Pan controls and drag panning.
- Multi-select, copy/paste, undo/redo.
- Groups, backgrounds, frames.
- Media / embed cards.
- Obsidian Canvas import/export compatibility.
- Canvas-specific command-palette entries.
- Cross-canvas backlinks or canvas-aware search.

## Milestone 9 - Word-document Live Preview, themes, sidebar cleanup, tag chip, Autofill filter  ✅ shipped

Milestone 9 rebuilds the Markdown surface into a Word-document-like inline
Live Preview where Markdown markers only appear when the text cursor is
touching the construct that owns them. The block-swap workflow shipped in
9.1 is replaced. See [MILESTONE-9.md](MILESTONE-9.md).

- **Word-document Live Preview**: a single chrome-free CodeMirror 6 surface.
  No Edit/Preview split, no Read/Edit toggle, no per-block click-to-edit
  textarea, no badge, no per-block border or "blue mark," no gutters, no fold
  gutter, no active-line highlight. Only the caret is visible.
- **Cursor-driven marker visibility**: the page reads as finished text by
  default. The moment the cursor enters `**bold**`, `# heading`, `[[wiki]]`,
  `> quote`, list items, inline code, fenced code, or a regular `[text](url)`
  link, *only that construct's* markers reveal. Cursor leaving hides them
  again.
- **Built-in theme presets**: System, Light, Dark, Black, White, Orange,
  Purple, and Green are local CSS-variable palettes with swatch cards that
  preview each theme's background, surface, border, text, and accent.
- **Right sidebar cleanup**: Outline and Properties tab wiring is removed
  from the right pane. The `RightPane` union is narrowed so the tabs cannot
  be re-introduced by accident. Underlying frontmatter, property, and
  Bases logic is untouched.
- **Tag chip**: a chip-shaped `+ tag` affordance opens an inline input that
  matches the chip footprint — no toolbar reflow when adding a tag. Writes
  go through the existing `updateNoteProperties` path.
- **Autofill console-noise filter**: a dev-only main-process predicate
  silences `Request Autofill.enable` and `Request Autofill.setAddresses`
  messages from the docked DevTools panel. Gated by `!app.isPackaged`; every
  other console message still surfaces.

### Deferred from M9

- Source and Reading mode support shipped in the 9.1 mode system and was
  restored by the full milestone audit after a later regression.
- Full Obsidian Live Preview parity (embedded queries, Dataview, callouts,
  mermaid).
- Community theme marketplace, downloaded themes, arbitrary CSS snippets.
- Plugin system.
- Sync/publish and URI/deep-link behavior.
- Advanced graph physics/settings.
- Full Properties internals removal.
- Bulk tag editing.
- Obsidian import/export or compatibility claims.

## Milestone 9.1 - Live Preview Markdown editing and layout polish  ✅ shipped

Milestone 9.1 makes Live Preview the default Markdown experience without
copying Obsidian private code, assets, icons, CSS, protocols, or behavior. See
[MILESTONE-9.1.md](MILESTONE-9.1.md).

- **Default Live Preview**: Markdown notes open in a block-focused rendered
  editing surface instead of a mode-first Edit/Preview workflow.
- **Focused block editing**: headings, paragraphs, list runs, blockquotes, and
  fenced code blocks render when unfocused and become editable Markdown when
  clicked or focused.
- **Safe commit/cancel behavior**: blur and `Ctrl/Cmd+Enter` commit the active
  block; `Escape` cancels it; `Ctrl/Cmd+S` commits and saves.
- **Source and Reading modes remain**: Source uses the existing CodeMirror
  editor for full raw Markdown fallback; Reading uses the existing sanitized
  preview as a read-only surface.
- **Pure block parser and patch helper**: `src/core/markdown/live-preview.ts`
  preserves frontmatter and unrelated file content where practical while
  replacing only the edited block range.
- **Layout polish**: an original left ribbon, clearer active file/workspace
  structure, readable centered prose, and existing theme variables make the app
  feel closer to a polished local knowledge workspace without copying another
  app's assets or exact UI.
- **Boundaries unchanged**: no raw IPC, no renderer filesystem access, no new
  preload API, no plugins, no marketplace, no arbitrary CSS, no scripting, and
  no Canvas regression.

### Deferred from M9.1

- Perfect Obsidian Live Preview parity.
- CodeMirror-native Live Preview decorations for every Markdown construct.
- Advanced cursor-preserving Markdown transforms.
- Complex multi-block editing and WYSIWYG tables.
- Exact Obsidian layout, icons, assets, CSS, or compatibility claims.
- Community plugins, marketplace, arbitrary CSS snippets, scripting, sync,
  publish, URI/deep-link behavior, media/embed systems, and downloaded themes.

## Milestone 10 - Product polish and navigation surfaces  ✅ shipped

- Live Preview table rendering and table-crash fix.
- Calendar pane backed by a local `calendar.md`.
- History pane for recently opened notes.
- Folder home pages.
- Collapsible sidebars and graph visual polish.
- Bases remains part of the visible right sidebar; an audit restored it after
  it had been incorrectly removed during this polish round.

## Milestone 11 - Export  planned

Safe active-note export to Markdown, HTML, DOCX, and PDF is planned in
`MILESTONE-11-PLAN.md` and is not implemented yet. The existing
`MILESTONE-11.md` file documents an interim link-navigation follow-up, not
export.

## Milestone 12 - Link polish and built-in local modules  partial

- Editor link navigation and safe external URL opening for `http`, `https`, and
  `mailto`.
- Base64 `data:image/...` rendering for note images.
- Built-in local appearance modules for heading colours, reading typography,
  and folder home-page layout. These ship with the app and are not downloaded,
  arbitrary code, a third-party plugin loader, or a marketplace.
- GitHub/cloud storage remains planned only.

## Future — extensibility

Third-party plugin **developer mode comes first; a marketplace comes later.**

- **Plugin API**: a stable, capability-scoped surface (commands, views, editor
  extensions, settings tabs) running with least privilege — never raw `fs`.
- **Local plugin skeleton / developer mode**: load a local, **disabled-by-default**
  plugin from a known folder, enable it explicitly, with settings and safe
  lifecycle (enable/disable/unload). No network, no directory yet.
- **Theme API**: user CSS themes and snippets layered on the existing
  CSS-variable token system.
- **Community plugin directory / marketplace**: only after the local plugin
  model is proven — discovery, install, update, and trust/signing. This is
  explicitly sequenced *after* developer mode.

## Future — durability and reach

Local-first remains the source of truth; everything here is an optional layer
over the on-disk files.

- **Version history / local snapshots** of notes (opt-in, on-disk).
- **Sync**: a pluggable, end-to-end-encrypted sync backend with conflict
  handling — optional, never required for the app to work.
- **Export/publish**: active-note export first, then static-site export and
  single-note share.
- **URI scheme** (`replica://`) for deep links into notes and headings.

## Future — platform and polish

- **Packaging and auto-update** for macOS, Windows, and Linux (signed builds).
- **Mobile**: evaluate a Capacitor shell reusing `core/` and the renderer.
- **Accessibility**: full keyboard navigation, focus management, ARIA roles,
  reduced-motion support, and screen-reader passes.
- **Internationalisation**: externalised strings and locale support.
- **Performance**: virtualized explorer and search lists, and a worker-thread
  indexer for very large vaults (the incremental indexer itself lands in M2).

## Cross-cutting, ongoing

- Grow the Playwright suite beyond the boot smoke test to cover real vault
  open/create, editing, linking, tag filtering, and CRUD end to end.
- Keep every persisted format versioned with a migration path.
- Maintain the security posture (sandbox, CSP, validated IPC, vault-root
  containment) as new IPC and plugin surfaces are added — each new capability
  gets the same sender + payload validation.
- Keep the quality gates green on every milestone.
