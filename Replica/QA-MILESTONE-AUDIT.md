# Full Replica Milestone Verification And Regression Audit

Audit date: 2026-06-05

## Overall Status

Status: partial pass after targeted regression fixes.

Baseline gates passed before audit:

- `npm run check`
- `npm run build`
- `npm run test:e2e`
- `npm run dev` launched the Electron dev app and stayed alive until the bounded audit timeout.

Confirmed regressions fixed during audit:

- Bases UI had been removed in Milestone 10, breaking the shipped Milestone 6B-6D user-facing surface. Restored the Bases right-pane UI and focused tests.
- Markdown notes ignored `settings.markdownViewMode`, making Source and Reading modes unreachable. Restored Live Preview / Source / Reading mode routing and settings controls.
- Settings contained v6 fields while `SETTINGS_SCHEMA_VERSION` still stamped v5. Updated schema version to 6.

Export status:

- Export is planned only. `MILESTONE-11-PLAN.md` exists, but no `note:export`, `exportNote`, save-dialog export service, DOCX, or PDF export implementation was found.
- `MILESTONE-11.md` is a link-navigation follow-up, not the export milestone. It is documented as such in this audit.

## Documentation Inventory

| Document | Status | Notes |
|---|---:|---|
| `MILESTONE-1.md` | pass | Present. Core local-first vault/editor scope remains implemented. |
| `MILESTONE-2.md` | pass | Present. Indexing, preview, tags, watcher coverage present. |
| `MILESTONE-3.md` | pass | Present. Navigation, search, graph basics remain implemented. |
| `MILESTONE-4.md` | pass | Present. Settings schema has advanced to v6; v3 claims remain historical. |
| `MILESTONE-5.md` | pass | Present. Workspace panes/tabs/splits implemented and tested. |
| `MILESTONE-6A.md` | pass | Present. YAML-backed properties internals remain implemented. |
| `MILESTONE-6A.1.md` | pass | Present. `updateNoteProperties` remains implemented and tested. |
| `MILESTONE-6B.md` | fixed | Present. Bases UI was missing; restored. |
| `MILESTONE-6B.1.md` | fixed | Present. Inline editing UI/tests restored. |
| `MILESTONE-6B.2.md` | fixed | Present. Missing-cell type selector/UI tests restored. |
| `MILESTONE-6C.md` | fixed | Present. View management UI/tests restored. |
| `MILESTONE-6D.md` | pass | Present. Backend hardening and large-vault tests remained intact. |
| `MILESTONE-7.md` | pass | Present. Command palette implemented; no raw IPC command bus. |
| `MILESTONE-7.1.md` | pass | Present. Focus trap tests exist. |
| `MILESTONE-8-PLAN.md` | pass | Present. Canvas plan remains historically accurate. |
| `MILESTONE-8A.md` | pass | Present. Canvas schema/store/IPC/preload implemented. |
| `MILESTONE-8B.md` | pass | Present. Canvas workspace renderer implemented. |
| `MILESTONE-8C.md` | pass | Present. Canvas editing implemented and E2E covered. |
| `MILESTONE-8D.md` | pass | Present. Connect/zoom implemented and tested. |
| `MILESTONE-9.md` | partial | Present. Some statements that Source/Reading were deferred were stale after 9.1; app fixed to support modes. |
| `MILESTONE-9.1.md` | fixed | Present. Live Preview default plus Source/Reading modes now match scope again. |
| `MILESTONE-10.md` | fixed | Present. Its Bases-removal claim was misleading after audit; updated to state Bases is restored. |
| `MILESTONE-11-PLAN.md` | pass | Present. Export is accurately a plan. |
| `MILESTONE-11.md` | partial | Present but not export; it documents link navigation. Marked as non-export follow-up. |
| `MILESTONE-12.md` | partial | Present. Documents built-in local "plugins" hub and external link IPC; this is beyond export audit scope and conflicts with earlier deferred-plugin wording. |
| `README.md` | fixed | Updated to current milestone/export status and test counts after final gates. |
| `ROADMAP.md` | fixed | Updated for M10/M11/M12 drift, export planned status, and third-party plugin deferral. |
| `ARCHITECTURE.md` | fixed | Updated for restored Bases, Markdown modes, external-link IPC, and settings v6. |

## Architecture Audit

| Check | Status | Evidence |
|---|---:|---|
| Main process owns filesystem access | pass | `VaultFs`, `VaultService`, stores, and IPC handlers own disk access. |
| Renderer remains filesystem-free | pass | Boundary tests and source search found no renderer `fs`, `path`, `electron`, or raw `ipcRenderer` imports. |
| Preload exposes typed APIs only | pass | `preload.ts` exposes `window.replica`; raw IPC is not exposed. |
| No raw IPC in renderer | pass | Renderer calls `api()` wrapper / `window.replica` only. |
| IPC handlers validate payloads | pass | `register-ipc.ts` validates sender; `validate.ts` validates paths/settings/bases/canvas/external URL. |
| Result-style errors | pass | IPC wraps handler output in `Result<T>`. |
| Vault traversal/absolute path rejection | pass | `vault-path.test.ts`, `validate.test.ts`, `VaultFs.toAbsolute`. |
| Persisted formats versioned | partial | Settings/workspace/bases/canvas versioned. History is in-memory; Calendar is Markdown-backed. |
| Settings migrations safe | fixed | `SETTINGS_SCHEMA_VERSION` now matches v6 fields. |
| Sanitized render path | pass | `renderMarkdown` uses DOMPurify; no new unapproved `dangerouslySetInnerHTML` path found. |

