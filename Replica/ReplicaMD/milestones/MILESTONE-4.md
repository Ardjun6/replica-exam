# Milestone 4 — Settings Window

A dedicated, modular settings UI replacing the status-bar toggles, plus the
schema and validation work needed to support it. The settings window reads and
writes the existing versioned settings through the existing config store and
preload bridge — no new IPC channels, no widened filesystem surface, no plugin
loading.

## Delivered scope

### Schema v3 (`src/shared/settings.ts`)

| Requirement | Status | Where |
|-------------|:------:|-------|
| Bump `SETTINGS_SCHEMA_VERSION` to 3 | ✅ | `src/shared/settings.ts` |
| Add the v3 fields listed below | ✅ | `Settings`, `DEFAULT_SETTINGS` |
| `normalizeSettings` migrates v1 → v3 | ✅ | tested in `tests/settings.test.ts` |
| `normalizeSettings` migrates v2 → v3 | ✅ | tested in `tests/settings.test.ts` |
| Malformed / unknown values fall back to defaults | ✅ | tested |
| `schemaVersion` always stamped by the store | ✅ | tested |
| Hand-edited unknown fields silently ignored on read | ✅ | tested |
| Shared `isSafeRelativeFolder` helper for path-like fields | ✅ | tested |

**New fields (v3):**

- General: `startupBehavior`, `reopenLastVault`, `defaultNewNoteFolder`, `language`
- Editor: `editorFontFamily`, `lineWrapping`, `autosaveIntervalMs`, `spellcheckEnabled`, `tabSize`, `useTabs`
- Files & Links: `attachmentFolder`, `autoCreateMissingNotes`, `linkFormat`
- Appearance: `uiFontFamily`
- Core feature toggles: `featureBacklinks`, `featureGraph`, `featureTags`, `featureOutline`, `featureBreadcrumbs`

### Validation hardening (`src/main/ipc/validate.ts`)

| Requirement | Status |
|-------------|:------:|
| Only allow known settings keys | ✅ |
| Reject `schemaVersion` patches (with a specific message) | ✅ |
| Reject unknown keys | ✅ |
| Reject `__proto__` / `constructor` / `prototype` (prototype pollution) | ✅ |
| Validate every v3 field's type, range, enum, and path safety | ✅ |
| Path-like fields share `isSafeRelativeFolder` with `normalizeSettings` | ✅ |
| Full per-field test coverage in `tests/validate.test.ts` | ✅ |

### Settings UI

- `SettingsWindow.tsx` — modal shell with left-hand section navigation, header
  with title + close button, Esc closes from anywhere.
- `settings/SettingsSection.tsx` — shared section wrapper (header + body).
- `settings/controls.tsx` — `Field`, `Toggle`, `Select`, `NumberInput`,
  `TextInput`, `ColorInput`. Inputs commit on blur/Enter so a half-typed value
  never reaches the validator.
- Sections: `GeneralSettings`, `EditorSettings`, `FilesLinksSettings`,
  `AppearanceSettings`, `HotkeysSettings`, `CoreFeaturesSettings`,
  `CommunityPluginsSettings`, `AboutSettings`.

### Opening points

- Command palette command **"Open settings"**.
- Status bar gear button (⚙) added beside the preview/theme toggles.
- Esc closes the window from any focused control.

### Wired into live behavior

- `applyTheme` (renderer `actions.ts`) now sets `--font-editor` and
  `--font-body` CSS variables from `editorFontFamily` and `uiFontFamily`.
- CodeMirror `lineWrapping` is now reconfigurable through a Compartment; the
  Editor section toggles it live.
- `EditorPane` reads `autosaveIntervalMs` and `lineWrapping` from settings;
  changing either takes effect on the next edit.
- `featureBreadcrumbs` hides the breadcrumb row.
- `RightPane` filters its tab strip through `enabledRightPanes(settings)`. If
  the user disables the active pane, `App.tsx` selects the next enabled one.
- The "Switch to <pane>" commands are derived from the same enabled list.

### About

- `src/shared/about.ts` holds hardcoded import-safe identity constants. The
  renderer never reads `package.json` directly (no filesystem dependence).

## Changed files

- `src/shared/settings.ts` — v3 schema, defaults, migration, `isSafeRelativeFolder`.
- `src/main/ipc/validate.ts` — strict per-field validation incl. prototype-pollution
  rejection.
