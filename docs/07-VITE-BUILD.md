# Vite & Build System

How FreeShow is built: the development workflow, the three build pipelines, and packaging.

## Table of Contents
- [Overview](#overview)
- [How Vite Works](#how-vite-works)
- [Development Mode](#development-mode)
- [The Three Build Pipelines](#the-three-build-pipelines)
- [Production Build](#production-build)
- [Packaging](#packaging)
- [Configuration Files](#configuration-files)
- [Gotchas](#gotchas)

---

## Overview

FreeShow has **three separately built parts**:

| Part | Source | Tool | Output |
|------|--------|------|--------|
| Frontend (main UI + output windows) | `src/frontend/` | Vite | `public/build/bundle.js` + `bundle.css` |
| Web server apps (×4) | `src/server/` | Vite (one build per app) | `build/electron/<remote\|stage\|controller\|output_stream>/` |
| Electron main process | `src/electron/` | TypeScript compiler | `build/electron/*.js` |

---

## How Vite Works

**Development:** Vite serves source files over native ES modules — no bundling. Changing a file triggers Hot Module Replacement (HMR): only that module is re-sent to the browser/Electron window, usually preserving state.

**Production:** Vite bundles with Rollup under the hood into optimized static files.

FreeShow's frontend config (`vite.config.mjs`):

```javascript
export default defineConfig({
    plugins: [svelte({ preprocess: sveltePreprocess() })],
    server: { port: 3000 },          // dev server (fixed port)
    build: {
        outDir: "public/build",
        rollupOptions: {
            output: {                 // single-file IIFE bundle
                entryFileNames: "bundle.js",
                assetFileNames: "bundle.css"
            }
        }
    }
})
```

The bundle is an IIFE (not ESM) so the same `public/index.html` can load it with a plain `<script>` tag inside Electron.

---

## Development Mode

`npm start` runs `scripts/start.js`, which orchestrates:

```
1. kill-port 3000                     # clear a stale Vite instance
2. scripts/preBuild.js                # prepare build dirs/configs
3. scripts/vite/createServerFiles.js  # build all 4 server apps (dev mode)
4. npx vite                           # frontend dev server on :3000   ─┐ parallel
5. scripts/vite/watchServers.js       # rebuild server apps on change  ─┤
6. npm run start:electron (after 5s)  # tsc watch + electron .         ─┘
```

What reloads when:

| You edit | What happens |
|----------|-------------|
| `src/frontend/**` | Vite HMR — instant in the Electron window |
| `src/electron/**` | `tsc -w` recompiles → **restart Electron** to load it |
| `src/server/**` | `watchServers.js` rebuilds the app → refresh the browser tab |
| `src/types/**` | Used by all three — restart to be safe |

💡 The Electron window loads `http://localhost:3000` in dev. If you see a blank window, check that Vite actually started (port conflict, compile error).

---

## The Three Build Pipelines

### 1. Frontend (Vite)

```bash
npm run build:frontend:prod   # → public/build/bundle.js + bundle.css
```

One Svelte app serves both the main window and output windows — `currentWindow` (set per window at startup) decides whether `App.svelte` renders the full UI or `MainOutput.svelte`.

### 2. Server apps (Vite, ×4)

```bash
npm run build:servers:prod    # scripts/vite/createServerFiles.js
```

The script runs `vite build --config config/building/vite.config.servers.mjs` **once per app**, selecting each with the `VITE_SERVER_ID` env var (`remote`, `stage`, `controller`, `output_stream`). Output goes to `build/electron/<id>/` (`index.html` + `client.js`), which Express serves at runtime.

### 3. Electron main (tsc)

```bash
npm run build:electron:prod   # tsc --p config/typescript/tsconfig.electron.prod.json
```

Plain TypeScript compilation of `src/electron/` + `src/types/` into CommonJS at `build/electron/`.

---

## Production Build

```bash
npm run build
```

runs, in order (via pre/post hooks):

```
prebuild    scripts/preBuild.js      # generates tsconfig.*.prod.json, prepares index.html
build       frontend → servers → electron (the three pipelines above)
postbuild   scripts/postBuild.js     # minifies electron JS, rewrites public/index.html
                                     # to load the built bundle, copies assets,
                                     # removes the generated prod tsconfigs
```

⚠️ The `tsconfig.*.prod.json` files referenced by the build scripts **do not exist in the repo** — `preBuild.js` generates them and `postBuild.js` deletes them. If a standalone `npm run build:electron:prod` complains about a missing config, that's why: run the full `npm run build` (or `preBuild.js` first).

⚠️ `postBuild.js` also edits `public/index.html` in place (dev uses the Vite entry, production uses `./build/bundle.js`). A failed/interrupted build can leave it in the production state — `git checkout -- public/index.html` restores it.

---

## Packaging

electron-builder wraps `build/` + `public/` + `node_modules` into installers:

```bash
npm run pack       # unpacked app in dist/ (fast, for local testing)
npm run release    # platform installers + publish (used by CI)
```

Config: `config/building/electron-builder.yaml`

- **Windows:** NSIS installer (+ code signing config)
- **macOS:** DMG/ZIP (+ notarization)
- **Linux:** AppImage, deb, rpm (+ separate ARM config `electron-builder-lnxarm.yaml`, snap via `snapcraft.yaml`)
- `files:` includes `build/electron/**` and `public/**`; native modules (`grandiose`, `macadam`, ...) are unpacked from the asar archive where required (`asarUnpack`)

---

## Configuration Files

```
vite.config.mjs                          # frontend (dev server + prod build)
svelte.config.mjs                        # svelte-preprocess (SCSS, TS)
config/building/vite.config.servers.mjs  # the 4 web apps (VITE_SERVER_ID)
config/building/electron-builder*.yaml   # packaging
config/typescript/tsconfig.electron.json # main process
config/typescript/tsconfig.svelte.json   # frontend type checking (svelte-check)
config/typescript/tsconfig.server.json   # web apps
scripts/start.js                         # dev orchestration
scripts/preBuild.js / postBuild.js       # prod build bracketing
scripts/vite/createServerFiles.js        # server builds
scripts/vite/watchServers.js             # server rebuild-on-change (dev)
```

---

## Gotchas

⚠️ **Dev and prod load differently.** Dev = Vite dev server (`localhost:3000`), prod = static `bundle.js`. Path handling, CSP behavior, and timing can differ — test production behavior with `npm run build && npm run pack` before assuming a bug is fixed.

⚠️ **Port 3000 is hardcoded.** Another process on 3000 gets killed by `start.js`; if that fails, Electron shows a blank window.

⚠️ **Server apps are separate bundles.** Shared code lives in `src/server/common/`; importing from `src/frontend/` into a server app will break its build (only `src/types/` is shared everywhere).

⚠️ **`npm install` compiles native modules.** The `postinstall` hook runs `electron-builder install-app-deps`, which rebuilds `grandiose`/`macadam`/`better-sqlite3`/etc. against Electron's ABI — this is why Python + a C++ toolchain are prerequisites.

---

## Next Steps

1. **[Common Patterns](08-COMMON-PATTERNS.md)** - Code patterns used across the app
2. **[Quick Start](03-QUICK-START.md)** - The commands in day-to-day use
3. **[Testing Guide](11-TESTING.md)** - Verifying your build

---

[← Back to Electron Guide](06-ELECTRON-GUIDE.md) | [Back to Index](00-INDEX.md) | [Next: Common Patterns →](08-COMMON-PATTERNS.md)
