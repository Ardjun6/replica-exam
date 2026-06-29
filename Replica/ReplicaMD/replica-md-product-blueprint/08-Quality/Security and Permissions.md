---
title: "Security and Permissions"
product: "Replica.md"
area: "Quality"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Desktop Shell]]"
  - "[[IPC Contracts]]"
  - "[[Extension API]]"
  - "[[Sync and E2EE]]"
---

# Security and Permissions

Security in Replica.md starts with respect for local files. The app should do what the user asked, expose risky behavior clearly, and keep extensions and external inputs inside narrow boundaries.

## Security boundaries

- Typed IPC between renderer and desktop shell.
- Permissioned extension capabilities.
- Sanitized Markdown rendering and controlled embed handling.
- Explicit trust prompts for workspaces, URI actions, sync, publishing, and marketplace installs.

## Permission model

- Default to no extension file access.
- Separate read, write, network, clipboard, command, and view permissions.
- Show permission changes during updates and allow users to disable extensions quickly.

## Review checklist

- Extensions cannot read or write files without declared permission.
- Renderer content cannot call native APIs directly.
- Dangerous actions are reviewed before public release.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Desktop Shell]]
- [[IPC Contracts]]
- [[Extension API]]
- [[Sync and E2EE]]

## Maintenance note

Keep this page practical: risks, tests, limits, and recovery paths should be visible.
