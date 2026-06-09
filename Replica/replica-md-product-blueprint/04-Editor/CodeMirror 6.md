---
title: "CodeMirror 6"
product: "Replica.md"
area: "Editor"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Live Preview]]"
  - "[[Wikilink Autocomplete]]"
  - "[[Markdown Renderer]]"
  - "[[Editor CSS]]"
---

# CodeMirror 6

CodeMirror 6 is the editing foundation for Markdown pages. Replica.md should use it for a focused writing surface, not as a place to hide product behavior that belongs in the index or renderer.

## Editor duties

- Markdown editing, cursor state, selection handling, syntax highlighting, input rules, and composition support.
- Extensions for wikilink completion, properties, code fences, math, callouts, and block references.
- Clean handoff between source editing and live preview.

## Integration notes

- Keep workspace parsing separate from editor decorations.
- Measure performance on long pages and dense links.
- Test IME, screen readers, mobile keyboards, and paste behavior early.

## Review checklist

- Typing remains responsive on large notes.
- Editor extensions can be disabled without breaking file parsing.
- Live preview and source mode use the same Markdown contract.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Live Preview]]
- [[Wikilink Autocomplete]]
- [[Markdown Renderer]]
- [[Editor CSS]]

## Maintenance note

Check this page against real editing behavior, not only screenshots or static examples.
