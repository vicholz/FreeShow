# FreeShow Project Structure

A comprehensive guide to navigating the FreeShow codebase.

## Table of Contents
- [Directory Overview](#directory-overview)
- [Source Code Structure](#source-code-structure)
- [Frontend Organization](#frontend-organization)
- [Electron Organization](#electron-organization)
- [Server Organization](#server-organization)
- [Configuration Files](#configuration-files)
- [Navigation Tips](#navigation-tips)

---

## Directory Overview

```
FreeShow/
├── src/                    # Source code
│   ├── frontend/           # Svelte UI (renderer process)
│   ├── electron/           # Electron main process
│   ├── server/             # Web server apps (Remote, Stage, etc.)
│   └── types/              # TypeScript type definitions
│
├── public/                 # Static assets
│   ├── index.html          # Main app HTML
│   ├── loading.html        # Loading screen
│   └── build/              # Built frontend assets (generated)
│
├── build/                  # Compiled code (generated)
│   └── electron/           # Compiled Electron code
│       ├── remote/         # Compiled Remote server
│       ├── stage/          # Compiled Stage server
│       ├── controller/     # Compiled Controller server
│       └── output_stream/  # Compiled Output Stream server
│
├── dist/                   # Packaged applications (generated)
│   ├── win-unpacked/       # Windows build
│   ├── mac/                # macOS build
│   └── linux-unpacked/     # Linux build
│
├── config/                 # Configuration files
│   ├── typescript/         # TypeScript configs
│   ├── building/           # Build configs (Vite, electron-builder)
│   ├── linting/            # ESLint, Stylelint configs
│   ├── formatting/         # Prettier config
│   └── testing/            # Playwright config
│
├── scripts/                # Build and development scripts
│   ├── start.js            # Development startup
│   ├── preBuild.js         # Pre-build setup
│   ├── postBuild.js        # Post-build cleanup
│   └── vite/               # Vite-related scripts
│
├── docs/                   # Documentation (this folder!)
├── node_modules/           # Dependencies (generated)
├── package.json            # Project metadata and scripts
├── vite.config.mjs         # Vite configuration (frontend)
└── svelte.config.mjs       # Svelte configuration
```

📝 Automated tests live in `config/testing/` (Playwright config + `start.test.ts`), not a top-level `tests/` folder.

---

## Source Code Structure

### High-Level Organization

```
src/
├── frontend/          # 📱 User Interface (Renderer Process)
├── electron/          # 🖥️  Main Process (Node.js)
├── server/            # 🌐 Web Server Apps
└── types/             # 📝 TypeScript Definitions
```

### File Count Reference

| Directory | Files | Purpose |
|-----------|-------|---------|
| `src/frontend/` | ~590 | UI components and logic |
| `src/electron/` | ~95 | Backend and system integration |
| `src/server/` | ~140 | Web server applications |
| `src/types/` | ~21 | Type definitions |

---

## Frontend Organization

Location: `src/frontend/`

### Structure

```
frontend/
├── main.ts                 # 🚀 Entry point - creates Svelte app
├── App.svelte              # 🏠 Root component
├── MainLayout.svelte       # 📐 Main UI layout
├── MainOutput.svelte       # 🖼️  Output window rendering
├── stores.ts               # 🗄️  Global state (100+ stores)
│
├── components/             # 🧩 UI Components
│   ├── main/               # Core UI elements (MenuBar, Popup, Tabs, ...)
│   ├── show/               # Show & project management
│   ├── edit/               # Slide editing
│   ├── slide/              # Slide rendering
│   ├── drawer/             # Bottom drawer (bible/, audio/, media/, calendar/, live/, ... subfolders)
│   ├── output/             # Output rendering & controls
│   ├── stage/              # Stage layouts
│   ├── timeline/           # Animation timeline
│   ├── settings/           # Settings interface
│   ├── actions/            # Actions & API triggers
│   ├── helpers/            # Utility modules (output.ts, media.ts, history, ...)
│   ├── context/            # Context menus
│   ├── input/ + inputs/    # Form inputs
│   ├── quicksearch/        # Quick search
│   ├── export/, guide/, draw/, media/, system/  # More feature areas
│
├── audio/                  # 🎵 Audio system
│   ├── audioPlayer.ts
│   ├── audioAnalyser.ts
│   ├── audioAnalyserMerger.ts
│   ├── audioEqualizer.ts
│   ├── audioPlaylist.ts
│   ├── audioFading.ts
│   └── ...
│
├── converters/             # 🔄 Import converters
│   ├── powerpoint/         # (folder)
│   ├── easyworship.ts
│   ├── opensong.ts
│   ├── propresenter.ts
│   ├── openlp.ts, quelea.ts, songbeamer.ts, chordpro.ts, ...
│
├── values/                 # 📊 Constants
│   ├── icons.ts
│   ├── keys.ts
│   ├── extensions.ts
│   └── ...
│
├── utils/                  # 🛠️  Helper functions
│   ├── stageTalk.ts        # STAGE server message handlers
│   ├── remoteTalk.ts       # REMOTE server message handlers
│   ├── controllerTalk.ts   # CONTROLLER server message handlers
│   ├── sendData.ts         # Client message routing
│   ├── receivers.ts        # IPC receive handlers
│   ├── listeners.ts        # Store subscriptions → broadcasts
│   ├── request.ts          # send/receive helpers
│   ├── SocketHelper.ts     # Socket utilities
│   └── ...
│
├── classes/                # 🏗️  Reusable classes
├── show/                   # 📄 Show data utilities
├── media/                  # 🎬 Media handling
└── IPC/                    # 📡 IPC communication
    ├── main.ts             # Typed request/receive helpers
    └── responsesMain.ts    # Frontend-side IPC handlers
```

📝 There is no global `styles/` folder — styling is scoped inside each `.svelte` component, with app-level styles in `App.svelte` and `public/`.

### Key Frontend Files

| File | Purpose |
|------|---------|
| `main.ts` | Entry point, creates the Svelte app |
| `App.svelte` | Root component, error reporting, window switching |
| `MainLayout.svelte` | Main UI layout (panels + drawer) |
| `MainOutput.svelte` | Root component for output windows |
| `stores.ts` | Global state management (100+ writable stores) |
| `components/main/MenuBar.svelte` | Top menu bar |
| `components/show/Slides.svelte` | Slide grid for the active show |
| `utils/receivers.ts` | Handlers for messages arriving from the main process |
| `utils/listeners.ts` | Store subscriptions that broadcast state to outputs/servers |

### Component Organization by Feature

**Show & Project Management:**
```
components/show/
├── Projects.svelte         # Project list panel
├── ProjectList.svelte      # Projects tree
├── Show.svelte             # Active show view
├── Slides.svelte           # Slide grid
├── ShowTools.svelte        # Tools under the slide grid (notes, media, metadata)
└── Section.svelte          # Project sections
```

**Slide Editing:**
```
components/edit/
├── Editor.svelte           # Main editor area
├── Navigation.svelte       # Slide navigation
├── EditTools.svelte        # Right-hand edit tools
├── MediaTools.svelte       # Media item tools
├── editbox/                # The editable slide item box
├── scripts/                # Edit logic (autosize, text style, ...)
└── values/                 # Editor input definitions (boxes.ts, ...)
```

**Drawer Panels:**
```
components/drawer/
├── Drawer.svelte           # Drawer container
├── Content.svelte          # Tab content switcher
├── Navigation.svelte       # Drawer category navigation
├── bible/                  # Scripture search & display (Scripture.svelte, ...)
├── audio/                  # Audio player, playlists, metronome, effects
├── media/                  # Media browser
├── calendar/               # Calendar events
├── live/                   # Cameras, screens, NDI inputs
├── effects/                # Visual effects
├── pages/                  # Shows list, search
└── timers/, player/, info/, navigation/
```

---

## Electron Organization

Location: `src/electron/`

### Structure

```
electron/
├── index.ts                # 🚀 Main entry point
├── preload.ts              # 🔒 Security bridge
├── servers.ts              # 🌐 Socket.io server setup
│
├── IPC/                    # 📡 IPC Handlers
│   ├── main.ts             # IPC message routing
│   └── responsesMain.ts    # Handler implementations (~900 lines)
│
├── output/                 # 🖼️  Output Windows
│   ├── OutputHelper.ts     # Window lifecycle management
│   └── ...
│
├── audio/                  # 🎵 Audio I/O
│   ├── receiveAudio.ts
│   └── ...
│
├── capture/                # 📹 Screen Capture
│   ├── CaptureHelper.ts
│   └── ...
│
├── data/                   # 💾 Storage & Config
│   ├── store.ts            # electron-store setup
│   ├── defaults.ts         # Default store contents
│   ├── save.ts             # Saving app data to disk
│   ├── backup.ts           # Backups
│   ├── import.ts / export.ts  # File import/export
│   ├── thumbnails.ts       # Media thumbnail generation
│   ├── downloadMedia.ts    # Media downloads
│   └── bonjour.ts          # mDNS advertising
│
├── cloud/                  # ☁️  Cloud Sync (Google Drive + team sync)
│   └── ...
│
├── ndi/                    # 📡 NDI Support
│   └── ...
│
├── blackmagic/             # 🎥 Blackmagic Hardware
│   └── ...
│
├── timecode/               # ⏱️  Timecode (MTC, LTC)
│   └── ...
│
├── contentProviders/       # 🔌 External content APIs
│   ├── ContentProviderRegistry.ts
│   ├── churchApps/, planningCenter/, canva/, amazingLife/
│   └── base/               # Shared provider types
│
└── utils/                  # 🛠️  Utilities
    ├── windowOptions.ts    # Window configuration
    ├── init.ts             # App startup helpers
    ├── menuTemplate.ts     # Application menu
    ├── files.ts            # File system helpers (large)
    ├── api.ts              # External API (WebSocket/REST) triggers
    ├── midi.ts             # MIDI input/output
    └── shows.ts, keys.ts, updater.ts, spellcheck.ts, ...
```

### Key Electron Files

| File | Purpose |
|------|---------|
| `index.ts` | App lifecycle, main window creation |
| `preload.ts` | Context bridge API (`window.api`) |
| `servers.ts` | Express + Socket.io servers (REMOTE/STAGE/CONTROLLER/OUTPUT_STREAM) |
| `IPC/responsesMain.ts` | Map of `Main.*` channels → handler functions |
| `output/OutputHelper.ts` | Output window facade (helpers in `output/helpers/`) |
| `utils/files.ts` | File I/O, media lookup, folder scanning |

### IPC Handler Organization

```
IPC/responsesMain.ts
├── Storage handlers         # SHOWS, PROJECTS, SETTINGS, etc.
├── File handlers            # IMPORT, SAVE, DELETE, etc.
├── Window handlers          # CLOSE, MAXIMIZE, MINIMIZE, etc.
├── Media handlers           # THUMBNAIL, RAM_USAGE, etc.
├── System handlers          # VERSION, OS, IP, etc.
├── Audio handlers           # AUDIO_MAIN, VISUALIZER_DATA, etc.
└── Network handlers         # SEND_SOCKET_MESSAGE, etc.
```

---

## Server Organization

Location: `src/server/`

### Structure

```
server/
├── remote/                 # 📱 Remote Control (Port 5510)
│   ├── main.ts             # Entry point
│   ├── App.svelte          # Root component
│   ├── util/
│   │   └── socket.ts       # Socket.io client
│   └── components/
│       ├── Main.svelte
│       ├── Shows.svelte
│       ├── Controls.svelte
│       └── ...
│
├── stage/                  # 🎭 Stage Display (Port 5511)
│   ├── main.ts
│   ├── App.svelte
│   ├── util/
│   │   └── socket.ts
│   └── components/
│       ├── Output.svelte
│       ├── Slide.svelte
│       ├── Background.svelte
│       └── ...
│
├── controller/             # 🎛️  Controller (Port 5512)
│   ├── main.ts
│   ├── App.svelte
│   ├── util/
│   │   └── socket.ts
│   └── components/
│       └── ...
│
├── output_stream/          # 📹 Output Stream (Port 5513)
│   ├── main.ts
│   ├── App.svelte
│   ├── util/
│   │   └── socket.ts
│   └── components/
│       └── ...
│
└── common/                 # 🔗 Shared Utilities
    ├── components/         # Shared Svelte components
    └── util/               # helpers.ts, media.ts, show.ts, style.ts, ...
```

### Server Communication Pattern

Each server follows the same pattern:

```typescript
// main.ts - Entry point
import App from './App.svelte'

const app = new App({
  target: document.body,
  props: {}
})

// App.svelte - Root component
<script lang="ts">
  import { onMount } from 'svelte'
  import { connectSocket } from './util/socket'
  
  onMount(() => {
    connectSocket()
  })
</script>

// util/socket.ts - Socket connection
import io from 'socket.io-client'

export let socket = io()

socket.on('STAGE', (msg) => {
  // Handle messages
})
```

---

## Type Definitions

Location: `src/types/`

### Structure

```
types/
├── IPC/                    # IPC Message Types
│   ├── Main.ts             # Main channel enum (~129 channels) + typed payloads
│   └── ToMain.ts           # Electron → Frontend push channels + payloads
│
├── Channels.ts             # Channel names (MAIN, OUTPUT, REMOTE, STAGE, etc.)
├── Socket.ts               # Socket.io message types
├── Show.ts                 # Show/Slide/Item/Layout types (the core data model)
├── Main.ts                 # Misc app types
├── Output.ts               # Output window types
├── Settings.ts             # Settings & theme types
├── Stage.ts                # Stage layout types
├── Projects.ts             # Project types
├── Audio.ts                # Audio types
├── Calendar.ts             # Calendar types
├── Bible.ts / Scripture.ts # Scripture types
├── Draw.ts, Effects.ts, History.ts, Input.ts, Save.ts, Tabs.ts, Songbeamer.ts
```

### Key Type Files

**Show.ts** (Most Important — the core data model):
```typescript
export interface Show {
    name: string
    category: null | ID
    settings: {
        activeLayout: ID
        template: null | ID
    }
    timestamps: { created: number; modified: null | number; used: null | number }
    meta: { title?: string; artist?: string; CCLI?: string; ... }
    slides: { [key: ID]: Slide }      // slides are a map, not an array
    layouts: { [key: ID]: Layout }    // layouts order slides by reference
    media: { [key: ID]: Media }
}

export interface Slide {
    group: null | string        // null = child slide
    color: null | string
    settings: { template?: string; color?: string; resolution?: Resolution }
    notes: string
    items: Item[]               // text boxes, media, timers, ...
    children?: string[]         // child slide ids
}

// ... many more interfaces (Item, Layout, SlideData, Transition, ...)
```

**IPC/Main.ts** (IPC Channels):
```typescript
export enum Main {
    LOG = "LOG",
    VERSION = "VERSION",
    IS_DEV = "IS_DEV",
    SETTINGS = "SETTINGS",
    SYNCED_SETTINGS = "SYNCED_SETTINGS",
    SHOWS = "SHOWS",
    SAVE = "SAVE",
    IMPORT = "IMPORT",
    CLOSE = "CLOSE",
    MAXIMIZE = "MAXIMIZE",
    // ... ~129 channels, each with typed send/return payloads
}
```

---

## Configuration Files

### TypeScript Configs

```
config/typescript/
├── tsconfig.electron.json       # Electron main process
├── tsconfig.svelte.json         # Svelte components
└── tsconfig.server.json         # Server apps
```

📝 `tsconfig.*.prod.json` variants are **generated** by `scripts/preBuild.js` during `npm run build` and removed again by `scripts/postBuild.js`.

### Build Configs

```
config/building/
├── electron-builder.yaml        # Electron packaging (Win/Mac/Linux targets)
├── electron-builder-lnxarm.yaml # ARM Linux build
├── electron-replace-lnxarm.js   # ARM-specific patches
├── vite.config.servers.mjs      # Vite config for the four server apps
├── rollup.config.mjs            # Legacy Rollup config (servers)
└── snapcraft.yaml               # Snap package config
```

### Linting Configs

```
config/linting/
├── eslint.electron.json         # Electron code
├── eslint.frontend.json         # Frontend code
├── eslint.svelte.js             # Svelte components
└── .stylelintrc.json            # CSS/SCSS linting
```

### Vite Config

```javascript
// vite.config.mjs
export default {
  plugins: [
    svelte({
      preprocess: sveltePreprocess()
    })
  ],
  build: {
    outDir: 'public/build',
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'bundle.js',
        assetFileNames: 'bundle.css'
      }
    }
  }
}
```

---

## Navigation Tips

### Finding Components

**By Feature:**
1. Identify the feature (e.g., "Bible search")
2. Look in `src/frontend/components/drawer/bible/Scripture.svelte`
3. Check related utilities in `src/frontend/utils/` and `components/helpers/`

**By UI Location:**
- Top menu → `components/main/MenuBar.svelte`
- Left panel → Check `activePage` in `MainLayout.svelte`
- Center area → `components/show/`, `components/edit/`
- Right panel → `components/output/`

### Finding IPC Handlers

1. Search for the channel name (e.g., `Main.SHOWS`)
2. Look in `src/electron/IPC/responsesMain.ts`
3. Find the handler: `mainResponses[Main.SHOWS] = ...`

### Finding Socket Messages

1. Identify the server (REMOTE, STAGE, etc.)
2. Look for `send()` calls in frontend (e.g., `stageTalk.ts`)
3. Check server's `socket.ts` for handlers

### Finding Types

1. Start with the main type (e.g., `Show`)
2. Look in `src/types/Show.ts`
3. Follow imports for related types

### Finding Styles

**Component Styles:**
```svelte
<style lang="scss">
  // Scoped to this component
</style>
```

**Global Styles:**
- App-level styles live in `App.svelte` (`:global(...)` rules) and `public/index.html`

### Finding Constants

```
src/frontend/values/
├── icons.ts         # Icon names and SVGs
├── keys.ts          # Keyboard shortcuts
├── extensions.ts    # Supported file types
├── autosave.ts      # Autosave intervals
└── ...
```

---

## Common File Patterns

### Component Files
```
MyComponent.svelte           # Main component
MyComponentHelper.svelte     # Helper sub-component
myComponent.ts               # Logic/utilities
myComponent.scss             # Styles (if separate)
```

### Module Files
```
index.ts                     # Module entry point
types.ts                     # Module-specific types
utils.ts                     # Helper functions
constants.ts                 # Constants
```

---

## File Naming Conventions

### Svelte Components
- **PascalCase:** `ShowList.svelte`, `MenuBar.svelte`
- **Descriptive:** Name describes what it does/shows

### TypeScript Files
- **camelCase:** `audioPlayer.ts`, `stageTalk.ts`
- **Descriptive:** Name describes purpose

### Type Files
- **PascalCase:** `Show.ts`, `Settings.ts`
- **Singular:** One main type per file

### Directories
- **lowercase:** `components/`, `utils/`, `audio/`
- **Descriptive:** Groups related functionality

---

## Code Size Reference

### By Feature (Approximate)

| Feature | Components | Lines | Complexity |
|---------|-----------|-------|------------|
| Show Management | 20 | 8,000 | Medium |
| Slide Editing | 30 | 12,000 | High |
| Stage Display | 15 | 5,000 | Medium |
| Output Management | 10 | 4,000 | Medium |
| Audio System | 12 | 6,000 | High |
| Settings | 25 | 8,000 | Low |
| Converters | 15 | 10,000 | High |

---

## Next Steps

Now that you understand the project structure:

1. **[Quick Start Guide](03-QUICK-START.md)** - Run the app locally
2. **[Communication Patterns](04-COMMUNICATION.md)** - Understand data flow
3. **[Svelte Guide](05-SVELTE-GUIDE.md)** - Learn Svelte specifics

---

[← Back to Architecture](01-ARCHITECTURE.md) | [Back to Index](00-INDEX.md) | [Next: Quick Start →](03-QUICK-START.md)
