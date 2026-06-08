# Milestone 3 Plan - Navigation And Knowledge Tools

Milestone 3 should make Replica faster to navigate and better at showing
knowledge structure. The slice is intentionally practical: build a few focused
tools on top of the existing index, search, graph, store, IPC contract, preload
bridge, and renderer shell.

## Constraints

- Do not rewrite the architecture.
- Do not widen renderer filesystem access.
- Keep filesystem and index access behind the existing preload bridge.
- Keep IPC typed in `src/shared/ipc-contract.ts` and validated in
  `src/main/ipc/validate.ts` / `register-ipc.ts`.
- Keep pure ranking, parsing, search, graph, and outline logic testable outside
  Electron.
- Prefer small UI components and existing store/actions patterns over new global
  frameworks.

## Recommended Implementation Order

1. Command palette foundation
2. Quick switcher
3. Advanced search operators, with tag pane refinements immediately after
4. Outline pane
5. Breadcrumbs
6. Local graph UI
7. Graph filters
8. Optional saved searches

Tag pane refinements are listed with their own acceptance criteria below, but
they should land near the search work because both depend on tag/query behavior.

## 1. Command Palette Foundation

Purpose:

Provide a keyboard-first launcher for common app actions and create a reusable
modal command surface for later navigation commands.

Files likely affected:

- `src/renderer/App.tsx`
- `src/renderer/app/store.ts`
- `src/renderer/app/actions.ts`
- `src/renderer/components/CommandPalette.tsx` (new)
- `src/renderer/components/*.tsx` where existing actions are exposed
- `src/renderer/styles/app.css`
- `tests/*` for pure command filtering/ranking if extracted

Acceptance criteria:

- `Ctrl/Cmd-Shift-P` opens and closes the palette.
- Escape closes the palette.
- Arrow keys move selection; Enter runs the selected command.
- Initial commands include open vault, create vault, toggle preview, reveal
  current file, focus search, and switch right-pane tabs.
- Commands reuse existing actions and do not introduce renderer filesystem
  access.

Tests needed:

- Pure tests for command filtering/ranking if the command matcher is extracted.
- E2E smoke extension that opens the palette and verifies at least one command
  row appears.
- Existing `npm run check` remains green.

Risks:

- Keyboard shortcuts may conflict with editor shortcuts.
- Modal focus handling can trap focus incorrectly.
- Commands that require an open vault need disabled or hidden states.

## 2. Quick Switcher

Purpose:

Let users jump to notes quickly by title, path, or alias.

Files likely affected:

- `src/renderer/components/QuickSwitcher.tsx` (new)
- `src/renderer/App.tsx`
- `src/renderer/app/actions.ts`
- `src/renderer/app/api.ts`
- `src/renderer/styles/app.css`
- `src/core/fuzzy/score.ts` or a small new pure matcher module
- `tests/fuzzy.test.ts` or a new quick-switcher ranking test
- Existing `src/shared/ipc-contract.ts`, `src/main/ipc/register-ipc.ts`, and
  `src/preload/preload.ts` should already support `listNotes()`

Acceptance criteria:

- `Ctrl/Cmd-O` opens and closes the switcher.
- Results show title and path, and aliases participate in matching.
- Selecting a result opens that note and closes the switcher.
- Empty query shows useful default ordering.
- Renderer calls `window.replica.listNotes()` and never reads disk directly.

Tests needed:

- Pure ranking tests for title/path/alias matching.
- E2E coverage that opens the switcher after a test vault exists, or a narrower
  renderer-level check if e2e vault setup is too large for this milestone.
- Existing indexer/listing tests remain green.

Risks:

- Large vaults can make every-keystroke ranking expensive.
- Empty vault and no-vault states need polished handling.
- Shortcut conflicts with native menu accelerators or editor commands.

## 3. Advanced Search Operators

Purpose:

Make search expressive enough for real vault triage while keeping it predictable
and pure.

Files likely affected:

- `src/core/search/query.ts`
- `src/core/search/search.ts`
- `src/renderer/components/SearchPane.tsx`
- `src/renderer/app/store.ts` if query state needs small additions
- `tests/search-query.test.ts`
- `tests/search.test.ts`

