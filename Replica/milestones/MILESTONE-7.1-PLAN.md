# Milestone 7.1 Plan - Command Palette Focus Trap And Command Coverage Polish

Milestone 7.1 polishes the Milestone 7 command palette by tightening modal
focus behavior, improving command coverage only where safe, and adding targeted
tests. This milestone should make the command palette feel production-stable
without adding plugins, scripting, command customization, user hotkey rebinding,
or new filesystem/write surfaces.

It builds on Milestone 7, which added:

- renderer-side command types;
- command registry validation;
- command search;
- shortcut normalization and display;
- improved `CommandPalette` UI;
- `Ctrl/Cmd + K` as the primary command palette shortcut;
- `Ctrl/Cmd + Shift + P` as the compatibility command palette shortcut;
- preservation of `Ctrl/Cmd + O` quick switcher behavior;
- preservation of `Ctrl/Cmd + S` editor save behavior;
- 525 tests across 37 files.

Known Milestone 7 limitation:

- The palette restores focus after close, but it does not yet implement a
  strict focus trap.

## Constraints

- Do not rewrite the architecture.
- Do not expose raw IPC.
- Do not widen renderer filesystem access.
- Do not add new preload APIs unless absolutely necessary.
- Do not add plugin loading.
- Do not add marketplace behavior.
- Do not add scripting, macros, or arbitrary code execution.
- Do not add command persistence/customization.
- Do not add user hotkey rebinding.
- Do not add Canvas.
- Do not add sync, publish, URI scheme, or a deep-link system.
- Do not add database or spreadsheet features.
- Do not add formulas, relations, rollups, grouping, bulk editing, or schema
  manager.
- Do not add new property write paths.
- Keep filesystem-affecting commands routed through existing validated
  app/preload actions.
- Keep the command system renderer-only.
- Keep command execution through existing React callbacks, app actions, store
  mutations, or existing validated preload APIs.
- Keep the app shippable after each step.

## Current Milestone 7 State

### Command Registry Files

Milestone 7 added `src/renderer/commands/`:

- `command-types.ts`
  - `CommandId`;
  - `CommandCategory`;
  - `CommandShortcut`;
  - `CommandDefinition`;
  - `CommandContext`.
- `command-registry.ts`
  - `validateRegistry`;
  - `listEnabledShortcuts`.
- `command-search.ts`
  - `searchCommands(commands, query)`.
- `command-shortcuts.ts`
  - `normalizeShortcutFromEvent`;
  - `sameShortcut`;
  - `formatShortcut`;
  - `isEditableTarget`;
  - `detectPlatform`;
  - `findShortcutMatch`.

These files live in the renderer bundle. There is no main-process command bus,
no command IPC, and no persisted executable command definitions.

### Command Search

`command-search.ts` ranks commands across:

- label;
- aliases;
- category;
- description;
- subsequence fuzzy fallback.

Current behavior:

- empty query returns commands in registry order;
- disabled commands remain searchable for discoverability;
- search helpers do not execute commands;
- ranking is deterministic and covered by unit tests.

### Shortcut Normalization

`command-shortcuts.ts` handles:

- printable-key normalization;
- named-key preservation;
- Ctrl/Cmd abstraction;
- shortcut display labels;
- editable target detection;
- enabled shortcut matching.

Current shortcut policy:

- palette-open shortcuts are always global;
- non-palette shortcuts are ignored in editable typing contexts;
- editor save remains owned by CodeMirror.

### CommandPalette UI

`CommandPalette.tsx` currently:

- renders an accessible modal dialog;
- focuses the search input on open;
- restores the previously focused element on close;
- supports `ArrowDown` / `ArrowUp` with wraparound;
- supports `Enter` to run selected enabled command;
- supports `Escape` to close;
- keeps disabled commands visible and non-runnable;
- shows labels, descriptions, disabled reasons, categories, and shortcut chips;
- scrolls the selected row into view.

Known gap:

- `Tab` and `Shift+Tab` are not strictly trapped inside the palette.

### App.tsx Shortcut Dispatcher

`App.tsx` currently:

- composes the active command list;
- declares shortcuts as command metadata;
- calls `listEnabledShortcuts(commands)`;
- dispatches a single global `keydown` listener through
  `findShortcutMatch`;
- permits palette-open shortcuts from editable contexts;
- suppresses non-palette shortcuts from editable contexts;
- keeps `App.tsx` as the command composition point.

### Current Command Set

Milestone 7 exposes:

- `app.openCommandPalette`;
- `note.openQuickSwitcher`;
- `vault.open`;
- `vault.create`;
- `settings.open`;
- `view.togglePreview`;
- `view.toggleTheme`;
- `explorer.reveal`;
- `explorer.revealFolder`;
- `notes.duplicate`;
- `workspace.splitRight`;
- `workspace.splitDown`;
- `workspace.closePane`;
- `workspace.back`;
- `workspace.forward`;
- `search.focus`;
- `pane.<id>` for enabled right-pane tabs, including Bases.

