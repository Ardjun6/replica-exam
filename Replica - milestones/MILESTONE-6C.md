# Milestone 6C - Bases View Management Polish

Milestone 6C makes saved Bases easier to manage without expanding Bases into a
database or spreadsheet. It keeps the 6B architecture intact: saved Base views
are persisted only in `.obsidian-replica/bases.json`, view-management writes go
through `replaceBases`, and note property edits still go only through
`updateNoteProperties`.

## Delivered Scope

### Pure View-Management Helpers

- Added pure helpers for duplicate, rename, remove-and-select-next, and
  move-up/move-down behavior.
- Duplicate helpers generate a new safe id, a distinct copy name, and fresh
  timestamps while preserving view, source, filters, columns, and sort.
- Rename helpers validate non-empty names, reject confusing duplicate names,
  trim input, and update only the Base name and `updatedAt`.
- Remove helpers choose a stable next selected Base when the current Base is
  deleted.
- Move helpers reorder the persisted Bases array without changing ids.

### Duplicate Base

- The selected Base now has a Duplicate action.
- Duplicates are inserted next to the original and selected immediately after
  save.
- Duplicate is non-destructive and uses the existing `replaceBases` path.

### Simple Rename Flow

- The selected Base can be renamed from the detail toolbar without opening the
  full editor.
- Rename supports Save/Cancel buttons.
- `Enter` saves a valid rename and `Escape` cancels.
- Invalid rename errors are shown inline and do not persist changes.

### Reorder Saved Bases

- Saved Bases can be moved up or down from the list.
- Order is stored as the existing `bases` array order in
  `.obsidian-replica/bases.json`.
- No new schema field was required.

### Safer Delete UX

- Delete confirmation now states that only the saved Base view is removed.
- The confirmation explicitly says notes and note properties are not deleted.
- After delete, selection moves to the next Base, previous Base, or the empty
  state.

### Empty, Error, And Selected States

- The no-Bases empty state now explains what creating a Base does.
- No-result states distinguish a Base with no matching notes from the absence
  of saved Bases.
- Run errors show the selected Base name and a Retry action.
- Save and rename errors keep the current saved state visible.
- The active Base in the list has a clearer selected state and accessible
  current marker.

## No New Write Path

6C keeps the write boundaries unchanged:

```text
Base view management
  -> replaceBases({ schemaVersion, bases })
  -> .obsidian-replica/bases.json

Base table property edits
  -> updateNoteProperties(path, update)
  -> note frontmatter
```

There is no new main write API, no Bases-specific property write path, and no
renderer filesystem access.

## Changed Files

```text
src/renderer/components/bases/base-management.ts
  - pure duplicate/rename/remove/reorder helpers

src/renderer/components/bases/BasesPane.tsx
  - duplicate action
  - compact rename flow
  - safer delete confirmation
  - no-result and run-error states
  - move persistence through replaceBases

src/renderer/components/bases/BaseList.tsx
  - clearer selected Base state
  - move up/down controls

src/renderer/components/bases/BaseEmptyState.tsx
  - clearer no-Bases empty state

src/renderer/styles/app.css
  - selected Base, rename, reorder, and state-message styling

tests/bases-management.test.ts
  - helper coverage for duplicate, rename, remove, and move behavior
```

## Tests Added

- Duplicate creates a new id.
- Duplicate creates a distinct name.
- Duplicate sets fresh `createdAt` and `updatedAt`.
- Duplicate preserves columns, filters, sort, source, and view.
- Rename rejects empty names.
- Rename rejects duplicate names on other Bases.
- Rename updates only name and `updatedAt`.
- Delete/remove chooses the next selected Base safely.
- Move up/down reorders Bases and leaves edge items in place.

## Deferred Items

- Column width resize/persistence UI. The schema already supports
  `BaseColumn.width`, but resize interaction was deferred to keep 6C focused.
- Drag-and-drop Base reordering.
- List editing inside Bases.
- Reserved-field inline editing inside Bases.
- Formulas, relations, rollups, grouping, and bulk editing.
- Schema manager and vault-wide type inference.
- Board, calendar, gallery, Canvas, plugins, sync, publish, URI scheme, and
  marketplace.

## Manual Checks

1. Create a Base and confirm it appears selected in the saved Bases list.
2. Rename the Base from the detail toolbar; confirm Save persists and Escape
   cancels.
3. Try a blank rename and confirm an inline error appears.
4. Duplicate a Base and confirm the copy has a distinct name and is selected.
5. Move a Base up and down; restart the app and confirm order persists.
6. Delete a Base and confirm the dialog says notes and properties are not
   deleted.
7. Delete the last Base and confirm the no-Bases empty state returns.
8. Open a Base that matches no notes and confirm the no-result state appears.
9. Confirm existing Base full edit still works.
10. Confirm Bases inline property editing still works and still uses
    `updateNoteProperties`.

## Acceptance

- Bases are easier to create, rename, duplicate, reorder, and delete.
- No note or property data-loss behavior is introduced.
- Bases persistence remains `.obsidian-replica/bases.json`.
- View-management saves use `replaceBases`.
- Property saves still use only `updateNoteProperties`.
- Lists and reserved fields remain read-only in Bases.
- The app remains shippable and all quality gates pass.

## Milestone links

- Previous: [[MILESTONE-6C-PLAN]]
- Next: [[MILESTONE-6D-PLAN]]
- Plan: [[MILESTONE-6C-PLAN]]