Acceptance criteria:

- Supported operators include `path:`, `title:`, `tag:`, quoted phrases,
  negation with `-term`, and `OR`.
- Existing `tag:` / `#tag` behavior remains compatible.
- Invalid or partial queries fail gracefully and never crash the renderer.
- Search results remain deterministic.
- UI keeps the search box focused and usable without adding a bulky help panel.

Tests needed:

- Parser tests for every operator and combinations.
- Search behavior tests for phrase, negation, `OR`, `path:`, `title:`, and
  `tag:`.
- Regression tests for existing search behavior.

Risks:

- Query parsing can become too clever and hard to explain.
- Operator precedence around `OR` and negation can surprise users.
- Search ranking may need adjustment after filters narrow the candidate set.

## 4. Tag Pane Refinements

Purpose:

Make the existing tag pane useful in medium-sized vaults and connect it cleanly
to search and graph filters.

Files likely affected:

- `src/renderer/components/TagsPane.tsx`
- `src/renderer/components/SearchPane.tsx`
- `src/renderer/app/store.ts`
- `src/renderer/styles/app.css`
- `src/core/search/search.ts` if tag query behavior changes
- `tests/tags.test.ts`

Acceptance criteria:

- Tags can be filtered by text.
- Counts remain visible.
- Sort by count/name is available if it stays small.
- Clicking a tag still seeds Search with `tag:<name>`.
- Tag interactions can also feed graph filters once graph filters land.

Tests needed:

- Existing tag extraction/count tests stay green.
- Pure sort/filter helper tests if that logic is extracted.
- Manual or e2e check that clicking a tag updates Search.

Risks:

- Tag names with punctuation or slashes must round-trip into search queries.
- Pane state can drift from Search state if both own separate tag filters.
- UI can get crowded in the right rail.

## 5. Outline Pane

Purpose:

Show the structure of the active note from indexed headings and make long notes
easier to navigate.

Files likely affected:

- `src/renderer/components/OutlinePane.tsx` (new or replace a placeholder)
- `src/renderer/components/RightPane.tsx`
- `src/renderer/components/EditorPane.tsx`
- `src/renderer/components/PreviewPane.tsx`
- `src/renderer/app/store.ts`
- `src/shared/ipc-contract.ts`, `src/main/ipc/register-ipc.ts`,
  `src/preload/preload.ts` only if a narrow active-note index call is needed
- `tests/outline.test.ts`

Acceptance criteria:

- Outline lists active-note headings in document order.
- Heading depth is visually represented.
- Empty notes show a quiet empty state.
- Clicking a heading jumps or scrolls to that heading where practical.
- Data comes from existing `NoteIndex` data or a narrow typed IPC call.

Tests needed:

- Pure heading extraction/order tests if any new helper is added.
- Renderer/component behavior around empty and populated outlines where
  practical.
- Manual check for editor/preview jump behavior.

Risks:

- Editor and preview scrolling targets may diverge.
- Re-index timing after edits can make outline updates feel stale.
- Duplicate headings need stable jump targets.

## 6. Breadcrumbs

Purpose:

Make the active note's location visible and provide quick navigation/reveal
affordances for nested vaults.

Files likely affected:

- `src/renderer/components/Breadcrumbs.tsx` (new)
- `src/renderer/App.tsx`
- `src/renderer/components/FileExplorer.tsx`
- `src/renderer/components/path-helpers.ts`
- `src/renderer/styles/app.css`
- `tests/*` for path splitting helper if extracted

Acceptance criteria:

- Active note path appears as clickable path segments.
- Long paths truncate or wrap cleanly without overlapping controls.
- Clicking a folder segment expands/reveals that folder in the explorer.
- No-vault and no-active-note states stay clean.

Tests needed:

- Pure tests for path segment generation if extracted.
- Manual responsive check with deeply nested paths.
- Existing explorer persistence tests remain green.

Risks:

- Reveal behavior may require careful coordination with persisted expansion
  state.
