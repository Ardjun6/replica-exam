---
title: "Extension Manifest"
product: "Replica.md"
area: "Extensions"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Extension API]]"
  - "[[Marketplace and Review]]"
  - "[[JSON Examples]]"
  - "[[Security and Permissions]]"
---

# Extension Manifest

The extension manifest is the first trust document users and the app see. It should say what the extension is, what it needs, and whether it can run in the current workspace and app version.

## Required fields

- id, name, version, author, description, minimum app version, entry file, permissions, and compatibility flags.
- Optional fields for settings, commands, views, screenshots, support link, and changelog.
- Clear behavior for desktop-only or mobile-compatible extensions.

## Validation

- Reject duplicate ids and invalid versions.
- Show permission changes during updates.
- Keep manifest parsing strict enough to avoid vague runtime failures.

## Review checklist

- Invalid manifests fail before code runs.
- Users can understand requested permissions.
- Manifest examples stay aligned with the extension API.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Extension API]]
- [[Marketplace and Review]]
- [[JSON Examples]]
- [[Security and Permissions]]

## Maintenance note

Extension features should be useful only when they stay inside the permission model.
