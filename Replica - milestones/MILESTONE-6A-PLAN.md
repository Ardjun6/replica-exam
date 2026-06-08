# Milestone 6A Plan - Properties and Real YAML Frontmatter

Milestone 6A adds a proper Properties system for notes, backed by a real YAML
frontmatter engine. It should improve parsing, indexing, and property display
without building full Bases yet. The work must preserve existing aliases/tags
behavior, keep note reads and writes behind the preload bridge, and keep parsing
and serialization helpers pure wherever practical.

## Constraints

- Do not rewrite the architecture.
- Do not widen renderer filesystem access.
- Keep note reads and writes behind the existing preload bridge.
- Keep IPC typed in `src/shared/ipc-contract.ts` and payloads validated in
  `src/main/ipc/validate.ts`.
- Keep parsing/indexing pure where possible.
- Keep persisted formats versioned where needed.
- Do not implement Bases, table/board views, Canvas, plugins, sync, publish, URI
  scheme, or marketplace.
- Keep the app shippable after every step.
- Never crash the renderer or indexer on malformed YAML.

## Current State

### Frontmatter Parsing

- `src/core/markdown/frontmatter.ts` detects a leading `---` block at the very
  top of the file and strips it from the body.
- The current parser is a small hand-rolled YAML subset:
  - top-level `key: value`;
  - strings, numbers, booleans, null;
  - inline lists like `[a, b]`;
  - simple block lists using `- item`.
- Deeper nesting, comments, quoted edge cases, multiline strings, and richer
  YAML syntax are not fully supported.
- An opening fence without a closing fence is treated as no frontmatter.
- Current parsing is forgiving but also lossy: it does not preserve comments,
  quoting style, or key order as a first-class concept.

### Aliases And Tags

- `src/core/index/note-parser.ts` calls `readFrontmatter(content)`.
- `frontmatter.tags` is normalized by `normalizeFrontmatterTags()`.
- `frontmatter.aliases` is normalized by `normalizeAliases()`.
- Inline tags are extracted from the Markdown body with `extractInlineTags()`.
- The final `NoteIndex.tags` is a de-duplicated merge of frontmatter tags and
  inline tags.
- Link suggestions and note resolution already use aliases from the index.

### Note Reads And Writes

- The renderer reads notes via `window.replica.readNote(path)`.
- The renderer writes full note content via `window.replica.writeNote(path,
  content)`.
- `VaultService.writeNote()` writes through `VaultFs`, suppresses self-write
  watcher echo, and reindexes the changed note.
- There is no property-specific write API yet.

### What Must Change

- Replace or wrap the hand-rolled frontmatter parser with a real YAML parser.
- Introduce a typed property value model in `shared/` or `core/`.
- Keep `NoteIndex.frontmatter` compatible while adding normalized property data.
- Preserve current tags and aliases indexing.
- Add safe helpers that update only the frontmatter block while preserving the
  Markdown body exactly.
- Add a Properties pane/section for the active note.
- Keep malformed frontmatter visible and non-destructive.

## Proposed UX

### Properties Pane Behavior

- Add a `Properties` tab to the existing right pane, behind the current core
  feature system if a feature toggle is added later.
- The pane follows the active workspace note, like backlinks and outline.
- It shows a compact property list:
  - property name;
  - normalized value;
  - value type;
  - reserved-field badges for `aliases`, `tags`, `cssclasses`, `created`,
    `updated`.
- Reserved fields should render in familiar forms:
  - `aliases`: list of strings;
  - `tags`: list of tag chips without `#`;
  - `cssclasses`: list of strings;
  - `created` / `updated`: text/date-like value, not a complex date picker.

### Empty Frontmatter State

- If a note has no frontmatter, show an empty state with an "Add property"
  affordance only if editing is included.
- Read-only first slice can show "No properties" without any editing controls.

### Malformed Frontmatter State

- If YAML parsing reports errors, show a clear non-blocking warning in the
  Properties pane.
- The note body/editor should still open.
- The indexer should keep body text, headings, links, and inline tags working.
- Property editing should be disabled for malformed frontmatter unless a later
  confirm flow is implemented.

### Add/Edit/Delete Flow

Recommended shippable slice:

1. Ship read-only Properties pane first.
2. Add editing only if the parser/serializer and tests are clean.

If editing is included:

