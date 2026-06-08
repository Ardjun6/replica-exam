# Milestone 9 Plan — Inline Live Preview, Themes, Graph, and Note UX Polish

> Status: **plan only — not implemented**. Implementation, tests,
> and documentation commits are out of scope for this file.

## 0. User intent (clarified — supersedes previous framing)

The user clarified twice. They do **not** want an Edit / Preview
toggle, do **not** want a per-block click-swap, and do **not** want
any visible mode indicator at all. They want the surface to feel
like a Microsoft-Word document.

Verbatim (clarification 1):

> in obsidian there isnt like a mark you can instantly press your
> cursor on some letters and the typing thing already starts to
> change words etc... AND only when it hits something of a
> markdown formatting elements
> so i dont want any blue mark thing what is added i want smooth
> and dynamic

Verbatim (clarification 2):

> no not correct i want it to feel like a word document type thing
> so like without the blue mark or anything until my text cursor
> comes in touch with the md formats

Concrete design contract:

- **One single Word-document-like surface.** Always present, always
  the same surface. No Edit/Preview split. No click-to-edit block
  swap. No Reading-mode toggle button. No "Live Preview" badge. No
  per-block border, hover ring, or focus outline ("the blue mark").
- The pane just looks like rendered text — like a Word document
  opened to a page.
- The cursor can be placed anywhere in that rendered text and
  **typing starts immediately at that position**. No mode switch
  exists at all.
- Markdown syntax (`**bold**`, `*italic*`, `# heading`, `> quote`,
  `- list`, `` `code` ``, `[[wikilink]]`, `[text](url)`, etc.)
  **renders inline as the user types.**
- The raw markers (`**`, `_`, `#`, `[[`, `]]`, …) are hidden by
  default. They become visible **only when the text cursor is
  touching that construct** (inside the construct, or on its
  surrounding marker characters). The moment the cursor leaves,
  the markers hide again.
- Nothing else in the UI hints that the surface is editable. There
  is no toolbar Read/Edit button, no kicker label, no segmented
  control, no chrome.

This supersedes both the previous "Edit / Preview toggle" framing
and the earlier "Reading-mode toggle" framing of this milestone.
The new architecture builds on the existing CodeMirror 6 editor
(`src/renderer/editor/createEditor.ts`) using its decoration API,
not on the current block-swap `LivePreviewPane`.

## Hard Constraints

- Do not copy Obsidian private code, assets, exact UI, branding,
  protocols, or proprietary behavior.
- Keep this an original Replica implementation inspired by common
  Markdown editor patterns.
- Do not break Canvas milestones 8A–8D.
- Do not remove the underlying Properties, YAML frontmatter, or
  Bases logic.
- Hide/remove the unwanted visible right-sidebar Properties and
  Outline tabs only; keep frontmatter support and property APIs
  intact.
- Do not add plugins, marketplace, sync, publish, URI/deep-link
  behavior, scripting, macros, arbitrary code execution, media/embed
  systems, database/spreadsheet features, or Obsidian compatibility
  claims.
- Keep renderer filesystem-free.
- Do not expose raw IPC.
- Keep existing typed preload/IPC boundaries.
- No `dangerouslySetInnerHTML` outside the existing audited
  `renderer/editor/preview.renderMarkdown` HTML pipeline.
- Keep the app shippable after each step.

---

## 1. Current State Review (grounded in the repo)

Files audited (no edits made):

- `src/renderer/components/MarkdownNotePane.tsx`
- `src/renderer/components/LivePreviewPane.tsx`
- `src/renderer/components/EditorPane.tsx`
- `src/renderer/components/PreviewPane.tsx`
- `src/renderer/editor/createEditor.ts`
- `src/renderer/editor/preview.ts`
- `src/renderer/components/workspace/PaneView.tsx`
- `src/renderer/components/workspace/WorkspaceShell.tsx`
- `src/renderer/components/RightPane.tsx`
- `src/renderer/app/feature-flags.ts`
- `src/renderer/components/settings/AppearanceSettings.tsx`
- `src/shared/settings.ts` (`THEME_PRESETS`, `ThemeMode`)
- `src/renderer/components/GraphView.tsx`
- `src/renderer/components/TagsPane.tsx`
- `src/renderer/components/OutlinePane.tsx`
- `src/renderer/components/PropertiesPane.tsx`
- `src/renderer/components/markdown/tag-edit.ts`

### 1.1 What the current note pane actually does

