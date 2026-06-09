---
title: "Graph and Map CSS"
product: "Replica.md"
area: "Interface Design"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Relationship Graph]]"
  - "[[Map UI]]"
  - "[[App Shell CSS]]"
  - "[[Performance Plan]]"
---

# Graph and Map CSS

Graph and map CSS covers two visual systems that can become noisy quickly. The default styling should make nodes, edges, labels, groups, filters, and selections easy to read.

## Visual states

- Default, hover, selected, focused, muted, unresolved, attachment, group, and error states.
- Edge labels and direction indicators that stay legible at different zoom levels.
- Minimap, controls, and filter chips that do not cover important canvas content.

## Theme hooks

- Expose tokens for node fill, edge stroke, selection outline, group background, and label text.
- Keep contrast usable in both light and dark modes.
- Avoid relying on color alone to show relationship type.

## Review checklist

- Graphs remain readable with many nodes.
- Selection and focus are visible without color-only cues.
- Map styling follows the same relationship language as the graph.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Relationship Graph]]
- [[Map UI]]
- [[App Shell CSS]]
- [[Performance Plan]]

## Maintenance note

Visual changes should support clarity first and customization second.
