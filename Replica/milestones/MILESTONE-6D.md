# Milestone 6D - Bases Hardening For Larger Vaults

Milestone 6D hardens Bases for larger vaults and heavier saved table views
without adding database or spreadsheet features. It keeps the 6B-6C
architecture intact: Bases still evaluate in main/core against the in-memory
index, saved Bases still persist only in `.obsidian-replica/bases.json`, view
management still writes through `replaceBases`, and property edits still write
only through `updateNoteProperties`.

## Delivered Scope

### Large Synthetic Query Coverage

- Added generated large-vault tests without adding fixture files.
- Covered broad all-notes Bases over thousands of notes.
- Covered title, path, tag, property equality, property contains, and combined
  filters.
- Covered numeric sorting across large result sets.
- Covered stable path tie-break behavior for equal sort values.
- Covered missing property handling at scale.
- Confirmed list and unknown property values remain safe and read-only metadata
  is preserved.
- Avoided hard timing thresholds so CI does not become flaky.

### Result Metadata And Row Limit

- Added runtime metadata to `BaseResult`:
  - `totalRows`;
  - `returnedRows`;
  - `limit`;
  - `limited`.
- Added a conservative default returned-row limit for Base runs.
- The limit is applied after filtering and sorting, before row construction.
- The full matching row count is still reported through `totalRows`.
- Small result sets and zero-result Bases remain effectively unchanged.
- Runtime result metadata is not persisted to `bases.json`.
- No pagination was added.

### Limited-result UI

- Bases tables now show an explicit notice when a result is capped.
- The notice reports how many matching notes are shown out of the full match
  count.
- Zero-result state remains distinct from limited-result state.

### Stale-response Protection And Loading States

- `BasesPane` now sequences active Base runs with a monotonic request id.
- Older successful responses are ignored after a newer run starts.
- Older errors are ignored after a newer run starts.
- Initial loading is distinguished from background refreshing.
- Background refreshes preserve the previous result when safe.
- Refresh failures during a background refresh keep the previous table visible
  and show an error near the table.
- Explicit Refresh remains immediate.
- Successful property-edit reruns remain immediate and continue to reflect
  filters and sort after the save.

### Passive Refresh Debounce

- Vault-refresh-triggered Base reruns are debounced briefly to avoid duplicate
  work during bursts of filesystem/index notifications.
- Explicit Refresh is not debounced.
- Successful property-edit reruns are not debounced.
- Active Base definition changes still rerun promptly.
- Inactive Base rename, duplicate, and reorder operations no longer churn the
  active result unnecessarily.

### Dev-only Timing Logs

- Added development-only aggregate timing logs around Base evaluation.
- Logged values are counts, durations, Base id, returned row count, and limited
  flag only.
- Logs include:
  - note count;
  - filter count;
  - matched count;
  - column count;
  - filter duration;
  - sort duration;
  - row-build duration;
  - total duration;
  - returned row count;
  - limited flag.
- Logs do not include note contents, note titles, full paths, or property
  values.
- Production and test modes remain silent.

## No New Write Path

6D keeps the write boundaries unchanged:

```text
Base view management
  -> replaceBases({ schemaVersion, bases })
  -> .obsidian-replica/bases.json

Base table property edits
  -> updateNoteProperties(path, update)
  -> note frontmatter
```

There is no new main write API, no Bases-specific property write path, no new
Bases persistence file, and no renderer filesystem access.

## Changed Files

```text
src/shared/bases.ts
  - BaseResult metadata
  - default Bases row limit constant

src/core/bases/base-query.ts
  - post-sort row limiting
  - aggregate dev-only timing logs

src/renderer/components/bases/BasesPane.tsx
  - request sequencing
  - initial/loading/refreshing state split
  - stale response protection
  - passive refresh debounce
  - limited-result notice

tests/bases-large.test.ts
  - generated large-vault tests
  - result metadata and limit coverage
  - dev timing log coverage
```

## Tests Added

- Broad all-notes Base over 2,500 generated notes.
- Title, path, tag, property equality, and property contains filters over large
  generated sets.
- Multiple filters over a large generated set.
- Numeric sort across many rows, with result cap applied after sort.
- Stable path tie-break ordering for equal sort values.
- Missing property handling at scale.
- List and unknown values remain safe and marked unsupported.
- Result metadata reports total, returned, limit, and limited state.
- Zero and small result sets are not marked limited.
- Timing logs are silent outside development mode.
- Development timing logs contain only aggregate data.

## Deferred Items

- Full pagination.
- Row virtualization.
- Column virtualization.
- Cross-run result caching.
- Index-revision caching dedicated to Bases.
- Renderer-side query evaluation.
- New Bases persistence files.
- New property write APIs.
- Formulas, relations, rollups, grouping, and bulk editing.
- Schema manager.
- Board, calendar, gallery, Canvas, plugins, sync, publish, URI scheme, and
  marketplace.

## Manual Checks

1. Open a vault with enough notes to exceed the Base row limit and confirm the
   limited-result notice appears.
2. Confirm a smaller Base shows no limited-result notice.
3. Edit a property cell so the row remains visible and confirm the table
   refreshes.
4. Edit a property cell so the row no longer matches and confirm the
   row-disappeared notice appears.
5. Rename or reorder an inactive Base and confirm the active table does not
   visibly churn.
6. Trigger Refresh manually and confirm it runs immediately.
7. In development mode, run a Base and confirm timing logs are aggregate-only.
8. Confirm list cells and reserved fields remain read-only in Bases.

## Acceptance

- Bases still evaluate in main/core against the in-memory index.
- Renderer filesystem access is unchanged.
- Property edits still use only `updateNoteProperties`.
- View-management edits still use only `replaceBases`.
- Saved Bases still persist only in `.obsidian-replica/bases.json`.
- Large synthetic tests cover filters, sorting, missing properties, safe
  unsupported values, and limits.
- Loading and stale-response behavior is safer under frequent reruns.
- The result limit is explicit and applied after sort.
- Timing logs are development-only and do not leak note contents.
- Lists and reserved fields remain read-only in Bases.
- The app remains shippable and all quality gates pass.

## Milestone links

- Previous: [[MILESTONE-6D-PLAN]]
- Next: [[MILESTONE-7-PLAN]]
- Plan: [[MILESTONE-6D-PLAN]]
