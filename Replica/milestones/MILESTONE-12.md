# Milestone 12 — Link polish, animated logo, base64 images, and the Plugins hub

This milestone continued the editor work and started the user-requested
"plugins" direction, while a parallel effort (by the maintainer) added
collapsible left/right sidebars.

## What shipped

### Editor / links

- **Autosave no longer jumps the caret.** The note editor reloaded its
  whole document on every `refreshKey` bump (which fires after each
  autosave), resetting the cursor/scroll. It now only replaces the
  document when the on-disk content actually differs, and only steals
  focus on a genuine note switch.
- **External links open in the browser.** Clicking an `http(s)`/`mailto`
  Markdown link follows it via a new, audited `openExternal` IPC
  (`shell.openExternal`, validated to http/https/mailto only — `file:`,
  `javascript:`, etc. are rejected in the main process). Internal
  wikilinks/relative links still open notes; unknown schemes do nothing.

### Animated SVG logo

- The welcome-screen GIF is replaced by an **original animated SVG**
  (`BrandLogo.tsx`): the badge breathes, the layered glyph draws itself
  in and floats, and a ring pulses. All motion is defined in an inline,
  CSP-safe `<style>` and is disabled under `prefers-reduced-motion`. The
  logo also animates in the ribbon. Colors come from theme variables.

### Base64 images

- A note line that is solely a base64 image — `![alt](data:image/...;base64,...)`
  — now renders as an actual `<img>` (a block widget from the editor's
  state field; clicking it drops the caret back to the raw Markdown).
  Only `data:` image URIs render (remote images are intentionally not
  supported, matching "images should only work as base64", and the CSP
  blocks them anyway). Rendered-Markdown surfaces size images too.

### Plugins hub + Colored headings plugin

- The former "Community plugins" placeholder is now a real **Plugins**
  settings section: built-in, local, toggleable feature modules — **not**
  a third-party code loader (nothing is downloaded or executed).
- First plugin: **Colored headings.** Enable it and pick a colour for
  each of H1–H6; the colours apply in both the Live Preview editor and
  rendered Markdown via `--heading-color-1..6` CSS variables. Settings
  are validated strictly over IPC (hex only, ≤6) and normalized
  tolerantly on load.

## Tests

- `tests/external-url.test.ts` — the `openExternal` URL validator.
- `tests/live-preview-links.test.ts` — extended for external vs internal
  link detection.
- `tests/live-preview-decorations.test.ts` — extended with base64 image
  block detection.
- `tests/heading-colors.test.ts` — colored-headings normalization + patch
  validation.
- Full suite: **52 files / 648 tests** green. Build green. E2E smoke,
  note-table, and note-links green (the Canvas connect-handle E2E remains
  a pre-existing zoom/pointer flake, unrelated).

## Planned next (not yet implemented)

### Cloud storage — choose Local or GitHub

A storage-backend choice (Local filesystem, today's default, or a
GitHub repository) is a substantial, security-sensitive milestone and is
**planned, not built**. Sketch:

- **Backend abstraction in main.** Introduce a `VaultStorage` interface
  (`list/read/write/create/delete`) with the current local `VaultFs` as
  one implementation and a `GitHubStorage` as another. The renderer keeps
  using the same typed IPC; only the main-process backend changes.
- **Auth.** A GitHub fine-grained Personal Access Token (repo-scoped),
  entered by the user and stored with the OS keychain (`safeStorage`),
  never in the renderer and never in the vault. No OAuth server.
- **Sync model.** Pull on open, push on save (debounced) via the GitHub
  Contents API; track file SHAs for conflict detection; on conflict,
  keep both versions (`name (conflicted <date>).md`) rather than
  silently overwriting. A status indicator shows syncing/offline/conflict.
- **CSP/network.** Add `connect-src https://api.github.com` (only) in
  production; keep everything else self-only. All requests go through the
  main process; the renderer never holds the token or hits the network.
- **Scope guards.** No arbitrary repos/paths; vault = one repo + optional
  subpath; large-file and binary handling deferred; offline-first so the
  app is fully usable with no network.

### Remaining plugins (planned)

- **Markdown styling plugin** — user-tunable typography (font family,
  size, line height, reading width, code theme) applied via the same
  CSS-variable mechanism as Colored headings. No arbitrary CSS injection.
- **Folder home-page plugin** — choose how a folder's home page looks
  (card grid vs list, what to show, whether to render an `index.md`
  body), persisted per the plugin's settings.

### Smaller follow-ups

- Persist History across restarts.
- `Cmd/Ctrl+click` a link to open in a split; hover preview of a link.
- Base64 images inline (mid-paragraph), not only on their own line.

End of milestone.

## Milestone links

- Previous: [[MILESTONE-11]]
