# API Reference

The key programmatic interfaces: typed IPC, socket messages, and the external control API.

## Table of Contents
- [Typed IPC (Main enum)](#typed-ipc-main-enum)
- [Electron → Frontend Pushes (ToMain)](#electron--frontend-pushes-tomain)
- [Electron Channels](#electron-channels)
- [Web Client Messages](#web-client-messages)
- [Action API (API_ACTIONS)](#action-api-api_actions)
- [External Control API (WebSocket / REST / OSC)](#external-control-api-websocket--rest--osc)

---

## Typed IPC (Main enum)

Location: `src/types/IPC/Main.ts` (~127 channels)

Every frontend↔electron request uses a `Main.*` channel with typed payloads:

```typescript
export enum Main { VERSION = "VERSION", SAVE = "SAVE", IMPORT = "IMPORT", ... }

export interface MainSendPayloads {   // what the frontend sends
    [Main.IMPORT]: { channel: string; format: Format; settings?: any }
    ...
}
export interface MainReturnPayloads { // what the handler returns
    [Main.VERSION]: string
    ...
}
```

**Frontend helpers** (`src/frontend/IPC/main.ts`):

```typescript
sendMain(id, value?)                  // fire-and-forget
await requestMain(id, value?)         // request/response (undefined on timeout)
requestMainMultiple({ [id]: cb, ...}) // batch several requests
receiveMain(id, cb)  → listenerId     // subscribe to pushes on a Main channel
destroyMain(listenerId)               // cleanup
```

**Electron handlers**: the `mainResponses` map in `src/electron/IPC/responsesMain.ts`.

Channel groups (browse the enum for the full list):
- App/system: `VERSION`, `IS_DEV`, `GET_OS`, `IP`, `DEVICE_ID`, `CHECK_RAM_USAGE`, `AUTO_UPDATE`
- Window: `CLOSE`, `MAXIMIZE`, `MINIMIZE`, `FULLSCREEN`
- Data: `SETTINGS`, `SYNCED_SETTINGS`, `SHOWS`, `STAGE`, `OVERLAYS`, `TEMPLATES`, `SAVE`
- Files/media: `IMPORT`, `GET_THUMBNAIL`, `READ_FOLDER`, `FILE_INFO`, `OPEN_FILE`, `OPEN_FOLDER`
- Features: `BIBLE`, `GET_SYSTEM_FONTS`, `SEND_SOCKET_MESSAGE`, MIDI/NDI/timecode channels

---

## Electron → Frontend Pushes (ToMain)

Location: `src/types/IPC/ToMain.ts`

Used when the main process initiates: `sendToMain(ToMain.TOAST, "Saved!")` in electron, `receiveToMain(ToMain.TOAST, cb)` in the frontend. Examples: `ALERT`, `TOAST`, `MENU` (menu bar clicks), `API` (external API actions), `SPELL_CHECK`, `BACKUP`, `PRESENTATION_STATE`, `LESSONS_DONE`.

The main process can also *request* data from the frontend with `requestToMain(...)`.

---

## Electron Channels

Location: `src/types/Channels.ts`

| Channel | Direction | Carries |
|---------|-----------|---------|
| `MAIN` | both | All `Main`/`ToMain` typed messages |
| `OUTPUT` | main window ↔ output windows | `OUTPUTS`, slide data, `BUFFER` frames, video `TIME`/`DATA` sync |
| `REMOTE` / `STAGE` / `CONTROLLER` / `OUTPUT_STREAM` | both | Web-client messages (`{ channel, id?, data }`) |
| `AUDIO` | both | Audio capture/pipeline messages |
| `NDI` / `BLACKMAGIC` / `CLOUD` / `EXPORT` / `STARTUP` | both | Feature streams |

---

## Web Client Messages

All Socket.io messages share one envelope: `{ channel: string, id?: socketId, data: any }`, emitted on the server-name event.

**App-side handler maps** (message `channel` → function):
- `receiveSTAGE` — `src/frontend/utils/stageTalk.ts` (`LAYOUTS`, `REQUEST_PROGRESS`, `GET_DYNAMIC_VALUE`, ...)
- `receiveREMOTE` — `src/frontend/utils/remoteTalk.ts` (`PASSWORD`, `ACCESS`, `SHOWS`, `SHOW`, `OUT`, ...)
- `receiveCONTROLLER` — `src/frontend/utils/controllerTalk.ts`

**Client-side receiver maps**: `src/server/<app>/util/receiver.ts`.

A returned value from an app-side handler is sent back to the requesting socket on the same channel. Store-driven broadcasts (`OUT`, `SLIDES`, `BACKGROUND`, ...) are pushed from `src/frontend/utils/listeners.ts` and `stageTalk.ts`.

📝 RemoteShow requires access before accepting control messages: the client sends `ACCESS` with the password (default generated 4 digits, `remotePassword` store).

---

## Action API (API_ACTIONS)

Location: `src/frontend/components/actions/api.ts`

One flat map of action ids → functions. These are the *same actions* used by MIDI bindings, keyboard shortcut actions, the Companion module, web clients (`API:` channels), and the external control API. Examples:

```
Projects:  id_select_project, next_project_item, name_start_project_item
Shows:     name_select_show, start_show, set_template, change_layout
Slides:    next_slide, previous_slide, random_slide, index_select_slide
Clearing:  restore_output, clear_all, clear_background, clear_slide,
           clear_overlays, clear_audio, clear_next_timer
Media:     start_camera, start_screen, play_media, toggle_playing_media
Audio:     play_audio, start_playlist, playlist_next, change_volume
Timers:    start_timer, pause_timers, stop_timers, set_next_slide_timer
Output:    lock_output, toggle_output_windows, change_output_style
Getters:   get_shows, get_playing_audio_data, ... (return data to the caller)
```

To add one: implement the function, add an entry to `API_ACTIONS`, and it becomes reachable from every trigger surface at once.

---

## External Control API (WebSocket / REST / OSC)

Location: `src/electron/utils/api.ts` — enabled in Settings → Connection ("API"). Third-party tools (e.g. Bitfocus Companion) use this.

| Protocol | Default port | Usage |
|----------|-------------|-------|
| WebSocket (Socket.io) | **5505** | `socket.emit("data", JSON.stringify({ action: "next_slide", ...args }))` |
| REST | **5506** (WebSocket port + 1) | `POST /` with JSON body `{ "action": "next_slide", ...args }` — or `?action=next_slide&data={...}` |
| OSC (UDP) | **5505** | OSC messages mapped onto the same actions |

Every request routes to the same `API_ACTIONS` map above (via `ToMain.API`). Getter actions return JSON; a missing action returns no content.

**REST example:**

```bash
curl -X POST http://localhost:5506/ \
  -H "Content-Type: application/json" \
  -d '{"action": "name_select_show", "value": "Amazing Grace"}'
```

**WebSocket example (Node):**

```javascript
const { io } = require("socket.io-client")
const socket = io("http://localhost:5505")
socket.emit("data", JSON.stringify({ action: "next_slide" }))
socket.on("data", (msg) => console.log("response:", msg))
```

---

[← Back to Technologies](12-TECHNOLOGIES.md) | [Back to Index](00-INDEX.md) | [Next: Contributing →](14-CONTRIBUTING.md)
