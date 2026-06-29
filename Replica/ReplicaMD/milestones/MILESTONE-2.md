# Milestone 2 - Editor And Indexing Foundation

Milestone 2 is implemented and verified locally.

## Verified Status

- `npm run check` passed locally.
- `npm run build` passed locally.
- `npm run test:e2e` passed locally.
- `npm run dev` rendered the welcome/vault chooser UI.
- The preload bridge was present as `window.replica`.
- The app renderer had no red runtime errors.

The observed `Autofill.enable` / `Autofill.setAddresses` messages are emitted by
the docked DevTools window and are not Replica renderer runtime errors.

## Delivered Scope

### Incremental Indexing

- `VaultWatcher` watches the open vault for external changes.
- Markdown edits re-index only the changed file.
- Deleted Markdown files are removed from the index.
- Rename/move operations rebuild the index to stay correct across folders.
- App-owned writes are suppressed so saves do not echo back as external changes.
- `.obsidian-replica/`, `.obsidian/`, `.git`, and hidden platform files are not
  indexed.

### Wikilink Autocomplete

- Typing `[[` offers note suggestions.
- Aliases and headings are included.
- The renderer calls the preload API instead of touching filesystem or index
  internals.

### Preview Improvements

- Tables, strikethrough, task lists, callouts, and footnotes render in preview.
- Preview output remains sanitized.
- Embeds remain labelled placeholders; full transclusion is deferred.

### Tags

- Inline tags and frontmatter tags are indexed.
- Tags pane lists tags with counts.
- Clicking a tag filters search.
- `tag:` and `#tag` search operators are supported.

### File Explorer

- Folder expansion state persists through settings.
- Reveal current file expands ancestor folders.
- Name sorting remains the shipped behavior.

## Final Verification Fixes

- Lint/format now ignore the checked-in reference vault folder
  `markdown-files-of-what-we-are-building-ALWAYS-READ-ME/`.
- `Indexer` now exposes `localGraph()` and `listNotes()` to satisfy the shared
  API contract used by `VaultService`.
- IPC registration now handles `graph:local` and `index:listNotes` with payload
  validation and the existing sender checks.
- Preload now exposes `getLocalGraph()` and `listNotes()` through the audited
  `window.replica` bridge.
- The Playwright smoke test clears `ELECTRON_RUN_AS_NODE` before launching
  Electron, avoiding inherited terminal state that makes Electron reject
  Chromium flags.
- The blank-renderer investigation found no remaining app renderer crash. The
  real app window renders the welcome UI; earlier red console messages were from
  DevTools.

## Changed Files In The Final Pass

- `.prettierignore`
- `eslint.config.js`
- `src/main/indexer/indexer.ts`
- `src/main/ipc/register-ipc.ts`
- `src/preload/preload.ts`
- `tests/e2e/smoke.spec.ts`
- Formatting-only cleanup in `src/core/fuzzy/score.ts`,
  `src/core/search/search.ts`, `tests/search-query.test.ts`, and
  `tests/search.test.ts`

## Quality Gates

| Gate | Result |
| --- | --- |
| `npm run check` | Passed |
| `npm run build` | Passed |
| `npm run test:e2e` | Passed |
| `npm run dev` | Welcome UI rendered; preload bridge present; no red app renderer errors |

## Deferred Beyond Milestone 2

- Full embed transclusion.
- Command palette and quick switcher.
- Advanced search UI polish and saved searches.
- Outline pane from headings.
- Breadcrumbs.
- Local graph UI and graph filters.
- Explorer drag-and-drop.

Milestone 3 should start from [MILESTONE-3-PLAN.md](MILESTONE-3-PLAN.md) and
should not change the local-first architecture or widen renderer filesystem
access.

## Milestone links

- Previous: [[MILESTONE-1]]
- Next: [[MILESTONE-3-PLAN]]
