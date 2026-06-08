# Milestone 6B.1 Plan - Safe Bases Inline Property Editing

Milestone 6B.1 adds safe inline editing for simple property cells inside Bases
table views. It builds on Milestone 6B's saved read-only Bases tables and
Milestone 6A.1's main-owned `updateNoteProperties(path, update)` API.

The scope is intentionally narrow: edit one simple top-level YAML property cell
at a time, through the existing property-write path, without introducing bulk
editing, formulas, relations, or a second persistence model.

## Constraints

- Do not rewrite the architecture.
- Do not widen renderer filesystem access.
- Renderer must not write files directly.
- Reuse `updateNoteProperties(path, update)`.
- Do not create a second property-write path.
- Keep IPC typed and validated.
- Only edit simple top-level YAML properties.
- Do not edit unknown or nested values.
- Do not edit title, path, tags, or mtime cells unless explicitly designed.
- Do not implement formulas, relations, rollups, grouping, bulk editing, schema
  manager, Canvas, plugins, sync, publish, URI scheme, or marketplace.
- Keep the app shippable after each step.

## Current State

### Bases Table From 6B

- Bases definitions are stored in `.obsidian-replica/bases.json`.
- Bases are owned by the main process and exposed through typed IPC/preload:
  - `getBases()`;
  - `replaceBases(bases)`;
  - `runBase(baseId)`;
  - `listPropertyKeys()`.
- `runBase(baseId)` evaluates the saved Base against the in-memory note index.
- The renderer has a Bases pane with:
  - saved Base list;
  - table view;
  - Base editor for name, columns, filters, and sort.
- `BaseTable` currently renders all cells as read-only display values.
- Title/path cells can open notes; other cells do not edit content.

### Safe Property Editing From 6A.1

- 6A.1 adds a main-owned:

```ts
updateNoteProperties(path: string, update: NotePropertiesUpdate): Promise<NoteIndex>
```

- The renderer calls this through typed preload, never by writing files
  directly.
- The main process reads the latest note content, rewrites only safe
  frontmatter, writes through `VaultFs`, and reindexes the note.
- Malformed YAML refuses edits before disk writes.
- IPC validation rejects unsafe property names and unsupported values.

### Existing Property Value Model

- `PropertyValue` supports:
  - `text`;
  - `number`;
  - `boolean`;
  - `date`;
  - `list`;
  - `empty`;
  - `unknown`.
- Date-like values are strings for storage and display.
- Unknown and nested values are preserved but read-only.
- Reserved fields include `aliases`, `tags`, `cssclasses`, `created`, and
  `updated`.

## UX Design

### Editable Cells

Only property columns are editable, and only when the target value is safe:

- Existing `text` values.
- Existing `date` values, edited as strings.
- Existing finite `number` values.
- Existing `boolean` values.
- Existing `empty` values.
- Missing property cells in a property column, where saving creates that
  property on the row's note.
- Optionally, lists of simple scalar values if a compact list editor is already
  reliable.

### Read-Only Cells

The following stay read-only in 6B.1:

- `title` columns.
- `path` columns.
- `tags` columns.
- `mtime` columns.
- Non-property columns of any future kind.
- Property cells whose current value is `unknown`.
- Property cells containing nested objects or unsupported list items.
- Rows whose note has frontmatter/YAML errors.
- Reserved fields unless explicitly designed:
  - `aliases`;
  - `tags`;
  - `cssclasses`;
  - `created`;
  - `updated`.

If reserved-field inline editing is deferred, users can still edit them through
the Properties pane where the UX is more explicit.

### Edit Mode

- Only one cell enters edit mode at a time.
- Enter edit mode by double-clicking a safe property cell or using an explicit
  edit affordance.
- The active edit cell should be visually clear.
- Starting a second edit should require saving/canceling the first edit, or
  cancel the first edit explicitly.
- Keyboard behavior:
  - `Enter` saves for single-line inputs.
  - `Escape` cancels.
  - `Tab` can save and move focus only if implemented safely; otherwise it
    should leave normal browser focus behavior alone.

