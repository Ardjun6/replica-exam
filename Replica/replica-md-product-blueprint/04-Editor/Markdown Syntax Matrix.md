---
title: "Markdown Syntax Matrix"
product: "Replica.md"
area: "Editor"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Markdown Renderer]]"
  - "[[Wikilink Autocomplete]]"
  - "[[Properties and Frontmatter]]"
  - "[[Publish and Static Site]]"
---

# Markdown Syntax Matrix

The syntax matrix is the contract for what Replica.md reads, writes, previews, exports, and indexes. It prevents the editor, renderer, and publishing pipeline from each inventing a slightly different Markdown dialect.

## Matrix columns

- Syntax name, source example, editor behavior, preview behavior, index behavior, export behavior, and support status.
- Notes for edge cases such as nested lists, escaped brackets, code fences, and multiline properties.
- Compatibility notes for mobile and static publishing.

## Maintenance

- Add new syntax only when the parser, renderer, and exporter can agree on it.
- Record unsupported syntax explicitly instead of leaving behavior undefined.
- Use examples from real product notes, not isolated toy cases only.

## Review checklist

- Every promised syntax has a test case.
- Editor and renderer differences are documented.
- Syntax changes link to affected components.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Markdown Renderer]]
- [[Wikilink Autocomplete]]
- [[Properties and Frontmatter]]
- [[Publish and Static Site]]

## Maintenance note

Check this page against real editing behavior, not only screenshots or static examples.
