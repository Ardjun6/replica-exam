# Milestone 6A.1 Plan - Safe Property Editing

Milestone 6A.1 adds safe add, edit, and delete workflows for properties on the
active note. It builds on 6A's YAML-backed Properties model and 6B's read-only
Bases views, but it does not add Bases inline editing or broaden renderer file
access.

The central promise of this milestone is conservative: update only the YAML
frontmatter owned by the active note, preserve Markdown body content exactly,
and refuse edits when the existing YAML cannot be parsed safely.

## Constraints

- Do not rewrite the architecture.
- Do not widen renderer filesystem access.
- Renderer must not write files directly.
- Prefer a main-owned `updateNoteProperties(path, update)` API.
- Keep IPC typed in `src/shared/ipc-contract.ts`.
- Keep IPC payloads validated in `src/main/ipc/validate.ts`.
- Preserve Markdown body exactly.
- Refuse destructive edits on malformed YAML.
- Keep aliases/tags compatibility.
- Do not implement Bases inline editing.
- Do not implement formulas, schema manager, bulk editing, Canvas, plugins,
  sync, publish, URI scheme, or marketplace.
- Keep the app shippable after each step.

## Current State

### YAML And Properties From 6A

- `src/core/markdown/frontmatter.ts` wraps the `yaml` dependency and exposes
  `readFrontmatter()`.
- Valid leading YAML frontmatter is parsed into plain data.
- Malformed YAML is converted into structured `FrontmatterError` values instead
  of crashing the parser, indexer, or renderer.
- `src/shared/properties.ts` defines:
  - `PropertyValue`;
  - `FrontmatterError`;
  - `NoteProperties`;
  - reserved property names.
- `NoteIndex.properties` contains normalized values, source order, and YAML
  errors.

### Read-Only UI And Bases

- The right pane has a read-only Properties tab for the active note.
- The pane displays normalized property values and reserved-field badges.
- Notes with no frontmatter show an empty property state.
- Malformed YAML shows a warning state.
- Milestone 6B adds read-only Bases-style table views over indexed notes and
  normalized properties.
- Bases table cells are read-only; inline editing remains deferred.

### Existing Note Read/Write Flow

- The renderer reads note content and index data via `readNote(path)`.
- The renderer writes full note content via `writeNote(path, content)`.
- `VaultService.writeNote()` writes through `VaultFs`, suppresses self-write
  watcher echoes, and reindexes the changed note.
- There is no property-specific write API yet.

### Existing IPC/Preload Pattern

- IPC channels are declared in `src/shared/ipc-contract.ts`.
- Renderer-facing methods are exposed through `ReplicaApi` in preload.
- Main-process handlers live in `src/main/ipc/register-ipc.ts`.
- Renderer payloads are validated in `src/main/ipc/validate.ts`.
- Handlers return `Result` values and preload unwraps them into promises.

## UX Design

### Add Property

- The active note's Properties pane gains an `Add property` action.
- The flow asks for:
  - property name;
  - simple value;
  - optional value kind if inference is ambiguous.
- If the note has no frontmatter, adding a property creates a new frontmatter
  block at the top of the file.
- The note body below the new block must remain exactly as it was.
- Duplicate property names should be rejected or route into the edit flow.

### Edit Simple Property

- Simple editable values:
  - text/date-like strings;
  - finite numbers;
  - booleans;
  - null/empty;
  - lists of simple scalar values.
- Editing should be explicit: enter edit mode for one row, save or cancel.
- The UI should show validation errors near the edited field and keep the
  previous value until the save succeeds.
- The Properties pane refreshes from the returned `NoteIndex` after a save.

### Delete Property

- Deleting a property removes its top-level YAML key.
- A confirmation is optional for ordinary simple fields, but should be used for
  reserved fields or non-empty list values if the final UX feels risky.
- Deleting the final property may remove the frontmatter block or leave an empty
  block; prefer removing the block only if tests prove body preservation across
  newline edge cases.

### Read-Only Complex Values

- Unknown or nested object values remain read-only in 6A.1.
- Lists containing nested objects should either:
  - render read-only as a whole; or
  - allow only simple scalar items when every item is safe.
- Unsupported values should not disappear or be rewritten by unrelated edits.

