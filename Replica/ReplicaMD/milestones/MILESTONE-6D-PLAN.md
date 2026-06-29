# Milestone 6D Plan - Bases Hardening For Larger Vaults

Milestone 6D hardens Bases for larger vaults and heavier saved table views
without expanding Bases into a database, spreadsheet, or broader application
platform.

It builds on:

- 6B saved Bases table views;
- 6B.1 safe inline property cell editing;
- 6B.2 editing polish and missing-cell type selection;
- 6C Bases view-management polish.

The goal is to make existing Bases behavior more predictable under load:
larger note indexes, more saved Bases, wider tables, repeated refreshes, and
edit-then-rerun workflows. This milestone should improve resilience,
observability, and user feedback while keeping the current architecture intact.

## Constraints

- Do not rewrite the architecture.
- Do not widen renderer filesystem access.
- Keep Base evaluation in main/core.
- Keep the renderer filesystem-free.
- Keep `.obsidian-replica/bases.json` as the only Bases persistence file.
- Reuse existing `replaceBases` for Bases view-management writes.
- Reuse existing `updateNoteProperties` for property edits.
- Do not add a new property write path.
- Do not add a new Bases persistence file.
- Do not implement formulas, relations, rollups, grouping, bulk editing, schema
  manager, Canvas, plugins, sync, publish, URI scheme, marketplace, or
  board/calendar/gallery views.
- Lists remain read-only in Bases.
- Reserved fields remain read-only in Bases.
- Prefer correctness over caching.
- Keep the app shippable after each step.

## Current Performance Model

### Data Sources

- Bases run against the existing in-memory note index.
- The in-memory index is the source of note metadata, tags, paths, titles,
  mtimes, and normalized property values.
- Saved Base definitions are read from `.obsidian-replica/bases.json`.
- Saved Base definitions are normalized defensively through shared Bases schema
  helpers.
- The renderer does not evaluate Bases and does not read note files directly.

### Run Flow

Current `runBase(baseId)` behavior is simple and synchronous from the query
engine's perspective:

- main process reads the saved Bases file through the Bases store;
- main process finds the selected Base by id;
- main process passes the selected Base and `allNotes()` from the indexer to
  `evaluateBase`;
- core evaluation filters notes, applies optional sort, and builds result rows;
- the resulting `BaseResult` crosses IPC to the renderer;
- the renderer renders the table and owns only UI state such as selected Base,
  loading state, edit state, and visible messages.

### Evaluation Cost

For a vault with `N` indexed notes, `F` filters, `C` columns, and `M` matching
rows:

- filtering is roughly `O(N * F)`;
- sorting is roughly `O(M log M)` when a valid sort is configured;
- sort value extraction depends on the sorted column and may read properties,
  title, path, tags, or mtime;
- row building is roughly `O(M * C)`;
- IPC payload size is roughly proportional to `M * C`;
- renderer table work is also roughly proportional to `M * C`.

The current model is intentionally easy to reason about. It avoids stale cache
state because each Base run reflects the current in-memory index at the time
the main process evaluates it.

### Edit Flow

Property cell edits use only `updateNoteProperties`.

After a successful edit:

- main process writes the note through the existing property update path;
- the note is reindexed;
- the active Base is re-run;
- the row may stay, move, or disappear depending on existing filters and sort.

View-management edits use only `replaceBases`.

After a saved Base definition changes:

- the Bases file is normalized and written;
- renderer state receives the saved list;
- the selected Base can be re-run from the normalized definition.

### Current Guardrails

- The shared Bases schema already bounds the number of Bases, columns, filters,
  id lengths, labels, property names, and column widths.
- Main IPC validation rejects malformed or oversized Bases replacement payloads.
- Inline editing remains restricted to simple safe property cells.
- Lists, reserved fields, unsupported values, title, path, tags, and mtime stay
  read-only in Bases.

## Performance Risks

### Large Vaults

Risks:

- every Base run currently scans the full in-memory note list;
- many filters multiply per-note work;
- text comparisons normalize strings repeatedly during each run;
- tag, path, title, and property filters may allocate transient strings;
- sorting a large match set can dominate runtime;
- running a broad "All notes" Base may build a very large result.

Mitigations to consider:

- add low-risk result limits before building unlimited rows;
- add dev-only timing logs around filter, sort, row build, and IPC-size-related
  boundaries;
- avoid repeated runs caused by rapid UI changes;
- keep expensive memoization narrow and invalidated by index changes.