### Save And Cancel

- Save converts the draft into a `NotePropertiesUpdate` with one `set`
  operation.
- Cancel restores the previous display value and exits edit mode.
- Empty drafts map to either an empty string or `null` depending on the inferred
  type and control used.
- Delete from a Bases cell is not part of 6B.1 unless represented as setting
  `null`; true property deletion remains in the Properties pane.

### Error Behavior

- Failed save keeps the previous cell value visible.
- The cell exits or remains in edit mode based on which is least surprising;
  prefer staying in edit mode with the error shown nearby.
- Error copy should be concise:
  - invalid value;
  - YAML cannot be edited safely;
  - note changed or write failed;
  - unsupported value.
- Do not expose absolute filesystem paths.

### Loading State

- While saving, disable the active edit control and show a small pending state.
- Do not block the whole app.
- Avoid allowing multiple concurrent saves from the same Bases table.
- Other read-only navigation can remain available if it does not interfere.

### Refresh After Save

- On successful save:
  - clear the edit state;
  - re-run the active Base using the existing `runBase(baseId)` path;
  - keep the current Base definition, filters, columns, and sort intact.
- The refreshed result is authoritative. Do not patch table rows locally as the
  final state.

### Missing Property Cells

- A missing value in a property column may be editable if:
  - the column references a valid property name;
  - the row note has no YAML errors;
  - the property name passes 6A.1 validation.
- Saving creates that top-level property on the target note.
- The editor should infer a default type from the column context if possible,
  or use text by default for missing cells.

### Malformed YAML Rows

- If a row note has frontmatter errors, all editable property cells in that row
  are disabled.
- The cell should show a clear read-only/warning affordance, not a broken input.
- Saving should also be refused by the 6A.1 main-process path as defense in
  depth.

### Unknown And Nested Values

- Unknown, nested object, and unsupported complex values remain read-only.
- If a list contains unsupported nested items, the whole list cell should stay
  read-only.
- Display should continue using the existing safe display formatter.

## Technical Design

### Reuse `updateNoteProperties`

Do not add a Bases-specific write channel. Inline cell editing calls:

```ts
api().updateNoteProperties(row.path, {
  operations: [{ kind: 'set', name: column.property, value }],
});
```

That keeps all property mutation rules in the 6A.1 main-owned path:

- path validation;
- property-name validation;
- value validation;
- YAML parsing and serialization;
- malformed-YAML refusal;
- disk write;
- reindex.

### Cell Edit Helper Functions

Suggested pure helper file:

- `src/renderer/components/bases/base-cell-edit.ts`

Suggested helpers:

```ts
function getEditableBaseCell(column, row, noteIndexByPath): EditableCellState;
function draftFromCellValue(value: PropertyValue | undefined): CellDraft;
function updateFromCellDraft(property: string, draft: CellDraft): NotePropertiesUpdate;
function parseCellDraft(draft: CellDraft, expectedType: EditableCellType): EditablePropertyValue;
```

Keep helpers pure where practical so behavior is testable without rendering the
whole Bases pane.

### Locating The Original Property Value

`BaseResultCell` contains display strings, not the original `PropertyValue`.
Inline editing needs enough metadata to decide if a cell is editable and which
editor to show.

Recommended approaches:

1. Extend `BaseResultCell` with safe metadata:
   - property type;
   - missing/empty flag;
   - unsupported flag;
   - maybe `hasYamlErrors` at row level.
2. Or have the Bases pane keep a note-index lookup by path when available.

Prefer extending the pure Bases row result if it keeps renderer code simple and
does not expose raw file contents. The metadata should remain plain shared data
and should not include full Markdown source.

### Draft To `NotePropertiesUpdate`

For property column `column.property = "status"`:

```ts
{
  operations: [
    { kind: 'set', name: 'status', value: 'done' }
  ]
}
```

Rules:

- One cell save produces one operation.
- Missing property cell save uses the same `set` operation.
- Empty/null support should be explicit:
  - text editor empty string may remain `''`;
  - an explicit "empty" control can save `null`;
  - do not guess destructive nulls from accidental blank typing.
