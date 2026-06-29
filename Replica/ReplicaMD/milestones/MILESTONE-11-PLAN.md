# Milestone 11 Plan: Safe Note Export To Markdown, HTML, Word, And PDF

## Goal

Add safe local export for the current active Markdown note in Replica:

- Markdown (`.md`)
- HTML (`.html`)
- Word (`.docx`)
- PDF (`.pdf`)

The user should be able to export the active Markdown note without regressing Live Preview, Source Mode, Reading Mode, Canvas, themes, tags, Graph, or the local-first architecture.

## Hard Constraints

- Do not expose raw IPC.
- Do not give the renderer direct filesystem access.
- Do not add arbitrary code execution.
- Do not add plugins, marketplace, sync, publish, URI/deep-link behavior, scripting, macros, arbitrary CSS snippets, downloaded themes, media/embed systems, or database/spreadsheet behavior.
- Do not copy Obsidian private code, assets, exact CSS, branding, protocols, or proprietary behavior.
- Do not claim Obsidian compatibility.
- Do not export Canvas files in this milestone.
- Do not export an entire vault yet; active-note export only.
- Keep the app shippable after each step.

## 1. Current State Review

### Markdown Note Reading And Writing

- `src/main/vault/vault-service.ts` owns vault orchestration.
- `VaultService.readNote(path)` reads a Markdown note through `VaultFs`, ensures `.md`, and reindexes the note.
- `VaultService.writeNote(path, content)` writes Markdown through the safe main-process vault filesystem path and reindexes.
- `VaultService.updateNoteProperties(path, update)` remains the only property-edit write path and preserves the Markdown body.
- `src/core/path/vault-path.ts` already has Markdown/path helpers such as `normalizeVaultPath`, `ensureMarkdownExt`, and `isMarkdownPath`.

### Live Preview Rendering Pipeline

- `src/renderer/components/LivePreviewPane.tsx` reads/writes notes through typed preload API only.
- `src/renderer/editor/livePreview/*` builds CodeMirror decorations for the live editor surface.
- Live Preview must not be used as the export write path; export should read the latest note source in the main process.

### PreviewPane / renderMarkdown

- `src/renderer/components/PreviewPane.tsx` and `FolderHomePane.tsx` render Markdown through `src/renderer/editor/preview.ts`.
- `renderMarkdown(body)` uses `marked` plus DOMPurify and handles project-specific wikilinks, embeds as placeholders, callouts, task lists, tables, and footnotes.
- This code is currently renderer-oriented because DOMPurify expects a DOM. Milestone 11 should either:
  - extract a pure/shared renderer that can run safely in main with a configured DOM implementation, or
  - create a main-safe export renderer that uses the same `marked` options and sanitization policy.

### IPC / Preload Contracts

- `src/shared/ipc-contract.ts` is the typed IPC single source of truth.
- `src/preload/preload.ts` exposes only the `ReplicaApi` methods via `contextBridge`.
- `src/main/ipc/register-ipc.ts` validates sender, validates payloads, catches errors, and returns `Result<T>`.
- New export IPC must follow this same typed pattern.

### Main-Process Vault/File Services

- `VaultFs` is the main-process filesystem abstraction for vault-relative paths.
- Save dialog patterns exist in `register-ipc.ts` for vault open/create via Electron `dialog`.
- Export should use `dialog.showSaveDialog` in main, not the renderer.

### Settings And Theme CSS

- `src/shared/settings.ts` defines theme presets and settings schema.
- App themes are renderer UI concerns.
- Export styling should be separate, stable, local, and print-friendly. Do not reuse live app theme variables as the primary export stylesheet in this first slice.

### Test Structure

- Unit tests live under `tests/*.test.ts`.
- E2E tests live under `tests/e2e/*.spec.ts`.
- Existing boundary tests check renderer files for forbidden `ipcRenderer`/filesystem usage.
- Export should add both pure-helper tests and main-service tests with mocked save dialog / PDF print behavior where needed.

## 2. Export UX

Add clear export entry points:

- Note toolbar action in `MarkdownNotePane`.
- Command palette commands in `App.tsx`.
- Optional app menu item only if a stable menu pattern exists or is introduced later; defer otherwise.

Commands:

- Export note as Markdown
- Export note as HTML
- Export note as Word
- Export note as PDF

UX requirements:

- Active Markdown note only.
- Disabled when no Markdown note is active.
- Disabled for Canvas files and unknown document kinds.
- User chooses output path through a main-process save dialog.
- Cancellation returns a quiet cancelled result, not an error toast.
- Success message confirms the chosen format exported.
- Failure message is clear: unsupported note, invalid path, save failed, render failed, PDF generation failed, etc.
- Do not silently overwrite; rely on OS save dialog confirmation behavior.

Suggested UI shape:

- Add an Export button/menu in the note toolbar using a compact dropdown or menu.
- Keep it off Canvas toolbar for this milestone.
- Command palette commands should share the same renderer action helper as the toolbar.

