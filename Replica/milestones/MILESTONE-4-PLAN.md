# Milestone 4 Plan - Settings Window

Milestone 4 should replace scattered status-bar/basic toggles with a proper
settings UI. The settings window must read and write the existing versioned
settings through the current config store and preload bridge. It must not add
plugins, marketplace, pane layout, Canvas, Bases, or other Milestone 5+ work.

## Constraints

- Do not rewrite the architecture.
- Do not widen renderer filesystem access.
- Keep settings reads and writes behind `window.replica.getSettings()` and
  `window.replica.updateSettings()`.
- Keep IPC typed in `src/shared/ipc-contract.ts`.
- Keep settings payloads validated in `src/main/ipc/validate.ts`.
- Keep settings schema versioned and migrated in `src/shared/settings.ts`.
- Keep UI modular and easy to extend.
- Do not overbuild: the result should be a practical settings window, not a full
  preferences platform.

## Recommended Implementation Order

1. Schema v3 design and migration tests.
2. Settings validation hardening for every new field.
3. Settings window shell, opened from command palette/status bar.
4. Appearance and Editor sections, because they mostly use existing behavior.
5. Files & Links and General sections.
6. Core Features section and safe UI hiding.
7. Hotkeys read-only list.
8. Community Plugins stub and About section.
9. Final docs, e2e smoke, and manual verification.

## Settings Schema Changes

Current schema version is `2`.

Milestone 4 should migrate to `SETTINGS_SCHEMA_VERSION = 3`.

Existing fields:

- `theme`: exists.
- `accentColor`: exists.
- `fontSize`: exists.
- `showPreview`: exists.
- `expandedFolders`: exists.
- `fileSort`: exists.

Recommended new fields:

- `startupBehavior: 'welcome' | 'reopenLastVault'`
- `reopenLastVault: boolean`
- `defaultNewNoteFolder: string`
- `language: 'system' | 'en'`
- `editorFontFamily: string`
- `lineWrapping: boolean`
- `autosaveIntervalMs: number`
- `spellcheckEnabled: boolean`
- `tabSize: number`
- `useTabs: boolean`
- `attachmentFolder: string`
- `autoCreateMissingNotes: boolean`
- `linkFormat: 'wikilink' | 'markdown'`
- `uiFontFamily: string`
- `featureBacklinks: boolean`
- `featureGraph: boolean`
- `featureTags: boolean`
- `featureOutline: boolean`
- `featureBreadcrumbs: boolean`

Explicitly deferred schema fields:

- Hotkey bindings map.
- Saved searches.
- Plugin enablement/state.
- Theme package/snippet paths.
- Workspace/pane layout.

## IPC And Preload Changes

The existing `settings:get` and `settings:update` channels are sufficient for
Milestone 4 if the renderer only edits settings. No new IPC channel is required
unless the About section needs build metadata not already available in
`package.json` at build time.

Required work:

- Extend `Settings` and defaults in `src/shared/settings.ts`.
- Extend `normalizeSettings()` for v1/v2 -> v3 compatibility.
- Extend `asSettingsPatch()` in `src/main/ipc/validate.ts`.
- Keep unknown-key rejection.
- Keep `schemaVersion` owned by the config store, never renderer-settable.
- Add validator tests for every new field.

## UI Component Structure

Recommended renderer components:

- `SettingsWindow.tsx`: modal/window shell, section navigation, close behavior.
- `settings/SettingsSection.tsx`: shared layout wrapper.
- `settings/GeneralSettings.tsx`
- `settings/EditorSettings.tsx`
- `settings/FilesLinksSettings.tsx`
- `settings/AppearanceSettings.tsx`
- `settings/HotkeysSettings.tsx`
- `settings/CoreFeaturesSettings.tsx`
- `settings/CommunityPluginsSettings.tsx`
- `settings/AboutSettings.tsx`
- `settings/controls.tsx`: small reusable controls for text input, select,
  checkbox/toggle, numeric input, color input.

Opening points:

- Command palette command: `Open settings`.
- Optional status-bar/settings button replacing or sitting beside the existing
  preview/theme toggles during the transition.

State model:

- Load current settings via existing store state and/or `api().getSettings()`.
- Apply changes through `updateSettings(patch)`.
- Prefer immediate save for simple toggles/selects.
- Use local draft state only for text/numeric fields where typing should not
  persist half-formed values.

## Validation Rules

- `startupBehavior`: enum `'welcome' | 'reopenLastVault'`.
- `reopenLastVault`: boolean.
- `defaultNewNoteFolder`: string, vault-relative folder path or empty string;
  reject absolute paths and `..` segments at validation or normalize layer.
- `language`: enum `'system' | 'en'` for now.
- `editorFontFamily`: non-empty string, max 120 characters.
- `lineWrapping`: boolean.
- `autosaveIntervalMs`: finite number, integer, 250-10000.
- `spellcheckEnabled`: boolean.
- `tabSize`: finite integer, 2-8.
- `useTabs`: boolean.
- `attachmentFolder`: string, vault-relative folder path or empty string; reject
  absolute paths and `..` segments.
- `autoCreateMissingNotes`: boolean.
- `linkFormat`: enum `'wikilink' | 'markdown'`.
- `fileSort`: existing enum `'name' | 'modified' | 'created'`.
- `theme`: existing enum `'light' | 'dark' | 'system'`.
- `accentColor`: existing hex color validator.
- `uiFontFamily`: non-empty string, max 120 characters.
- `showPreview`: existing boolean.
- `featureBacklinks`, `featureGraph`, `featureTags`, `featureOutline`,
  `featureBreadcrumbs`: booleans.

## Migration Strategy

- Keep `normalizeSettings()` defensive: malformed or missing fields fall back to
  defaults.
- v1 -> v3: preserve `theme`, `accentColor`, `fontSize`, `showPreview`; fill all
  v2/v3 fields from defaults.
- v2 -> v3: preserve v2 fields; fill v3 fields from defaults.
- Hand-edited unknown fields are ignored by `normalizeSettings()` on read.
- IPC patches still reject unknown keys so renderer input cannot silently drift.
- Add tests that feed v1-like, v2-like, malformed, and complete v3 settings.

## Section Plans

### 1. General

Purpose:

Control basic startup and localization-facing behavior without changing vault
storage semantics.

Settings fields needed:

- `startupBehavior`
- `reopenLastVault`
- `defaultNewNoteFolder`
- `language`

Field status:

- `startupBehavior`: new.
- `reopenLastVault`: new.
- `defaultNewNoteFolder`: new.
- `language`: new placeholder.

Schema migration needed:

- Yes, v3 defaults.

Likely files affected:

- `src/shared/settings.ts`
- `src/main/ipc/validate.ts`
- `src/renderer/components/settings/GeneralSettings.tsx`
- `src/renderer/app/actions.ts`
- `tests/validate.test.ts`

Acceptance criteria:

- User can choose whether startup reopens the last vault or shows welcome.
- Default new-note folder can be set to empty/root or a relative folder path.
- Language selector exists with `System` and `English`, but no full i18n engine.
- Invalid folder paths are rejected.

Tests needed:

- Settings normalization defaults.
- Validation for enum, boolean, and folder path fields.

Risks:

- Startup behavior may require careful coordination with current vault reopen
  logic.
- Default folder could be confused with file explorer sort/location behavior.

### 2. Editor

Purpose:

Move editor behavior settings into one discoverable place.

Settings fields needed:

- `fontSize`
- `editorFontFamily`
- `lineWrapping`
- `autosaveIntervalMs`
- `spellcheckEnabled`
- `tabSize`
- `useTabs`

Field status:

- `fontSize`: exists.
- `editorFontFamily`: new.
- `lineWrapping`: new.
- `autosaveIntervalMs`: new.
- `spellcheckEnabled`: new placeholder.
- `tabSize`: new placeholder.
- `useTabs`: new placeholder.

Schema migration needed:

- Yes, for all new fields.

Likely files affected:

