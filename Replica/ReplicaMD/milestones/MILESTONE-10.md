# Milestone 10 — ReplicaMD: Tables, Calendar, History, Folder Homes, Collapsible Sidebar

Milestone 10 is a product + polish round on top of the Word-document
Live Preview from Milestone 9. It rebrands the app to **ReplicaMD**,
makes more Markdown render in Live Preview (notably tables), adds a
History pane, adds a per-vault Calendar, gives folders a
Notion-style home page, and makes the left sidebar collapsible.

Original implementation — no Obsidian/Notion code, assets, or private
behavior is copied.

## What shipped

### Rebrand → ReplicaMD

- Visible brand is now **ReplicaMD** (welcome screen, window title,
  About, ribbon brand tooltip, README).
- The npm package name stays `replica_md` (lowercase, npm-safe); the
  on-disk config folder and the `window.replica` preload bridge are
  unchanged for vault compatibility.

### Tables (and more) now render in Live Preview

- GFM **tables** previously showed as raw `| --- | --- |` text and
  broke the layout. They now render as a real, themed HTML table
  **block widget** when the cursor is outside the table, and revert to
  raw editable Markdown when you click into them (the click moves the
  caret into the table source).
- **Strikethrough** (`~~text~~`) now renders, with the `~~` markers
  hidden until the cursor touches them.
- The rendered table uses the existing **sanitized** Markdown pipeline
  (`renderMarkdown` → DOMPurify). No new HTML surface.
- Inline decorations that would fall inside a rendered table block are
  dropped so the block widget is the only decoration there.

### Scroll-break fix

- The Live Preview surface no longer "breaks" while scrolling.
  Root cause: `margin-top` on `:has()` heading lines confused
  CodeMirror's per-line height measurement. Heading spacing now uses
  `padding-top`, and code/quote line accents use `box-shadow` insets
  instead of layout-affecting borders/margins.
