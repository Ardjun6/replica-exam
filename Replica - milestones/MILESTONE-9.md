# Milestone 9 — Inline Live Preview, Themes, Right-Sidebar Cleanup, Tag Chip, and Autofill-Noise Filter

Milestone 9 rebuilds the Markdown note surface so it looks and
behaves like a **Word document**. There is one editable surface;
markdown markers (`**`, `_`, `#`, `[[`, `]]`, …) only become visible
when the text cursor is actually touching that construct.

This is an original Replica implementation inspired by common
Markdown editor patterns. It does **not** copy Obsidian private code,
assets, exact UI, branding, protocols, or proprietary behavior.

## What shipped

### Word-document Live Preview

- **One unified surface.** No Edit/Preview split. No Read/Edit
  toggle. No segmented control. No "Live Preview" badge. No
  per-block click-to-edit textarea. No focus rings or hover
  backgrounds ("blue mark").
- **Cursor-driven marker visibility.** With the cursor outside every
  Markdown construct, no markers are visible — the page reads as
  finished text. The moment the cursor enters a construct, *only
  that construct's* markers reveal so it can be edited. The moment
  the cursor leaves, the markers hide again.
- The surface is a single CodeMirror 6 editor with all visible
  chrome stripped (no gutters, no fold gutter, no active-line
  highlight, no selection-match overlay). Only the caret stays
  visible.
- Inline rendering happens **as the user types**: `**bold**` appears
  bold, `# heading` appears as a heading, `[[wikilink]]` appears as
  a styled link.

### Theme presets

- Eight built-in themes wired through Settings → Appearance:
  `system`, `light`, `dark`, `black`, `white`, `orange`, `purple`,
  `green`.
- Each preset writes a full CSS-variable set (background, text,
  accent, borders, hover, selected, code, editor, preview,
  sidebar).
- Theme swatch cards in Appearance preview each theme's actual
  background, surface, border, text, and accent colors so the user
  can compare at a glance before selecting.
- Tamper-tolerant: unknown theme values fall back to `system` via
  the existing `asThemeMode` validator.

### Right-sidebar cleanup

- Removed `Outline` and `Properties` tabs from the visible right
  sidebar.
- `RightPane` (`store.ts`) union tightened to
  `'backlinks' | 'search' | 'tags' | 'bases' | 'graph'` so the tabs
  can no longer be re-introduced by accident.
- Underlying frontmatter, property, and Bases logic untouched —
  Bases editing, frontmatter parsing, the wikilink resolver, and
  the tag index all keep working.

### Tag chip polish

- Replaced the `No tags` + `Add tag` cluster with a single inline
  `+ tag` chip that opens an inline input matching the chip
  footprint exactly. No layout jump when adding a tag.
- Existing tags render as chips alongside the new affordance.
- Empty draft + blur cancels the form; Escape cancels; Enter
  submits. All input is routed through the existing safe
  `buildAddTagUpdate` + `updateNoteProperties` path — no new IPC,
  no new preload.

### Autofill console-noise filter

- Dev-only `console-message` listener in `main/main.ts` silences
  `Request Autofill.enable` and `Request Autofill.setAddresses`
  messages from the docked DevTools panel.
- The predicate (`isHarmlessDevToolsConsoleMessage`) lives in a
  tiny pure module so its scope is testable in vitest.
- The filter is **gated by `!app.isPackaged`**, so production
  behavior is unchanged.
- Every other console message still surfaces, including unrelated
  Autofill mentions and real renderer errors.

## Files added or rewritten

- `src/renderer/editor/livePreview/decorationBuilder.ts` — pure
  Markdown → range list helper (Lezer Markdown + cursor selection
  → sorted `LivePreviewRange[]`).
- `src/renderer/editor/livePreview/livePreviewExtension.ts` — CM6
  `ViewPlugin` adapting the pure builder into a `DecorationSet`.
- `src/renderer/editor/livePreview/createLivePreviewEditor.ts` —
  chrome-free CM6 factory for the Word-document surface.
- `src/renderer/components/LivePreviewPane.tsx` — rewritten as a
  thin wrapper that mounts the new editor; previous block-swap UI
  removed (no `live-preview-kicker`, no `live-preview-empty-block`,
  no `<textarea>` swap, no per-block role="button" wrappers).