### Reserved Fields

- `aliases`
  - Display as a list of strings.
  - Editing can allow a simple string-list editor.
  - Saved values must preserve alias indexing behavior.
- `tags`
  - Display as tag names without leading `#`.
  - Editing can allow a simple string-list editor.
  - Save tags without `#` or normalize before serialization, while preserving
    existing tag indexing behavior.
- `cssclasses`
  - Display as string or string list.
  - Editing may be read-only in the first 6A.1 slice unless the list editor is
    already robust.
- `created` and `updated`
  - Display as text/date-like strings.
  - Do not add an advanced date picker in 6A.1.
  - Do not auto-update `updated` unless explicitly designed and documented.

### Malformed YAML Warning State

- If `NoteIndex.properties.errors` is non-empty, editing controls are disabled.
- Show a clear message explaining that the YAML must be fixed in the editor
  before properties can be edited safely.
- Do not offer automatic repair in 6A.1.

### Error Messages

- Errors should be direct and actionable:
  - invalid property name;
  - duplicate property name;
  - unsupported value type;
  - malformed YAML cannot be edited safely;
  - note changed or write failed, try again.
- Errors should not expose absolute filesystem paths.

## Technical Design

### Shared Property Update Types

Likely additions in `src/shared/properties.ts`:

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

Guidance:

- Keep the payload small and explicit.
- Start with one operation per UI save if that simplifies validation.
- Do not accept nested objects from the renderer in 6A.1.
- Keep unknown existing YAML values intact when editing unrelated keys.

### Main-Owned Write API

Add to `VaultService`:

```ts
updateNoteProperties(path: string, update: NotePropertiesUpdate): Promise<NoteIndex>
```

Handler flow:

1. Validate path and update payload at IPC boundary.
2. Read the latest note content in the main process.
3. Call pure `updateFrontmatterProperties(content, update)`.
4. If the existing frontmatter is malformed, throw a clean validation/write
   error before touching disk.
5. Write the updated note through `VaultFs`.
6. Reindex the changed note.
7. Return the fresh `NoteIndex`.

The renderer should not reconstruct or write full Markdown content for property
editing.

### Pure Frontmatter Update Helper

Suggested file:

- `src/core/properties/frontmatter-update.ts`

Suggested API:

```ts
export interface FrontmatterUpdateResult {
  content: string;
  changed: boolean;
}

export function updateFrontmatterProperties(
  source: string,
  update: NotePropertiesUpdate,
): FrontmatterUpdateResult;
```

Rules:

- Parse with the same YAML wrapper used by `readFrontmatter()`.
- No frontmatter: create a new leading `---` block.
- Valid frontmatter: replace only the YAML block.
- Malformed frontmatter: return or throw a typed safe error; do not rewrite.
- Preserve everything after the closing frontmatter fence exactly, including
  whitespace, Markdown body text, and trailing newlines.
- Preserve unrelated top-level YAML properties.
- Preserve top-level order where practical:
  - existing keys keep their relative order;
  - newly added keys append after existing keys;
  - deleted keys are removed from order.

### YAML Serialization Strategy

- Continue isolating the `yaml` package behind core helpers.
- Serialize only the frontmatter document, not the whole note.
- Prefer stable, readable YAML:
  - plain scalars where safe;
  - block lists for arrays;
  - `null` for empty values;
  - quote strings only when required by YAML safety.
- Avoid automatic date conversion. Date-like strings remain strings.
- Do not preserve comments or original scalar quoting in 6A.1 unless it comes
  for free from the YAML document API. Document this limitation.

### Body Preservation

- Body preservation is the highest-risk contract.
- Tests should assert exact full-string output for:
  - note without frontmatter;
  - note with frontmatter and LF endings;
  - note with frontmatter and CRLF endings if practical;
  - body beginning immediately after the closing fence;
  - body with trailing newlines.
- The update helper should avoid trimming or normalizing the body slice.

### Malformed YAML Refusal

- If `readFrontmatter()` reports errors for a found frontmatter block, property
  updates must fail before writing.
- The error should tell the user to fix the YAML manually in the editor first.
- Notes without a closing frontmatter fence should follow the existing parser's
  semantics; if treated as no frontmatter today, preserve that behavior unless
  tests require a stricter warning.