- Breadcrumb UI can steal too much vertical space.
- Windows-style input paths must never leak into renderer filesystem access.

## 7. Local Graph UI

Purpose:

Expose the existing one-hop graph capability so users can focus on the active
note's immediate neighborhood.

Files likely affected:

- `src/renderer/components/GraphPane.tsx` or equivalent graph component
- `src/renderer/components/RightPane.tsx`
- `src/renderer/app/api.ts`
- `src/renderer/app/store.ts`
- `src/renderer/styles/app.css`
- Existing `src/shared/ipc-contract.ts`, `src/main/ipc/register-ipc.ts`, and
  `src/preload/preload.ts` should already support `getLocalGraph()`
- `tests/local-graph.test.ts`

Acceptance criteria:

- User can switch between global graph and local graph.
- Local graph is centered on the active note.
- Incoming and outgoing one-hop neighbors are shown.
- Missing/unresolved nodes remain visually distinct.
- Renderer calls `window.replica.getLocalGraph()` through preload.

Tests needed:

- Existing pure local graph tests stay green.
- E2E or manual check that local/global mode switches update the rendered graph.
- Contract/typecheck coverage for any new graph options.

Risks:

- No-active-note state needs clear behavior.
- Local graph and global graph may duplicate UI state.
- Graph layout can become unstable if nodes are recreated too often.

## 8. Graph Filters

Purpose:

Let users reduce graph noise without adding a heavy graph database or complex
query layer.

Files likely affected:

- `src/renderer/components/GraphPane.tsx`
- `src/renderer/components/TagsPane.tsx`
- `src/renderer/app/store.ts`
- `src/shared/ipc-contract.ts`
- `src/main/ipc/register-ipc.ts`
- `src/main/ipc/validate.ts`
- `src/preload/preload.ts`
- `src/core/graph/graph.ts`
- `src/core/graph/local-graph.ts`
- `tests/local-graph.test.ts` and new graph filter tests if needed

Acceptance criteria:

- User can filter graph nodes by tag.
- User can toggle unresolved nodes.
- Filters work consistently for local and global graph modes.
- Graph stays responsive on small and medium vaults.
- Any filter payload crossing IPC is typed and validated.

Tests needed:

- Pure graph filter tests.
- Validator tests for graph filter options if IPC expands.
- Manual graph rendering check for filtered, empty, and unresolved-heavy graphs.

Risks:

- Filtering can hide edges in confusing ways.
- Tag filter behavior must match Search/Tags pane expectations.
- Adding graph options to IPC can drift unless contract, preload, and service are
  updated together.

## 9. Optional Saved Searches

Purpose:

Persist a small set of useful searches if it can be done without bloating the
settings model or milestone scope.

Files likely affected:

- `src/shared/settings.ts`
- `src/main/ipc/validate.ts`
- `src/main/vault/config-store.ts`
- `src/renderer/components/SearchPane.tsx`
- `src/renderer/app/actions.ts`
- `src/renderer/app/store.ts`
- `tests/validate.test.ts`
- search/settings tests as needed

Acceptance criteria:

- Users can save, run, rename, and delete saved searches if implemented.
- Saved searches persist in `.obsidian-replica/settings.json`.
- Settings validation rejects malformed saved-search payloads.
- If the model feels too large, this feature is explicitly deferred instead of
  half-built.

Tests needed:

- Settings normalization/migration tests.
- IPC validation tests for saved-search payloads.
- Search pane behavior tests where practical.

Risks:

- Settings schema migration can become larger than the feature warrants.
- Saved searches may duplicate command palette/search history work.
- This is the first feature to cut if Milestone 3 needs to stay smaller.

## Final Verification

Milestone 3 is complete only when:

- `npm run check` passes.
- `npm run build` passes.
- `npm run test:e2e` passes.
- `npm run dev` renders the app with no red renderer runtime errors.
- E2E covers at least one navigation surface opening and confirms the preload
  bridge remains available.
- Documentation records implemented scope and deferred items.

## Milestone links

- Previous: [[MILESTONE-2]]
- Next: [[MILESTONE-3]]
- Implementation: [[MILESTONE-3]]