- `src/shared/about.ts` — new (hardcoded identity constants).
- `src/renderer/components/SettingsWindow.tsx` — new (modal shell).
- `src/renderer/components/settings/*.tsx` — new (10 files).
- `src/renderer/app/store.ts` — `settingsOpen`, `settingsSection`.
- `src/renderer/app/feature-flags.ts` — new (`enabledRightPanes`).
- `src/renderer/app/actions.ts` — `applyTheme` sets font-family vars.
- `src/renderer/editor/createEditor.ts` — `wrapCompartment` + `setLineWrapping`,
  `lineWrapping` option.
- `src/renderer/components/EditorPane.tsx` — accepts `lineWrapping` and
  `autosaveIntervalMs`, plumbs them through.
- `src/renderer/components/StatusBar.tsx` — gear button opens settings.
- `src/renderer/components/RightPane.tsx` — filters tabs through enabled flags.
- `src/renderer/App.tsx` — mounts `SettingsWindow`, hides breadcrumbs when
  disabled, derives pane list from settings, adds "Open settings" command.
- `src/renderer/styles/app.css` — settings window styles.
- `tests/settings.test.ts` — new (14 cases).
- `tests/validate.test.ts` — expanded to 60 cases (v3 + prototype pollution).

## Quality gates

| Gate | Status | Command |
|------|:------:|---------|
| Typecheck (node + web) | ✅ | `npm run typecheck` |
| Lint | ✅ | `npm run lint` |
| Format | ✅ | `npm run format:check` |
| Unit tests (191 pass) | ✅ | `npm test` |
| Build (electron-vite, all three targets) | ✅ | `npm run build` |
| E2E smoke (Playwright on built app) | ✅ | `npm run test:e2e` |

All gates were run end-to-end in this environment after the implementation
landed.

## Deferred items (documented, not built)

- Hotkey rebinding UI and the underlying command/keybinding system (M5+).
- Plugin loading, plugin API, marketplace (M8 — developer mode first).
- Theme package and CSS snippet loading (M8).
- Workspace/pane layout (M5).
- Canvas, Bases, Sync, Publish, URI scheme (M7+/M9).
- Full i18n engine (M10).
- Attachment workflows beyond storing a folder preference.
- Full spellcheck integration (the `spellcheckEnabled` setting is persisted only).
- Full `tabSize` / `useTabs` editor integration (persisted only).

## Manual checks worth running

1. `npm run dev` boots without red runtime errors.
2. Open Settings from `Ctrl/Cmd + Shift + P` → "Open settings" and from the ⚙
   button in the status bar; Esc closes it.
3. Each section renders without errors. Change a value (theme, accent, line
   wrap, autosave interval, font family). Confirm it persists across a restart.
4. Disable a core feature (e.g. Graph). Its tab disappears; if it was active,
   the first enabled tab is now active. Re-enabling restores it.
5. Hide breadcrumbs via the toggle. The breadcrumb row disappears.
6. Try to break validation from the DevTools console:
   ```js
   await window.replica.updateSettings({ schemaVersion: 99 });   // throws
   await window.replica.updateSettings({ defaultNewNoteFolder: '../escape' }); // throws
   await window.replica.updateSettings({ autosaveIntervalMs: 50 });            // throws
   ```
7. Open the About section: name, version, license, and the independence note
   all render from `src/shared/about.ts`. No filesystem access is involved.

## Acceptance criteria — confirmed

- ✅ `npm run check`, `npm run build`, `npm run test:e2e` all pass.
- ✅ Settings opens from the command palette and from the status-bar gear.
- ✅ Settings opens without red renderer runtime errors.
- ✅ All eight sections render.
- ✅ Existing v1/v2 settings persist and migrate.
- ✅ New v3 settings persist; migrations covered by unit tests.
- ✅ Invalid settings patches are rejected (60 validator tests).
- ✅ Disabled core features hide their UI safely; active-pane fallback works.
- ✅ Renderer still has no raw filesystem access — every write goes through
  `window.replica.updateSettings` and the about page uses hardcoded constants.
- ✅ No plugin loading is added.
- ✅ No Milestone 5+ features are added.

## Milestone links

- Previous: [[MILESTONE-4-PLAN]]
- Next: [[MILESTONE-4.5-PLAN]]
- Plan: [[MILESTONE-4-PLAN]]