### Current Tests

Milestone 7 added:

- `tests/command-search.test.ts`;
- `tests/command-shortcuts.test.ts`;
- `tests/command-registry.test.ts`.

The whole suite has 525 tests across 37 files as of Milestone 7.

## UX Goals

### Focus Trap

While the command palette is open:

- `Tab` stays inside the palette;
- `Shift+Tab` stays inside the palette;
- focus moves through focusable palette controls in DOM order;
- focus wraps from last to first and first to last;
- if the current focus somehow leaves the palette, the next Tab action returns
  it to the palette;
- if no focusable item is available, focus returns to the search input.

### Focus Restoration

After close:

- `Escape` closes and restores focus;
- backdrop click closes and restores focus;
- running a command closes and restores focus where appropriate;
- if the original focused element no longer exists, close should not throw.

### Existing Keyboard Behavior

Keep current behavior unchanged:

- `ArrowDown` moves selected command down;
- `ArrowUp` moves selected command up;
- `Enter` runs selected enabled command;
- `Enter` does not run disabled command;
- `Escape` closes;
- disabled command click does nothing.

### Background Interaction

Prevent accidental background interaction:

- backdrop click can close the palette as before;
- clicks inside the palette do not bubble to the backdrop;
- keyboard focus should not move to app content behind the palette;
- command rows remain readable and keyboard-friendly.

### Disabled Command Messaging

Keep disabled commands visible. Improve messaging only if needed:

- disabled reason should be visible when provided;
- disabled rows should be visually subdued;
- disabled rows should expose disabled state through ARIA;
- disabled rows should not run from Enter or click.

## Focus Trap Design

### Internal Focus Trap

Implement a small internal focus trap in `CommandPalette.tsx`.

Recommended shape:

- keep a `paletteRef` for the dialog element;
- keep the existing `inputRef`;
- on `Tab`, collect focusable elements inside `paletteRef`;
- filter out disabled controls and elements hidden from layout;
- determine the current focused element;
- move forward for `Tab`;
- move backward for `Shift+Tab`;
- wrap at the ends;
- `preventDefault()` only for handled Tab navigation.

Do not add a heavy focus-trap dependency.

### Focusable Elements

Collect focusable elements with a focused helper, either internal to
`CommandPalette.tsx` or extracted for testing.

Candidate selector:

```text
a[href],
button:not([disabled]),
input:not([disabled]),
select:not([disabled]),
textarea:not([disabled]),
[tabindex]:not([tabindex="-1"])
```

Filtering rules:

- include elements inside the palette only;
- exclude disabled controls;
- exclude elements with `hidden`;
- exclude elements with `aria-hidden="true"`;
- exclude elements with no layout boxes if practical.

### Tab Behavior

Rules:

- `Tab`: next focusable element;
- `Shift+Tab`: previous focusable element;
- from last with `Tab`: wrap to first;
- from first with `Shift+Tab`: wrap to last;
- if current active element is not inside the palette: focus first element;
- if no focusable elements are found: focus the search input;
- if search input exists, it should be part of the focusable list.

### Escape Behavior

`Escape` should keep current behavior:

- close palette;
- restore previous focus through the existing focus-restoration behavior.

### Testability

If DOM/component tests are practical, test the behavior directly in
`CommandPalette`.

If React component testing remains awkward in the current test setup, extract a
small pure helper for focus wrapping decisions and test that helper, then rely
on E2E/manual checks for real DOM focus behavior.

## Command Coverage Polish

Only add commands that are already safe and cleanly exposed. Do not force any
command that requires awkward prop drilling, stale state, or a new write API.

### Candidate: Focus Editor

Consider adding if a safe renderer focus callback exists or can be added with a
small focus key.

Rules:

- renderer-only focus behavior;
- no IPC;
- no editor internals leaked globally;
- disabled when no editor is mounted or no active note exists.

Defer if it requires reaching into CodeMirror internals from the app shell.

### Candidate: Focus File Explorer

Consider adding if the explorer can expose a simple focus callback or focus key.

Rules:

- renderer-only focus behavior;
- focus a stable explorer container or active row;
- disabled when no vault is open.

Defer if it requires a global DOM query or brittle ref wiring.

### Candidate: Create Base

Consider adding only if `BasesPane` can expose a safe existing create callback.

Rules:

- must use existing `replaceBases` path inside Bases behavior;
- no new Bases persistence file;
- no new write API;
- disabled unless a vault is open and Bases feature/pane is available.

