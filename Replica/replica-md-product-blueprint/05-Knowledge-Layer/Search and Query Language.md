---
title: "Search and Query Language"
product: "Replica.md"
area: "Knowledge Layer"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Collections DB UI]]"
  - "[[Backlink Model]]"
  - "[[Relationship Graph]]"
  - "[[Performance Plan]]"
---

# Search and Query Language

Search should handle quick lookup and structured questions from the same workspace index. The query language needs to stay understandable, because users should not need to learn a full database syntax to find their notes.

## Search modes

- Plain text search across titles, paths, headings, content, properties, tags, and attachments where indexed.
- Filters for folder, file type, property, tag, link status, modified date, and relationship type.
- Saved queries used by collections and review workflows.

## Query design

- Start with readable operators and clear error messages.
- Show matched context and explain active filters.
- Keep advanced syntax optional.

## Review checklist

- Basic search works before structured query features ship.
- Collections and command search reuse the same index where possible.
- Bad queries do not return silent empty states.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Collections DB UI]]
- [[Backlink Model]]
- [[Relationship Graph]]
- [[Performance Plan]]

## Maintenance note

The knowledge layer should always be traceable back to files, links, and the workspace index.
