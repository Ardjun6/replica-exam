---
title: "Live Preview"
product: "Replica.md"
area: "Editor"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[CodeMirror 6]]"
  - "[[Markdown Renderer]]"
  - "[[Editor CSS]]"
  - "[[Accessibility and i18n]]"
---

# Live Preview

Live preview is the bridge between writing Markdown and seeing the finished page. It should reduce context switching while staying honest about what is stored in the file.

## Preview behavior

- Inline rendering for headings, formatting, links, images, math, Mermaid, and selected embeds.
- Editing stays possible around rendered elements without surprising cursor jumps.
- Source Markdown remains available when a preview element cannot be edited directly.

## Design notes

- Prioritize stable cursor movement over flashy rendering.
- Use clear placeholders for unresolved links and missing assets.
- Keep preview output aligned with the standalone Markdown renderer.

## Review checklist

- Live preview and reading mode render the same content rules.
- Complex pages remain editable.
- Users can always inspect the underlying Markdown.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[CodeMirror 6]]
- [[Markdown Renderer]]
- [[Editor CSS]]
- [[Accessibility and i18n]]

## Maintenance note

Check this page against real editing behavior, not only screenshots or static examples.
