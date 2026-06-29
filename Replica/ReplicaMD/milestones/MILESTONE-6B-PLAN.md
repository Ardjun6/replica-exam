# Milestone 6B Plan - Bases-style Views

Milestone 6B adds the first practical Bases-style layer on top of the
Milestone 6A Properties system. It should let users save simple table views over
notes and their normalized properties without turning Replica into a full
database product.

This milestone must use Replica's own versioned schema. It must not copy
Obsidian's private formats, implementation, assets, or branding.

## Constraints

- Do not rewrite the architecture.
- Do not widen renderer filesystem access.
- Keep note, index, and property access behind the existing preload bridge.
- Keep IPC typed in `src/shared/ipc-contract.ts` and payloads validated in
  `src/main/ipc/validate.ts`.
- Keep Bases persisted in Replica's own versioned schema.
- Keep query/filter logic pure where practical.
- Do not implement Canvas, plugins, sync, publish, URI scheme, marketplace,
  multi-window support, or workspace templates.
- Do not implement board, calendar, gallery, formula, relation, or rollup views.
- Keep Milestone 6B as a shippable first slice: saved table views only.

## Current State

### What Milestone 6A added

- The `yaml` dependency is present and isolated behind
  `src/core/markdown/frontmatter.ts`.
- `readFrontmatter()` parses valid YAML, preserves body extraction behavior, and
  converts malformed YAML into structured `FrontmatterError` values instead of
  throwing.
- `src/shared/properties.ts` defines the normalized property contract:
  `PropertyValue`, `FrontmatterError`, `NoteProperties`, and reserved property
  names.
- `NoteIndex` now includes `properties: NoteProperties` while keeping
  `frontmatter`, `aliases`, `tags`, headings, links, body text, and mtime.
- The right pane already has a read-only Properties tab for the active workspace
  note.
- Property editing and `updateNoteProperties(path, update)` are explicitly
  deferred from 6A.

### Property data available for Bases

Each indexed note has:

- `path`
- `title`
- `mtime`
- `tags`
- `aliases`
- `properties.values`
- `properties.order`
- `properties.errors`

Bases should read from this existing index data. The renderer must not scan the
vault or read Markdown files directly.

### Existing IPC / preload surface

Useful existing methods:

- `listNotes()` — compact note listing for quick switcher.
- `search(query)` — existing text/operator search.
- `readNote(path)` — returns note content and `NoteIndex` for one note.
- `getTags()` — tag counts.
- `getWorkspace()` / `replaceWorkspace()` — workspace persistence pattern.
- `getSettings()` / `updateSettings()` — settings persistence pattern.

Milestone 6B probably needs a dedicated Bases API because saved Base definitions
are their own persisted data and table results should be computed from the main
process index rather than by the renderer reading files.

## Proposed UX

### Entry points

- Add a `Bases` tab to the right pane or a dedicated top-level pane/section if
  the right pane becomes too cramped.
- Add command palette entries:
  - `Open Bases`
  - `Create Base`
- Optional: add a small toolbar button in the Bases pane.

### Base list

- Show saved Bases by name.
- Empty state: "No bases yet" with a `Create base` action.
- Selecting a Base opens its table view.
- Deleting a Base asks for confirmation.
- Renaming a Base is allowed through a simple text field or dialog.

### Table view

- Table-only first slice.
- Rows are matching notes.
- The first column should be the note title/path and clicking it opens the note
  in the active workspace pane.
- Other columns show selected properties.
- Missing property values render as a quiet dash/empty state.
- Malformed property values or frontmatter errors never crash the table; show a
  small warning indicator or unsupported value label.
- Sort by one column if simple.
- Empty result state clearly says no notes match the current filters.

### Filter builder

Start with a compact, non-fancy filter UI:

- property exists;
- property equals;
- property contains;
- tag includes;
- path contains;
- title contains.

Start with `AND` conditions only. OR groups and nested groups are deferred.

### Column picker

- Users can add/remove property columns.
- Always keep title/path visible.
- Reordering columns is nice if simple, but can be deferred.
- Column list can be populated from known property keys in the current index.

### Base editor

A first shippable editor can include:

- Base name.
- Columns.
- Filters.
- Sort.

Keep editing plain and predictable. Avoid a complex visual query builder in this
milestone.

### Inline property editing

