---
title: "Map UI"
product: "Replica.md"
area: "Knowledge Layer"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Map JSON]]"
  - "[[Relationship Graph]]"
  - "[[Graph and Map CSS]]"
  - "[[Performance Plan]]"
---

# Map UI

Map UI gives users a way to arrange ideas spatially. It should feel like a workspace surface for planning, not a separate drawing app.

## Canvas behavior

- Add pages, groups, labels, attachments, and relationship edges.
- Open a page from a node without losing the map context.
- Pan, zoom, select, align, and search within the canvas.

## Editing notes

- Keep keyboard movement and screen-reader alternatives in scope.
- Save map changes incrementally and recover from partial writes.
- Use the same relationship language as the graph and backlinks views.

## Review checklist

- Map files round-trip through Map JSON.
- Canvas changes are undoable.
- Maps can link into pages and pages can link back to maps.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Map JSON]]
- [[Relationship Graph]]
- [[Graph and Map CSS]]
- [[Performance Plan]]

## Maintenance note

The knowledge layer should always be traceable back to files, links, and the workspace index.
