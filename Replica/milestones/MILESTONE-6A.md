# Milestone 6A - Properties and Real YAML Frontmatter

Milestone 6A replaces the hand-rolled frontmatter subset with a real YAML parser
and adds normalized note properties to the index plus a read-only Properties
pane. It deliberately does **not** build Bases, property editing, formulas,
table/board views, or a schema manager.

## Delivered scope

### Real YAML frontmatter

- Added the `yaml` dependency.
- `readFrontmatter()` still detects a leading `---` block and preserves the
  existing no-frontmatter/body-extraction behavior.
- Valid YAML frontmatter now supports YAML comments, quoted strings, block lists,
  inline lists, numbers, booleans, null, and multiline strings.
- Date-like YAML scalars remain strings; the Properties model marks them as
  display-only dates.
- Malformed YAML returns structured errors and an empty property map instead of
  throwing through the parser, indexer, or renderer.

### Properties model

- Added normalized property values:
  - `text`
  - `number`
  - `boolean`
  - `date`
  - `list`
  - `empty`
  - `unknown`
- Top-level property order is preserved using `Object.keys()` from the parsed
  YAML mapping.
- Unknown/custom properties are preserved.
- Complex/nested values are retained as read-only `unknown` values.
- Reserved fields are recognized in the UI:
  - `aliases`
  - `tags`
  - `cssclasses`
  - `created`
  - `updated`

### Indexing behavior

- `NoteIndex` now includes `properties`.
- Existing `frontmatter`, `aliases`, `tags`, headings, links, body text, and
  modified time remain in place.
- Frontmatter `aliases` and `tags` continue to normalize through the same
  helpers as before.
- Inline tags still merge with frontmatter tags.
- Body search still uses Markdown body text with frontmatter stripped.

### Read-only Properties pane

- Added a `Properties` tab to the right pane.
- The pane follows the active workspace note.
- It shows property name, normalized value, value type, and a reserved-field
  badge where relevant.
- Notes with no frontmatter show a clean empty state.
- Malformed YAML shows a warning state and keeps the rest of the app usable.

## Changed files

```text
package.json
package-lock.json

src/shared/properties.ts                    (new property data contract)
src/shared/domain.ts                        (NoteIndex.properties)
src/core/properties/property-model.ts       (new pure property normalization)
src/core/markdown/frontmatter.ts            (YAML-backed parser wrapper)
src/core/index/note-parser.ts               (properties in NoteIndex)

src/renderer/app/store.ts                   (right-pane union)
src/renderer/app/feature-flags.ts           (Properties tab)
src/renderer/components/RightPane.tsx       (Properties pane route)
src/renderer/components/PropertiesPane.tsx  (new read-only UI)
src/renderer/styles/app.css                 (Properties pane styles)

tests/frontmatter.test.ts                   (YAML behavior + malformed cases)
tests/properties.test.ts                    (new property model tests)
tests/tags.test.ts                          (aliases/tags compatibility)
tests/indexer.test.ts                       (property reindex behavior)
```

## YAML dependency

- Dependency: `yaml`.
- It is isolated behind `src/core/markdown/frontmatter.ts`.
- Parser errors and warnings are converted into plain `FrontmatterError` values
  so callers do not need to catch parser exceptions.

## Deferred items

- Property editing.
- `updateNoteProperties(path, update)` IPC.
- Frontmatter block rewriting.
- Property search operators (`prop:name`, `name:value`).
- Full Bases.
- Table/board views.
- Formulas.
- Property type inference across the vault.
- Complex date picker.
- Multi-note bulk editing.
- Schema manager.
- Nested object editing.
- Canvas, plugins, sync, publish, URI scheme, marketplace.

## Quality gates

| Gate | Status | Command |
| ---- | :----: | ------- |
| Typecheck, lint, format, unit tests | Passed | `npm run check` |
| Build | Passed | `npm run build` |
| E2E smoke | Passed | `npm run test:e2e` |
| Dev boot / renderer console | Passed | `npm run dev` |

## Manual checks

1. Open a note with valid YAML frontmatter containing strings, numbers,
   booleans, arrays, null, and date-like strings. Confirm the Properties pane
   shows each value with the expected type.
2. Open a note without frontmatter. Confirm the Properties pane shows the empty
   state and the editor/preview still work.
3. Open a note with malformed YAML frontmatter. Confirm the Properties pane
   shows a warning and the app does not crash.
4. Confirm frontmatter aliases still appear in the quick switcher.
5. Confirm frontmatter tags still appear in Tags and `tag:` search.
6. Confirm body search does not match frontmatter-only text.
7. Keep DevTools open and confirm there are no red renderer runtime errors.

## Milestone links

- Previous: [[MILESTONE-6A-PLAN]]
- Next: [[MILESTONE-6A.1-PLAN]]
- Plan: [[MILESTONE-6A-PLAN]]