Inline table editing is optional and should be deferred unless 6A property
editing already exists and is stable. Since 6A explicitly deferred property
editing, Milestone 6B should treat table cells as read-only by default.

## Technical Design

### Persistence location

Preferred first slice:

- `.obsidian-replica/bases.json`

Reasoning:

- Keeps saved Base definitions in Replica's config folder with other app-owned
  vault metadata.
- Avoids introducing user-visible `.replica-base` files before the schema is
  proven.
- Lets a future milestone add import/export or file-based Bases if needed.

Do not store Bases in `settings.json`; Base definitions can change frequently
and deserve their own versioned file, similar to `workspace.json`.

### Base schema

Recommended schema version: `BASES_SCHEMA_VERSION = 1`.

```ts
export interface BasesFile {
  schemaVersion: 1;
  bases: BaseDefinition[];
}

export interface BaseDefinition {
  id: string;
  name: string;
  view: BaseViewDefinition;
  source: BaseSourceDefinition;
  filters: BaseFilter[];
  columns: BaseColumn[];
  sort?: BaseSort | null;
  createdAt: number;
  updatedAt: number;
}

export interface BaseViewDefinition {
  type: 'table';
}

export interface BaseSourceDefinition {
  type: 'allNotes';
}

export type BaseFilter =
  | { id: string; kind: 'propertyExists'; property: string }
  | { id: string; kind: 'propertyEquals'; property: string; value: string }
  | { id: string; kind: 'propertyContains'; property: string; value: string }
  | { id: string; kind: 'tagIncludes'; tag: string }
  | { id: string; kind: 'pathContains'; value: string }
  | { id: string; kind: 'titleContains'; value: string };

export interface BaseColumn {
  id: string;
  kind: 'title' | 'path' | 'property' | 'tags' | 'mtime';
  label: string;
  property?: string;
  width?: number;
}

export interface BaseSort {
  columnId: string;
  direction: 'asc' | 'desc';
}
```

Normalization rules:

- Missing or malformed `bases.json` normalizes to `{ schemaVersion: 1, bases: [] }`.
- Base IDs and column/filter IDs must be non-empty strings generated by the app.
- Base names must be non-empty after trimming, with a reasonable max length.
- Unknown view types are ignored or normalized away.
- For Milestone 6B, only `view.type: 'table'` is valid.
- Filter values are strings with bounded length.
- Property names use the same safety rules as the Properties model: no NUL,
  no line breaks, no prototype-pollution keys.
- Columns referencing missing properties are allowed; they simply render empty
  cells until matching properties exist.
- Sort referencing a missing column is dropped.

### Query / filter engine

Add pure core modules:

- `src/core/bases/base-schema.ts` or `src/shared/bases.ts` for plain data shapes.
- `src/core/bases/base-normalize.ts` for schema normalization if not in shared.
- `src/core/bases/base-query.ts` for filtering notes.
- `src/core/bases/base-sort.ts` for sorting rows.
- `src/core/bases/base-rows.ts` for converting `NoteIndex` data into table rows.

Recommended pure API:

```ts
function normalizeBasesFile(input: unknown): BasesFile;
function normalizeBaseDefinition(input: unknown): BaseDefinition | null;
function evaluateBase(base: BaseDefinition, notes: NoteIndex[]): BaseResult;
function noteMatchesFilters(note: NoteIndex, filters: BaseFilter[]): boolean;
function propertyToDisplay(value: PropertyValue | undefined): string;
```

Filter behavior:

- `propertyExists`: note has the key and the value is not missing.
- `propertyEquals`: compare normalized display strings case-insensitively for
  text/date values; exact string form for numbers/booleans is acceptable for the
  first slice.
- `propertyContains`: string/list display contains value case-insensitively.
- `tagIncludes`: uses `note.tags`.
- `pathContains`: uses `note.path`.
- `titleContains`: uses `note.title`.
- Missing properties never throw; they fail property filters except negative
  filters, which are not in scope.

Sort behavior:

- Sort by selected column, stable by path on ties.
- Title/path/text sorts use locale-aware compare.
- Number values sort numerically when both sides are numbers.
- Booleans sort false before true unless direction reverses.
- Empty/missing values sort last.

### Main process design

Likely new file:

- `src/main/vault/bases-store.ts`

Responsibilities:

- Read `.obsidian-replica/bases.json`.
- Normalize malformed data before returning it.
- Write the current schema.
- Keep all file I/O in main.

