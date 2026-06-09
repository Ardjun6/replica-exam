---
title: "Audio Attachment Policy"
product: "Replica.md"
area: "Attachments"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Embeds and Attachments]]"
  - "[[Workspace and Filesystem]]"
  - "[[Sync and E2EE]]"
---

# Audio Attachment Policy

Audio attachments should be easy to link, preview, and locate in the workspace. The policy keeps playback useful while avoiding hidden uploads, transcription assumptions, or unsupported editing claims.

## Supported behavior

- Show file name, type, size, duration where available, and playback controls.
- Let users open or reveal the original file.
- Index the attachment relationship even when audio content is not transcribed.

## Limits

- No automatic transcription in the baseline plan.
- Unsupported formats should show a clear fallback.
- Playback must not block page rendering.

## Review checklist

- Audio embeds degrade gracefully.
- Attachment links remain relative where possible.
- Policy links to embeds and attachments.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Embeds and Attachments]]
- [[Workspace and Filesystem]]
- [[Sync and E2EE]]

## Maintenance note

Attachment handling should keep source files easy to find and safe to open.
