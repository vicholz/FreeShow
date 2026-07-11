# Contributing

How to contribute code to FreeShow: setup, style, and pull requests.

## Table of Contents
- [Getting Set Up](#getting-set-up)
- [Branches and Pull Requests](#branches-and-pull-requests)
- [Code Style](#code-style)
- [Project Conventions](#project-conventions)
- [Before Submitting](#before-submitting)
- [Other Ways to Contribute](#other-ways-to-contribute)
- [Community](#community)

---

## Getting Set Up

1. **Fork** [ChurchApps/FreeShow](https://github.com/ChurchApps/FreeShow) and clone your fork
2. Install prerequisites — Node.js, Python 3.12 + `setuptools`, and a C++ toolchain (see [Quick Start](03-QUICK-START.md#prerequisites))
3. `npm install`
4. `npm start`

---

## Branches and Pull Requests

- The active development branch is **`dev`** — branch from it and target it with your PRs (`main` tracks releases)
- One topic per branch/PR — keep unrelated fixes separate
- Use a descriptive branch name (`fix-stage-display-fonts`, `feature-song-import`)
- In the PR description: what changed, why, and how you tested it. Screenshots/recordings help a lot for UI changes
- Link related issues (`Fixes #1234`)

💡 For larger features, open an issue or ask in Slack first — the maintainers can confirm the approach before you invest the time.

---

## Code Style

Formatting is enforced by Prettier (`config/formatting/.prettierrc.yaml`):

- **4-space indentation**
- **No semicolons**
- **Double quotes**
- Print width 500 (long lines are allowed — don't hand-wrap)

```bash
npm run format:prettier   # format everything
npm run test:format       # check (CI runs this)
npm run lint              # ESLint + Stylelint (some rules auto-fix)
```

TypeScript everywhere; add types for new code (existing `any`s are being reduced over time — don't add new ones without need).

---

## Project Conventions

- **Components:** PascalCase `.svelte`; logic files camelCase `.ts`; type files PascalCase in `src/types/`
- **State:** global state lives in `src/frontend/stores.ts`; persisted state must be wired into the save/load cycle (see [Adding Features → Adding a Store](09-ADDING-FEATURES.md#adding-a-store))
- **Undo/redo:** anything that edits user data (shows, slides, stage layouts) should go through `history()` (`components/helpers/history.ts`)
- **Translations:** no hardcoded UI strings — add keys to `public/lang/en.json` and use `translateText()` / `<T />`
- **IPC:** new channels get typed payloads in `src/types/IPC/Main.ts` (see [Adding Features → IPC](09-ADDING-FEATURES.md#adding-ipc-communication))
- **Reuse inputs:** `components/inputs/` for buttons/fields; theme via CSS variables

---

## Before Submitting

```bash
npm run format:prettier   # 1. format
npm run lint              # 2. lint
npm test                  # 3. E2E + format check + svelte-check
```

Then manually verify (see [Testing → Manual Testing](11-TESTING.md#manual-testing)):

- ✅ The feature works in dev and doesn't break the main window, outputs, or web clients
- ✅ No new `svelte-check` errors (a pre-existing backlog exists — the bar is *no new ones*)
- ✅ State persists across restart if it should
- ✅ For build-related changes: `npm run build && npm run pack` still produces a working app

---

## Other Ways to Contribute

- **Translations** — extend the `public/lang/*.json` dictionaries for your language
- **Documentation** — this `docs/` folder, or the user documentation
- **Bug reports** — [GitHub issues](https://github.com/ChurchApps/FreeShow/issues) with reproduction steps, OS, and app version
- **Testing** — try beta releases and report regressions

---

## Community

- **Slack:** [Live Church Solutions workspace](https://join.slack.com/t/livechurchsolutions/shared_invite/zt-i88etpo5-ZZhYsQwQLVclW12DKtVflg) — introduce yourself, ask questions
- **GitHub Issues:** bugs and feature requests
- **Website:** [freeshow.app](https://freeshow.app)

FreeShow is GPL-3.0 licensed — contributions are accepted under the same license.

---

[← Back to API Reference](13-API-REFERENCE.md) | [Back to Index](00-INDEX.md)