`MarkdownNotePane.tsx` already renders **only** `<LivePreviewPane>`
— there is no permanent side-by-side editor + preview in the
default flow. So the user's complaint is **not** "two surfaces side
by side"; it is the behavior of `LivePreviewPane.tsx`:

- The note is split into "blocks" via
  `core/markdown/live-preview.parseMarkdownBlocks`.
- Each block renders as a `<div role="button">` of rendered HTML.
- Clicking a block swaps **just that block** into a `<textarea>`
  containing the block's raw Markdown source.
- The textarea has its own border / focus ring (the "blue mark").
- A `<span class="live-preview-kicker">Live Preview</span>` is
  shown above the surface.
- Empty blank blocks render as `<button>Click to start writing</button>`.

That visible chrome and per-block swap is exactly what the user is
asking us to remove.

### 1.2 EditorPane / PreviewPane

`EditorPane.tsx` is a single CodeMirror 6 instance (`createEditor`)
with autosave + `Ctrl/Cmd+S`. It is **not** wired into the default
note flow today, but it is the natural foundation for the new Live
Preview surface (CM6 + decorations).

`PreviewPane.tsx` exists and is wired through
`renderer/editor/preview.renderMarkdown` (sanitized HTML). It will
be retained as the implementation surface for the optional
**Reading mode** toggle, so we do not introduce a second Markdown
rendering pipeline.

### 1.3 Right sidebar

`RightPane.tsx` still imports `OutlinePane`, `PropertiesPane`, and
references `outline` / `properties` in `TAB_LABELS` and the body
switch. However, `feature-flags.enabledRightPanes` already returns
only `[backlinks, search, tags, graph, bases]`. Under current
settings the tabs do not render — but the wiring is still
present.

### 1.4 Themes

`shared/settings.ts` defines `THEME_PRESETS` and `ThemeMode`, and
`AppearanceSettings.tsx` already renders a `theme-card-grid` of
`ThemeCard`s. Audit confirmed in Section 4 whether all seven user-
requested presets exist; if any are missing, M9 adds them. Theme
application uses CSS variables in `styles/theme.css` /
`styles/app.css`.

### 1.5 Graph

`GraphView.tsx` exists and is wired through both the right pane
(`graph`) and the ribbon "G" button in `App.tsx`. So Graph is
reachable. M9's job is to improve labeling/styling, not rebuild.

### 1.6 Tags

`MarkdownNotePane` already has an "Add tag" form calling
`buildAddTagUpdate` + `updateNoteProperties`. Functional but
visually clunky. M9 polishes the chip without changing the safe
write path.

### 1.7 Autofill console noise

```
[ERROR:CONSOLE(1)] "Request Autofill.enable failed. ..."
[ERROR:CONSOLE(1)] "Request Autofill.setAddresses failed. ..."
```

This is Chromium DevTools Protocol noise emitted by the docked
DevTools front-end asking the renderer for autofill capabilities
that Electron does not implement. It is **not** an app error and
does not affect runtime behavior; production users (DevTools
closed) never see it. Plan in Section 8.

---

## 2. Editor mode redesign — true inline Live Preview

This is the central deliverable of M9. The block-level swap in
`LivePreviewPane.tsx` is **replaced** with a single CodeMirror 6
surface that decorates the document inline.

### 2.1 Why CodeMirror 6

- Already a dependency (`createEditor.ts`).
- The CM6 decoration API supports exactly the visual model the user
  wants:
  - `Decoration.replace` to hide marker characters (`**`, `__`, `#`,
    backticks, `[[`, `]]`, `>`, …) outside the cursor's line/range.
  - `Decoration.mark` to apply inline classes (`cm-strong`,
    `cm-emphasis`, `cm-heading-1`, `cm-wikilink`, …).
  - `Decoration.widget` for non-text tokens (checkbox squares for
    `- [ ]`).
  - Atomic ranges (`{ atomic: true }`) so a hidden `**` does not
    trap the caret.
- Cursor changes drive decoration recomputation through CM6's
  `ViewPlugin` `update.selectionSet`, with no React re-render
  cascade.
- The existing `@codemirror/lang-markdown` grammar tells us where
  every construct is — we do not roll our own parser.
- The audited safe HTML pipeline (`preview.renderMarkdown`) is
  **only** used for Reading mode and for ad-hoc renderings (e.g. in
  Canvas notes), not inside Live Preview. Live Preview renders via
  text-level CSS classes, not innerHTML.

