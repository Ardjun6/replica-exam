---
title: "Map JSON"
product: "Replica.md"
area: "Knowledge Layer"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Map UI]]"
  - "[[Relationship Graph]]"
  - "[[Backlink Model]]"
  - "[[JSON Examples]]"
---

# Map JSON

Map JSON stores visual canvases as readable workspace files. The goal is to make planning maps durable enough for source control and simple enough to repair by hand if needed.

## Schema shape

- Nodes for pages, groups, labels, attachments, and external references where allowed.
- Edges with direction, labels, and optional styling.
- Viewport and layout data that can be reset without losing map content.

## Rules

- Map files belong in the workspace and should use normal relative paths.
- Page nodes should resolve through the same link index as Markdown links.
- Unknown node types should be preserved where possible.

## Review checklist

- A map can be opened after formatting or version-control changes.
- Broken page references remain visible.
- Schema examples match the UI behavior.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Map UI]]
- [[Relationship Graph]]
- [[Backlink Model]]
- [[JSON Examples]]

## Maintenance note

The knowledge layer should always be traceable back to files, links, and the workspace index.
