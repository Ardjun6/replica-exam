# ReplicaMD

A local-first Markdown workspace that blends Notion-style polish with
Obsidian-style linking and its own ideas. Your notes are plain `.md` files in a
folder you choose (your vault); ReplicaMD reads and writes those files directly
and keeps its own settings in a config folder inside the vault. No accounts, no
cloud, no lock-in: the files on disk are the single source of truth.

This repository contains Milestones 1 through the current link-polish follow-up:
a working editor with core knowledge-base features, the Milestone 2 editor/indexing foundation, the
Milestone 3 navigation and knowledge-tool layer, the Milestone 4 settings
window, the Milestone 4.5 file-explorer upgrades, the Milestone 5 workspace
and panes system, real YAML-backed Properties in Milestone 6A, safe
add/edit/delete for those properties in Milestone 6A.1, saved Bases-style
table views over those properties in Milestone 6B, and safe inline editing of
simple property cells inside those Bases tables in Milestones 6B.1 and 6B.2,
plus Bases view-management polish in Milestone 6C, larger-vault hardening in
Milestone 6D, command-palette focus polish in Milestone 7.1, a safe
Replica-owned Canvas file foundation in Milestone 8A, the first Canvas
workspace renderer in Milestone 8B, Canvas editing in Milestone 8C, Canvas
connect/zoom polish in Milestone 8D, note/theme UX polish in Milestone 9, and
block-focused Live Preview editing in Milestone 9.1. It is an original
implementation; it does not copy or bundle any Obsidian code, assets, private
formats, or branding, and intentionally uses its own config-folder name and file
schemas.

Export to Markdown/HTML/DOCX/PDF is planned in `MILESTONE-11-PLAN.md` and is
not shipped yet.

## Features

Milestone 1 delivered the editor and core knowledge graph; Milestone 2 added an
incremental indexing foundation, autocomplete, a richer preview, and tags;
Milestone 3 added keyboard navigation, richer search, outline, breadcrumbs, and
graph filters; Milestone 4 added a real settings window; Milestone 4.5 shipped
the richer file explorer; Milestone 5 added workspace tabs and split panes;
Milestone 6A added real YAML frontmatter parsing and read-only Properties;
Milestone 6B added Bases-style saved table views over those properties; 6B.1
and 6B.2 added safe inline editing for simple property cells; 6C polished saved
Base view management; 6D hardened Bases for larger vaults and heavier saved
views; Milestone 7 turned the command palette into a deliberate renderer-side
command system with `Ctrl/Cmd+K`, accessible keyboard nav, and platform-aware
shortcut hints; and Milestone 7.1 added a strict palette focus trap with
reliable focus restoration. Milestone 8A added the local Canvas schema, store,
and typed IPC foundation for `.replica-canvas` files; Milestone 8B added
workspace routing and a safe read-only Canvas renderer for text nodes, note
nodes, and edges; Milestone 8C added the first safe editing interactions;
Milestone 8D added handle-based edge creation plus persisted zoom controls;
Milestone 9.1 made Live Preview the default Markdown editing surface; and
Milestone 9 rebuilt that surface into a Word-document-like inline Live Preview
where Markdown markers only appear when the text cursor touches the construct
that owns them, plus theme presets, right-sidebar cleanup, a chip-shaped
`+ tag` affordance, and a narrow dev-only Autofill console-noise filter.
Later follow-ups added Live Preview table/link polish, History, Calendar,
folder home pages, restored Bases visibility after audit, external-link opening
for safe URL schemes, base64 image rendering, and built-in local appearance
modules. These are not a third-party plugin loader or marketplace.

**Core (Milestone 1)**

- Open an existing folder as a vault, or create a new one.
- A `.obsidian-replica/` config folder with a versioned `settings.json`.
- File explorer with create, rename, and delete for notes and folders.
- A CodeMirror 6 Markdown editor with autosave and `Ctrl/Cmd-S`.
- Live, sanitized Markdown preview.
- `[[wikilinks]]`, including aliases, headings, block ids, embeds as
  placeholders, click-to-open, and click-to-create when missing.
- Backlinks pane, full-text search, and a dependency-free graph view.
- Persisted settings: light/dark/system theme, accent color, font size, preview
  toggle.
- Hardened Electron shell: context isolation, sandboxed renderer, no Node in the
  renderer, strict CSP, single-instance lock, and a minimal preload bridge. The
  renderer never touches the filesystem directly.