### 2.2 What renders inline

The decorations are scoped to safe, well-defined Markdown elements:

| Markdown                | Hidden when cursor is elsewhere    | Visible style              |
|-------------------------|------------------------------------|----------------------------|
| `# Heading`             | leading `#…` + space               | `cm-heading-1..6` size     |
| `**bold**`              | leading + trailing `**`            | `cm-strong` (font-weight)  |
| `*italic*` / `_italic_` | the markers                        | `cm-emphasis` (italic)     |
| `` `code` ``            | surrounding backticks              | `cm-inline-code`           |
| ` ```block``` `         | fence lines                        | `cm-code-block`            |
| `> quote`               | leading `>` + space                | `cm-blockquote` (border)   |
| `- list`, `1. list`     | bullet/number marker (cosmetic)    | `cm-list-marker`           |
| `- [ ] / - [x]`         | task syntax → checkbox widget      | rendered checkbox          |
| `[[wikilink]]`          | brackets                           | `cm-wikilink` (link color) |
| `[text](url)`           | brackets + URL                     | `cm-link`                  |
| `---` rule              | the dashes                         | `cm-hr` (rule line)        |
| frontmatter             | full block                         | dimmed `cm-frontmatter`    |

The "hidden when cursor is elsewhere" column is the smoothness the
user is asking for: markers reappear only on the line/range the
cursor is currently inside.

### 2.3 Cursor-driven marker visibility

A small CM6 `ViewPlugin` maintains a `RangeSet<Decoration>` that:

1. Walks the parsed Markdown for the visible viewport. (CM6 already
   scopes parse work to the viewport, so this is cheap.)
2. For each construct, emits `replace` decorations over the marker
   characters and `mark` decorations over the content.
3. Subscribes to `update.selectionSet`. When the new main selection
   crosses into a construct, the `replace` decorations covering
   that construct's markers are dropped from the set, exposing the
   raw text. When the cursor leaves, they are restored.
4. Re-runs only when `update.docChanged`, `update.viewportChanged`,
   or `update.selectionSet` is true.

The plugin is **pure with respect to the renderer's filesystem
boundary**: it reads `EditorState.doc` and the syntax tree, and
emits decorations. It never touches IPC.

### 2.4 Save / load / autosave

- The Live Preview surface owns the underlying text the same way
  `EditorPane` does:
  - `api().readNote(path)` on mount and on `refreshKey` bump.
  - Debounced `api().writeNote(path, doc)` on edit.
  - `Ctrl/Cmd+S` immediate flush.
  - `beforeunload` flush.
- `flushSave()` is exposed through the same controller hook so
  `MarkdownNotePane`'s tag-add flow keeps working unchanged.
- Frontmatter remains a single dimmed block — Live Preview does
  **not** edit YAML through decorations. The Add Tag affordance
  (Section 7) is the only frontmatter mutation path.

### 2.5 No Reading-mode toggle

There is **no Reading-mode toggle button** in this milestone. The
user's "Word document feel" requirement excludes any visible mode
indicator. The single Live Preview surface is always present.

Reading mode (and the existing `PreviewPane`) is moved to
**explicit deferral** (Section 11). It remains in the codebase
unchanged for future re-use (e.g. printing, exporting), but is not
mounted anywhere in the default note pane.

### 2.6 Visible chrome removal — extended

- Remove `<span class="live-preview-kicker">Live Preview</span>`.
- Remove `<button>Click to start writing</button>` placeholders.
- Remove the per-block `role="button"` wrappers and their CSS
  borders / hover backgrounds (the "blue mark").
- The Live Preview surface has the same visual chrome as a regular
  CodeMirror editor: just text, no badges.
- The pane toolbar in `MarkdownNotePane` retains only:
  - the note path label,
  - the tag chip row,
  - the `+ tag` affordance,
  - existing tab/split actions in the upstream `TabStrip`.
- No Read/Edit segmented control. No mode dropdown. No status-bar
  mode indicator.
- The CSS for the surface explicitly avoids visible focus rings,
  hover backgrounds, or "active line" highlight bars. The page
  background, padding, and typography match the read-only `.markdown`
  prose styles so that the surface visually reads as rendered
  text, not as an editor.
- The CodeMirror caret remains visible (so the user can see where
  the text cursor sits), but no other CodeMirror chrome (gutters,
  fold markers, active-line backgrounds, selection rings outside a
  real selection) is shown.

