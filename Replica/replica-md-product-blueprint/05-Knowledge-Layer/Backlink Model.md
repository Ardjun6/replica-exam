---
title: "Backlink Model"
product: "Replica.md"
area: "Knowledge Layer"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Wikilink Autocomplete]]"
  - "[[Relationship Graph]]"
  - "[[Properties and Frontmatter]]"
  - "[[Search and Query Language]]"
---

# Backlink Model

Backlinks are part of the workspace index, not a panel-specific feature. The model should explain what counts as an incoming reference and how Replica.md handles aliases, headings, embeds, unresolved links, and renamed pages.

## Reference types

- Page links, heading links, block links, embeds, tag mentions, property references, map edges, and collection-derived references where useful.
- Resolved and unresolved links should both remain searchable.
- Aliases can point to the same page without hiding the original file name.

## Indexing rules

- Update backlinks after file edits, renames, deletes, and external changes.
- Keep enough context to show a useful preview around each mention.
- Separate direct links from weaker mentions so the UI can filter them.

## Review checklist

- Backlink results match the graph relationship data.
- Renames preserve incoming links where safe.
- Each backlink shows source, context, and relationship type.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Wikilink Autocomplete]]
- [[Relationship Graph]]
- [[Properties and Frontmatter]]
- [[Search and Query Language]]

## Maintenance note

The knowledge layer should always be traceable back to files, links, and the workspace index.
