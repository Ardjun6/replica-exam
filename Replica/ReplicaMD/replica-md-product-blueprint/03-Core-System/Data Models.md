---
title: "Data Models"
product: "Replica.md"
area: "Core System"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Workspace and Filesystem]]"
  - "[[Backlink Model]]"
  - "[[Workspace Layout Files]]"
  - "[[JSON Examples]]"
---

# Data Models

Data models define how Replica.md talks about pages, links, blocks, attachments, properties, maps, collections, and extension data. Clear models keep the editor, graph, search, and sync layers from drifting apart.

## Core entities

- Page: a Markdown file plus parsed metadata, headings, links, and blocks.
- Attachment: a non-Markdown file with path, type, size, and preview policy.
- Relationship: a link, embed, tag, property reference, map edge, or indexed mention.

## Model rules

- Store durable information in files or profile JSON, not hidden memory.
- Keep computed index data rebuildable.
- Use path normalization before comparing or storing references.

## Review checklist

- Each model states whether it is source data, profile data, or derived index data.
- Search, backlinks, graph, and collections share the same relationship definitions.
- Sync can serialize model changes without app-specific surprises.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Workspace and Filesystem]]
- [[Backlink Model]]
- [[Workspace Layout Files]]
- [[JSON Examples]]

## Maintenance note

This page should stay aligned with the real workspace files and configuration examples.
