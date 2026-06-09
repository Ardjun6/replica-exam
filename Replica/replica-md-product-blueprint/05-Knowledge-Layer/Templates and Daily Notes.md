---
title: "Templates and Daily Notes"
product: "Replica.md"
area: "Knowledge Layer"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Command Search]]"
  - "[[Workspace and Filesystem]]"
  - "[[Markdown Syntax Matrix]]"
  - "[[Daily Template]]"
---

# Templates and Daily Notes

Templates and daily notes support repeated writing without forcing a rigid workflow. They should help users start a page with useful structure and then get out of the way.

## Template behavior

- Store templates as Markdown files in the workspace.
- Support simple variables for date, title, folder, and selected text.
- Let daily notes use a configurable folder, filename format, and starter template.

## Product boundaries

- Do not require daily notes for the rest of the app to work.
- Keep template syntax small and documented.
- Generated notes should be ordinary Markdown after creation.

## Review checklist

- Templates are readable without the app.
- Daily note creation is idempotent for the same date.
- Template variables fail visibly if they cannot be resolved.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Command Search]]
- [[Workspace and Filesystem]]
- [[Markdown Syntax Matrix]]
- [[Daily Template]]

## Maintenance note

The knowledge layer should always be traceable back to files, links, and the workspace index.
