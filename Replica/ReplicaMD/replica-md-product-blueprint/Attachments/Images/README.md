---
title: "Image Attachment Policy"
product: "Replica.md"
area: "Attachments"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Embeds and Attachments]]"
  - "[[Editor CSS]]"
  - "[[Performance Plan]]"
---

# Image Attachment Policy

Image attachments are common in notes, guides, maps, and exports. Replica.md should preview them cleanly while keeping the original files visible in the workspace.

## Supported behavior

- Preview common image formats, alt text, dimensions where available, and missing-file states.
- Support relative links and drag-and-drop insertion.
- Include images in publishing only when selected pages require them.

## Limits

- Do not silently compress or rewrite source images.
- Large images should load progressively or with placeholders.
- Unsupported formats should remain openable through the system when possible.

## Review checklist

- Image links survive page moves where link updating is enabled.
- Missing images are easy to diagnose.
- Publish output includes required assets only.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Embeds and Attachments]]
- [[Editor CSS]]
- [[Performance Plan]]

## Maintenance note

Attachment handling should keep source files easy to find and safe to open.
