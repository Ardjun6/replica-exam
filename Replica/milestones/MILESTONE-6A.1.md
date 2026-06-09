# Milestone 6A.1 - Safe Property Editing

Milestone 6A.1 unlocks **safe** add/edit/delete for top-level YAML frontmatter
properties on the active note. It builds on 6A's normalized properties and
6B's read-only Bases views, without widening renderer filesystem access and
without making Bases cells editable.

## Delivered scope

### Renderer Properties pane editing

- The Properties pane now lets the user add, edit, and delete top-level
  properties for the active note.
- Editable value types: text, date-like string (treated as text), number,
  boolean, null/empty, and lists of simple scalars.
- Unknown / nested object values keep their existing read-only display and
  get a "read only" badge.
- Reserved fields (`aliases`, `tags`, `cssclasses`, `created`, `updated`)
  stay marked with the reserved badge; simple scalar / list editing applies
  to them on the same terms as ordinary properties (no advanced date picker
  for `created`/`updated`, no auto-update of `updated`).
- When `NoteIndex.properties.errors` is non-empty the pane disables editing,
  warns the user to fix YAML in the editor first, and never attempts a
  write.
- After a successful save the pane refreshes from the freshly reindexed
  `NoteIndex`.
- Save errors are surfaced inline; the previous value is kept on screen.
- Cells are read-only by default; entering edit mode is an explicit per-row
  action.
- Delete asks for confirmation through `window.confirm`.

### Main-owned write API

- `VaultService.updateNoteProperties(path, update)`:
  - reads the latest note content,
  - runs the pure `updateFrontmatterProperties` helper,
  - skips disk write on a no-op,
  - writes through the same `VaultFs` + watcher-ignore path as `writeNote`,
  - returns a fresh `NoteIndex` after reindex.
- The handler refuses to write if the existing frontmatter has YAML errors
  or if validation fails — the file is never partially rewritten.

### Pure frontmatter update helper

- `src/core/properties/frontmatter-update.ts`:
  - `updateFrontmatterProperties(source, update)` returns
    `{ content, changed }`.
  - Edits the parsed `yaml` Document AST in place so unrelated nested values
    in the YAML are preserved untouched.
  - Preserves the body byte-for-byte (LF and CRLF source endings round-trip).
  - Preserves top-level key order — existing keys keep relative order, new
    keys append after existing keys, deleted keys are removed.
  - Refuses malformed YAML with a typed `FrontmatterUpdateError`.
  - Creates a fresh frontmatter block when the source has none, prepending
    `---\n…\n---\n` to the original source.
  - Leaves an empty `---\n---\n` block when the last key is deleted, so the
    block remains valid and round-trips through `readFrontmatter`.
  - Date-like strings (`2026-05-29`) round-trip as strings — no JS `Date`
    coercion.

### Update payload contract

Added to `src/shared/properties.ts`:

```ts
export type EditablePropertyValue =
  | string
  | number
  | boolean
  | null
  | EditablePropertyValue[];

export type PropertyUpdateOperation =
  | { kind: 'set'; name: string; value: EditablePropertyValue }
  | { kind: 'delete'; name: string };

export interface NotePropertiesUpdate {
  operations: PropertyUpdateOperation[];
}
```

Bounds enforced by the shared helpers and the IPC validator:

- `PROPERTY_NAME_MAX_LENGTH = 120`
- `PROPERTY_STRING_MAX_LENGTH = 10_000`
- `PROPERTY_LIST_MAX_LENGTH = 200`
- `PROPERTY_LIST_MAX_DEPTH = 2` (top-level list + one level of nesting)
- `PROPERTY_UPDATE_MAX_OPERATIONS = 50`

Pure helpers: `normalizeEditablePropertyName`, `isEditablePropertyValue`,
`validateEditablePropertyValue`.

### IPC, validation, preload