### 2.7 Migration plan for current files

- Replace the implementation of `LivePreviewPane.tsx` with a thin
  wrapper around the new CodeMirror Live Preview view, or delete
  the file and import the new view directly from
  `MarkdownNotePane.tsx`.
- Create `src/renderer/editor/livePreview/` with:
  - `livePreviewExtension.ts` — CM6 decoration plugin.
  - `decorationBuilder.ts` — pure functions that turn a syntax-tree
    walk + selection range into `RangeSet<Decoration>`.
  - `livePreviewTheme.css` — `cm-strong`, `cm-emphasis`, `cm-heading-*`,
    `cm-wikilink`, `cm-blockquote`, etc., scoped under `.cm-editor`.
- `core/markdown/live-preview.ts` (`parseMarkdownBlocks`,
  `replaceMarkdownBlock`, `isEditableMarkdownBlock`) is no longer
  used by the renderer. Either delete after the renderer migration
  or leave with a `@deprecated` comment if any test still depends
  on it. Tests using it are migrated to the new decoration helpers.

---

## 3. Inline rendering & typography

The Live Preview surface and the existing `.markdown` /
`.preview-body` styles share **one** CSS-variable-driven type
system so that the editable surface visually matches "a Word
document on the page." Reading mode itself is deferred (§11) but
its typography work still happens here because Live Preview reuses
the same styles for its inline classes (`cm-strong`, `cm-heading-*`,
`cm-blockquote`, …).

Targets:

- UI font stack: `"Inter", "Segoe UI", system-ui, -apple-system,
  sans-serif`.
- Body prose stack: `Georgia, "Iowan Old Style", "Source Serif
  Pro", serif` (behind `settings.uiFontFamily` — bundled, no
  download).
- Code stack: `"JetBrains Mono", Menlo, Consolas, monospace`.
- Heading scale: H1 `1.875rem`, H2 `1.5rem`, H3 `1.25rem`, H4–6
  `1.0625rem` semibold.
- Paragraph: `line-height: 1.6`, `margin-block: 0.75rem`.
- Lists: `padding-inline-start: 1.5rem`, comfortable nested indent.
- Code blocks: padded, border-radius, color from theme variables.
- Inline code: contrast background, slight padding.
- Comfortable reading width: `max-width: 72ch; margin-inline: auto`
  on the prose container.
- Live Preview and Reading mode reuse the same CSS variables so
  the look is consistent across modes and themes.
- Sanitization: unchanged. Reading mode continues to use the
  existing audited `renderMarkdown` pipeline.

---

## 4. Theme system

### 4.1 Presets

Final set (extending whatever already exists in `THEME_PRESETS`):

- `system` (existing — follows OS dark/light)
- `light` (existing)
- `dark` (existing)
- `black` (new — pure black background, white text, minimal
  ornamentation; distinct from `dark`)
- `white` (new — pure white background, near-black text)
- `orange` (new — warm amber accent on a near-dark surface)
- `purple` (new — Obsidian-flavored *aesthetic* but original CSS
  values; we do not copy Obsidian hex values, class names, or
  assets)
- `green` (new — forest accent on a near-dark surface)

Each preset is a row in `THEME_PRESETS` with `value`, `label`,
`accent`, wired through `isDark()` so the `data-theme` body
attribute remains correct. Unknown values fall back to `system` via
the existing `asThemeMode` validator.

### 4.2 Preview swatches

`AppearanceSettings.ThemeCard` already renders a small mock
surface. Improve it so the swatch actually previews the theme's
background + text + accent:

- 2-column thumbnail: a "sidebar" strip in the theme's sidebar
  color, a "content" rectangle in the theme's background color
  with sample heading + paragraph lines in the text color and an
  accent-colored chip.
- The card border uses the theme's accent on selection.
- Cards stay keyboard-navigable (already `role="radio"`).

### 4.3 CSS variable shape

Every preset writes the same variable set into
`:root[data-theme="<preset>"]`:

```
--surface-bg
--surface-fg
--surface-muted
--surface-border
--accent
--accent-fg
--editor-bg
--editor-fg
--editor-marker        /* dim color for raw markdown markers */
--code-bg
--code-fg
--sidebar-bg
--sidebar-fg
--hover-bg
--selected-bg
--link-fg
```

Components consume these variables; they never hard-code hex.

### 4.4 Safety boundaries (unchanged)

