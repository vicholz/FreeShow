# Testing Guide

How FreeShow is tested, and how to run and extend the checks.

## Table of Contents
- [The Test Suite](#the-test-suite)
- [End-to-End Tests (Playwright)](#end-to-end-tests-playwright)
- [Static Checks](#static-checks)
- [Manual Testing](#manual-testing)
- [Writing New Tests](#writing-new-tests)

---

## The Test Suite

```bash
npm test
```

runs three things in sequence (see `package.json`):

| Command | What it checks |
|---------|----------------|
| `npm run test:playwright` | Launches the built app end-to-end (Playwright + Electron) |
| `npm run test:format` | Prettier formatting of `src/` and `scripts/` |
| `npm run test:svelte` | `svelte-check` — TypeScript/Svelte diagnostics across the frontend |

📝 There is no unit-test layer in this branch — correctness relies on the E2E smoke test, type checking, and manual testing. (Adding focused unit tests for pure logic modules is a welcome contribution.)

---

## End-to-End Tests (Playwright)

Config: `config/testing/playwright.config.ts` • Test: `config/testing/start.test.ts`

The E2E test launches the real Electron app:

```typescript
const electronApp = await electron.launch({
    args: ["."],
    env: { ...process.env, NODE_ENV: "production", FS_MOCK_STORE_PATH: tmpSettingFolder.name },
})
```

It then walks the real first-run flow: picks the English language, confirms the data-folder dialog (mocked), clicks "Get Started!", and asserts the app reaches the main UI.

Key techniques it uses (copy these when extending):

- **`FS_MOCK_STORE_PATH`** is passed to the app with a temp directory, intended to isolate settings from your real profile
- **Dialog mocking** — native dialogs are replaced from the test:
  ```typescript
  await electronApp.evaluate(async ({ dialog }, folder) => {
      dialog.showOpenDialogSync = () => [folder]
  }, tmpDataFolder.name)
  ```
- Network calls to the GitHub releases API are aborted (`context.route(...)`) so update checks can't interfere

### Running

```bash
npm run build            # E2E runs against the BUILT app (NODE_ENV=production)
npm run test:playwright
```

⚠️ Build first — the test loads `build/electron/index.js` and the production bundle, not the Vite dev server. On Linux CI, run under `xvfb-run` if there's no display.

---

## Static Checks

```bash
npm run test:svelte      # svelte-check: type errors in .svelte + frontend .ts
npm run test:format      # prettier --check (config/formatting/.prettierrc.yaml)
npm run lint             # ESLint (electron + frontend + svelte) + Stylelint
npm run format:prettier  # auto-format everything
```

Formatting rules worth knowing (`.prettierrc.yaml`): 4-space indent, **no semicolons**, double quotes, print width 500.

📝 `svelte-check` has a pre-existing backlog of diagnostics — the practical bar for PRs is *no new errors*, not zero total.

---

## Manual Testing

Because FreeShow is a live-presentation tool, several things only show up outside automated tests. A useful pass after non-trivial changes:

1. **Main window:** create a show, add slides, edit text, undo/redo (`Ctrl+Z`)
2. **Output:** enable an output window, present slides, clear layers, play a video background
3. **Second window class:** stage display output (if your change touches outputs/stage)
4. **Web clients:** open `http://localhost:5510` (Remote) and `5511` (Stage) in a browser — navigate slides from the phone-sized viewport
5. **Persistence:** `Ctrl+S`, quit, relaunch — is your state still correct?
6. **Production build:** `npm run build && npm run pack`, then run the app from `dist/` — dev and prod load differently (see [Vite & Build](07-VITE-BUILD.md#gotchas))

---

## Writing New Tests

### Extending the E2E suite

Add `*.test.ts` files under `config/testing/` — the Playwright config picks them up. Pattern to follow (`start.test.ts`):

```typescript
import { _electron as electron } from "playwright"
import { expect, test } from "@playwright/test"
import tmp from "tmp"

test("My feature works", async () => {
    const store = tmp.dirSync({ unsafeCleanup: true })
    const app = await electron.launch({
        args: ["."],
        env: { ...process.env, NODE_ENV: "production", FS_MOCK_STORE_PATH: store.name },
    })

    const window = await app.waitForEvent("window")
    await window.click("text=Projects")         // drive the UI
    expect(await window.title()).toContain("FreeShow")

    await app.close()
})
```

Tips:
- Give the app startup time (the existing test waits after `waitForEvent("window")`)
- Prefer stable selectors (visible text, `data-*` attributes) over CSS classes
- Always launch with a temp `FS_MOCK_STORE_PATH` and clean up

### Web apps

The server apps (`src/server/*`) are plain browser apps — they can be tested with regular Playwright browser tests against a running FreeShow instance (ports 5510-5513).

---

[← Back to Debugging](10-DEBUGGING.md) | [Back to Index](00-INDEX.md) | [Next: Technologies →](12-TECHNOLOGIES.md)
