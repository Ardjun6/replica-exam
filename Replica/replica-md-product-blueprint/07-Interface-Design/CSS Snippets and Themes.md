---
title: "CSS Snippets and Themes"
product: "Replica.md"
area: "Interface Design"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Theme Manifest and Guidelines]]"
  - "[[App Shell CSS]]"
  - "[[Editor CSS]]"
  - "[[Graph and Map CSS]]"
---

# CSS Snippets and Themes

CSS snippets give advanced users a lightweight way to customize their workspace. Themes set the broad visual system; snippets should make small, local changes without pretending to be a full extension system.

## Snippet behavior

- Load enabled snippets from the `.replica` profile.
- Let users enable, disable, edit, and reload snippets safely.
- Show broken CSS as a styling issue, not an app failure.

## Theme relationship

- Themes define the main tokens and layout expectations.
- Snippets may override documented variables and selected classes.
- The UI should make it clear when a visual issue comes from a snippet.

## Review checklist

- Disabling snippets restores the base theme.
- Snippet files are easy to find and edit.
- Dangerous or unsupported styling is documented.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Theme Manifest and Guidelines]]
- [[App Shell CSS]]
- [[Editor CSS]]
- [[Graph and Map CSS]]

## Maintenance note

Visual changes should support clarity first and customization second.
