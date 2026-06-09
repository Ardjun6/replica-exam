---
title: "Workspace and Filesystem"
product: "Replica.md"
area: "Core System"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Configuration Profile]]"
  - "[[Data Models]]"
  - "[[Search and Query Language]]"
  - "[[Sync and E2EE]]"
---

# Workspace and Filesystem

A Replica.md workspace is an ordinary folder with Markdown pages, attachments, maps, collections, exports, templates, and a `.replica` profile. The app should respect the folder as the user’s property, not as an opaque database.

## Workspace rules

- Markdown pages remain usable in any text editor.
- Attachments keep normal file paths and can be moved with the workspace.
- Generated exports and app profile files are clearly separated from user notes.

## Filesystem behavior

- Watch for external edits, renames, deletes, and new files.
- Use safe writes for page updates and profile changes.
- Show conflicts instead of overwriting changed content silently.

## Review checklist

- The workspace can be duplicated, zipped, backed up, and reopened.
- External edits are detected and indexed.
- Every app-created folder has a documented purpose.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Configuration Profile]]
- [[Data Models]]
- [[Search and Query Language]]
- [[Sync and E2EE]]

## Maintenance note

This page should stay aligned with the real workspace files and configuration examples.