- No external CSS download.
- No user CSS injection.
- No theme marketplace.
- No remote theme loading.
- No `style` attribute strings supplied from disk.
- Tampered settings files fall back through `asThemeMode`.

---

## 5. Graph access

`GraphView.tsx` already exists and is wired through the right pane
and a ribbon "G" button.

Plan:

1. Confirm the ribbon "G" button is visible, labeled "Graph"
   (tooltip + accessible name), styled with the new theme
   variables.
2. Confirm the palette command "Switch to Graph" exists (already
   generated from `enabledPanes` in `App.tsx`).
3. Confirm clicking a graph node calls `onOpenNote(path)`.
4. If the existing graph has obvious deficiencies (overlapping
   nodes, missing labels, etc.), apply only the smallest safe
   visual polish in scope. Larger graph work is deferred (Section
   11).
5. Renderer remains filesystem-free; data flows through
   `api().graph()` / `api().graphLocal()` exactly as today.

---

## 6. Right sidebar cleanup

Concrete plan in `RightPane.tsx`:

- Drop `outline` and `properties` from `TAB_LABELS`.
- Drop the `<OutlinePane … />` and `<PropertiesPane … />` branches
  from the body switch.
- Drop the imports for `OutlinePane` and `PropertiesPane`.
- Tighten the `RightPane` union (in `app/store.ts`) so `'outline'`
  and `'properties'` are not assignable. Persisted workspace
  values that still reference them are coerced through the
  existing `resolveActivePane` fallback to the first enabled pane.
- Update `feature-flags.PANE_FLAGS` comments to match the new
  reality (the actual list already omits outline/properties).
- Keep `OutlinePane.tsx`, `PropertiesPane.tsx`, `core/markdown/*`,
  `BasesPane`, and the typed `noteUpdateProperties` IPC untouched.
- Delete files only if nothing else imports them after the wiring
  is removed; otherwise leave dormant and flag in `MILESTONE-9.md`
  for a future cleanup pass.
- Sidebar styling: theme variables from Section 4 replace
  hard-coded colors. Tabs get padding and consistent hover/active
  states from `--hover-bg` / `--selected-bg`.

---

## 7. Easy tag adding

The existing affordance in `MarkdownNotePane` already calls the
safe `buildAddTagUpdate` + `updateNoteProperties` path. M9 polishes:

- Replace the "No tags" + "Add tag" cluster with a single `+ tag`
  chip next to the existing tag list near the note title. Pressing
  it opens an inline input.
- Enter submits, Escape cancels (already supported by the form;
  add explicit `onKeyDown` so it behaves like a chip editor).
- Accept input with or without leading `#`; `buildAddTagUpdate`
  already normalizes both forms — confirmed via test.
- Validate against `TAG_INPUT_MAX_LENGTH`; reject empty / blank;
  reject duplicates by checking the existing `index.tags` array
  before issuing the IPC call.
- Show inline error chip next to the input if invalid (not a
  growing error list under the toolbar).
- No new IPC. No new preload method. No new frontmatter access
  path.

Edge cases covered by tests:

- Add a fresh tag.
- Add `#tagWithHash` — leading `#` is stripped before normalization.
- Add empty / whitespace-only tag — rejected with a clear message.
- Add an already-present tag — rejected (no IPC call).
- Add a tag with unsafe characters (whitespace, `:`, control
  chars) — rejected.
- Add a tag while another save is in flight — the existing
  `flushSave` already gates this; confirm it still works.

---

## 8. Autofill console noise

Investigation:

1. The messages come from the DevTools front-end's Autofill panel,
   which sends `Autofill.enable` and `Autofill.setAddresses` over
   CDP. Electron's renderer does not implement these, so DevTools
   logs `wasn't found`.
2. This is a **DevTools-only** message; production users (DevTools
   closed) never see it.

Safe fix (smallest, recommended):

- In `main/main.ts`, when in dev, attach a console-message listener
  that drops messages whose text starts with `Request Autofill.`:

  ```ts
  if (process.env.NODE_ENV !== 'production') {
    win.webContents.on('console-message', (event, _level, message) => {
      if (message.startsWith('Request Autofill.')) event.preventDefault();
    });
  }
  ```

  `preventDefault()` silences only those messages. Every other
  console message logs normally. The filter is dev-only so
  production logging stays untouched.

Fallback:

- If suppression turns out to be Electron-version unstable,
  document it as DevTools-only noise in the README troubleshooting
  section. Do not add a global console silencer.

