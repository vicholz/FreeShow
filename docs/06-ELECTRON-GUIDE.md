# Electron Guide for FreeShow

How the Electron main process works in FreeShow: startup, windows, IPC, and system integration.

## Table of Contents
- [Electron Fundamentals](#electron-fundamentals)
- [Application Startup](#application-startup)
- [Windows](#windows)
- [The Preload Bridge](#the-preload-bridge)
- [IPC Channels](#ipc-channels)
- [IPC Handlers](#ipc-handlers)
- [Output Windows](#output-windows)
- [Data Storage](#data-storage)
- [System Integration](#system-integration)
- [Gotchas](#gotchas)

---

## Electron Fundamentals

Electron runs two kinds of processes:

```
┌────────────────────────────┐      ┌─────────────────────────────┐
│  Main Process (Node.js)    │      │  Renderer Processes         │
│  src/electron/             │ IPC  │  (Chromium)                 │
│                            │◄────►│                             │
│  • Full Node.js APIs       │      │  • Main window (Svelte UI)  │
│  • File system, hardware   │      │  • Output windows           │
│  • Creates BrowserWindows  │      │  • No Node.js access        │
│  • Express/Socket.io       │      │  • Talk via window.api      │
└────────────────────────────┘      └─────────────────────────────┘
```

**Key rule:** Renderers are sandboxed. Everything that touches the file system, network servers, or hardware lives in `src/electron/` and is reached through IPC.

---

## Application Startup

Entry point: `src/electron/index.ts`

The startup sequence (`app.on("ready")` → `startApp()`):

```typescript
async function startApp() {
    setTimeout(createLoading)          // 1. small loading window (public/loading.html)

    await setupStores()                // 2. electron-store instances (settings, shows index, ...)

    registerProtectedProtocol()        // 3. freeshow-protected:// media protocol

    Promise.resolve().then(() => {
        require("./servers")           // 4. Express + Socket.io servers (async)
    })

    createMain()                       // 5. the main BrowserWindow

    powerSaveBlocker.start("prevent-display-sleep")  // 6. keep displays awake
}
```

Other things wired up at module load:
- `isProd` detection (`NODE_ENV === "production"` or packaged binary)
- Application menu (`utils/menuTemplate.ts`)
- Error reporting (`autoErrorReport()` → Sentry)
- Command-line argument parsing (`utils/init.ts`)
- Hardware acceleration toggle (`disableHardwareAcceleration` from the config store)

**Development vs production loading:** in dev the main window loads `http://localhost:3000` (Vite); in production it loads the built `public/index.html` bundle. Output windows load the same frontend bundle but render `MainOutput.svelte` instead of the full UI (selected via the `currentWindow` store).

---

## Windows

| Window | Created by | Renders |
|--------|-----------|---------|
| Loading | `createLoading()` in `index.ts` | `public/loading.html` |
| Main | `createMain()` in `index.ts` | Full Svelte UI (`App.svelte` → `MainLayout`) |
| Outputs | `OutputLifecycle.createOutput()` | `MainOutput.svelte` (slides/stage content) |

Window options live in `src/electron/utils/windowOptions.ts` (`mainOptions`, `outputOptions`, `loadingOptions`). Output windows are typically frameless, always-on-top, and placed on a chosen display.

---

## The Preload Bridge

Location: `src/electron/preload.ts`

The renderer gets exactly one API surface, exposed with `contextBridge`:

```typescript
contextBridge.exposeInMainWorld("api", {
    send: (channel, data, id?) => ipcRenderer.send(channel, data, id),
    receive: (channel, func, id?) => { /* ipcRenderer.on + stored by id */ },
    removeListener: (channel, id) => { /* remove listener registered with id */ },
    ...
})
```

Important details:

- **Every `receive()` call adds a new `ipcRenderer` listener.** Listeners registered with an `id` can be removed with `removeListener(channel, id)` — components that register listeners must clean them up on destroy, or they leak.
- In development, the preload **logs all IPC traffic** to the console (`TO ELECTRON [...]` / `TO CLIENT [...]`), except high-frequency channels which are filtered (`BUFFER`, `MAIN_TIME`, `AUDIO_MAIN`, ...). This is one of the best debugging tools in the app.

---

## IPC Channels

Top-level Electron channels are defined in `src/types/Channels.ts`:

| Channel | Purpose |
|---------|---------|
| `MAIN` | Typed request/response + pushes (the `Main` and `ToMain` enums) |
| `OUTPUT` | Main window ↔ output windows (slides, buffers, video sync) |
| `REMOTE`, `STAGE`, `CONTROLLER`, `OUTPUT_STREAM` | Messages to/from web-app clients |
| `AUDIO`, `NDI`, `BLACKMAGIC`, `CLOUD`, `EXPORT`, `STARTUP` | Feature-specific streams |

The `MAIN` channel carries the **typed API**: each `Main.*` enum value has typed send/return payloads (`src/types/IPC/Main.ts`), and each `ToMain.*` value types an electron→frontend push (`src/types/IPC/ToMain.ts`).

---

## IPC Handlers

Location: `src/electron/IPC/responsesMain.ts`

One big map from channel → handler:

```typescript
export const mainResponses = {
    [Main.VERSION]: () => app.getVersion(),
    [Main.IS_DEV]: () => !isProd,
    [Main.GET_SYSTEM_FONTS]: () => loadFonts(),
    [Main.SAVE]: (data) => saveAppData(data),
    [Main.IMPORT]: (data) => startImport(data),
    [Main.SHOWS]: (data) => loadShows(data),
    // ... ~127 channels
}
```

`receiveMain()` in `src/electron/IPC/main.ts` looks up the handler, awaits it, and — if the message carried a `listenerId` — replies on the same channel so the frontend's `requestMain()` promise resolves.

**Adding a handler** (see also [Adding Features](09-ADDING-FEATURES.md#adding-ipc-communication)):
1. Add the enum value + payload types in `src/types/IPC/Main.ts`
2. Add the handler in `responsesMain.ts`
3. Call it from the frontend with `requestMain(Main.MY_CHANNEL, data)` or `sendMain(...)`

Electron can also push to the frontend (`sendToMain(ToMain.TOAST, "...")`) or make its own requests (`requestToMain(...)`).

---

## Output Windows

Location: `src/electron/output/`

`OutputHelper.ts` is a facade over helpers in `output/helpers/`:

- **`OutputLifecycle`** — create/close output `BrowserWindow`s. Creating an output loads the frontend bundle with the output id, then starts capture if needed (NDI/etc.)
- **`OutputBounds`** — move/resize, display placement
- **`OutputSend`** — `sendToOutputWindow(msg)` broadcasts on the `OUTPUT` channel; per-output filtering via the message's `id`
- **`OutputVisibility`** — show/hide logic
- **`OutputValues`** — applying settings (always-on-top, kiosk, ...)

Content flow: the main window keeps the `outputs` store authoritative and broadcasts changes (`send(OUTPUT, ["OUTPUTS"], data)` in `utils/listeners.ts`); each output window receives it (`receiveOUTPUTasOUTPUT` in `utils/receivers.ts`) and renders its own slice.

**Capture** (`src/electron/capture/`) grabs output frames with `webContents.capturePage()` and fans them out to NDI (`ndi/`), Blackmagic (`blackmagic/`), the OUTPUT_STREAM web app, and stage display mirrors.

---

## Data Storage

Location: `src/electron/data/store.ts` (electron-store instances)

| Store | File | Contents |
|-------|------|----------|
| `config` | `config.json` | Window bounds, data path, machine id |
| `settings` | `settings.json` | App settings (ports, theme, ...) |
| `synced_settings` | `Config/settings_synced.json` (in data folder) | Cloud-syncable settings (scriptures, playlists, ...) |
| `shows` | `shows.json` | Trimmed show index (name/category per id) |
| `stageShows`, `overlays`, `templates`, ... | various | Feature data |
| `cache`, `history`, `media` | various | Caches and usage data |

**Full show contents** are individual `.show` JSON files in the user's data folder (`Documents/FreeShow/Shows/` by default) — only the trimmed index lives in the store. Saving is orchestrated by `data/save.ts` when the frontend sends `Main.SAVE`.

---

## System Integration

- **NDI** — `ndi/NdiSender.ts` via the native `grandiose` module
- **Blackmagic** — `blackmagic/` via native `macadam`
- **MIDI** — `utils/midi.ts` via `jzz`
- **Timecode (LTC/MTC)** — `timecode/` via `libltc-wrapper`
- **Audio capture/output** — `audio/` (opus encoding via `@discordjs/opus`)
- **mDNS discovery** — `data/bonjour.ts` publishes each web server as service type `freeshow`
- **External control APIs** — `utils/api.ts` starts WebSocket (5505), REST (5506) and OSC listeners; `utils/midi.ts` for MIDI actions
- **Content providers** — `contentProviders/` (ChurchApps, Planning Center, Canva, ...)

Native modules are compiled per-platform by `electron-builder install-app-deps` during `npm install`.

---

## Gotchas

⚠️ **Main-process changes need an Electron restart.** `tsc` recompiles in watch mode, but the running process keeps the old code — restart `npm start` (frontend changes hot-reload, main code does not).

⚠️ **Output windows have no devtools by default.** Set `OUTPUT_CONSOLE = true` in `src/electron/index.ts` to open devtools for output windows during development.

⚠️ **Never block the main process.** Long synchronous work (file scans, image processing) freezes every window. Use async APIs; heavy media work already lives in dedicated helpers.

⚠️ **Windows can be destroyed at any time.** Guard `webContents.send` calls with `isDestroyed()` checks — the codebase does this consistently (see `sendToMain`).

---

## Next Steps

1. **[Vite & Build System](07-VITE-BUILD.md)** - How everything gets compiled
2. **[Communication Patterns](04-COMMUNICATION.md)** - The IPC layer in depth
3. **[Adding Features](09-ADDING-FEATURES.md)** - Add your own IPC handler

---

[← Back to Svelte Guide](05-SVELTE-GUIDE.md) | [Back to Index](00-INDEX.md) | [Next: Vite & Build →](07-VITE-BUILD.md)