- Add property:
  - choose a name;
  - choose or infer a simple type;
  - enter a simple value;
  - update only the YAML block.
- Edit property:
  - simple inline text/select controls;
  - no schema manager, no vault-wide type inference.
- Delete property:
  - confirm only for reserved fields or non-empty values if needed.
- Malformed YAML:
  - show warning;
  - do not rewrite unless an explicit "replace frontmatter" flow is later
    designed.

### Read-Only Fallback

- If editing pushes scope too far, Milestone 6A should still ship:
  - real YAML parsing;
  - typed property model;
  - index integration;
  - read-only Properties pane;
  - docs explicitly deferring property editing.

## Technical Design

### YAML Dependency Choice

Recommended dependency: `yaml`.

Reasons:

- It supports parsing into a document object with parse errors/warnings instead
  of throwing as the only control flow.
- It can preserve key order and gives better control over stringifying than the
  current hand parser.
- It is actively used, works in pure TypeScript/JavaScript logic, and does not
  require Electron or DOM APIs.

Implementation note:

- Add it as a normal dependency because parser/indexer code runs in the main
  process and may also be imported by tests/shared pure modules.
- Keep the YAML package isolated behind `src/core/markdown/frontmatter.ts` or a
  new `src/core/properties/frontmatter.ts` wrapper so changing parsers later is
  possible.

### Pure Parsing And Serialization Helpers

Likely new/changed files:

- `src/core/markdown/frontmatter.ts`
  - keep `extractFrontmatter()` API if possible;
  - replace subset parsing internals with YAML-backed parsing.
- `src/core/properties/property-model.ts`
  - property value types and normalization.
- `src/core/properties/frontmatter-update.ts`
  - pure helpers to create/replace the YAML block while preserving body.
- `src/core/properties/property-order.ts`
  - optional helper if order preservation needs to be explicit.

Recommended helper APIs:

```ts
interface ParsedFrontmatter {
  found: boolean;
  raw: string | null;
  body: string;
  data: Record<string, unknown>;
  properties: PropertyMap;
  order: string[];
  errors: FrontmatterError[];
}

function readFrontmatter(source: string): ParsedFrontmatter;
function serializeProperties(properties: PropertyMap, order: string[]): string;
function replaceFrontmatter(source: string, yaml: string): string;
function updateFrontmatterProperties(source: string, update: PropertyUpdate): UpdateResult;
```

Rules:

- No frontmatter: `replaceFrontmatter()` creates a new block at the top.
- Valid frontmatter: rewrite only the block.
- Malformed frontmatter: return a safe error unless caller explicitly chooses a
  destructive replacement mode.
- Preserve Markdown body bytes/text exactly after the closing fence, including
  trailing newlines where practical.

### Property Value Model

Recommended shared/core types:

```ts
type PropertyScalar = string | number | boolean | null;
type PropertyValue =
  | { type: 'text'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'date'; value: string }
  | { type: 'list'; value: PropertyValue[] }
  | { type: 'empty'; value: null }
  | { type: 'unknown'; value: unknown };

interface NoteProperties {
  values: Record<string, PropertyValue>;
  order: string[];
  errors: FrontmatterError[];
}
```

Date strategy:

- Keep dates as strings in v1 of Properties.
- Detect date-like strings for display only.
- Do not convert to JavaScript `Date` during normalization unless a safe
  representation is deliberately chosen.

Reserved fields:

- `aliases`: normalized to string list for indexing and display.
- `tags`: normalized to string list without `#` for indexing and display.
- `cssclasses`: string or string list, preserved for future appearance work.
- `created`: displayed as text/date-like string.
- `updated`: displayed as text/date-like string.

Unknown/custom properties:

- Preserve all unknown top-level keys.
- Preserve simple nested objects as `unknown` or read-only JSON-like display for
  Milestone 6A.
- Do not discard custom keys during serialization.

### Note Update Strategy

Preferred first implementation:

- Read-only Properties pane uses existing `readNote()` and `NoteIndex`.
- Editing, if included, should use a narrow main-owned API:
  - `updateNoteProperties(path, update): Promise<NoteIndex>`
  - main process reads the latest file, rewrites only frontmatter, writes note,
    and reindexes.

Why prefer a new API for editing:

