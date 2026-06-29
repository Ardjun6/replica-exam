# Milestone 7.1 - Command Palette Focus Trap And Command Coverage Polish

Milestone 7.1 polishes the Milestone 7 command palette without expanding the
command system into plugins, scripting, customization, or a new IPC surface.

The focus of this milestone is modal stability: keyboard focus now stays inside
the palette while it is open, `Escape` still closes and restores focus, and the
existing command search and keyboard behavior remain unchanged.

## Delivered Scope

### Strict Palette Focus Trap

- `src/renderer/components/CommandPalette.tsx` now owns a `paletteRef` and
  traps `Tab` / `Shift+Tab` while the palette is open.
- Focusable controls are collected from inside the palette only.
- Disabled, hidden, and `aria-hidden` elements are excluded from the trap.
- `Tab` moves forward through palette controls and wraps from the last control
  back to the first.
- `Shift+Tab` moves backward and wraps from the first control to the last.
- If focus somehow starts outside the palette, the next tab movement returns
  focus inside the palette.
- If no focusable palette control can be found, focus falls back to the search
  input.
- Existing focus restoration is preserved: the previously focused element is
  recorded on open and restored on close.

### Behavior Preserved

- `ArrowDown` / `ArrowUp` still move the selected command and wrap.
- The selected row still scrolls into view.
- `Enter` still runs the selected enabled command.
- `Enter` does not run disabled commands.
- Clicking an enabled command still runs it.
- Clicking a disabled command still does nothing.
- Disabled commands remain visible and discoverable.
- `Escape` still closes the palette.
- `Ctrl/Cmd+K` and `Ctrl/Cmd+Shift+P` still open the palette.
- `Ctrl/Cmd+O` remains the quick-switcher shortcut and still respects editable
  contexts.
- `Ctrl/Cmd+S` remains owned by the editor save keymap.

### Focus Helper

- Added `src/renderer/commands/command-focus.ts`.
- The helper contains the small, pure focus-index wrapping decision used by the
  palette trap.
- It also provides DOM collection/filtering helpers for focusable palette
  elements.
- No dependency was added for focus trapping.

### Safe Command Coverage Evaluation

No new command coverage was added in 7.1.

Candidates were reviewed:

- Focus editor.
- Focus file explorer.
- Create Base.
- Refresh current Base.
- Duplicate current Base.
- Rename current Base.
- Move current Base up/down.

These are deferred because the cleanest current implementations would require
either a feature-local command provider, new app-level focus plumbing, or
callbacks reaching into component internals. That work is valid for a later
milestone, but adding it here would have gone beyond the focused 7.1 polish.

## Constraints Respected

- Renderer remains filesystem-free.
- No raw IPC was exposed.
- No new preload APIs were added.
- No plugin loader, marketplace, scripting, macros, or arbitrary code
  execution.
- No command persistence, customization, or hotkey rebinding.
- No Canvas, sync, publish, URI/deep-link system, formulas, relations,
  rollups, grouping, bulk editing, or schema manager.
- No new property write paths.
- Command execution remains renderer-only through existing React callbacks,
  app actions, store mutations, or existing validated preload APIs.

## Tests Added Or Updated

- `tests/command-focus.test.ts` adds pure focus wrapping coverage:
  - forward movement;
  - backward movement;
  - wrapping at both ends;
  - focus starting outside the trap;
  - empty focusable list behavior.
- `tests/e2e/smoke.spec.ts` now covers real palette DOM behavior:
  - `Ctrl+Shift+P` opens the palette;
  - search input receives focus;
  - `Tab` moves into command rows;
  - `Shift+Tab` returns to the input;
  - focus wraps from input to the last command row;
  - focus wraps from the last command row back to the input;
  - arrow navigation still changes the selected command;
  - disabled "Focus search" remains non-runnable when no vault is open;
  - `Escape` closes and restores focus;
  - `Ctrl+K` still opens the palette;
  - disabled `Ctrl+O` does not open the quick switcher without a vault.

## Changed Files

```text
src/renderer/commands/command-focus.ts            (new)
src/renderer/components/CommandPalette.tsx        (focus trap)

tests/command-focus.test.ts                       (new)
tests/e2e/smoke.spec.ts                           (palette focus trap E2E)

MILESTONE-7.1.md                                  (new)
README.md                                         (status / command polish)
ROADMAP.md                                        (M7.1 status)
```

## Quality Gates

- `npm run check` - pass (typecheck + lint + prettier + 530 tests).
- `npm run build` - pass.
- `npm run test:e2e` - pass.
- `npm run dev` - pass (boots and stays alive past startup).

## Deferred Items

- Feature-local command provider pattern.
- Focus editor command.
- Focus file explorer command.
- Bases commands for create, refresh, duplicate, rename, and move up/down.
- Plugin commands, plugin loader, marketplace.
- User-defined commands, scripting, macros.
- Persisted command customization and user hotkey rebinding.
- URI/deep-link commands.
- Raw IPC commands or renderer filesystem access.
- New filesystem write APIs.
- Canvas, sync, publish.
- Formulas, relations, rollups, grouping, bulk editing, schema manager.

## Manual Checks

1. Press `Ctrl/Cmd+K` from anywhere - the palette opens.
2. Press `Ctrl/Cmd+Shift+P` - the palette still opens.
3. Press `Tab` repeatedly while the palette is open - focus stays inside and
   wraps.
4. Press `Shift+Tab` repeatedly - focus stays inside and wraps backward.
5. Press `ArrowDown` / `ArrowUp` - the highlighted command changes.
6. Press `Enter` on an enabled command - it runs.
7. Press `Enter` on a disabled command - nothing runs.
8. Press `Escape` - the palette closes and focus returns to the previously
   focused element.
9. Press `Ctrl/Cmd+O` with no vault open - the quick switcher does not open.
10. Focus the editor in an open vault and press `Ctrl/Cmd+S` - editor save still
    works and the palette does not open.

## Milestone links

- Previous: [[MILESTONE-7.1-PLAN]]
- Next: [[MILESTONE-8-PLAN]]
- Plan: [[MILESTONE-7.1-PLAN]]