### Aliases And Tags Compatibility

- `aliases` and `tags` remain ordinary YAML keys but are reserved by the app.
- After write and reindex:
  - aliases still feed quick switcher/link resolution;
  - frontmatter tags still merge with inline tags;
  - tag names continue to normalize without leading `#`.
- Tests should cover string and list forms where current 6A behavior supports
  them.

### Validation Rules

Property names:

- Must be a non-empty string after trimming.
- Maximum length: reuse the property-name bound already used for Bases if
  suitable, or define a property editing constant around 120 chars.
- Reject NUL bytes and line breaks.
- Reject prototype-pollution keys:
  - `__proto__`
  - `constructor`
  - `prototype`
- Reject names that cannot be represented safely as top-level YAML keys.

Property values:

- Strings: bounded length.
- Date-like values: stored as strings, displayed as dates by normalization.
- Numbers: finite only; reject `NaN`, `Infinity`, and `-Infinity`.
- Booleans: boolean only.
- Lists: bounded length; every item must be an editable scalar or a supported
  nested list if nested lists are deliberately allowed.
- Null/empty: serialize as `null`.
- Unknown/nested objects: read-only; reject in renderer-originated update
  payloads.

Payload:

- Reject non-object payloads.
- Reject unknown top-level keys.
- Reject unknown operation kinds.
- Reject overlarge operation arrays.
- Reject prototype-pollution keys recursively.

## IPC And Preload Design

### Channel And Contract

Add to `src/shared/ipc-contract.ts`:

```ts
noteUpdateProperties: 'note:updateProperties'
```

Add to `ReplicaApi`:

```ts
updateNoteProperties(path: string, update: NotePropertiesUpdate): Promise<NoteIndex>;
```

Import only plain shared/core types.

### Validation

Add to `src/main/ipc/validate.ts`:

```ts
asNotePropertiesUpdate(input: unknown): NotePropertiesUpdate
```

Use existing path validation for the note path. The update validator should
strictly reject unsafe renderer writes rather than normalizing surprising
payloads silently.

### Main Handler

In `src/main/ipc/register-ipc.ts`:

```ts
handle(IPC.noteUpdateProperties, (_e, path, update) =>
  vault.updateNoteProperties(
    asRelativePath(path, 'path'),
    asNotePropertiesUpdate(update),
  ),
);
```

The handler should preserve sender checks and `Result` wrapping exactly like
existing handlers.

### Preload

In `src/preload/preload.ts`, expose exactly:

```ts
updateNoteProperties: (path, update) =>
  invoke(IPC.noteUpdateProperties, path, update)
```

Do not expose raw `ipcRenderer`, filesystem access, or generalized write
channels.

### Renderer API Wrapper

The existing `api()` helper can continue returning `ReplicaApi`. No renderer
component should import Electron, Node filesystem APIs, or main-process modules.

## Tests Needed

### Pure Frontmatter Update Tests

- Add property to a note with no frontmatter.
- Add property to existing frontmatter.
- Edit an existing property.
- Delete an existing property.
- Preserve Markdown body exactly.
- Preserve unrelated YAML properties.
- Preserve key order where practical.
- Preserve trailing newlines.
- Preserve CRLF/LF behavior where practical.
- Create frontmatter without inserting body mutations.
- Refuse malformed YAML edits.

### Value Serialization Tests

- Write list values.
- Write boolean values.
- Write number values.
- Write null/empty values.
- Write date-like string values without `Date` coercion.
- Reject invalid numbers.
- Reject unsupported nested object values.
- Reject overlarge strings/lists.

### Aliases And Tags Tests

- Preserve aliases behavior after editing an unrelated property.
- Edit `aliases` and confirm the reindexed note exposes aliases correctly.
- Preserve frontmatter tags plus inline tag merging after unrelated edits.
- Edit `tags` and confirm tag normalization remains compatible.
- Confirm `cssclasses`, `created`, and `updated` do not break normalization.

### Main Service Tests

- `updateNoteProperties()` writes through main-owned file access.
- Reindex after write returns a fresh `NoteIndex`.
- Returned `NoteIndex.properties` reflects the edit.
- Malformed YAML rejects before write.
- Failed validation does not modify the file.
- Consecutive updates read the latest file content.

