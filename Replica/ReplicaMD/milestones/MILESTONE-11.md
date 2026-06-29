# Milestone 11 — Link navigation in the editor

Audit note: this file documents a link-navigation follow-up, not the planned
export milestone. Safe note export remains planned in `MILESTONE-11-PLAN.md`
and is not implemented yet.

Clicking an internal link in a note now opens it. When the Live
Preview editor was rebuilt on CodeMirror (Milestone 9), the old
block-swap editor's click-to-open handler did not come with it:
wikilinks were *styled* and `[[`-autocompleted, but clicking one did
nothing, and the Backlinks pane stayed empty because nobody navigated.
This restores the core knowledge-base workflow.

## What shipped

- **Click an internal link to follow it.** A plain left-click on a
  rendered `[[wikilink]]`, `[[Target|Alias]]`, `[[Target#Heading]]`, or
  an internal `[text](note.md)` link opens the target note. If the
  target doesn't exist yet, the app offers to create it (then opens
  it) — the same resolve/create path the old editor used.
- **Editing still works.** A link the caret is already inside shows its
  raw Markdown (as before), and clicking there just places the caret —
  navigation only triggers on links that are currently rendered, so you
  never get trapped unable to edit a link.
- **External links are left alone.** `http(s)://` and `mailto:` targets
  are not followed (a separate, deferred concern); only in-vault notes
  navigate.
- **Backlinks populate** as a result: opening a target shows the notes
  that link to it.

## How it works

- `src/renderer/editor/livePreview/link-target.ts` — a pure,
  unit-tested `findLinkAt(lineText, col)` that returns the link
  construct covering a column and its clean target (alias/anchor
  stripped, percent-decoding handled). No React/DOM/CM/IPC.
- `src/renderer/editor/livePreview/linkNavigation.ts` — a small
  CodeMirror `domEventHandlers.mousedown` extension. It maps the click
  to a document position, asks `findLinkAt` for a target, and — only
  when the caret is not already inside that link — calls back to the
  renderer and prevents the default caret placement.
- `createLivePreviewEditor` gained an `onFollowLink` option;
  `LivePreviewPane` supplies it (through a ref, so the once-created
  editor always calls the latest closure) and resolves via the existing
  typed `resolveLink` / `createPath` preload methods, then `onOpenNote`.
  No new IPC; the renderer stays filesystem-free.

## Tests

- `tests/live-preview-links.test.ts` (11 cases) — wikilink/alias/anchor
  parsing, internal vs external markdown links, percent-decoding, edge
  columns, multiple links on a line, no-match.
- `tests/e2e/note-links.spec.ts` — opens a note, clicks a `[[Target]]`,
  asserts the target note opens and a backlink to the source appears.
- Full suite: **50 files / 632 tests** green. Build green. E2E smoke,
  note-table, and note-links green.

## Known issue (pre-existing, unrelated)

- The Canvas connect-handle E2E remains environment-sensitive at 120%
  zoom (a tiny pointer hit-test); it fails identically with this
  milestone's changes stashed, so it is not a regression here.

## Deferred / next

- Following external (`http(s)`) links from the editor (needs an
  audited `openExternal` preload method).
- `Cmd/Ctrl+click` to open in a split pane.
- Hover preview of a linked note.
- Keyboard follow (Enter while the caret is on a link).

End of milestone.

## Milestone links

- Previous: [[MILESTONE-11-PLAN]]
- Next: [[MILESTONE-12]]
- Plan: [[MILESTONE-11-PLAN]]
