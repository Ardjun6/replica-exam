---
title: "YAML Examples"
product: "Replica.md"
area: "Reference"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Properties and Frontmatter]]"
  - "[[Example Notes]]"
  - "[[Templates and Daily Notes]]"
  - "[[JSON Examples]]"
---

# YAML Examples

YAML examples focus on frontmatter and structured page metadata. They should help users and contributors see how properties are stored without needing to inspect parser code.

## Example fields

- title, area, status, tags, related links, created date, updated date, owner, and review state.
- Nested values only when the product supports editing them safely.
- Clear examples for links and lists.

## Handling notes

- Preserve unknown fields where possible.
- Show invalid examples separately if they are useful for tests.
- Keep examples aligned with properties and frontmatter behavior.

## Review checklist

- Examples parse in the same frontmatter parser used by the app.
- Collections can read the fields shown here.
- The examples avoid ambiguous formatting.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Properties and Frontmatter]]
- [[Example Notes]]
- [[Templates and Daily Notes]]
- [[JSON Examples]]

## Maintenance note

Reference files should stay small, current, and easy to compare with the shipped examples.
