---
title: "Workspace Layout Files"
product: "Replica.md"
area: "Core System"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Configuration Profile]]"
  - "[[Renderer Shell]]"
  - "[[Tabs Panes and Workspaces]]"
  - "[[JSON Examples]]"
---

# Workspace Layout Files

Workspace layout files remember the shape of the app without becoming part of the notes themselves. They store open panes, sidebar state, active files, and named workspace arrangements.

## Saved state

- Active page, pane splits, sidebar widths, selected collection or map, and recent navigation.
- Named layouts for writing, review, planning, or presentation work.
- Window-level state that can be reset without touching notes.

## Repair behavior

- Missing files should open as unresolved tabs with recovery options.
- Invalid layout JSON should fall back to a clean default.
- Layouts should avoid storing private content excerpts.

## Review checklist

- A workspace reopens in a familiar state.
- Broken layout files do not block the user from opening the folder.
- Layout schema is documented beside configuration profile rules.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Configuration Profile]]
- [[Renderer Shell]]
- [[Tabs Panes and Workspaces]]
- [[JSON Examples]]

## Maintenance note

This page should stay aligned with the real workspace files and configuration examples.