- `src/shared/settings.ts`
- `src/main/ipc/validate.ts`
- `src/renderer/editor/createEditor.ts`
- `src/renderer/components/EditorPane.tsx`
- `src/renderer/components/settings/EditorSettings.tsx`
- `src/renderer/styles/app.css`
- `tests/validate.test.ts`

Acceptance criteria:

- Font size still updates editor CSS.
- Font family can be changed through a validated setting.
- Line wrapping can be toggled.
- Autosave interval can be adjusted within allowed range.
- Spellcheck and tab/indent controls can be visible as placeholders if full
  editor behavior is too large.

Tests needed:

- Validation for font family, wrapping, interval, spellcheck, tab size, tabs.
- Manual editor check for font size/family and wrapping.

Risks:

- CodeMirror reconfiguration can become messy if too many settings are wired at
  once.
- Autosave interval changes need to avoid stale timers.

### 3. Files & Links

Purpose:

Collect note/file creation and link behavior preferences.

Settings fields needed:

- `defaultNewNoteFolder`
- `attachmentFolder`
- `autoCreateMissingNotes`
- `linkFormat`
- `fileSort`

Field status:

- `fileSort`: exists.
- `defaultNewNoteFolder`: new, also shown in General.
- `attachmentFolder`: new.
- `autoCreateMissingNotes`: new.
- `linkFormat`: new.

Schema migration needed:

- Yes, for new fields.

Likely files affected:

- `src/shared/settings.ts`
- `src/main/ipc/validate.ts`
- `src/renderer/components/FileExplorer.tsx`
- `src/renderer/components/PreviewPane.tsx`
- `src/renderer/editor/wikilinkComplete.ts`
- `src/renderer/components/settings/FilesLinksSettings.tsx`
- `tests/validate.test.ts`

Acceptance criteria:

- File sort preference is editable, even if only name sorting is fully active
  until explorer upgrades.
- Default new-note folder is used for new top-level notes where practical.
- Link format and auto-create controls are persisted, but behavior can be
  limited to existing flows if the full link creation surface is too large.
- Attachment folder is stored and validated, with actual attachment workflows
  deferred.

Tests needed:

- Validation for path fields, booleans, and link format enum.
- Migration/default tests.

Risks:

- Some settings may be persistence-only until later features use them.
- Auto-create missing notes changes user expectations around preview clicks.

### 4. Appearance

Purpose:

Move theme and visual customization out of the status bar into Settings.

Settings fields needed:

- `theme`
- `accentColor`
- `uiFontFamily`
- `showPreview`
- CSS/theme hooks placeholder

Field status:

- `theme`: exists.
- `accentColor`: exists.
- `showPreview`: exists.
- `uiFontFamily`: new.
- CSS/theme hooks: placeholder only, no schema path list yet.

Schema migration needed:

- Yes, for `uiFontFamily`.

Likely files affected:

- `src/shared/settings.ts`
- `src/main/ipc/validate.ts`
- `src/renderer/app/actions.ts`
- `src/renderer/components/StatusBar.tsx`
- `src/renderer/components/settings/AppearanceSettings.tsx`
- `src/renderer/styles/theme.css`
- `src/renderer/styles/app.css`
- `tests/validate.test.ts`

Acceptance criteria:

- Theme mode, accent color, UI font, and preview toggle can be changed in
  Settings.
- Existing theme application behavior remains intact.
- Status bar no longer needs to be the primary settings surface.
- CSS/theme hooks are explained as a future extension, not implemented.

Tests needed:

- Existing theme/accent validation remains covered.
- New UI font validation.
- Manual visual check.

Risks:

- Font family input can produce unattractive UI if unrestricted.
- Removing status toggles too aggressively may reduce convenience.

### 5. Hotkeys

Purpose:

Make command shortcuts discoverable and prepare for future rebinding without
building a full keybinding editor yet.

Settings fields needed:

- None for Milestone 4 if read-only.
- Future deferred field: `hotkeys: Record<string, string>`.

Field status:

- No existing hotkey settings.
- Rebind support deferred unless very small.

Schema migration needed:

- No for read-only list.
- Yes only if rebinding is implemented, which is not recommended for M4.

Likely files affected:

- `src/renderer/components/settings/HotkeysSettings.tsx`
- `src/renderer/components/CommandPalette.tsx`
- Command registry module if commands are extracted from `App.tsx`.

Acceptance criteria:

- Settings lists command palette commands and current shortcuts.
- Rebinding UI is clearly marked deferred or absent.
- Command list stays in sync with the command registry.

Tests needed:

- Optional pure test if a command registry helper is extracted.
- Manual check that listed shortcuts match actual shortcuts.

Risks:

- Rebinding can balloon into a Milestone 5+ command system.
- Duplicating command metadata can drift.

### 6. Core Features

Purpose:

Let users hide built-in knowledge panes safely without unloading core code.

Settings fields needed:

- `featureBacklinks`
- `featureGraph`
- `featureTags`
- `featureOutline`
- `featureBreadcrumbs`

Field status:

- All new.

Schema migration needed:

- Yes.

Likely files affected:

- `src/shared/settings.ts`
- `src/main/ipc/validate.ts`
- `src/renderer/components/RightPane.tsx`
- `src/renderer/components/Breadcrumbs.tsx`
- `src/renderer/App.tsx`
- `src/renderer/components/settings/CoreFeaturesSettings.tsx`
- `tests/validate.test.ts`

Acceptance criteria:

- Disabled right-pane features are hidden from tabs.
- If the active pane is disabled, the app selects the next enabled pane.
- Breadcrumbs can be hidden safely.
- Disabling a feature does not remove data or break IPC.

Tests needed:

- Validation for feature booleans.
- Component/manual checks for hiding active and inactive features.

Risks:

- Feature toggles can create empty right-pane states.
- Commands that switch panes must respect disabled features.

### 7. Community Plugins

Purpose:

Reserve space for future plugin settings while making clear no plugin loading is
available yet.

Settings fields needed:

- None.

Field status:

- No existing fields.

Schema migration needed:

- No.

Likely files affected:

- `src/renderer/components/settings/CommunityPluginsSettings.tsx`

Acceptance criteria:

- Section exists as a stub.
- It explains plugins arrive later.
- No plugin loading, scanning, marketplace, or filesystem access is added.

Tests needed:

- None beyond render/manual smoke unless settings window component tests exist.

Risks:

- Users may interpret the stub as a functional plugin manager.

### 8. About

Purpose:

Show basic project and build identity without adding update or packaging logic.

Settings fields needed:

- None.

Field status:

- No existing settings fields needed.

Schema migration needed:

- No.

Likely files affected:

- `src/renderer/components/settings/AboutSettings.tsx`
- `package.json` if version is read at build time through Vite constants.
- Possibly `electron.vite.config.ts` if build constants are injected.

Acceptance criteria:

- Shows app version.
- Shows build info if readily available; otherwise shows version only.
- Shows license.
- States this is an independent project not affiliated with Obsidian.

Tests needed:

- Manual check.
- Optional typecheck/build constant test if a build-info helper is added.

Risks:

- Reading package metadata directly from renderer can accidentally invite raw
  filesystem access; prefer build-time constants or hardcoded import-safe data.

## Deferred Items

- Hotkey rebinding.
- Plugin loading, plugin API, plugin marketplace.
- Theme package/snippet loading.
- Workspace/pane layout.
- Canvas.
- Bases/properties UI.
- Sync, publish, URI scheme.
- Full i18n.
- Attachment workflows beyond storing a folder preference.

## Final Verification For Milestone 4

- `npm run check` passes.
- `npm run build` passes.
- `npm run test:e2e` passes.
- `npm run dev` renders the app and opens Settings without red renderer runtime
  errors.
- Manual checks verify each settings section renders, existing settings persist,
  invalid settings patches are rejected, and disabled core features hide their UI
  safely.

## Milestone links

- Previous: [[MILESTONE-3]]
- Next: [[MILESTONE-4]]
- Implementation: [[MILESTONE-4]]
