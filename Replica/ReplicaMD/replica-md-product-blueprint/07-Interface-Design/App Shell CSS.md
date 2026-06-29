---
title: "App Shell CSS"
product: "Replica.md"
area: "Interface Design"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Renderer Shell]]"
  - "[[Tabs Panes and Workspaces]]"
  - "[[CSS Snippets and Themes]]"
  - "[[Accessibility and i18n]]"
---

# App Shell CSS

App shell CSS defines the frame around the workspace: sidebars, top bars, panes, modals, menus, status areas, and empty states. It should make the product feel stable before any theme adds personality.

## Shell areas

- Workspace explorer, command search, tabs, pane headers, status bar, right sidebar, dialogs, and notifications.
- Layout tokens for spacing, borders, surfaces, shadows, and z-index layers.
- Responsive rules for narrow windows and mobile-like widths.

## CSS rules

- Use variables that themes can override safely.
- Avoid styling that depends on private component internals.
- Keep focus, hover, disabled, and active states consistent.

## Review checklist

- The shell remains usable with the default theme only.
- Themes can override documented variables without layout collapse.
- Keyboard focus is visible in every shell area.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Renderer Shell]]
- [[Tabs Panes and Workspaces]]
- [[CSS Snippets and Themes]]
- [[Accessibility and i18n]]

## Maintenance note

Visual changes should support clarity first and customization second.
