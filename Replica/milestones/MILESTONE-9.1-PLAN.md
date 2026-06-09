# Milestone 9.1 Plan - Live Preview Markdown Editing And Obsidian-Inspired Layout Polish

Milestone 9.1 corrects the Markdown editing model after Milestone 9. Replica
now has one-surface Edit and Preview modes, but the desired everyday workflow
is closer to Live Preview:

- rendered Markdown is visible most of the time;
- clicking or focusing a heading, paragraph, list, quote, or code block makes
  that block editable as Markdown;
- leaving or committing the block renders it again;
- raw Source Mode remains available as an advanced fallback;
- Reading mode remains a pure read-only surface if useful;
- no permanent editor/preview split returns.

This must remain an original Replica implementation inspired by common
Markdown editor patterns. It must not copy Obsidian private code, assets, exact
CSS, icons, branding, protocols, or proprietary behavior.

## Hard Constraints

- Do not copy Obsidian private code, assets, exact UI, exact CSS, icons,
  branding, protocols, or proprietary behavior.
- Build an original Obsidian-inspired layout and Live Preview model.
- Do not claim Obsidian compatibility.
- Keep renderer filesystem-free.
- Do not expose raw IPC.
- Do not add plugins, marketplace, sync, publish, URI/deep-link behavior,
  scripting, macros, arbitrary code execution, arbitrary CSS snippets,
  downloaded themes, media/embed systems, or database/spreadsheet behavior.
- Do not break Canvas 8A-8D.
- Do not break Milestone 9 theme presets, Graph access, Add tag, or hidden
  Outline/Properties behavior.
- Keep app shippable after each step.

## Current State Review

Milestone 9 introduced a one-surface note pane, but it is still mode-based.

- `MarkdownNotePane.tsx` owns the Markdown note surface, toolbar, tag controls,
  and Edit / Preview selection.
- `EditorPane.tsx` hosts CodeMirror for full-document source editing.
- `PreviewPane.tsx` renders sanitized Markdown for read-only preview.
- `editor/createEditor.ts` creates the CodeMirror instance and handles editor
  commands such as save.
- `editor/preview.ts` converts Markdown to sanitized rendered HTML.
- `styles/app.css` and `styles/theme.css` define the new note surface,
  preview typography, sidebars, and theme tokens.
- `settings.ts` now has schema v4 and `markdownViewMode`.

This is not enough for Live Preview because the user still has to switch the
whole note between source editing and rendered reading. The requested flow is
block-local: rendered by default, editable only where the cursor is active.

## Live Preview Architecture Options

### Option A - CodeMirror-based Live Preview

Use CodeMirror language parsing, decorations, and widgets to render Markdown
syntax as rich visual blocks while keeping a single editor document underneath.

Potential benefits:

- one canonical document model;
- cursor, undo, selection, and keyboard behavior stay editor-native;
- edits naturally preserve the whole document;
- future inline syntax reveal can be more precise.

Risks:

- significantly more complex than the current editor wrapper;
- requires careful CodeMirror extension work for headings, emphasis, lists,
  code fences, blockquotes, links, and widgets;
- cursor/selection edge cases can be subtle;
- harder to ship incrementally without destabilizing ordinary editing;
- rendering arbitrary Markdown inside editor widgets must remain sanitized.

This is the likely long-term direction, but it is risky for a small polish
milestone unless scoped to very few syntax decorations.

### Option B - Block-based Renderer With Focused Block Editor

Parse the Markdown document into coarse blocks, render those blocks, and swap a
focused block into a textarea or small CodeMirror editor when the user clicks
it. On commit, replace only that block range in the original Markdown string
and save through the existing note write path.

Potential benefits:

- easier to reason about and test;
- naturally matches "click a block, edit that block";
- can preserve unrelated Markdown text exactly;
- uses current sanitized preview renderer for unfocused content;
- keeps Source Mode as the escape hatch for complex edits;
- shippable in small slices.

Risks:

- not full Live Preview parity;
- multi-block selections and complex nested Markdown are limited;
- block range tracking must be careful around frontmatter and blank lines;
- textarea editing will feel less seamless than a mature editor-native Live
  Preview;
- undo/redo across block edits may initially be simpler than full editor undo.

### Recommendation

Implement Option B first: a safe block-focused Live Preview. It best fits
Replica's current architecture and the milestone's need for shippability.