- New channel `note:updateProperties`.
- New `ReplicaApi.updateNoteProperties(path, update)`.
- New validator `asNotePropertiesUpdate(input)` that:
  - rejects non-object payloads,
  - rejects missing/empty `operations` arrays,
  - rejects overlarge operation arrays (> `PROPERTY_UPDATE_MAX_OPERATIONS`),
  - rejects unknown top-level keys and unknown per-operation keys,
  - rejects unknown operation kinds,
  - rejects unsafe property names (incl. prototype-pollution keys),
  - rejects unsupported values (objects, non-finite numbers, oversized
    strings/lists, nested-list depth > 2),
  - rejects forbidden keys (`__proto__`, `constructor`, `prototype`) at
    payload and operation level.
- Path is still validated by the existing `asRelativePath`.
- Preload exposes exactly the one new method; `ipcRenderer`, `fs`, and other
  Node APIs remain off-limits to the renderer.

## Changed files

```text
src/shared/properties.ts                    (EditablePropertyValue,
                                             PropertyUpdateOperation,
                                             NotePropertiesUpdate, bounds,
                                             normalize/validate helpers)
src/shared/ipc-contract.ts                  (IPC.noteUpdateProperties,
                                             ReplicaApi.updateNoteProperties)
src/core/properties/frontmatter-update.ts   (new pure helper)
src/main/vault/vault-service.ts             (updateNoteProperties)
src/main/ipc/validate.ts                    (asNotePropertiesUpdate)
src/main/ipc/register-ipc.ts                (note:updateProperties handler)
src/preload/preload.ts                      (updateNoteProperties method)
src/renderer/components/PropertiesPane.tsx  (add/edit/delete UI)
src/renderer/styles/app.css                 (Properties editor styles)

tests/property-update-validation.test.ts    (new)
tests/frontmatter-update.test.ts            (new)
tests/properties-pane-helpers.test.ts       (new)
tests/validate.test.ts                      (extended with
                                             asNotePropertiesUpdate cases)
```

## Update payload shape

A single save typically sends one `set` or `delete` operation. The payload
crosses the bridge as plain JSON; the renderer never imports YAML or
filesystem APIs:

```jsonc
{
  "operations": [
    { "kind": "set", "name": "status", "value": "active" }
  ]
}
```

Multiple operations may be batched up to `PROPERTY_UPDATE_MAX_OPERATIONS = 50`,
but the renderer UI sends single-operation batches per save in 6A.1.

## Frontmatter update behavior

- Pure rewrite — never touches the body slice.
- Body byte-for-byte preservation: trailing blank lines, CRLF endings, and
  bodies that begin immediately after the closing fence all survive.
- Schema-aware order preservation: existing keys keep their relative order;
  new keys append; deleted keys are removed.
- Unknown / nested mappings inside the YAML survive untouched when unrelated
  keys are edited, because the helper mutates the parsed Document AST
  rather than rebuilding it from `toJS()`.
- No-op edits (same value, deleting a missing key) return
  `{ changed: false }` and never touch disk.

## Body preservation guarantee

Covered by the following tests in `tests/frontmatter-update.test.ts`:

- "preserves the body verbatim when frontmatter is rewritten"
- "preserves a blank line immediately after the closing fence"
- "preserves trailing newlines exactly when there is no frontmatter"
- "preserves CRLF body endings when frontmatter uses CRLF"
- "handles a frontmatter block with no trailing newline after the closing
  fence"
- "treats a malformed closing fence as no frontmatter (creates a new block)"

## Malformed YAML refusal

When `readFrontmatter()` reports errors for the existing frontmatter block
the update helper throws a `FrontmatterUpdateError` with code
`malformed-yaml` and the main service propagates the error to the IPC layer
as a `Result.err`. No write occurs. The renderer disables all add/edit/delete
controls while errors are present and shows a clear "Frontmatter has YAML
errors — editing is disabled" warning.

## Aliases / tags compatibility

