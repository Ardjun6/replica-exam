# Milestone 1 — acceptance checklist

Each required capability, where it lives, and how to verify it. All items are
implemented.

| # | Requirement | Status | Where | How to verify |
|---|-------------|:------:|-------|---------------|
| 1 | Electron app boots | ✅ | `src/main/main.ts`, `window.ts` | `npm run dev` opens a window |
| 2 | Open an existing folder as a vault | ✅ | `register-ipc.ts` (`vault:open`), `vault-service.ts` | Welcome → *Open vault…* |
| 3 | Create a new vault | ✅ | `register-ipc.ts` (`vault:create`), `vault-service.ts` | Welcome → *Create new vault…* (seeds a welcome note) |
| 4 | `.obsidian-replica/` config folder | ✅ | `shared/settings.ts` (`CONFIG_DIR`), `config-store.ts` | Folder appears in the vault after open/create |
| 5 | Notes are real `.md` files | ✅ | `vault-fs.ts` | Open the files in any editor |
| 6 | File explorer (tree) | ✅ | `components/FileExplorer.tsx` | Left column lists folders-first |
| 7 | Create note / folder | ✅ | `FileExplorer.tsx`, `path:create` | Toolbar ＋ / ⊞ buttons |
| 8 | Rename note / folder | ✅ | `FileExplorer.tsx`, `path:rename` | Hover a row → ✎ |
| 9 | Delete note / folder | ✅ | `FileExplorer.tsx`, `path:delete` | Hover a row → 🗑 (confirms first) |
| 10 | Editor with save | ✅ | `components/EditorPane.tsx`, `editor/createEditor.ts` | Type; autosaves after a pause, or `Ctrl/Cmd-S` |
| 11 | Markdown preview | ✅ | `components/PreviewPane.tsx`, `editor/preview.ts` | Right of editor when preview is on; sanitized HTML |
| 12 | `[[wikilink]]` detection | ✅ | `core/markdown/wikilinks.ts` | Unit tests + links styled in preview |
| 13 | Wikilink rendering | ✅ | `editor/preview.ts`, `app.css` | Links shown; unresolved ones dimmed/dashed |
| 14 | Click a wikilink to open | ✅ | `PreviewPane.tsx` (`resolveLink`) | Click an existing `[[link]]` |
| 15 | Click-to-create missing notes | ✅ | `PreviewPane.tsx` | Click a dimmed `[[link]]` → confirm → created & opened |
| 16 | Backlinks pane | ✅ | `components/BacklinksPane.tsx`, `core/index/backlinks.ts` | Right pane → *Backlinks* |
| 17 | Search | ✅ | `components/SearchPane.tsx`, `core/search/search.ts` | Right pane → *Search* |
| 18 | Graph view | ✅ | `components/GraphView.tsx`, `core/graph/graph.ts` | Right pane → *Graph*; drag/zoom; click a node |
| 19 | Persisted settings + light/dark theme | ✅ | `shared/settings.ts`, `config-store.ts`, `StatusBar.tsx` | Toggle theme in the status bar; restart — it persists |

## Security baseline (cross-cutting, also required)

- Context isolation **on**, sandbox **on**, `nodeIntegration` **off** — `window.ts`.
- Strict Content-Security-Policy — `window.ts`.
- Renderer never sees the filesystem; only the audited `ReplicaApi` is exposed — `preload/preload.ts`.
- Every IPC handler verifies the **sender** and **validates the payload**, returning a `Result` — `ipc/register-ipc.ts`, `ipc/validate.ts`.
- Path-traversal and absolute-path rejection, with a second re-anchor before I/O — `core/path/vault-path.ts`, `main/vault/vault-fs.ts`.
- No Obsidian code, assets, or branding; own config-folder name and own versioned schemas.

## Wikilink grammar covered

`[[Note]]`, `[[Folder/Note]]`, `[[Note|Alias]]`, `[[Note#Heading]]`,
`[[Note#^block-id]]`, `![[Embed]]`, and missing-but-creatable links. Links inside
inline code and fenced code blocks are correctly ignored. See
`tests/wikilinks.test.ts`.

## Automated test coverage

`npm test` runs the pure-core suite:

- `tests/vault-path.test.ts` — normalization, traversal/absolute rejection,
  extension handling, name/parent helpers.
- `tests/wikilinks.test.ts` — every link form, offsets, code masking.
- `tests/frontmatter.test.ts` — scalars, inline/block lists, quoting, the
  unterminated-fence and not-at-top edge cases.
- `tests/backlinks.test.ts` — resolution (path/name/alias), backlinks including
  update-after-edit, search (case-insensitive, AND, title weighting), graph nodes
  and edges including dim nodes.

`npm run test:e2e` runs a Playwright smoke test that launches the built Electron
app, asserts the welcome screen renders, and confirms the preload bridge is
present (and that nothing more is exposed).

## Verified offline during the build

The pure `core/` and `shared/` modules type-check cleanly and all **37** unit
tests pass when run through Node’s test runner. The Electron shell and the React
renderer require `npm install` (Electron, React, CodeMirror, Vite) and are run on
your machine via `npm run dev` / `npm run build`.

## Milestone links

- Next: [[MILESTONE-2]]