- The writing surface also no longer renders in a monospace font:
  the prose font is now set explicitly on `.cm-content` /
  `.cm-scroller` (CodeMirror's default monospace was winning before).

### History pane added; Bases restored by audit

- A new **History** pane lists recently opened notes (most-recent
  first), tracked in the store and reachable from the right sidebar or
  the new ribbon clock icon.
- During the full milestone audit, removing Bases from the visible right
  sidebar was confirmed as a regression against Milestones 6B-6D.
  Bases is restored as a visible right-pane surface alongside History
  and Calendar, and its renderer tests are restored.

### Calendar (per-vault, Markdown-backed)

- A new **Calendar** pane shows a month grid and is reachable from a
  calendar icon in the ribbon (under Tags) or the command palette.
- Calendar data lives in a plain `calendar.md` at the vault root —
  hand-editable, visible in the explorer, read/written through the
  existing typed `readNote` / `writeNote` / `createPath` methods (no
  new IPC, no renderer filesystem access).
- Pure, tested helpers (`calendar-data.ts`) parse/serialize the file,
  add/remove entries, validate ISO dates, and build the month grid.

### Folder home pages

- Clicking a folder in the explorer now opens a **folder home page** —
  a Notion-style dashboard showing the folder's subfolders and notes
  as cards, plus the rendered body of an `index.md` / `home.md` /
  `readme.md` if present. The folder's twisty still expands/collapses
  the tree.
- Implemented as a renderer overlay (`folderHome` store slice) using
  the vault tree the app already holds; opening a note dismisses it.

### Collapsible, sticky left sidebar

- A panel icon at the top of the ribbon hides/shows the explorer
  (folder tree) column. The thin ribbon stays put so the toggle is
  always reachable. The explorer scrolls internally; the ribbon and
  panes do not scroll with content.

### Obsidian-like graph polish

- The graph view got a visual pass: a soft radial glow on a sunken
  backdrop, accent-filled nodes with a hover/active glow, lighter
  translucent links, and labels with a readable halo. Behavior
  (force layout, pan/zoom, click-to-open) is unchanged.

## Files added

- `src/renderer/components/icons.tsx` extended (clock, calendar,
  home, folder, file, chevrons, panel-left).
- `src/renderer/components/HistoryPane.tsx`
- `src/renderer/components/CalendarPane.tsx`
- `src/renderer/components/calendar/calendar-data.ts`
- `src/renderer/components/FolderHomePane.tsx`
- `tests/calendar-data.test.ts` (15 cases)

## Files restored by audit

- `src/renderer/components/bases/`
- `tests/bases-cell-edit.test.ts`, `tests/bases-format.test.ts`,
  `tests/bases-management.test.ts`

## Tests

- `tests/live-preview-decorations.test.ts` extended with table block
  detection (replace when cursor away, raw when inside, no false
  positives) and strikethrough cases.
- `tests/calendar-data.test.ts` covers parse/serialize round-trip,
  add/remove, ISO validation, and the Monday-first month grid.
- `tests/feature-flags.test.ts` and `tests/right-pane-cleanup.test.ts`
  updated during audit to require Bases while keeping Outline/Properties hidden.
- Full suite: **49 files / 611 tests** green. Build green. Smoke E2E
  green (welcome shows `ReplicaMD`).

## Known issue (pre-existing, unrelated)

- The Canvas connect-via-handles E2E remains environment-sensitive at
  120% zoom (a tiny pointer hit-test). Verified to fail identically
  with this milestone's changes stashed, so it is not a regression
  here.

## Follow-up: editor-core round

A focused pass to make the Live Preview surface faster and handle more
Markdown correctly.

- **Performance.** The decoration builder no longer re-parses the whole
  document on every keystroke/cursor move. The CodeMirror extension now
  passes the cached incremental syntax tree (`syntaxTree(state)`) and
  the visible viewport ranges into `buildLivePreviewRanges`; inline
  decoration work is scoped to what's on screen. Block-level tables are
  still computed over the whole document so line heights stay stable
  while scrolling.
- **Code correctness.** Wikilinks, strikethrough, tables, and task
  markers are no longer mis-detected inside inline code spans or fenced
  code blocks (a `collectCodeRegions` pass excludes them).
- **Task checkboxes.** `- [ ]` / `- [x]` render as tickable checkboxes;
  clicking one toggles the underlying Markdown (`[ ]` ↔ `[x]`). The raw
  brackets reveal only when the caret is on them, so the box stays
  tickable while editing the rest of the line.
- **Strikethrough** (`~~text~~`) renders with hidden markers (shipped in
  the tables round, now code-aware).
- Tests: `tests/live-preview-decorations.test.ts` grew to 38 cases
  covering code exclusion, task checkboxes, and viewport scoping.
- **Table crash fix.** Opening a note that contained a Markdown table
  threw `Cannot destructure property 'tile' of 'parents.pop(...)'` and
  showed only an error box. Cause: the table was a **block** `replace`
  decoration supplied from a **view plugin**, which CodeMirror forbids
  (block decorations change vertical layout and must come from state) —
  its view builder underflowed. Fix: tables now come from a dedicated
  **`StateField`** (`detectTableBlocks` + a block-widget decoration set),
  while all inline decorations stay in the view plugin. The table widget
  also renders through a `renderTableHtml` wrapper that can never throw
  (it falls back to escaped text). A new E2E (`tests/e2e/note-table.spec.ts`)
  opens a note with the exact table that crashed and asserts it renders
  as a real `<table>`, then that clicking it reveals the raw Markdown.
- **Editor mount fix.** `LivePreviewPane` used to early-return the
  "No note open" state before rendering the editor host, so the
  once-only editor-creation effect never mounted CodeMirror if the pane
  first appeared with no active note (fresh vault, or after closing all
  tabs). The host is now always rendered, with the empty message shown
  as an overlay.
- **Images** (`![alt](url)`) remain deferred: the strict self-only CSP
  (`img-src 'self' data:`) blocks remote images and there is no vault
  asset-resolution path yet, so rendering them would need a dedicated,
  audited milestone.

## Deferred / next

- Persisting History across full app restarts (currently in-memory).
- Calendar entries linking to notes / day notes.
- Richer folder-home editing (drag to arrange, embedded blocks).
- Click-to-edit affordance polish for the table widget (currently a
  single click drops the caret into the table source).

End of milestone.

## Milestone links

- Previous: [[MILESTONE-9.1]]
- Next: [[MILESTONE-11-PLAN]]