- `src/renderer/components/RightPane.tsx` — outline/properties tabs
  removed.
- `src/renderer/app/store.ts` — `RightPane` union narrowed.
- `src/renderer/App.tsx` — `handleSelectHeading` consumer removed,
  `HeadingNode` import dropped, `jumpToHeading` plumbing kept inert
  for a future heading-nav consumer.
- `src/renderer/components/MarkdownNotePane.tsx` — chip-shaped
  `+ tag` affordance.
- `src/renderer/styles/app.css` — Word-document Live Preview CSS
  (gutters/fold/active-line suppressed; cursor-only chrome), shared
  typography pass aligned with the existing `.markdown` rules, new
  `note-tag-chip-add` / `note-tag-chip-input` styles.
- `src/main/dev-console-filter.ts` — pure Autofill-noise predicate.
- `src/main/main.ts` — wires the dev-only filter into
  `webContents.console-message`.

## Files removed

- `src/core/markdown/live-preview.ts` (block parser — superseded).
- `tests/live-preview.test.ts` (tests for the removed block
  parser).

## Tests added or extended

- `tests/live-preview-decorations.test.ts` (21 cases) — pins the
  cursor-driven marker visibility contract for every Markdown
  construct the builder supports.
- `tests/right-pane-cleanup.test.ts` (3 cases) — asserts the
  outline/properties tabs are gone from `enabledRightPanes`.
- `tests/theme-presets.test.ts` (4 cases) — asserts the seven
  user-requested presets plus `system` are present and pass
  normalization.
- `tests/dev-console-filter.test.ts` (5 cases) — pins the Autofill
  filter scope so it cannot widen into a global console silencer.

## Acceptance criteria — confirmed

1. Opening a Markdown note shows a single Word-document-like
   surface. No editor + preview split, no badge, no Read/Edit
   button, no "Click to start writing" placeholder, no per-block
   border or "blue mark," no gutters, fold markers, or active-line
   highlight. ✅
2. With the cursor outside every Markdown construct, no raw
   markers are visible anywhere on screen. ✅
   (`live-preview-decorations.test.ts`)
3. The cursor can be placed anywhere and typing happens immediately.
   No mode switch exists. ✅
4. Cursor entering a construct reveals *only that* construct's
   markers; cursor leaving hides them. ✅
   (`live-preview-decorations.test.ts`)
5. Markdown syntax renders inline as the user types. ✅
6. Appearance shows preview cards for `black`, `white`, `dark`,
   `light`, `orange`, `purple`, `green`, plus `system`. ✅
   (`theme-presets.test.ts`)
7. Selecting a preset updates the live UI and persists. ✅
8. Right sidebar shows only Backlinks, Search, Tags, Bases, Graph.
   ✅ (`right-pane-cleanup.test.ts`)
9. Ribbon "Graph" button + "Switch to Graph" palette command open
   the graph; graph nodes still open notes. ✅
10. Adding a tag is a one-chip affordance with inline validation;
    duplicates and unsafe input rejected. ✅
    (existing `tests/tag-edit.test.ts` + chip rewrite)
11. Autofill console messages are suppressed in dev via the narrow
    filter; no global silencer. ✅
    (`dev-console-filter.test.ts`)
12. Renderer remains filesystem-free. No new IPC channel, no new
    preload, no `dangerouslySetInnerHTML` outside the existing
    audited renderer. ✅
13. Canvas 8A–8D tests + behavior unchanged. ✅
14. `npm run check` (51 files / 659 tests), `npm run build`, and
    `npm run test:e2e` all pass. ✅

## Explicit deferrals (carried forward)

- Source and Reading modes shipped in the 9.1 mode system and were restored by
  the full milestone audit after a later regression. Live Preview remains the
  default Markdown mode.
- Obsidian Live Preview parity (embedded queries, Dataview,
  callouts, mermaid).
- Community theme marketplace, user CSS, plugin system, sync,
  publish, URI/deep-link, mobile layout.
- Advanced graph physics / filters / per-node settings.
- Removing the underlying property pipeline — only the sidebar
  wiring was removed.
- Schema v6 — settings stayed on v5; this milestone added no
  persisted state.

## Risks observed during implementation