## Milestone Coverage Table

| Milestone | Main feature | Key files | Test files | Manual/E2E coverage | Status | Action needed |
|---|---|---|---|---|---:|---|
| 1 | Vault, editor, preview, wikilinks, backlinks, search, graph, settings | `VaultChooser`, `FileExplorer`, `EditorPane`, `PreviewPane`, `VaultService` | `wikilinks`, `backlinks`, `search`, `vault-path`, `local-graph` | E2E smoke | pass | Broaden vault create/open E2E later. |
| 2 | Indexing, watcher, richer preview, tags | `Indexer`, `watcher`, `preview`, `TagsPane` | `indexer`, `watcher`, `tags`, `search-query` | Tags/Search manual | pass | Add E2E tag filtering later. |
| 3 | Palette, quick switcher, outline, breadcrumbs, graph filters | `App`, `QuickSwitcher`, `GraphView`, `Breadcrumbs` | `navigation`, `graph-filters`, `command-*`, `outline` | Graph icon/palette manual | pass | Outline hidden by design. |
| 4 | Settings window and migrations | `SettingsWindow`, `settings.ts`, `validate.ts` | `settings`, `validate`, `theme-presets` | Settings manual | fixed | Schema v6 fixed. |
| 4.5 | Explorer moves/duplicates/context menu | `FileExplorer`, explorer helpers | `explorer-ops`, `context-menu`, `drag`, `sort` | Manual explorer checklist | pass | Multi-select remains deferred. |
| 5 | Tabs, splits, workspace restore | `WorkspaceShell`, `workspace.ts`, `workspace-store` | `workspace-*` | Manual panes checklist | pass | Add E2E split restore later. |
| 6A | YAML properties internals | `frontmatter`, `properties`, `note-parser` | `frontmatter`, `properties`, `property-update-validation` | Manual malformed YAML | pass | Properties tab hidden by design. |
| 6A.1 | Safe property edits | `frontmatter-update`, `updateNoteProperties` | `frontmatter-update`, `validate`, `tag-edit` | Add-tag manual | pass | Continue using one write path. |
| 6B | Bases table views | `BasesPane`, `BaseTable`, `bases-store`, `base-query` | `bases-*` | Manual Bases checklist | fixed | Restored visible pane. |
| 6B.1 | Bases inline editing | `base-cell-edit`, `BaseTable` | `bases-cell-edit`, `bases-query` | Manual inline edit | fixed | Restored tests. |
| 6B.2 | Missing-cell type selector | `BaseTable`, `base-cell-edit` | `bases-cell-edit` | Manual missing cell | fixed | None. |
| 6C | Bases view management | `base-management`, `BasesPane` | `bases-management` | Manual duplicate/rename/delete | fixed | None. |
| 6D | Larger-vault Bases hardening | `base-query`, `BasesPane` | `bases-large` | Manual limited-result notice | pass | Pagination remains deferred. |
| 7 | Command palette | `commands/*`, `CommandPalette`, `App` | `command-*` | Palette manual | pass | Hotkey rebinding deferred. |
| 7.1 | Focus trap | `CommandPalette` | `command-focus` | Manual keyboard nav | pass | None. |
| 8A | Canvas schema/store/IPC | `shared/canvas`, `canvas-store`, `validate`, `preload` | `canvas-schema`, `canvas-store`, `vault-fs-canvas` | Manual create canvas | pass | No import/export claims. |
| 8B | Canvas workspace render | `CanvasPane`, `CanvasViewport`, document kind | `canvas-render`, `document-kind`, E2E canvas | E2E canvas | pass | None. |
| 8C | Canvas editing | `canvas-edit`, `CanvasToolbar`, `CanvasNodeView` | `canvas-edit`, E2E canvas | E2E canvas | pass | None. |
| 8D | Canvas connect/zoom | `canvas-edit`, `CanvasViewport` | `canvas-edit`, E2E canvas | E2E canvas | pass | Pointer hit-test remains risk under unusual zoom. |
| 9 | Live Preview UX, themes, sidebar cleanup, add tag | `MarkdownNotePane`, `theme.css`, `tag-edit`, `RightPane` | `theme-presets`, `tag-edit`, `right-pane-cleanup`, `dev-console-filter` | Manual themes/tags/sidebar | fixed | Source/Reading restored. |
| 9.1 | Live Preview editing | `LivePreviewPane`, `livePreviewExtension`, `decorationBuilder` | `live-preview-*`, E2E table/links | E2E table/link | fixed | Dirty-switch has unit risk only; add richer E2E later. |
| 10 | Tables, Calendar, History, Folder homes, sidebars | `CalendarPane`, `HistoryPane`, `FolderHomePane`, `BrandLogo` | `calendar-data`, `live-preview-decorations` | Manual calendar/history/folder | partial | Bases restoration corrected doc drift. |
| 11 plan | Safe export | none implemented | none | none | planned | Implement in a future milestone only. |
| 11 doc | Link navigation | `linkNavigation`, `link-target`, `LivePreviewPane` | `live-preview-links`, E2E note-links | E2E note-links | pass | Rename/renumber docs later if desired. |
| 12 | Link polish, local modules, base64 images | `openExternal`, `PluginsSettings`, `BrandLogo`, image widgets | `external-url`, `heading-colors`, `live-preview-decorations` | Manual plugin/settings/images | partial | Third-party plugins remain forbidden/deferred. |