### Many Saved Bases

Risks:

- `getBases` and `replaceBases` operate on the full Bases file;
- list rendering and selection logic may become noisy near the existing
  `BASES_MAX_BASES` bound;
- repeated view-management operations can trigger unnecessary active Base
  reruns;
- duplicate/rename/reorder operations rewrite the whole saved Bases payload.

Mitigations to consider:

- keep the current full-file persistence model;
- avoid extra persistence files or partial write APIs;
- rerun only the active Base when a change can affect its result;
- skip reruns for purely inactive Base metadata changes where safe;
- retain existing schema limits.

### Many Columns

Risks:

- row building multiplies matching rows by visible columns;
- property display conversion for wide tables can become expensive;
- IPC payloads grow quickly with `rows * columns`;
- renderer layout can become sluggish with wide tables;
- inline editing controls may be harder to keep stable in dense tables.

Mitigations to consider:

- show explicit guardrails for very wide result sets;
- consider row limits before column virtualization;
- consider row virtualization only after measuring actual renderer cost;
- keep column limits enforced by schema normalization;
- avoid adding spreadsheet-like behaviors that increase per-cell state.

### Frequent Edits And Refreshes

Risks:

- each property edit reindexes and reruns the active Base;
- quick successive edits can produce overlapping run requests;
- stale earlier responses can arrive after newer runs;
- refreshes from vault changes can collide with edit-triggered reruns;
- loading states may flicker or hide which result is current.

Mitigations to consider:

- debounce refresh-triggered reruns;
- sequence active run requests in the renderer and ignore stale responses;
- keep edit-triggered reruns correct and immediate enough to avoid stale
  edited rows;
- show a clear "refreshing" state without clearing useful previous results too
  aggressively;
- do not cache across property writes unless invalidation is exact.

## Possible Hardening Features

These are candidate implementation pieces for 6D. They should be added only
where they improve stability or measurable responsiveness without changing the
product scope.

### Result Limits Or Pagination

Recommended for 6D.

Add a conservative result limit to protect broad Bases from producing
unbounded row counts.

Possible shape:

- evaluate the full filter and sort result for correctness;
- return only the first `limit` rows after sort;
- include lightweight result metadata such as:
  - total matching row count;
  - returned row count;
  - limit applied flag.

Design notes:

- limit must be applied after filtering and sorting so the visible rows are the
  correct top rows for the Base definition;
- limits should be explicit in the UI so users know they are seeing a partial
  result;
- default limit should be high enough for normal vaults and low enough to
  protect renderer and IPC payloads;
- changing the limit should not require a new persistence file;
- if a persisted setting is needed later, it should live inside the existing
  Base definition or existing settings system, not a new Bases file.

Pagination is possible but should be approached carefully.

- Simple "show first N" is safer than full pagination.
- Full pagination requires page input to `runBase` or a related read API.
- Full pagination adds state that can become stale after edits.
- Defer full pagination unless result limits alone are not enough.

### Row Virtualization If Needed

Optional for 6D.

Use row virtualization only if measurement shows renderer DOM rendering is a
real bottleneck after result limits are in place.

Design notes:

- keep Base evaluation and filesystem access unchanged;
- virtualize only renderer table rows;
- preserve keyboard navigation, focus return after edits, and screen-reader
  status messages;
- avoid virtualizing columns in this milestone unless wide tables prove
  unusable;
- verify that edited rows moving or disappearing still produce sane focus and
  status behavior.

Defer row virtualization if result limits, loading states, and debounce are
enough.

### Memoized Evaluation Where Safe

Optional and conservative.

Memoization can help only if it does not create stale results or obscure the
simple correctness model.

Safe candidates:

- memoize repeated normalized filter text within a single evaluation run;
- precompute per-run display strings for the sorted property column;
- precompute per-run lowercased title/path values when filters need them;
- cache pure helper results scoped to one `evaluateBase` call.

Risky candidates:

- cross-run result caching;
- caching Base results across note edits;
- caching by Base id without an index revision;
- renderer-side caching of query results;
- cache invalidation that depends on inferred property write behavior.

Default stance:

- prefer per-run memoization first;
- avoid cross-run caching unless an explicit index revision or equivalent
  invalidation signal already exists;
- never let caching skip a rerun after `updateNoteProperties`.

### Debounce Refresh Or Re-run

Recommended for 6D.

Debounce reruns caused by non-edit refresh triggers and rapid view-management
UI changes.

Rules:

