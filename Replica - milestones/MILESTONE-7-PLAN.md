# Milestone 7 Plan - Command Palette And Keyboard Command System

Milestone 7 adds a safe, extensible command system and improves the command
palette so users can quickly run app actions by keyboard. This milestone should
centralize command definitions, command search, command availability, and global
shortcuts without adding plugins, marketplace behavior, scripting, or arbitrary
code execution.

It builds on:

- Milestones 1-5: editor, navigation, search, graph, settings, file explorer,
  and workspace panes;
- 6A: YAML-backed Properties;
- 6A.1: safe property editing;
- 6B: saved Bases table views;
- 6B.1: safe inline Bases property cell editing;
- 6B.2: Bases editing polish;
- 6C: Bases view-management polish;
- 6D: Bases hardening for larger vaults.

The current app already has a first-slice command palette and quick switcher.
Milestone 7 should turn that hard-coded palette into a more deliberate command
system while preserving the current architecture and keeping every command
behind existing safe actions or validated preload APIs.

## Constraints

- Do not rewrite the architecture.
- Do not widen renderer filesystem access.
- Do not expose raw IPC.
- Do not add plugin loading.
- Do not add marketplace behavior.
- Do not add scripting, macros, or arbitrary code execution.
- Do not add Canvas.
- Do not add sync, publish, or URI scheme support.
- Do not add database or spreadsheet features.
- Do not add formulas, relations, rollups, grouping, or bulk editing.
- Do not add new property write paths.
- Keep filesystem-affecting actions behind existing validated preload APIs.
- Keep command execution in the renderer calling safe app actions/callbacks.
- Keep main process ownership of filesystem, vault, index, settings, workspace,
  properties, and Bases persistence.
- Keep the renderer filesystem-free.
- Keep the app shippable after each step.

## Current Command-like Behavior

### Existing Keyboard Shortcuts

Documented current shortcuts:

- `Ctrl/Cmd + Shift + P`: opens the current command palette.
- `Ctrl/Cmd + O`: opens the quick switcher when a vault is open.
- `Ctrl/Cmd + S`: saves the current note through the active editor.
- `Escape`: closes the command palette, quick switcher, or settings window.

Current implementation notes:

- The global palette and quick-switcher shortcuts are handled in `App.tsx`
  through a `window` `keydown` listener.
- Editor save is handled by the CodeMirror editor keymap through `Mod-s`, not
  by the app-level command palette.
- File explorer has its own keyboard behavior for tree navigation, rename,
  delete, and context-menu opening.
- Bases cell editing has its own `Enter`, `Escape`, `F2`, and save/cancel
  keyboard behavior.

### Current Command Palette

The current command palette is a useful first slice:

- `src/renderer/components/CommandPalette.tsx` renders a modal palette.
- `src/core/navigation/command-ranking.ts` ranks `CommandCandidate` values.
- `tests/navigation.test.ts` covers basic command ranking.
- `App.tsx` builds an inline `AppCommand[]` with labels, ids, keywords,
  disabled flags, and `run` functions.

Current limitations:

- command definitions are hard-coded in `App.tsx`;
- command metadata is minimal;
- categories, descriptions, aliases, and shortcuts are not first-class;
- shortcut handling is not centralized;
- disabled command behavior is simple but not deeply tested;
- focus return and modal focus behavior can be strengthened;
- command registry validation is not centralized;
- feature-local commands, especially Bases actions, are not yet exposed through
  a safe command provider/callback shape.

### Search And Quick Navigation

- Quick switcher exists separately from the command palette and opens with
  `Ctrl/Cmd + O`.
- Quick switcher ranks notes by title, path, and aliases through
  `core/navigation/quick-switcher`.
- Search pane can be focused through an existing palette command.
- Tags, backlinks, outline, and graph are selectable through right-pane
  commands generated from enabled feature panes.

### File Explorer Actions

File explorer actions currently live inside `FileExplorer.tsx` and its child
components:

- new note;
- new folder;
- rename;
- delete;
- duplicate;
- move;
- reveal current note;
- reveal current note folder;
- sort is driven by settings.

Filesystem-affecting actions already go through validated preload APIs:

