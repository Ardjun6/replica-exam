# Milestone 9.1 - Live Preview Markdown Editing And Layout Polish

Milestone 9.1 replaces the mode-first Markdown workflow with a safe
block-focused Live Preview experience. Markdown notes now open in Live Preview
by default: rendered Markdown is visible most of the time, and focusing a block
turns that block into editable Markdown.

This is an original Replica implementation inspired by common Markdown editor
patterns. It does not copy Obsidian private code, assets, exact UI, icons, CSS,
branding, protocols, or proprietary behavior, and it does not claim Obsidian
compatibility.

## What Shipped

- Live Preview is the default Markdown view mode.
- Source Mode remains available as the full raw Markdown fallback.
- Reading mode remains available as a read-only rendered view.
- Headings, paragraphs, list runs, blockquotes, and fenced code blocks render
  when unfocused and become editable Markdown when focused.
- Blur and `Ctrl/Cmd+Enter` commit the active block.
- `Escape` cancels the active block edit.
- `Ctrl/Cmd+S` commits the active block and saves the note.
- Empty notes show a starter Live Preview block.
- Frontmatter is preserved and is not exposed as a normal Live Preview block.
- Add tag, Graph access, theme presets, hidden Outline/Properties tabs, and
  Canvas 8A-8D behavior remain supported.

## Architecture

The implementation keeps the existing process boundary intact.

- `src/core/markdown/live-preview.ts` adds a pure Markdown block parser and
  range patch helper.
- `src/renderer/components/LivePreviewPane.tsx` owns the renderer Live Preview
  surface and uses existing typed note APIs.
- `src/renderer/components/MarkdownNotePane.tsx` composes Live Preview, Source,
  and Reading modes.
- `src/shared/settings.ts` migrates note mode settings to schema v5:
  `livePreview`, `source`, and `reading`.
- `src/main/ipc/validate.ts` validates only those mode values.

No new IPC channel, preload method, filesystem access, or property write path
was added.

## Block Model

Live Preview parses Markdown into conservative block ranges:

- frontmatter;
- heading;
- paragraph;
- list;
- fenced code;
- blockquote;
- blank;
- other.

Only normal content blocks are edited through Live Preview. The patch helper
replaces the focused block range and leaves unrelated content byte-for-byte
unchanged where practical. Complex Markdown remains safely editable through
Source Mode.

## Layout Polish

Milestone 9.1 also adds small original layout polish:

- a left vertical ribbon with Search, Graph, Tags, and Settings affordances;
- clearer Live Preview note header and centered readable prose;
- theme-variable styling for Live Preview blocks and source textareas;
- continued hidden Outline and Properties right-sidebar tabs;
- visible Graph access.

## Safety Boundaries

- Renderer remains filesystem-free.
- No raw IPC is exposed.
- Note writes still go through existing typed preload APIs.
- Add tag still uses `updateNoteProperties`.
- Canvas files still use the existing Canvas API and renderer.
- No plugins, marketplace, scripting, macros, sync, publish, URI/deep-link
  support, arbitrary CSS snippets, downloaded themes, media/embed system, or
  database/spreadsheet feature was added.

## Tests

Added and updated coverage for:

- default Markdown mode migration to Live Preview;
- legacy `edit`/`preview`/`showPreview` migration;
- parser coverage for headings, paragraphs, lists, code fences, blockquotes,
  blank blocks, and frontmatter;
- block replacement preserving unrelated content;
- frontmatter remaining non-editable through Live Preview;
- IPC settings validation for `livePreview`, `source`, and `reading`;
- renderer boundary checks for the new Live Preview component.

## Deferred

- Perfect Obsidian Live Preview parity.
- CodeMirror-native Live Preview decorations for every Markdown construct.
- Advanced cursor-preserving Markdown transforms.
- Complex multi-block editing.
- WYSIWYG tables.
- Exact Obsidian layout, icons, assets, CSS, or compatibility behavior.
- Community plugins, marketplace, arbitrary CSS snippets, scripting, sync,
  publish, URI/deep-link support, media/embed systems, and downloaded themes.

## Verification

Final local verification:

- `npm run check` passed.
- `npm run build` passed.
- `npm run test:e2e` passed.
- `npm run dev` launched successfully; the process was stopped after startup
  verification.

## Milestone links

- Previous: [[MILESTONE-9.1-PLAN]]
- Next: [[MILESTONE-10]]
- Plan: [[MILESTONE-9.1-PLAN]]