Strict non-goals:

- Do **not** silence all console errors.
- Do **not** disable DevTools.
- Do **not** monkey-patch `console.error`.
- Do **not** ship a `process.stderr` filter.

---

## 9. Tests

All tests use the existing harness (`vitest` + Playwright). No new
IPC means no new IPC contract tests.

### 9.1 Live Preview unit tests

- `live-preview-decorations.test.ts`:
  - Given a parsed Markdown document, the decoration builder emits
    `replace` ranges over the expected marker characters.
  - With the cursor outside every construct, **all** markers are
    hidden (Word-doc default state).
  - When the cursor enters a construct, **only that construct's**
    markers become visible — neighbouring constructs stay hidden.
  - When the cursor leaves the construct, its markers hide again
    on the same view update.
  - Atomic ranges do not trap the cursor when arrow keys cross a
    marker.
  - Edge case: nested constructs (e.g. `**bold *italic***`) do not
    leave dangling marker visibility.
- `live-preview-chrome.test.tsx`:
  - The mounted Live Preview pane renders no `live-preview-kicker`
    element.
  - The mounted Live Preview pane renders no Read/Edit toggle
    button, no segmented control, no "Click to start writing"
    placeholder.
  - The surface DOM does not include CodeMirror gutters, fold
    markers, or active-line highlight elements.

### 9.2 Renderer boundary tests

Extend `tests/canvas-renderer-boundary.test.ts` (or add a sibling)
to assert that the new editor files do not import `fs`, `path`,
`electron`, `ipcRenderer`, and do not use
`dangerouslySetInnerHTML` outside the existing audited Markdown
renderer.

### 9.3 Theme tests

- `appearance-settings.test.tsx`:
  - The grid renders one card per preset.
  - Clicking a card calls `updateSettings` with
    `{ theme, accentColor }`.
  - The selected card has `aria-checked="true"`.
- `theme-resolver.test.ts`:
  - `asThemeMode` falls back to `'system'` on unknown values.
  - `isDark` returns the expected boolean per preset.

### 9.4 Right-pane test

- `right-pane.test.tsx`:
  - Renders only the enabled tabs (no `Outline`, no `Properties`).
  - Switches body content when a tab is selected.
  - Persisted `rightPane: 'outline'` resolves to the first enabled
    tab without throwing.

### 9.5 Graph entry test

- `graph-access.test.tsx`:
  - The ribbon "Graph" button calls `selectPane('graph')` and has
    a tooltip + accessible name.
  - The "Switch to Graph" command is present in the command list.

### 9.6 Autofill noise filter test

- `dev-console-filter.test.ts`:
  - Pure predicate returns `true` for the two Autofill messages
    and `false` for unrelated messages (so real errors are never
    suppressed).
  - Runs against the predicate, not against Electron — stays in
    vitest.

### 9.7 Tag editing tests

- `tag-edit.test.ts` (extend):
  - Confirms the duplicate / invalid / empty / leading-`#` cases
    listed in Section 7.

### 9.8 E2E

- The existing canvas E2E (`tests/e2e/canvas.spec.ts`) must still
  pass — M9 does not touch Canvas.
- New `tests/e2e/note-live-preview.spec.ts`:
  - Opens a note with `# Heading` and `**bold text**`.
  - Asserts the rendered heading element exists and **no** `#` or
    `**` markers are visible anywhere on screen (the page reads as
    finished text — the Word-doc state).
  - Moves the cursor onto the heading line and asserts the `#`
    becomes visible.
  - Moves the cursor off again and asserts the `#` hides.
  - Moves the cursor inside the bold span and asserts both `**`
    markers reveal; moves the cursor away and asserts they hide.
  - Types into bold text and asserts the surrounding text remains
    bold without a swap-to-textarea flash.
  - Asserts the pane contains no `live-preview-kicker`, no
    `live-preview-empty-block` button, no per-block border outline,
    no Read/Edit button, no segmented control.

### 9.9 Canvas regression guard

- `tests/canvas-edit.test.ts` and
  `tests/canvas-renderer-boundary.test.ts` must continue to pass
  unchanged.
- `tests/e2e/canvas.spec.ts` must continue to pass unchanged.

---

## 10. Documentation

After implementation:

- Create `MILESTONE-9.md` describing what shipped, the Live Preview
  contract, the new theme presets, the right-pane cleanup, the
  Reading-mode toggle, the tag chip, and the Autofill suppression.
