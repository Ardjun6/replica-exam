---
title: "Embeds and Attachments"
product: "Replica.md"
area: "Editor"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[PDF Viewer]]"
  - "[[Markdown Renderer]]"
  - "[[Backlink Model]]"
  - "[[Workspace and Filesystem]]"
---

# Embeds and Attachments

Embeds let a page refer to files, images, audio, PDFs, and other pages without turning the workspace into a media manager. The rule is simple: the file stays where the user can find it, and Replica.md adds useful previews where safe.

## Embed types

- Images, PDFs, audio, videos, other Markdown pages, headings, and block references.
- Attachment previews with file name, type, size, and missing-file state.
- Explicit controls for opening the source file or revealing it in the workspace.

## Handling rules

- Never execute embedded content.
- Keep relative links stable when pages move.
- Index embeds as relationships so backlinks and graph views stay accurate.

## Review checklist

- Missing attachments show a useful recovery message.
- Embeds appear in backlink and relationship data.
- Preview policies link to attachment-specific notes.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[PDF Viewer]]
- [[Markdown Renderer]]
- [[Backlink Model]]
- [[Workspace and Filesystem]]

## Maintenance note

Check this page against real editing behavior, not only screenshots or static examples.