- It avoids the renderer reconstructing full note content from stale state.
- It lets main validate path and property payloads before writing.
- It keeps all note writes behind preload, still without exposing raw
  filesystem access.

Acceptable smaller alternative:

- Use existing `readNote()` / `writeNote()` from the renderer with pure
  `updateFrontmatterProperties()` if the implementation remains careful and
  tested.
- Still no raw filesystem access is exposed.

Malformed YAML:

- Do not auto-rewrite.
- Return a typed error or warning state.
- Keep the editor usable.

### Index Changes

Likely changed files:

- `src/shared/domain.ts`
  - add `properties?: NoteProperties` or equivalent to `NoteIndex`.
- `src/core/index/note-parser.ts`
  - include normalized properties;
  - continue setting `frontmatter`, `aliases`, and `tags`.
- `src/core/index/vault-index.ts`
  - store properties with each note.
- `src/core/search/search.ts`
  - optional property query support.
- `src/main/indexer/indexer.ts`
  - no architecture change; it consumes the enriched `NoteIndex`.

Compatibility requirements:

- Existing tag pane counts must not regress.
- Existing `tag:` search must still work.
- Existing alias resolution and quick switcher alias matching must still work.
- Body text search must remain based on Markdown body without frontmatter.

### Renderer Components Affected

Likely new files:

- `src/renderer/components/PropertiesPane.tsx`
- `src/renderer/components/properties/PropertyRow.tsx`
- `src/renderer/components/properties/PropertyValueView.tsx`
- Optional editing controls:
  - `PropertyEditor.tsx`
  - `PropertyNameInput.tsx`
  - `PropertyValueInput.tsx`

Likely changed files:

- `src/renderer/components/RightPane.tsx`
- `src/renderer/app/store.ts`
- `src/renderer/app/feature-flags.ts` if properties gets a feature toggle.
- `src/renderer/App.tsx` for command palette entries if added.
- `src/renderer/styles/app.css`
- `src/renderer/components/settings/CoreFeaturesSettings.tsx` only if adding a
  core feature toggle for Properties.

### IPC And Preload Changes

Read-only first slice:

- No new IPC is required if `readNote()` returns a `NoteIndex` with properties.

Editing slice, if included:

- Add typed channel and API:
  - `note:updateProperties`
  - `updateNoteProperties(path, update): Promise<NoteIndex>`
- Validate:
  - path with existing relative-path validator;
  - property names;
  - value types;
  - reserved field shapes;
  - maximum property count and value lengths.

### Validation Rules

Property names:

- Non-empty string.
- Trimmed.
- Max length, for example 120 chars.
- Reject NUL and line breaks.
- Reject prototype-pollution keys: `__proto__`, `constructor`, `prototype`.
- Prefer YAML-safe plain keys; quote on serialization if needed.

Property values:

- Strings: max length, for example 10,000 chars.
- Numbers: finite only.
- Booleans: boolean only.
- Lists: bounded length, for example 500 items.
- Nested objects: read-only in Milestone 6A unless explicitly supported.
- Dates: stored as strings; no complex date picker.

Property update payload:

- Reject unknown operation names.
- Reject unknown top-level keys.
- Bound payload size.
- Reserved fields:
  - `aliases`, `tags`, `cssclasses` must be strings or string arrays;
  - normalize tags without `#`;
  - preserve aliases as strings.

## Acceptance Criteria

### Real YAML Frontmatter

- Valid YAML frontmatter parses using the real YAML engine.
- Malformed YAML records an error and never crashes parsing, indexing, or the
  renderer.
- Notes without frontmatter still parse and index normally.
- Existing aliases and tags behavior is preserved.
- Strings, numbers, booleans, arrays, null/empty values, and date-like strings
  are represented in the property model.

### Properties Model

- Every top-level YAML key appears in the property map unless malformed YAML
  prevents safe parsing.
- Unknown/custom properties are preserved.
- Property order is preserved where practical.
- Reserved fields are normalized for display and indexing.
- Nested/complex values are displayed read-only or marked unsupported, not
  discarded.

### Properties Pane

- A Properties pane/section appears for the active note.
- Empty frontmatter shows a clean empty state.
- Malformed frontmatter shows a warning state.
- Switching active notes refreshes the displayed properties.
- Read-only first slice is acceptable if editing is explicitly deferred.

### Property Editing, If Included

