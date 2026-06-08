# Milestone 6B.1 - Safe Bases Inline Property Editing

Milestone 6B.1 unlocks safe inline editing for simple property cells inside
the read-only Bases table views shipped in 6B. There is no new write path:
every save reuses the 6A.1 `updateNoteProperties(path, update)` API.

## Delivered scope

### Inline cell editing

- Property cells in a Bases table can enter edit mode via double-click or
  the per-row "Edit" button that appears on row hover.
- Only one cell at a time is editable.
- Editable types in 6B.1: `text` (incl. date-like strings), finite `number`,
  `boolean`, and explicit `empty`/`null`.
- Missing property cells can be filled in safely; saving creates the
  top-level property on the target note.
- `Enter` saves single-line drafts (except for `null`); `Escape` cancels.
- The active editor disables its inputs while a save is in flight and
  surfaces server errors inline; the previous cell display is preserved on
  every other row.
- Successful saves clear the edit state and re-run the active Base, so
  filters and sort decide where (or whether) the row appears.
- When a save makes the row no longer match the Base, a quiet
  "Saved; row no longer matches this Base." notice is shown.

### Cell metadata in `BaseResult`

To decide what is editable without re-reading notes from disk, the pure
Bases result types now carry small metadata fields:

- `BaseResultRow.hasPropertyErrors?: boolean` — true when the source
  note's YAML frontmatter has errors. Every property cell on the row is
  treated as read-only inline.
- `BaseResultCell.property?: BaseCellPropertyMeta` — populated for property
  columns only. Carries the property name, the existing value's type (or
  `'missing'`), and an `unsupported` flag for `unknown`/list values.

Title, path, tags, and mtime cells leave `property` undefined and stay
read-only. The metadata is plain shared data and travels through IPC
unchanged.

### Pure cell-edit helpers

`src/renderer/components/bases/base-cell-edit.ts`:

- `describeBaseCellEdit(column, row, cell)` returns either an editable
  descriptor (`{editable: true, propertyName, kind, isMissing}`) or a
  read-only reason (`not-property-column`, `reserved-property`,
  `unsupported-value`, `list-value`, `yaml-errors`,
  `unsafe-property-name`).
- `draftFromBaseCell(descriptor, cell)` seeds the editor's `BaseCellDraft`.
- `parseBaseCellDraft(draft)` validates the draft and returns either an
  `EditablePropertyValue` or a short error string.
- `updateFromBaseCellDraft(propertyName, draft)` builds a single-operation
  `NotePropertiesUpdate` ready for `updateNoteProperties`.
- `isBaseCellEditable`, `isReservedInlinePropertyName`,
  `isUnsupportedBaseCellValue` are small predicates used by the table.

### Renderer wiring

- `BaseTable` adds an active-edit prop pair (`activeEdit` +
  `onActiveEditChange`), a `savingPath`, and a `saveError`. It renders the
  compact editor for the active cell and a quiet "Edit" affordance for
  other safe property cells. No filesystem or IPC calls.
- `BasesPane` keeps the single active edit, the in-flight saving path,
  and the cell save error. `handleCellSave` calls
  `api().updateNoteProperties(path, update)` and then `api().runBase(id)`,
  replacing the table result with the fresh authoritative one.

## Changed files

```text
src/shared/bases.ts                                   (BaseResultRow.hasPropertyErrors,
                                                       BaseResultCell.property,
                                                       BaseCellPropertyMeta)
src/core/bases/base-rows.ts                           (populate metadata,
                                                       isUnsupportedPropertyValue helper)

src/renderer/components/bases/base-cell-edit.ts       (new pure helpers)
src/renderer/components/bases/BaseTable.tsx           (inline edit UI)
src/renderer/components/bases/BasesPane.tsx           (handleCellSave + re-run flow)
src/renderer/styles/app.css                           (inline editor styles +
                                                       .pane-notice)

tests/bases-cell-edit.test.ts                         (new — 27 helper cases)
tests/bases-query.test.ts                             (cell metadata coverage)
```

## Update payload shape

Bases inline edits reuse the existing 6A.1 payload exactly:

```jsonc
{
  "operations": [
    { "kind": "set", "name": "status", "value": "done" }
  ]
}
```

Exactly one `set` operation per save. There is no Bases-specific write IPC.