- **Lezer Markdown does not natively parse `[[wikilink]]` syntax.**
  The decoration builder falls back to a regex pass on the document
  text. Future work could replace this with a Lezer extension, but
  the regex covers the common cases without re-parsing the document.
- **The `jumpToHeading` plumbing is now inert** (the Outline pane
  was the only producer). The state hooks are left in place so a
  future feature can re-attach a producer without re-threading the
  workspace shell.

## Follow-up: visual overhaul & rebrand (replica_md)

After the initial M9 landing, a styling pass reshaped the app from a
plain "Word page" into a Notion/Obsidian-blended workspace and
rebranded it to **replica_md**.

### Rebrand

- Product name is now **replica_md** (a deliberate blend of Notion,
  Obsidian, and original ideas — not "Obsidian Replica").
- Updated: `package.json` name + description, `src/shared/about.ts`
  (`APP_NAME`, independence note), `index.html` title, the welcome
  screen, and README intro.
- The on-disk config folder (`.obsidian-replica/`) and the
  `window.replica` preload bridge are **unchanged** for backward
  compatibility with existing vaults — the rebrand is visible/product
  branding only, not a data migration.

### Original icon set

- `src/renderer/components/icons.tsx` — dependency-free, stroke-based
  inline SVG icons (brand mark, search, graph, tag, settings, sun,
  moon, file-plus, folder-plus, locate, split-right, split-down,
  close, plus). `currentColor`, 24×24 grid, CSP-safe (no icon font,
  no network).
- Wired into the ribbon (replacing the `S`/`G`/`T`/`Set` letters and
  adding the brand mark), the status bar (theme + settings), the
  explorer toolbar (reveal/new-note/new-folder), and the tab strip
  (split/close).

### Eight designed themes + System

- `THEME_PRESETS` now offers **System (auto)** plus eight designed
  themes: Light, Dark, Midnight, Paper, Amber, Grape, Forest, and
  Ocean (new). Each is a full CSS-variable palette in `theme.css`.
- `ThemeMode` gained `blue` (Ocean). `asThemeMode` still falls back to
  `system` for unknown values, so old settings files are safe.
- `tests/theme-presets.test.ts` asserts nine presets (eight designed +
  System) and that each has a label and a valid accent hex.
- Swatch cards in Appearance preview each theme's real
  background/surface/border/text/accent colors.

### Notion-like chrome

- Softer radii, calmer spacing, accent-tinted active states across the
  ribbon, explorer rows, workspace tabs, right-pane tabs (now pill
  shaped), and the status bar (with a live accent "vault" dot).
- Default UI font now leads with Inter (falling back to Segoe UI /
  system-ui) for new vaults.

### Richer Live Preview (still cursor-driven)

- The Live Preview surface now clearly *reads* as a formatted
  document rather than flat text, while keeping the M9 rule that raw
  markers only appear when the cursor touches the construct:
  - unordered list markers render as a real `•` bullet widget when the
    cursor is away (ordered lists keep their visible number);
  - headings get the full display scale plus breathing room above
    H1–H3 lines (`:has()`);
  - inline code and fenced code use the themed code surface;
  - blockquote lines get an accent bar across the whole line;
  - links/wikilinks get an accent underline.
- New helper plumbing: `LivePreviewRange` gained optional
  `replaceWith` / `replaceClass`, and the CM6 extension renders those
  as a plain-text `WidgetType` (never HTML).
- `tests/live-preview-decorations.test.ts` adds list-rendering cases
  (bullet widget for unordered, none for ordered, raw marker revealed
  on cursor).

### Known issue (pre-existing, unrelated)

- The Canvas connect-via-handles E2E (`tests/e2e/canvas.spec.ts`) is
  environment-sensitive at 120% zoom: the synthetic pointer must hit
  an 18px handle positioned at the node's right edge, which depends on
  window focus and horizontal scroll. This was verified to fail
  identically with the styling changes stashed, so it is **not** a
  regression from this pass. The unit suite (`npm run check`,
  663 tests) and the smoke E2E remain green.

End of milestone.

## Milestone links

- Previous: [[MILESTONE-9-PLAN]]
- Next: [[MILESTONE-9.1-PLAN]]
- Plan: [[MILESTONE-9-PLAN]]