- Adding a property creates frontmatter when missing.
- Editing/deleting a property rewrites only the YAML frontmatter block.
- Markdown body content is preserved exactly.
- Malformed frontmatter is not destructively rewritten without confirmation.
- The note is reindexed after property changes.

### Indexing

- `NoteIndex` includes normalized properties.
- Tag pane, alias resolution, quick switcher alias matching, backlinks, outline,
  graph, and body search continue working.
- External edits with changed frontmatter update the index.

### Search Integration, If Included

- `prop:status` matches notes with a `status` property.
- `status:done` matches notes whose normalized property value equals `done`.
- Invalid/partial property queries never crash.
- Advanced property search can be deferred if it grows.

## Tests Needed

- Valid YAML frontmatter:
  - scalars;
  - arrays;
  - quoted strings;
  - comments;
  - multiline strings if supported by chosen parser.
- Malformed YAML:
  - parser returns errors;
  - note parser still returns body/index data where safe;
  - indexer does not crash.
- No frontmatter:
  - body unchanged;
  - empty properties.
- Body preservation:
  - replacing frontmatter preserves Markdown body exactly;
  - trailing newline cases;
  - CRLF/LF cases if practical.
- Aliases/tags compatibility:
  - string and array aliases;
  - string and array tags;
  - tags with and without `#`;
  - inline tags still merge with frontmatter tags.
- Property values:
  - arrays, numbers, booleans, strings, null, date-like strings.
- Property editing if included:
  - add property to no-frontmatter note;
  - edit existing property;
  - delete property;
  - reject unsafe names and values;
  - malformed frontmatter refuses destructive edit.
- Index updates:
  - reindex after property change;
  - external frontmatter edits update properties.
- Search if included:
  - property existence;
  - property equality;
  - invalid property queries.
- IPC validation if editing API is added:
  - valid update payloads;
  - rejected prototype-pollution keys;
  - rejected oversized values.

## Risks

- **Corrupting Markdown files**: property editing can accidentally rewrite the
  body. Mitigate with pure body-preservation tests and main-owned update logic.
- **YAML parser edge cases**: anchors, aliases, multiline strings, nested maps,
  and comments can surprise UI code. Display complex values read-only first.
- **Date handling**: JavaScript `Date` can alter time zones and formatting.
  Keep dates as strings in 6A.
- **Property order loss**: plain objects do not represent all YAML formatting.
  Track top-level order separately where practical.
- **Tags/aliases regression**: reserved fields must keep current normalization
  semantics.
- **Performance on large vaults**: parsing real YAML is more expensive than the
  subset parser. Keep parsing per-note and incremental as today.
- **UI overreach**: editing, type pickers, and schema management can become a
  Bases-like project. Ship read-only first if needed.

## Recommended Implementation Order

1. **YAML dependency and pure parser tests first**
   - Add `yaml`.
   - Wrap it behind current frontmatter helper APIs.
   - Add tests for valid, malformed, and no-frontmatter notes.
2. **Property model**
   - Add typed property normalization.
   - Preserve reserved fields, custom properties, and top-level order.
3. **Index integration**
   - Extend `NoteIndex`.
   - Preserve tags/aliases behavior.
   - Add index tests.
4. **Read-only Properties pane**
   - Add right-pane tab.
   - Show values, empty state, and malformed YAML warning.
5. **Safe editing only if clean**
   - Prefer main-owned `updateNoteProperties()` API.
   - Rewrite only frontmatter and preserve body.
   - Add validation and tests.
6. **Optional search integration last**
   - Add `prop:name` and simple `name:value` equality only if parser/model/UI
     work is already stable.
7. **Docs and gates**
   - Create `MILESTONE-6A.md`.
   - Update README/ROADMAP.
   - Run `npm run check`, `npm run build`, `npm run test:e2e`, and `npm run dev`.

## Deferred Items

- Full Bases.
- Table and board views.
- Formulas.
- Property type inference across the vault.
- Complex date picker.
- Multi-note bulk editing.
- Schema manager.
- Nested object editing.
- Property templates.
- Property-aware graph styling.
- Canvas, plugins, sync, publish, URI scheme, marketplace.

## Milestone links

- Previous: [[MILESTONE-5]]
- Next: [[MILESTONE-6A]]
- Implementation: [[MILESTONE-6A]]
