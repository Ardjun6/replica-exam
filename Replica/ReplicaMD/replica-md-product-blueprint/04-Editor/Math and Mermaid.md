---
title: "Math and Mermaid"
product: "Replica.md"
area: "Editor"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Markdown Renderer]]"
  - "[[Markdown Syntax Matrix]]"
  - "[[Security and Permissions]]"
  - "[[Performance Plan]]"
---

# Math and Mermaid

Math and Mermaid support should make technical notes readable without compromising performance or safety. These blocks are valuable because they turn plain Markdown into explainable diagrams and formulas while keeping the source portable.

## Supported content

- Inline and block math with clear error states.
- Mermaid diagrams rendered from fenced code blocks.
- Fallback source display when rendering fails or is disabled.

## Safety and performance

- Render diagrams in a controlled environment.
- Cache successful renders where practical.
- Do not let a broken diagram interrupt the rest of the page.

## Review checklist

- Invalid math or diagrams show readable errors.
- Diagram rendering cannot execute arbitrary workspace content.
- Exports preserve either the rendered output or clear source fallback.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Markdown Renderer]]
- [[Markdown Syntax Matrix]]
- [[Security and Permissions]]
- [[Performance Plan]]

## Maintenance note

Check this page against real editing behavior, not only screenshots or static examples.
