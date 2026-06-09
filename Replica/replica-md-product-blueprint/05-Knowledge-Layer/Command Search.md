---
title: "Command Search"
product: "Replica.md"
area: "Knowledge Layer"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Hotkeys]]"
  - "[[Search and Query Language]]"
  - "[[Extension API]]"
  - "[[Renderer Shell]]"
---

# Command Search

Command search is the fastest route to actions, pages, views, and settings. It should be reliable enough that users can run the app mostly from the keyboard.

## Search targets

- Commands, pages, headings, collections, maps, templates, settings, recent files, and extension commands.
- Results should show enough context to avoid accidental choices.
- Actions should be grouped so command results do not drown page results.

## Command rules

- Every command has an id, title, category, availability condition, and optional hotkey.
- Extension commands appear with their extension name.
- Dangerous commands require confirmation.

## Review checklist

- Commands remain searchable without assigned shortcuts.
- Unavailable commands explain why they cannot run.
- Search feels fast on large command and page sets.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Hotkeys]]
- [[Search and Query Language]]
- [[Extension API]]
- [[Renderer Shell]]

## Maintenance note

The knowledge layer should always be traceable back to files, links, and the workspace index.
