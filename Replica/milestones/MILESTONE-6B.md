# Milestone 6B - Bases-style Views

Milestone 6B adds Replica's first practical Bases-style layer on top of the
Milestone 6A Properties system. It lets users save table views over notes and
their normalized properties without turning Replica into a full database
product.

Bases use Replica's own versioned schema. No Obsidian private formats,
implementation details, branding, or assets are copied.

## Delivered scope

### Bases schema and persistence

- `BASES_SCHEMA_VERSION = 1`.
- New persistence file `.obsidian-replica/bases.json` owned by the main
  process; renderer never reads or writes it directly.
- Plain data shapes live in `src/shared/bases.ts`:
  - `BasesFile`, `BaseDefinition`, `BaseViewDefinition`, `BaseSourceDefinition`,
    `BaseFilter`, `BaseColumn`, `BaseSort`,
    `BaseResult`, `BaseResultRow`, `BaseResultCell`.
- `normalizeBasesFile()` / `normalizeBaseDefinition()` defensively clean
  malformed input, enforce bounds, and reject prototype-pollution keys.
- Schema versioning is checked on read so a corrupted or hand-edited file
  still produces a usable empty Bases file rather than blocking vault open.

### Pure query / sort / row engine

- `src/core/bases/base-query.ts`: `evaluateBase`, `noteMatchesFilters`.
- `src/core/bases/base-rows.ts`: `buildBaseRows`, `propertyToDisplay`,
  `columnToDisplay`.
- `src/core/bases/base-sort.ts`: `sortNotesForBase`.
- Filters supported:
  - `propertyExists`
  - `propertyEquals`
  - `propertyContains`
  - `tagIncludes`
  - `pathContains`
  - `titleContains`
- Multiple filters combine with AND.
- Sorting is stable, one column only, with a fallback to note path.
- Number and boolean properties sort by their native values; text/date/path
  sort locale-aware; empty values always sort last.
- Display rendering never throws on unknown or nested values; circular
  payloads degrade to `[unsupported]`.

### Main-process Bases store and service

- `src/main/vault/bases-store.ts`:
  - Reads `.obsidian-replica/bases.json` defensively.
  - Missing or malformed file returns a default empty `BasesFile`.
  - Writes always persist the normalized current schema.
- `VaultService` additions:
  - `getBases()`
  - `replaceBases(bases)`
  - `runBase(baseId)` — evaluates against the in-memory `Indexer` snapshot,
    no filesystem scan.
  - `listPropertyKeys()` — sorted unique keys from indexed notes.
- `Indexer.allNotes()` exposes the live index snapshot for `runBase` without
  widening the existing IPC surface.

### IPC and preload

- Added typed channels in `src/shared/ipc-contract.ts`:
  - `bases:get`
  - `bases:replace`
  - `bases:run`
  - `bases:listPropertyKeys`
- `ReplicaApi` adds matching methods:
  - `getBases()`
  - `replaceBases(bases)`
  - `runBase(baseId)`
  - `listPropertyKeys()`
- `src/preload/preload.ts` exposes exactly these methods; no raw
  `ipcRenderer` or filesystem access leaks.
- `src/main/ipc/validate.ts` adds:
  - `asBasesFile(input)` — rejects non-object payloads, missing `bases`
    arrays, prototype-pollution keys at any depth, overlarge payloads, and
    payloads with more than `BASES_MAX_BASES` entries.
  - `asBaseId(input)` — only safe IDs matching the schema id rules.

### Read-only Bases pane

- New right-pane tab "Bases" (always available alongside Search and
  Properties).
- Components in `src/renderer/components/bases/`:
  - `BasesPane.tsx` — orchestrates list, table, editor, persistence.
  - `BaseList.tsx` — sidebar list of saved bases.
  - `BaseTable.tsx` — read-only table view with locale-aware mtime and
    quiet em-dash for empty/missing cells.
  - `BaseEmptyState.tsx` — first-run "no bases yet" + Create button.
  - `BaseEditor.tsx` — name + columns + filters + sort editor.
  - `BaseColumnPicker.tsx` — add/remove/relabel columns; property columns
    pick from `listPropertyKeys()`.
  - `BaseFilterBuilder.tsx` — flat AND-only filter list across the six
    supported filter kinds.
  - `BaseSortControl.tsx` — single-column asc/desc sort.
  - `base-format.ts` — pure helpers (`formatCellDisplay`, `formatMtime`,
    `createStarterBase`, `validateBaseDraft`, `reconcileSort`,
    `defaultColumnForKind`, `defaultFilterForKind`, `upsertBase`,
    `removeBaseFromList`, id generators).
