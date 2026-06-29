---
title: "README"
product: "Replica.md"
area: "Project Hub"
status: "product-concept"
---

# Replica.md Product Blueprint

Replica.md is a plain-file workspace for writing, linking, structuring, and publishing Markdown-based knowledge. This folder is the product blueprint: it defines the app language, the workspace shape, the technical boundaries, and the build path in one connected set of notes.

The package is intentionally written around Replica.md itself. The core terms are workspace, page, backlink, relationship graph, map, collection, command search, extension, profile, and publish pipeline. Those terms appear across the docs, examples, and `.replica` configuration so the product feels internally consistent instead of borrowed.

## Start here

1. [[Product Blueprint]]
2. [[Management Summary]]
3. [[System Overview]]
4. [[Workspace and Filesystem]]
5. [[Markdown Renderer]]
6. [[Backlink Model]]
7. [[Extension API]]
8. [[Security and Permissions]]

## How the folder is organized

### Product Strategy

- [[Decision Log]]
- [[Product Blueprint]]

### Executive Summary

- [[Management Summary]]
- [[Scope and Licensing]]
- [[Technical Evidence Base]]

### Architecture

- [[Desktop Shell]]
- [[IPC Contracts]]
- [[Mobile Runtime]]
- [[Renderer Shell]]
- [[System Overview]]

### Core System

- [[Configuration Profile]]
- [[Data Models]]
- [[Workspace Layout Files]]
- [[Workspace and Filesystem]]

### Editor

- [[Code Blocks and Prism]]
- [[CodeMirror 6]]
- [[Embeds and Attachments]]
- [[Live Preview]]
- [[Markdown Renderer]]
- [[Markdown Syntax Matrix]]
- [[Math and Mermaid]]
- [[PDF Viewer]]
- [[Wikilink Autocomplete]]

### Knowledge Layer

- [[Backlink Model]]
- [[Collections DB UI]]
- [[Command Search]]
- [[Hotkeys]]
- [[Map JSON]]
- [[Map UI]]
- [[Properties and Frontmatter]]
- [[Relationship Graph]]
- [[Search and Query Language]]
- [[Tabs Panes and Workspaces]]
- [[Templates and Daily Notes]]

### Distribution

- [[Mobile Packaging]]
- [[Publish and Static Site]]
- [[Release and Update Process]]
- [[Sync and E2EE]]
- [[URI Scheme]]
- [[Version History]]

### Extensions

- [[Collections Extension API]]
- [[Community Extension Workflow]]
- [[Extension API]]
- [[Extension Manifest]]
- [[Marketplace and Review]]
- [[Theme Manifest and Guidelines]]

### Interface Design

- [[App Shell CSS]]
- [[CSS Snippets and Themes]]
- [[Editor CSS]]
- [[Graph and Map CSS]]
- [[Iconography and Symbols]]

### Quality

- [[Accessibility and i18n]]
- [[Open Questions and Limits]]
- [[Performance Plan]]
- [[Security and Permissions]]
- [[Test Strategy]]

### Reference

- [[Code Snippets]]
- [[Example Map]]
- [[Example Notes]]
- [[JSON Examples]]
- [[YAML Examples]]

### Guide

- [[Guide - Linking Backlinks Graph]]
- [[Guide - Missing Features]]
- [[Guide - Overview]]
- [[Guide - Plugins and Extensions]]
- [[Guide - Setup]]
- [[Guide - Styling and Theming]]
- [[Guide - UI and Editing]]

### Workspace

- [[Inbox]]

### Sample Notes

- [[AI]]
- [[Machine Learning]]

### Templates

- [[Daily Template]]

### Attachments

- [[Audio Attachment Policy]]
- [[Image Attachment Policy]]
- [[PDF Attachment Policy]]

### Daily Notes

- [[2026-05-25]]

### Exports

- [[Exports]]

## Backlink practice

Every major page links back to this hub and to nearby implementation notes. That makes the blueprint navigable inside Replica.md and keeps product strategy, architecture, quality, guides, and examples connected during review.

## Workspace conventions

- User content lives in ordinary Markdown files and attachment folders.
- App-owned workspace settings live in `.replica`.
- Maps and collections are stored as readable JSON files.
- Exports are generated output and should be safe to regenerate.
- The product language should describe Replica.md directly, without competitor framing.
