---
title: "PDF Viewer"
product: "Replica.md"
area: "Editor"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Embeds and Attachments]]"
  - "[[Workspace and Filesystem]]"
  - "[[Performance Plan]]"
  - "[[Security and Permissions]]"
---

# PDF Viewer

The PDF viewer is a workspace preview, not a separate document system. It should let users read attached PDFs, link to them, and understand where they live in the folder.

## Viewer behavior

- Open PDF attachments from links, embeds, search results, and file explorer entries.
- Support paging, zooming, search within the document where available, and open-in-system controls.
- Index the attachment as a relationship even if text extraction is not enabled.

## Boundaries

- Do not edit PDFs in the first version.
- Avoid silent uploads or remote conversion.
- Treat password-protected and damaged files as recoverable states.

## Review checklist

- PDFs open without leaving the workspace context.
- Missing or unsupported PDFs have clear messages.
- Attachment policy links remain visible.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Embeds and Attachments]]
- [[Workspace and Filesystem]]
- [[Performance Plan]]
- [[Security and Permissions]]

## Maintenance note

Check this page against real editing behavior, not only screenshots or static examples.
