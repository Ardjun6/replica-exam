---
title: "Renderer Shell"
product: "Replica.md"
area: "Architecture"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[System Overview]]"
  - "[[Tabs Panes and Workspaces]]"
  - "[[App Shell CSS]]"
  - "[[Backlink Model]]"
---

# Renderer Shell

The renderer shell is the user’s daily surface: navigation, panes, page chrome, sidebars, commands, and status feedback. It should stay fast even when the workspace index is busy.

## Interface frame

- Left side for workspace navigation and saved views.
- Main area for page reading, editing, maps, collections, and previews.
- Right side for backlinks, outline, properties, and contextual details.

## State handling

- Keep open panes, split layout, and recent files in workspace state.
- Show indexing and sync status without interrupting writing.
- Route risky actions through confirmations and undoable steps where possible.

## Review checklist

- Workspace state can be restored after restart.
- Large folders do not block basic navigation.
- Renderer state is separated from file content and index state.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[System Overview]]
- [[Tabs Panes and Workspaces]]
- [[App Shell CSS]]
- [[Backlink Model]]

## Maintenance note

Treat this page as a boundary note: when the boundary changes, update the linked contracts too.
