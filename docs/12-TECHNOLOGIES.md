# Technology Stack

The libraries and tools FreeShow is built on, and what each is used for.

## Table of Contents
- [Core Stack](#core-stack)
- [Frontend Libraries](#frontend-libraries)
- [Main Process Libraries](#main-process-libraries)
- [Media & Hardware](#media--hardware)
- [Import/Export Libraries](#importexport-libraries)
- [Build & Quality Tooling](#build--quality-tooling)
- [Native Modules](#native-modules)

---

## Core Stack

| Technology | Version | Role |
|------------|---------|------|
| **Electron** | 37.x | Desktop shell — main process + renderers |
| **Svelte** | 3.59 | UI framework (compiled, no virtual DOM) |
| **TypeScript** | 4.9 | Language for all three codebases |
| **Vite** | 4.5 | Frontend + server-app builds, dev server |
| **Socket.io** | 4.8 | Realtime app ↔ web-client communication |
| **Express** | 4.x | Serves the four web apps |
| **Node.js** | (bundled with Electron) | Main-process runtime |

Why these were chosen is covered in [Architecture → Technology Choices](01-ARCHITECTURE.md#technology-choices).

---

## Frontend Libraries

| Library | Used for |
|---------|----------|
| `svelte-preprocess` | SCSS + TypeScript inside `.svelte` files |
| `uid` | Short unique ids (shows, slides, listeners) |
| `dayjs` | Date/time formatting (calendar, timers) |
| `chord-transposer` | Transposing song chords |
| `json-bible` | Bible file format parsing, reference search |
| `qrcode-generator` | Connection QR codes for web clients |
| `youtube-player` / `@vimeo/player` | Embedded online video players |
| `mp4box` / `ebml` / `pcm-convert` | Media inspection & audio conversion |
| `@sentry/electron` | Error reporting (renderer side too) |

---

## Main Process Libraries

| Library | Used for |
|---------|----------|
| `electron-store` | JSON settings/data stores (see [Electron Guide → Data Storage](06-ELECTRON-GUIDE.md#data-storage)) |
| `electron-updater` | Auto-updates from GitHub releases |
| `electron-builder` | Packaging installers (dev dependency) |
| `better-sqlite3` | SQLite access (reading databases like EasyWorship imports) |
| `bonjour-service` | mDNS/Bonjour discovery of the web servers |
| `axios` / `follow-redirects` | HTTP requests (APIs, media downloads) |
| `@googleapis/drive` | Google Drive cloud sync |
| `osc-js` | OSC protocol for the external control API |
| `jzz` | MIDI input/output |
| `node-machine-id` | Stable device identifier |
| `music-metadata` | Audio tags/duration |
| `exif` | Image metadata |
| `genius-lyrics` | Lyrics search |
| `protobufjs` | Protocol buffer parsing (some import formats / integrations) |

---

## Media & Hardware

| Library | Used for |
|---------|----------|
| `grandiose` (fork) | **NDI** video output (native) |
| `macadam` (fork) | **Blackmagic DeckLink** output (native) |
| `libltc-wrapper` | **LTC timecode** encode/decode (native) |
| `@discordjs/opus` | Opus audio encoding for streams (native) |
| `slideshow` (fork) | Controlling PowerPoint/Keynote/Impress presentations |
| `pdfjs-dist` | Rendering PDF slides |
| `libreoffice-convert` | Converting office documents via LibreOffice |

---

## Import/Export Libraries

| Library | Used for |
|---------|----------|
| `word-extractor` | Reading `.doc` files |
| `mdb-reader` | Reading Access databases (EasyWorship) |
| `better-sqlite3` | SQLite-based song databases |
| `fast-xml-parser` / `xml2js` | XML formats (OpenSong, ProPresenter, OpenLP, ...) |
| `yauzl` / `yazl` | Reading/writing zip archives (project export, `.pro` bundles) |

The converters themselves live in `src/frontend/converters/` — one module per source format.

---

## Build & Quality Tooling

| Tool | Config | Role |
|------|--------|------|
| Vite | `vite.config.mjs`, `config/building/vite.config.servers.mjs` | Bundling + dev server |
| tsc | `config/typescript/*.json` | Electron compilation + type checking |
| Prettier | `config/formatting/.prettierrc.yaml` | Formatting (4 spaces, no semicolons, width 500) |
| ESLint | `config/linting/eslint.*` | Linting per codebase |
| Stylelint | `config/linting/.stylelintrc.json` | CSS/SCSS linting |
| svelte-check | `config/typescript/tsconfig.svelte.json` | Svelte diagnostics |
| Playwright | `config/testing/playwright.config.ts` | E2E test |
| electron-builder | `config/building/electron-builder*.yaml` | Installers |
| npm-run-all / cross-env / kill-port | `package.json` scripts | Script orchestration |

---

## Native Modules

These compile against Electron's Node ABI during `npm install` (`postinstall: electron-builder install-app-deps`):

- `better-sqlite3`
- `@discordjs/opus`
- `grandiose` (NDI — downloads the NDI SDK in its build script)
- `macadam` (Blackmagic SDK)
- `libltc-wrapper` (needs `libltc` headers on Linux)

**Build prerequisites** (from the [README](../README.md)): Python 3.12 + `setuptools`, and a platform C++ toolchain (VS "Desktop development with C++" on Windows, Xcode CLT on macOS, `build-essential`/`libfontconfig1-dev` on Linux).

⚠️ If any of these fail to build, the app still runs — the corresponding feature (NDI, Blackmagic output, timecode, ...) is simply unavailable at runtime.

---

[← Back to Testing](11-TESTING.md) | [Back to Index](00-INDEX.md) | [Next: API Reference →](13-API-REFERENCE.md)