Defer if exposing it requires a global mutable registry or reaching into
`BasesPane` internals.

### Candidate: Refresh Current Base

Consider adding if `BasesPane` can expose the current safe refresh callback.

Rules:

- read-only command;
- should reuse the existing `runBase` flow;
- disabled unless a current Base is selected.

Defer if active Base state cannot be surfaced safely.

### Candidate: Duplicate Current Base

Consider adding if `BasesPane` can expose the existing duplicate callback.

Rules:

- must use existing `replaceBases`;
- disabled unless a Base is selected;
- keep existing duplicate behavior and selection behavior.

Defer if it would duplicate Bases management logic outside `BasesPane`.

### Candidate: Rename Current Base

Consider adding if `BasesPane` can expose an existing rename-start callback.

Rules:

- should start the existing rename UI, not invent a new prompt or write path;
- disabled unless a Base is selected.

Defer if it requires new command-specific rename state.

### Candidate: Move Current Base Up/Down

Consider adding if `BasesPane` can expose existing move callbacks and current
selection/order state.

Rules:

- must use existing `replaceBases`;
- disabled at list edges or without a current Base;
- no drag/drop or new ordering model.

Defer if enabled state would become stale or hard to reason about.

### Default Decision

Default to implementing focus trap first. Command coverage additions are
secondary and should be added only if they stay small, safe, and testable.

## Command Provider Pattern

### Evaluation

Milestone 7.1 should evaluate whether feature-local commands should register
through a small React callback or prop.

Possible pattern:

- App owns the global command list.
- App passes `onRegisterCommands` or `setFeatureCommands(featureId, commands)`
  to feature surfaces that have local state.
- Feature component builds command definitions from its current state.
- App composes app-level commands and feature-local commands.
- Cleanup unregisters feature commands when a feature unmounts.

### Guardrails

Avoid:

- global mutable command bus;
- arbitrary command registration from unknown code;
- commands reaching into component internals;
- stale closures from long-lived registration;
- registration over IPC;
- persisted command definitions;
- plugin-like dynamic command loading.

### Simpler Alternative

Keep `App.tsx` as the composition point if that remains simpler.

For 7.1, command providers are justified only if they make Bases/editor/explorer
commands safe and clean. If they add more complexity than value, defer them and
document why.

### Documentation

If a provider pattern is added, document it in:

- `MILESTONE-7.1.md`;
- `ARCHITECTURE.md`.

If deferred, document that feature-local command coverage remains future work.

## Tests Needed

### Focus Trap Tests

Desired tests:

- `Tab` cycles forward through focusable palette controls;
- `Shift+Tab` cycles backward;
- focus wraps at the first/last focusable element;
- if focus starts outside the palette, Tab returns focus inside;
- if no focusable row exists, focus returns to search input;
- `Escape` closes and restores focus.

### Palette Behavior Regression Tests

Keep and extend coverage for:

- `ArrowDown` moves selected command;
- `ArrowUp` moves selected command;
- `Enter` runs selected enabled command;
- `Enter` does not run disabled command;
- click runs enabled command;
- click does not run disabled command;
- disabled command remains non-runnable.

### Shortcut Tests

Keep Milestone 7 shortcut behavior:

- `Ctrl/Cmd + K` opens the palette from editable and non-editable contexts;
- `Ctrl/Cmd + Shift + P` opens the palette;
- `Ctrl/Cmd + O` quick switcher works when a vault is open;
- `Ctrl/Cmd + O` is ignored from editor/editable contexts;
- `Ctrl/Cmd + S` remains editor-owned;
- shortcut dispatch still ignores typing contexts except always-global palette
  shortcuts.

### Registry Tests

Keep registry validation:

- duplicate ids are caught;
- empty labels are caught;
- duplicate global shortcuts are caught;
- alias shortcuts on the same command are allowed;
- disabled command shortcuts are not listed as enabled shortcuts.

For any added commands:

- id is unique;
- label is non-empty;
- category is appropriate;
- disabled state is safe and fresh;
- command is routed through existing safe callbacks/actions.

## Documentation

After implementation, create:

- `MILESTONE-7.1.md`.

Update:

- `README.md` keyboard/command section only if behavior changes;
- `ROADMAP.md`;
- `ARCHITECTURE.md` if a command provider pattern is added;
- settings Hotkeys section only if shortcuts or command behavior changes.

Documentation should mention:

- focus trap behavior;
- focus restoration behavior;
- command coverage additions, if any;
- command coverage deferrals;
- no plugin/scripting/customization system;
- no raw IPC;
- renderer remains filesystem-free.

## Risks And Mitigations

### Risk: Focus Trap Breaks Screen Reader Behavior

Mitigations:

- keep standard modal dialog semantics;
- avoid exotic ARIA patterns;
- preserve input focus on open;
- use normal tabbable controls;
- manually verify keyboard and screen-reader basics if practical.

### Risk: Tab Cycling Bugs

Mitigations:

- keep focus helper small;
- handle no-results and disabled-row cases;
- test wraparound;
- test `Shift+Tab`;
- manually verify with keyboard-only navigation.

### Risk: Stale Command Callbacks

Mitigations:

- build commands from current React state;
- avoid global mutable command bus;
- if provider registration is used, unregister on unmount and refresh commands
  when dependencies change;
- do not store command functions in persisted state.

### Risk: Command Coverage Expands Into Unsafe Actions

Mitigations:

- add only commands routed through existing validated actions;
- keep destructive confirmations in existing flows;
- reject commands requiring raw filesystem access;
- reject commands requiring new write paths.

### Risk: Overengineering Command Providers

Mitigations:

- keep `App.tsx` as composition point unless provider pattern clearly reduces
  complexity;
- prefer deferral over awkward prop drilling;
- document deferrals.

### Risk: Shortcut Regressions

Mitigations:

- keep Milestone 7 shortcut tests;
- add specific regression tests for editor typing contexts;
- manually verify `Ctrl/Cmd + K`, `Ctrl/Cmd + Shift + P`, `Ctrl/Cmd + O`, and
  `Ctrl/Cmd + S`.

## Recommended Implementation Order

### Step 1 - Inspect Current Palette Focus Behavior

- Read `CommandPalette.tsx`.
- Confirm current focus capture and restoration behavior.
- Confirm current key handling.
- Identify current focusable controls in the modal.

### Step 2 - Add Pure Focus Helper If Useful

- Add a small helper to collect focusable elements or compute next focus target.
- Keep helper dependency-free.
- Test helper directly if component DOM tests are not practical.

### Step 3 - Add Or Adjust Tests First

- Add focus trap tests.
- Add regression tests for existing Arrow/Enter/Escape behavior where practical.
- Add shortcut regression tests only where Milestone 7 coverage is incomplete.

### Step 4 - Implement Focus Trap

- Add `paletteRef`.
- Handle `Tab` and `Shift+Tab` in palette `onKeyDown`.
- Keep Arrow/Enter/Escape behavior unchanged.
- Preserve focus restoration.

### Step 5 - Manually Verify Keyboard-only Behavior

- Verify Tab and Shift+Tab cycle inside the palette.
- Verify Escape restores focus.
- Verify disabled rows stay non-runnable.
- Verify no background focus leak.

### Step 6 - Evaluate Safe Command Coverage Additions

- Check whether editor, explorer, and Bases callbacks are already cleanly
  exposed.
- Add only low-risk commands.
- Defer anything requiring component internals, stale state, or new APIs.

### Step 7 - Add Tests For Any New Commands

- Validate command ids, labels, categories.
- Validate disabled states.
- Validate execution routes through safe existing callbacks/actions.

### Step 8 - Update Docs

- Create `MILESTONE-7.1.md`.
- Update README/ROADMAP/ARCHITECTURE only as needed.

### Step 9 - Run Gates

Run:

- `npm run check`;
- `npm run build`;
- `npm run test:e2e`;
- `npm run dev`.

## Explicitly Out Of Scope

- Plugins.
- Plugin commands.
- Marketplace.
- Scripting.
- Macros.
- Arbitrary code execution.
- Command customization.
- User hotkey rebinding.
- Persisted command settings.
- Raw IPC.
- New filesystem write APIs.
- New property write paths.
- URI/deep-link commands.
- Canvas.
- Sync.
- Publish.
- Formulas.
- Relations.
- Rollups.
- Grouping.
- Bulk editing.
- Schema manager.
- Unsafe destructive commands without existing confirmation flow.

## Acceptance Criteria

Milestone 7.1 is complete when:

- palette traps focus while open;
- `Tab` stays inside the palette;
- `Shift+Tab` stays inside the palette;
- `Escape` closes and restores focus;
- Arrow navigation still works;
- `Enter` still runs selected enabled command;
- disabled commands cannot run;
- existing `Ctrl/Cmd + K` behavior remains correct;
- existing `Ctrl/Cmd + Shift + P` behavior remains correct;
- existing `Ctrl/Cmd + O` quick switcher behavior remains correct;
- existing `Ctrl/Cmd + S` editor save behavior remains correct;
- no raw IPC is exposed;
- renderer filesystem access is unchanged;
- no plugin, scripting, marketplace, customization, or rebinding system is
  introduced;
- any added commands are safe and routed through existing actions/callbacks;
- all gates pass.

## Milestone links

- Previous: [[MILESTONE-7]]
- Next: [[MILESTONE-7.1]]
- Implementation: [[MILESTONE-7.1]]