- property edit success should still re-run the active Base promptly;
- explicit user Refresh should run promptly;
- vault refresh events may be debounced briefly;
- Base definition edits should rerun only when the active Base definition
  changes;
- inactive Base rename/duplicate/reorder should not cause unnecessary active
  result churn.

Renderer request sequencing should guard against stale responses:

- assign a monotonic request id for active Base runs;
- update result state only when the response belongs to the latest request;
- leave older successful responses ignored rather than shown after a newer
  result has started;
- show errors only for the current request.

### Better Loading States

Recommended for 6D.

Improve states around heavy runs without changing data semantics.

States to distinguish:

- loading Bases list;
- running selected Base for the first time;
- refreshing an already visible result;
- saving a property edit;
- re-running after an edit;
- result limited or guarded;
- run failed;
- selected Base missing after a save or reload.

Design notes:

- keep previous rows visible during background refresh when safe;
- show a lightweight refreshing state near the table toolbar;
- avoid blanking a large table unless the selected Base changed or the result
  is invalid;
- keep edit-save state local to the edited cell and summary status near the
  table;
- avoid exposing absolute filesystem paths in errors.

### Dev-only Performance Timing Logs

Recommended for 6D.

Add timing logs that are available in development only and silent in production
builds.

Candidate measurements:

- note count before filtering;
- filter count;
- matched row count;
- column count;
- filter duration;
- sort duration;
- row-build duration;
- total evaluation duration;
- returned row count;
- whether a result limit was applied.

Design notes:

- keep logs in main/core where evaluation happens;
- avoid logging note contents or property values;
- make logs easy to remove or disable;
- do not route timing logs through renderer filesystem access;
- tests should not depend on exact timings.

### Guardrails For Huge Tables

Recommended for 6D.

Guardrails should protect the app without blocking ordinary Bases use.

Possible guardrails:

- default maximum returned rows;
- warning when total matches exceed returned rows;
- warning when `matchingRows * columns` crosses a table-cell threshold;
- warning when a Base has near-maximum columns and broad filters;
- clear retry or edit actions after a guarded result.

Design notes:

- guardrails should be informative, not alarming;
- do not delete, rewrite, or mutate Base definitions automatically;
- do not add new schema-management UI;
- do not infer or create properties;
- keep rows correct for the subset displayed.

## Technical Design

### Keep Evaluation In Main/Core

- Continue using shared plain data types for Base definitions and results.
- Keep filter, sort, and row-building logic under `src/core/bases`.
- Keep `VaultService.runBase` as the main-process entry point.
- Do not move filtering, sorting, or result limiting to the renderer.
- Do not give the renderer direct access to note files or vault paths beyond
  existing typed IPC data.

### Extend Result Metadata Carefully

If result limits or guardrails are implemented, extend `BaseResult` with
metadata rather than adding a separate persistence concept.

Potential metadata:

- `totalRows`;
- `returnedRows`;
- `limit`;
- `limited`;
- optional timing data only when development logging needs structured output.

Rules:

- keep metadata read-only result data;
- do not persist runtime result metadata in `bases.json`;
- keep existing result rows and cell metadata compatible with inline editing;
- update tests that assert exact `BaseResult` shapes.

### Avoid Stale Results After Edits

Correctness after property edits is more important than avoiding work.

Implementation expectations:

- `updateNoteProperties` remains the only property write path;
- successful property edits re-run the active Base;
- the rerun uses the current in-memory index after reindexing;
- renderer request sequencing ignores older run responses;
- loading and status states make it clear when a rerun is in progress;
- stale rows are not kept as authoritative after an edit completes.

### Correctness Over Caching

Caching should be local and easy to invalidate.

Allowed first steps:

- per-evaluation normalized text helpers;
- per-evaluation derived sort values;
- per-evaluation display conversion reuse where it does not change output.

Avoid in 6D:

- persistent result caches;
- renderer-owned result caches;
- cache keys based only on Base id;
- cache reuse across property edits;
- cache reuse across vault refreshes without a known index revision.

### No New Write Paths

6D must not create new write APIs for the sake of performance.

- Property saves still call `updateNoteProperties`.
- Base definition changes still call `replaceBases`.
- Result limits, loading states, timing logs, and guardrails are read-path or UI
  hardening work.
- Any new runtime options should be read-only IPC parameters or in-memory UI
  state unless a later milestone explicitly decides otherwise.

### Renderer Filesystem Boundary

The renderer remains filesystem-free.

