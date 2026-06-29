---
title: "System Overview"
product: "Replica.md"
area: "Architecture"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Management Summary]]"
  - "[[Desktop Shell]]"
  - "[[IPC Contracts]]"
  - "[[Workspace and Filesystem]]"
  - "[[Search and Query Language]]"
---

# System Overview

The system is built around one practical idea: Replica.md reads a workspace folder, builds an index over its content, and lets the interface use that index without taking ownership of the user’s files. The desktop shell, renderer, editor, extension layer, and sync layer should all respect that boundary.

## Main pieces

- Workspace adapter for file reads, writes, watching, and path normalization.
- Index service for links, backlinks, properties, attachments, headings, blocks, maps, and collections.
- Renderer/editor surface that can switch between reading, writing, previewing, and inspecting relationships.

## Boundaries

- Desktop APIs stay behind typed IPC contracts.
- Extensions receive only the capabilities they request and the user approves.
- Sync and publishing read from the workspace model instead of inventing a separate content model.

## Review checklist

- The architecture explains how data moves from disk to UI and back.
- Every risky boundary has a linked contract or permissions note.
- The overview is detailed enough to guide a prototype without becoming a full spec.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Management Summary]]
- [[Desktop Shell]]
- [[IPC Contracts]]
- [[Workspace and Filesystem]]
- [[Search and Query Language]]

## Maintenance note

Treat this page as a boundary note: when the boundary changes, update the linked contracts too.
