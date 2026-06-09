---
title: "Tabs Panes and Workspaces"
product: "Replica.md"
area: "Knowledge Layer"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Renderer Shell]]"
  - "[[Workspace Layout Files]]"
  - "[[Hotkeys]]"
  - "[[App Shell CSS]]"
---

# Tabs Panes and Workspaces

Tabs and panes let users keep several notes and views open while they work. The system should support focused writing, comparison, review, and planning without making the layout fragile.

## Layout behavior

- Open pages, maps, collections, search results, graph views, and previews in panes.
- Split panes horizontally or vertically and remember named layouts.
- Keep navigation history per pane.

## Workspace rules

- Layouts are profile state, not note content.
- A missing file should not break the full layout.
- Pinned tabs and temporary previews should behave differently.

## Review checklist

- Layouts restore across restarts.
- Pane actions are available from commands and hotkeys.
- Missing files and renamed pages have recovery paths.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Renderer Shell]]
- [[Workspace Layout Files]]
- [[Hotkeys]]
- [[App Shell CSS]]

## Maintenance note

The knowledge layer should always be traceable back to files, links, and the workspace index.
