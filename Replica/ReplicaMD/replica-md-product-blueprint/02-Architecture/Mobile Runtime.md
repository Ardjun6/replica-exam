---
title: "Mobile Runtime"
product: "Replica.md"
area: "Architecture"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[System Overview]]"
  - "[[Mobile Packaging]]"
  - "[[Sync and E2EE]]"
  - "[[Performance Plan]]"
---

# Mobile Runtime

Mobile should be treated as a companion runtime, not a smaller desktop edition. It needs the same workspace ideas, but with mobile storage limits, offline behavior, touch navigation, and battery cost in mind.

## Mobile shape

- Start with reading, search, backlinks, quick capture, and light editing.
- Use the same metadata and link model as desktop so workspaces remain compatible.
- Keep sync conflicts visible and recoverable on small screens.

## Constraints

- File access, background indexing, and attachment previews differ across platforms.
- Large graph views may need summaries instead of full canvas rendering.
- Extension support should wait until the permission model is proven on desktop.

## Review checklist

- A synced workspace opens with the same links and properties as desktop.
- Quick capture works offline.
- Mobile-specific limits are listed before packaging starts.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[System Overview]]
- [[Mobile Packaging]]
- [[Sync and E2EE]]
- [[Performance Plan]]

## Maintenance note

Treat this page as a boundary note: when the boundary changes, update the linked contracts too.
