# Debugging Guide

Troubleshooting techniques for each layer of FreeShow.

## Table of Contents
- [Frontend Debugging](#frontend-debugging)
- [Electron Main Process Debugging](#electron-main-process-debugging)
- [IPC Debugging](#ipc-debugging)
- [Output Window Debugging](#output-window-debugging)
- [Server Debugging](#server-debugging)
- [Common Problems](#common-problems)
- [Error Reporting](#error-reporting)

---

## Frontend Debugging

### DevTools

Open DevTools in the main window: `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS).

### Inspecting stores

Log a store once:

```svelte
$: console.log("activeShow:", $activeShow)
```

Or subscribe from the console side by importing nothing — put a temporary reactive log in the component you're working on.

💡 **Built-in store debugging:** `src/frontend/stores.ts` has a `debugStores` flag at the bottom. Set it to `true` and every store update beyond initialization prints a `console.trace("STORE UPDATE:", key, count)` — great for finding what's causing update storms.

### Svelte-specific issues

- **UI not updating?** Check for array/object *mutation* (needs reassignment — `items = items`).
- **Update loops?** A reactive statement that writes to one of its own dependencies re-triggers itself.
- **Component state surviving when it shouldn't?** Keyed `{#each}` blocks / `{#key}` force re-creation.

---

## Electron Main Process Debugging

Main-process `console.log` output goes to the **terminal** where `npm start` runs (not DevTools).

For breakpoint debugging, launch Electron with an inspector port and attach VS Code or `chrome://inspect`:

```bash
# in package.json start:electron:run, temporarily:
electron --inspect=5858 .
```

⚠️ Remember: after editing `src/electron/**`, restart Electron — the watch mode only recompiles the files.

---

## IPC Debugging

💡 **The preload logs all IPC traffic in development** (`src/electron/preload.ts`):

```
TO ELECTRON [MAIN]:  { channel: "SAVE", data: {...} }
TO CLIENT [MAIN]:    { channel: "SHOWS", data: {...} }
```

Watch the DevTools console while reproducing your issue — you see exactly which channels fire and with what payloads. High-frequency channels (`BUFFER`, `MAIN_TIME`, `AUDIO_MAIN`, `VISUALIZER_DATA`, ...) are filtered out of the log; edit `filteredChannelsData` in `preload.ts` to unhide one temporarily.

### Common IPC issues

| Symptom | Likely cause |
|---------|-------------|
| `IPC Message Timed Out: X` in console (dev) | Handler missing/renamed in `responsesMain.ts`, or it threw before replying |
| `requestMain` resolves `undefined` | Same as above — the promise resolves undefined on timeout, it does not reject |
| `Invalid channel: X` error | Channel string isn't in the `Main`/`ToMain` enums |
| Handler runs but frontend never updates | Response arrives, but nothing writes it to a store — check the callback |
| Listener fires multiple times | `receive()` registered repeatedly without `destroy()` — clean up with the listener id |

---

## Output Window Debugging

Output windows are separate renderers with **no DevTools by default**. Enable them:

```typescript
// src/electron/index.ts
export const OUTPUT_CONSOLE = true
```

Then output windows open with detached DevTools. Useful checks inside an output window:

```javascript
// which IPC listeners exist (leak hunting)
window.api.getListeners?.()
```

Output windows receive their state via `OUTPUT`-channel messages (`receiveOUTPUTasOUTPUT` in `src/frontend/utils/receivers.ts`) — log there to see what arrives.

---

## Server Debugging

Web apps (RemoteShow/StageShow/...) are normal browser apps:

1. Open e.g. `http://localhost:5511` in Chrome and use its DevTools
2. The client logs unhandled channels: `Unhandled message: {...}`
3. On the app side, watch the messages arriving from clients in the main window's DevTools (they flow through `client()` in `src/frontend/utils/sendData.ts`)

Connection issues checklist:
- Is the server enabled? (Settings → Connection — CONTROLLER and OUTPUT_STREAM are off by default)
- Same network + firewall allows the port?
- `connections` store shows the client? (`$connections.STAGE`)
- Max connections limit reached? (default 10, configurable)

---

## Common Problems

### Blank/white Electron window (dev)
Vite isn't serving. Check the terminal for a Vite error, confirm `http://localhost:3000` loads in a browser, restart `npm start`.

### Changes don't appear
- Frontend file → should hot-reload; check the terminal for an HMR error
- Electron file → restart Electron
- Server app file → refresh the browser tab (rebuilt automatically by `watchServers.js`)

### "Port already in use" (5510-5513)
Another FreeShow instance (or zombie process) is running:
```bash
lsof -ti:5511 | xargs kill -9     # macOS/Linux
```

### Show data looks stale
Shows are cached in `showsCache` and only fully loaded on demand (`loadShows()` in `components/helpers/setShow.ts`). The `shows` store holds only the trimmed index.

### Native module errors on startup
`Error: The module ... was compiled against a different Node.js version` → rerun `npm install` (which runs `electron-builder install-app-deps`).

---

## Error Reporting

- Uncaught frontend errors are reported to **Sentry** (`src/frontend/main.ts`) with known-noise filtered (`ERROR_FILTER` in `utils/common.ts`)
- Main-process errors go through `autoErrorReport()` (`src/electron/IPC/responsesMain.ts`)
- In development, both surfaces also print to the console/terminal

When debugging, prefer the console over Sentry — reports are sampled and filtered.

---

[← Back to Adding Features](09-ADDING-FEATURES.md) | [Back to Index](00-INDEX.md) | [Next: Testing →](11-TESTING.md)
