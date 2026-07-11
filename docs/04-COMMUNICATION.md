# Communication Patterns

Deep dive into how different parts of FreeShow communicate with each other.

## Table of Contents
- [Overview](#overview)
- [IPC Communication](#ipc-communication)
- [Socket.io Communication](#socketio-communication)
- [Svelte Store Communication](#svelte-store-communication)
- [Data Flow Examples](#data-flow-examples)
- [Best Practices](#best-practices)

---

## Overview

FreeShow uses three primary communication mechanisms:

```
┌─────────────────────────────────────────┐
│  1. IPC (Electron)                      │
│     Main Process ←→ Renderer Process    │
│     • File operations                   │
│     • Window management                 │
│     • Hardware access                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  2. Socket.io (WebSocket)               │
│     Desktop App ←→ Web Clients          │
│     • Remote control commands           │
│     • Stage display updates             │
│     • Real-time synchronization         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  3. Svelte Stores (Reactive State)      │
│     Component ←→ Component              │
│     • UI state                          │
│     • Show data                         │
│     • Settings                          │
└─────────────────────────────────────────┘
```

---

## IPC Communication

IPC (Inter-Process Communication) connects the Electron main process (Node.js) with the renderer process (Chromium/Svelte).

### Why IPC?

**Security:** Renderer process is sandboxed and cannot directly access:
- File system
- Native APIs
- Hardware devices
- System information

**Solution:** Send messages through IPC bridge.

### Architecture

```
┌─────────────────────────────────────────────┐
│  Renderer Process (Frontend)                │
│  src/frontend/                              │
│                                             │
│  Component.svelte                           │
│       ↓                                     │
│  sendMain(channel, data)                    │
│       ↓                                     │
│  window.api.send(MAIN, { channel, data })  │
└──────────────────┬──────────────────────────┘
                   │ IPC
                   │ (contextBridge)
┌──────────────────▼──────────────────────────┐
│  Main Process (Electron)                    │
│  src/electron/                              │
│                                             │
│  ipcMain.on(MAIN, receiveMain)             │
│       ↓                                     │
│  mainResponses[channel](data)               │
│       ↓                                     │
│  return response                            │
└─────────────────────────────────────────────┘
```

### Preload Script (Security Bridge)

Location: `src/electron/preload.ts`

```typescript
import { contextBridge, ipcRenderer } from "electron"

// Expose limited API to renderer
contextBridge.exposeInMainWorld("api", {
  // Send message to main process
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data)
  },
  
  // Receive message from main process
  receive: (channel: string, func: Function) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args))
  },
  
  // Remove listener
  removeListener: (channel: string, func: Function) => {
    ipcRenderer.removeListener(channel, func)
  }
})
```

**Key Points:**
- ✅ Renderer can only use `window.api` methods
- ✅ Cannot directly call `require()` or `import` Node modules
- ✅ Restricted to allowed channels only

### Frontend IPC Helper

Location: `src/frontend/IPC/main.ts`

```typescript
// (simplified — the real file adds full payload typing and cleanup)

// Send one-way message (no response expected)
export function sendMain<ID extends Main>(id: ID, value?: MainSendValue<ID>) {
    window.api.send(MAIN, { channel: id, data: value })
}

// Send request and await the typed response
export async function requestMain<ID extends Main>(
    id: ID,
    value?: MainSendValue<ID>,
    callback?: (data) => void,
    waitingTimeout = 15000
) {
    const listenerId = id + uid(5)
    sendMain(id, value, listenerId) // listenerId travels as a third IPC argument

    // resolves with the response whose listenerId matches;
    // on timeout it logs (in dev) and resolves `undefined` — it does NOT throw
    const returnData = await new Promise((resolve) => { /* listener + timeout */ })

    if (callback) callback(returnData)
    return returnData
}

// Listen for pushed messages from main (returns a listener id for destroyMain())
export function receiveMain<ID extends Main>(id: ID, callback: (data) => void) {
    const listenerId = uid()
    window.api.receive(MAIN, (msg) => {
        if (msg.channel === id) callback(msg.data)
    }, listenerId)
    return listenerId
}
```

⚠️ `requestMain` **resolves `undefined` on timeout instead of rejecting** — check the result before using it. Electron→frontend push channels use the separate `ToMain` enum (`receiveToMain`).

### Electron IPC Handler

Location: `src/electron/IPC/responsesMain.ts`

```typescript
import type { Main } from "../../types/IPC/Main"

// Response handlers for each channel
export const mainResponses: { 
  [key in Main]?: (data: any) => Promise<any> | any 
} = {}

// Example: Handle SHOWS request
mainResponses[Main.SHOWS] = async (data) => {
  const { id } = data
  
  // Load show from file system
  const show = await loadShow(id)
  
  return show
}

// Example: Handle SETTINGS request
mainResponses[Main.SETTINGS] = async (data) => {
  const { key, value } = data
  
  // Save to electron-store
  store.set(key, value)
  
  return { success: true }
}

// Example: Handle IMPORT request
mainResponses[Main.IMPORT] = async (data) => {
  const { files } = data
  
  // Process import (PowerPoint, PDF, etc.)
  const results = await importFiles(files)
  
  return results
}
```

### Receiving Messages in Main

Location: `src/electron/IPC/main.ts`

```typescript
import { ipcMain } from "electron"
import { mainResponses } from "./responsesMain"

const MAIN = "MAIN"

export function receiveMain(event: any, msg: any) {
  const { channel, data, listenerId } = msg
  
  // Find handler
  const handler = mainResponses[channel]
  
  if (!handler) {
    console.error(`No handler for channel: ${channel}`)
    return
  }
  
  // Execute handler
  Promise.resolve(handler(data))
    .then((response) => {
      // Send response back (if listener ID provided)
      if (listenerId) {
        event.sender.send(MAIN, {
          channel,
          data: response,
          listenerId
        })
      }
    })
    .catch((error) => {
      console.error(`Error in handler ${channel}:`, error)
      
      if (listenerId) {
        event.sender.send(MAIN, {
          channel,
          error: error.message,
          listenerId
        })
      }
    })
}

// Register listener
ipcMain.on(MAIN, receiveMain)
```

### IPC Usage Examples

#### Example 1: Load Shows (Request-Response)

**Frontend:**
```svelte
<script lang="ts">
  import { requestMain } from "../IPC/main"
  import { Main } from "../../types/IPC/Main"
  
  async function loadShows() {
    try {
      const shows = await requestMain(Main.SHOWS, {})
      console.log("Shows loaded:", shows)
    } catch (error) {
      console.error("Failed to load shows:", error)
    }
  }
  
  onMount(loadShows)
</script>
```

**Electron:**
```typescript
// src/electron/IPC/responsesMain.ts
mainResponses[Main.SHOWS] = async (data) => {
  const showsData = store.get("shows") || {}
  return showsData
}
```

#### Example 2: Save Setting (One-Way)

**Frontend:**
```svelte
<script lang="ts">
  import { sendMain } from "../IPC/main"
  import { Main } from "../../types/IPC/Main"
  
  function saveSetting(key: string, value: any) {
    sendMain(Main.SETTINGS, { key, value })
  }
  
  function handleChange() {
    saveSetting("theme", "dark")
  }
</script>
```

**Electron:**
```typescript
mainResponses[Main.SETTINGS] = async (data) => {
  const { key, value } = data
  store.set(key, value)
  // No response needed for one-way message
}
```

#### Example 3: File Import (Long-Running Task)

**Frontend:**
```svelte
<script lang="ts">
  import { requestMain } from "../IPC/main"
  import { Main } from "../../types/IPC/Main"
  
  let importing = false
  
  async function importFile(filePath: string) {
    importing = true
    
    try {
      // 30-second timeout for large files
      const result = await requestMain(
        Main.IMPORT, 
        { files: [filePath] },
        30000
      )
      
      console.log("Import complete:", result)
    } catch (error) {
      console.error("Import failed:", error)
    } finally {
      importing = false
    }
  }
</script>

{#if importing}
  <p>Importing...</p>
{/if}
```

**Electron:**
```typescript
mainResponses[Main.IMPORT] = async (data) => {
  const { files } = data
  
  for (const file of files) {
    // This might take time
    const converted = await convertPowerPoint(file)
    const show = await createShow(converted)
    await saveShow(show)
  }
  
  return { success: true, count: files.length }
}
```

### IPC Channels Reference

Location: `src/types/IPC/Main.ts`

```typescript
export enum Main {
  // Storage
  SHOWS = "SHOWS",
  PROJECTS = "PROJECTS",
  OVERLAYS = "OVERLAYS",
  TEMPLATES = "TEMPLATES",
  THEMES = "THEMES",
  SETTINGS = "SETTINGS",
  SYNCED_SETTINGS = "SYNCED_SETTINGS",

  // Files
  IMPORT = "IMPORT",
  SAVE = "SAVE",
  DELETE_SHOWS = "DELETE_SHOWS",
  BIBLE = "BIBLE",

  // Window
  CLOSE = "CLOSE",
  MAXIMIZE = "MAXIMIZE",
  MINIMIZE = "MINIMIZE",
  FULLSCREEN = "FULLSCREEN",

  // System
  VERSION = "VERSION",
  GET_OS = "GET_OS",
  IP = "IP",
  DEVICE_ID = "DEVICE_ID",
  CHECK_RAM_USAGE = "CHECK_RAM_USAGE",

  // Media
  GET_THUMBNAIL = "GET_THUMBNAIL",
  ACCESS_CAMERA_PERMISSION = "ACCESS_CAMERA_PERMISSION",

  // Network
  SEND_SOCKET_MESSAGE = "SEND_SOCKET_MESSAGE",

  // ... ~127 total channels
}
```

📝 Each channel has typed send/return payloads (`MainSendPayloads` / `MainReturnPayloads`) in the same file. High-frequency messages like `BUFFER`, `AUDIO_MAIN` and `VISUALIZER_DATA` are **not** `Main` channels — they travel on the separate `OUTPUT`/`AUDIO` Electron channels (see `src/types/Channels.ts`).

---

## Socket.io Communication

Socket.io enables real-time communication between the desktop app and web clients (browsers).

### Architecture

```
┌──────────────────────────────────────────┐
│  Desktop App (Electron)                  │
│                                          │
│  Frontend (Renderer)                     │
│    ↓                                     │
│  stageTalk.send("BACKGROUND", {...})     │
│    ↓ IPC                                 │
│  Main Process                            │
│    ↓                                     │
│  servers.ts → Socket.io emit             │
└────────────────┬─────────────────────────┘
                 │
                 │ WebSocket
                 │ (Socket.io protocol)
                 ▼
┌──────────────────────────────────────────┐
│  Web Client (Browser)                    │
│                                          │
│  socket.on("STAGE", (msg) => { ... })   │
│    ↓                                     │
│  Update UI with new content              │
└──────────────────────────────────────────┘
```

### Server Setup

Location: `src/electron/servers.ts` (simplified — the real file adds connection limits, Bonjour publishing and restart handling)

```typescript
import express from "express"
import http from "http"
import { Server } from "socket.io"
import { toApp } from "./index"

const serverPorts = { REMOTE: 5510, STAGE: 5511, CONTROLLER: 5512, OUTPUT_STREAM: 5513 }
const ioServers: { [key: string]: Server } = {}

function createServerInstance(id: "REMOTE" | "STAGE" | "CONTROLLER" | "OUTPUT_STREAM") {
    const app = express()
    const server = http.createServer(app)

    // serve the built web app (build/electron/<id>/)
    app.use(express.static(join(__dirname, id.toLowerCase())))

    const io = new Server(server)
    ioServers[id] = io

    io.on("connection", (socket) => {
        // enforce max connection limit, then:
        toApp(id, { channel: "CONNECTION", id: socket.id, data: { name } })

        // CLIENT → APP: forward every message to the renderer on the server's own channel
        socket.on(id, (msg) => toApp(id, msg))

        socket.on("disconnect", () => toApp(id, { channel: "DISCONNECT", id: socket.id }))
    })

    server.listen(serverPorts[id])
}

// APP → CLIENT: the renderer sends on the server-name IPC channel,
// and this bridge emits it to the connected sockets
function registerIpcBridge(id: string) {
    ipcMain.on(id, (_e, msg) => {
        const io = ioServers[id]
        if (msg?.id) io?.to(msg.id).emit(id, msg)  // targeted to one socket
        else io?.emit(id, msg)                     // broadcast
    })
}
```

📝 There is no separate "FROM_SERVER" channel — messages from web clients arrive in the renderer **on the server's own channel name** (`REMOTE`, `STAGE`, ...), and the renderer sends replies back on that same channel. See `src/frontend/utils/receivers.ts` (`window.api.receive(STAGE, ...)`) and `src/frontend/utils/sendData.ts`.

### Client Connection (Browser)

Location: `src/server/stage/util/socket.ts`

```typescript
import { io } from "socket.io-client"
import { receiver, type ReceiverKey } from "./receiver"

const socket = io()

export function initSocket() {
    socket.on("connect", () => {
        send("LAYOUTS") // ask the app which stage layouts exist
    })

    // every message from the app arrives on the "STAGE" event,
    // and is dispatched to a handler map in util/receiver.ts
    socket.on("STAGE", (msg) => {
        const key = msg.channel as ReceiverKey
        if (receiver[key]) receiver[key](msg.data)
    })
}

// Send message to the desktop app
export const send = (channel: string, data: any = null) =>
    socket.emit("STAGE", { id, channel, data })
```

The handlers live in `src/server/stage/util/receiver.ts` — one entry per channel (`LAYOUTS`, `OUT`, `BACKGROUND`, `TIMERS`, ...), each updating the client's Svelte stores.

### Frontend Socket Helper

Sending to web clients does **not** go through a `Main` channel — the renderer sends directly on the server-name IPC channel and the bridge in `servers.ts` emits it to the sockets:

Location: `src/frontend/utils/request.ts`

```typescript
// send a message to all connected clients of a server
export function send(ID: ValidChannels, channels: string[], data: any = null) {
    channels.forEach((channel) => window.api.send(ID, { channel, data }))
}
```

Used like this in `src/frontend/utils/stageTalk.ts`:

```typescript
import { STAGE } from "../../types/Channels"
import { send } from "./request"

// push the current/next background to StageShow clients
export async function sendBackgroundToStage(outputId, updater = get(outputs)) {
    const path = updater[outputId]?.out?.background?.path || ""
    const bg = { path: await getBase64Path(path), mediaStyle: get(media)[path] || {}, ... }
    send(STAGE, ["BACKGROUND"], bg)
}
```

Incoming client requests are answered by handler maps: `receiveSTAGE` in `stageTalk.ts`, `receiveREMOTE` in `remoteTalk.ts`, `receiveCONTROLLER` in `controllerTalk.ts` — dispatched by `sendData()` in `src/frontend/utils/sendData.ts`. Store changes are broadcast automatically by subscriptions in `src/frontend/utils/listeners.ts`.

### Socket Message Flow

```
1. Frontend Component
   ↓
   stageTalk.send("BACKGROUND", data)
   ↓
2. IPC Helper
   ↓
   sendMain(Main.SEND_SOCKET_MESSAGE, { server: "STAGE", ... })
   ↓
3. Electron Main Process
   ↓
   mainResponses[Main.SEND_SOCKET_MESSAGE]
   ↓
4. servers.ts
   ↓
   ioServers["STAGE"].emit("BACKGROUND", data)
   ↓
5. Socket.io (Network)
   ↓
6. Browser Client
   ↓
   socket.on("STAGE", (msg) => { ... })
   ↓
7. Update Display
```

### Socket.io Usage Examples

#### Example 1: Send Slide to Stage

**Frontend:**
```svelte
<script lang="ts">
  import { send } from "../utils/stageTalk"
  
  function nextSlide() {
    const currentSlide = getCurrentSlide()
    
    send("SLIDE", {
      id: currentSlide.id,
      items: currentSlide.items,
      background: currentSlide.background
    })
  }
</script>

<button on:click={nextSlide}>Next Slide</button>
```

**Stage Display (Browser):**
```svelte
<!-- src/server/stage/App.svelte -->
<script lang="ts">
  import { socket } from "./util/socket"
  
  let currentSlide = {}
  
  socket.on("STAGE", (msg) => {
    if (msg.channel === "SLIDE") {
      currentSlide = msg.data
    }
  })
</script>

<div class="slide">
  {#each currentSlide.items || [] as item}
    <div class="item {item.type}">
      {item.text}
    </div>
  {/each}
</div>
```

#### Example 2: Remote Control Next Button

**Remote Control (Browser):**
```svelte
<script lang="ts">
  import { send } from "../util/socket"

  function next() {
    // "API:" channels invoke actions from src/frontend/components/actions/api.ts
    send("API:next_slide")
  }
</script>

<button on:click={next}>Next</button>
```

**Desktop App:**

No component code is needed — the message flows through existing plumbing:

```typescript
// src/frontend/utils/receivers.ts registers, for each server:
window.api.receive(REMOTE, (msg) => client(REMOTE, msg))

// src/frontend/utils/sendData.ts routes it:
// - "API:<id>" channels call API_ACTIONS[id]  (api.ts → next_slide → nextSlideIndividual())
// - other channels call the receiveREMOTE[channel] handler in remoteTalk.ts
// The handler's return value (if any) is sent back to the requesting socket.
```

---

## Svelte Store Communication

Svelte stores provide reactive state management within the frontend application.

### Store Architecture

Location: `src/frontend/stores.ts`

```typescript
import { writable, type Writable } from "svelte/store"

// UI State
export const activePage: Writable<TopViews> = writable("show")
export const activePopup: Writable<null | Popups> = writable(null)
export const focusMode: Writable<boolean> = writable(false)

// Show Data (maps keyed by id, not arrays)
export const activeShow: Writable<null | ShowRef> = writable(null)
export const showsCache: Writable<Shows> = writable({})       // { [showId]: Show }
export const projects: Writable<Projects> = writable({})      // { [projectId]: Project }

// Display State
export const outputs: Writable<Outputs> = writable({})        // { [outputId]: Output }
export const themes: Writable<{ [key: string]: Themes }> = writable({})

// Network — connected clients per server, keyed by socket id
export const connections: Writable<{
    [server: string]: { [socketId: string]: { entered?: boolean; active?: string } }
}> = writable({})
```

### Using Stores in Components

#### Subscribe Pattern

```svelte
<script lang="ts">
  import { activeShow } from "../stores"
  import { onDestroy } from "svelte"
  
  let show
  
  // Manual subscription
  const unsubscribe = activeShow.subscribe(value => {
    show = value
    console.log("Active show changed:", value)
  })
  
  // Clean up on component destroy
  onDestroy(unsubscribe)
</script>

<div>Current show: {show?.name}</div>
```

#### Auto-Subscribe Pattern ($ prefix)

```svelte
<script lang="ts">
  import { activeShow } from "../stores"
  
  // Auto-subscribes and cleans up automatically
  // Access with $activeShow
</script>

<div>Current show: {$activeShow?.name}</div>
```

#### Reactive Statements

```svelte
<script lang="ts">
  import { activeShow, outputs } from "../stores"
  
  // Runs whenever $activeShow changes
  $: if ($activeShow) {
    console.log("Show opened:", $activeShow.name)
    loadSlides($activeShow.id)
  }
  
  // Runs whenever $outputs changes
  $: if ($outputs) {
    updateStageDisplay($outputs)
  }
  
  function loadSlides(showId: string) {
    // Load slides
  }
  
  function updateStageDisplay(outputs: any) {
    // Update stage
  }
</script>
```

### Updating Stores

#### Set Method

```svelte
<script lang="ts">
  import { activeShow } from "../stores"
  
  function openShow(show: Show) {
    // Replace entire value
    activeShow.set({
      id: show.id,
      type: "show"
    })
  }
</script>
```

#### Update Method

```svelte
<script lang="ts">
  import { outputs } from "../stores"
  
  function updateOutput(outputId: string, changes: Partial<Output>) {
    // Update based on current value
    outputs.update(current => ({
      ...current,
      [outputId]: {
        ...current[outputId],
        ...changes
      }
    }))
  }
</script>
```

### Custom Stores

📝 FreeShow's `stores.ts` uses plain `writable()` stores throughout — the pattern below is standard Svelte, useful if you need a store with attached behavior:

```typescript
import { writable } from "svelte/store"

// Create custom store with methods
function createShowStore() {
  const { subscribe, set, update } = writable<Show | null>(null)
  
  return {
    subscribe,
    open: (show: Show) => {
      set(show)
      // Side effects
      saveRecentShow(show.id)
    },
    close: () => {
      set(null)
    },
    updateSlide: (slideId: string, changes: Partial<Slide>) => {
      update(show => {
        if (!show) return show
        
        return {
          ...show,
          slides: show.slides.map(slide =>
            slide.id === slideId
              ? { ...slide, ...changes }
              : slide
          )
        }
      })
    }
  }
}

export const currentShow = createShowStore()
```

---

## Data Flow Examples

### Complete Example: Next Slide from Remote

```
┌─────────────────────────────────────────┐
│ 1. Remote Control (Browser)             │
│    User clicks "Next" button            │
│    ↓                                    │
│    socket.emit("REMOTE", {              │
│      channel: "API:next_slide"          │
│    })                                   │
└────────────────┬────────────────────────┘
                 │ WebSocket
┌────────────────▼────────────────────────┐
│ 2. Electron Main Process                │
│    servers.ts: socket.on("REMOTE")      │
│    ↓                                    │
│    toApp("REMOTE", msg)                 │
│    (IPC channel = "REMOTE")             │
└────────────────┬────────────────────────┘
                 │ IPC
┌────────────────▼────────────────────────┐
│ 3. Frontend (Renderer)                  │
│    receivers.ts: client("REMOTE", msg)  │
│    ↓ sendData()                         │
│    API_ACTIONS.next_slide()             │
│    ↓                                    │
│    outputs store updated (new slide)    │
└────────────────┬────────────────────────┘
                 │ Reactive
┌────────────────▼────────────────────────┐
│ 4. Store subscriptions (listeners.ts)   │
│    outputs.subscribe(...)               │
│    ↓                                    │
│    send(OUTPUT, ["OUTPUTS"], data)      │  → output windows
│    sendData(STAGE, { channel: "OUT" })  │  → stage clients
└────────────────┬────────────────────────┘
                 │ IPC + Socket.io
┌────────────────▼────────────────────────┐
│ 5. Stage Display (Browser)              │
│    socket.on("STAGE", ...) → receiver   │
│    ↓                                    │
│    Update displayed slide               │
└─────────────────────────────────────────┘
```

---

## Best Practices

### IPC Best Practices

✅ **Use request-response for data fetching:**
```typescript
const data = await requestMain(Main.SHOWS, {})
```

✅ **Use one-way for fire-and-forget:**
```typescript
sendMain(Main.LOG_ERROR, { error: err.message })
```

✅ **Set appropriate timeouts:**
```typescript
// Quick operations: 5 seconds
const result = await requestMain(Main.SETTINGS, {}, 5000)

// File operations: 30 seconds
const imported = await requestMain(Main.IMPORT, {}, 30000)
```

✅ **Handle errors:**
```typescript
try {
  const result = await requestMain(Main.IMPORT, data)
} catch (error) {
  if (error.message.includes("timeout")) {
    // Handle timeout
  } else {
    // Handle other errors
  }
}
```

❌ **Don't send large data via IPC:**
```typescript
// Bad: Sending 100MB video file
sendMain(Main.SAVE, { video: largeArrayBuffer })

// Good: Send file path
sendMain(Main.SAVE, { path: "/path/to/video.mp4" })
```

### Socket.io Best Practices

✅ **Batch updates:**
```typescript
// Bad: Send 100 individual messages
items.forEach(item => send("UPDATE", item))

// Good: Send one message with array
send("UPDATE_BATCH", items)
```

✅ **Use channels for organization:**
```typescript
send("SLIDE", slideData)
send("BACKGROUND", backgroundData)
send("OVERLAY", overlayData)
```

✅ **Handle reconnection:**
```typescript
socket.on("reconnect", () => {
  // Resync state
  sendFullState()
})
```

❌ **Don't send high-frequency updates:**
```typescript
// Bad: Send every pixel movement
onMouseMove((x, y) => send("MOUSE", { x, y }))

// Good: Throttle updates
const throttled = throttle((x, y) => {
  send("MOUSE", { x, y })
}, 100)
```

### Store Best Practices

✅ **Use reactive statements:**
```svelte
$: if ($activeShow) loadData()
```

✅ **Derive computed values:**
```svelte
$: slideCount = $activeShow?.slides.length || 0
```

✅ **Clean up subscriptions:**
```svelte
<script>
  import { onDestroy } from "svelte"
  
  const unsubscribe = myStore.subscribe(...)
  onDestroy(unsubscribe)
</script>
```

❌ **Don't mutate store values directly:**
```svelte
// Bad
$activeShow.name = "New Name"

// Good
activeShow.update(show => ({
  ...show,
  name: "New Name"
}))
```

---

[← Back to Quick Start](03-QUICK-START.md) | [Back to Index](00-INDEX.md) | [Next: Svelte Guide →](05-SVELTE-GUIDE.md)
