---
title: "Markdown Renderer"
product: "Replica.md"
area: "Editor"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Markdown Syntax Matrix]]"
  - "[[Live Preview]]"
  - "[[Math and Mermaid]]"
  - "[[Security and Permissions]]"
---

# Markdown Renderer

The Markdown renderer turns files into readable pages. It should support the syntax Replica.md promises, reject unsafe output, and make unresolved relationships visible instead of hiding them.

## Renderer scope

- Common Markdown, tables, task lists, fenced code, math, Mermaid, wikilinks, embeds, properties, and callout-style blocks where supported.
- Link resolution against the workspace index.
- Safe HTML handling based on the security model.

## Rendering rules

- Unresolved links stay clickable and searchable.
- Generated anchors should be stable across sessions.
- Renderer output must be usable for publish and static export.

## Review checklist

- The renderer follows the syntax matrix.
- Unsafe content is sanitized or blocked by policy.
- Published pages match local reading mode closely.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Markdown Syntax Matrix]]
- [[Live Preview]]
- [[Math and Mermaid]]
- [[Security and Permissions]]

## Maintenance note

Check this page against real editing behavior, not only screenshots or static examples.
