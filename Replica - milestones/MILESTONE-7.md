# Milestone 7 - Command Palette And Keyboard Command System

Milestone 7 promotes the existing first-slice command palette into a
deliberate renderer-side command system. Commands now carry categories,
descriptions, aliases, and platform-aware shortcuts; the palette has better
search, accessibility, and keyboard handling; and `Ctrl/Cmd+K` joins the
existing `Ctrl/Cmd+Shift+P` shortcut for opening the palette.

There is **no plugin loader, no scripting, no macro system, no marketplace,
and no new IPC**. Every command still runs through an existing
React/app-state callback or an existing validated preload API.

## Delivered scope

### Renderer command registry

- New module `src/renderer/commands/` with four files:
  - `command-types.ts` — `CommandId`, `CommandCategory`,
    `CommandShortcut`, `CommandDefinition`, `CommandContext`.
  - `command-registry.ts` — `validateRegistry` (duplicate ids, empty
    labels, shortcut conflicts) and `listEnabledShortcuts`.
  - `command-search.ts` — `searchCommands(commands, query)` with
    deterministic ranking across label, alias, category, and description,
    falling back to subsequence fuzzy match.
  - `command-shortcuts.ts` — `normalizeShortcutFromEvent`,
    `sameShortcut`, `formatShortcut`, `isEditableTarget`, `detectPlatform`,
    `findShortcutMatch`.
- All command code lives in the renderer bundle. No main-process command
  bus, no IPC for command registration, no persistence of executable
  command definitions.

### Improved command palette UI

- `src/renderer/components/CommandPalette.tsx` rewritten to consume the new
  registry types.
- Accessible modal dialog (`role="dialog"`, `aria-modal`, `aria-label`,
  `listbox`/`option` roles, `aria-selected`, `aria-disabled`).
- Search input has `aria-label`, `aria-controls`, `autoComplete="off"`,
  `spellCheck={false}`.
- Keyboard nav: `ArrowDown`/`ArrowUp` (wrap around), `Enter` runs the
  selected enabled command, `Escape` closes.
- Disabled commands remain visible (so they are discoverable) with subdued
  styling and an optional disabled-reason hint. Enter and click both
  refuse to run them.
- Each row shows the category badge and platform-aware shortcut chip(s)
  on the right (Ctrl on Windows/Linux, Cmd on macOS, Option on macOS for
  Alt).
- Focus restoration: the palette records the previously focused element
  on open and restores focus to it when closed.
- Selected row scrolls into view automatically.
- Errors from a misbehaving command are caught and logged so the
  renderer can't crash from a command's `run` throwing.

### App-shell shortcut routing

- `src/renderer/App.tsx` upgraded:
  - Every command gained a `category`, an `aliases` array (replacing the
    older `keywords` field), and where relevant a `description` and one
    or more `shortcuts`.
  - The palette-open command is now part of the registry, with both
    `Ctrl/Cmd+K` (primary) and `Ctrl/Cmd+Shift+P` (compatibility alias)
    declared as its shortcuts.
  - The quick switcher command is part of the registry, with
    `Ctrl/Cmd+O` declared as its shortcut.
  - A single global `keydown` listener uses `findShortcutMatch` to
    dispatch through the registry. There is no longer a hand-rolled
    `if`-chain checking modifier flags.
  - The listener bails out for non-palette shortcuts when the event
    originates from a text input, textarea, select, contenteditable
    element, or CodeMirror editor (via `isEditableTarget`).
  - The palette-open and palette-compat shortcuts are explicitly allowed
    to fire from editable contexts; everything else respects typing.

### Initial command set

The renderer command list now exposes:

- `app.openCommandPalette` — `Ctrl/Cmd+K` (and `Ctrl/Cmd+Shift+P`).
- `note.openQuickSwitcher` — `Ctrl/Cmd+O`.
- `vault.open`, `vault.create`.
- `settings.open`.
- `view.togglePreview`, `view.toggleTheme`.
- `explorer.reveal`, `explorer.revealFolder`.
- `notes.duplicate`.
- `workspace.splitRight`, `workspace.splitDown`, `workspace.closePane`,
  `workspace.back`, `workspace.forward`.
- `search.focus`.
- `pane.<id>` for each enabled right-pane tab (`Backlinks`, `Search`,
  `Tags`, `Outline`, `Properties`, `Bases`, `Graph`).

Every command's `run` continues to call existing app actions in
`src/renderer/app/actions.ts` or a small renderer callback. No new IPC
channels, no new property write paths, no new filesystem surface.

### Shortcut documentation

- `MILESTONE-7.md` (this file).
- `README.md` keyboard table updated to add `Ctrl/Cmd+K`.

## Constraints respected

- Renderer remains filesystem-free.
- No raw `ipcRenderer` or new preload methods.
- No plugin loader, no scripting, no macro system, no marketplace.
- No new property write path (`updateNoteProperties` is still the only
  one).
- No new Bases write path (`replaceBases` is still the only one).
- No URI scheme, Canvas, sync, or publish hooks.
- No persisted command definitions; the registry is rebuilt each render
  from current React/store state.
- Existing shortcuts (`Ctrl/Cmd+Shift+P`, `Ctrl/Cmd+O`, `Ctrl/Cmd+S`,
  `Escape`) continue to work.

## Changed files