- `createPath`;
- `renamePath`;
- `deletePath`;
- `duplicatePath`;
- `suggestUniquePath`.

Milestone 7 can expose selected safe actions as commands only if they are routed
through existing app action helpers or callbacks. The command system must not
give the renderer any new raw filesystem surface.

### Workspace Tab And Pane Actions

Workspace actions currently exist in `src/renderer/app/actions.ts` and pure
workspace helpers:

- open note in active pane;
- activate pane;
- activate tab;
- close tab;
- split pane right/down;
- close pane;
- resize split;
- back/forward in active pane.

Some of these already appear in the hard-coded palette:

- split pane right;
- split pane down;
- close current pane;
- go back;
- go forward.

Additional commands can be added when they map cleanly to existing actions and
have reliable enabled/disabled predicates.

### Editor Actions

Current editor command-like behavior:

- CodeMirror owns editor-specific keymaps.
- `Mod-s` calls the save callback from `EditorPane`.
- The app does not currently expose a central "save active editor" action.
- Focus editor can likely be implemented as a renderer focus command if the
  active editor surface exposes a safe focus callback or focus key.

Milestone 7 should not route editor internals through main process. It should
use React callbacks or a small UI focus signal where needed.

### Settings, Properties, And Bases Actions

Settings:

- Settings window opens from the current palette and status bar.
- Settings writes use `updateSettings`.
- Hotkeys settings currently list existing shortcuts and palette commands, but
  rebinding is deferred.

Properties:

- Properties editing is note-local and uses `updateNoteProperties`.
- Milestone 7 should not add property write commands beyond existing UI actions.

Bases:

- Bases actions are mostly owned inside `BasesPane`.
- Current Base view management uses `replaceBases`.
- Inline property edits use `updateNoteProperties`.
- Milestone 7 can expose safe Bases commands only if the active Bases pane can
  register or receive safe callbacks for existing actions such as create,
  refresh, duplicate, and rename.

### Where Commands Are Currently Hard-coded

Current hard-coded locations:

- `App.tsx`: app-level `commands` array and global palette/quick-switcher
  shortcut listener.
- `CommandPalette.tsx`: palette run/close/navigation behavior.
- `core/navigation/command-ranking.ts`: current lightweight command ranking.
- `HotkeysSettings.tsx`: static list of shortcuts and palette commands.
- `FileExplorer.tsx`, workspace components, `StatusBar`, `BasesPane`, and
  editor components each own local command-like actions.

Milestone 7 should centralize metadata and search without forcing every UI
event into one global command bus.

## Goals For The Command System

### Central Command Registry

Add a central renderer-side command registry shape that can compose commands
from app-level actions and feature-level command providers.

The registry should support:

- stable command ids;
- labels;
- optional descriptions;
- categories;
- optional aliases/keywords;
- keyboard shortcuts;
- enabled/disabled predicates;
- optional disabled reason;
- safe execution through existing app actions or callbacks.

The registry should not:

- live in the main process;
- persist functions;
- persist command definitions;
- expose raw IPC;
- become a hidden plugin loader;
- allow arbitrary code execution.

### Command Ids

Command ids should be stable strings with a clear namespace.

Suggested id namespaces:

- `app.*`;
- `vault.*`;
- `note.*`;
- `workspace.*`;
- `pane.*`;
- `settings.*`;
- `search.*`;
- `explorer.*`;
- `bases.*`;
- `editor.*`.

Examples:

- `app.openCommandPalette`;
- `note.openQuickSwitcher`;
- `note.new`;
- `settings.open`;
- `search.focus`;
- `workspace.splitRight`;
- `bases.refreshCurrent`.

### Labels, Descriptions, Categories

Each command should have:

- a non-empty label;
- a category;
- a short description where the label is not self-explanatory;
- optional aliases for search matching.

Categories should be simple product categories, not plugin scopes:

- App;
- Vault;
- Notes;
- Workspace;
- Navigation;
- Search;
- Explorer;
- Settings;
- Bases;
- Editor;
- View.

### Enabled/Disabled Predicates

Commands should know whether they are currently runnable.

Examples:

- commands requiring an open vault are disabled when no vault is open;
- active-note commands are disabled when no note is active;
- close-tab command is disabled when no active tab exists;
- Bases current-view commands are disabled unless the Bases pane has an active
  Base selected;
- editor focus/save commands are disabled unless an editor is mounted.

Predicates should use current React/app state, not stale snapshots. Prefer
functions evaluated while building the active command list, or fresh command
context passed into a builder.

### Execution Through Safe Existing Actions

Commands should execute through:

- existing renderer app actions in `src/renderer/app/actions.ts`;
- React callbacks passed from the app shell or feature components;
- existing typed preload APIs where those actions already use them safely.

Commands must not:

- call raw IPC;
- import Node filesystem APIs;
- directly read or write vault files;
- bypass IPC validators;
- add new property write paths;
- mutate persisted state outside existing stores/APIs.

## Command Palette UX

### Shortcut Choice

Use `Ctrl/Cmd + K` as the new primary command palette shortcut.

Rationale:

- it is common for command palettes in modern apps;
- it avoids `Ctrl/Cmd + P`, which often conflicts with print behavior;
- it avoids changing the current quick switcher shortcut, `Ctrl/Cmd + O`;
- the existing `Ctrl/Cmd + Shift + P` can remain as a compatibility alias.

Do not use plain `Ctrl/Cmd + P` in Milestone 7 unless a later decision
explicitly reassigns or suppresses print behavior.

### Search

The palette should support:

- fuzzy or token search over labels;
- matching descriptions;
- matching categories;
- matching aliases/keywords;
- deterministic ranking;
- stable ordering for empty queries;
- clear empty state.

### Keyboard Behavior

Required behavior:

- `ArrowDown`: move to next visible command;
- `ArrowUp`: move to previous visible command;
- `Enter`: run the selected enabled command;
- `Escape`: close the palette;
- click a command row: run that command if enabled;
- disabled commands cannot run.

Selection behavior:

- default selected command should be the first enabled visible command if
  disabled commands are shown;
- selection should clamp when the result list changes;
- Enter should skip or refuse disabled commands consistently.

### Disabled Commands

Decision: show disabled commands by default when they match the query, with
subdued styling and an optional disabled reason.

Rationale:

- users can discover that a command exists;
- disabled reason can explain missing context such as "Open a vault first";
- tests can enforce that disabled commands do not run.

If the first implementation becomes too noisy, add a simple `showDisabled`
option later. Do not add user customization in Milestone 7.

### Loading And Error State

Most commands should be local and should not need palette-level loading.

Allowed simple states:

- command search empty state;
- command execution error message if a command's existing action rejects;
- optional "Running..." state for async commands to prevent duplicate runs.

Do not add a complex task runner or command history.

### Accessibility And Focus

The palette should:

- render as an accessible modal dialog;
- label the dialog as "Command palette";
- focus the search input on open;
- trap focus inside the modal while open;
- restore focus to the previously focused element after close;
- expose results with appropriate roles such as `listbox` / `option` or a
  documented button-list pattern;
- indicate selected and disabled states with ARIA attributes;
- close on Escape;
- avoid stealing unrelated shortcuts from text inputs outside the palette.

### Text Inputs And Shortcut Scope

Global command-palette opening should not fire while text inputs are active
unless the shortcut is clearly intended to be global and safe.

Recommended behavior:

- `Ctrl/Cmd + K` may open globally except inside editable fields where it would
  disrupt expected typing/editing behavior;
- `Ctrl/Cmd + Shift + P` compatibility shortcut may remain global;
- palette-local navigation keys only apply while the palette is open;
- command shortcuts should not run while the user is typing in inputs,
  textareas, selects, contenteditable elements, or CodeMirror editor content,
  unless the shortcut is an existing editor shortcut like `Mod-s`.

## Initial Command Set

### Definitely In Scope For Milestone 7

These commands already map cleanly to existing safe app actions or small
renderer-only focus/navigation callbacks:

