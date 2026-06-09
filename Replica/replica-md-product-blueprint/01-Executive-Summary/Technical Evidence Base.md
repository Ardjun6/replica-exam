---
title: "Technical Evidence Base"
product: "Replica.md"
area: "Executive Summary"
status: "product-concept"
related:
  - "[[README]]"
  - "[[Product Blueprint]]"
  - "[[Scope and Licensing]]"
  - "[[System Overview]]"
  - "[[Markdown Renderer]]"
  - "[[JSON Examples]]"
  - "[[Open Questions and Limits]]"
---

# Technical Evidence Base

The evidence base is where implementation choices are justified. It is not a marketing page; it should hold the short version of why a library, storage pattern, or runtime boundary is reasonable for Replica.md.

## Evidence to keep

- Editor/runtime compatibility notes for CodeMirror, Prism, Mermaid, PDF rendering, and desktop packaging.
- Performance findings from indexing large folders and rendering heavy pages.
- Security notes for extension permissions, sync encryption, and IPC boundaries.

## How to maintain it

- Link claims to tests, prototypes, release notes, or code references when available.
- Separate proven behavior from assumptions that still need a spike.
- Update this page when an architectural decision changes.

## Review checklist

- Build choices can be traced to evidence rather than habit.
- Unverified risks are clearly marked.
- Performance and security notes connect to the quality section.

## Connected notes

- [[README]]
- [[Product Blueprint]]
- [[Scope and Licensing]]
- [[System Overview]]
- [[Markdown Renderer]]
- [[JSON Examples]]
- [[Open Questions and Limits]]

## Maintenance note

Use this note when briefing stakeholders or deciding whether a feature belongs in the first release.