### IPC Validation Tests

- Valid property update payload accepted.
- Invalid property names rejected.
- Invalid values rejected.
- Unknown operation kind rejected.
- Unknown top-level keys rejected.
- Prototype-pollution payload rejected.
- Overlarge payload rejected.

### Renderer Tests

- Properties pane refreshes after successful edit.
- Add/edit/delete controls are hidden or disabled for malformed YAML.
- Unknown/complex values render read-only.
- Save errors are shown without mutating visible state.
- Reserved fields show the intended editor or read-only behavior.

## Risks And Mitigations

- **Corrupting Markdown body**: make body-preservation tests the first gate and
  centralize rewriting in a pure helper.
- **YAML formatting/order changes**: accept limited frontmatter formatting
  changes, but preserve key order and unrelated values. Document comment/quote
  preservation limits.
- **Aliases/tags regressions**: add explicit reindex tests for aliases, tags,
  and inline tag merging.
- **Unknown nested values**: keep nested objects read-only and reject renderer
  update payloads containing objects.
- **Date coercion**: treat date-like values as strings; never round-trip through
  JavaScript `Date` in 6A.1.
- **Concurrent writes**: main process should read latest file content at save
  time and reindex after write. If conflicts surface, add a later compare-token
  flow.
- **UI overreach**: start with simple row-level add/edit/delete. Defer schema
  manager, bulk editing, advanced type pickers, and Bases inline cells.

## Recommended Implementation Order

1. **Pure Frontmatter Update Helper**
   - Add `frontmatter-update.ts`.
   - Define update payload types.
   - Implement parse, update, serialize, and exact body preservation.
2. **Body Preservation Tests**
   - Cover no-frontmatter, existing frontmatter, trailing newline, malformed
     YAML, and delete cases before wiring IPC.
3. **Main-Owned Write API**
   - Add `VaultService.updateNoteProperties()`.
   - Read latest file, apply helper, write through `VaultFs`, and reindex.
4. **IPC And Preload Validation**
   - Add channel and `ReplicaApi` method.
   - Add strict `asNotePropertiesUpdate()`.
   - Register handler and preload method.
5. **Properties Pane Editing UI**
   - Add row-level add/edit/delete controls.
   - Keep unknown/complex values read-only.
   - Disable editing for malformed YAML.
6. **Docs And Gates**
   - Update milestone docs and README/ROADMAP if needed.
   - Run `npm run check`, `npm run build`, `npm run test:e2e`, and `npm run dev`.

## Deferred Items

- Bases inline editing.
- Bulk editing.
- Schema manager.
- Nested object editing.
- Advanced date picker.
- Property templates.
- Formulas.
- Canvas, plugins, sync, publish, URI scheme, and marketplace.

## Manual Verification Checklist

After automated gates pass, run this end-to-end smoke pass in the app:

1. Open a note with valid frontmatter.
2. Edit a normal non-reserved property and confirm the Properties pane refreshes.
3. Add a new normal property to the same note.
4. Delete a property and confirm the Markdown body is still intact.
5. Add a property to a note with no frontmatter and confirm a frontmatter block
   is created.
6. Open a note with broken YAML and confirm property editing is disabled with a
   clear warning.
7. Confirm aliases still work in the quick switcher after property edits.
8. Confirm tags still work in the Tags pane and `tag:` search after property
   edits.
9. Open Bases and confirm table cells are still read-only.
10. Restart the app and confirm property changes persist.

## Acceptance Criteria

- Active-note properties can be added, edited, and deleted through the
  Properties pane.
- Renderer does not write files directly.
- Property writes go through typed IPC/preload and main-process validation.
- Markdown body content is preserved exactly.
- Malformed YAML refuses property edits and shows a clear warning.
- Existing aliases and tags behavior is preserved.
- Unknown/nested values are not destructively rewritten.
- Bases table views remain read-only.
- `npm run check`, `npm run build`, `npm run test:e2e`, and `npm run dev` pass.

## Milestone links

- Previous: [[MILESTONE-6A]]
- Next: [[MILESTONE-6A.1]]
- Implementation: [[MILESTONE-6A.1]]
