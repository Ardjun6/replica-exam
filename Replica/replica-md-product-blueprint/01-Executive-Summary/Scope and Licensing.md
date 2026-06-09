---
title: "Scope and Licensing"
product: "Replica.md"
area: "Executive Summary"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Technical Evidence Base]]"
  - "[[Configuration Profile]]"
  - "[[Theme Manifest and Guidelines]]"
---

# Scope and Licensing

This page draws the line around what Replica.md includes, what it deliberately leaves out, and how the project should handle third-party code. Scope control matters because a workspace app can become too broad before the core writing experience is stable.

## In scope

- Markdown editing, local workspace management, backlinks, search, graph navigation, maps, collections, themes, and a permissioned extension layer.
- Reference implementations for desktop first, with mobile and sync described as follow-on layers.
- Plain export paths so the user can leave with usable files.

## Licensing notes

- Track every library used by the shell, editor, renderer, syntax highlighter, packaging layer, and extension system.
- Keep license text with release artifacts where required.
- Review extension marketplace submissions for bundled dependencies and copied assets.

## Review checklist

- No feature enters the roadmap without an owner and release stage.
- Dependency licenses are listed before a public build is shipped.
- The document links to technical evidence and release planning.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Technical Evidence Base]]
- [[Configuration Profile]]
- [[Theme Manifest and Guidelines]]

## Maintenance note

Use this note when briefing stakeholders or deciding whether a feature belongs in the first release.