- True delete remains out of scope unless a separate cell action is designed.

### Refresh And Active Base Re-Run

After successful `updateNoteProperties`:

1. Await the returned `NoteIndex`.
2. Re-run the active Base with `runBase(activeBaseId)`.
3. Replace table results with the fresh result.
4. If the active Base disappears or fails, show the existing Bases error state.

Do not bypass `runBase` with local row mutation, because filters and sort may
change the result.

### Preserving Filters And Sorts

- The saved Base definition is not changed by inline cell editing.
- The existing filters, columns, and sort remain intact.
- The updated note may:
  - move to a different position due to sort;
  - disappear due to filters;
  - appear if a previously missing property now matches a filter.
- The table should accept the re-run result as truth.

### Row Disappearing After Edit

If an edit causes the row to no longer match filters:

- Clear edit state.
- Re-run the Base.
- Let the row disappear naturally.
- Optionally show a quiet status message such as "Saved; row no longer matches
  this Base."

Do not keep a stale row just because the user edited it.

### Type Inference

Infer the editor from the current `PropertyValue` where available:

- `text`: text input.
- `date`: text input with date-like hint only, not a date picker.
- `number`: numeric input, saving finite numbers only.
- `boolean`: checkbox or segmented true/false control.
- `empty`: choose text by default or offer a small type selector.
- missing property: choose text by default unless a column-level hint exists.
- `list`: defer, or use a simple comma/newline list editor only for scalar
  lists.
- `unknown`: read-only.

Do not infer dates into JavaScript `Date` values; keep date-like strings as
strings.

### Lists If Included

If simple list editing is included:

- Support lists of strings, finite numbers, booleans, and null.
- Prefer newline-separated values or a compact token editor.
- Reject nested objects and nested lists unless 6A.1 validators already support
  them safely.
- Preserve list item types only when unambiguous; otherwise save as strings.

If this grows, defer list editing and keep list cells read-only for 6B.1.

## Validation And Safety

### Reuse 6A.1 Validators

- All saves go through `asNotePropertiesUpdate()` over IPC.
- Property names and values are validated exactly like Properties pane edits.
- Do not duplicate looser validation in Bases.

### Renderer Safety

- No direct filesystem access.
- No raw IPC access.
- No new write channel.
- No full-note reconstruction in the renderer.
- No Bases-specific file writes.

### YAML Error Refusal

- Rows with YAML errors should not enter edit mode.
- If the UI misses this state, `updateNoteProperties` must still reject safely.
- Failed saves should not mutate the visible table result.

### Unsupported Values

- Unknown/nested values stay read-only.
- Unsupported list values stay read-only.
- Title/path/tags/mtime cells stay read-only.
- Reserved fields stay read-only unless a specific UX is implemented.

## Tests Needed

### Pure Helper Tests

- Editable property cell detection.
- Read-only detection for title cells.
- Read-only detection for path cells.
- Read-only detection for tags cells.
- Read-only detection for mtime cells.
- Read-only detection for unknown values.
- Read-only detection for nested/unsupported list values.
- Missing property column cell is editable when the row is otherwise safe.
- Malformed YAML row disables editing.

### Draft And Update Tests

- Edit text property cell creates the expected `NotePropertiesUpdate`.
- Edit number property cell creates a finite number update.
- Edit boolean property cell creates a boolean update.
- Edit empty/null property cell handles `null` explicitly.
- Add value into missing property column cell creates a `set` operation.
- Invalid draft values are rejected before save.
- Date-like string remains a string.

### Component/Flow Tests

- Save calls `updateNoteProperties` with the correct note path and update.
- Successful save re-runs the active Base.
- Failed save shows an error and keeps the previous value.
- Cancel exits edit mode without calling `updateNoteProperties`.
- Row disappearing after a filter-changing edit clears edit state cleanly.
- Sort-changing edit allows the row to move after refresh.
- Unsupported unknown value remains read-only in the rendered table.

### Regression Tests