- `aliases` and `tags` are written through the same pure helper as any
  other key. The reindex after write feeds the existing 6A normalization,
  so aliases continue to drive the quick switcher and link resolution and
  tags continue to merge with inline tags.
- Tests in `tests/frontmatter-update.test.ts` cover the round-trip:
  - setting `tags: ['project', 'active']` and re-reading reproduces the list
    as a normalized `list`-typed property;
  - setting `aliases: ['AI']` round-trips through `readFrontmatter` and
    keeps the values intact.

## UI behavior

- A "+ Add property" button appears under the property list when the YAML is
  parseable; clicking it opens an inline add row with a name field, a value
  type selector, and a value input matching the chosen type.
- Each existing row gets `Edit` and `Delete` actions; unsupported values are
  marked "read only" and have no actions.
- Edit mode is per-row, with `Save` and `Cancel`. Local validation runs
  before any IPC call; invalid drafts show an inline error and block save.
- Save errors from the main process are surfaced as a banner above the
  property list; the existing values stay visible.
- Delete prompts a `window.confirm` to avoid accidental loss.

## Tests added or updated

| File                                       | What it covers                                                    |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `tests/property-update-validation.test.ts` | shared helpers: name normalization, value validation, bounds       |
| `tests/frontmatter-update.test.ts`         | pure rewrite: add/edit/delete, body preservation, CRLF, malformed YAML, value serialization |
| `tests/properties-pane-helpers.test.ts`    | renderer pure helpers: editable check, kind inference, formatting  |
| `tests/validate.test.ts`                   | `asNotePropertiesUpdate`: accept/reject, prototype-pollution, overlarge payloads |

Test totals at the end of Step 6: 425 unit tests across 31 files, plus the
Playwright smoke test.

## Quality gates

| Gate                                | Status | Command            |
| ----------------------------------- | :----: | ------------------ |
| Typecheck + lint + format + tests   | Passed | `npm run check`    |
| Build                               | Passed | `npm run build`    |
| E2E smoke                           | Passed | `npm run test:e2e` |
| Dev run                             | Passed | `npm run dev`      |

## Deferred items

- Bases inline editing (Bases table cells stay read-only).
- Multi-note bulk property edits.
- Schema manager / vault-wide type inference.
- Nested object editing.
- Advanced date picker for `created`/`updated`.
- Property templates.
- Formulas, relations, rollups.
- Canvas, plugins, sync, publish, URI scheme, marketplace.

## Manual checks

1. Open a note with a few simple properties; click `Edit` on one, change the
   value, click `Save`. The Properties pane and (after a moment) the
   refreshed `NoteIndex` should reflect the new value, and reopening the
   file should still show the change.
2. Click `+ Add property`, give it a name, choose a value type, save. The
   note's frontmatter should grow by exactly one line / list / scalar; the
   body must remain unchanged.
3. Click `Delete` on a property, accept the confirm. The property
   disappears from the list and is gone from disk.
4. Add a property to a note with **no** frontmatter. A new `---\n…\n---\n`
   block is prepended and the body below is byte-for-byte preserved.
5. Open a note whose frontmatter has broken YAML (e.g. `tags: [unterminated`).
   The Properties pane shows the warning state and editing is disabled. Try
   to add a property — controls should be hidden.
6. Open a note containing a nested mapping (`meta:\n  origin: paper`). The
   Properties pane should show `meta` with the "read only" badge; editing
   another scalar property should leave `meta` untouched in the saved file.
7. Open the Bases pane and verify table cells remain read-only; nothing
   about Bases changed.
8. Add a property whose value is a list. Use the inline list editor to add
   items, save. The file should serialize as a block list.
9. With DevTools open confirm no red renderer runtime errors during any of
   the above.

## Milestone links

- Previous: [[MILESTONE-6A.1-PLAN]]
- Next: [[MILESTONE-6B-PLAN]]
- Plan: [[MILESTONE-6A.1-PLAN]]