**Editor and indexing foundation (Milestone 2)**

- Incremental file watching: external edits re-index only the changed note,
  deletes drop from the index, and the app's own saves do not trigger redundant
  rebuilds.
- Wikilink autocomplete for existing notes, aliases, and headings.
- Richer preview: tables, strikethrough, task lists, callouts, and footnotes,
  still sanitized.
- Tags: inline tags and frontmatter tags, a Tags pane with counts and
  click-to-filter, and a `tag:` search operator.
- File explorer: persisted collapsed/expanded folders and reveal current file.

**Navigation and knowledge tools (Milestone 3)**

- Command palette with `Ctrl/Cmd-Shift-P`.
- Quick switcher with `Ctrl/Cmd-O`, matching note title, path, and aliases.
- Advanced search operators: `path:`, `title:`, `tag:`, quoted phrases,
  negation, and `OR`.
- Tags pane filtering and count/name sorting.
- Outline pane from active-note headings, with click-to-jump in the editor.
- Breadcrumbs for the active note path, with folder reveal.
- Global/local graph mode, tag filtering, and unresolved-node toggle.

**Settings window (Milestone 4)**

- A modal settings window with eight sections (General, Editor, Files & Links,
  Appearance, Hotkeys, Core features, Community plugins, About).
- Opens from the command palette ("Open settings") or the ⚙ button in the
  status bar. Closes with Escape.
- Editor font size and family, UI font, line wrapping, autosave interval,
  accent colour, and theme are wired into live behaviour. Spell check, tab size,
  attachment folder, and link format are persisted now and integrate later.
- Core feature toggles can hide backlinks, graph, tags, outline, and
  breadcrumbs. The active right-pane falls through to the next enabled one
  when toggled off.
- Settings are versioned (schema v3) and migrate v1 / v2 / malformed files on
  read; renderer patches are strictly validated and reject prototype-pollution
  keys.

**File Explorer upgrades (Milestone 4.5)**

- Duplicate files and folders with conflict-safe unique names.
- Move files and folders through a folder picker or drag-and-drop.
- Drag to folders or the vault root; invalid drops into self/descendants are
  rejected.
- Context menus for file, folder, and empty-root actions.
- Sort by name, last modified, or created date.
- Reveal current file or folder from commands and context menus.
- No silent overwrite: conflicts use suggested names or cancel.
- Two preload/API methods support the UI without widening renderer filesystem
  access: `duplicatePath(path)` and `suggestUniquePath(path)`.

**Workspace and panes (Milestone 5)**

- Multiple notes can stay open as tabs.
- Tabs can be selected and closed.
- Split panes right or down from the command palette or pane controls.
- Panes can be resized; split ratios are clamped and persisted.
- Workspace state is stored per vault in `.obsidian-replica/workspace.json`.
- Explicit vault open restores tabs, panes, active pane, active tab, sizes, and
  per-pane history.
- Missing/deleted restored notes are skipped safely.
- Per-pane back/forward history is available from the command palette.
- New preload/API methods support workspace persistence without widening
  renderer filesystem access: `getWorkspace()` and
  `replaceWorkspace(workspace)`.

**Properties and YAML frontmatter (Milestone 6A)**

- Real YAML frontmatter parsing via the `yaml` dependency, isolated behind the
  core frontmatter helper.
- Malformed YAML is reported as a warning state and never crashes the indexer or
  renderer.
- `NoteIndex` includes normalized properties while preserving existing
  frontmatter, aliases, tags, headings, links, and body text behavior.
- Properties pane shows the active note's frontmatter properties, value types,
  and reserved-field badges.
- Existing frontmatter aliases and tags keep working with quick switcher, Tags,
  and `tag:` search.

**Safe property editing (Milestone 6A.1)**

- Add, edit, and delete simple top-level YAML frontmatter properties from the
  active note's Properties pane.
- Editable value types: text, date-like string, finite number, boolean, null,
  and lists of simple scalars.
- Unknown / nested values stay read-only; reserved fields keep their badges.
- Malformed YAML disables editing and shows a clear warning — the existing
  YAML must be fixed in the editor first.
- Markdown body content is preserved byte-for-byte across every edit.
- Writes go through a new typed preload method `updateNoteProperties` and a
  main-process pure helper (`core/properties/frontmatter-update.ts`); the
  renderer never touches the filesystem.
- Bases table cells remain read-only in this milestone.

**Bases-style table views (Milestone 6B)**

