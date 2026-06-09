---
title: "Sync and E2EE"
product: "Replica.md"
area: "Distribution"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Workspace and Filesystem]]"
  - "[[Mobile Packaging]]"
  - "[[Security and Permissions]]"
  - "[[Open Questions and Limits]]"
---

# Sync and E2EE

Sync should move workspace changes between devices without asking users to give up ownership of their files. End-to-end encryption belongs in the design before any hosted sync storage is introduced.

## Sync model

- Track file changes, profile changes, attachment updates, deletes, renames, and conflicts.
- Keep encryption keys away from the server side of the system.
- Support selective sync so large attachments do not have to move everywhere.

## Conflict handling

- Show both versions when edits collide.
- Prefer recoverable duplicate files over silent overwrites.
- Explain what changed, where, and when.

## Review checklist

- A workspace can sync between two devices without breaking links.
- Conflicts are visible and recoverable.
- Encryption behavior is documented before remote storage ships.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Workspace and Filesystem]]
- [[Mobile Packaging]]
- [[Security and Permissions]]
- [[Open Questions and Limits]]

## Maintenance note

Do not mark this area ready until failure and recovery cases have been tested.
