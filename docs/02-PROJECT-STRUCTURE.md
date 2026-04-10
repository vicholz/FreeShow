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
│   ├── electron/           # Compiled Electron code
│   ├── remote/             # Compiled Remote server
│   ├── stage/              # Compiled Stage server
│   └── controller/         # Compiled Controller server
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
├── tests/                  # Automated tests
├── node_modules/           # Dependencies (generated)
├── package.json            # Project metadata and scripts
├── vite.config.mjs         # Vite configuration
└── svelte.config.mjs       # Svelte configuration
```

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

| Directory | Files | Lines of Code | Purpose |
|-----------|-------|---------------|---------|
| `src/frontend/` | ~500 | ~60,000 | UI components and logic |
| `src/electron/` | ~100 | ~20,000 | Backend and system integration |
| `src/server/` | ~80 | ~8,000 | Web server applications |
| `src/types/` | ~30 | ~25,000 | Type definitions |

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
│   ├── main/               # Core UI elements
│   ├── show/               # Show management
│   ├── edit/               # Slide editing
│   ├── slide/              # Slide rendering
│   ├── drawer/             # Side panels
│   ├── output/             # Output controls
│   ├── stage/              # Stage layouts
│   ├── timeline/           # Animation timeline
│   ├── settings/           # Settings interface
│   ├── helpers/            # Utility components
│   ├── context/            # Context menus
│   ├── input/              # Form inputs
│   └── system/             # Layout components
│
├── audio/                  # 🎵 Audio system
│   ├── audioPlayer.ts
│   ├── audioAnalyser.ts
│   ├── audioEqualizer.ts
│   ├── audioPlaylist.ts
│   └── ...
│
├── converters/             # 🔄 Import converters
│   ├── powerpoint.ts
│   ├── pdf.ts
│   ├── easyworship.ts
│   ├── opensong.ts
│   └── ...
│
├── values/                 # 📊 Constants
│   ├── icons.ts
│   ├── keys.ts
│   ├── extensions.ts
│   └── ...
│
├── utils/                  # 🛠️  Helper functions
│   ├── stageTalk.ts        # Stage communication
│   ├── remoteTalk.ts       # Remote communication
│   ├── SocketHelper.ts     # Socket utilities
│   └── ...
│
├── classes/                # 🏗️  Reusable classes
├── show/                   # 📄 Show data utilities
├── media/                  # 🎬 Media handling
├── IPC/                    # 📡 IPC communication
│   └── main.ts             # IPC helper functions
│
└── styles/                 # 🎨 Global styles
    └── ...
```

### Key Frontend Files

| File | Purpose | Lines |
|------|---------|-------|
| `main.ts` | Entry point, creates Svelte app | 50 |
| `App.svelte` | Root component, app initialization | 300 |
| `MainLayout.svelte` | Three-column layout | 800 |
| `stores.ts` | Global state management | 1,500 |
| `components/main/MenuBar.svelte` | Top menu bar | 500 |
| `components/show/Shows.svelte` | Show list | 400 |
| `components/edit/EditValues.svelte` | Slide editor | 1,000 |

### Component Organization by Feature

**Show Management:**
```
components/show/
├── Projects.svelte         # Project list and creation
├── Shows.svelte            # Show grid/list view
├── Show.svelte             # Individual show card
├── ShowDrawers.svelte      # Show-specific drawers
└── CreateShow.svelte       # Show creation wizard
```

**Slide Editing:**
```
components/edit/
├── EditValues.svelte       # Main editor
├── Items.svelte            # Slide items list
├── Navigation.svelte       # Slide navigation tree
└── SlideEditor.svelte      # Slide content editor
```

**Drawer Panels:**
```
components/drawer/
├── Drawer.svelte           # Drawer container
├── Bible.svelte            # Bible search
├── Audio.svelte            # Audio player
├── Calendar.svelte         # Calendar events
├── Live.svelte             # Live streaming
├── Media.svelte            # Media browser
├── Effects.svelte          # Visual effects
└── ...
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
│   ├── config.ts           # Configuration management
│   └── bonjour.ts          # mDNS advertising
│
├── cloud/                  # ☁️  Cloud Sync
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
├── contentProviders/       # 🔌 External APIs
│   ├── Bible.ts            # Bible API integration
│   ├── Lyrics.ts           # Lyrics search
│   └── ...
│
└── utils/                  # 🛠️  Utilities
    ├── windowOptions.ts    # Window configuration
    ├── initialization.ts   # App startup
    └── menuTemplates.ts    # Application menus
```

### Key Electron Files

| File | Purpose | Lines |
|------|---------|-------|
| `index.ts` | App lifecycle, window creation | 600 |
| `preload.ts` | Context bridge API | 200 |
| `servers.ts` | Socket.io servers | 400 |
| `IPC/responsesMain.ts` | IPC handlers | 900 |
| `output/OutputHelper.ts` | Output windows | 500 |

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
    ├── messages.ts         # Message type definitions
    ├── helpers.ts          # Common helper functions
    └── ...
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
│   ├── Main.ts             # Main channel enum (60+ channels)
│   ├── ToMain.ts           # Frontend → Electron types
│   └── FromMain.ts         # Electron → Frontend types
│
├── Channels.ts             # Channel names (MAIN, REMOTE, STAGE, etc.)
├── Socket.ts               # Socket.io message types
├── Show.ts                 # Show/Slide types (16,000 lines!)
├── Main.ts                 # Main app types (8,000 lines)
├── Output.ts               # Output window types
├── Settings.ts             # Settings types
├── Stage.ts                # Stage layout types
├── Media.ts                # Media types
├── Project.ts              # Project types
├── Overlay.ts              # Overlay types
├── Template.ts             # Template types
├── Theme.ts                # Theme types
├── Audio.ts                # Audio types
├── Calendar.ts             # Calendar types
├── Connection.ts           # Connection types
└── ...
```

### Key Type Files

**Show.ts** (Most Complex):
```typescript
export interface Show {
  id: string
  name: string
  category: string
  timestamps: {
    created: number
    modified: number
    used: number
  }
  settings: ShowSettings
  slides: Slide[]
  layouts: Layouts
  media: MediaShow
  meta: MetaData
}

export interface Slide {
  id: string
  group: string
  color: string
  settings: SlideSettings
  notes: string
  items: Item[]
  // ... 50+ more properties
}

// ... 100+ more interfaces
```

**Main.ts** (IPC Channels):
```typescript
export enum Main {
  // Storage
  SHOWS = "SHOWS",
  PROJECTS = "PROJECTS",
  SETTINGS = "SETTINGS",
  
  // Files
  IMPORT = "IMPORT",
  SAVE = "SAVE",
  DELETE = "DELETE",
  
  // Window
  CLOSE = "CLOSE",
  MAXIMIZE = "MAXIMIZE",
  
  // ... 60+ channels
}
```

---

## Configuration Files

### TypeScript Configs

```
config/typescript/
├── tsconfig.electron.json       # Electron main process
├── tsconfig.electron.prod.json  # Production build
├── tsconfig.svelte.json         # Svelte components
└── tsconfig.server.json         # Server apps
```

### Build Configs

```
config/building/
├── electron-builder.yaml        # Electron packaging
├── electron-builder-lnxarm.yaml # ARM Linux build
└── electron-replace-lnxarm.js   # ARM-specific patches
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
2. Look in `src/frontend/components/drawer/Bible.svelte`
3. Check related utilities in `src/frontend/utils/`

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
- `src/frontend/styles/`

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