- Open command palette.
- Open note / quick switcher.
- New note.
- Open settings.
- Focus search.
- Switch to Backlinks pane.
- Switch to Search pane.
- Switch to Tags pane.
- Switch to Outline pane.
- Switch to Graph pane.
- Switch to Bases pane.
- Toggle preview.
- Toggle theme.
- Reveal current file.
- Reveal current note's folder.
- Duplicate current note.
- Split pane right.
- Split pane down.
- Close current pane.
- Close current tab.
- Navigate back in active pane.
- Navigate forward in active pane.

Notes:

- New note should reuse the existing `suggestUniquePath` and `createPath`
  preload APIs through a renderer action; do not introduce a new write path.
- Close current tab should be implemented through existing workspace actions
  and active-pane/active-tab state.
- Focus commands should remain renderer focus behavior only.

### Optional If Existing Actions Are Cleanly Exposed

These are safe in principle but should be included only if they can be exposed
without awkward prop drilling, stale state, or new product behavior:

- Save current note.
- Focus editor.
- Focus file explorer.
- Create Base.
- Refresh current Base.
- Duplicate current Base if selected.
- Rename current Base if selected.
- Move current Base up/down.
- Delete current Base.
- Create folder.
- Rename current file.
- Delete current file.
- Move current file/folder.

Notes:

- Save current note currently belongs to the mounted editor. Include it only if
  the app can expose an active-editor save callback safely.
- Bases commands require a clean bridge from `BasesPane` state to the command
  registry, such as a command provider callback. Do not reach into component
  internals.
- File explorer destructive commands should keep existing confirmations and
  conflict handling.

### Deferred Because They Need New Product Behavior

Defer commands that would require new app behavior, new persistence, or new
unsafe capabilities:

- New empty tab not attached to a note, unless workspace already supports it
  cleanly.
- Global command for arbitrary file path creation.
- Bulk property edits.
- Bulk note actions.
- Schema manager commands.
- Formula/relation/rollup commands.
- Plugin commands.
- User-defined commands.
- Scripts/macros.
- Shell commands.
- Command marketplace commands.
- URI/deep-link commands.

## Technical Design

### Types

Add shared command types if useful. They should live in a renderer/shared UI
layer unless they are pure enough for `src/shared`.

Suggested types:

```ts
export type CommandId = string;

export type CommandCategory =
  | 'app'
  | 'vault'
  | 'notes'
  | 'workspace'
  | 'navigation'
  | 'search'
  | 'explorer'
  | 'settings'
  | 'bases'
  | 'editor'
  | 'view';

export interface CommandShortcut {
  key: string;
  ctrlOrCmd?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export interface CommandDefinition {
  id: CommandId;
  label: string;
  description?: string;
  category: CommandCategory;
  aliases?: readonly string[];
  shortcuts?: readonly CommandShortcut[];
  disabled?: boolean;
  disabledReason?: string;
  run: () => void | Promise<void>;
}

export interface CommandContext {
  vaultOpen: boolean;
  activePath: string | null;
  activePaneId: string | null;
  activeTabId: string | null;
  enabledRightPanes: readonly string[];
}
```

Keep any type that includes `run` out of persisted shared state. If a pure
serializable type is needed later, split metadata from executable definitions.

### Registry Location

Recommended files:

- `src/renderer/commands/command-types.ts`;
- `src/renderer/commands/command-registry.ts`;
- `src/renderer/commands/command-search.ts`;
- `src/renderer/commands/command-shortcuts.ts`;
- `src/renderer/commands/useCommandPalette.ts` if useful.

The registry should live in the renderer UI layer because command execution is
React/app-state orchestration. Main process should not own the command registry.

### Registry Shape

Prefer command builders over a mutable global bus.

Possible shape:

- app shell builds a `CommandContext`;
- app shell calls command builder helpers with safe callbacks/actions;
- feature components may provide command definitions through props or a small
  registration callback;
- palette receives the active command list as data.

Avoid:

- an event bus that lets any component run any command by id without React
  ownership;
- global mutable registries with stale function references;
- commands stored in persisted settings;
- commands that directly import `api()` unless they are established app actions.

### Execution

Command execution should:

- check disabled state before running;
- close the palette after a successful synchronous command;
- handle async command errors without crashing the renderer;
- keep destructive confirmations inside the existing action/component behavior;
- call existing typed app actions and preload APIs only through safe wrappers.

