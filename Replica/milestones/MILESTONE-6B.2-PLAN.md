# Milestone 6B.2 Plan - Bases Editing Polish

Milestone 6B.2 polishes Bases inline property editing and only extends it where
6B.1 is already stable. It builds on:

- 6A.1 safe property editing through `updateNoteProperties`;
- 6B saved Bases-style table views;
- 6B.1 inline editing for simple non-reserved property cells.

This milestone should improve confidence and usability without turning Bases
into a spreadsheet, database, or schema manager.

## Constraints

- Do not rewrite the architecture.
- Do not widen renderer filesystem access.
- Reuse `updateNoteProperties`.
- Do not add a second property-write path.
- Do not add formulas, relations, rollups, grouping, bulk editing, schema
  manager, Canvas, plugins, sync, publish, URI scheme, marketplace, or
  board/calendar/gallery views.
- Keep the app shippable after each step.

## Current State

### Property Editing Foundation From 6A.1

- Property writes go through `updateNoteProperties(path, update)`.
- The renderer never writes files directly.
- Main process reads the latest note, rewrites safe YAML frontmatter, writes
  through `VaultFs`, and reindexes.
- Malformed YAML refuses edits.
- IPC payloads are typed and validated.

### Bases From 6B

- Bases are saved in `.obsidian-replica/bases.json`.
- Bases run in the main process against the in-memory note index.
- The renderer receives `BaseResult` rows and cells through typed preload.
- Bases support table views with columns, filters, and single-column sort.

### Inline Editing From 6B.1

- Simple non-reserved property cells are editable inline.
- Saves call `updateNoteProperties`; there is no Bases-specific write path.
- Successful saves re-run the active Base.
- Rows can move or disappear based on existing filters and sorts.
- A disappearing row currently shows a status message.
- The following remain read-only:
  - title cells;
  - path cells;
  - tags cells;
  - mtime cells;
  - reserved property cells;
  - list values;
  - unknown/nested values;
  - rows with YAML errors.

## Manual QA Findings To Collect

Before implementing 6B.2, run one manual pass and collect rough edges:

- Any unclear edit affordance in dense Bases tables.
- Whether double-click plus small `Edit` button is discoverable enough.
- Whether Save/Cancel button placement feels cramped.
- Whether errors remain readable inside narrow columns.
- Whether `Enter`, `Escape`, and focus behavior feel predictable.
- Whether row moved/disappeared feedback is visible long enough.
- Whether missing cells make it clear what type will be saved.
- Whether Properties pane editing still feels consistent with Bases editing.
- Whether list cells are common enough to justify simple list editing now.
- Any console errors during edit/save/refresh.
- Any slow behavior in larger vaults or Bases with many rows.

Known QA notes from 6B.1 verification:

- Production build and E2E smoke passed.
- `npm run dev` failed in this environment with a Node ESM/CJS loader error;
  investigate separately before relying on dev-mode manual verification.
- Properties pane edit inputs need clearer accessible labels.
- Bases list/detail text can be ambiguous for automation because the base name
  appears in both places.
- Row-disappearing feedback worked in the tested flow.

## UX Polish

### Clearer Edit Affordance

- Keep read-only cells visually quiet.
- Make editable property cells more obviously editable on hover and focus.
- Prefer a compact icon/button with accessible label over noisy always-visible
  text if table density suffers.
- Tooltip copy:
  - editable: "Edit property";
  - reserved: "Edit in Properties pane";
  - list: "List editing is not available here";
  - unsupported: "Unsupported value";
  - YAML error: "Fix YAML before editing".

### Save And Cancel Behavior

- Save should be explicit and reliable:
  - `Enter` saves single-line editors;
  - Save button remains available for pointer users;
  - disabled state while saving.
- Cancel should be predictable:
  - `Escape` cancels;
  - Cancel button restores the previous display value;
  - clicking outside should either do nothing or cancel, but not silently save.
- Do not introduce auto-save-on-blur unless tested carefully.

### Status And Error Messages

- Keep successful save feedback short.
- Show row-disappeared messages near the table toolbar or active table, not
  inside a vanished row.
- Error messages should preserve the previous visible value and avoid absolute
  filesystem paths.
- Suggested message categories:
  - "Saved";
  - "Saved; row no longer matches this Base.";
  - "Could not save: <reason>";
  - "Fix YAML before editing properties.";
  - "This value is read-only in Bases."

### Keyboard Handling

- `Enter`: save for text/number editors.
- `Escape`: cancel.
- `Tab`: move focus normally unless a safe save-and-move behavior is explicitly
  designed.
- Focus should enter the active input when editing starts.
- After save:
  - if the row remains, focus should return to the edited cell or edit button;
  - if the row disappears, focus should move to the table or toolbar.
- After cancel, focus should return to the same cell or edit button.

### Row Moved Or Disappeared Message

- Existing filters/sorts remain authoritative.
- If the row disappears, show a visible status message.
- If the row moves due to sort, no special message is required unless users find
  it confusing in QA.
- Do not keep stale rows after a save.

### Focus Behavior

- Avoid trapping focus inside the table.
- Saving state should not leave focus on a removed DOM node.
- Error state should be reachable by screen readers.
- Buttons and inputs should have stable accessible names.

## Missing-Cell Type Selector

6B.1 treats missing property cells as text by default. 6B.2 may add a compact
type selector for missing cells only.

Supported save types:

- `text`;
- `number`;
- `boolean`;
- `null`.

Rules:

- Date-like strings remain text.
- Number saves require finite numbers.
- Boolean saves should use a checkbox or true/false segmented control.
- Null/empty saves should be explicit; do not infer null from an accidental
  blank text input.
