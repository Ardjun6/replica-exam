---
title: "Test Strategy"
product: "Replica.md"
area: "Quality"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Performance Plan]]"
  - "[[Security and Permissions]]"
  - "[[Markdown Syntax Matrix]]"
  - "[[Release and Update Process]]"
---

# Test Strategy

The test strategy should protect the parts of Replica.md users will trust most: files, editing, links, search, sync, permissions, and recovery. Visual polish matters, but file safety comes first.

## Test layers

- Unit tests for parsers, path handling, schemas, query parsing, and permission checks.
- Integration tests for workspace indexing, editor-renderer consistency, collection views, maps, and extension loading.
- End-to-end tests for opening a workspace, editing, linking, renaming, exporting, and recovering from errors.

## Fixtures

- Small workspace for quick checks.
- Large workspace for performance regressions.
- Broken workspace for missing files, malformed frontmatter, invalid profile JSON, and failed migrations.

## Review checklist

- File writes are covered by regression tests.
- Renderer and editor use shared Markdown fixtures.
- Release candidates run the full workspace test set.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Performance Plan]]
- [[Security and Permissions]]
- [[Markdown Syntax Matrix]]
- [[Release and Update Process]]

## Maintenance note

Keep this page practical: risks, tests, limits, and recovery paths should be visible.