## Manual QA Checklist

### Vault and notes

- Create a new vault and confirm the welcome note appears.
- Open an existing vault and confirm the last vault reopens according to settings.
- Create, rename, duplicate, move, and delete notes and folders.
- Confirm autosave and `Ctrl/Cmd+S` persist note source.
- Confirm external file edits update index/search/backlinks.

### Live Preview

- Open a Markdown note and confirm Live Preview is default.
- Edit headings, paragraphs, lists, blockquotes, code fences, tables, task checkboxes, wikilinks, and strikethrough.
- Confirm frontmatter stays intact and is not edited as a normal Live Preview block.
- Confirm table notes open without crashing.
- Confirm literal `<script>` renders inertly.
- Switch notes with unsaved text and confirm the wrong note is not overwritten.

### Source/Reading Modes

- Switch to Source from the note toolbar and Appearance settings.
- Edit raw Markdown in Source and confirm save/autosave works.
- Switch to Reading and confirm sanitized rendered preview works.
- Switch back to Live Preview and confirm the latest saved source appears.

### Tags

- Add a valid tag with the `+ tag` chip.
- Confirm duplicate/invalid tags are rejected.
- Confirm malformed YAML blocks tag editing with a clear error.
- Confirm Tags pane counts and `tag:` search update.

### Themes

- Select System, Black, White, Dark, Light, Orange, Purple, Green, and Blue.
- Confirm selected theme persists after restart.
- Confirm editor, reading view, settings, dialogs, graph, Bases, and Canvas text stay readable.

### Right Sidebar

- Confirm Backlinks, Search, Tags, Bases, Graph, History, and Calendar are visible when enabled.
- Confirm Outline and Properties are not visible tabs.
- Toggle Backlinks/Graph/Tags off and confirm fallback pane selection stays sane.

### Graph

- Open graph from ribbon and command palette.
- Confirm global graph renders links and unresolved nodes.
- Confirm clicking graph nodes opens notes.

### Bases/Properties Internals

- Create or load a saved Base view.
- Confirm table rows load from frontmatter properties.
- Inline-edit simple text/number/boolean/null cells.
- Add a missing property cell using the type selector.
- Duplicate, rename, move, delete, and refresh a Base.
- Confirm malformed YAML rows are read-only.

### Canvas

- Create/open a `.replica-canvas` file from explorer.
- Add text card, add active note card, edit text, drag, delete.
- Connect two cards with handles; confirm duplicate/self links are rejected.
- Zoom out/reset/in and drag while zoomed.
- Confirm text cards render literal HTML as text.

### Export

- Export is not implemented. Confirm no export commands or toolbar actions are advertised.
- Confirm Canvas export/import remains deferred.

### Settings Persistence

- Change theme, note mode, feature toggles, fonts, autosave interval, folder settings.
- Restart and confirm settings load under schema v6.
- Hand-edit malformed settings and confirm safe defaults/migration.

### Command Palette

- Open with `Ctrl/Cmd+K` and `Ctrl/Cmd+Shift+P`.
- Confirm focus trap and keyboard navigation.
- Confirm pane commands include visible panes only.
- Confirm no Outline/Properties/export commands are advertised.

### Security/Boundary Checks

- Try traversal/absolute paths through validated actions where possible.
- Confirm renderer has no direct filesystem access.
- Confirm raw IPC is not exposed to renderer.
- Confirm external links only open `http`, `https`, and `mailto`.

## Remaining Risks

- Export is still only planned.
- `MILESTONE-11.md` is not the export milestone despite its filename.
- Milestone 12 contains built-in local "plugin" wording and settings modules; this is not a third-party plugin loader, but it conflicts with earlier "plugins deferred" language.
- Source/Reading restoration has focused source-level tests, not full Playwright interaction coverage.
- Bases restoration has unit coverage, but no dedicated E2E flow after being restored.
- `npm run dev` is a long-lived Electron process; audit verified launch by bounded run and process cleanup rather than a natural exit.
