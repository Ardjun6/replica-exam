# Milestone 6C Plan - Bases View Management Polish

Milestone 6C polishes saved Bases view management so Bases are easier to
create, rename, duplicate, organize, and adjust. It builds on:

- 6B saved Bases table views;
- 6B.1 safe inline editing for simple non-reserved property cells;
- 6B.2 Bases editing polish and missing-cell type selection.

This milestone should make Bases feel more comfortable to manage without
expanding them into a database, spreadsheet, schema manager, or additional view
system.

## Constraints

- Do not rewrite the architecture.
- Do not widen renderer filesystem access.
- Keep `.obsidian-replica/bases.json` as the only Bases persistence file.
- Reuse existing `replaceBases` for Bases view-management writes.
- Do not add a new main write API unless clearly justified.
- Do not add a new property write path.
- Inline property saves must still use `updateNoteProperties` only.
- Lists remain read-only in Bases.
- Reserved fields remain read-only in Bases.
- Do not implement formulas, relations, rollups, grouping, bulk editing, schema
  manager, Canvas, plugins, sync, publish, URI scheme, marketplace, or
  board/calendar/gallery views.
- Keep the app shippable after each step.

## Current State

### Saved Bases

- Bases are persisted per vault in `.obsidian-replica/bases.json`.
- The file is normalized defensively through the shared Bases schema helpers.
- The current schema version is maintained in shared code.
- Main process owns persistence through the existing Bases store.
- Renderer accesses Bases only through typed preload/API calls:
  - `getBases()`;
  - `replaceBases(bases)`;
  - `runBase(baseId)`;
  - `listPropertyKeys()`.

### Base List

- The Bases pane shows a saved Base list when at least one Base exists.
- Selecting a Base runs it and shows its table result.
- Creating a Base adds a starter Base and selects it.
- The selected Base state exists, but can be made clearer for scanning and
  keyboard use.
- Organization is currently minimal: Bases appear in persisted array order and
  there is no dedicated duplicate or rename flow.

### Base Editor

- The full Base editor handles Base name, columns, filters, and sort.
- Name changes currently happen through the full editor flow.
- The editor validates drafts before saving.
- Saves go through `replaceBases`, replacing the saved Bases file with a
  normalized version.
- Cancel exits the editor without persisting the draft.

### Base Table

- The table renders saved columns and rows from `runBase`.
- Title and path cells open notes.
- Simple non-reserved property cells can edit inline through 6B.1/6B.2.
- Missing property cells can be saved as text, number, boolean, or explicit
  null.
- List values remain read-only.
- Reserved fields remain read-only.
- Table edits re-run the active Base after successful property saves.

### Current Create/Edit/Delete Behavior

- Create:
  - creates a starter "All notes" Base;
  - persists it with `replaceBases`;
  - selects the new Base;
  - leaves deeper customization to the full editor.
- Edit:
  - opens the full editor for name, filters, columns, and sort;
  - saves the whole Base list through `replaceBases`.
- Delete:
  - asks for confirmation with the Base name;
  - removes the Base from the saved list through `replaceBases`;
  - selects the first remaining Base, or shows the empty state.

## UX Goals

### Easier Rename Flow

- Let users rename a Base without opening the full editor when the change is
  only the Base name.
- Keep the full editor available for structural changes.
- Validate empty names and overly confusing duplicate-name cases before saving.
- Preserve Base id, filters, columns, sort, and timestamps except for
  `updatedAt`.

### Duplicate Base

- Add a clear Duplicate action for the selected Base.
- The duplicate should copy the current Base definition while generating:
  - a new safe id;
  - a distinct default name;
  - fresh `createdAt` and `updatedAt` timestamps.
- Select the duplicated Base after save so users can immediately adjust it.
- Do not overwrite an existing Base.

### Better Empty States

- Improve the no-Bases state with a clearer primary action.
- Improve no-result table states so they distinguish:
  - no saved Bases;
  - selected Base has no matching notes;
  - selected Base failed to run;
  - selected Base was deleted or unavailable.
- Keep empty states practical and action-oriented, not marketing copy.

### Clearer Selected Base State

- Make the active Base visually and semantically clear in the list.
- Keep selection stable across refreshes when possible.
- Ensure selected rows/buttons have accessible state where appropriate.
- Avoid ambiguity where the same Base name appears in multiple nearby controls.

### Safer Delete UX

- Keep delete destructive and explicit.
- Confirmation copy should include the Base name and clarify that notes are not
  deleted.
- Delete should not affect note files or note properties.
- After delete, focus should move to a stable place.
- If the last Base is deleted, show the no-Bases empty state.

### Clearer Unsaved-Change Behavior

- If a rename or full-editor draft has unsaved changes, make Save/Cancel
  behavior obvious.
- Avoid silently discarding typed changes from accidental navigation.
- If adding a lightweight unsaved-change guard is simple, use it for switching
  Bases or closing the editor.