- Existing Base creation/edit/delete still works.
- Title/path click-to-open behavior still works.
- Bases filters and sorts still evaluate through `runBase`.
- Properties pane editing still works after adding Bases inline editing.
- IPC validation tests remain the authority for unsafe payloads.

## Risks And Mitigations

- **Accidental bulk edits**: allow only one active cell edit and one operation
  per save in 6B.1.
- **Row disappearing after save**: re-run the Base and accept the result as
  truth; optionally show a short saved status message.
- **Type mismatch**: infer from current `PropertyValue`, validate drafts before
  save, and let 6A.1 IPC validation reject unsafe values.
- **Filters/sorts moving rows after edit**: never patch rows locally as final
  state; always re-run the active Base after save.
- **YAML errors on target note**: disable editing from row metadata and rely on
  main-process malformed-YAML refusal as backup.
- **Confusing UX between Properties pane and Bases table**: keep inline editing
  narrow and lightweight; reserve delete, complex values, and reserved fields
  for the Properties pane.
- **Duplicate property-write paths**: do not add Bases write IPC or renderer
  file writes; call `updateNoteProperties` only.

## Recommended Implementation Order

1. **Pure Cell-Edit Helpers**
   - Define editable/read-only cell predicates.
   - Define draft parsing and update payload conversion.
   - Decide whether `BaseResultCell` needs metadata.
2. **Tests**
   - Add focused helper tests first.
   - Add flow/component tests with mocked `updateNoteProperties` and
     `runBase`.
3. **BaseTable Edit UI**
   - Add one-cell-at-a-time edit state.
   - Add text/number/boolean/null controls for simple property cells.
   - Keep unsupported cells read-only.
4. **BasesPane Save/Re-Run Flow**
   - Call `updateNoteProperties`.
   - Re-run active Base on success.
   - Handle failed save and disappearing rows.
5. **Docs And Gates**
   - Update milestone docs and manual checks.
   - Run `npm run check`, `npm run build`, `npm run test:e2e`, and `npm run dev`.

## Deferred Items

- Bulk editing.
- Formula columns.
- Relation columns.
- Rollup columns.
- Grouping.
- Schema manager.
- Multi-cell paste.
- Nested object editing.
- Reserved-field inline editing unless explicitly designed.
- List editing if simple scalar-list UX becomes too large.
- Board, calendar, and gallery views.
- Canvas, plugins, sync, publish, URI scheme, and marketplace.

## Manual Verification Checklist

After automated gates pass, run this end-to-end smoke pass in the app:

1. Create or open a Base with a simple property column such as `status`.
2. Double-click a safe property cell and edit it.
3. Press `Enter` and confirm the edit saves.
4. Open the note and confirm its YAML frontmatter changed.
5. Edit a value so the row no longer matches the Base filters and confirm the
   row disappears after refresh.
6. Confirm `title`, `path`, `tags`, and `mtime` cells are read-only.
7. Confirm `aliases`, `tags`, `cssclasses`, `created`, and `updated` property
   cells stay read-only in Bases.
8. Confirm the Properties pane still edits the same properties.
9. Confirm list values and unknown/nested values are read-only in Bases.
10. Restart the app and confirm the edited values and Bases state persist.

## Acceptance Criteria

- Simple property cells in Bases tables can be edited inline.
- Title, path, tags, and mtime cells remain read-only.
- Unknown/nested/unsupported values remain read-only.
- Missing property cells can be filled safely for property columns.
- Saves call `updateNoteProperties`; no second property-write path exists.
- Successful saves re-run the active Base.
- Failed saves preserve previous visible values and show clear errors.
- Rows may move or disappear after refresh according to existing filters/sorts.
- Renderer still has no filesystem access or raw IPC.
- Existing Properties pane editing and Bases management continue working.
- `npm run check`, `npm run build`, `npm run test:e2e`, and `npm run dev` pass.

## Milestone links

- Previous: [[MILESTONE-6B]]
- Next: [[MILESTONE-6B.1]]
- Implementation: [[MILESTONE-6B.1]]