Do not add raw IPC or new filesystem-affecting APIs for commands.

### Integration Points

Integrate with:

- `App.tsx` for app-level commands and global shortcuts;
- `CommandPalette.tsx` for modal UI;
- `QuickSwitcher.tsx` for open-note behavior;
- `SettingsWindow.tsx` / store for settings open;
- workspace actions for tab/pane/history commands;
- `RightPane` selection for pane-switch commands;
- `FileExplorer` for focus and selected-row commands only if cleanly exposed;
- `BasesPane` for Bases commands only through a safe command-provider pattern.

## Keyboard Shortcut Strategy

### Centralization

Centralize global shortcut definitions where practical:

- command palette open;
- quick switcher open;
- focus search;
- open settings;
- workspace navigation if added.

Keep editor-specific shortcuts in CodeMirror when they are editing commands,
such as save, undo, redo, search-in-editor, indentation, and text manipulation.

### Platform Modifiers

Use a `ctrlOrCmd` abstraction:

- Windows/Linux: `Ctrl`;
- macOS: `Cmd`.

Tests should cover normalization and display labels.

### Conflict Avoidance

Avoid conflicts with:

- `Ctrl/Cmd + S`: save;
- `Ctrl/Cmd + O`: quick switcher;
- `Ctrl/Cmd + P`: print or platform behavior;
- CodeMirror text editing keymaps;
- browser/Electron menu shortcuts;
- File explorer row navigation when explorer has focus;
- palette-local navigation keys.

Shortcut policy:

- global shortcuts should not fire while typing in standard text inputs;
- palette-local keys should work while palette is focused;
- existing shortcuts must keep working;
- duplicate global shortcuts should fail tests unless explicitly allowed.

### Documentation

Document chosen shortcuts in:

- README keyboard shortcut table;
- settings Hotkeys section;
- `MILESTONE-7.md` after implementation.

## Command Matching And Search

### Matching

Use a simple deterministic search implementation.

Inputs to match:

- label;
- description;
- category;
- aliases/keywords;
- shortcut display text if useful.

Recommended behavior:

- empty query returns active commands in stable registry order;
- direct substring matches rank high;
- token matches rank predictably;
- fuzzy subsequence matches are allowed but should not be overbuilt;
- disabled commands can match but cannot execute.

Avoid adding heavy dependencies unless a compelling need appears. The current
`core/navigation/command-ranking.ts` can be evolved or moved to the command
module.

### Tests

Search tests should cover:

- label match;
- description match;
- category match;
- alias match;
- deterministic ranking;
- stable empty-query ordering;
- disabled command inclusion;
- no command execution from search helpers.

## Renderer Components

Suggested components/modules:

- `CommandPalette.tsx`;
- `command-registry.ts`;
- `command-search.ts`;
- `command-shortcuts.ts`;
- `useCommandPalette.ts` if it reduces `App.tsx` complexity.

### CommandPalette.tsx

Responsibilities:

- render modal dialog;
- manage query and selected index;
- render command labels, category, shortcut, disabled state, and disabled
  reason;
- handle keyboard navigation;
- call `onRun(command)` or command `run`;
- restore focus on close;
- keep focus inside while open.

Do not make it responsible for filesystem operations, IPC, or app-wide business
logic.

### command-registry.ts

Responsibilities:

- define base command builders;
- validate unique ids;
- validate non-empty labels;
- validate shortcut conflicts;
- compose feature command lists.

### command-search.ts

Responsibilities:

- rank commands;
- keep search pure and unit-tested;
- avoid React and IPC dependencies.

### command-shortcuts.ts

Responsibilities:

- normalize keyboard events to shortcuts;
- render platform-aware shortcut labels;
- decide whether a target is text-editing context;
- match shortcuts to enabled commands;
- prevent duplicate active global shortcuts.

## Tests Needed

### Pure Unit Tests

- command search ranking;
- label, description, category, and alias matching;
- deterministic ranking;
- disabled command behavior in search results;
- shortcut normalization for Ctrl/Cmd across platforms;
- shortcut display labels;
- editable-target detection;
- command registry unique ids;
- command labels are non-empty;
- no duplicate shortcuts for active global commands unless explicitly allowed.