```text
src/renderer/commands/command-types.ts            (new)
src/renderer/commands/command-registry.ts         (new)
src/renderer/commands/command-search.ts           (new)
src/renderer/commands/command-shortcuts.ts        (new)
src/renderer/components/CommandPalette.tsx        (rewritten)
src/renderer/App.tsx                              (commands enriched +
                                                   single global keydown
                                                   dispatcher)
src/renderer/styles/app.css                       (new palette row meta /
                                                   category badge / shortcut
                                                   chip styles)

tests/command-search.test.ts                      (new — 12 cases)
tests/command-shortcuts.test.ts                   (new — 18 cases)
tests/command-registry.test.ts                    (new — 7 cases)

MILESTONE-7.md                                    (new)
README.md                                         (keyboard table updated)
ROADMAP.md                                        (M7 status)
ARCHITECTURE.md                                   (commands section)
```

## Update payload shape

There is no IPC payload for commands. Every command is a renderer
closure; its `run` calls existing app actions, store mutations, or
existing preload APIs. The renderer never serializes a command and never
sends a command across IPC.

## Tests added or updated

- `tests/command-search.test.ts` (12 cases): empty-query stable order,
  whitespace-only query, label/alias/category/description direct match,
  subsequence fuzzy fallback, no-result query, tie-break by registry
  position, earlier-substring-hit beats later, disabled commands still
  surface, `searchCommands` does not call `command.run`.
- `tests/command-shortcuts.test.ts` (18 cases): printable-key
  lowercasing, named-key preservation, modifier-only rejection, every
  modifier independent, `sameShortcut` matching with optional flags,
  Shift/Alt/Ctrl distinction, case-insensitive keys, Ctrl vs Cmd
  formatting, Alt vs Option formatting, named-key formatting,
  INPUT/TEXTAREA/SELECT detection, contenteditable detection, CodeMirror
  `.cm-editor` detection, non-editable rejection, `findShortcutMatch`
  enabled-only behavior, disabled skip, modifier-only event safety.
- `tests/command-registry.test.ts` (7 cases): healthy registry has no
  issues, duplicate-id, empty-label, shortcut-conflict between commands,
  alias shortcuts on the same command allowed, `listEnabledShortcuts`
  skips disabled, multi-shortcut flatten.

Suite total: **525 unit tests across 37 files**.

## Quality gates

- `npm run check` — **pass** (typecheck + lint + prettier + 525 tests).
- `npm run build` — **pass** (main + preload + renderer bundles).
- `npm run test:e2e` — **pass** (1/1 Electron smoke).
- `npm run dev` — **pass** (boots cleanly; only the well-known DevTools
  `Autofill.enable` noise).

## Behaviour preserved

- `Ctrl/Cmd+Shift+P` still opens the palette (compatibility alias).
- `Ctrl/Cmd+O` still opens the quick switcher.
- `Ctrl/Cmd+S` is still owned by the CodeMirror editor keymap.
- `Escape` still closes the palette, the quick switcher, and the
  settings window.

## Deferred items (out of scope for 7)

- Plugin commands and any plugin loader.
- Marketplace, plugin directory, theme packages.
- User-defined commands.
- Command scripting, macros, recordable command sequences.
- Persisted command customization / user hotkey rebinding.
- Shell-execution commands, file-path commands, URI commands.
- Canvas, sync, publish, marketplace.
- Formulas, relations, rollups, grouping, bulk editing, schema manager.
- Database / spreadsheet behavior, board / calendar / gallery views.
- Unsafe filesystem actions from the renderer.

## Manual checks

1. Press `Ctrl/Cmd+K` from anywhere in the app — the palette opens.
2. Press `Ctrl/Cmd+Shift+P` — the palette still opens (compatibility
   alias).
3. Press `Ctrl/Cmd+O` — the quick switcher opens when a vault is open.
4. With the editor focused, press `Ctrl/Cmd+S` — CodeMirror save still
   fires; the command palette does **not** open.
5. With the focus inside the editor, press `Ctrl/Cmd+O` — the quick
   switcher should not open (typing-protected). Press `Ctrl/Cmd+K` —
   the palette should still open (palette-open is an always-global
   shortcut).
6. In the palette, type "set" — "Open settings" ranks high; press
   `Enter` — settings open and the palette closes.
7. Move with `ArrowDown` / `ArrowUp` and confirm the highlighted row
   scrolls into view.
8. With no vault open, type "search" — "Focus search" is visible but
   dimmed; pressing `Enter` does nothing.
9. Type "dark theme" — the theme-toggle command matches via description.
10. Close the palette with `Escape` — focus returns to wherever it was
    before opening.
11. Hover a row with the mouse — the highlighted index follows the
    pointer, and a click runs the command (or no-ops on a disabled row).
12. Open the palette while a text input outside the palette is focused —
    confirm `Ctrl/Cmd+K` still opens it (palette-open is always global).

## Known risks or limitations

- **Hotkey settings UI is not rebindable yet.** The Hotkeys section in
  Settings is still a read-only reference. Persisted user customization
  is a deliberate non-goal for M7.
- **Disabled commands are visible by default.** This was the chosen
  policy so users can discover commands and the disabled reason. A
  future iteration could let users hide them.
- **No focus trap implementation.** The palette restores focus on close
  and keeps keyboard nav contained via its own `onKeyDown` handler. If a
  user can tab to elements behind the palette, future polish can add an
  explicit focus trap.
- **Commands are renderer-only.** This is intentional: no
  main-process command bus, no IPC for commands, no plugin loader.
  Future cross-cutting commands (e.g. "rename pane file" from the
  workspace) would need a small command-provider callback added by the
  feature component rather than a global registry.

## Milestone links

- Previous: [[MILESTONE-7-PLAN]]
- Next: [[MILESTONE-7.1-PLAN]]
- Plan: [[MILESTONE-7-PLAN]]
