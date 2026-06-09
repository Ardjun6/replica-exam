---
title: "Collections DB UI"
product: "Replica.md"
area: "Knowledge Layer"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Properties and Frontmatter]]"
  - "[[Search and Query Language]]"
  - "[[Collections Extension API]]"
  - "[[JSON Examples]]"
---

# Collections DB UI

Collections turn workspace pages into structured views without moving the notes into a database. A collection is a saved lens over files, properties, tags, folders, and relationships.

## Collection views

- Table, board, list, and gallery-style layouts can share the same query model.
- Columns come from frontmatter, computed fields, file data, and relationship counts.
- Editing a property updates the Markdown source, not a hidden record.

## Product rules

- Collections should explain their query in plain language.
- Broken fields or missing values should be visible.
- Users must be able to open the original page from every row.

## Review checklist

- Collection data can be rebuilt from files.
- Property edits round-trip safely into Markdown.
- Views link to the query language and data model notes.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Properties and Frontmatter]]
- [[Search and Query Language]]
- [[Collections Extension API]]
- [[JSON Examples]]

## Maintenance note

The knowledge layer should always be traceable back to files, links, and the workspace index.