- Behavior:
  - Empty state shows "No bases yet" with a Create base button.
  - Creating a base seeds an "All notes" table with title, path, tags,
    modified columns.
  - Selecting a base evaluates it against the live in-memory index.
  - Clicking a title or path cell opens the note in the active workspace
    pane.
  - Tag, mtime, property cells are read-only; empty cells render as `—`.
  - Refresh re-runs the active base; the pane also re-runs whenever the
    `refreshKey` from the App-level vault-changed subscription bumps.
  - Delete asks for confirmation through `window.confirm`.
  - Edit opens the Base editor; Save validates the draft locally before
    issuing `replaceBases` over IPC.
  - The main process re-validates and normalizes the payload.

### Renderer state and flags

- `RightPane` union extended with `'bases'`.
- `feature-flags.ts` registers Bases (no settings toggle: it is always
  available, like Search and Properties, since the file is created lazily).

## Changed files

```text
src/shared/ipc-contract.ts                  (bases:* channels + ReplicaApi)
src/shared/bases.ts                         (BaseResult, BaseResultRow,
                                             BaseResultCell types alongside
                                             existing Step 1 schema)

src/core/bases/base-query.ts                (pure filter evaluation)
src/core/bases/base-rows.ts                 (row construction + display)
src/core/bases/base-sort.ts                 (stable sort engine)

src/main/indexer/indexer.ts                 (allNotes() accessor)
src/main/vault/vault-service.ts             (Bases ops + runBase/list keys)
src/main/vault/bases-store.ts               (new persistence)
src/main/ipc/register-ipc.ts                (Bases handlers)
src/main/ipc/validate.ts                    (asBasesFile, asBaseId)
src/preload/preload.ts                      (Bases methods)

src/renderer/app/store.ts                   (right-pane union)
src/renderer/app/feature-flags.ts           (bases tab)
src/renderer/components/RightPane.tsx       (Bases pane route)
src/renderer/components/bases/BasesPane.tsx (new)
src/renderer/components/bases/BaseList.tsx  (new)
src/renderer/components/bases/BaseTable.tsx (new)
src/renderer/components/bases/BaseEmptyState.tsx (new)
src/renderer/components/bases/BaseEditor.tsx (new)
src/renderer/components/bases/BaseColumnPicker.tsx (new)
src/renderer/components/bases/BaseFilterBuilder.tsx (new)
src/renderer/components/bases/BaseSortControl.tsx (new)
src/renderer/components/bases/base-format.ts (new)
src/renderer/styles/app.css                 (Bases pane styles)

tests/bases-schema.test.ts                  (Step 1, already shipped)
tests/bases-query.test.ts                   (new: query/sort/display)
tests/bases-store.test.ts                   (new: file persistence)
tests/bases-format.test.ts                  (new: renderer helpers)
tests/validate.test.ts                      (extended: asBasesFile/asBaseId)
```

## Bases schema

`.obsidian-replica/bases.json`:

```jsonc
{
  "schemaVersion": 1,
  "bases": [
    {
      "id": "base-abc",
      "name": "Projects",
      "view":   { "type": "table" },
      "source": { "type": "allNotes" },
      "filters": [
        { "id": "f1", "kind": "tagIncludes",     "tag": "project" },
        { "id": "f2", "kind": "propertyEquals",  "property": "status", "value": "active" }
      ],
      "columns": [
        { "id": "title",  "kind": "title",    "label": "Title" },
        { "id": "status", "kind": "property", "label": "Status", "property": "status" },
        { "id": "mtime",  "kind": "mtime",    "label": "Modified" }
      ],
      "sort":      { "columnId": "status", "direction": "asc" },
      "createdAt": 1722222222222,
      "updatedAt": 1722222222222
    }
  ]
}
```

Bounds enforced by `normalizeBasesFile`:

- `BASES_MAX_BASES = 100`
- `BASES_MAX_COLUMNS = 50`
- `BASES_MAX_FILTERS = 50`
- `BASES_MAX_ID_LENGTH = 80`
- `BASES_MAX_NAME_LENGTH = 120`
- `BASES_MAX_LABEL_LENGTH = 120`
- `BASES_MAX_FILTER_VALUE_LENGTH = 500`
- `BASES_MAX_PROPERTY_NAME_LENGTH = 120`
- `BASES_MAX_COLUMN_WIDTH = 600` (`BASES_MIN_COLUMN_WIDTH = 80`)

## Persistence location

`<vault>/.obsidian-replica/bases.json`. The folder is shared with
`settings.json` and `workspace.json` so app-owned metadata stays in one
hidden place.

## New IPC / preload methods

| Method                              | Direction       | Payload validation |
| ----------------------------------- | --------------- | ------------------ |
| `getBases(): BasesFile`             | renderer → main | none (read)        |
| `replaceBases(bases): BasesFile`    | renderer → main | `asBasesFile`      |
| `runBase(baseId): BaseResult`       | renderer → main | `asBaseId`         |
| `listPropertyKeys(): string[]`      | renderer → main | none (read)        |

Channels: `bases:get`, `bases:replace`, `bases:run`,
`bases:listPropertyKeys`.

