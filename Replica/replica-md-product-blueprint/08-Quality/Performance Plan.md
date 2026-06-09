---
title: "Performance Plan"
product: "Replica.md"
area: "Quality"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Workspace and Filesystem]]"
  - "[[Search and Query Language]]"
  - "[[Relationship Graph]]"
  - "[[Test Strategy]]"
---

# Performance Plan

Performance should be measured around real workspace behavior: opening a folder, typing in a long note, indexing changed files, searching, rendering heavy pages, and drawing relationship views.

## Measurement areas

- Startup time, workspace scan time, incremental indexing, editor input latency, search response, graph rendering, map interaction, and memory use.
- Separate cold start, warm start, small workspace, and large workspace results.
- Track performance budgets before adding visual polish.

## Engineering approach

- Index incrementally and avoid blocking typing.
- Cache derived data that can be rebuilt.
- Move expensive work away from the renderer where possible.

## Review checklist

- Performance budgets are documented for the first release.
- Slow operations show progress or partial results.
- Regression tests include large sample workspaces.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Workspace and Filesystem]]
- [[Search and Query Language]]
- [[Relationship Graph]]
- [[Test Strategy]]

## Maintenance note

Keep this page practical: risks, tests, limits, and recovery paths should be visible.