Default mode should become `livePreview`. Source Mode should remain available
using the existing `EditorPane`. Reading mode can continue using `PreviewPane`
as a pure read-only view.

Defer full CodeMirror decoration-based Live Preview until the block model has
validated the UX and the app has enough tests around document transforms.

## Live Preview Behavior

Milestone 9.1 should introduce a `LivePreviewPane` or similarly named
component.

Unfocused rendering:

- headings render as headings;
- paragraphs render as prose;
- bullet and numbered lists render as lists;
- code fences render as code blocks;
- inline code renders visually;
- blockquotes render as quoted text;
- links continue through the existing safe note-open behavior where possible;
- no unsafe HTML injection is introduced.

Focused editing:

- clicking a rendered block makes that block editable;
- focused block shows its underlying Markdown source;
- blur commits by default;
- Enter behavior should remain natural for multiline text;
- Cmd/Ctrl+Enter commits explicitly;
- Escape cancels the current block edit and restores the original rendered
  block;
- Ctrl/Cmd+S commits the current block and saves the note;
- autosave still works after committed block changes;
- focus target and hover states should make the editable area obvious without
  turning the whole document into raw Markdown.

Interaction rules:

- empty note shows a clear editable starter block;
- clicking outside the active block commits if valid;
- switching to Source Mode commits or asks before discarding a dirty block;
- switching notes while a block is dirty commits first if safe;
- malformed Markdown should remain editable through Source Mode.

## Markdown Document Update Model

Add pure helpers for block parsing and document patching, likely under:

```text
src/core/markdown/live-preview.ts
```

or, if the helpers are renderer-only but still pure:

```text
src/renderer/components/markdown/live-preview-model.ts
```

Recommended block model:

```ts
interface MarkdownBlock {
  id: string;
  type: 'frontmatter' | 'heading' | 'paragraph' | 'list' | 'code' | 'blockquote' | 'blank' | 'other';
  startOffset: number;
  endOffset: number;
  source: string;
}
```

Update rules:

- preserve frontmatter exactly;
- do not expose frontmatter as a normal editable Live Preview block in 9.1;
- replace only the active block's `[startOffset, endOffset)` range;
- preserve the rest of the file byte-for-byte where possible;
- keep surrounding blank lines stable unless the edited block explicitly
  changes them;
- parse headings, paragraphs, list runs, code fences, and blockquotes;
- treat complex tables, HTML blocks, nested mixed structures, and unusual
  Markdown as `other` blocks that can still be edited as source for that block;
- if block parsing is unsure, prefer Source Mode over destructive transforms.

Important limitations to document:

- multi-block editing can be deferred;
- list item splitting/merging may be simple in the first slice;
- tables are not WYSIWYG;
- exact cursor preservation inside rendered blocks is deferred.

## Source Mode And Reading Mode

Milestone 9.1 should rename the note mode model from Edit / Preview to:

- `livePreview` - default everyday editing mode;
- `source` - full raw Markdown editor using existing `EditorPane`;
- `reading` - pure rendered read-only mode using existing `PreviewPane`.

Settings migration:

- old `markdownViewMode: 'edit'` should migrate to `source` only if preserving
  an explicit user preference is more important than the new default;
- default settings should use `livePreview`;
- old `markdownViewMode: 'preview'` should map to `reading`;
- old `showPreview: true` should map to `reading` when no explicit mode exists;
- unknown modes should normalize to `livePreview`.

UI:

- make Live Preview the first and default option;
- keep Source visible but secondary;
- keep Reading visible only if it remains useful;
- do not reintroduce a split editor/preview toggle.

## Layout Polish

Milestone 9.1 should improve the app shell toward an original
Obsidian-inspired structure without copying exact UI, icons, CSS, or assets.

Planned layout direction:

- left vertical ribbon/action bar for primary app actions;
- file explorer sidebar with clearer folder tree and active file highlight;
- tab bar across the top of workspace panes;
- breadcrumb path above note content;
- centered readable note content;
- right sidebar remains collapsible and clean;
- bottom status bar may show backlinks, word count, or character count when
  available without adding a heavy analytics system;
- Graph access remains visible;
- Outline and Properties remain hidden from visible right tabs;
- spacing, borders, hover states, and selected states use existing theme tokens.

Implementation guidance:

