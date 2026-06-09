---
title: "Accessibility and i18n"
product: "Replica.md"
area: "Quality"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[App Shell CSS]]"
  - "[[Editor CSS]]"
  - "[[Hotkeys]]"
  - "[[Test Strategy]]"
---

# Accessibility and i18n

Accessibility and internationalization need to be built into the interface from the start. Retrofitting them after the workspace grows would make every command, panel, and editor feature harder to trust.

## Accessibility baseline

- Keyboard navigation for commands, panes, editor controls, dialogs, graph filters, and collection views.
- Visible focus states, readable contrast, reduced motion, screen-reader labels, and semantic structure.
- Error messages that describe what happened and what the user can do next.

## Internationalization baseline

- Externalize interface strings early.
- Support date, time, number, and sorting differences.
- Test text expansion and right-to-left layout before the UI becomes rigid.

## Review checklist

- Core workflows can be completed with a keyboard.
- Strings are not hardcoded inside reusable components.
- The product can explain errors in clear language.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[App Shell CSS]]
- [[Editor CSS]]
- [[Hotkeys]]
- [[Test Strategy]]

## Maintenance note

Keep this page practical: risks, tests, limits, and recovery paths should be visible.
