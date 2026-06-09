---
title: "Editor CSS"
product: "Replica.md"
area: "Interface Design"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[CodeMirror 6]]"
  - "[[Live Preview]]"
  - "[[Code Blocks and Prism]]"
  - "[[Accessibility and i18n]]"
---

# Editor CSS

Editor CSS controls the writing surface. The goal is simple: readable text, clear structure, predictable spacing, and visible editing state across source mode and live preview.

## Styled elements

- Headings, paragraphs, lists, blockquotes, code, links, unresolved links, tables, tasks, embeds, properties, selections, and cursor-adjacent controls.
- Live preview decorations that do not disturb writing rhythm.
- Print and export-friendly defaults where possible.

## Accessibility

- Maintain contrast for selected text, links, and syntax marks.
- Respect font scaling and reduced-motion preferences.
- Keep focus indicators visible around editable widgets.

## Review checklist

- Long writing sessions remain comfortable.
- Source and preview modes feel related but not identical where editing requires clarity.
- Themes can adjust editor variables without breaking structure.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[CodeMirror 6]]
- [[Live Preview]]
- [[Code Blocks and Prism]]
- [[Accessibility and i18n]]

## Maintenance note

Visual changes should support clarity first and customization second.
