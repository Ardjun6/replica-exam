---
title: "URI Scheme"
product: "Replica.md"
area: "Distribution"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Desktop Shell]]"
  - "[[Mobile Runtime]]"
  - "[[Security and Permissions]]"
  - "[[IPC Contracts]]"
---

# URI Scheme

The URI scheme lets external tools open Replica.md workspaces, pages, headings, searches, maps, and commands. It should be useful, but not a back door around permissions.

## Supported actions

- Open app, open workspace, open page, open heading, run search, open collection, open map, and create a new note with optional text.
- Normalize paths and reject ambiguous workspace targets.
- Prompt before running actions that modify files.

## Safety

- Treat incoming URIs as untrusted input.
- Log parse errors without exposing private paths unnecessarily.
- Keep destructive operations out of the first scheme version.

## Review checklist

- URI actions have documented examples.
- Invalid links fail safely.
- External calls cannot bypass workspace trust prompts.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Desktop Shell]]
- [[Mobile Runtime]]
- [[Security and Permissions]]
- [[IPC Contracts]]

## Maintenance note

Do not mark this area ready until failure and recovery cases have been tested.