## Query / filter behavior

- Property filters compare normalized `PropertyValue` from
  `NoteIndex.properties.values`.
- Text comparisons are case-insensitive.
- `propertyEquals` matches the normalized display string (e.g. `"true"` for
  booleans, `"2026-05-29"` for dates, `String(n)` for numbers).
- `propertyContains` substring-matches the display string; for `list`
  values this means it matches the joined display (e.g. searching `"ops"`
  hits a list containing `"Ops"`).
- `tagIncludes` strips a leading `#` then compares case-insensitively.
- Missing properties and frontmatter parse errors never throw and never
  match positive filters.
- Sorting is stable, single-column, with a fallback by note path. Empty
  and missing values always sort last regardless of direction.

## UI behavior

- A "Bases" tab is always available on the right pane.
- Empty state: "No bases yet" with a `Create base` action that seeds an
  "All notes" table.
- Selecting a base runs it immediately. Title and Path cells are clickable
  buttons that open the note in the active workspace pane.
- Property and tag cells are read-only; empty/missing values show a quiet
  em-dash.
- Modified column shows a localized date.
- Edit opens an inline editor with name, columns, filters, sort.
- Save validates the draft locally first; invalid drafts disable Save and
  show an inline error.
- Delete asks for confirmation before persisting.

## Tests

- `tests/bases-schema.test.ts` — schema normalization, bounds,
  prototype-pollution rejection.
- `tests/bases-query.test.ts` — filtering (all six kinds), AND combinator,
  display rendering for every `PropertyValue` type, stable sort, empty
  values last, asc/desc, number / boolean native ordering, never-throws
  guarantees on unknown / circular values, missing property safety.
- `tests/bases-store.test.ts` — missing file fallback, malformed JSON
  fallback, schema-version normalization on read, round-trip, duplicate
  base removal, schema-only writes, `ensure()` seeds the default file.
- `tests/bases-format.test.ts` — renderer cell formatting, default starter
  base shape, `validateBaseDraft` happy and error paths,
  `reconcileSort` removing stale references, column/filter defaults,
  upsert/remove helpers.
- `tests/validate.test.ts` — `asBasesFile` happy + rejection paths
  (non-object, missing array, prototype-pollution at top / per base /
  per filter, overlarge payloads, too many bases) and `asBaseId`.

Test totals (Step 6): `npm test` reports 28 test files with all suites
green.

## Quality gates

| Gate                                | Status | Command            |
| ----------------------------------- | :----: | ------------------ |
| Typecheck                           | Passed | `npm run typecheck`|
| Lint                                | Passed | `npm run lint`     |
| Unit tests                          | Passed | `npm test`         |
| Build                               | Passed | `npm run build`    |
| E2E smoke                           | Passed | `npm run test:e2e` |

`npm run check` additionally runs Prettier in `--check` mode. On this
Windows worktree git checked the repository out with CRLF line endings,
which Prettier flags on a wide pre-existing set of files (this is not
introduced by Milestone 6B — `git stash && npm run format:check` on the
6B-base commit reports the same 131 files). The Bases code itself is
LF-clean. On CI / Linux checkouts `npm run check` is expected to pass.

## Deferred items

- Inline property editing in table cells (still blocked on 6A property
  editing).
- Board, calendar, gallery, kanban, card views.
- Formulas, relations, rollups, grouping, OR / nested filter groups.
- Drag-and-drop column reordering.
- Multi-note bulk editing.
- Base templates and import/export.
- Property schema manager and vault-wide type inference.
- Memoized base results and virtualized tables for very large vaults.
- View-specific permissions or sharing.
- Canvas, plugins, sync, publish, URI scheme, marketplace, multi-window
  support.

## Manual checks

1. Open a vault, switch to the Bases tab. Verify the empty state appears.
2. Click "Create base". The "All notes" base should appear and run
   instantly; cells in Title and Path open the note when clicked.
3. Click Edit. Add a property column (use a property the vault actually
   has — autocomplete suggests known keys). Save.
4. Add a filter (e.g. `tagIncludes` with one of your existing tags).
   Save; only matching notes should appear.
5. Add a single sort, switch direction. Confirm stable order.
6. Edit one of your notes outside Replica or via the editor. The base
   re-runs when the vault-changed signal fires; the table reflects the
   new property values.
7. Delete the base via the toolbar. Confirm the dialog appears and the
   base is gone after restart.
8. Restart the app. The base file should still be at
   `<vault>/.obsidian-replica/bases.json` and saved bases should be
   restored.
9. Hand-edit `bases.json` to invalid JSON. Reopen the vault. The Bases
   tab should be empty and no other pane should error.
10. With DevTools open confirm no red renderer runtime errors.

## Milestone links

- Previous: [[MILESTONE-6B-PLAN]]
- Next: [[MILESTONE-6B.1-PLAN]]
- Plan: [[MILESTONE-6B-PLAN]]