- prefer CSS variable refinements over large component rewrites;
- keep workspace split panes intact;
- do not change Canvas routing unless a regression fix requires it;
- use existing icon assets or text labels rather than copying external icons.

## Theme And Typography Integration

Live Preview, Source Mode, Reading mode, sidebars, and code blocks must remain
readable in all built-in themes:

- black;
- white;
- dark;
- light;
- orange;
- purple;
- green.

Rules:

- use existing CSS variables;
- improve readable body and prose font stacks without network fonts;
- keep editor font configurable and monospace by default;
- ensure inline code and code fences have adequate contrast;
- keep the purple theme visually aligned with the desired direction without
  copying Obsidian assets, exact palette, or branding;
- avoid one-off hardcoded colors in Live Preview components.

## Tags And Metadata

Milestone 9's Add tag affordance remains in scope and must work in Live
Preview.

Requirements:

- Add tag remains visible for Markdown notes;
- tag writes continue through `updateNoteProperties`;
- frontmatter support stays intact;
- malformed YAML still blocks tag writes safely;
- no Properties tab returns;
- Bases and property internals remain untouched;
- Live Preview block parsing must not rewrite frontmatter.

## Graph And Sidebar

Graph and the right sidebar should remain stable.

Requirements:

- Graph remains visible and easy to open;
- Backlinks, Search, Tags, Bases, and Graph remain available when enabled;
- Outline and Properties remain hidden;
- command palette does not advertise hidden Outline/Properties pane commands;
- clicking Graph nodes still opens notes;
- no graph rebuild unless a concrete bug requires it.

## Tests Needed

Add focused tests before or alongside implementation.

Block parser and document patching:

- default Markdown mode is Live Preview;
- headings parse as blocks;
- paragraphs parse as blocks;
- list runs parse as blocks;
- fenced code blocks parse as blocks;
- blockquotes parse as blocks;
- frontmatter remains intact and non-editable through normal Live Preview;
- editing a paragraph replaces only that paragraph;
- editing a list block replaces only that list;
- editing a code fence replaces only that fence;
- Escape/cancel restores the original block source;
- complex/unknown blocks fall back safely.

Renderer behavior:

- headings render when unfocused and become editable when focused;
- paragraph block edit updates the document;
- list block edit updates the document;
- code fence block edit updates the document;
- Cmd/Ctrl+Enter commits;
- Ctrl/Cmd+S saves;
- Source Mode still opens the full CodeMirror editor;
- Reading mode still uses sanitized preview rendering;
- no forced editor/preview split returns.

Regression coverage:

- Add tag still works;
- hidden Outline/Properties remain hidden;
- Graph remains accessible;
- theme presets still apply;
- Canvas 8A-8D E2E still passes;
- renderer boundary tests include new Live Preview files;
- no `fs`, `path`, Electron, or raw `ipcRenderer` in new renderer files;
- no `dangerouslySetInnerHTML` outside the existing sanitized Markdown
  rendering path.

## Documentation

After implementation, create:

- `MILESTONE-9.1.md`

Update:

- `README.md`;
- `ROADMAP.md`;
- `ARCHITECTURE.md` if the Live Preview block model or note-mode architecture
  is significant.

Docs should mention:

- Live Preview is the default Markdown experience;
- Source Mode remains available;
- Reading mode is read-only;
- block-focused editing is intentionally incremental;
- exact Obsidian parity and compatibility are not claimed;
- renderer remains filesystem-free;
- no raw IPC, plugins, marketplace, arbitrary CSS, or scripting is added;
- Canvas 8A-8D remains supported.

## Recommended Implementation Order

### Step 1 - Baseline And Tests

- Run `npm run check`, `npm run build`, `npm run test:e2e`, and
  `npm run dev`.
- Add pure parser/patch tests for Markdown blocks.
- Add note-mode normalization tests for `livePreview`, `source`, and
  `reading`.

### Step 2 - Shared Mode Settings

- Extend `MarkdownViewMode` to include `livePreview`, `source`, and `reading`.
- Migrate old `edit` / `preview` values safely.
- Keep `showPreview` compatibility as a deprecated read-side field.
- Update settings validation.

### Step 3 - Block Parser And Patch Helpers

- Implement Markdown block parsing with conservative block ranges.
- Implement block replacement helpers.
- Preserve frontmatter and unrelated text.
- Keep helpers pure and well tested.