- Do not add a complex document-state system.

### Better Keyboard And Focus Behavior

- Base list should be reachable and usable by keyboard.
- Rename should focus the name input and return focus after Save/Cancel.
- Duplicate should move focus to the duplicated Base or its name/action.
- Delete should move focus to the next selected Base or empty-state action.
- Escape should cancel rename/full-editor modes where relevant.
- Enter should confirm simple rename where safe.

## View Management Features

Only safe polish features belong in 6C.

### Duplicate Base

- Add a Duplicate action near selected Base management controls.
- Implement duplication through pure helper logic:
  - copy selected Base;
  - generate unique id;
  - generate unique display name such as `Original copy`;
  - update timestamps;
  - insert next to the original or at the end using a consistent rule.
- Persist with `replaceBases`.
- Select the duplicate after save.

### Rename Base Without Full Editor

- If simple, add an inline or compact rename action in the Base detail toolbar
  or list row.
- Rename should update only:
  - `name`;
  - `updatedAt`.
- Validate:
  - non-empty trimmed name;
  - max length through existing normalization;
  - optionally warn on duplicate names while still relying on unique ids.
- Keep full editor as the fallback for all other changes.

### Optional Reorder Bases In List

Include only if simple and safe.

- Reorder by buttons such as Move up / Move down before considering drag and
  drop.
- Persist by changing the order of the `bases` array through `replaceBases`.
- Keep ids unchanged.
- Preserve current selection.
- Add tests that order survives reload.
- Defer if it introduces fragile focus, drag, or pointer complexity.

### Better Create-From-Current-State Flow

- Improve create behavior so users understand what the starter Base contains.
- If small, allow "Create Base" from current visible context:
  - starter all-notes Base;
  - optional prefilled name;
  - optional columns from current known property keys only if simple.
- Do not infer a schema or create property definitions.
- Do not create note properties while creating a Base.
- Persist only the Base definition with `replaceBases`.

### Better Empty And Error States

- No Bases:
  - show one clear create action.
- No matching rows:
  - explain that the selected Base has no matching notes;
  - offer Refresh or Edit Base if useful.
- Load error:
  - keep existing Bases list safe;
  - show a concise error.
- Run error:
  - show selected Base name and retry affordance.
- Save error:
  - preserve current saved state and show the reason.

### Improved Confirmation Messages

- Delete confirmation should say:
  - which Base will be deleted;
  - notes and note properties will not be deleted;
  - the action removes only the saved Base view.
- Duplicate confirmation is not required because it is non-destructive.
- Rename confirmation is not required; validation and Save/Cancel are enough.

### Optional Column Width Persistence

Include only if small and safe.

- The schema already allows `BaseColumn.width`.
- If implementing resize/persistence:
  - persist widths in the existing column definitions;
  - normalize widths using existing min/max constants;
  - save through `replaceBases`;
  - keep the table usable without widths.
- Defer if resize UI becomes larger than the view-management polish scope.

## Explicitly Out Of Scope

- Formulas.
- Relations.
- Rollups.
- Grouping.
- Bulk editing.
- Schema manager.
- List editing.
- Reserved-field inline editing.
- Board view.
- Calendar view.
- Gallery view.
- Canvas.
- Plugins.
- Sync.
- Publish.
- URI scheme.
- Marketplace.
- Multi-cell paste.
- Database-style type management.
- New note-property persistence paths.

## Technical Design

### Persistence

- Keep `.obsidian-replica/bases.json` as the only Bases persistence file.
- Continue to use the existing `BasesStore` and normalization flow.
- Continue to persist Bases with `replaceBases`.
- Do not introduce renderer filesystem access.
- Do not introduce raw IPC.
- Avoid a new main write API unless a later design clearly shows
  `replaceBases` cannot safely cover the change.

### Schema And Normalization

- Maintain schema versioning in shared Bases types.
- If new persisted fields are added, such as richer order metadata or column
  width behavior:
  - add fields conservatively;
  - normalize old files defensively;
  - preserve valid existing Base definitions;
  - clamp or discard invalid values;
  - document whether schema version changes.
- Prefer using existing array order for Base ordering before adding new fields.
- Prefer existing `BaseColumn.width` for width persistence before adding new
  column settings.

### Pure View-Management Helpers

Add or extend pure helper coverage before UI work.

Suggested helper responsibilities:

- generate unique Base ids;
- generate duplicate names;
- duplicate a Base safely;
- rename a Base draft;
- reorder Bases by id;
- remove a Base and choose the next selected id;
- validate Base names for lightweight rename.

Helpers should be deterministic where possible by accepting `now` and existing
ids/names as inputs.

### Renderer Flow

- Bases pane remains the coordinator for list/detail/editor state.
- View-management actions update the in-memory Base list only after
  `replaceBases` succeeds.