## 3. Export Architecture

Add shared types:

- `src/shared/export.ts`

Recommended types:

```ts
export type NoteExportFormat = 'markdown' | 'html' | 'docx' | 'pdf';

export interface NoteExportRequest {
  notePath: string;
  format: NoteExportFormat;
}

export interface NoteExportResult {
  status: 'exported' | 'cancelled';
  path?: string;
  format: NoteExportFormat;
}
```

Add IPC contract:

- `IPC.noteExport = 'note:export'`
- `ReplicaApi.exportNote(request: NoteExportRequest): Promise<NoteExportResult>`

Prefer one validated method:

- `exportNote({ notePath, format })`

Add main-process service:

- `src/main/export/export-service.ts`

Responsibilities:

- Validate export format.
- Validate note path is vault-relative and Markdown only.
- Reject traversal and absolute paths.
- Read note source through existing `VaultService` / `VaultFs` patterns.
- Ask user for output path through `dialog.showSaveDialog`.
- Enforce the extension for the selected format.
- Write output in main process.
- Return `NoteExportResult`.
- Keep renderer filesystem-free.

Integration options:

- Add `VaultService.exportNote(request, dialogHost)` if the service needs vault state directly.
- Prefer a dedicated `ExportService` constructed with the current `VaultFs` or a safe `readNoteSource` callback so export logic remains testable.

Validation:

- Extend `src/main/ipc/validate.ts` with `asNoteExportRequest` and `asNoteExportFormat`.
- Reuse path validation helpers and Markdown path checks.

Result model:

- Continue using the existing IPC `Result<T>` wrapper in `register-ipc.ts`.
- Cancellation returns `{ status: 'cancelled', format }`, not an error.

## 4. Markdown Export

Behavior:

- Export exact raw note source as UTF-8 `.md`.
- Preserve frontmatter exactly.
- Preserve Markdown body exactly.
- No rendering or normalization.
- Default output name from note basename/title.

Implementation notes:

- Read with the same vault-relative source that `readNote` uses, but avoid reindex side effects if a pure source read helper is easy to add.
- If using `readNote`, document that reindex is harmless and already part of read behavior.

## 5. HTML Export

Behavior:

- Export a complete standalone sanitized HTML document:
  - `<!doctype html>`
  - `<html>`
  - `<head>`
  - `<meta charset="utf-8">`
  - `<title>`
  - embedded local export stylesheet
  - `<body>`
  - rendered note content

Rendering:

- Prefer sharing the existing Markdown behavior from `renderMarkdown` while making it main-safe.
- If `src/renderer/editor/preview.ts` cannot safely move as-is because of DOMPurify/DOM assumptions, create:
  - `src/shared/markdown/export-renderer.ts`, or
  - `src/main/export/html-renderer.ts`
- Preserve the sanitizer policy: no scripts, no styles from note content, no iframes, no event handlers.

Frontmatter:

- Default: omit frontmatter from rendered HTML body, matching preview behavior if `NoteIndex.text` is available.
- If export reads raw source, add a pure helper to split frontmatter safely.

Wikilinks:

- Render internal wikilinks as plain text or inert local anchors.
- Do not invent broken external links.

Mermaid:

- Defer Mermaid rendering unless a safe renderer already exists.
- Export Mermaid fences as code blocks for now and document the limitation.

## 6. Word Export (`.docx`)

Preferred dependency:

- Evaluate adding the `docx` npm package.
- Add it only if the package is small enough, local, maintained, and does not require remote services.

Behavior:

- Output a valid `.docx`.
- Convert practical Markdown blocks:
  - headings
  - paragraphs
  - unordered and ordered lists
  - code blocks
  - blockquotes
  - tables where practical
- Preserve plain text content safely.
- Omit YAML frontmatter by default.
- No remote resources.
- No arbitrary code execution.
- Unsupported blocks fall back to plain text.

Recommended first slice:

- Build a small Markdown AST / token conversion around `marked.lexer`.
- Convert common token types to `docx` paragraphs/tables.
- Treat HTML blocks and unsafe embeds as escaped/plain text.

Limitations to document:

- Advanced Markdown extensions may not preserve exact layout.
- Mermaid exports as code/plain text unless safely implemented later.
- Embedded media is deferred.

## 7. PDF Export

Recommended approach:

- Generate sanitized standalone HTML.
- Use Electron `BrowserWindow` / `webContents.printToPDF` in the main process.

Requirements:

- Output `.pdf`.
- No remote network resources.
- Hidden temporary `BrowserWindow` only.
- Load HTML via safe local/data URL mechanism with scripts disabled where possible.
- Clean up the temporary window in success and failure paths.
- Use a clean light print stylesheet by default so dark app themes do not create unreadable PDFs.
- Readable margins, headings, code blocks, tables, and lists.
- Errors return clean messages.

Alternative:

- Use a PDF library only if already present and sufficient. Current recommended path remains Electron print-to-PDF because Electron is already present.

## 8. Export Styling

Create a small export stylesheet, likely in:

- `src/main/export/export-styles.ts`, or
- `src/shared/export-styles.ts` if reused by tests

Include:

- readable body font stack
- page width and margins
- heading hierarchy
- paragraph rhythm
- ordered/unordered lists
- blockquotes
- inline code
- fenced code blocks
- tables
- links
- print-friendly PDF rules

Keep export styling separate from app theme styling for now.

Defer:

- theme-matched export
- user-configurable export CSS
- downloaded/export themes

## 9. File Naming And Save Dialog

Helpers:

- `sanitizeExportFilename(input: string): string`
- `defaultExportFilename(notePath: string, format: NoteExportFormat): string`
- `enforceExportExtension(filePath: string, format: NoteExportFormat): string`

Requirements:

- Default export file name from note basename/title.
- Strip or replace invalid Windows/macOS/Linux filename characters.
- Extension enforced by format.
- Save dialog filters for each format.
- User cancellation returns `{ status: 'cancelled' }`.
- Do not treat cancellation as error.
- Do not silently overwrite beyond normal OS save dialog behavior.

## 10. Tests

Add unit tests:

- `tests/export-types.test.ts`
- `tests/export-filenames.test.ts`
- `tests/export-html.test.ts`
- `tests/export-service.test.ts`
- `tests/export-docx.test.ts` if `docx` is added

Cover:

- export format validation
- unsafe note path rejection
- absolute/traversal path rejection
- non-Markdown path rejection
- Canvas path rejection
- default filename sanitization
- extension enforcement
- save-dialog cancellation handling
- Markdown export preserves exact source
- HTML export emits standalone document
- HTML export removes/escapes `<script>`
- HTML export includes headings, lists, code, and tables
- DOCX export creates non-empty valid docx buffer/file
- PDF export creates non-empty PDF buffer/file, or service test with `printToPDF` mocked

Renderer/UI tests:

- export commands disabled with no active note
- export commands disabled for Canvas active file
- export commands enabled for Markdown active note
- toolbar export action hidden/disabled for non-Markdown
- renderer boundary: no `fs`, `path`, `electron`, or raw `ipcRenderer` in new renderer export UI

Regression gates:

- existing Live Preview tests remain green
- Add tag behavior remains green
- Graph tests remain green
- theme tests remain green
- Canvas 8A-8D tests and E2E remain green

## 11. Documentation

After implementation, create:

- `MILESTONE-11.md`

Update:

- `README.md`
- `ROADMAP.md`
- `ARCHITECTURE.md` if the export service/preload API changes architecture documentation

Docs must mention:

- supported formats: Markdown, HTML, Word, PDF
- active Markdown note only
- renderer remains filesystem-free
- exports are local
- no sync, publish, or cloud
- no arbitrary scripts
- Canvas export deferred
- Mermaid/advanced Markdown limitations if applicable

## 12. Explicit Deferrals

- export entire vault
- export folder
- export Canvas files
- batch export
- export settings profiles
- theme-matched export
- custom export CSS
- advanced Mermaid-to-PDF/Word rendering unless a safe first-slice renderer is proven
- backlinks graph export
- embedded media export
- publishing/cloud sync
- plugin-powered export
- Obsidian compatibility/import-export parity

## Recommended Implementation Order

1. Add shared export types and validation helpers.
2. Add filename/extension helpers with tests.
3. Add main export service skeleton with Markdown export first.
4. Add typed IPC/preload method.
5. Add renderer action helper and command palette commands.
6. Add note toolbar export entry point.
7. Add HTML export renderer and tests.
8. Add DOCX export implementation and tests.
9. Add PDF export via sanitized HTML + hidden Electron print window and tests/mocks.
10. Add UI success/failure/cancel feedback.
11. Run full gates after each functional slice.
12. Write `MILESTONE-11.md` and update docs.

## Acceptance Criteria

- User can export the active Markdown note as `.md`.
- User can export the active Markdown note as `.html`.
- User can export the active Markdown note as `.docx`.
- User can export the active Markdown note as `.pdf`.
- Export output path is chosen safely through the main process.
- Renderer remains filesystem-free.
- No raw IPC is exposed.
- Markdown export preserves exact note source.
- HTML export is standalone and sanitized.
- Word export opens as a valid document.
- PDF export opens as a valid PDF.
- Cancelled save dialog is handled cleanly.
- Canvas files are not exported through this Markdown-note feature.
- Live Preview, themes, Graph, Add tag, and Canvas behavior are not regressed.
- `npm run check` passes.
- `npm run build` passes.
- `npm run test:e2e` passes.
- `npm run dev` passes.

## Ready For Implementation

This milestone is ready for implementation after dependency review for `.docx` generation. The recommended architecture is narrow: one typed export IPC method, one main-process export service, renderer UI/commands that only request export, and local-only output through a main-process save dialog.

## Milestone links

- Previous: [[MILESTONE-10]]
- Next: [[MILESTONE-11]]
- Implementation: [[MILESTONE-11]]
