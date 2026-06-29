---
title: "Version History"
product: "Replica.md"
area: "Distribution"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Release and Update Process]]"
  - "[[Decision Log]]"
  - "[[Configuration Profile]]"
  - "[[Open Questions and Limits]]"
---

# Version History

Version history should tell the story of changes in a way users and contributors can scan. It is not a dumping ground for commit messages; it should focus on what changed, why it matters, and whether the change affects files or extensions.

## Changelog format

- Group entries by added, changed, fixed, removed, security, migration, and known issues.
- Mark workspace, profile, map, collection, and extension schema changes clearly.
- Link major changes to decision log entries when needed.

## Maintenance

- Keep unreleased notes during development.
- Move confirmed release notes into dated sections.
- Do not hide breaking changes inside vague wording.

## Review checklist

- A user can see whether an update affects their files.
- Contributors can trace important changes to implementation notes.
- Known issues stay visible until resolved.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Release and Update Process]]
- [[Decision Log]]
- [[Configuration Profile]]
- [[Open Questions and Limits]]

## Maintenance note

Do not mark this area ready until failure and recovery cases have been tested.