- Update `README.md`:
  - Replace any "Editor / Preview" wording with "Live Preview" +
    optional Reading mode.
  - List the seven theme presets.
  - Add a "DevTools noise" note pointing at the Autofill filter.
- Update `ROADMAP.md` with a 9 entry and a forward pointer.
- Update `ARCHITECTURE.md` to add a "Renderer → Editor → Live
  Preview" subsection describing the CodeMirror decoration
  pipeline, atomic ranges, and the read-only `PreviewPane`
  Reading-mode swap.

---

## 11. Explicit deferrals

Out of scope for Milestone 9 and explicitly not implemented:

- **A Reading-mode toggle / button / shortcut.** The Word-doc-feel
  requirement forbids visible mode chrome. `PreviewPane` and
  `renderMarkdown` remain in the codebase for future re-use (e.g.
  printing, exporting, Canvas note previews) but are not mounted
  inside the default note pane.
- **A Source mode** (raw Markdown editor toggle). Same reason as
  above. Would be cheap to add later by re-mounting `EditorPane`.
- Full parity with Obsidian's Live Preview (embedded queries,
  Dataview, callouts, mermaid, advanced reading-mode features).
- Community theme marketplace.
- Arbitrary user CSS / CSS snippets.
- Plugin system or scripting.
- Sync, publish, or URI/deep-link protocols.
- Mobile layout.
- Advanced graph physics, filters, or per-node settings.
- Removing properties internals (Bases, frontmatter, IPC) — only
  the right-sidebar tab wiring is removed.
- Canvas changes beyond keeping 8A–8D green.
- Replacing `core/markdown/preview.renderMarkdown` with a
  different Markdown pipeline.
- New preload methods or IPC channels — the milestone uses only
  existing typed methods (`readNote`, `writeNote`,
  `updateNoteProperties`, `listNotes`, `graph`, `graphLocal`,
  `settingsUpdate`, `replaceWorkspace`).

---

## 12. Recommended implementation order

### Step 1 — Baseline & gates

- Run `npm run check`, `npm run build`, `npm run test:e2e`, and
  `npm run dev` before any code change. Stop and report if the
  baseline fails.

### Step 2 — Live Preview foundation

- Create `src/renderer/editor/livePreview/decorationBuilder.ts`
  (pure: syntax tree + selection range → `RangeSet<Decoration>`).
- Create `livePreviewExtension.ts` (CM6 `ViewPlugin` driving the
  builder).
- Create `livePreviewTheme.css` (markers, headings, code, etc.).
- Unit tests for the decoration builder.

### Step 3 — Live Preview pane wiring

- Replace the body of `LivePreviewPane.tsx` (or introduce
  `LivePreviewView.tsx` and update `MarkdownNotePane`) to mount the
  new CodeMirror surface.
- Wire `flushSave` / `Ctrl/Cmd+S` / autosave through the same
  controller shape as the previous pane.
- Remove `live-preview-kicker`, `live-preview-empty-block`, and
  the per-block role="button" wrappers.
- Verify no `dangerouslySetInnerHTML` in the new code path.

### Step 4 — Right sidebar cleanup

- Trim `TAB_LABELS`, body switch, and imports in `RightPane.tsx`.
- Tighten the `RightPane` union in `app/store.ts`.
- Sidebar styling pass with theme variables.

### Step 5 — Theme presets & cards

- Extend `THEME_PRESETS` with the missing presets.
- Update `theme.css` variable sets for each preset.
- Upgrade `ThemeCard` swatch art.
- Migrate any hard-coded colors in components to CSS variables.

### Step 6 — Shared typography pass

- Update `.markdown` / `.preview-body` typography (still used by
  Canvas note previews and any future read-only render).
- Reuse the same CSS variables for Live Preview spans
  (`cm-strong`, `cm-heading-*`, `cm-blockquote`, etc.).

### Step 7 — Easy tag chip

- Polish `MarkdownNotePane`'s tag affordance into a `+ tag` chip
  with inline input and inline error chip.

### Step 8 — Autofill noise filter

- Add dev-only console filter in `main/main.ts`.
- Add the pure predicate test.

### Step 9 — Documentation & final gates

- Create `MILESTONE-9.md`.
- Update README / ROADMAP / ARCHITECTURE.
- Run `npm run check`, `npm run build`, `npm run test:e2e`,
  `npm run dev`.

---

## 13. Risks and mitigations

