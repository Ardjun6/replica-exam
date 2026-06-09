# Local Verification

Milestone 2 has been verified locally with the real npm dependencies, Electron
binary, renderer, and Playwright smoke test.

## Latest Result

- `npm install` completed successfully.
- `npm run check` passed.
- `npm run build` passed.
- `npm run test:e2e` passed.
- `npm run dev` rendered the welcome/vault chooser UI.
- The preload bridge was present as `window.replica`.
- The app renderer had no red runtime errors.

The `Autofill.enable` and `Autofill.setAddresses` messages seen in DevTools are
DevTools protocol messages, not Replica renderer errors.

## Commands

```bash
npm install
npm run check
npm run build
npm run test:e2e
npm run dev
```

`npm run check` runs `typecheck`, `lint`, `format:check`, and `test`.
`npm run test:e2e` should be run after `npm run build` because it launches the
built Electron app from `out/`.

## What Each Command Proves

- `npm install`: dependencies install, including the Electron binary.
- `npm run check`: node/web typecheck, ESLint, Prettier check, and Vitest unit
  tests all pass.
- `npm run build`: electron-vite bundles main, preload, and renderer.
- `npm run test:e2e`: Playwright launches the built Electron app, the app window
  opens, the renderer mounts, the welcome UI appears, and the preload bridge is
  exposed.
- `npm run dev`: the development Electron path opens the real app renderer with
  hot reload.

## Final Fixes Documented

- Lint/format scope ignores the checked-in reference vault folder
  `markdown-files-of-what-we-are-building-ALWAYS-READ-ME/`.
- The shared IPC contract is fully wired through `Indexer`, IPC registration,
  and preload for `getLocalGraph` and `listNotes`.
- The e2e smoke test clears `ELECTRON_RUN_AS_NODE` before launching Electron, so
  Playwright does not inherit a terminal environment that makes Electron behave
  like Node.
- No React mounting bug remained after those fixes. The blank-screen
  investigation confirmed the real app renderer renders the welcome UI; earlier
  red console messages came from the docked DevTools window.

## Files Changed In The Verification Pass

- `.prettierignore`
- `eslint.config.js`
- `src/main/indexer/indexer.ts`
- `src/main/ipc/register-ipc.ts`
- `src/preload/preload.ts`
- `tests/e2e/smoke.spec.ts`
- Formatting-only cleanup in `src/core/fuzzy/score.ts`,
  `src/core/search/search.ts`, `tests/search-query.test.ts`, and
  `tests/search.test.ts`

No temporary debugging scripts, logs, or screenshots are required for the final
state.

## Manual Checks To Repeat If Needed

- Launch `npm run dev` and confirm the welcome/vault chooser appears.
- In the app renderer console, confirm `typeof window.replica === "object"`.
- Confirm the app renderer console has no red runtime errors.
- Open/create a vault and spot-check wikilink autocomplete, preview rendering,
  tag counts, folder expansion persistence, and external file updates.