- On save success:
  - update saved list from normalized response;
  - preserve or update selected id intentionally;
  - re-run selected Base through existing effect/refresh path.
- On save failure:
  - keep the previous saved list visible;
  - show a concise error;
  - keep focus in a stable place.

### Property Editing Boundary

- Inline table cell edits remain separate from Base view-management writes.
- Property edits continue to call `updateNoteProperties`.
- Base view-management writes continue to call `replaceBases`.
- Do not create any path where Base view-management can write note frontmatter.

## Tests Needed

### Pure Helper Tests

- Duplicate Base creates a new id.
- Duplicate Base creates a distinct default name.
- Duplicate Base sets fresh `createdAt` and `updatedAt`.
- Duplicate Base preserves columns, filters, sort, source, and view.
- Rename validates non-empty names.
- Rename updates only name and `updatedAt`.
- Delete/remove helper chooses a safe next selected Base.
- Reorder persists order if included.
- Column width normalization persists valid widths if included.

### Component And Flow Tests

- Duplicate action persists through `replaceBases` and selects the duplicate.
- Rename action validates name and saves through `replaceBases`.
- Rename cancel does not call `replaceBases`.
- Delete confirmation remains safe and mentions that notes are not deleted.
- Delete removes only the Base definition.
- No-Bases empty state renders correctly.
- No-results empty state renders correctly.
- Load/run/save error states render correctly.
- Selected Base state is visually and accessibly clear.
- Keyboard focus returns to stable controls after rename, duplicate, delete,
  and cancel.

### Regression Tests

- Existing Base create/edit/delete still works.
- Existing Base filters, columns, and sort still run through `runBase`.
- Existing inline cell editing still works after view-management changes.
- Missing-cell type selection still works.
- Lists remain read-only in Bases.
- Reserved fields remain read-only in Bases.
- Property saves still use `updateNoteProperties`.
- Renderer still has no filesystem access or raw IPC.

## Risks And Mitigations

- **Accidental Base overwrite**: generate ids from existing ids and test
  collisions; never reuse the source id for duplicates.
- **Confusing duplicate names**: append a clear suffix such as `copy`; if needed,
  add numeric suffixes for repeated duplicates.
- **Destructive delete**: confirmation must say the action deletes only the
  saved Base view, not notes or properties.
- **Schema churn**: prefer existing array order and existing `BaseColumn.width`
  before adding new fields; normalize defensively if fields are added.
- **Feature creep into database features**: limit 6C to view-management polish;
  reject formulas, relations, rollups, grouping, bulk editing, and schema
  management.
- **Unsaved-change confusion**: keep rename and full editor Save/Cancel clear;
  add a simple guard only if it remains small.
- **Focus regressions**: add focused tests around rename, duplicate, delete,
  and selected Base changes.
- **Array-order mistakes**: test reorder and duplicate insertion rules if
  included.

## Recommended Implementation Order

1. **Pure Helpers First**
   - Add helper functions for duplicate, rename, delete selection, and optional
     reorder.
   - Keep them independent of React.
2. **Tests**
   - Cover helper behavior before touching UI.
   - Add focused component tests for duplicate, rename, delete, empty states,
     and keyboard/focus behavior.
3. **UI Polish**
   - Add Duplicate action.
   - Add simple rename flow if it stays small.
   - Improve selected Base state.
   - Improve empty/error states.
   - Improve delete confirmation copy.
4. **Persistence And Schema If Needed**
   - Use `replaceBases`.
   - Preserve schema versioning.
   - Add or normalize persisted fields only when the UI needs them.
   - Prefer no schema change for duplicate/rename/delete/reorder-by-array.
5. **Optional Small Enhancements**
   - Add Move up / Move down if simple.
   - Add column width persistence only if it uses existing width fields safely.
6. **Docs And Gates**
   - Update milestone documentation.
   - Run `npm run check`.
   - Run `npm run build`.
   - Run `npm run test:e2e`.
   - Run targeted manual verification in the app.

## Acceptance Criteria

- Bases are easier to manage from the Bases pane.
- Users can duplicate a saved Base safely.
- Users can rename a Base through a simpler flow if included.
- Delete UX clearly avoids note/property data-loss confusion.
- Empty, error, and selected states are clearer.
- Optional reorder persists correctly if included.
- Optional column widths persist correctly if included.
- Existing Base create/edit/delete behavior still works.
- Existing inline property cell editing still works.
- Lists remain read-only in Bases.
- Reserved fields remain read-only in Bases.
- No data-loss behavior is introduced.
- No new property write path is introduced.
- Renderer remains filesystem-free.
- Bases persistence stays in `.obsidian-replica/bases.json`.
- All gates pass.

## Milestone links

- Previous: [[MILESTONE-6B.2]]
- Next: [[MILESTONE-6C]]
- Implementation: [[MILESTONE-6C]]