### Risk: Live Preview decoration plugin destabilizes editing

Mitigation:

- Build decorations from the parsed syntax tree (existing
  `@codemirror/lang-markdown`), not from regex on raw text.
- Mark hidden ranges atomic so caret stepping never strands.
- Unit-test marker visibility on selection changes.
- There is intentionally **no** Reading-mode escape hatch — that
  was rejected by the user. Instead, mitigation is comprehensive
  unit + e2e coverage of the decoration plugin so a regression is
  caught before merge.

### Risk: Word-doc surface accidentally exposes editor chrome

Mitigation:

- The chrome-removal test (`live-preview-chrome.test.tsx`) asserts
  the absence of gutters, fold markers, active-line highlights,
  Read/Edit buttons, and the kicker label.
- The E2E test reads the rendered DOM and asserts no `**`/`#`
  text is visible when the cursor is outside markdown constructs.

### Risk: Theme preset migration breaks old settings

Mitigation:

- `asThemeMode` already normalizes unknown values to `system`.
- Existing `light`/`dark`/`system` values remain valid.
- Preserve `accentColor` until a later cleanup.

### Risk: Hiding sidebar tabs breaks Bases / Properties internals

Mitigation:

- Only the visible wiring is removed (`RightPane.tsx` + the union).
- Do not delete property schema, panes, preload API, or Bases
  editing paths.
- Run Bases/property tests unchanged.

### Risk: Tag chip rewrites notes unsafely

Mitigation:

- Use only `updateNoteProperties` via `buildAddTagUpdate`.
- Disable writes when YAML is malformed (existing surface).
- Renderer remains filesystem-free.

### Risk: Autofill suppression hides real errors

Mitigation:

- Filter is dev-only and only matches messages starting with
  `Request Autofill.`.
- Predicate test guards against regex/scope creep.

### Risk: Canvas regression

Mitigation:

- Keep Canvas routing branch in `PaneView` intact.
- Run `tests/e2e/canvas.spec.ts` and `canvas-edit.test.ts`.
- Avoid touching Canvas schema, IPC, or renderer helpers.

---

## 14. Acceptance criteria

A Milestone 9 implementation is complete when **all** of the
following hold:

1. Opening a Markdown note shows a single Word-document-like
   surface. No side-by-side editor + preview. No "Live Preview"
   badge. No Read/Edit toggle button or segmented control. No
   "Click to start writing" placeholder. No per-block border or
   "blue mark." No gutters, fold markers, or active-line highlight.
2. With the cursor outside every Markdown construct, no raw
   markdown markers (`**`, `#`, `[[`, `]]`, `` ` ``, `>`, `-`, …)
   are visible anywhere on screen. The page reads as finished text.
3. The cursor can be placed anywhere in that rendered text and
   typing happens immediately at that position. No mode switch
   exists.
4. The moment the cursor enters a Markdown construct, **only that
   construct's** markers become visible so the user can edit them.
   The moment the cursor leaves, those markers hide again. No
   other construct's markers reveal in the process.
5. Markdown syntax renders inline as the user types. `**bold**`
   appears bold, `# heading` appears as a heading, `[[wikilink]]`
   appears as a link.
6. Appearance settings show preview cards for every preset:
   black, white, dark, light, orange, purple, green (plus the
   existing `system` option).
7. Selecting a preset updates the live UI and persists in settings.
8. The right sidebar shows only Backlinks, Search, Tags, Graph,
   and Bases. Outline and Properties tabs are gone from the UI.
9. The ribbon's Graph button (and the "Switch to Graph" palette
   command) opens the graph; clicking a graph node opens the note.
10. Adding a tag is a one-chip affordance with inline validation;
    duplicates and unsafe input are rejected with a clear message.
11. The Autofill console messages are suppressed in dev via the
    narrow filter in `main/main.ts`, OR the user-facing README
    documents them as harmless DevTools noise if the filter is not
    viable. No global console silencer is added.
12. Renderer remains filesystem-free. No new IPC channel. No new
    preload method. No `dangerouslySetInnerHTML` outside the
    existing audited Markdown renderer.
13. Canvas 8A–8D tests and behavior are unchanged.
14. `npm run check`, `npm run build`, `npm run test:e2e`, and
    `npm run dev` all pass on a clean checkout.

---

End of plan.

## Milestone links

- Previous: [[MILESTONE-8D]]
- Next: [[MILESTONE-9]]
- Implementation: [[MILESTONE-9]]