- The draft must validate before calling `updateNoteProperties`.
- Existing typed cells should keep their current editor type by default.

Suggested UX:

- Missing cell edit opens a small editor with:
  - type selector;
  - value control for the selected type;
  - Save/Cancel.
- Existing empty/null cell may also offer a type selector if this is simple and
  tested.

## Optional Simple List Editing

List editing is optional in 6B.2 and should be included only if it stays small
and safe.

Recommended first slice:

- Support list of strings only.
- Existing list cells are editable only when every item is a text/date string.
- Missing cells should not default to list unless the user selects list.
- Save as `string[]` through `updateNoteProperties`.
- No nested objects.
- No mixed-type preservation in 6B.2 unless already covered by 6A.1 validators
  and tests.
- Use a simple newline-separated editor or compact item list.

Clear deferral criteria:

- If list editing complicates keyboard handling, validation, or layout, keep
  lists read-only and document list editing for a later milestone.
- Do not add drag-reorder, multi-cell paste, nested values, or schema inference.

## Tests Needed

### Pure Helper Tests

- Missing-cell editor defaults to text.
- Missing-cell type selector creates text updates.
- Missing-cell type selector creates number updates.
- Missing-cell type selector creates boolean updates.
- Missing-cell type selector creates null updates.
- Date-like text remains a string.
- Invalid number drafts reject before save.
- Existing typed cells keep their inferred editor type.
- Read-only reasons map to clear tooltip/status copy.

### Optional List Tests

If simple list editing is included:

- String list cell is editable.
- String list draft saves as `string[]`.
- Empty list saves safely if allowed.
- List with number/boolean/object/nested values remains read-only unless that
  support is explicitly designed.
- Invalid list drafts show errors before save.

### Component/Flow Tests

- Edit affordance is visible/focusable for editable cells.
- Read-only cells do not expose edit buttons.
- Save button disables while saving.
- `Enter` saves.
- `Escape` cancels.
- Cancel does not call `updateNoteProperties`.
- Failed save preserves previous display value and shows error.
- Successful save re-runs active Base.
- Row disappearance shows the status message.
- Focus returns to a stable place after save/cancel/disappearing row.

### Regression Tests

- Existing 6B.1 simple text/number/boolean/null editing still works.
- Reserved property cells stay read-only.
- Title/path/tags/mtime stay read-only.
- Unknown/nested values stay read-only.
- Properties pane editing still works.
- Bases create/edit/delete still works.
- No new IPC write channel exists.

## Risks And Mitigations

- **Polish turning into feature creep**: keep changes to inline editing UX,
  missing-cell type selection, and maybe string lists.
- **Accidental second write path**: call only `updateNoteProperties`.
- **Confusing type changes**: show the selected type clearly and validate before
  save.
- **Null ambiguity**: require explicit null/empty selection.
- **List editing complexity**: support string lists only or defer entirely.
- **Row movement/disappearance confusion**: rely on Base re-run and improve
  status messaging.
- **Keyboard regressions**: add targeted tests for `Enter`, `Escape`, focus,
  and disabled saving state.
- **Accessibility regressions**: improve accessible names for editors and base
  selection controls as part of polish.
- **Dev-mode blocker**: track the `npm run dev` loader failure separately so
  manual verification can use dev mode again.

## Recommended Implementation Order

1. **QA Pass First**
   - Run manual checks against 6B.1.
   - Record rough edges before changing code.
2. **Pure Helper Polish**
   - Add copy/tooltip helpers.
   - Add missing-cell type selector draft helpers.
   - Add optional string-list draft helpers only if still small.
3. **Tests**
   - Cover helper behavior before touching UI.
   - Add focused component/flow tests for save/cancel/error/focus.
4. **Inline Editor UX**
   - Improve edit affordance and accessible labels.
   - Improve Save/Cancel layout and loading state.
   - Improve row-disappeared/status messaging.
5. **Missing-Cell Type Selector**
   - Add type selector for missing cells.
   - Validate before save.
6. **Optional String List Editing**
   - Add only if the helper and UI remain small.
   - Otherwise explicitly defer.
7. **Docs And Gates**
   - Update milestone docs and manual verification checklist.
   - Run `npm run check`, `npm run build`, `npm run test:e2e`, and `npm run dev`
     once the dev-mode blocker is resolved.

## Deferred Items

- Formula columns.
- Relation columns.
- Rollup columns.
- Grouping.
- Bulk editing.
- Multi-cell paste.
- Schema manager.
- Nested object editing.
- Mixed-type list editing.
- Reserved-field inline editing.
- Advanced date picker.
- Board, calendar, and gallery views.
- Canvas, plugins, sync, publish, URI scheme, and marketplace.

## Acceptance Criteria

- Bases inline editing feels clearer and more predictable.
- Missing property cells can save text, number, boolean, or explicit null values
  safely.
- Optional string-list editing ships only if fully tested; otherwise list cells
  remain read-only.
- Existing 6B.1 read-only boundaries remain intact.
- Saves still use only `updateNoteProperties`.
- Failed saves preserve previous visible values and show clear errors.
- Row disappearance feedback is understandable.
- Keyboard and focus behavior are tested.
- Renderer still has no filesystem access or raw IPC.
- `npm run check`, `npm run build`, `npm run test:e2e`, and manual app
  verification pass.

## Milestone links

- Previous: [[MILESTONE-6B.1]]
- Next: [[MILESTONE-6B.2]]
- Implementation: [[MILESTONE-6B.2]]
