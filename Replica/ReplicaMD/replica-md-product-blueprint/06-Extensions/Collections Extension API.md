---
title: "Collections Extension API"
product: "Replica.md"
area: "Extensions"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Collections DB UI]]"
  - "[[Extension API]]"
  - "[[Extension Manifest]]"
  - "[[Security and Permissions]]"
---

# Collections Extension API

The collections extension API lets approved extensions add collection views, field types, or query helpers without taking control of the user’s data. Extensions should enhance the view layer while the Markdown and index models remain the source of truth.

## API surface

- Register view renderers, computed fields, filters, sort helpers, and lightweight actions.
- Declare required permissions in the extension manifest.
- Receive collection data through safe, typed snapshots rather than raw workspace access by default.

## Guardrails

- Do not let extensions rewrite many pages without explicit user action.
- Keep extension failures isolated from built-in collection views.
- Show extension attribution inside custom views.

## Review checklist

- Custom views can be disabled without losing data.
- Permission prompts describe collection access clearly.
- API behavior links back to the main extension contract.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Collections DB UI]]
- [[Extension API]]
- [[Extension Manifest]]
- [[Security and Permissions]]

## Maintenance note

Extension features should be useful only when they stay inside the permission model.
