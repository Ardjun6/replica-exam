---
title: "Wikilink Autocomplete"
product: "Replica.md"
area: "Editor"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[CodeMirror 6]]"
  - "[[Backlink Model]]"
  - "[[Properties and Frontmatter]]"
  - "[[Search and Query Language]]"
---

# Wikilink Autocomplete

Wikilink autocomplete helps users connect pages while they write. It should be quick, forgiving, and grounded in the workspace index.

## Autocomplete behavior

- Suggest existing pages, headings, aliases, blocks, and likely new page names.
- Show path context when titles collide.
- Create unresolved links intentionally rather than treating them as errors.

## Ranking

- Prefer recently used pages, exact title matches, nearby folders, and pages linked from the current context.
- Keep fuzzy matches useful without burying exact results.
- Make selection keyboard-friendly.

## Review checklist

- Autocomplete works in source and live preview editing.
- Duplicate titles are disambiguated.
- Created links are indexed immediately.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[CodeMirror 6]]
- [[Backlink Model]]
- [[Properties and Frontmatter]]
- [[Search and Query Language]]

## Maintenance note

Check this page against real editing behavior, not only screenshots or static examples.