- No direct reads of `.obsidian-replica/bases.json`.
- No direct note reads for pagination, virtualization, or edit validation.
- No local file writes for timing logs.
- Renderer receives only typed IPC results and sends only validated IPC
  requests.

### Shippable After Each Step

Each implementation step should leave the app usable:

- tests pass for the touched layer;
- existing small-vault Bases behavior remains unchanged or intentionally
  improved;
- inline editing still works for supported property cells;
- lists and reserved fields remain read-only;
- saved Bases still load from the existing file;
- no partially introduced pagination or caching states are required to make the
  app function.

## Tests Needed

### Large Synthetic Note Set

Add test helpers for generating large note sets without large fixture files.

Coverage:

- thousands of notes with title, path, tags, mtime, and properties;
- a mix of present, missing, empty, list, unknown, text, number, and boolean
  property values;
- predictable ordering for stable assertions;
- broad and narrow filters.

Keep synthetic data generated in tests, not checked in as huge markdown files.

### Filter Performance Sanity

Add a bounded sanity test for broad filter evaluation.

Coverage:

- `titleContains`, `pathContains`, `tagIncludes`, `propertyExists`,
  `propertyEquals`, and `propertyContains`;
- multiple filters on a large generated set;
- no assertion on exact milliseconds unless the project already has stable
  perf-test infrastructure;
- assert output correctness and basic non-pathological behavior.

Suggested approach:

- use generated notes and normal unit tests for correctness;
- optionally log local timing in dev-only tests without failing on timing;
- avoid flaky hard performance thresholds in CI.

### Sort Stability With Many Rows

Coverage:

- stable ordering for equal sort values;
- path tie-break behavior remains deterministic;
- numeric sort remains numeric;
- boolean sort remains boolean;
- empty and missing values stay ordered consistently;
- result limits, if added, apply after sorting.

### Missing Property Handling

Coverage:

- missing property cells still render with `valueType: 'missing'`;
- missing properties do not match `propertyExists`;
- missing properties sort as empty;
- missing cells remain editable only through the existing safe inline edit
  descriptor rules;
- lists and reserved fields remain read-only.

### Edit Then Re-run Correctness

Coverage:

- editing a property through `updateNoteProperties` causes the active Base to
  rerun;
- row remains visible when it still matches filters;
- row disappears when it no longer matches filters;
- row moves when sort value changes;
- stale older run responses do not overwrite newer results;
- errors from older requests are ignored after a newer request starts.

This likely needs focused renderer/component tests or a small integration-style
test around the Bases pane API boundary.

### Result Limit And Guardrail Tests

If limits are implemented:

- returned rows are capped;
- total matching rows are reported;
- `limited` is true only when more rows exist;
- sorting happens before limiting;
- zero-result state is distinct from limited-result state;
- UI copy appears when a limit is applied.

### Loading State Tests

Coverage:

- initial run loading state;
- background refresh state with previous result preserved;
- edit-save state followed by rerun state;
- run error for the current request;
- stale response ignored when a newer request finishes first.

### Dev Timing Tests

Keep timing tests light.

- test that timing helpers do not log in production mode if a helper is
  extracted;
- test that timing metadata or logs omit note contents and property values;
- do not assert exact durations.

## Risks And Mitigations

### Risk: Limits Hide Expected Rows

Mitigation:

- make limited results explicit in the table state;
- include total matching count where feasible;
- apply limits after sort for correctness;
- provide a path to edit filters or refresh rather than silently truncating.

### Risk: Pagination Adds Stale State

Mitigation:

- prefer simple result limits for 6D;
- defer full pagination unless limits are insufficient;
- if pagination is added later, include page parameters in the read API and
  reset page state after edits or Base definition changes.

### Risk: Virtualization Breaks Editing Focus

Mitigation:

- defer virtualization until measurement justifies it;
- keep row identity keyed by note path;
- test focus return after save/cancel;
- test row disappearance and row movement after edits.

### Risk: Caching Shows Stale Results

Mitigation:

- keep caching scoped to a single evaluation run;
- do not cache across `updateNoteProperties`;
- do not cache by Base id alone;
- prefer rerunning and measuring before adding cache complexity.

### Risk: Dev Timing Logs Leak User Content

Mitigation:

- log only counts, durations, Base id, and guardrail flags;
- do not log note titles, paths, property names beyond existing safe aggregate
  counts, or property values;
- keep logs disabled in production.

### Risk: Guardrails Feel Like Feature Loss

Mitigation:

- phrase guardrails as table-size protection;
- keep visible data correct;
- show clear counts and next action;
- do not mutate saved Bases automatically.

### Risk: Extra Metadata Breaks Existing Tests

Mitigation:

- update result shape tests intentionally;
- keep rows and cells backward-compatible where possible;
- add metadata as optional during transition if useful;
- verify IPC validation and preload typings together.

### Risk: Debounce Delays Correct Edit Feedback

Mitigation:

- do not debounce successful edit-triggered reruns;
- debounce only passive refresh or rapid non-edit rerun triggers;
- keep explicit Refresh immediate;
- show clear "refreshing" status.

## Recommended Implementation Order

### Step 1 - Baseline Measurement And Synthetic Tests

- Add large synthetic note helpers in tests.
- Add correctness tests for large filter and sort cases.
- Add missing-property handling tests at larger scale.
- Record rough local timing observations without creating flaky CI thresholds.

Why first:

- establishes the pressure cases before changing behavior;
- protects existing correctness while later hardening is added;
- clarifies whether renderer, evaluation, sorting, or IPC payload size is the
  first bottleneck.

### Step 2 - Development Timing Logs

- Add dev-only timing around Base evaluation.
- Measure note count, filter count, matched count, column count, row count, and
  evaluation phases.
- Keep logs out of production.

Why second:

- gives visibility before introducing limits or memoization;
- keeps the change low risk and easy to remove or adjust.

### Step 3 - Request Sequencing And Loading States

- Add renderer-side run sequencing for active Base runs.
- Ignore stale success/error responses.
- Improve initial loading versus background refreshing states.
- Keep previous results visible during safe refreshes.

Why third:

- prevents stale UI problems regardless of later performance work;
- improves user trust during heavier runs and frequent edits.

### Step 4 - Debounce Passive Reruns

- Debounce vault refresh-triggered reruns.
- Avoid unnecessary reruns after inactive Base management changes.
- Keep explicit Refresh and edit-triggered reruns prompt.

Why fourth:

- reduces duplicate work without changing query output;
- pairs well with request sequencing.

### Step 5 - Result Limits And Guardrail Metadata

- Add a default maximum returned row count if measurements justify it.
- Extend `BaseResult` with total/returned/limited metadata.
- Apply limit after filter and sort.
- Show a clear limited-result state in the renderer.

Why fifth:

- protects IPC and renderer rendering after correctness and sequencing are
  stable;
- keeps broad Bases usable rather than letting them freeze the UI.

### Step 6 - Per-run Memoization

- Add only simple per-evaluation memoization where measurements identify repeat
  work.
- Avoid cross-run caches.
- Re-run correctness tests after edit scenarios.

Why sixth:

- tuning is safer after limits, logs, and stale-response handling are in place;
- measured hotspots can drive the exact optimization.

### Step 7 - Row Virtualization Evaluation

- Use timing logs and manual verification to decide whether virtualization is
  necessary.
- If needed, virtualize renderer rows only.
- Test editing focus, moved rows, disappeared rows, and limited-result states.

Why last:

- virtualization has the highest UI complexity;
- it may be unnecessary after limits and debounce.

## Deferred Items

Deferred beyond 6D:

- full pagination with persisted page size or page state;
- cross-run Base result cache;
- index revision system solely for Bases caching;
- renderer-side query evaluation;
- new Bases persistence files;
- new property write APIs;
- formulas;
- relations;
- rollups;
- grouping;
- bulk editing;
- schema manager;
- board, calendar, or gallery views;
- Canvas;
- plugins;
- sync;
- publish;
- URI scheme;
- marketplace;
- column virtualization;
- server-backed query engine;
- database-style indexes dedicated to Bases.

## Acceptance Criteria

6D is complete when:

- Bases remain evaluated in main/core against the in-memory index;
- renderer filesystem access is unchanged;
- property edits still use only `updateNoteProperties`;
- view-management edits still use only `replaceBases`;
- saved Bases still persist only in `.obsidian-replica/bases.json`;
- large synthetic note tests cover filter, sort, missing property, and
  edit-then-rerun correctness;
- loading and stale-response behavior is safer under frequent reruns;
- any added result limit is explicit and correct after sort;
- any memoization is local or safely invalidated;
- lists and reserved fields remain read-only;
- the app remains shippable after each implementation step.

## Milestone links

- Previous: [[MILESTONE-6C]]
- Next: [[MILESTONE-6D]]
- Implementation: [[MILESTONE-6D]]
