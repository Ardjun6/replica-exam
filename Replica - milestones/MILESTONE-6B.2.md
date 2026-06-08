# Milestone 6B.2 - Bases Editing Polish

Milestone 6B.2 polishes the safe inline property editing added in 6B.1 and
extends missing property cells with explicit type selection. It does not add a
new persistence model, write IPC channel, or renderer filesystem access.

## Delivered scope

### Missing-cell type selection

- Missing property cells still default to text.
- While editing a missing cell, the user can explicitly choose:
  - text;
  - number;
  - boolean;
  - null.
- Date-like values remain plain text strings.
- Number saves require finite numeric input.
- Null saves are explicit through the type selector; blank text is not treated
  as null.
- Existing typed cells keep their inferred editor type from 6B.1.

All saves still create one `NotePropertiesUpdate` with one `set` operation and
flow through `updateNoteProperties(path, update)`.

### Inline editor polish

- Editable cells now expose a focusable edit affordance instead of a hover-only
  action.
- Editable cells can enter edit mode with double-click, the edit button, or
  keyboard focus plus `Enter`/`F2`.
- The active editor focuses its first control on entry.
- Text and number editors save on `Enter`; all editors cancel on `Escape`.
- Save and Cancel buttons have property-specific accessible names.
- Inputs and the missing-cell type selector have stable accessible labels.
- Save errors use an alert role and keep the previous table result visible.
- Save buttons remain disabled while the save is in flight.
- Clicking outside the editor does not silently save.

### Read-only boundaries preserved

The following remain read-only in Bases inline editing:

- title, path, tags, and mtime cells;
- reserved properties: `aliases`, `tags`, `cssclasses`, `created`, `updated`;
- unknown or nested values;
- list values;
- rows whose source note has YAML/frontmatter errors;
- unsafe or missing property names.

Reserved fields and list values remain editable through the Properties pane
where the full property-editing controls already exist.

## No new write path

6B.2 deliberately keeps the same write flow as 6B.1:

```text
BaseTable draft
  -> NotePropertiesUpdate
  -> window.replica.updateNoteProperties(path, update)
  -> main-process validation
  -> VaultService.updateNoteProperties
  -> reindex
  -> runBase(activeBaseId)
```

There is no Bases-specific write IPC, no renderer filesystem access, and no
renderer-side Markdown reconstruction.

## List editing decision

String-list editing was evaluated and deferred. It is small in the pure helper,
but it adds multiline editor layout, keyboard handling, and validation
complexity inside dense tables. Keeping list cells read-only preserves the
existing 6B.1 safety boundary while the missing-cell type selector ships.

## Changed files

```text
src/renderer/components/bases/base-cell-edit.ts
  - explicit draft creation for text/number/boolean/null
  - shared editable/read-only tooltip copy

src/renderer/components/bases/BaseTable.tsx
  - focusable edit affordance
  - missing-cell type selector
  - improved accessible labels and error role
  - keyboard entry with Enter/F2, save with Enter, cancel with Escape

src/renderer/styles/app.css
  - editable-cell focus styling
  - always-focusable edit button styling
  - compact missing-cell type selector styling

tests/bases-cell-edit.test.ts
  - missing-cell type selector helper coverage
  - invalid number draft coverage
  - tooltip/status copy coverage
```

## Tests added or updated

- Missing-cell editor defaults to text.
- Missing-cell type selection creates text updates.
- Missing-cell type selection creates number updates.
- Missing-cell type selection creates boolean updates.
- Missing-cell type selection creates explicit null updates.
- Invalid number drafts reject before save.
- Date-like text remains a string.
- Existing typed cells keep inferred editor type.
- Read-only reasons map to stable tooltip/status copy.

Suite total after this milestone: 462 unit tests across 32 files.

## Quality gates

- `npm run check` - passed.
- `npm run build` - passed.
- `npm run test:e2e` - passed.
- `npm run dev` - launched successfully and stayed alive past startup.

The DevTools `Autofill.enable` / `Autofill.setAddresses` messages are Chromium
DevTools protocol noise, not Replica renderer runtime errors. The final timed
dev check was stopped intentionally after startup verification.

## Deferred items

- List editing inside Bases.
- Reserved-field inline editing inside Bases.
- Bulk editing and multi-cell paste.
- Delete from a Bases cell.
- Formula, relation, and rollup columns.
- Grouping and nested filter groups.
- Schema manager and vault-wide type inference.
- Advanced date picker.
- Board, calendar, and gallery views.
- Canvas, plugins, sync, publish, URI scheme, and marketplace.

## Manual checks

1. Open a Base with a missing property cell. Click Edit, keep type `text`,
   enter a value, save, and confirm the top-level property appears in the
   note frontmatter.
2. Repeat with missing-cell type `number`; invalid input should show an inline
   error and preserve the previous visible value.
3. Repeat with missing-cell type `boolean`; save should write `true` or `false`.
4. Repeat with missing-cell type `null`; save should write an explicit empty
   frontmatter value.
5. Confirm existing text, number, boolean, and null cells still use their
   inferred editors.
6. Confirm title/path/tags/mtime cells, reserved fields, list values, unknown
   values, and YAML-error rows stay read-only.
7. Edit a value so an active Base filter excludes the row; the row should
   disappear after the Base re-run and the saved notice should remain visible
   near the table.
8. Confirm the Properties pane still edits the same properties.
9. Restart the app and confirm saved values persist.

## Milestone links

- Previous: [[MILESTONE-6B.2-PLAN]]
- Next: [[MILESTONE-6C-PLAN]]
- Plan: [[MILESTONE-6B.2-PLAN]]
