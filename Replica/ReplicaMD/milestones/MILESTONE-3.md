# Milestone 3 - Navigation And Knowledge Tools

Milestone 3 adds keyboard-first navigation and richer knowledge inspection while
keeping the existing architecture intact: shared contracts, pure core logic,
Electron main process, preload bridge, and renderer UI. The renderer still has no
raw filesystem access.

## Delivered Scope

- Command palette opened with `Ctrl/Cmd-Shift-P`.
- Quick switcher opened with `Ctrl/Cmd-O`, using the existing
  `window.replica.listNotes()` preload API.
- Advanced search operators: `path:`, `title:`, `tag:`, quoted phrases,
  negation with `-term`, and top-level `OR`.
- Tags pane text filtering plus count/name sorting.
- Outline pane for active-note headings, backed by existing `NoteIndex`
  `headingNodes`.
- Breadcrumbs for the active note path, with folder reveal in the explorer.
- Local graph UI for the active note through `window.replica.getLocalGraph()`.
- Graph tag filter and unresolved-node toggle for global and local graph modes.

## Changed Files

Core and shared:

- `src/shared/domain.ts`
- `src/core/navigation/command-ranking.ts`
- `src/core/navigation/quick-switcher.ts`
- `src/core/navigation/tags.ts`
- `src/core/search/query.ts`
- `src/core/search/search.ts`
- `src/core/graph/graph.ts`
- `src/core/graph/local-graph.ts`
- `src/core/graph/filters.ts`

Renderer:

- `src/renderer/App.tsx`
- `src/renderer/app/store.ts`
- `src/renderer/components/Breadcrumbs.tsx`
- `src/renderer/components/CommandPalette.tsx`
- `src/renderer/components/QuickSwitcher.tsx`
- `src/renderer/components/OutlinePane.tsx`
- `src/renderer/components/EditorPane.tsx`
- `src/renderer/components/FileExplorer.tsx`
- `src/renderer/components/GraphView.tsx`
- `src/renderer/components/RightPane.tsx`
- `src/renderer/components/SearchPane.tsx`
- `src/renderer/components/TagsPane.tsx`
- `src/renderer/editor/createEditor.ts`
- `src/renderer/styles/app.css`

Tests and docs:

- `tests/navigation.test.ts`
- `tests/graph-filters.test.ts`
- `tests/search-query.test.ts`
- `tests/search.test.ts`
- `tests/e2e/smoke.spec.ts`
- `README.md`
- `ROADMAP.md`
- `MILESTONE-3.md`

## Quality Gates

- `npm run check` passed.
- `npm run build` passed.
- `npm run test:e2e` passed.
- `npm run dev` rendered the app, opened the command palette, exposed
  `window.replica`, and showed no red app renderer runtime errors.

## Tests Added Or Updated

- Command palette ranking tests.
- Quick switcher ranking tests.
- Tag filtering and sorting helper tests.
- Breadcrumb path segment tests.
- Graph filter tests.
- Search parser tests for `title:`.
- Search behavior tests for `title:`.
- E2E smoke coverage for opening the command palette.

## Deferred Items

- Saved searches: deferred to keep Milestone 3 focused and avoid expanding the
  settings schema before the core navigation tools are settled.
- Live in-editor Markdown decorations.
- Full embed transclusion.
- Math and Mermaid rendering.
- Real YAML frontmatter engine.
- Search-and-replace.
- Continuous graph simulation, pinning, folder/depth filters.

## Manual Checks

- Open the command palette with `Ctrl/Cmd-Shift-P`; run pane-switch and preview
  toggle commands.
- Open a vault and use `Ctrl/Cmd-O` to jump to a note by title, path, and alias.
- Try search queries using `path:`, `title:`, `tag:`, phrases, negation, and
  `OR`.
- Filter/sort tags and click a tag to seed Search.
- Open a note with headings and verify the Outline pane lists them and jumps in
  the editor.
- Confirm breadcrumbs show nested paths and reveal clicked folders.
- Switch Graph between Global and Local; apply a tag filter and toggle
  unresolved nodes.
- Confirm the renderer console has no red app runtime errors and
  `typeof window.replica === "object"`.

## Milestone links

- Previous: [[MILESTONE-3-PLAN]]
- Next: [[MILESTONE-4-PLAN]]
- Plan: [[MILESTONE-3-PLAN]]