### Component/Renderer Tests If Practical

- palette opens with shortcut;
- ArrowUp/ArrowDown changes selection;
- Enter runs selected enabled command;
- Enter does not run disabled command;
- mouse click runs enabled command;
- Escape closes;
- focus returns after close;
- empty state appears;
- disabled reason appears;
- shortcut does not run while typing in an input.

If the current test setup does not support React component testing directly,
cover pure behavior with Vitest and preserve an E2E smoke check for palette
opening.

### Regression Tests

- existing `Ctrl/Cmd + Shift + P` palette opening still works if kept as an
  alias;
- existing `Ctrl/Cmd + O` quick switcher still works;
- existing `Ctrl/Cmd + S` editor save remains owned by the editor;
- existing command ranking tests are migrated or preserved.

## Documentation

After implementation, create:

- `MILESTONE-7.md`.

Update:

- `README.md`;
- `ROADMAP.md`;
- `ARCHITECTURE.md` if the command architecture is significant;
- settings Hotkeys section;
- README keyboard shortcuts table.

Documentation should mention:

- command palette shortcut;
- compatibility shortcut if retained;
- command categories;
- initial command set;
- disabled command behavior;
- no plugin/scripting system;
- no raw IPC;
- renderer remains filesystem-free;
- no command customization in Milestone 7;
- deferred command types.

## Risks And Mitigations

### Risk: Shortcut Conflicts

Mitigations:

- centralize shortcut definitions;
- test duplicate global shortcuts;
- avoid `Ctrl/Cmd + P`;
- keep editor-specific shortcuts in CodeMirror;
- document compatibility aliases explicitly.

### Risk: Commands Fire While Typing

Mitigations:

- detect editable targets;
- do not run global shortcuts from text inputs unless explicitly allowed;
- keep palette-local navigation scoped to the palette.

### Risk: Stale Enabled State

Mitigations:

- build commands from current React/store state;
- avoid long-lived global mutable command objects;
- compute disabled predicates close to render time;
- test disabled commands cannot run.

### Risk: Registry Becomes A Hidden Plugin System

Mitigations:

- keep registry internal to the renderer bundle;
- do not load commands from disk;
- do not expose command registration over IPC;
- do not allow arbitrary scripts or user-defined commands.

### Risk: Unsafe Commands Bypass Validated APIs

Mitigations:

- route filesystem-affecting commands through existing app actions/preload APIs;
- do not add raw IPC;
- do not add new write paths for properties or Bases;
- keep command definitions close enough to action wrappers to audit.

### Risk: Focus Bugs In Modal Palette

Mitigations:

- record previously focused element on open;
- restore focus on close;
- trap focus while open;
- test Escape and Enter behavior;
- verify with keyboard-only manual QA.

### Risk: Overbuilding Search

Mitigations:

- start with deterministic token/fuzzy matching;
- avoid heavy dependencies;
- prefer clear tests over clever scoring;
- keep aliases explicit.

### Risk: Accessibility Issues

Mitigations:

- use modal dialog semantics;
- label input and results;
- expose selected/disabled state;
- keep keyboard navigation predictable;
- include manual screen-reader/keyboard checks where practical.

## Recommended Implementation Order

### Step 1 - Inspect Existing Shortcuts And Actions

- Reconfirm current hard-coded commands in `App.tsx`.
- Reconfirm current palette behavior.
- Reconfirm quick switcher and editor save shortcuts.
- Reconfirm file explorer and workspace action surfaces.
- Reconfirm Bases actions are local to `BasesPane`.

### Step 2 - Define Command Types And Registry Shape

- Add command types.
- Add categories.
- Add shortcut type and display helper.
- Add command validation helpers for unique ids and labels.
- Keep executable commands out of persisted/shared state.

### Step 3 - Implement Command Search With Tests

- Expand current command ranking to label, description, category, aliases.
- Preserve deterministic ranking.
- Add tests for disabled command matching and stable ordering.

### Step 4 - Implement Shortcut Normalization With Tests

- Normalize `KeyboardEvent` to `CommandShortcut`.
- Add platform-aware display labels.
- Add editable-target detection.
- Add duplicate shortcut validation.

