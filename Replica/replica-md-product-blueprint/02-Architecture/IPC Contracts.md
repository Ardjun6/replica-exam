---
title: "IPC Contracts"
product: "Replica.md"
area: "Architecture"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Desktop Shell]]"
  - "[[Workspace and Filesystem]]"
  - "[[Search and Query Language]]"
  - "[[Security and Permissions]]"
---

# IPC Contracts

IPC contracts are the working agreement between the desktop host and the interface. They should be small, typed, versioned where necessary, and written as product infrastructure rather than incidental glue.

## Contract rules

- Expose named workspace actions such as read, write, list, watch, reveal, and export.
- Return structured errors with user-facing recovery hints.
- Avoid passing raw host objects or unbounded file handles into renderer code.

## Versioning

- Keep schema changes backwards-compatible during a release cycle.
- Document dangerous operations separately from read-only calls.
- Review extension-facing IPC before exposing it through the extension API.

## Review checklist

- Every IPC method has input, output, error, and permission notes.
- Renderer code can be tested with mocked contracts.
- High-risk calls link to security and permissions.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Desktop Shell]]
- [[Workspace and Filesystem]]
- [[Search and Query Language]]
- [[Security and Permissions]]

## Maintenance note

Treat this page as a boundary note: when the boundary changes, update the linked contracts too.