### Step 4 - Live Preview Renderer

- Add `LivePreviewPane`.
- Render blocks using the existing sanitized Markdown rendering path where
  practical.
- Swap focused block into an editable textarea or mini editor.
- Commit/cancel block edits.
- Wire Ctrl/Cmd+S through the existing save path.

### Step 5 - MarkdownNotePane Integration

- Make Live Preview the default surface.
- Keep Source Mode using `EditorPane`.
- Keep Reading mode using `PreviewPane`.
- Keep Add tag controls and save flushing behavior.
- Remove user-facing Edit / Preview wording from the main workflow.

### Step 6 - Layout Polish

- Add or refine left ribbon/action bar if small and clean.
- Improve file explorer/sidebar active states.
- Add breadcrumb treatment above note content.
- Improve right sidebar and status bar styling with existing variables.
- Keep workspace split panes and Canvas routing intact.

### Step 7 - Regression Tests And E2E

- Add renderer/component tests where practical.
- Extend E2E only if stable and not timing-heavy.
- Confirm Canvas E2E remains green.

### Step 8 - Documentation And Gates

- Create `MILESTONE-9.1.md`.
- Update README, ROADMAP, and ARCHITECTURE as needed.
- Run final gates.

## Risks And Mitigations

### Risk: Block Editing Rewrites Too Much Markdown

Mitigation:

- replace only known block ranges;
- preserve frontmatter and unrelated text exactly;
- test offsets and patching heavily;
- send complex edits to Source Mode when needed.

### Risk: Live Preview Feels Less Seamless Than CodeMirror Native Live Preview

Mitigation:

- set honest scope for 9.1;
- make block hover/focus states polished;
- keep Source Mode one click away;
- defer editor-native decorations to a later milestone.

### Risk: Autosave And Block Commits Race

Mitigation:

- reuse the Milestone 9 save sequencing pattern;
- commit active block before save;
- keep a single current document string in the Live Preview component;
- test commit/save order.

### Risk: Unsafe Rendering

Mitigation:

- reuse sanitized Markdown rendering;
- do not add arbitrary HTML injection;
- include renderer boundary tests.

### Risk: Layout Polish Becomes A Rewrite

Mitigation:

- keep component changes narrow;
- prefer CSS and existing layout hooks;
- do not replace workspace pane architecture.

### Risk: Canvas Regression

Mitigation:

- keep document-kind routing untouched;
- avoid Canvas schema/IPC changes;
- run Canvas E2E.

## Explicit Deferrals

- Perfect Obsidian Live Preview parity.
- Exact Obsidian layout, assets, icons, CSS, branding, or private behavior.
- CodeMirror-native full Live Preview decorations for every Markdown construct.
- Community plugins.
- Theme marketplace.
- Arbitrary CSS snippets.
- Downloaded themes.
- Sync, publish, mobile, or URI/deep-link features.
- Advanced cursor-preserving Markdown transforms.
- Complex multi-block editing if too risky.
- Full WYSIWYG tables.
- Embeds and media cards.
- Obsidian import/export compatibility.
- Scripting, macros, or arbitrary code execution.
- Database or spreadsheet behavior.

## Acceptance Criteria

Milestone 9.1 is complete when:

- Markdown notes open in Live Preview by default.
- The user does not need to toggle the whole note into Source Mode for normal
  editing.
- Clicking a heading, paragraph, list, blockquote, or code block makes that
  block editable.
- Leaving or committing the block renders it again.
- Escape cancels the active block edit.
- Ctrl/Cmd+S saves the current Live Preview document.
- Source Mode remains available as a fallback.
- Reading mode remains read-only if retained.
- The layout is closer to the desired Obsidian-inspired structure while staying
  original.
- No forced editor/preview split returns.
- Themes remain selectable and readable.
- Graph remains visible.
- Outline and Properties remain hidden.
- Add tag still works.
- Canvas 8A-8D behavior is not regressed.
- Renderer remains filesystem-free.
- No raw IPC is exposed.
- `npm run check`, `npm run build`, `npm run test:e2e`, and `npm run dev`
  pass.

## Milestone links

- Previous: [[MILESTONE-9]]
- Next: [[MILESTONE-9.1]]
- Implementation: [[MILESTONE-9.1]]
