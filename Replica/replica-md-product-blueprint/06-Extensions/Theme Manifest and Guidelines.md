---
title: "Theme Manifest and Guidelines"
product: "Replica.md"
area: "Extensions"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[CSS Snippets and Themes]]"
  - "[[App Shell CSS]]"
  - "[[Editor CSS]]"
  - "[[Marketplace and Review]]"
---

# Theme Manifest and Guidelines

Themes should change the look of Replica.md without breaking readability or hiding state. A theme manifest gives the app enough information to install, preview, validate, and remove a theme cleanly.

## Theme package

- Manifest with name, version, author, supported modes, minimum app version, and CSS entry points.
- CSS variables for surfaces, text, borders, accents, selections, code, links, and graph elements.
- Preview metadata for light, dark, and high-contrast checks.

## Guidelines

- Respect focus states and contrast.
- Do not use styling to hide warnings, unresolved links, or permission labels.
- Keep layout changes modest unless the theme declares an advanced mode.

## Review checklist

- Themes can be disabled without damaging workspace state.
- Contrast and focus states pass accessibility checks.
- Theme CSS uses documented variables where possible.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[CSS Snippets and Themes]]
- [[App Shell CSS]]
- [[Editor CSS]]
- [[Marketplace and Review]]

## Maintenance note

Extension features should be useful only when they stay inside the permission model.