- Saved table views over the normalized 6A properties, persisted per-vault in
  `.obsidian-replica/bases.json` (Replica's own versioned schema).
- A Bases tab in the right pane lists saved bases, runs the active one against
  the live in-memory index, and shows matching notes in a read-only table.
- Filters: property exists, property equals, property contains, tag includes,
  path contains, title contains. Multiple filters combine with AND.
- One-column sorting (asc/desc) with stable order and empty-last behavior.
- Columns can show title, path, tags, modified time, or any normalized
  property; clicking title/path opens the note in the active workspace pane.
- Cells are read-only by default. Malformed property values never crash the
  table.
- New typed preload methods: `getBases`, `replaceBases`, `runBase`,
  `listPropertyKeys`. The renderer still has no raw filesystem access.

**Safe Bases inline property editing (Milestone 6B.1)**

- Simple non-reserved property cells in Bases tables can be edited inline:
  text (incl. date-like strings), finite number, boolean, and explicit
  null/empty.
- Missing property cells can be filled in safely; the save creates the
  top-level property on the target note.
- One cell at a time; `Enter` saves, `Escape` cancels.
- Title, path, tags, and mtime cells stay read-only. Reserved fields
  (`aliases`, `tags`, `cssclasses`, `created`, `updated`), unknown/nested
  values, and list values stay read-only inline — edit them through the
  Properties pane instead.
- Rows whose note has YAML frontmatter errors disable editing entirely.
- No new write path: saves reuse the 6A.1 `updateNoteProperties` API and
  the Base is re-run so filters and sort decide where the row lands.

Graph: There is a full-size Graph workspace view available via the command
palette ("Open full graph"), while the right sidebar Graph remains available.
The Graph UI includes search, tag/folder filters, neighborhood modes,
unresolved/orphan toggles, smooth zoom/pan, fit/reset controls, tooltips,
hover/selection highlighting, and performance safeguards. See
`src/renderer/components/GraphView.tsx` for implementation details.

**Bases editing polish (Milestone 6B.2)**

- Missing property cells now include an explicit type selector for text,
  number, boolean, or null before save.
- Blank text stays blank text; null is only written when selected explicitly.
- Editable cells have a clearer focusable edit affordance, stronger accessible
  labels, alert semantics for save errors, and keyboard entry with `Enter`/`F2`.
- List values and reserved fields remain read-only inside Bases; edit them
  through the Properties pane.
- Saves still use only `updateNoteProperties`; no second write path or new
  write IPC channel exists.

**Bases view management polish (Milestone 6C)**

- Saved Bases can be duplicated, renamed from the detail toolbar, and moved up
  or down in the list.
- Duplicate creates a new id, distinct copy name, and fresh timestamps while
  preserving columns, filters, sort, source, and view.
- Delete confirmation states that only the saved Base view is removed; notes
  and note properties are not deleted.
- No-Bases, no-result, run-error, save-error, and selected Base states are
  clearer.
- Bases view-management writes still use only `replaceBases` and persist only
  to `.obsidian-replica/bases.json`.
- Property cell saves still use only `updateNoteProperties`; list cells and
  reserved fields remain read-only in Bases.

**Bases larger-vault hardening (Milestone 6D)**

- Large synthetic tests cover broad Bases, filters, sorting, missing
  properties, and safe handling for list/unknown values without adding huge
  fixture files.
- Base results now carry runtime metadata: total rows, returned rows, row
  limit, and whether the result was capped.
- A conservative returned-row limit protects IPC and renderer payload size; the
  cap is applied after filtering and sorting.
- Limited results show an explicit table notice while zero-result Bases keep
  their separate no-match state.
- Bases pane reruns are sequenced so stale successes or errors cannot overwrite
  newer results.
- Initial loading and background refresh are distinguished; background refresh
  keeps the previous result visible when safe.
- Passive vault-refresh reruns are briefly debounced. Explicit Refresh and
  property-edit reruns remain immediate.
- Development-only Base timing logs report aggregate counts and durations only;
  production is silent.
- No new write path or persistence file was added. Renderer filesystem access
  remains unchanged, and lists/reserved fields remain read-only in Bases.

**Command palette and keyboard system (Milestone 7)**

- Renderer-side command registry with stable ids, categories,
  descriptions, aliases, and platform-aware shortcut hints.
- `Ctrl/Cmd + K` is the primary shortcut for opening the command palette;
  `Ctrl/Cmd + Shift + P` remains as a compatibility alias.
- Improved palette UX: accessible modal dialog semantics, search across
  label/alias/category/description, deterministic ranking, disabled
  commands visible with subdued styling, focus restoration on close,
  selected row scrolls into view.
- Milestone 7.1 adds a strict focus trap: `Tab` and `Shift+Tab` stay
  inside the palette while it is open, and `Escape` restores the
  previously focused element.
- A single global keydown dispatcher routes shortcuts through the
  registry. Non-palette shortcuts no longer fire while typing in inputs,
  textareas, contenteditable nodes, or CodeMirror editors.
- No plugin loader, no scripting, no macro system, no marketplace, and
  no new IPC — commands run through existing safe app actions and
  preload APIs only.

**Canvas workspace view (Milestones 8A, 8B, 8C, and 8D)**

- Replica-owned `.replica-canvas` JSON schema, store, and typed IPC/preload
  methods: `canvasCreate`, `canvasRead`, and `canvasWrite`.
- `.replica-canvas` files are normal vault documents and now appear in the file
  explorer without entering the Markdown index.
- Workspace tabs can open Canvas documents while preserving existing Markdown
  editor and preview behavior.
- The Canvas view safely renders existing text nodes, note cards, missing-note
  states, and SVG edges from Replica's own schema.
- 8C adds the first safe editing interactions: single selection, add text card,
  add active note card, edit text card text, drag to move, delete the selected
  node or edge, plus an explicit Save button and an 800 ms debounced
  auto-save. Persistence still flows only through the existing `canvasWrite`
  preload method.
- 8D adds handle-based edge creation between existing cards, rejects self-links
  and duplicate directed links, selects newly created edges, and persists them
  through the same `canvasWrite` path.
- 8D also adds Zoom out, Reset zoom, and Zoom in controls backed by schema-v1
  `viewport.zoom`; node drag converts screen movement back into canvas
  coordinates so dragging stays stable while zoomed.
- Canvas rendering and editing use typed preload reads/writes only; renderer
  filesystem access is unchanged, raw IPC is not exposed, no note contents are
  embedded in cards, and there is no Markdown parsing or HTML injection inside
  text cards.
- Pan controls, resize, multi-select, copy/paste, undo/redo, groups, media
  cards, command-palette Canvas commands, and Obsidian Canvas import/export
  remain deferred to later Canvas slices.

**Word-document Live Preview and Markdown note UX (Milestone 9)**

- Markdown notes now mount a single Word-document-like surface. There is no
  Edit/Preview split, no per-block click-to-edit textarea, no "Live Preview"
  badge, no Read/Edit toggle button. The page reads as finished text.
- Markdown markers (`**`, `_`, `#`, `[[`, `]]`, `>`, …) are hidden by default.
  They only become visible when the text cursor is touching that construct —
  drop the cursor into a `# heading` line and the `#` reveals; move it away and
  the `#` hides again. Formatting renders inline as the user types.
- The surface is a single CodeMirror 6 editor with all visible chrome stripped
  (no gutters, no fold gutter, no active-line highlight, no selection-match
  overlay). Only the caret stays visible.
- Appearance settings include local built-in theme cards for System, Light,
  Dark, Black, White, Orange, Purple, and Green. Each card previews the
  theme's background, surface, border, text, and accent colors so the user can
  compare at a glance. No downloads, marketplace, CSS snippets, or executable
  styling.
- The visible right sidebar now focuses on Backlinks, Search, Tags, Bases,
  Graph, History, and Calendar. Outline and Properties tab wiring is removed from the right pane; the
  underlying frontmatter/property logic continues to back Bases editing and
  tag indexing.
- Markdown notes include a `+ tag` chip affordance that writes through the
  existing `updateNoteProperties` API. The chip shares the tag-row footprint
  so adding a tag never resizes the toolbar.
- Development DevTools opening is opt-in with `REPLICA_OPEN_DEVTOOLS=1`. When
  DevTools is opened, a narrow filter in the main process silences the known
  Chromium `Request Autofill.enable` / `Request Autofill.setAddresses` CDP
  noise; every other console message still surfaces. The filter is gated by
  `!app.isPackaged` so production behavior is unchanged.
- The implementation is an original inline Live Preview model using
  CodeMirror 6 decorations. It does not claim Obsidian compatibility and does
  not copy Obsidian code, assets, icons, CSS, protocols, or private behavior.

**Keyboard shortcuts**

| Combo | Action |
|-------|--------|
| `Ctrl/Cmd + K` | Open command palette |
| `Ctrl/Cmd + Shift + P` | Open command palette (compatibility alias) |
| `Ctrl/Cmd + O` | Open quick switcher |
| `Ctrl/Cmd + S` | Save current note (autosave still applies) |
| `Escape` | Close palette, switcher, or settings window |

See [MILESTONE-1.md](MILESTONE-1.md), [MILESTONE-2.md](MILESTONE-2.md),
[MILESTONE-3.md](MILESTONE-3.md), [MILESTONE-4.md](MILESTONE-4.md),
[MILESTONE-4.5.md](MILESTONE-4.5.md), [MILESTONE-5.md](MILESTONE-5.md),
[MILESTONE-6A.md](MILESTONE-6A.md), [MILESTONE-6A.1.md](MILESTONE-6A.1.md),
[MILESTONE-6B.md](MILESTONE-6B.md), [MILESTONE-6B.1.md](MILESTONE-6B.1.md),
[MILESTONE-6B.2.md](MILESTONE-6B.2.md),
[MILESTONE-6C.md](MILESTONE-6C.md), [MILESTONE-6D.md](MILESTONE-6D.md),
[MILESTONE-7.md](MILESTONE-7.md), [MILESTONE-7.1.md](MILESTONE-7.1.md),
[MILESTONE-8A.md](MILESTONE-8A.md), [MILESTONE-8B.md](MILESTONE-8B.md),
[MILESTONE-8C.md](MILESTONE-8C.md), [MILESTONE-8D.md](MILESTONE-8D.md),
[MILESTONE-9.md](MILESTONE-9.md), [MILESTONE-9.1.md](MILESTONE-9.1.md), and
[ROADMAP.md](ROADMAP.md).

## Requirements

- Node.js 18+ (20+ recommended)
- npm 9+

Electron downloads a platform binary on `npm install`, so the first install
needs network access.

## Verified Status

Current audit status has been verified locally:

- `npm run check` passed after the audit fixes (56 Vitest files / 730 tests,
  plus typecheck, lint, and format check).
- `npm run build` passed.
- `npm run test:e2e` passed.
- `npm run dev` launched successfully and stayed alive past startup during a
  bounded audit run.
- The preload bridge was present as `window.replica`.
- The app renderer had no red runtime errors.

The observed `Autofill.enable` / `Autofill.setAddresses` messages come from the
docked DevTools window, not the Replica renderer.

## Setup

```bash
npm install
```

## Run (Development)

```bash
npm run dev
```

This starts the Vite renderer dev server and launches Electron pointed at it,
with hot reload for the renderer.

## Build and Run

```bash
npm run build
npm run start
```

`npm run build` type-checks and bundles main, preload, and renderer into `out/`.
`npm run start` runs the built app via `electron-vite preview`.

## Tests and Quality Gates

```bash
npm test
npm run test:e2e
npm run lint
npm run format:check
npm run typecheck
npm run check
```

`npm run check` is the full local gate: typecheck, lint, format check, and unit
tests. `npm run test:e2e` requires a prior `npm run build`.

The unit tests cover path normalization and traversal rejection, wikilinks,
frontmatter, backlinks, search ranking and operators, graph generation,
incremental index updates, watcher behavior, tag extraction/counting, wikilink
suggestion ranking, explorer operations, workspace schema/model helpers, YAML
frontmatter parsing, property normalization, Bases query/edit/view-management
helpers, Canvas schema/editing, Live Preview decorations, settings migrations,
theme presets, and renderer boundary checks.

## First Launch

On first launch you will see a welcome screen. Choose **Create new vault...** to
make a fresh vault, or **Open vault...** to point Replica at an existing folder
of Markdown files. The last vault you used is reopened automatically next time.

## Scope

Some Markdown and knowledge-base features named in the source specification are
intentionally not in the shipped milestones. Saved searches, advanced Bases
views, formulas, relations, rollups, bulk editing, schema manager, CodeMirror-
native Live Preview decorations for every Markdown construct, full embed
transclusion, math, diagrams, a third-party plugin loader, marketplace,
advanced Canvas slices, full Obsidian-style Live Preview parity, note export,
sync, and publish all remain deferred. Built-in local appearance modules are
not a third-party plugin system. See [ROADMAP.md](ROADMAP.md).

## License

MIT. See `package.json`. This project is an independent work and is not
affiliated with or endorsed by Obsidian.
