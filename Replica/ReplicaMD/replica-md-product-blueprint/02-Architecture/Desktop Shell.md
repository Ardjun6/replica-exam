---
title: "Desktop Shell"
product: "Replica.md"
area: "Architecture"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[System Overview]]"
  - "[[IPC Contracts]]"
  - "[[Renderer Shell]]"
  - "[[Security and Permissions]]"
---

# Desktop Shell

The desktop shell owns the operating-system work: opening folders, watching files, handling menus, keeping windows stable, and exposing safe capabilities to the renderer. The shell should feel boring in the best way: dependable, quiet, and difficult to corrupt.

## Shell responsibilities

- Open and remember trusted workspaces.
- Coordinate file watchers, native dialogs, drag-and-drop, menu actions, and update checks.
- Pass workspace operations through typed IPC instead of letting the renderer touch the host directly.

## Implementation notes

- Use a narrow preload bridge with explicit method names.
- Treat file-system errors as recoverable UI states.
- Record shell decisions in the decision log when they affect security or portability.

## Review checklist

- The renderer cannot access broad native APIs.
- Workspace open, close, rename, and missing-folder states are tested.
- Native menu actions map cleanly to command search entries.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[System Overview]]
- [[IPC Contracts]]
- [[Renderer Shell]]
- [[Security and Permissions]]

## Maintenance note

Treat this page as a boundary note: when the boundary changes, update the linked contracts too.
