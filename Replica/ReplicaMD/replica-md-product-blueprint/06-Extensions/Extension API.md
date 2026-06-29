---
title: "Extension API"
product: "Replica.md"
area: "Extensions"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Extension Manifest]]"
  - "[[Community Extension Workflow]]"
  - "[[Renderer Shell]]"
  - "[[Security and Permissions]]"
---

# Extension API

The extension API lets Replica.md grow without weakening the core workspace model. The API should feel useful to builders while still protecting files, privacy, performance, and the writing experience.

## Core capabilities

- Register commands, views, panels, editor extensions, collection helpers, map tools, themes, and settings pages.
- Request permissions for workspace read/write, network, clipboard, commands, views, and profile storage.
- Receive lifecycle events for load, unload, workspace change, and settings updates.

## Design rules

- Default to no file access.
- Make extension failures visible but contained.
- Version APIs and deprecate them with enough time for maintainers.

## Review checklist

- Extensions cannot access files without permission.
- An extension can be disabled cleanly.
- API examples match the manifest and security notes.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Extension Manifest]]
- [[Community Extension Workflow]]
- [[Renderer Shell]]
- [[Security and Permissions]]

## Maintenance note

Extension features should be useful only when they stay inside the permission model.