Likely `VaultService` additions:

- `getBases(): Promise<BasesFile>`
- `replaceBases(bases: BasesFile): Promise<BasesFile>`
- `runBase(baseId: string): Promise<BaseResult>`
- Optional: `listPropertyKeys(): Promise<string[]>`

`runBase()` should query the existing in-memory index. If the index already has
all notes and properties, no filesystem scan is needed.

### IPC and preload

Add narrow methods:

```ts
getBases(): Promise<BasesFile>;
replaceBases(bases: BasesFile): Promise<BasesFile>;
runBase(baseId: string): Promise<BaseResult>;
listPropertyKeys(): Promise<string[]>;
```

Possible alternative:

- `runBaseDefinition(base: BaseDefinition): Promise<BaseResult>` for unsaved
  preview while editing.

For the first slice, prefer `runBase(baseId)` plus local preview only if it stays
simple.

Validation:

- `asBasesFile(input)` validates the whole file before write.
- `asBaseDefinition(input)` validates one definition if using preview APIs.
- `asBaseId(input)` validates IDs.
- Reject unknown operation names, unknown top-level keys where practical, and
  prototype-pollution keys.
- Bound number of bases, filters, columns, and string lengths.

### Renderer components

Likely new files:

```text
src/renderer/components/bases/BasesPane.tsx
src/renderer/components/bases/BaseList.tsx
src/renderer/components/bases/BaseTable.tsx
src/renderer/components/bases/BaseEditor.tsx
src/renderer/components/bases/BaseFilterBuilder.tsx
src/renderer/components/bases/BaseColumnPicker.tsx
src/renderer/components/bases/BaseSortControl.tsx
src/renderer/components/bases/BaseEmptyState.tsx
src/renderer/components/bases/base-format.ts
```

Likely changed files:

- `src/renderer/components/RightPane.tsx`
- `src/renderer/app/store.ts`
- `src/renderer/app/actions.ts`
- `src/renderer/app/feature-flags.ts`
- `src/renderer/App.tsx`
- `src/renderer/styles/app.css`

Suggested UX state:

- selected base id;
- base list;
- current base result;
- editing draft;
- loading/error state.

### Feature toggle

Milestone 4 introduced core feature toggles. If small, add:

- `featureBases: boolean`

But this changes settings schema and may be unnecessary for the first Bases
slice. Preferred 6B approach: add Bases tab without adding a settings schema v4
unless the existing feature-toggle pattern makes the change very small.

### Performance approach

- Evaluate Bases against the in-memory index, not by reading files.
- For first slice, simple synchronous pure evaluation is acceptable for small and
  medium vaults.
- Avoid virtualized table unless the current UI becomes slow.
- Add a documented future optimization for large vaults: memoized Base results
  keyed by index version and base definition hash.

## Acceptance Criteria

### Base schema and persistence

- `.obsidian-replica/bases.json` is created when the user creates a Base.
- Missing/malformed `bases.json` normalizes to an empty list and never blocks
  vault opening.
- Saved Base definitions persist across app restart.
- Invalid renderer writes are rejected before reaching disk.
- The schema is versioned and documented.

### Query engine

- Notes can be filtered by:
  - property exists;
  - property equals;
  - property contains;
  - tag includes;
  - path contains;
  - title contains.
- Multiple filters combine with AND.
- Missing or malformed properties never crash filtering.
- Sorting by one column works and is stable.

### Table view

- User can open the Bases pane.
- User can create a table Base.
- Table rows show matching notes.
- Title/path column is always present.
- Property columns render normalized property values.
- Missing values render empty/quietly.
- Clicking a row opens the note in the active workspace pane.
- Empty result state is clear.

### Base editor

- User can rename a Base.
- User can add/remove columns.
- User can configure simple filters.
- User can configure a single sort.
- Changes persist.
- If the full editor is too large, a smaller read-only view over a generated
  default Base is acceptable only if the deferral is documented clearly.

### Architecture and safety

- Renderer has no direct filesystem access.
- Bases persistence goes through main process store + typed preload + validated
  IPC.
- Existing Properties pane, search, tags, aliases, workspace tabs, explorer, and
  graph continue working.
- No Bases implementation copies Obsidian formats or names private internals.

## Tests Needed

### Schema and validation

