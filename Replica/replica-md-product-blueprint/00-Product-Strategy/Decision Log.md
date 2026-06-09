---
title: "Decision Log"
product: "Replica.md"
area: "Product Strategy"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[System Overview]]"
  - "[[Security and Permissions]]"
  - "[[Release and Update Process]]"
---

# Decision Log

The decision log records the calls that should not be rediscovered every sprint. It keeps context close to the technical notes so a change to sync, permissions, files, or extensions is backed by the reason it was chosen.

## Decision format

- Record the problem, selected direction, trade-off, and affected areas.
- Keep rejected routes brief, but specific enough to stop the same debate from reopening.
- Date important changes and link them to the page that needs to be updated next.

## Current baseline

- Plain Markdown files are the source of truth.
- The workspace profile lives in `.replica`.
- Extensions start with explicit permissions instead of receiving broad access by default.

## Review checklist

- Every decision has a practical reason, not only a preference.
- Security, sync, and release decisions link back to the affected implementation notes.
- Outdated decisions are amended instead of silently overwritten.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[System Overview]]
- [[Security and Permissions]]
- [[Release and Update Process]]

## Maintenance note

Keep this note close to roadmap conversations so scope changes are recorded while they are still fresh.
