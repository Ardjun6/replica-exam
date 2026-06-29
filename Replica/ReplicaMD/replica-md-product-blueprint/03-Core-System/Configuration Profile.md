---
title: "Configuration Profile"
product: "Replica.md"
area: "Core System"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Workspace and Filesystem]]"
  - "[[Workspace Layout Files]]"
  - "[[JSON Examples]]"
  - "[[Security and Permissions]]"
---

# Configuration Profile

The `.replica` profile stores workspace preferences and app-owned metadata. It should be readable enough for advanced users, but strict enough that the app can validate and repair it.

## Profile contents

- Appearance settings, hotkeys, active workspace layout, graph options, sync status, enabled extensions, and snippets.
- Theme and extension folders with their own manifests.
- Schema versions so migrations can run safely.

## Handling rules

- Never hide user notes in the profile folder.
- Back up profile files before destructive migrations.
- Keep defaults documented so a damaged profile can be regenerated.

## Review checklist

- Every profile JSON file has a schema version or migration rule.
- Invalid settings fail safely.
- Profile contents link to workspace layout, themes, sync, and extensions.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Workspace and Filesystem]]
- [[Workspace Layout Files]]
- [[JSON Examples]]
- [[Security and Permissions]]

## Maintenance note

This page should stay aligned with the real workspace files and configuration examples.
