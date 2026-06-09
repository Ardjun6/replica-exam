---
title: "Code Blocks and Prism"
product: "Replica.md"
area: "Editor"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Markdown Renderer]]"
  - "[[Editor CSS]]"
  - "[[Security and Permissions]]"
  - "[[Performance Plan]]"
---

# Code Blocks and Prism

Code blocks need to be readable, easy to reuse, and predictable. Prism can handle highlighting, while Replica.md owns the surrounding behavior: titles, language labels, reuse actions, wrapping, and safe rendering.

## Code block behavior

- Detect language from fenced code info strings.
- Render highlighted code in preview without executing it.
- Provide reuse, wrap, and plain-text fallback controls.

## Safety notes

- Unknown languages should render as plain code.
- Code examples in documentation should avoid secrets and live credentials.
- Highlighting should not block the page renderer.

## Review checklist

- Common languages render cleanly.
- Large code blocks do not freeze preview.
- Reuse action preserves the original code text.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Markdown Renderer]]
- [[Editor CSS]]
- [[Security and Permissions]]
- [[Performance Plan]]

## Maintenance note

Check this page against real editing behavior, not only screenshots or static examples.
