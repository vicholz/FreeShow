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
import { uid } from "uid"
import type { Main } from "../../types/IPC/Main"

const MAIN = "MAIN"

// Send one-way message (no response expected)
export function sendMain(channel: Main, data: any) {
  window.api.send(MAIN, { channel, data })
}

// Send request and await response
export async function requestMain(
  channel: Main, 
  data: any,
  timeout: number = 15000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const listenerId = uid()
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      window.api.removeListener(MAIN, listener)
      reject(new Error(`IPC timeout: ${channel}`))
    }, timeout)
    
    // Response listener
    const listener = (response: any) => {
      if (response.listenerId === listenerId) {
        clearTimeout(timeoutId)
        window.api.removeListener(MAIN, listener)
        resolve(response.data)
      }
    }
    
    // Register listener
    window.api.receive(MAIN, listener)
    
    // Send request
    window.api.send(MAIN, { 
      channel, 
      data, 
      listenerId 
    })
  })
}

// Listen for messages from main
export function receiveMain(channel: Main, callback: Function) {
  window.api.receive(MAIN, (msg: any) => {
    if (msg.channel === channel) {
      callback(msg.data)
    }
  })
}
```

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
  
  // Files
  IMPORT = "IMPORT",
  IMPORT_FILES = "IMPORT_FILES",
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
  OS = "OS",
  IP = "IP",
  DEVICE_ID = "DEVICE_ID",
  RAM = "RAM",
  
  // Media
  GET_THUMBNAIL = "GET_THUMBNAIL",
  CHECK_RAM_USAGE = "CHECK_RAM_USAGE",
  SUBTITLE = "SUBTITLE",
  
  // Audio
  AUDIO_MAIN = "AUDIO_MAIN",
  VISUALIZER_DATA = "VISUALIZER_DATA",
  BUFFER = "BUFFER",
  
  // Network
  SEND_SOCKET_MESSAGE = "SEND_SOCKET_MESSAGE",
  LAG = "LAG",
  
  // ... 60+ total channels
}
```

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

Location: `src/electron/servers.ts`

```typescript
import express from "express"
import { Server as SocketIOServer } from "socket.io"
import http from "http"

// Server configurations
const SERVERS = {
  REMOTE: { port: 5510, path: "build/remote" },
  STAGE: { port: 5511, path: "build/stage" },
  CONTROLLER: { port: 5512, path: "build/controller" },
  OUTPUT_STREAM: { port: 5513, path: "build/output_stream" }
}

// Storage for server instances
const ioServers: { [key: string]: SocketIOServer } = {}
const connections: { [key: string]: any } = {}

// Create server
export function createServer(
  serverName: string, 
  port: number, 
  staticPath: string
) {
  // Express app
  const app = express()
  
  // Serve static files
  app.use(express.static(staticPath))
  
  // HTTP server
  const httpServer = http.createServer(app)
  
  // Socket.io server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 1e8 // 100 MB
  })
  
  // Store instance
  ioServers[serverName] = io
  
  // Connection handling
  io.on("connection", (socket) => {
    console.log(`${serverName} client connected: ${socket.id}`)
    
    // Track connection
    connections[socket.id] = {
      server: serverName,
      connected: Date.now()
    }
    
    // Handle messages from client
    socket.on(serverName, (msg) => {
      console.log(`${serverName} received:`, msg)
      
      // Forward to desktop app via IPC
      toApp(serverName, msg, socket.id)
    })
    
    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`${serverName} client disconnected: ${socket.id}`)
      delete connections[socket.id]
    })
  })
  
  // Start server
  httpServer.listen(port, () => {
    console.log(`${serverName} server listening on port ${port}`)
  })
}

// Forward message to desktop app
function toApp(serverName: string, msg: any, socketId: string) {
  // Get main window
  const mainWindow = getMainWindow()
  
  if (mainWindow) {
    // Send via IPC
    mainWindow.webContents.send("FROM_SERVER", {
      server: serverName,
      message: msg,
      socketId
    })
  }
}

// Send message to all clients
export function sendToClients(serverName: string, channel: string, data: any) {
  const io = ioServers[serverName]
  
  if (io) {
    io.emit(channel, data)
  }
}
```

### Client Connection (Browser)

Location: `src/server/stage/util/socket.ts`

