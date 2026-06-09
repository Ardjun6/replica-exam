---
title: "Release and Update Process"
product: "Replica.md"
area: "Distribution"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Decision Log]]"
  - "[[Version History]]"
  - "[[Security and Permissions]]"
  - "[[Test Strategy]]"
---

# Release and Update Process

The release process should make updates feel safe. A workspace app touches personal files, so every release needs migration notes, rollback thinking, and tests around file operations.

## Release stages

- Internal build, workspace regression set, signed beta, release candidate, public build, and post-release monitoring.
- Schema migrations for profile files, maps, collections, and extension manifests.
- Clear changelog entries for user-visible changes and breaking extension changes.

## Update safety

- Back up profile files before migrations.
- Never change user Markdown without an explicit user action or tested migration.
- Gate risky features behind preview flags until stable.

## Review checklist

- A release can be rolled back without losing workspace data.
- Migrations are tested against older sample workspaces.
- The changelog separates fixes, features, migrations, and known issues.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Decision Log]]
- [[Version History]]
- [[Security and Permissions]]
- [[Test Strategy]]

## Maintenance note

Do not mark this area ready until failure and recovery cases have been tested.
