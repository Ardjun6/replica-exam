---
title: "Publish and Static Site"
product: "Replica.md"
area: "Distribution"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Markdown Renderer]]"
  - "[[Markdown Syntax Matrix]]"
  - "[[Workspace and Filesystem]]"
  - "[[Security and Permissions]]"
---

# Publish and Static Site

Publishing turns selected workspace pages into a static site while keeping private notes private. The pipeline should be explicit: users choose what is included, what is excluded, and how links are transformed.

## Pipeline

- Select pages, attachments, theme, navigation, base URL, and output folder.
- Render Markdown through the same renderer contract used in reading mode.
- Rewrite internal links, unresolved links, embeds, and assets for static hosting.

## Privacy rules

- Do not publish hidden pages by following backlinks unexpectedly.
- Show a preview list before export.
- Keep publish settings in a readable workspace file.

## Review checklist

- Published output can be opened without the app.
- Excluded pages and private attachments stay out of the build.
- Broken links are reported before export.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Markdown Renderer]]
- [[Markdown Syntax Matrix]]
- [[Workspace and Filesystem]]
- [[Security and Permissions]]

## Maintenance note

Do not mark this area ready until failure and recovery cases have been tested.