```typescript
import io from "socket.io-client"

export let socket = io({
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
})

// Listen for stage updates
socket.on("STAGE", (msg) => {
  console.log("Stage message received:", msg)
  
  const { channel, data } = msg
  
  switch (channel) {
    case "BACKGROUND":
      updateBackground(data)
      break
    case "SLIDE":
      updateSlide(data)
      break
    case "OVERLAY":
      updateOverlay(data)
      break
  }
})

// Send message to desktop app
export function send(channel: string, data: any) {
  socket.emit("STAGE", { channel, data })
}
```

### Frontend Socket Helper

Location: `src/frontend/utils/stageTalk.ts`

```typescript
import { sendMain } from "../IPC/main"
import { Main } from "../../types/IPC/Main"

// Send message to STAGE clients
export function send(channel: string, data: any) {
  sendMain(Main.SEND_SOCKET_MESSAGE, {
    server: "STAGE",
    channel,
    data
  })
}

// Send background to stage
export function sendBackgroundToStage(output: Output) {
  const { background, mediaStyle } = output
  
  send("BACKGROUND", {
    path: background,
    mediaStyle,
    timestamp: Date.now()
  })
}

// Send slide to stage
export function sendSlideToStage(slide: Slide) {
  const { id, items, color, settings } = slide
  
  send("SLIDE", {
    id,
    items: items.map(item => ({
      type: item.type,
      text: item.text,
      style: item.style
    })),
    color,
    settings
  })
}
```

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
<!-- src/server/remote/components/Controls.svelte -->
<script lang="ts">
  import { socket } from "../util/socket"
  
  function next() {
    socket.emit("REMOTE", {
      channel: "NEXT_SLIDE",
      data: {}
    })
  }
</script>

<button on:click={next}>Next</button>
```

**Desktop App:**
```svelte
<!-- src/frontend/App.svelte -->
<script lang="ts">
  import { receiveMain } from "./IPC/main"
  
  receiveMain("FROM_SERVER", (msg) => {
    if (msg.server === "REMOTE" && msg.message.channel === "NEXT_SLIDE") {
      goToNextSlide()
    }
  })
  
  function goToNextSlide() {
    // Update activeShow store
    // Send update to STAGE
  }
</script>
```

---

## Svelte Store Communication

Svelte stores provide reactive state management within the frontend application.

### Store Architecture

Location: `src/frontend/stores.ts`

```typescript
import { writable } from "svelte/store"

// UI State
export const activePage = writable<string>("show")
export const activePopup = writable<string | null>(null)
export const focusMode = writable<boolean>(false)

// Show Data
export const activeShow = writable<ActiveShow | null>(null)
export const showsCache = writable<{ [key: string]: Show }>({})
export const projects = writable<Project[]>([])

// Display State
export const outputs = writable<{ [key: string]: Output }>({})
export const themes = writable<Theme[]>([])

// Network
export const connections = writable<{
  REMOTE: Connection[]
  STAGE: Connection[]
  CONTROLLER: Connection[]
  OUTPUT_STREAM: Connection[]
}>({
  REMOTE: [],
  STAGE: [],
  CONTROLLER: [],
  OUTPUT_STREAM: []
})
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

```typescript
// src/frontend/stores.ts

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
│      channel: "NEXT_SLIDE"              │
│    })                                   │
└────────────────┬────────────────────────┘
                 │ WebSocket
┌────────────────▼────────────────────────┐
│ 2. Electron Main Process                │
│    servers.ts receives message          │
│    ↓                                    │
│    toApp("REMOTE", msg)                 │
│    ↓                                    │
│    IPC → Renderer                       │
└────────────────┬────────────────────────┘
                 │ IPC
┌────────────────▼────────────────────────┐
│ 3. Frontend (Renderer)                  │
│    receiveMain("FROM_SERVER", msg)      │
│    ↓                                    │
│    handleNextSlide()                    │
│    ↓                                    │
│    activeShow.update(incrementIndex)    │
└────────────────┬────────────────────────┘
                 │ Reactive
┌────────────────▼────────────────────────┐
│ 4. Reactive Statement                   │
│    $: if ($activeShow changed)          │
│       sendSlideToStage()                │
│    ↓                                    │
│    stageTalk.send("SLIDE", ...)         │
└────────────────┬────────────────────────┘
                 │ IPC + Socket.io
┌────────────────▼────────────────────────┐
│ 5. Stage Display (Browser)              │
│    socket.on("STAGE", ...)              │
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