### Step 5 - Refactor Current Palette Commands Into Registry Builders

- Move hard-coded `App.tsx` command list into command builder modules.
- Keep execution routed through existing actions/callbacks.
- Keep `App.tsx` as the composition point for state and callbacks.

### Step 6 - Improve Palette UI

- Add category/description/shortcut display.
- Show disabled state and reason.
- Improve focus trapping and focus restoration.
- Keep Escape, Enter, ArrowUp, ArrowDown behavior.
- Add empty and simple error states.

### Step 7 - Wire Initial Safe Command Set

- Wire definitely-in-scope commands first.
- Add optional commands only when action exposure is clean.
- Keep destructive actions behind existing confirmation flows.
- Do not add command customization.

### Step 8 - Add Shortcut Opening

- Add `Ctrl/Cmd + K` as primary command palette shortcut.
- Keep `Ctrl/Cmd + Shift + P` as compatibility alias.
- Preserve `Ctrl/Cmd + O` quick switcher.
- Preserve editor `Ctrl/Cmd + S`.

### Step 9 - Tests And Manual QA

- Add pure command tests.
- Add component tests if practical.
- Preserve/extend E2E smoke for palette open/close.
- Run keyboard-only manual checks.

### Step 10 - Documentation And Gates

- Create `MILESTONE-7.md`.
- Update README, ROADMAP, ARCHITECTURE if needed, and Hotkeys settings.
- Run:
  - `npm run check`;
  - `npm run build`;
  - `npm run test:e2e`;
  - `npm run dev`.

## Explicitly Out Of Scope

- Plugin commands.
- Plugin loading.
- User-defined commands.
- Command scripting.
- Macros.
- Command marketplace.
- Command persistence/customization.
- Arbitrary shell commands.
- Arbitrary file commands.
- Raw IPC commands.
- URI scheme.
- Canvas.
- Sync.
- Publish.
- Formulas.
- Relations.
- Rollups.
- Grouping.
- Bulk editing.
- Database-style actions.
- Spreadsheet features.
- Unsafe filesystem actions from the renderer.

## Manual QA Checklist

Run these checks before marking Milestone 7 complete:

1. Press `Ctrl/Cmd + K` from anywhere; the command palette opens.
2. Press `Ctrl/Cmd + Shift + P`; the command palette still opens as a
   compatibility shortcut.
3. Press `Ctrl/Cmd + O`; the quick switcher opens when a vault is open.
4. Focus the editor and press `Ctrl/Cmd + S`; editor save still works and the
   command palette does not open.
5. Focus the editor and press `Ctrl/Cmd + O`; the quick switcher does not open.
6. Focus the editor and press `Ctrl/Cmd + K`; the command palette opens.
7. In the palette, type `set`; Open settings ranks high, and `Enter` opens
   settings.
8. In the palette, `ArrowUp` and `ArrowDown` move the highlighted command.
9. With no vault open, search `search`; Focus search appears disabled and
   `Enter` does nothing.
10. Type `dark theme`; the theme command matches.
11. Press `Escape`; the palette closes and restores focus.
12. Click a command row; an enabled command runs, while a disabled row does
    nothing.

## Acceptance Criteria

Milestone 7 is complete when:

- command palette opens via keyboard shortcut;
- `Ctrl/Cmd + K` opens the command palette;
- existing `Ctrl/Cmd + Shift + P` still works if kept as compatibility alias;
- user can search commands;
- user can run safe existing actions from the palette;
- disabled commands are visible or intentionally hidden according to the chosen
  policy;
- disabled commands cannot run;
- keyboard navigation works;
- mouse click runs enabled commands;
- Escape closes the palette;
- focus is restored after close;
- command registry has unique ids and non-empty labels;
- no duplicate active global shortcuts exist unless explicitly allowed;
- renderer remains filesystem-free;
- no raw IPC is exposed;
- no plugin, marketplace, scripting, or macro system is introduced;
- existing shortcuts still work;
- all gates pass.

## Milestone links

- Previous: [[MILESTONE-6D]]
- Next: [[MILESTONE-7]]
- Implementation: [[MILESTONE-7]]