## Behaviour reuse from 6A.1

Every Bases inline save flows through the 6A.1 main process path:

- `asNotePropertiesUpdate` validates the payload.
- `asRelativePath` validates the note path.
- `updateFrontmatterProperties` performs the YAML rewrite, preserving the
  Markdown body byte-for-byte.
- Malformed YAML refuses the edit before any disk write.
- The note is reindexed; the returned `NoteIndex` flows back to the
  renderer for the next `runBase`.

## Read-only cells

These stay read-only in 6B.1 and keep the existing display behaviour:

- `title`, `path`, `tags`, `mtime` columns.
- Property cells whose current value is `unknown` or contains nested data
  (the row builder sets `unsupported: true`).
- Property cells whose current value is a `list` (deferred read-only in
  this slice).
- Property cells whose column references a reserved name: `aliases`,
  `tags`, `cssclasses`, `created`, `updated`.
- Property cells whose row note has YAML/frontmatter errors.
- Property cells whose column property name is empty or unsafe.

Reserved fields and lists are still editable through the Properties pane
introduced in 6A.1.

## Tests added or updated

- `tests/bases-cell-edit.test.ts` (new): 27 cases covering editable
  detection, read-only reasons (title/path/tags/mtime, reserved fields,
  unsupported values, list cells, YAML errors, unsafe names), draft seeding,
  draft parsing, and `NotePropertiesUpdate` construction (text, number,
  boolean, null, date-like, missing).
- `tests/bases-query.test.ts`: extended with cell-metadata coverage —
  property cells populate `BaseCellPropertyMeta`, rows with frontmatter
  errors set `hasPropertyErrors`, list/unknown values report
  `unsupported: true`.

Suite total at the end of Step 4: **454 unit tests across 32 files**.

## Quality gates

- `npm run check` — pass (typecheck + lint + format + unit tests).
- `npm run build` — pass (main + preload + renderer bundles emitted).
- `npm run test:e2e` — pass (Electron smoke).
- `npm run dev` — opens without red renderer runtime errors.

## Deferred items

- Reserved-field inline editing in Bases (`aliases`, `tags`, `cssclasses`,
  `created`, `updated`) — still editable in the Properties pane.
- List editing inside Bases (deferred read-only in this slice).
- Bulk editing and multi-cell paste.
- Delete from a Bases cell — true property deletion remains in the
  Properties pane.
- Formula columns, relation columns, rollup columns, grouping.
- Schema manager / vault-wide type inference.
- Board, calendar, gallery views.
- Nested object editing.
- Canvas, plugins, sync, publish, URI scheme, marketplace.

## Manual checks

1. Open a Base whose columns include a simple non-reserved property
   (e.g. `status`). Hover a row, click the small "Edit" button (or
   double-click the cell), change the value, press `Enter`. The Base
   re-runs and the row reflects the new value (or moves/disappears if
   filters/sort change).
2. Edit a row so it no longer matches the Base's filters. The row
   disappears after the re-run and a quiet
   "Saved; row no longer matches this Base." notice is shown.
3. Open a number property cell — edit, type a non-finite value, press
   `Enter`. A concise inline error appears; the previous value is still
   visible.
4. Open a boolean property cell — toggle the checkbox, press `Enter`. The
   cell updates without any extra prompts.
5. Open a cell whose property has a list value. The "Edit" affordance
   should not appear; the cell remains read-only. The Properties pane
   still allows editing.
6. Open a cell whose property is `aliases`, `tags`, `cssclasses`,
   `created`, or `updated`. The cell remains read-only with a tooltip
   pointing back to the Properties pane.
7. Open a Base over a note whose frontmatter has YAML errors. Every
   property cell on that row should be read-only with a "Note has YAML
   errors" tooltip.
8. Open a Base that includes a property column the row doesn't have. The
   cell should be editable as text and saving creates the top-level
   property on the target note.
9. Verify the Properties pane still works for the same notes — the two
   editing surfaces remain compatible.
10. With DevTools open, confirm no red renderer runtime errors during any
    of the above.

## Milestone links

- Previous: [[MILESTONE-6B.1-PLAN]]
- Next: [[MILESTONE-6B.2-PLAN]]
- Plan: [[MILESTONE-6B.1-PLAN]]