- `tests/bases-schema.test.ts`
  - default empty file;
  - malformed input fallback;
  - invalid IDs;
  - invalid view type;
  - invalid filter kind;
  - invalid column kind;
  - invalid sort reference dropped;
  - bounds on bases/filters/columns/string lengths;
  - prototype-pollution key rejection.

- `tests/validate.test.ts`
  - `asBasesFile` valid payload;
  - rejected malformed Bases payloads;
  - rejected prototype-pollution keys;
  - rejected overlarge payloads.

### Query engine

- `tests/bases-query.test.ts`
  - property exists;
  - property equals for text/number/boolean/date-like string;
  - property contains for text and lists;
  - tag includes;
  - path/title contains;
  - multiple AND filters;
  - missing property;
  - malformed property errors present;
  - stable sorting;
  - empty values sort last.

### Persistence

- `tests/bases-store.test.ts`
  - missing file returns empty Bases file;
  - malformed file normalizes;
  - write/read round trip;
  - invalid writes rejected before disk if store-level validation exists.

### Renderer / behavior

- Pure renderer helpers if extracted:
  - column formatting;
  - filter draft normalization;
  - table cell display.

- E2E smoke extension if practical:
  - open command palette or right pane Bases tab;
  - confirm app still boots and preload bridge exists.

Do not make drag/drop table UI or inline editing a required e2e target in 6B.

## Risks

- **Scope creep into a database product**: defer formulas, relations, rollups,
  grouping, board/calendar/gallery views, and bulk editing.
- **Query complexity**: start with AND-only filters and one sort.
- **Large vault performance**: pure in-memory evaluation is fine first; document
  memoization/virtualization later.
- **Inline editing corruption**: defer inline editing until 6A property editing
  exists and is heavily tested.
- **Schema migration mistakes**: keep `BASES_SCHEMA_VERSION = 1`, normalize
  aggressively, and reject invalid renderer writes.
- **UI complexity**: keep the Base editor compact; avoid a fully visual query
  builder in the first slice.
- **Confusion with Obsidian Bases**: use Replica's own schema and wording in the
  code/docs, and do not claim compatibility.
- **Property display edge cases**: unknown/nested values should show as read-only
  JSON-like text or "Unsupported", never crash a cell.

## Recommended Implementation Order

1. **Schema and validation first**
   - Add Bases types and `BASES_SCHEMA_VERSION = 1`.
   - Add normalization and validation tests.
2. **Pure query/filter engine**
   - Evaluate Base definitions against `NoteIndex[]`.
   - Add query/sort tests.
3. **Persistence**
   - Add `bases-store.ts`.
   - Add `VaultService` methods.
   - Add IPC/preload methods and validator tests.
4. **Read-only table view**
   - Add Bases pane and table rendering.
   - Add a built-in temporary/default "All notes" Base if needed to prove the
     table before the full editor.
5. **Base editor UI**
   - Create/rename/delete Base.
   - Configure columns, filters, and sort.
6. **Index refresh integration**
   - Re-run active Base when vault/index changes.
   - Keep missing/malformed properties safe.
7. **Docs and gates**
   - Create `MILESTONE-6B.md`.
   - Update README and ROADMAP.
   - Run `npm run check`, `npm run build`, `npm run test:e2e`, and `npm run dev`.

## Deferred Items

- Board, calendar, gallery, kanban, or card views.
- Formulas.
- Relations and rollups.
- Grouping and nested OR filter groups.
- Inline property editing in table cells.
- Multi-note bulk editing.
- Base templates.
- View-specific permissions or sharing.
- Obsidian-compatible Base import/export.
- Property schema manager and vault-wide type inference.
- Query language beyond the small filter builder.
- Canvas, plugins, sync, publish, URI scheme, marketplace, multi-window support.

## Completion Gate

Milestone 6B is complete only when:

- `npm run check` passes.
- `npm run build` passes.
- `npm run test:e2e` passes.
- `npm run dev` opens without red app renderer runtime errors.
- Bases are persisted in a versioned Replica-owned schema.
- Bases evaluate against normalized 6A properties from the existing index.
- Table view works for matching notes and missing properties.
- Existing Properties pane, search, tags, aliases, workspace tabs, explorer, and
  graph still work.
- Renderer still has no raw filesystem access.
- Docs clearly record shipped scope and deferred items.

## Milestone links

- Previous: [[MILESTONE-6A.1]]
- Next: [[MILESTONE-6B]]
- Implementation: [[MILESTONE-6B]]
